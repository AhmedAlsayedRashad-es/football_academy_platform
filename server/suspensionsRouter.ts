import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { playerSuspensions, players, matchEvents } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// Helper to get role-based procedures from routers.ts context
// We define them inline here since they can't be imported from _core/trpc
import { publicProcedure } from './_core/trpc';

// Staff and admin procedures — re-use protectedProcedure with role checks
const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['admin', 'staff', 'coach'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const suspensionsRouter = router({

  // ── Get active suspensions (all teams or filtered by team) ──
  getActiveSuspensions: staffProcedure
    .input(z.object({ teamId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const conditions = [eq(playerSuspensions.status, 'active')];
      if (input?.teamId) {
        conditions.push(eq(playerSuspensions.teamId, input.teamId));
      }
      return database
        .select()
        .from(playerSuspensions)
        .where(and(...conditions))
        .orderBy(desc(playerSuspensions.createdAt));
    }),

  // ── Get all suspensions (history) ──
  getAllSuspensions: staffProcedure
    .input(z.object({
      teamId: z.number().optional(),
      playerId: z.number().optional(),
      status: z.enum(['active', 'served', 'appealed', 'cancelled']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const conditions: any[] = [];
      if (input?.teamId) conditions.push(eq(playerSuspensions.teamId, input.teamId));
      if (input?.playerId) conditions.push(eq(playerSuspensions.playerId, input.playerId));
      if (input?.status) conditions.push(eq(playerSuspensions.status, input.status));
      const query = database
        .select()
        .from(playerSuspensions)
        .orderBy(desc(playerSuspensions.createdAt));
      if (conditions.length > 0) {
        return query.where(and(...conditions));
      }
      return query;
    }),

  // ── Get suspended player IDs (for formation/squad filtering) ──
  getSuspendedPlayerIds: staffProcedure
    .input(z.object({ teamId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const conditions: any[] = [eq(playerSuspensions.status, 'active')];
      if (input?.teamId) conditions.push(eq(playerSuspensions.teamId, input.teamId));
      const rows = await database
        .select({ playerId: playerSuspensions.playerId })
        .from(playerSuspensions)
        .where(and(...conditions));
      return rows.map(r => r.playerId);
    }),

  // ── Create manual suspension (coach/admin) ──
  createManualSuspension: staffProcedure
    .input(z.object({
      playerId: z.number(),
      teamId: z.number().optional(),
      reason: z.string().min(1),
      banMatches: z.number().min(1).max(20),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      await database.insert(playerSuspensions).values({
        playerId: input.playerId,
        teamId: input.teamId ?? null,
        suspensionType: 'manual',
        reason: input.reason,
        banMatchesTotal: input.banMatches,
        banMatchesRemaining: input.banMatches,
        startDate: input.startDate ? input.startDate : null,
        endDate: input.endDate ? input.endDate : null,
        status: 'active',
        createdBy: ctx.user.id,
        notes: input.notes ?? null,
      } as any);
      return { success: true };
    }),

  // ── Process card event → auto-create suspension if rules triggered ──
  processCardEvent: staffProcedure
    .input(z.object({
      playerId: z.number(),
      teamId: z.number().optional(),
      matchId: z.number(),
      cardType: z.enum(['yellow_card', 'red_card']),
      eventId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;

      if (input.cardType === 'red_card') {
        // Direct red → 2 match ban
        await database.insert(playerSuspensions).values({
          playerId: input.playerId,
          teamId: input.teamId ?? null,
          suspensionType: 'red_card',
          reason: 'Direct red card — automatic 2-match ban',
          banMatchesTotal: 2,
          banMatchesRemaining: 2,
          triggeredByMatchId: input.matchId,
          triggeredByEventId: input.eventId ?? null,
          status: 'active',
          createdBy: ctx.user.id,
        } as any);
        return { suspended: true, type: 'red_card', banMatches: 2 };
      }

      if (input.cardType === 'yellow_card') {
        // Check if player already got a yellow in this match (double yellow)
        const matchYellows = await database
          .select()
          .from(matchEvents)
          .where(
            and(
              eq(matchEvents.liveMatchId, input.matchId),
              eq(matchEvents.eventType, 'yellow_card'),
              eq(matchEvents.playerId, input.playerId)
            )
          );

        if (matchYellows.length >= 1) {
          // 2nd yellow in same match → double yellow → 1 match ban
          await database.insert(playerSuspensions).values({
            playerId: input.playerId,
            teamId: input.teamId ?? null,
            suspensionType: 'double_yellow',
            reason: 'Two yellow cards in one match — automatic 1-match ban',
            banMatchesTotal: 1,
            banMatchesRemaining: 1,
            triggeredByMatchId: input.matchId,
            triggeredByEventId: input.eventId ?? null,
            status: 'active',
            createdBy: ctx.user.id,
          } as any);
          return { suspended: true, type: 'double_yellow', banMatches: 1 };
        }

        // Count accumulated yellows across all matches (excluding double-yellow matches)
        const allYellows = await database
          .select()
          .from(matchEvents)
          .where(
            and(
              eq(matchEvents.eventType, 'yellow_card'),
              eq(matchEvents.playerId, input.playerId)
            )
          );

        // Count yellows that didn't result in a double-yellow (i.e., only 1 per match)
        const matchYellowCounts: Record<number, number> = {};
        for (const e of allYellows) {
          if (e.liveMatchId) {
            matchYellowCounts[e.liveMatchId] = (matchYellowCounts[e.liveMatchId] || 0) + 1;
          }
        }
        const singleYellowMatches = Object.values(matchYellowCounts).filter(c => c === 1).length;
        // +1 for the current yellow being processed
        const totalAccumulated = singleYellowMatches + 1;

        if (totalAccumulated > 0 && totalAccumulated % 3 === 0) {
          // Every 3 accumulated yellows → 1 match ban
          await database.insert(playerSuspensions).values({
            playerId: input.playerId,
            teamId: input.teamId ?? null,
            suspensionType: 'yellow_accumulation',
            reason: `${totalAccumulated} accumulated yellow cards — automatic 1-match ban`,
            banMatchesTotal: 1,
            banMatchesRemaining: 1,
            triggeredByMatchId: input.matchId,
            triggeredByEventId: input.eventId ?? null,
            status: 'active',
            createdBy: ctx.user.id,
          } as any);
          return { suspended: true, type: 'yellow_accumulation', banMatches: 1, totalYellows: totalAccumulated };
        }

        return { suspended: false, type: 'yellow_card', totalYellows: totalAccumulated };
      }

      return { suspended: false };
    }),

  // ── Decrement ban when a match is played (call after each match) ──
  decrementBanForMatch: staffProcedure
    .input(z.object({
      playerId: z.number(),
      matchId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      // Get active suspensions for this player
      const activeSuspensions = await database
        .select()
        .from(playerSuspensions)
        .where(
          and(
            eq(playerSuspensions.playerId, input.playerId),
            eq(playerSuspensions.status, 'active')
          )
        );

      for (const suspension of activeSuspensions) {
        const newRemaining = suspension.banMatchesRemaining - 1;
        if (newRemaining <= 0) {
          await database
            .update(playerSuspensions)
            .set({ banMatchesRemaining: 0, status: 'served', updatedAt: new Date() })
            .where(eq(playerSuspensions.id, suspension.id));
        } else {
          await database
            .update(playerSuspensions)
            .set({ banMatchesRemaining: newRemaining, updatedAt: new Date() })
            .where(eq(playerSuspensions.id, suspension.id));
        }
      }
      return { success: true, processed: activeSuspensions.length };
    }),

  // ── Update suspension (appeal, cancel, edit) ──
  updateSuspension: staffProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['active', 'served', 'appealed', 'cancelled']).optional(),
      banMatchesRemaining: z.number().optional(),
      notes: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      const updateData: any = { updatedAt: new Date() };
      if (input.status !== undefined) updateData.status = input.status;
      if (input.banMatchesRemaining !== undefined) updateData.banMatchesRemaining = input.banMatchesRemaining;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.reason !== undefined) updateData.reason = input.reason;

      await database
        .update(playerSuspensions)
        .set(updateData)
        .where(eq(playerSuspensions.id, input.id));
      return { success: true };
    }),

  // ── Delete suspension ──
  deleteSuspension: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      await database.delete(playerSuspensions).where(eq(playerSuspensions.id, input.id));
      return { success: true };
    }),

  // ── Get player's suspension history ──
  getPlayerSuspensionHistory: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      return database
        .select()
        .from(playerSuspensions)
        .where(eq(playerSuspensions.playerId, input.playerId))
        .orderBy(desc(playerSuspensions.createdAt));
    }),

  // ── Get available (non-suspended, non-injured) players for a team ──
  getAvailablePlayersForMatch: staffProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;

      // Get suspended player IDs
      const suspendedRows = await database
        .select({ playerId: playerSuspensions.playerId })
        .from(playerSuspensions)
        .where(eq(playerSuspensions.status, 'active'));
      const suspendedIds = new Set(suspendedRows.map(r => r.playerId));

      // Get all players in the team
      const teamPlayers = await database
        .select()
        .from(players)
        .where(eq(players.teamId, input.teamId));

      return teamPlayers.map(p => ({
        ...p,
        isAvailable: p.status !== 'injured' && !suspendedIds.has(p.id),
        isSuspended: suspendedIds.has(p.id),
        isInjured: p.status === 'injured',
        unavailabilityReason: suspendedIds.has(p.id)
          ? 'Suspended'
          : p.status === 'injured'
          ? 'Injured'
          : null,
      }));
    }),
});
