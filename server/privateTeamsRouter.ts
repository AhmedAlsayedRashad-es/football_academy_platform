import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eq, and, desc, inArray, asc } from "drizzle-orm";
import {
  coachPrivateTeams,
  coachPrivateTeamMembers,
  coachPrivateSessions,
  coachPrivateSessionPlayers,
  players,
  users,
  teamCoaches,
} from "../drizzle/schema";

export const privateTeamsRouter = router({
  // ─── TEAMS ────────────────────────────────────────────────────────────────

  // ─── PLAYERS FOR COACH ────────────────────────────────────────────────────
  /** Returns only players belonging to the coach's official teams + private team members */
  getCoachPlayers: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const coachId = ctx.user.id;

    // 1. Get official teams this coach is assigned to
    const coachTeamRows = await db
      .select({ teamId: teamCoaches.teamId })
      .from(teamCoaches)
      .where(eq(teamCoaches.coachUserId, coachId));

    const officialTeamIds = coachTeamRows.map((r: any) => r.teamId).filter(Boolean);

    // 2. Get players from those official teams (players.teamId is a direct FK)
    let officialPlayers: any[] = [];
    if (officialTeamIds.length > 0) {
      officialPlayers = await db
        .select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
          photoUrl: players.photoUrl,
          dateOfBirth: players.dateOfBirth,
          nationality: players.nationality,
          jerseyNumber: players.jerseyNumber,
          status: players.status,
        })
        .from(players)
        .where(and(
          inArray(players.teamId, officialTeamIds),
          eq(players.status, "active")
        ));
    }

    // 3. Get private team member players
    const privateTeamRows = await db
      .select({ id: coachPrivateTeams.id })
      .from(coachPrivateTeams)
      .where(eq(coachPrivateTeams.coachId, coachId));

    const privateTeamIds = privateTeamRows.map((t: any) => t.id);
    let privateMembers: any[] = [];
    if (privateTeamIds.length > 0) {
      privateMembers = await db
        .select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
          photoUrl: players.photoUrl,
          dateOfBirth: players.dateOfBirth,
          nationality: players.nationality,
          jerseyNumber: players.jerseyNumber,
          status: players.status,
        })
        .from(players)
        .innerJoin(coachPrivateTeamMembers, eq(coachPrivateTeamMembers.playerId, players.id))
        .where(inArray(coachPrivateTeamMembers.teamId, privateTeamIds));
    }

    // Merge and deduplicate by player id
    const allMap = new Map<number, any>();
    [...officialPlayers, ...privateMembers].forEach((p) => allMap.set(p.id, p));
    return Array.from(allMap.values());
  }),

  /** Get all private teams owned by the current coach */
  getMyTeams: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const teams = await db
      .select()
      .from(coachPrivateTeams)
      .where(
        and(
          eq(coachPrivateTeams.coachId, ctx.user.id),
          eq(coachPrivateTeams.isActive, true)
        )
      )
      .orderBy(desc(coachPrivateTeams.createdAt));

    // For each team, get member count
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const members = await db
          .select()
          .from(coachPrivateTeamMembers)
          .where(eq(coachPrivateTeamMembers.teamId, team.id));
        return { ...team, memberCount: members.length };
      })
    );

    return teamsWithCounts;
  }),

  /** Create a new private team */
  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(150),
        description: z.string().optional(),
        ageGroup: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(coachPrivateTeams).values({
        coachId: ctx.user.id,
        name: input.name,
        description: input.description,
        ageGroup: input.ageGroup,
        isActive: true,
      });
      return { id: result.insertId, ...input };
    }),

  /** Update a private team */
  updateTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.number(),
        name: z.string().min(1).max(150).optional(),
        description: z.string().optional(),
        ageGroup: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [team] = await db
        .select()
        .from(coachPrivateTeams)
        .where(eq(coachPrivateTeams.id, input.teamId));

      if (!team || team.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your team" });
      }

      await db
        .update(coachPrivateTeams)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.ageGroup !== undefined && { ageGroup: input.ageGroup }),
        })
        .where(eq(coachPrivateTeams.id, input.teamId));

      return { success: true };
    }),

  /** Delete (soft-delete) a private team */
  deleteTeam: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [team] = await db
        .select()
        .from(coachPrivateTeams)
        .where(eq(coachPrivateTeams.id, input.teamId));

      if (!team || team.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your team" });
      }

      await db
        .update(coachPrivateTeams)
        .set({ isActive: false })
        .where(eq(coachPrivateTeams.id, input.teamId));

      return { success: true };
    }),

  // ─── TEAM MEMBERS ─────────────────────────────────────────────────────────

  /** Get all members of a private team */
  getTeamMembers: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify ownership
      const [team] = await db
        .select()
        .from(coachPrivateTeams)
        .where(eq(coachPrivateTeams.id, input.teamId));

      if (!team || team.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const members = await db
        .select({
          memberId: coachPrivateTeamMembers.id,
          playerId: coachPrivateTeamMembers.playerId,
          position: coachPrivateTeamMembers.position,
          jerseyNumber: coachPrivateTeamMembers.jerseyNumber,
          notes: coachPrivateTeamMembers.notes,
          addedAt: coachPrivateTeamMembers.addedAt,
          firstName: players.firstName,
          lastName: players.lastName,
          photoUrl: players.photoUrl,
          playerPosition: players.position,
          ageGroup: players.ageGroup,
          status: players.status,
        })
        .from(coachPrivateTeamMembers)
        .innerJoin(players, eq(coachPrivateTeamMembers.playerId, players.id))
        .where(eq(coachPrivateTeamMembers.teamId, input.teamId));

      return members;
    }),

  /** Add a player to a private team */
  addTeamMember: protectedProcedure
    .input(
      z.object({
        teamId: z.number(),
        playerId: z.number(),
        position: z.string().optional(),
        jerseyNumber: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [team] = await db
        .select()
        .from(coachPrivateTeams)
        .where(eq(coachPrivateTeams.id, input.teamId));

      if (!team || team.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Check if already a member
      const [existing] = await db
        .select()
        .from(coachPrivateTeamMembers)
        .where(
          and(
            eq(coachPrivateTeamMembers.teamId, input.teamId),
            eq(coachPrivateTeamMembers.playerId, input.playerId)
          )
        );

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Player already in team" });
      }

      await db.insert(coachPrivateTeamMembers).values({
        teamId: input.teamId,
        playerId: input.playerId,
        position: input.position,
        jerseyNumber: input.jerseyNumber,
        notes: input.notes,
      });

      return { success: true };
    }),

  /** Remove a player from a private team */
  removeTeamMember: protectedProcedure
    .input(z.object({ teamId: z.number(), playerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [team] = await db
        .select()
        .from(coachPrivateTeams)
        .where(eq(coachPrivateTeams.id, input.teamId));

      if (!team || team.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .delete(coachPrivateTeamMembers)
        .where(
          and(
            eq(coachPrivateTeamMembers.teamId, input.teamId),
            eq(coachPrivateTeamMembers.playerId, input.playerId)
          )
        );

      return { success: true };
    }),

  // ─── SESSIONS ─────────────────────────────────────────────────────────────

  /** Get all private sessions for the current coach */
  getMySessions: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const sessions = await db
      .select({
        id: coachPrivateSessions.id,
        title: coachPrivateSessions.title,
        description: coachPrivateSessions.description,
        sessionDate: coachPrivateSessions.sessionDate,
        startTime: coachPrivateSessions.startTime,
        endTime: coachPrivateSessions.endTime,
        location: coachPrivateSessions.location,
        sessionType: coachPrivateSessions.sessionType,
        objectives: coachPrivateSessions.objectives,
        notes: coachPrivateSessions.notes,
        status: coachPrivateSessions.status,
        teamId: coachPrivateSessions.teamId,
        createdAt: coachPrivateSessions.createdAt,
        teamName: coachPrivateTeams.name,
      })
      .from(coachPrivateSessions)
      .leftJoin(coachPrivateTeams, eq(coachPrivateSessions.teamId, coachPrivateTeams.id))
      .where(eq(coachPrivateSessions.coachId, ctx.user.id))
      .orderBy(desc(coachPrivateSessions.sessionDate));

    return sessions;
  }),

  /** Get a single session with its players */
  getSessionDetail: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const sessionPlayers = await db
        .select({
          id: coachPrivateSessionPlayers.id,
          playerId: coachPrivateSessionPlayers.playerId,
          attendance: coachPrivateSessionPlayers.attendance,
          performanceRating: coachPrivateSessionPlayers.performanceRating,
          coachNotes: coachPrivateSessionPlayers.coachNotes,
          firstName: players.firstName,
          lastName: players.lastName,
          photoUrl: players.photoUrl,
          position: players.position,
        })
        .from(coachPrivateSessionPlayers)
        .innerJoin(players, eq(coachPrivateSessionPlayers.playerId, players.id))
        .where(eq(coachPrivateSessionPlayers.sessionId, input.sessionId));

      return { ...session, players: sessionPlayers };
    }),

  /** Create a new private session */
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        sessionDate: z.string(), // YYYY-MM-DD
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        sessionType: z.enum(["technical", "tactical", "physical", "match", "recovery", "mixed"]).default("technical"),
        objectives: z.string().optional(),
        notes: z.string().optional(),
        teamId: z.number().optional(),
        playerIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // If teamId provided, verify ownership
      if (input.teamId) {
        const [team] = await db
          .select()
          .from(coachPrivateTeams)
          .where(eq(coachPrivateTeams.id, input.teamId));
        if (!team || team.coachId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const [result] = await db.insert(coachPrivateSessions).values({
        coachId: ctx.user.id,
        teamId: input.teamId,
        title: input.title,
        description: input.description,
        sessionDate: new Date(input.sessionDate),
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        sessionType: input.sessionType,
        objectives: input.objectives,
        notes: input.notes,
        status: "scheduled",
      });

      const sessionId = result.insertId;

      // Add players if provided
      if (input.playerIds && input.playerIds.length > 0) {
        await db.insert(coachPrivateSessionPlayers).values(
          input.playerIds.map((pid) => ({
            sessionId: sessionId,
            playerId: pid,
            attendance: "present" as const,
          }))
        );
      }

      return { id: sessionId };
    }),

  /** Update a private session */
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        sessionDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        sessionType: z.enum(["technical", "tactical", "physical", "match", "recovery", "mixed"]).optional(),
        objectives: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
        teamId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.sessionDate) updateData.sessionDate = new Date(input.sessionDate);
      if (input.startTime !== undefined) updateData.startTime = input.startTime;
      if (input.endTime !== undefined) updateData.endTime = input.endTime;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.sessionType) updateData.sessionType = input.sessionType;
      if (input.objectives !== undefined) updateData.objectives = input.objectives;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.status) updateData.status = input.status;
      if (input.teamId !== undefined) updateData.teamId = input.teamId;

      await db
        .update(coachPrivateSessions)
        .set(updateData)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      return { success: true };
    }),

  /** Delete a private session */
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Delete players first
      await db
        .delete(coachPrivateSessionPlayers)
        .where(eq(coachPrivateSessionPlayers.sessionId, input.sessionId));

      await db
        .delete(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      return { success: true };
    }),

  // ─── SESSION PLAYERS ──────────────────────────────────────────────────────

  /** Add a player to a session */
  addSessionPlayer: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        playerId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [existing] = await db
        .select()
        .from(coachPrivateSessionPlayers)
        .where(
          and(
            eq(coachPrivateSessionPlayers.sessionId, input.sessionId),
            eq(coachPrivateSessionPlayers.playerId, input.playerId)
          )
        );

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Player already in session" });
      }

      await db.insert(coachPrivateSessionPlayers).values({
        sessionId: input.sessionId,
        playerId: input.playerId,
        attendance: "present",
      });

      return { success: true };
    }),

  /** Remove a player from a session */
  removeSessionPlayer: protectedProcedure
    .input(z.object({ sessionId: z.number(), playerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .delete(coachPrivateSessionPlayers)
        .where(
          and(
            eq(coachPrivateSessionPlayers.sessionId, input.sessionId),
            eq(coachPrivateSessionPlayers.playerId, input.playerId)
          )
        );

      return { success: true };
    }),

  /** Update player attendance/rating in a session */
  updateSessionPlayer: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        playerId: z.number(),
        attendance: z.enum(["present", "absent", "late", "excused"]).optional(),
        performanceRating: z.number().min(1).max(10).optional(),
        coachNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updateData: any = {};
      if (input.attendance) updateData.attendance = input.attendance;
      if (input.performanceRating !== undefined) updateData.performanceRating = input.performanceRating;
      if (input.coachNotes !== undefined) updateData.coachNotes = input.coachNotes;

      await db
        .update(coachPrivateSessionPlayers)
        .set(updateData)
        .where(
          and(
            eq(coachPrivateSessionPlayers.sessionId, input.sessionId),
            eq(coachPrivateSessionPlayers.playerId, input.playerId)
          )
        );

      return { success: true };
    }),

  /** Add all team members to a session at once */
  addTeamToSession: protectedProcedure
    .input(z.object({ sessionId: z.number(), teamId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(coachPrivateSessions)
        .where(eq(coachPrivateSessions.id, input.sessionId));

      if (!session || session.coachId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const members = await db
        .select()
        .from(coachPrivateTeamMembers)
        .where(eq(coachPrivateTeamMembers.teamId, input.teamId));

      if (members.length === 0) return { added: 0 };

      // Get existing players in session
      const existing = await db
        .select()
        .from(coachPrivateSessionPlayers)
        .where(eq(coachPrivateSessionPlayers.sessionId, input.sessionId));

      const existingIds = new Set(existing.map((e) => e.playerId));
      const toAdd = members.filter((m) => !existingIds.has(m.playerId));

      if (toAdd.length > 0) {
        await db.insert(coachPrivateSessionPlayers).values(
          toAdd.map((m) => ({
            sessionId: input.sessionId,
            playerId: m.playerId,
            attendance: "present" as const,
          }))
        );
      }

      return { added: toAdd.length };
    }),

  // ─── ANALYTICS ────────────────────────────────────────────────────────────

  /** Get overall dashboard stats for the coach */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const coachId = ctx.user.id;

    // All sessions
    const allSessions = await db
      .select()
      .from(coachPrivateSessions)
      .where(eq(coachPrivateSessions.coachId, coachId));

    // All session players
    const sessionIds = allSessions.map((s) => s.id);
    let allSessionPlayers: any[] = [];
    if (sessionIds.length > 0) {
      allSessionPlayers = await db
        .select()
        .from(coachPrivateSessionPlayers)
        .where(inArray(coachPrivateSessionPlayers.sessionId, sessionIds));
    }

    // All teams
    const allTeams = await db
      .select()
      .from(coachPrivateTeams)
      .where(and(eq(coachPrivateTeams.coachId, coachId), eq(coachPrivateTeams.isActive, true)));

    // Total players across all teams (unique)
    const allMembers = allTeams.length > 0
      ? await db
          .select()
          .from(coachPrivateTeamMembers)
          .where(inArray(coachPrivateTeamMembers.teamId, allTeams.map((t) => t.id)))
      : [];
    const uniquePlayerIds = new Set(allMembers.map((m) => m.playerId));

    // Attendance breakdown
    const totalAttendanceRecords = allSessionPlayers.length;
    const presentCount = allSessionPlayers.filter((sp) => sp.attendance === 'present').length;
    const absentCount = allSessionPlayers.filter((sp) => sp.attendance === 'absent').length;
    const lateCount = allSessionPlayers.filter((sp) => sp.attendance === 'late').length;
    const excusedCount = allSessionPlayers.filter((sp) => sp.attendance === 'excused').length;
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    // Average performance rating
    const ratedPlayers = allSessionPlayers.filter((sp) => sp.performanceRating != null);
    const avgPerformance = ratedPlayers.length > 0
      ? parseFloat((ratedPlayers.reduce((sum, sp) => sum + sp.performanceRating, 0) / ratedPlayers.length).toFixed(1))
      : 0;

    // Sessions by type
    const sessionsByType: Record<string, number> = {};
    allSessions.forEach((s) => {
      const t = s.sessionType || 'technical';
      sessionsByType[t] = (sessionsByType[t] || 0) + 1;
    });

    // Sessions by status
    const sessionsByStatus: Record<string, number> = {};
    allSessions.forEach((s) => {
      const st = s.status || 'scheduled';
      sessionsByStatus[st] = (sessionsByStatus[st] || 0) + 1;
    });

    // Sessions per month (last 6 months)
    const now = new Date();
    const monthlyData: { month: string; sessions: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en', { month: 'short', year: '2-digit' });
      const count = allSessions.filter((s) => {
        const sd = new Date(s.sessionDate);
        return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
      }).length;
      monthlyData.push({ month: monthLabel, sessions: count });
    }

    return {
      totalTeams: allTeams.length,
      totalSessions: allSessions.length,
      totalUniquePlayers: uniquePlayerIds.size,
      completedSessions: sessionsByStatus['completed'] || 0,
      attendanceRate,
      avgPerformance,
      attendanceBreakdown: [
        { name: 'Present', value: presentCount, color: '#22c55e' },
        { name: 'Absent', value: absentCount, color: '#ef4444' },
        { name: 'Late', value: lateCount, color: '#f59e0b' },
        { name: 'Excused', value: excusedCount, color: '#3b82f6' },
      ],
      sessionsByType: Object.entries(sessionsByType).map(([name, value]) => ({ name, value })),
      monthlyData,
    };
  }),

  /** Get per-player stats across all sessions for a coach */
  getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const coachId = ctx.user.id;

    const allSessions = await db
      .select()
      .from(coachPrivateSessions)
      .where(eq(coachPrivateSessions.coachId, coachId));

    if (allSessions.length === 0) return [];

    const sessionIds = allSessions.map((s) => s.id);
    const allSessionPlayers = await db
      .select({
        playerId: coachPrivateSessionPlayers.playerId,
        attendance: coachPrivateSessionPlayers.attendance,
        performanceRating: coachPrivateSessionPlayers.performanceRating,
        firstName: players.firstName,
        lastName: players.lastName,
        position: players.position,
        photoUrl: players.photoUrl,
      })
      .from(coachPrivateSessionPlayers)
      .innerJoin(players, eq(coachPrivateSessionPlayers.playerId, players.id))
      .where(inArray(coachPrivateSessionPlayers.sessionId, sessionIds));

    // Aggregate per player
    const playerMap = new Map<number, any>();
    allSessionPlayers.forEach((sp) => {
      if (!playerMap.has(sp.playerId)) {
        playerMap.set(sp.playerId, {
          playerId: sp.playerId,
          firstName: sp.firstName,
          lastName: sp.lastName,
          position: sp.position,
          photoUrl: sp.photoUrl,
          totalSessions: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          ratingSum: 0,
          ratingCount: 0,
        });
      }
      const p = playerMap.get(sp.playerId)!;
      p.totalSessions++;
      if (sp.attendance === 'present') p.present++;
      else if (sp.attendance === 'absent') p.absent++;
      else if (sp.attendance === 'late') p.late++;
      else if (sp.attendance === 'excused') p.excused++;
      if (sp.performanceRating != null) {
        p.ratingSum += sp.performanceRating;
        p.ratingCount++;
      }
    });

    return Array.from(playerMap.values()).map((p) => ({
      ...p,
      attendanceRate: p.totalSessions > 0 ? Math.round((p.present / p.totalSessions) * 100) : 0,
      avgRating: p.ratingCount > 0 ? parseFloat((p.ratingSum / p.ratingCount).toFixed(1)) : null,
    })).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }),

  /** Get dashboard stats filtered by a specific team (optional teamId) */
  getFilteredStats: protectedProcedure
    .input(z.object({ teamId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const coachId = ctx.user.id;

      // Get sessions — filtered by team if provided
      let allSessions: any[] = [];
      if (input.teamId) {
        allSessions = await db
          .select()
          .from(coachPrivateSessions)
          .where(and(
            eq(coachPrivateSessions.coachId, coachId),
            eq(coachPrivateSessions.teamId, input.teamId)
          ));
      } else {
        allSessions = await db
          .select()
          .from(coachPrivateSessions)
          .where(eq(coachPrivateSessions.coachId, coachId));
      }

      const sessionIds = allSessions.map((s) => s.id);
      let allSessionPlayers: any[] = [];
      if (sessionIds.length > 0) {
        allSessionPlayers = await db
          .select()
          .from(coachPrivateSessionPlayers)
          .where(inArray(coachPrivateSessionPlayers.sessionId, sessionIds));
      }

      const totalAttendanceRecords = allSessionPlayers.length;
      const presentCount = allSessionPlayers.filter((sp) => sp.attendance === 'present').length;
      const absentCount = allSessionPlayers.filter((sp) => sp.attendance === 'absent').length;
      const lateCount = allSessionPlayers.filter((sp) => sp.attendance === 'late').length;
      const excusedCount = allSessionPlayers.filter((sp) => sp.attendance === 'excused').length;
      const attendanceRate = totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

      const ratedPlayers = allSessionPlayers.filter((sp) => sp.performanceRating != null);
      const avgPerformance = ratedPlayers.length > 0
        ? parseFloat((ratedPlayers.reduce((sum: number, sp: any) => sum + sp.performanceRating, 0) / ratedPlayers.length).toFixed(1))
        : 0;

      const sessionsByType: Record<string, number> = {};
      allSessions.forEach((s) => {
        const t = s.sessionType || 'technical';
        sessionsByType[t] = (sessionsByType[t] || 0) + 1;
      });

      const sessionsByStatus: Record<string, number> = {};
      allSessions.forEach((s) => {
        const st = s.status || 'scheduled';
        sessionsByStatus[st] = (sessionsByStatus[st] || 0) + 1;
      });

      const now = new Date();
      const monthlyData: { month: string; sessions: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('en', { month: 'short', year: '2-digit' });
        const count = allSessions.filter((s) => {
          const sd = new Date(s.sessionDate);
          return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
        }).length;
        monthlyData.push({ month: monthLabel, sessions: count });
      }

      return {
        totalSessions: allSessions.length,
        completedSessions: sessionsByStatus['completed'] || 0,
        attendanceRate,
        avgPerformance,
        attendanceBreakdown: [
          { name: 'Present', value: presentCount, color: '#22c55e' },
          { name: 'Absent', value: absentCount, color: '#ef4444' },
          { name: 'Late', value: lateCount, color: '#f59e0b' },
          { name: 'Excused', value: excusedCount, color: '#3b82f6' },
        ],
        sessionsByType: Object.entries(sessionsByType).map(([name, value]) => ({ name, value })),
        monthlyData,
      };
    }),

  /** Get per-session performance comparison data (avg rating + attendance % per session) */
  getSessionComparison: protectedProcedure
    .input(z.object({ teamId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const coachId = ctx.user.id;

      let sessions: any[] = [];
      if (input.teamId) {
        sessions = await db
          .select()
          .from(coachPrivateSessions)
          .where(and(
            eq(coachPrivateSessions.coachId, coachId),
            eq(coachPrivateSessions.teamId, input.teamId)
          ))
          .orderBy(asc(coachPrivateSessions.sessionDate))
          .limit(20);
      } else {
        sessions = await db
          .select()
          .from(coachPrivateSessions)
          .where(eq(coachPrivateSessions.coachId, coachId))
          .orderBy(asc(coachPrivateSessions.sessionDate))
          .limit(20);
      }

      if (sessions.length === 0) return [];

      const sessionIds = sessions.map((s) => s.id);
      const allPlayers = await db
        .select()
        .from(coachPrivateSessionPlayers)
        .where(inArray(coachPrivateSessionPlayers.sessionId, sessionIds));

      return sessions.map((s) => {
        const sp = allPlayers.filter((p) => p.sessionId === s.id);
        const present = sp.filter((p) => p.attendance === 'present').length;
        const rated = sp.filter((p) => p.performanceRating != null);
        const avgRating = rated.length > 0
          ? parseFloat((rated.reduce((sum: number, p: any) => sum + p.performanceRating, 0) / rated.length).toFixed(1))
          : null;
        return {
          sessionId: s.id,
          title: s.title,
          date: s.sessionDate,
          label: s.title.length > 12 ? s.title.substring(0, 12) + '…' : s.title,
          totalPlayers: sp.length,
          attendanceRate: sp.length > 0 ? Math.round((present / sp.length) * 100) : 0,
          avgRating,
        };
      });
    }),

  /** Get per-player stats filtered by team */
  getFilteredPlayerStats: protectedProcedure
    .input(z.object({ teamId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const coachId = ctx.user.id;

      let sessions: any[] = [];
      if (input.teamId) {
        sessions = await db
          .select()
          .from(coachPrivateSessions)
          .where(and(
            eq(coachPrivateSessions.coachId, coachId),
            eq(coachPrivateSessions.teamId, input.teamId)
          ));
      } else {
        sessions = await db
          .select()
          .from(coachPrivateSessions)
          .where(eq(coachPrivateSessions.coachId, coachId));
      }

      if (sessions.length === 0) return [];

      const sessionIds = sessions.map((s) => s.id);
      const allSessionPlayers = await db
        .select({
          playerId: coachPrivateSessionPlayers.playerId,
          attendance: coachPrivateSessionPlayers.attendance,
          performanceRating: coachPrivateSessionPlayers.performanceRating,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
          photoUrl: players.photoUrl,
        })
        .from(coachPrivateSessionPlayers)
        .innerJoin(players, eq(coachPrivateSessionPlayers.playerId, players.id))
        .where(inArray(coachPrivateSessionPlayers.sessionId, sessionIds));

      const playerMap = new Map<number, any>();
      allSessionPlayers.forEach((sp) => {
        if (!playerMap.has(sp.playerId)) {
          playerMap.set(sp.playerId, {
            playerId: sp.playerId,
            firstName: sp.firstName,
            lastName: sp.lastName,
            position: sp.position,
            photoUrl: sp.photoUrl,
            totalSessions: 0, present: 0, absent: 0, late: 0, excused: 0,
            ratingSum: 0, ratingCount: 0,
          });
        }
        const p = playerMap.get(sp.playerId)!;
        p.totalSessions++;
        if (sp.attendance === 'present') p.present++;
        else if (sp.attendance === 'absent') p.absent++;
        else if (sp.attendance === 'late') p.late++;
        else if (sp.attendance === 'excused') p.excused++;
        if (sp.performanceRating != null) { p.ratingSum += sp.performanceRating; p.ratingCount++; }
      });

      return Array.from(playerMap.values()).map((p) => ({
        ...p,
        attendanceRate: p.totalSessions > 0 ? Math.round((p.present / p.totalSessions) * 100) : 0,
        avgRating: p.ratingCount > 0 ? parseFloat((p.ratingSum / p.ratingCount).toFixed(1)) : null,
      })).sort((a, b) => b.attendanceRate - a.attendanceRate);
    }),

  // ─── PLAYER INDIVIDUAL REPORT ────────────────────────────────────────────
  /** Full performance & attendance history for a single player across all coach's sessions */
  getPlayerReport: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const coachId = ctx.user.id;

      // Get player info
      const playerRows = await db
        .select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
          photoUrl: players.photoUrl,
          jerseyNumber: players.jerseyNumber,
          dateOfBirth: players.dateOfBirth,
          nationality: players.nationality,
        })
        .from(players)
        .where(eq(players.id, input.playerId));

      if (playerRows.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
      const player = playerRows[0];

      // Get all sessions by this coach where the player participated
      const sessionPlayerRows = await db
        .select({
          sessionId: coachPrivateSessionPlayers.sessionId,
          attendance: coachPrivateSessionPlayers.attendance,
          performanceRating: coachPrivateSessionPlayers.performanceRating,
          coachNotes: coachPrivateSessionPlayers.coachNotes,
          sessionTitle: coachPrivateSessions.title,
          sessionDate: coachPrivateSessions.sessionDate,
          sessionType: coachPrivateSessions.sessionType,
          location: coachPrivateSessions.location,
        })
        .from(coachPrivateSessionPlayers)
        .innerJoin(coachPrivateSessions, eq(coachPrivateSessionPlayers.sessionId, coachPrivateSessions.id))
        .where(and(
          eq(coachPrivateSessionPlayers.playerId, input.playerId),
          eq(coachPrivateSessions.coachId, coachId)
        ))
        .orderBy(asc(coachPrivateSessions.sessionDate));

      // Aggregate stats
      const totalSessions = sessionPlayerRows.length;
      const present = sessionPlayerRows.filter((r) => r.attendance === 'present').length;
      const absent = sessionPlayerRows.filter((r) => r.attendance === 'absent').length;
      const late = sessionPlayerRows.filter((r) => r.attendance === 'late').length;
      const excused = sessionPlayerRows.filter((r) => r.attendance === 'excused').length;
      const ratingsArr = sessionPlayerRows.filter((r) => r.performanceRating != null).map((r) => r.performanceRating as number);
      const avgRating = ratingsArr.length > 0 ? parseFloat((ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1)) : null;
      const attendanceRate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

      // Session type breakdown
      const typeBreakdown: Record<string, number> = {};
      sessionPlayerRows.forEach((r) => {
        typeBreakdown[r.sessionType] = (typeBreakdown[r.sessionType] || 0) + 1;
      });

      return {
        player,
        stats: { totalSessions, present, absent, late, excused, attendanceRate, avgRating },
        typeBreakdown,
        sessionHistory: sessionPlayerRows.map((r) => ({
          sessionId: r.sessionId,
          title: r.sessionTitle,
          date: r.sessionDate,
          type: r.sessionType,
          location: r.location,
          attendance: r.attendance,
          rating: r.performanceRating,
          notes: r.coachNotes,
        })),
      };
    }),

  // ─── SESSION PDF DATA ─────────────────────────────────────────────────────
  /** Get full session detail for PDF export (players, attendance, ratings, notes) */
  getSessionPdfData: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const coachId = ctx.user.id;

      // Get session info
      const sessionRows = await db
        .select()
        .from(coachPrivateSessions)
        .where(and(
          eq(coachPrivateSessions.id, input.sessionId),
          eq(coachPrivateSessions.coachId, coachId)
        ));

      if (sessionRows.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      const session = sessionRows[0];

      // Get coach info
      const coachRows = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, coachId));
      const coach = coachRows[0] || { name: 'Coach', email: '' };

      // Get all players in this session
      const playerRows = await db
        .select({
          playerId: coachPrivateSessionPlayers.playerId,
          attendance: coachPrivateSessionPlayers.attendance,
          performanceRating: coachPrivateSessionPlayers.performanceRating,
          coachNotes: coachPrivateSessionPlayers.coachNotes,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
          jerseyNumber: players.jerseyNumber,
          photoUrl: players.photoUrl,
        })
        .from(coachPrivateSessionPlayers)
        .innerJoin(players, eq(coachPrivateSessionPlayers.playerId, players.id))
        .where(eq(coachPrivateSessionPlayers.sessionId, input.sessionId))
        .orderBy(asc(players.firstName));

      const present = playerRows.filter((p) => p.attendance === 'present').length;
      const absent = playerRows.filter((p) => p.attendance === 'absent').length;
      const late = playerRows.filter((p) => p.attendance === 'late').length;
      const excused = playerRows.filter((p) => p.attendance === 'excused').length;

      return {
        session,
        coach,
        players: playerRows,
        summary: { total: playerRows.length, present, absent, late, excused },
      };
    }),

  /** Create a new player not on the platform (private player for coach's use) */
  createPrivatePlayer: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      dateOfBirth: z.string(),
      position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']),
      ageGroup: z.string().optional(),
      jerseyNumber: z.number().optional(),
      height: z.number().optional(),
      weight: z.number().optional(),
      nationality: z.string().optional(),
      phone: z.string().optional(),
      teamId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(players).values({
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: new Date(input.dateOfBirth),
        position: input.position,
        ageGroup: input.ageGroup || 'U18',
        jerseyNumber: input.jerseyNumber,
        height: input.height,
        weight: input.weight,
        nationality: input.nationality,
        phone: input.phone,
        status: 'active',
        teamType: 'academy',
        joinDate: new Date(),
      });
      const newPlayerId = (result as any).insertId;
      if (input.teamId && newPlayerId) {
        const [team] = await db
          .select()
          .from(coachPrivateTeams)
          .where(and(eq(coachPrivateTeams.id, input.teamId), eq(coachPrivateTeams.coachId, ctx.user.id)));
        if (team) {
          await db.insert(coachPrivateTeamMembers).values({
            teamId: input.teamId,
            playerId: newPlayerId,
          });
        }
      }
      return { success: true, playerId: newPlayerId };
    }),
});
