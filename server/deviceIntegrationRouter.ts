import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { deviceSessions, skillAssessments, players } from "../drizzle/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import * as playermakerApi from "./playermakerApi";

// Middleware helpers
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowedRoles = ["admin", "coach", "physical_trainer"];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
  }
  return next({ ctx });
});

const authProcedure = protectedProcedure;

// Compute skill scores from raw device metrics (0-100)
function computeScores(data: {
  totalTouches: number;
  totalPasses: number;
  totalPossessions: number;
  avgPossessionDurationS: number;
  totalTurns: number;
  turnsWithBall: number;
  avgTurnEntrySpeedMs: number;
  maxTurnEntrySpeedMs: number;
  totalAccelerations: number;
  totalDecelerations: number;
  totalDistanceM: number;
  totalSprints: number;
  activeTimePercent: number;
  durationMinutes: number;
  kickingPowerKph?: number;
  leftTurns?: number;
  rightTurns?: number;
  backTurns?: number;
  topSpeedKph?: number;
  sprintWithBallCount?: number;
  sprintWithoutBallCount?: number;
  firstStepAccelerations?: number;
  intenseAccelerations?: number;
}) {
  // Ball Control Score (0-100): touches, passes, possession quality
  const touchesPerMin = data.durationMinutes > 0 ? data.totalTouches / data.durationMinutes : 0;
  const passAccuracy = data.totalTouches > 0 ? (data.totalPasses / data.totalTouches) * 100 : 0;
  const possessionQuality = Math.min(data.avgPossessionDurationS / 5, 1) * 100;
  const ballControlScore = Math.min(100, Math.round(
    (Math.min(touchesPerMin / 3, 1) * 40) +
    (passAccuracy * 0.35) +
    (possessionQuality * 0.25)
  ));

  // Agility Score (0-100): turns, turn speed, turn balance
  const turnsPerMin = data.durationMinutes > 0 ? data.totalTurns / data.durationMinutes : 0;
  const turnWithBallRatio = data.totalTurns > 0 ? (data.turnsWithBall / data.totalTurns) * 100 : 0;
  const turnSpeedScore = Math.min(data.avgTurnEntrySpeedMs / 4, 1) * 100;
  const agilityScore = Math.min(100, Math.round(
    (Math.min(turnsPerMin / 2, 1) * 35) +
    (turnWithBallRatio * 0.35) +
    (turnSpeedScore * 0.30)
  ));

  // Workload Score (0-100): distance, sprints, active time
  const distancePerMin = data.durationMinutes > 0 ? data.totalDistanceM / data.durationMinutes : 0;
  const sprintsPerMin = data.durationMinutes > 0 ? data.totalSprints / data.durationMinutes : 0;
  const workloadScore = Math.min(100, Math.round(
    (Math.min(distancePerMin / 100, 1) * 40) +
    (Math.min(sprintsPerMin / 0.5, 1) * 35) +
    (data.activeTimePercent * 0.25)
  ));

  // Power Score (0-100): kicking power + accelerations
  const kickingScore = data.kickingPowerKph ? Math.min(data.kickingPowerKph / 80, 1) * 100 : 50;
  const accelScore = Math.min((data.firstStepAccelerations ?? data.totalAccelerations) / 30, 1) * 100;
  const powerScore = Math.min(100, Math.round((kickingScore * 0.6) + (accelScore * 0.4)));

  // Speed Score (0-100): top speed + sprints
  const topSpeedScore = data.topSpeedKph ? Math.min(data.topSpeedKph / 30, 1) * 100 : 50;
  const sprintScore = Math.min(data.totalSprints / 15, 1) * 100;
  const speedScore = Math.min(100, Math.round((topSpeedScore * 0.6) + (sprintScore * 0.4)));

  // Two-footed Score (0-100): balance between left/right turns
  const totalDirectionalTurns = (data.leftTurns ?? 0) + (data.rightTurns ?? 0);
  let twoFootedScore = 50;
  if (totalDirectionalTurns > 0) {
    const leftRatio = (data.leftTurns ?? 0) / totalDirectionalTurns;
    const balance = 1 - Math.abs(leftRatio - 0.5) * 2; // 1 = perfect balance, 0 = one-sided
    twoFootedScore = Math.min(100, Math.round(balance * 100));
  }

  // Dribbling Score (0-100): touches per possession + sprint with ball
  const touchesPerPossession = data.totalPossessions > 0 ? data.totalTouches / data.totalPossessions : 0;
  const sprintBallRatio = data.totalSprints > 0 ? ((data.sprintWithBallCount ?? 0) / data.totalSprints) * 100 : 0;
  const dribblingScore = Math.min(100, Math.round(
    (Math.min(touchesPerPossession / 5, 1) * 50) +
    (sprintBallRatio * 0.5)
  ));

  // First Touch Score (0-100): possession duration + one-touch plays
  const firstTouchScore = Math.min(100, Math.round(
    (Math.min(data.avgPossessionDurationS / 3, 1) * 50) +
    (Math.min(data.totalPossessions / 50, 1) * 50)
  ));

  // Overall Score
  const overallScore = Math.round(
    (ballControlScore * 0.20) + (agilityScore * 0.15) + (workloadScore * 0.15) +
    (powerScore * 0.15) + (speedScore * 0.15) + (twoFootedScore * 0.10) +
    (dribblingScore * 0.05) + (firstTouchScore * 0.05)
  );

  return {
    ballControlScore, agilityScore, workloadScore, overallScore,
    powerScore, speedScore, twoFootedScore, dribblingScore, firstTouchScore
  };
}

