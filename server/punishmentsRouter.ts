import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { punishments, players, users } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Staff-only middleware
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowedRoles = ["admin", "coach", "physical_trainer"];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
  }
  return next({ ctx });
});

export const punishmentsRouter = router({
  // ── List all punishments (with optional player filter) ──────────────────────
  list: staffProcedure
    .input(z.object({
      playerId: z.number().optional(),
      type: z.enum(["yellow_card", "red_card", "suspension", "fine", "extra_training", "warning", "other"]).optional(),
      isActive: z.boolean().optional(),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db
        .select({
          id: punishments.id,
          playerId: punishments.playerId,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          issuedBy: punishments.issuedBy,
          issuerName: users.name,
          type: punishments.type,
          matchOrSession: punishments.matchOrSession,
          opponent: punishments.opponent,
          reason: punishments.reason,
          description: punishments.description,
          suspensionGames: punishments.suspensionGames,
          fineAmount: punishments.fineAmount,
          isActive: punishments.isActive,
          resolvedAt: punishments.resolvedAt,
          resolvedNote: punishments.resolvedNote,
          incidentDate: punishments.incidentDate,
          createdAt: punishments.createdAt,
        })
        .from(punishments)
        .leftJoin(players, eq(punishments.playerId, players.id))
        .leftJoin(users, eq(punishments.issuedBy, users.id))
        .where(
          input.playerId
            ? eq(punishments.playerId, input.playerId)
            : input.isActive !== undefined
            ? eq(punishments.isActive, input.isActive)
            : undefined
        )
        .orderBy(desc(punishments.incidentDate))
        .limit(input.limit);
      return rows;
    }),

  // ── Get punishment stats for a player ──────────────────────────────────────
  playerStats: staffProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const rows = await db
        .select()
        .from(punishments)
        .where(eq(punishments.playerId, input.playerId))
        .orderBy(desc(punishments.incidentDate));

      const yellowCards = rows.filter(r => r.type === "yellow_card").length;
      const redCards = rows.filter(r => r.type === "red_card").length;
      const suspensions = rows.filter(r => r.type === "suspension").length;
      const warnings = rows.filter(r => r.type === "warning").length;
      const fines = rows.filter(r => r.type === "fine").length;
      const extraTraining = rows.filter(r => r.type === "extra_training").length;
      const active = rows.filter(r => r.isActive).length;
      const totalSuspensionGames = rows.reduce((s, r) => s + (r.suspensionGames || 0), 0);

      return {
        total: rows.length,
        yellowCards,
        redCards,
        suspensions,
        warnings,
        fines,
        extraTraining,
        active,
        totalSuspensionGames,
        recent: rows.slice(0, 5),
      };
    }),

  // ── Team summary stats ──────────────────────────────────────────────────────
  teamSummary: staffProcedure
    .query(async () => {
      const db = (await getDb())!;
      const rows = await db
        .select({
          playerId: punishments.playerId,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          type: punishments.type,
          isActive: punishments.isActive,
          incidentDate: punishments.incidentDate,
        })
        .from(punishments)
        .leftJoin(players, eq(punishments.playerId, players.id))
        .orderBy(desc(punishments.incidentDate));

      // Group by player
      const playerMap = new Map<number, any>();
      for (const row of rows) {
        if (!playerMap.has(row.playerId)) {
          playerMap.set(row.playerId, {
            playerId: row.playerId,
            name: `${row.playerFirstName} ${row.playerLastName}`,
            yellowCards: 0,
            redCards: 0,
            suspensions: 0,
            warnings: 0,
            total: 0,
            active: 0,
          });
        }
        const p = playerMap.get(row.playerId);
        p.total++;
        if (row.isActive) p.active++;
        if (row.type === "yellow_card") p.yellowCards++;
        if (row.type === "red_card") p.redCards++;
        if (row.type === "suspension") p.suspensions++;
        if (row.type === "warning") p.warnings++;
      }

      return Array.from(playerMap.values()).sort((a, b) => b.total - a.total);
    }),

  // ── Create punishment ───────────────────────────────────────────────────────
  create: staffProcedure
    .input(z.object({
      playerId: z.number(),
      type: z.enum(["yellow_card", "red_card", "suspension", "fine", "extra_training", "warning", "other"]),
      matchOrSession: z.string().optional(),
      opponent: z.string().optional(),
      reason: z.string().min(1),
      description: z.string().optional(),
      suspensionGames: z.number().min(0).default(0),
      fineAmount: z.number().optional(),
      incidentDate: z.string(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(punishments).values({
        playerId: input.playerId,
        issuedBy: ctx.user.id,
        type: input.type,
        matchOrSession: input.matchOrSession,
        opponent: input.opponent,
        reason: input.reason,
        description: input.description,
        suspensionGames: input.suspensionGames,
        fineAmount: input.fineAmount?.toString(),
        isActive: true,
        incidentDate: new Date(input.incidentDate),
      });
      return { success: true, id: (result as any).insertId };
    }),

  // ── Resolve / dismiss punishment ────────────────────────────────────────────
  resolve: staffProcedure
    .input(z.object({
      id: z.number(),
      resolvedNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.update(punishments)
        .set({
          isActive: false,
          resolvedAt: new Date(),
          resolvedNote: input.resolvedNote,
        })
        .where(eq(punishments.id, input.id));
      return { success: true };
    }),

  // ── Delete punishment ───────────────────────────────────────────────────────
  delete: staffProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(punishments).where(eq(punishments.id, input.id));
      return { success: true };
    }),
});
