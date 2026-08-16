/**
 * Creates a Demo Mode account for the Al Ahly chairman presentation.
 * This script:
 * 1. Creates a demo admin user in the database
 * 2. Generates a valid JWT session token for that user
 * 3. Outputs the token and a demo login URL
 */
import mysql from 'mysql2/promise';
import { SignJWT } from 'jose';
import 'dotenv/config';

const DEMO_USERS = [
  {
    openId: 'demo_chairman_alahly_2026',
    name: 'Chairman Demo Account',
    email: 'demo@alahly-academy.com',
    role: 'admin',
    loginMethod: 'demo',
  },
  {
    openId: 'demo_coach_alahly_2026',
    name: 'Coach Demo Account',
    email: 'coach-demo@alahly-academy.com',
    role: 'coach',
    loginMethod: 'demo',
  },
  {
    openId: 'demo_parent_alahly_2026',
    name: 'Parent Demo Account',
    email: 'parent-demo@alahly-academy.com',
    role: 'parent',
    loginMethod: 'demo',
  },
];

async function createDemoAccounts() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const jwtSecret = process.env.JWT_SECRET;
  const appId = process.env.VITE_APP_ID;

  if (!jwtSecret || !appId) {
    console.error('❌ Missing JWT_SECRET or VITE_APP_ID in environment');
    process.exit(1);
  }

  const secretKey = new TextEncoder().encode(jwtSecret);

  console.log('\n🔴 Al Ahly Academy — Demo Account Setup\n');
  console.log('='.repeat(60));

  for (const user of DEMO_USERS) {
    try {
      // Upsert user in database
      await conn.execute(`
        INSERT INTO users (openId, name, email, loginMethod, role, accountStatus, onboardingCompleted, createdAt, updatedAt, lastSignedIn)
        VALUES (?, ?, ?, ?, ?, 'approved', 1, NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email),
          role = VALUES(role),
          accountStatus = 'approved',
          onboardingCompleted = 1,
          lastSignedIn = NOW()
      `, [user.openId, user.name, user.email, user.loginMethod, user.role]);

      // Generate JWT session token
      const issuedAt = Date.now();
      const expiresInMs = 365 * 24 * 60 * 60 * 1000; // 1 year
      const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

      const token = await new SignJWT({
        openId: user.openId,
        appId: appId,
        name: user.name,
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(expirationSeconds)
        .sign(secretKey);

      console.log(`\n✅ ${user.role.toUpperCase()} DEMO ACCOUNT`);
      console.log(`   Name:  ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role:  ${user.role}`);
      console.log(`   Token: ${token.substring(0, 50)}...`);
      console.log(`\n   🔗 Demo Login URL (copy to browser):`);
      console.log(`   https://footyacad-wh9wgp4d.manus.space/api/demo-login?token=${encodeURIComponent(token)}&role=${user.role}`);

    } catch (err) {
      console.error(`❌ Failed to create ${user.role} demo account:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 PRESENTATION INSTRUCTIONS:');
  console.log('   1. Open the Admin Demo URL in your browser before the meeting');
  console.log('   2. The platform will log you in automatically as an admin');
  console.log('   3. All 30 players, 67 training sessions, and AI features are ready');
  console.log('   4. Use the Coach Demo URL to show the coach perspective');
  console.log('   5. Use the Parent Demo URL to show the parent portal view');
  console.log('\n⚠️  NOTE: These tokens are valid for 1 year from today.\n');

  await conn.end();
}

createDemoAccounts().catch(console.error);
