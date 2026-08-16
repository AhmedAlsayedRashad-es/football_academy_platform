import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { coachPrivateTeams } from "../drizzle/schema";

export const privateSubscriptionsRouter = router({
  /** Get all members with their subscription info for a team */
  getByTeam: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const coachId = ctx.user.id;
      // Verify coach owns this team
      const teamRows = await db
        .select({ id: coachPrivateTeams.id })
        .from(coachPrivateTeams)
        .where(and(eq(coachPrivateTeams.id, input.teamId), eq(coachPrivateTeams.coachId, coachId)));
      if (!teamRows.length) throw new TRPCError({ code: "FORBIDDEN" });
      // Get members with subscription info
      const rows = await (db as any).execute(
        `SELECT cpm.id as memberId, cpm.player_id as playerId, cpm.monthly_fee as monthlyFee,
                cpm.subscription_status as subscriptionStatus, cpm.added_at as joinedAt,
                p.first_name as firstName, p.last_name as lastName, p.position, p.photo_url as photoUrl,
                COALESCE((SELECT SUM(cpp.amount) FROM coach_private_payments cpp WHERE cpp.player_id = cpm.player_id AND cpp.team_id = cpm.team_id AND cpp.status = 'paid'), 0) as totalPaid,
                (SELECT MAX(cpp.payment_date) FROM coach_private_payments cpp WHERE cpp.player_id = cpm.player_id AND cpp.team_id = cpm.team_id AND cpp.status = 'paid') as lastPaymentDate
         FROM coach_private_team_members cpm
         INNER JOIN players p ON p.id = cpm.player_id
         WHERE cpm.team_id = ?
         ORDER BY p.first_name ASC`,
        [input.teamId]
      );
      const result = rows as any;
      return Array.isArray(result) ? result : (result?.rows ?? result?.[0] ?? []);
    }),

  /** Record a payment for a player */
  recordPayment: protectedProcedure
    .input(z.object({
      teamId: z.number(),
      playerId: z.number(),
      amount: z.number().positive(),
      month: z.number().min(1).max(12),
      year: z.number().min(2020).max(2100),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const coachId = ctx.user.id;
      const teamRows = await db
        .select({ id: coachPrivateTeams.id })
        .from(coachPrivateTeams)
        .where(and(eq(coachPrivateTeams.id, input.teamId), eq(coachPrivateTeams.coachId, coachId)));
      if (!teamRows.length) throw new TRPCError({ code: "FORBIDDEN" });
      await (db as any).execute(
        `INSERT INTO coach_private_payments (team_id, player_id, amount, month, year, status, payment_date, notes, recorded_by)
         VALUES (?, ?, ?, ?, ?, 'paid', NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = 'paid', payment_date = NOW(), notes = VALUES(notes)`,
        [input.teamId, input.playerId, input.amount, input.month, input.year, input.notes || null, coachId]
      );
      await (db as any).execute(
        `UPDATE coach_private_team_members SET subscription_status = 'active' WHERE team_id = ? AND player_id = ?`,
        [input.teamId, input.playerId]
      );
      return { success: true };
    }),

  /** Get payment history for a player in a team */
  getPaymentHistory: protectedProcedure
    .input(z.object({ teamId: z.number(), playerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const coachId = ctx.user.id;
      const teamRows = await db
        .select({ id: coachPrivateTeams.id })
        .from(coachPrivateTeams)
        .where(and(eq(coachPrivateTeams.id, input.teamId), eq(coachPrivateTeams.coachId, coachId)));
      if (!teamRows.length) throw new TRPCError({ code: "FORBIDDEN" });
      const rows = await (db as any).execute(
        `SELECT * FROM coach_private_payments WHERE team_id = ? AND player_id = ? ORDER BY year DESC, month DESC`,
        [input.teamId, input.playerId]
      );
      const result2 = rows as any;
      return Array.isArray(result2) ? result2 : (result2?.rows ?? result2?.[0] ?? []);
    }),

  /** Update monthly fee for a player */
  updateMonthlyFee: protectedProcedure
    .input(z.object({ teamId: z.number(), playerId: z.number(), monthlyFee: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const coachId = ctx.user.id;
      const teamRows = await db
        .select({ id: coachPrivateTeams.id })
        .from(coachPrivateTeams)
        .where(and(eq(coachPrivateTeams.id, input.teamId), eq(coachPrivateTeams.coachId, coachId)));
      if (!teamRows.length) throw new TRPCError({ code: "FORBIDDEN" });
      await (db as any).execute(
        `UPDATE coach_private_team_members SET monthly_fee = ? WHERE team_id = ? AND player_id = ?`,
        [input.monthlyFee, input.teamId, input.playerId]
      );
      return { success: true };
    }),

  /** Get summary for all teams (total collected, outstanding) */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const coachId = ctx.user.id;
    const rows = await (db as any).execute(
      `SELECT 
        cpt.id as teamId, cpt.name as teamName,
        COUNT(DISTINCT cpm.player_id) as totalPlayers,
        COALESCE(SUM(cpm.monthly_fee), 0) as totalMonthlyFees,
        COALESCE((SELECT SUM(cpp.amount) FROM coach_private_payments cpp 
                  INNER JOIN coach_private_team_members cpm2 ON cpm2.player_id = cpp.player_id AND cpm2.team_id = cpp.team_id
                  WHERE cpm2.team_id = cpt.id AND cpp.status = 'paid' 
                  AND cpp.month = MONTH(NOW()) AND cpp.year = YEAR(NOW())), 0) as collectedThisMonth,
        COUNT(CASE WHEN cpm.subscription_status = 'overdue' THEN 1 END) as overdueCount
       FROM coach_private_teams cpt
       LEFT JOIN coach_private_team_members cpm ON cpm.team_id = cpt.id
       WHERE cpt.coach_id = ? AND cpt.is_active = 1
       GROUP BY cpt.id, cpt.name`,
      [coachId]
    );
    const result3 = rows as any;
    return Array.isArray(result3) ? result3 : (result3?.rows ?? result3?.[0] ?? []);
  }),
});
