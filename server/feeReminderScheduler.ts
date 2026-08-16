/**
 * Fee Reminder Scheduler
 * Runs daily to check for overdue fees and send in-app notifications to parents.
 * player_fees schema: id, playerId, season, month, year, amount, dueDate, paidDate, status, paidAmount, notes, createdBy, createdAt, updatedAt
 * To find parents: join players → parent_players → users (where role='parent')
 */
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { sendWhatsAppMessage } from "./whatsappService";

async function sendOverdueFeeReminders() {
  try {
    const database = await getDb();
    if (!database) return;

    const today = new Date().toISOString().split('T')[0];

    // Update status to 'overdue' for all past-due pending fees
    await database.execute(
      sql`UPDATE player_fees SET status = 'overdue' WHERE status = 'pending' AND dueDate < ${today}`
    );

    // Find all overdue fees with player info
    const overdueResult = await database.execute(
      sql`SELECT pf.id as feeId, pf.playerId, pf.amount, pf.dueDate,
              p.firstName, p.lastName
       FROM player_fees pf
       JOIN players p ON p.id = pf.playerId
       WHERE pf.status = 'overdue'
         AND pf.dueDate IS NOT NULL`
    );

    // db.execute() is typed as [ResultSetHeader, FieldPacket[]], but a SELECT
    // returns the row array in slot 0.
    const overdueFees = (overdueResult[0] as unknown as any[]) || [];
    if (overdueFees.length === 0) {
      return;
    }

    // Find parents linked to these players via parent_player_relations table
    const playerIds = [...new Set(overdueFees.map((f: any) => f.playerId))];
    if (playerIds.length === 0) return;

    let parentLinks: any[] = [];
    try {
      const parentResult = await database.execute(
        sql`SELECT ppr.parentUserId as parentId, ppr.playerId, u.name as parentName,
                u.whatsappPhone, u.whatsappNotifications
         FROM parent_player_relations ppr
         JOIN users u ON u.id = ppr.parentUserId
         WHERE ppr.playerId IN (${sql.join(playerIds.map(id => sql`${id}`), sql`, `)})`
      );
      parentLinks = (parentResult[0] as unknown as any[]) || [];
    } catch {
      return;
    }

    // Group overdue fees by parent
    const parentMap = new Map<number, { parentName: string; whatsappPhone: string | null; whatsappNotifications: boolean; playerNames: Set<string>; totalAmount: number; feeCount: number }>();
    for (const link of parentLinks) {
      const playerFees = overdueFees.filter((f: any) => f.playerId === link.playerId);
      if (playerFees.length === 0) continue;
      if (!parentMap.has(link.parentId)) {
        parentMap.set(link.parentId, { parentName: link.parentName || 'Parent', whatsappPhone: link.whatsappPhone || null, whatsappNotifications: !!link.whatsappNotifications, playerNames: new Set(), totalAmount: 0, feeCount: 0 });
      }
      const entry = parentMap.get(link.parentId)!;
      for (const fee of playerFees) {
        entry.playerNames.add(`${fee.firstName} ${fee.lastName}`);
        entry.totalAmount += fee.amount || 0;
        entry.feeCount++;
      }
    }

    let notificationsSent = 0;
    let whatsappSent = 0;
    for (const [parentUserId, data] of parentMap.entries()) {
      const amountEGP = (data.totalAmount / 100).toFixed(2);
      const playerNames = [...data.playerNames].join(', ');
      const title = `Overdue Fee Reminder`;
      const body = `You have ${data.feeCount} overdue fee(s) totalling EGP ${amountEGP} for ${playerNames}. Please log in to the portal to settle your balance.`;

      // Avoid duplicates within 24h
      try {
        const existingResult = await database.execute(
          sql`SELECT id FROM user_notifications WHERE userId = ${parentUserId} AND title = ${title} AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        );
        const existing = (existingResult[0] as unknown as any[]) || [];
        if (existing.length === 0) {
          await database.execute(
            sql`INSERT INTO user_notifications (userId, title, body, type, isRead, createdAt) VALUES (${parentUserId}, ${title}, ${body}, 'fee_reminder', FALSE, NOW())`
          );
          notificationsSent++;
        }
      } catch (err) {
        console.error('[FeeReminder] Error creating notification:', err);
      }

      // WhatsApp notification (only if parent opted in and has a phone number)
      if (data.whatsappNotifications && data.whatsappPhone) {
        const whatsappMessage =
          `💰 *Overdue Fee Reminder*\n\n` +
          `Hi ${data.parentName},\n\n` +
          `You have *${data.feeCount} overdue fee(s)* totalling *EGP ${(data.totalAmount / 100).toFixed(2)}* for:\n` +
          `⚽ ${[...data.playerNames].join(', ')}\n\n` +
          `Please log in to the academy portal to settle your balance and avoid any disruption to training.\n\n` +
          `*Future Stars FC Academy*`;
        try {
          const sent = await sendWhatsAppMessage(data.whatsappPhone, whatsappMessage);
          if (sent) whatsappSent++;
        } catch (err) {
          console.error('[FeeReminder] WhatsApp send error:', err);
        }
      }
    }
  } catch (err) {
    console.error('[FeeReminder] Error running fee reminder job:', err);
  }
}

/**
 * Start the daily fee reminder scheduler.
 * Runs once at startup (after a 60s delay) then every 24 hours.
 */
export function startFeeReminderScheduler() {
  setTimeout(() => {
    sendOverdueFeeReminders();
    setInterval(sendOverdueFeeReminders, 24 * 60 * 60 * 1000);
  }, 60_000);
  console.log('[FeeReminder] Scheduler started — will run every 24 hours (in-app + WhatsApp)');
}
