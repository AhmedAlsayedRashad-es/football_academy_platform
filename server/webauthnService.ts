import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { getDb } from './db';
import { sql } from 'drizzle-orm';

const RP_NAME = 'Future Stars Academy';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || `https://${RP_ID}`;

// In-memory challenge store (use Redis/DB for production multi-instance)
const challengeStore = new Map<number, string>();

export async function generatePasskeyRegistrationOptions(userId: number, username: string) {
  const db = (await getDb())!;

  // Get existing credentials for this user
  const existing = await db!.execute(
    sql`SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = ${userId}`
  ) as any;
  const rows = existing[0] as any[];

  const excludeCredentials = rows.map((row: any) => ({
    id: row.credential_id,
    transports: row.transports ? JSON.parse(row.transports) as AuthenticatorTransportFuture[] : undefined,
  }));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: username,
    userDisplayName: username,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform', // biometric only (Face ID, fingerprint)
    },
  });

  challengeStore.set(userId, options.challenge);
  return options;
}

export async function verifyPasskeyRegistration(
  userId: number,
  response: any
): Promise<{ verified: boolean; error?: string }> {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) return { verified: false, error: 'No challenge found. Please try again.' };

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });
  } catch (err: any) {
    return { verified: false, error: err.message };
  }

  challengeStore.delete(userId);

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false, error: 'Verification failed' };
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  const db = (await getDb())!;
  await db!.execute(
    sql`INSERT INTO webauthn_credentials 
        (user_id, credential_id, public_key, counter, device_type, backed_up, transports)
        VALUES (
          ${userId},
          ${credential.id},
          ${Buffer.from(credential.publicKey).toString('base64')},
          ${credential.counter},
          ${credentialDeviceType},
          ${credentialBackedUp ? 1 : 0},
          ${response.response?.transports ? JSON.stringify(response.response.transports) : null}
        )`
  );

  return { verified: true };
}

export async function generatePasskeyAuthenticationOptions(userId: number) {
  const db = (await getDb())!;
  const existing = await db!.execute(
    sql`SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = ${userId}`
  ) as any;
  const rows = existing[0] as any[];

  if (!rows.length) {
    throw new Error('No passkeys registered for this account');
  }

  const allowCredentials = rows.map((row: any) => ({
    id: row.credential_id,
    transports: row.transports ? JSON.parse(row.transports) as AuthenticatorTransportFuture[] : undefined,
  }));

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials,
    userVerification: 'preferred',
  });

  challengeStore.set(userId, options.challenge);
  return options;
}

export async function verifyPasskeyAuthentication(
  userId: number,
  response: any
): Promise<{ verified: boolean; error?: string }> {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) return { verified: false, error: 'No challenge found. Please try again.' };

  const db = (await getDb())!;
  const credRows = await db!.execute(
    sql`SELECT * FROM webauthn_credentials WHERE credential_id = ${response.id} AND user_id = ${userId}`
  ) as any;
  const credRow = (credRows[0] as any[])[0];

  if (!credRow) return { verified: false, error: 'Passkey not found for this account' };

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
      credential: {
        id: credRow.credential_id,
        publicKey: Buffer.from(credRow.public_key, 'base64'),
        counter: credRow.counter,
        transports: credRow.transports ? JSON.parse(credRow.transports) : undefined,
      },
    });
  } catch (err: any) {
    return { verified: false, error: err.message };
  }

  challengeStore.delete(userId);

  if (!verification.verified) return { verified: false, error: 'Authentication failed' };

  // Update counter
  await db!.execute(
    sql`UPDATE webauthn_credentials 
        SET counter = ${verification.authenticationInfo.newCounter}, last_used_at = NOW()
        WHERE credential_id = ${response.id}`
  );

  return { verified: true };
}
