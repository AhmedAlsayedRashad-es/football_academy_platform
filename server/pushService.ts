/**
 * Web Push Notification Service
 * Handles VAPID-based push notifications to subscribed browsers/PWA clients
 */
import webpush from 'web-push';
import { sql } from 'drizzle-orm';
import { getDb } from './db';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@academy.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(userId: number, subscription: PushSubscriptionData): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;

  // Use raw SQL to upsert into push_subscriptions table
  await db.execute(
    sql`INSERT INTO push_subscriptions (userId, endpoint, p256dh, auth, createdAt)
     VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, NOW())
     ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), updatedAt = NOW()`
  );
}

/**
 * Remove a push subscription (when user unsubscribes)
 */
export async function removePushSubscription(userId: number, endpoint: string): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.execute(
    sql`DELETE FROM push_subscriptions WHERE userId = ${userId} AND endpoint = ${endpoint}`
  );
}

/**
 * Send a push notification to a specific user (all their subscribed devices)
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping push notification');
    return;
  }

  const db = (await getDb())!;
  if (!db) return;

  const [rows] = await db.execute(
    sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE userId = ${userId}`
  ) as unknown as [any[]];

  if (!rows || rows.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payloadStr
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired — remove it
        await db.execute(
          sql`DELETE FROM push_subscriptions WHERE endpoint = ${row.endpoint}`
        );
      } else {
        console.warn('[Push] Failed to send notification:', err.message);
      }
    }
  }
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map(id => sendPushToUser(id, payload)));
}