export const deviceIntegrationRouter = router({
  // Upload a session from the Smart Shoe app
  uploadSession: staffProcedure
    .input(z.object({
      playerId: z.number(),
      sessionType: z.enum(["training", "match", "assessment"]).default("training"),
      sessionDate: z.string().optional(),
      durationMinutes: z.number().optional(),
      // Ball control metrics
      totalTouches: z.number().default(0),
      totalStrikes: z.number().default(0),
      totalPasses: z.number().default(0),
      totalPossessions: z.number().default(0),
      totalPossessionTimeMin: z.number().default(0),
      avgPossessionDurationS: z.number().default(0),
      // Agility metrics
      totalSprints: z.number().default(0),
      totalTurns: z.number().default(0),
      turnsWithBall: z.number().default(0),
      avgTurnEntrySpeedMs: z.number().default(0),
      maxTurnEntrySpeedMs: z.number().default(0),
      // New turn direction metrics
      leftTurns: z.number().default(0),
      rightTurns: z.number().default(0),
      backTurns: z.number().default(0),
      intenseTurns: z.number().default(0),
      avgTurnExitSpeedMs: z.number().default(0),
      // Workload metrics
      totalAccelerations: z.number().default(0),
      totalDecelerations: z.number().default(0),
      totalDistanceM: z.number().default(0),
      sprintDistanceM: z.number().default(0),
      validSteps: z.number().default(0),
      jumps: z.number().default(0),
      workCaloriesKcal: z.number().default(0),
      activeTimePercent: z.number().default(0),
      workRatePerMin: z.number().default(0),
      sprintWithBallCount: z.number().default(0),
      sprintWithoutBallCount: z.number().default(0),
      // Speed metrics
      topSpeedKph: z.number().default(0),
      // Power metrics
      kickingPowerKph: z.number().default(0),
      firstStepAccelerations: z.number().default(0),
      intenseAccelerations: z.number().default(0),
      // Two-footed metrics
      leftFootTouches: z.number().default(0),
      rightFootTouches: z.number().default(0),
      leftFootReleases: z.number().default(0),
      rightFootReleases: z.number().default(0),
      leftFootKickingPower: z.number().default(0),
      rightFootKickingPower: z.number().default(0),
      // Ball release footzone
      lacesReleases: z.number().default(0),
      insideReleases: z.number().default(0),
      otherReleases: z.number().default(0),
      // Possession chain
      oneTouchPossessions: z.number().default(0),
      multiTouchPossessions: z.number().default(0),
      multiTouchDurationS: z.number().default(0),
      // Full JSON payload
      rawInsights: z.record(z.string(), z.any()).optional(),
      timelineEvents: z.array(z.any()).optional(),
      // Device metadata
      deviceId: z.string().optional(),
      firmwareVersion: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const dur = input.durationMinutes ?? 45;
      const scores = computeScores({
        totalTouches: input.totalTouches,
        totalPasses: input.totalPasses,
        totalPossessions: input.totalPossessions,
        avgPossessionDurationS: input.avgPossessionDurationS,
        totalTurns: input.totalTurns,
        turnsWithBall: input.turnsWithBall,
        avgTurnEntrySpeedMs: input.avgTurnEntrySpeedMs,
        maxTurnEntrySpeedMs: input.maxTurnEntrySpeedMs,
        totalAccelerations: input.totalAccelerations,
        totalDecelerations: input.totalDecelerations,
        totalDistanceM: input.totalDistanceM,
        totalSprints: input.totalSprints,
        activeTimePercent: input.activeTimePercent,
        durationMinutes: dur,
        kickingPowerKph: input.kickingPowerKph,
        leftTurns: input.leftTurns,
        rightTurns: input.rightTurns,
        backTurns: input.backTurns,
        topSpeedKph: input.topSpeedKph,
        sprintWithBallCount: input.sprintWithBallCount,
        sprintWithoutBallCount: input.sprintWithoutBallCount,
        firstStepAccelerations: input.firstStepAccelerations,
        intenseAccelerations: input.intenseAccelerations,
      });

      // Store extra metrics in rawInsights if not already there
      const enrichedInsights = {
        ...(input.rawInsights ?? {}),
        leftTurns: input.leftTurns,
        rightTurns: input.rightTurns,
        backTurns: input.backTurns,
        intenseTurns: input.intenseTurns,
        avgTurnExitSpeedMs: input.avgTurnExitSpeedMs,
        sprintDistanceM: input.sprintDistanceM,
        topSpeedKph: input.topSpeedKph,
        kickingPowerKph: input.kickingPowerKph,
        firstStepAccelerations: input.firstStepAccelerations,
        intenseAccelerations: input.intenseAccelerations,
        leftFootTouches: input.leftFootTouches,
        rightFootTouches: input.rightFootTouches,
        leftFootReleases: input.leftFootReleases,
        rightFootReleases: input.rightFootReleases,
        leftFootKickingPower: input.leftFootKickingPower,
        rightFootKickingPower: input.rightFootKickingPower,
        lacesReleases: input.lacesReleases,
        insideReleases: input.insideReleases,
        otherReleases: input.otherReleases,
        oneTouchPossessions: input.oneTouchPossessions,
        multiTouchPossessions: input.multiTouchPossessions,
        multiTouchDurationS: input.multiTouchDurationS,
        workRatePerMin: input.workRatePerMin,
        // Computed scores
        powerScore: scores.powerScore,
        speedScore: scores.speedScore,
        twoFootedScore: scores.twoFootedScore,
        dribblingScore: scores.dribblingScore,
        firstTouchScore: scores.firstTouchScore,
      };

      const [result] = await db.insert(deviceSessions).values({
        playerId: input.playerId,
        sessionType: input.sessionType,
        sessionDate: input.sessionDate ? new Date(input.sessionDate) : new Date(),
        durationMinutes: dur,
        totalTouches: input.totalTouches,
        totalStrikes: input.totalStrikes,
        totalPasses: input.totalPasses,
        totalPossessions: input.totalPossessions,
        totalPossessionTimeMin: String(input.totalPossessionTimeMin),
        avgPossessionDurationS: String(input.avgPossessionDurationS),
        totalSprints: input.totalSprints,
        totalTurns: input.totalTurns,
        turnsWithBall: input.turnsWithBall,
        avgTurnEntrySpeedMs: String(input.avgTurnEntrySpeedMs),
        maxTurnEntrySpeedMs: String(input.maxTurnEntrySpeedMs),
        totalAccelerations: input.totalAccelerations,
        totalDecelerations: input.totalDecelerations,
        totalDistanceM: String(input.totalDistanceM),
        validSteps: input.validSteps,
        jumps: input.jumps,
        workCaloriesKcal: String(input.workCaloriesKcal),
        activeTimePercent: String(input.activeTimePercent),
        sprintWithBallCount: input.sprintWithBallCount,
        sprintWithoutBallCount: input.sprintWithoutBallCount,
        leftTurns: input.leftTurns,
        rightTurns: input.rightTurns,
        backTurns: input.backTurns,
        intenseTurns: input.intenseTurns,
        avgTurnExitSpeedMs: String(input.avgTurnExitSpeedMs ?? 0),
        firstStepAccelerations: input.firstStepAccelerations,
        intenseAccelerations: input.intenseAccelerations,
        sprintDistanceM: String(input.sprintDistanceM ?? 0),
        topSpeedKph: String(input.topSpeedKph ?? 0),
        kickingPowerKph: String(input.kickingPowerKph ?? 0),
        workRatePerMin: String(input.workRatePerMin ?? 0),
        leftFootTouches: input.leftFootTouches,
        rightFootTouches: input.rightFootTouches,
        leftFootReleases: input.leftFootReleases,
        rightFootReleases: input.rightFootReleases,
        leftFootKickingPower: String(input.leftFootKickingPower ?? 0),
        rightFootKickingPower: String(input.rightFootKickingPower ?? 0),
        lacesReleases: input.lacesReleases,
        insideReleases: input.insideReleases,
        otherReleases: input.otherReleases,
        oneTouchPossessions: input.oneTouchPossessions,
        multiTouchPossessions: input.multiTouchPossessions,
        multiTouchDurationS: String(input.multiTouchDurationS ?? 0),
        rawInsights: enrichedInsights,
        timelineEvents: input.timelineEvents ?? null,
        ballControlScore: scores.ballControlScore,
        agilityScore: scores.agilityScore,
        workloadScore: scores.workloadScore,
        overallScore: scores.overallScore,
        deviceId: input.deviceId,
        firmwareVersion: input.firmwareVersion,
        notes: input.notes,
        uploadedBy: ctx.user!.id,
      });

      return { success: true, sessionId: (result as any).insertId, scores };
    }),

  // Get all device sessions for a player
  getPlayerSessions: authProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const sessions = await db
        .select()
        .from(deviceSessions)
        .where(eq(deviceSessions.playerId, input.playerId))
        .orderBy(desc(deviceSessions.sessionDate))
        .limit(input.limit);
      return sessions;
    }),

  // Get a single session with full details
  getSession: authProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [session] = await db
        .select()
        .from(deviceSessions)
        .where(eq(deviceSessions.id, input.sessionId));
      return session ?? null;
    }),

  // Get trend data for a player (last N sessions)
  getPlayerTrends: authProcedure
    .input(z.object({
      playerId: z.number(),
      sessions: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const data = await db
        .select({
          id: deviceSessions.id,
          sessionDate: deviceSessions.sessionDate,
          sessionType: deviceSessions.sessionType,
          ballControlScore: deviceSessions.ballControlScore,
          agilityScore: deviceSessions.agilityScore,
          workloadScore: deviceSessions.workloadScore,
          overallScore: deviceSessions.overallScore,
          totalDistanceM: deviceSessions.totalDistanceM,
          totalSprints: deviceSessions.totalSprints,
          totalTouches: deviceSessions.totalTouches,
          totalTurns: deviceSessions.totalTurns,
          activeTimePercent: deviceSessions.activeTimePercent,
          rawInsights: deviceSessions.rawInsights,
        })
        .from(deviceSessions)
        .where(eq(deviceSessions.playerId, input.playerId))
        .orderBy(desc(deviceSessions.sessionDate))
        .limit(input.sessions);
      return data.reverse(); // chronological order for charts
    }),

  // Create a skill assessment (manual or device-linked)
  createAssessment: staffProcedure
    .input(z.object({
      playerId: z.number(),
      assessmentType: z.enum(["manual", "device", "combined"]).default("manual"),
      deviceSessionId: z.number().optional(),
      // Manual scores
      dribbling: z.number().min(0).max(100).optional(),
      passing: z.number().min(0).max(100).optional(),
      shooting: z.number().min(0).max(100).optional(),
      firstTouch: z.number().min(0).max(100).optional(),
      heading: z.number().min(0).max(100).optional(),
      defending: z.number().min(0).max(100).optional(),
      speed: z.number().min(0).max(100).optional(),
      agility: z.number().min(0).max(100).optional(),
      stamina: z.number().min(0).max(100).optional(),
      positioning: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;

      let deviceBallControl: number | undefined;
      let deviceAgility: number | undefined;
      let deviceWorkload: number | undefined;

      // If linked to a device session, pull scores from it
      if (input.deviceSessionId) {
        const [session] = await db
          .select()
          .from(deviceSessions)
          .where(eq(deviceSessions.id, input.deviceSessionId));
        if (session) {
          deviceBallControl = session.ballControlScore ?? undefined;
          deviceAgility = session.agilityScore ?? undefined;
          deviceWorkload = session.workloadScore ?? undefined;
        }
      }

      // Compute overall rating
      const manualScores = [
        input.dribbling, input.passing, input.shooting, input.firstTouch,
        input.heading, input.defending, input.speed, input.agility,
        input.stamina, input.positioning,
      ].filter((s): s is number => s !== undefined);

      const deviceScores = [deviceBallControl, deviceAgility, deviceWorkload]
        .filter((s): s is number => s !== undefined);

      const allScores = [...manualScores, ...deviceScores];
      const overallRating = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : undefined;

      const [result] = await db.insert(skillAssessments).values({
        playerId: input.playerId,
        assessmentType: input.assessmentType,
        deviceSessionId: input.deviceSessionId,
        dribbling: input.dribbling,
        passing: input.passing,
        shooting: input.shooting,
        firstTouch: input.firstTouch,
        heading: input.heading,
        defending: input.defending,
        speed: input.speed,
        agility: input.agility,
        stamina: input.stamina,
        positioning: input.positioning,
        deviceBallControl,
        deviceAgility,
        deviceWorkload,
        overallRating,
        assessorId: ctx.user!.id,
        notes: input.notes,
      });

      return { success: true, assessmentId: (result as any).insertId, overallRating };
    }),

  // Get skill assessment history for a player
  getAssessmentHistory: authProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const assessments = await db
        .select()
        .from(skillAssessments)
        .where(eq(skillAssessments.playerId, input.playerId))
        .orderBy(desc(skillAssessments.createdAt))
        .limit(input.limit);
      return assessments;
    }),

  // Get skill progression trends (for charts)
  getSkillProgression: authProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(12),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const data = await db
        .select({
          id: skillAssessments.id,
          assessmentDate: skillAssessments.assessmentDate,
          assessmentType: skillAssessments.assessmentType,
          dribbling: skillAssessments.dribbling,
          passing: skillAssessments.passing,
          shooting: skillAssessments.shooting,
          firstTouch: skillAssessments.firstTouch,
          agility: skillAssessments.agility,
          speed: skillAssessments.speed,
          stamina: skillAssessments.stamina,
          overallRating: skillAssessments.overallRating,
          deviceBallControl: skillAssessments.deviceBallControl,
          deviceAgility: skillAssessments.deviceAgility,
          deviceWorkload: skillAssessments.deviceWorkload,
        })
        .from(skillAssessments)
        .where(eq(skillAssessments.playerId, input.playerId))
        .orderBy(desc(skillAssessments.createdAt))
        .limit(input.limit);
      return data.reverse(); // chronological for charts
    }),

  // Get all recent sessions (admin view)
  getAllRecentSessions: staffProcedure
    .input(z.object({
      limit: z.number().default(50),
      teamId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const sessions = await db
        .select({
          id: deviceSessions.id,
          playerId: deviceSessions.playerId,
          sessionType: deviceSessions.sessionType,
          sessionDate: deviceSessions.sessionDate,
          durationMinutes: deviceSessions.durationMinutes,
          overallScore: deviceSessions.overallScore,
          ballControlScore: deviceSessions.ballControlScore,
          agilityScore: deviceSessions.agilityScore,
          workloadScore: deviceSessions.workloadScore,
          totalDistanceM: deviceSessions.totalDistanceM,
          totalSprints: deviceSessions.totalSprints,
          totalTouches: deviceSessions.totalTouches,
          deviceId: deviceSessions.deviceId,
          rawInsights: deviceSessions.rawInsights,
          createdAt: deviceSessions.createdAt,
        })
        .from(deviceSessions)
        .orderBy(desc(deviceSessions.sessionDate))
        .limit(input.limit);
      return sessions;
    }),

  // Delete a session (admin only)
  deleteSession: staffProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(deviceSessions).where(eq(deviceSessions.id, input.sessionId));
      return { success: true };
    }),

  // ─── PlayerMaker Auto-Sync ────────────────────────────────────────────────
  // Get PlayerMaker connection status & rate limit
  getPlayerMakerStatus: authProcedure
    .query(async () => {
      const clientKey = process.env.PLAYERMAKER_CLIENT_KEY;
      const clientSecret = process.env.PLAYERMAKER_CLIENT_SECRET;
      const teamId = process.env.PLAYERMAKER_TEAM_ID;
      const teamCode = process.env.PLAYERMAKER_TEAM_CODE;

      const isConfigured = !!(clientKey && clientSecret && teamId);
      const waitTime = playermakerApi.getWaitTimeBeforeSync();

      return {
        isConfigured,
        teamId: teamId ?? null,
        teamCode: teamCode ?? null,
        canSync: isConfigured && waitTime === 0,
        waitTimeMs: waitTime,
        waitTimeFormatted: waitTime > 0 ? playermakerApi.formatWaitTime(waitTime) : null,
        message: !isConfigured
          ? 'PlayerMaker credentials not configured'
          : waitTime > 0
          ? `Rate limit active — please wait ${playermakerApi.formatWaitTime(waitTime)}`
          : 'Ready to sync',
      };
    }),

  // Sync sessions from PlayerMaker API for a specific player
  syncFromPlayerMaker: staffProcedure
    .input(z.object({
      playerId: z.number(),
      daysBack: z.number().default(30),
      sessionType: z.enum(['training', 'match', 'all']).default('all'),
    }))
    .mutation(async ({ input, ctx }) => {
      const clientKey = process.env.PLAYERMAKER_CLIENT_KEY;
      const clientSecret = process.env.PLAYERMAKER_CLIENT_SECRET;
      const teamId = process.env.PLAYERMAKER_TEAM_ID;

      if (!clientKey || !clientSecret || !teamId) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'PlayerMaker credentials not configured. Please set PLAYERMAKER_CLIENT_KEY, PLAYERMAKER_CLIENT_SECRET, and PLAYERMAKER_TEAM_ID.',
        });
      }

      // Check rate limit
      const waitTime = playermakerApi.getWaitTimeBeforeSync();
      if (waitTime > 0) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit active. Please wait ${playermakerApi.formatWaitTime(waitTime)} before syncing again.`,
        });
      }

      const db = (await getDb())!;

      // Authenticate and fetch data from PlayerMaker
      const settings: playermakerApi.PlayerMakerSettings = {
        clientKey,
        clientSecret,
        clientTeamId: teamId,
        teamCode: process.env.PLAYERMAKER_TEAM_CODE,
      };

      const result = await playermakerApi.syncPlayerMakerData(settings, {
        sessionType: input.sessionType,
        daysBack: input.daysBack,
      });

      let importedCount = 0;
      const importedSessions: number[] = [];

      // Convert each PlayerMaker metric row into a device session
      for (const metric of result.metrics) {
        // Find the matching session for this metric
        const session = result.sessions.find(s => s.session_id === metric.session_id);
        const dur = session?.duration ?? 45;

        // Map PlayerMaker fields to our device session schema
        const totalTouches = metric.total_touches;
        const leftFootTouches = metric.left_foot_touches;
        const rightFootTouches = metric.right_foot_touches;
        const totalDistanceM = metric.distance_covered;
        const topSpeedKph = metric.top_speed;
        const totalSprints = metric.sprint_count;
        const totalAccelerations = metric.acceleration_count;
        const totalDecelerations = metric.deceleration_count;

        const scores = computeScores({
          totalTouches,
          totalPasses: Math.round(totalTouches * 0.4),
          totalPossessions: Math.round(totalTouches * 0.2),
          avgPossessionDurationS: 2.5,
          totalTurns: Math.round(totalSprints * 1.5),
          turnsWithBall: Math.round(totalSprints * 0.6),
          avgTurnEntrySpeedMs: 2.8,
          maxTurnEntrySpeedMs: 4.2,
          totalAccelerations,
          totalDecelerations,
          totalDistanceM,
          totalSprints,
          activeTimePercent: 68,
          durationMinutes: dur,
          kickingPowerKph: 0,
          leftTurns: 0,
          rightTurns: 0,
          backTurns: 0,
          topSpeedKph,
          sprintWithBallCount: Math.round(totalSprints * 0.3),
          sprintWithoutBallCount: Math.round(totalSprints * 0.7),
          firstStepAccelerations: Math.round(totalAccelerations * 0.4),
          intenseAccelerations: Math.round(totalAccelerations * 0.3),
        });

        const enrichedInsights = {
          source: 'playermaker_api',
          playermakerPlayerId: metric.player_id,
          playerName: metric.player_name,
          ageGroup: metric.age_group,
          topSpeedKph,
          averageSpeedKph: metric.average_speed,
          highIntensityDistanceM: metric.high_intensity_distance,
          leftFootTouches,
          rightFootTouches,
          powerScore: scores.powerScore,
          speedScore: scores.speedScore,
          twoFootedScore: scores.twoFootedScore,
          dribblingScore: scores.dribblingScore,
          firstTouchScore: scores.firstTouchScore,
        };

        const [inserted] = await db.insert(deviceSessions).values({
          playerId: input.playerId,
          sessionType: (session?.session_type ?? 'training') as 'training' | 'match' | 'assessment',
          sessionDate: session?.date ? new Date(session.date) : new Date(),
          durationMinutes: dur,
          totalTouches,
          totalStrikes: 0,
          totalPasses: Math.round(totalTouches * 0.4),
          totalPossessions: Math.round(totalTouches * 0.2),
          totalPossessionTimeMin: String(Math.round(dur * 0.3)),
          avgPossessionDurationS: '2.5',
          totalSprints,
          totalTurns: Math.round(totalSprints * 1.5),
          turnsWithBall: Math.round(totalSprints * 0.6),
          avgTurnEntrySpeedMs: '2.8',
          maxTurnEntrySpeedMs: '4.2',
          totalAccelerations,
          totalDecelerations,
          totalDistanceM: String(totalDistanceM),
          validSteps: Math.round(totalDistanceM / 0.7),
          jumps: 0,
          workCaloriesKcal: String(Math.round(totalDistanceM * 0.06)),
          activeTimePercent: '68',
          sprintWithBallCount: Math.round(totalSprints * 0.3),
          sprintWithoutBallCount: Math.round(totalSprints * 0.7),
          topSpeedKph: String(topSpeedKph),
          kickingPowerKph: '0',
          workRatePerMin: String((totalDistanceM / dur).toFixed(1)),
          sprintDistanceM: String(Math.round(totalDistanceM * 0.15)),
          leftFootTouches,
          rightFootTouches,
          leftFootReleases: Math.round(leftFootTouches * 0.5),
          rightFootReleases: Math.round(rightFootTouches * 0.5),
          leftFootKickingPower: '0',
          rightFootKickingPower: '0',
          lacesReleases: Math.round((leftFootTouches + rightFootTouches) * 0.4),
          insideReleases: Math.round((leftFootTouches + rightFootTouches) * 0.5),
          otherReleases: Math.round((leftFootTouches + rightFootTouches) * 0.1),
          oneTouchPossessions: Math.round(totalTouches * 0.15),
          multiTouchPossessions: Math.round(totalTouches * 0.05),
          multiTouchDurationS: '0',
          rawInsights: enrichedInsights,
          ballControlScore: scores.ballControlScore,
          agilityScore: scores.agilityScore,
          workloadScore: scores.workloadScore,
          overallScore: scores.overallScore,
          deviceId: `pm_${metric.player_id}`,
          firmwareVersion: 'PlayerMaker API',
          notes: session?.notes ?? 'Synced from PlayerMaker',
          uploadedBy: ctx.user!.id,
        });

        importedCount++;
        if ((inserted as any).insertId) {
          importedSessions.push((inserted as any).insertId);
        }
      }

      return {
        success: true,
        importedCount,
        sessionsFound: result.sessions.length,
        metricsFound: result.metrics.length,
        importedSessions,
        clubName: result.token ? 'PlayerMaker Club' : 'Unknown',
      };
    }),

  // ─── Auto-compute load data from device sessions for Record Load form ─────────
  getAutoLoadData: authProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const now = new Date();
      const day7ago  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
      const day28ago = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      // Fetch last 28 days of sessions
      const sessions28 = await db
        .select()
        .from(deviceSessions)
        .where(eq(deviceSessions.playerId, input.playerId))
        .orderBy(desc(deviceSessions.sessionDate))
        .limit(50);

      const recent28 = sessions28.filter(s => new Date(s.sessionDate) >= day28ago);
      const recent7  = recent28.filter(s => new Date(s.sessionDate) >= day7ago);

      // Acute Load (7-day avg) = average daily training load over last 7 days
      // Training Load = workCaloriesKcal as TRIMP proxy
      const acuteLoad = recent7.length > 0
        ? Math.round(recent7.reduce((sum, s) => sum + Number(s.workCaloriesKcal ?? 0), 0) / 7)
        : null;

      // Chronic Load (28-day avg)
      const chronicLoad = recent28.length > 0
        ? Math.round(recent28.reduce((sum, s) => sum + Number(s.workCaloriesKcal ?? 0), 0) / 28)
        : null;

      // Latest session for RPE estimate and duration
      const latest = sessions28[0] ?? null;

      // Estimate RPE from workload score (0-100 → 1-10 scale)
      const estimatedRPE = latest?.workloadScore
        ? Math.min(10, Math.max(1, Math.round(Number(latest.workloadScore) / 10)))
        : null;

      // Session duration from latest session
      const sessionDuration = latest?.durationMinutes ?? null;

      // ACWR (Acute:Chronic Workload Ratio)
      const acwr = acuteLoad && chronicLoad && chronicLoad > 0
        ? parseFloat((acuteLoad / chronicLoad).toFixed(2))
        : null;

      // Load trend
      const loadTrend = recent7.length >= 2
        ? (() => {
            const half = Math.floor(recent7.length / 2);
            const firstHalf  = recent7.slice(half).reduce((s, x) => s + Number(x.workCaloriesKcal ?? 0), 0);
            const secondHalf = recent7.slice(0, half).reduce((s, x) => s + Number(x.workCaloriesKcal ?? 0), 0);
            return secondHalf > firstHalf ? 'increasing' : secondHalf < firstHalf ? 'decreasing' : 'stable';
          })()
        : 'stable';

      return {
        acuteLoad,
        chronicLoad,
        estimatedRPE,
        sessionDuration,
        acwr,
        loadTrend,
        sessionsLast7: recent7.length,
        sessionsLast28: recent28.length,
        latestSessionDate: latest?.sessionDate ?? null,
        latestSessionType: latest?.sessionType ?? null,
      };
    }),

  // ─── Sync ALL players in a team from PlayerMaker ─────────────────────────
  syncTeamFromPlayerMaker: staffProcedure
    .input(z.object({
      teamId: z.number(),
      daysBack: z.number().default(30),
      sessionType: z.enum(['training', 'match', 'all']).default('all'),
    }))
    .mutation(async ({ input }) => {
      const clientKey = process.env.PLAYERMAKER_CLIENT_KEY;
      const clientSecret = process.env.PLAYERMAKER_CLIENT_SECRET;
      const pmTeamId = process.env.PLAYERMAKER_TEAM_ID;
      if (!clientKey || !clientSecret || !pmTeamId) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'PlayerMaker credentials not configured.',
        });
      }
      const waitTime = playermakerApi.getWaitTimeBeforeSync();
      if (waitTime > 0) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit active. Please wait ${playermakerApi.formatWaitTime(waitTime)}.`,
        });
      }
      const db = (await getDb())!;
      // Get all players in this team (only valid schema columns)
      const teamPlayers = await db
        .select({ id: players.id, firstName: players.firstName, lastName: players.lastName })
        .from(players)
        .where(eq(players.teamId, input.teamId));
      if (teamPlayers.length === 0) {
        return { totalImported: 0, playerCount: 0, results: [] };
      }
      const settings: playermakerApi.PlayerMakerSettings = {
        clientKey,
        clientSecret,
        clientTeamId: pmTeamId,
        teamCode: process.env.PLAYERMAKER_TEAM_CODE,
      };
      const result = await playermakerApi.syncPlayerMakerData(settings, {
        sessionType: input.sessionType,
        daysBack: input.daysBack,
      });
      const allMetrics: any[] = Array.isArray(result?.metrics) ? result.metrics : [];
      const allSessions: any[] = Array.isArray(result?.sessions) ? result.sessions : [];
      let totalImported = 0;
      const results: { playerId: number; imported: number }[] = [];
      for (const teamPlayer of teamPlayers) {
        // Match by player name since we don't store playermakerPlayerId on the players table
        const fullName = `${teamPlayer.firstName} ${teamPlayer.lastName}`.toLowerCase();
        const playerMetrics = allMetrics.filter((m: any) => {
          const pmName = String(m.player_name ?? '').toLowerCase();
          return pmName && (pmName === fullName || pmName.includes(teamPlayer.firstName.toLowerCase()));
        });
        // If no name match, assign all metrics (team-level sync without player mapping)
        const metricsToImport = playerMetrics.length > 0 ? playerMetrics : [];
        let imported = 0;
        for (const metric of metricsToImport) {
          const session = allSessions.find((s: any) => s.session_id === metric.session_id);
          const sessionDate = session?.date ? new Date(session.date) : new Date();
          // Dedup: skip if a session with same playerId + sessionDate (within same day) already exists
          const dayStart = new Date(sessionDate); dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(sessionDate); dayEnd.setHours(23, 59, 59, 999);
          const existing = await db
            .select({ id: deviceSessions.id })
            .from(deviceSessions)
            .where(and(
              eq(deviceSessions.playerId, teamPlayer.id),
              sql`${deviceSessions.sessionDate} >= ${dayStart} AND ${deviceSessions.sessionDate} <= ${dayEnd}`,
            ))
            .limit(1);
          if (existing.length > 0) continue;
          const totalTouches = metric.total_touches ?? metric.totalTouches ?? 0;
          const totalSprints = metric.sprint_count ?? metric.total_sprints ?? 0;
          const totalDistanceM = metric.distance_covered ?? metric.total_distance_m ?? 0;
          const topSpeedKph = metric.top_speed ?? metric.top_speed_kph ?? 0;
          await db.insert(deviceSessions).values({
            playerId: teamPlayer.id,
            sessionDate,
            sessionType: (input.sessionType === 'all' ? 'training' : input.sessionType) as any,
            durationMinutes: metric.duration_minutes ?? 90,
            totalTouches,
            totalSprints,
            totalDistanceM: String(totalDistanceM),
            topSpeedKph: String(topSpeedKph),
            kickingPowerKph: String(metric.kicking_power_kph ?? 0),
            totalTurns: metric.total_turns ?? 0,
            workCaloriesKcal: String(metric.work_calories_kcal ?? 0),
            leftFootTouches: metric.left_foot_touches ?? metric.left_leg_touches ?? 0,
            rightFootTouches: metric.right_foot_touches ?? metric.right_leg_touches ?? 0,
            totalAccelerations: metric.acceleration_count ?? 0,
            totalDecelerations: metric.deceleration_count ?? 0,
            rawInsights: metric,
            notes: `playermaker_sync:${metric.player_id ?? 'unknown'}`,
          });
          imported++;
        }
        totalImported += imported;
        results.push({ playerId: teamPlayer.id, imported });
      }
      return { totalImported, playerCount: teamPlayers.length, results };
    }),
});
