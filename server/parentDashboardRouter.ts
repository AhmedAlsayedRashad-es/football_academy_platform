import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';

// Parent-only procedure
const parentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'parent') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent access required' });
  }
  return next({ ctx });
});
import { getDb } from './db';
import { 
  parentPlayerRelations, 
  players, 
  playerSkillScores, 
  privateTrainingBookings, 
  notifications,
  playerActivities,
  coachProfiles,
  users,
  teams,
  attendance,
  coachFeedback,
  injuries,
  playerFees,
  playerMatchStats,
  matches,
  trainingSessions,
} from '../drizzle/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export const parentDashboardRouter = router({
  /**
   * Get comprehensive dashboard data for parent
   * Returns all children with their latest stats, upcoming sessions, and recent notifications
   */
  getDashboardData: parentProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;

    // Get all children linked to this parent
    const childRelations = await database
      .select({
        playerId: parentPlayerRelations.playerId,
        relationshipType: parentPlayerRelations.relationship,
        firstName: players.firstName,
        lastName: players.lastName,
        dateOfBirth: players.dateOfBirth,
        position: players.position,
        teamId: players.teamId,
        photoUrl: players.photoUrl,
        ageGroup: players.ageGroup,
        status: players.status,
      })
      .from(parentPlayerRelations)
      .leftJoin(players, eq(parentPlayerRelations.playerId, players.id))
      .where(eq(parentPlayerRelations.parentUserId, userId));

    // Get latest skills for each child
    const childrenWithStats = await Promise.all(
      childRelations.map(async (child) => {
        if (!child.playerId) return null;

        // Latest skill assessment
        const latestSkills = await database
          .select()
          .from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, child.playerId))
          .orderBy(desc(playerSkillScores.id))
          .limit(1);

        // Count activities in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const recentActivities = await database
          .select({ count: sql<number>`count(*)` })
          .from(playerActivities)
          .where(
            and(
              eq(playerActivities.playerId, child.playerId),
              gte(playerActivities.activityDate, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            )
          );

        // Get team name
        let teamName = null;
        if (child.teamId) {
          const teamResult = await database.select({ name: teams.name }).from(teams).where(eq(teams.id, child.teamId)).limit(1);
          teamName = teamResult[0]?.name || null;
        }

        return {
          playerId: child.playerId,
          relationshipType: child.relationshipType,
          playerName: `${child.firstName || ''} ${child.lastName || ''}`.trim(),
          firstName: child.firstName,
          lastName: child.lastName,
          playerAge: child.dateOfBirth ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          playerPosition: child.position,
          playerTeam: teamName,
          playerPhoto: child.photoUrl,
          ageGroup: child.ageGroup,
          status: child.status,
          overallRating: latestSkills[0]?.overallRating || 0,
          technicalAvg: latestSkills[0]?.technicalOverall || 0,
          physicalAvg: latestSkills[0]?.physicalOverall || 0,
          tacticalAvg: latestSkills[0]?.defensiveOverall || 0,
          mentalAvg: latestSkills[0]?.mentalOverall || 0,
          recentActivities: recentActivities[0]?.count || 0,
        };
      })
    );

    // Get upcoming sessions (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingSessions = await database
      .select({
        id: privateTrainingBookings.id,
        playerId: privateTrainingBookings.playerId,
        firstName: players.firstName,
        lastName: players.lastName,
        playerPhoto: players.photoUrl,
        coachId: privateTrainingBookings.coachId,
        coachName: users.name,
        /* These were `as any` casts onto columns that do not exist, so each
           resolved to undefined and Drizzle threw "Cannot convert undefined or
           null to object" while ordering the selected fields — the whole parent
           dashboard 500'd. Mapped onto the real columns instead: photoUrl (not
           profilePhoto), endTime (duration is derived), locationId (not location).
           There is no sessionType column either, but the client renders it as the
           session title and calendar event name, so it is derived — every row in
           this query is by definition a private training booking. */
        coachPhoto: coachProfiles.photoUrl,
        sessionDate: privateTrainingBookings.sessionDate,
        startTime: privateTrainingBookings.startTime,
        endTime: privateTrainingBookings.endTime,
        sessionType: sql<string>`'Private Training'`,
        status: privateTrainingBookings.status,
        locationId: privateTrainingBookings.locationId,
      })
      .from(privateTrainingBookings)
      .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
      .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
      .leftJoin(coachProfiles, eq(privateTrainingBookings.coachId, coachProfiles.userId))
      .where(
        and(
          sql`${privateTrainingBookings.playerId} IN (SELECT playerId FROM parent_player_relations WHERE parentUserId = ${userId})`,
          gte(privateTrainingBookings.sessionDate, new Date()),
          sql`${privateTrainingBookings.sessionDate} <= ${sevenDaysFromNow}`
        )
      )
      .orderBy(privateTrainingBookings.sessionDate)
      .limit(10);

    // Get recent notifications (last 30 days)
    const recentNotifications = await database
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          gte(notifications.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    // Get recent reports - TODO: Implement when progressReportHistory table is added
    const recentReports: any[] = [];

    return {
      children: childrenWithStats.filter(Boolean),
      upcomingSessions: upcomingSessions.map(s => ({ ...s, playerName: `${s.firstName || ''} ${s.lastName || ''}`.trim() })),
      recentNotifications,
      recentReports,
    };
  }),

  /**
   * Get summary of all children with key stats
   */
  getChildrenSummary: parentProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;

    const childRelations = await database
      .select({
        playerId: parentPlayerRelations.playerId,
        relationshipType: parentPlayerRelations.relationship,
        firstName: players.firstName,
        lastName: players.lastName,
        dateOfBirth: players.dateOfBirth,
        position: players.position,
        teamId: players.teamId,
        photoUrl: players.photoUrl,
        ageGroup: players.ageGroup,
        status: players.status,
      })
      .from(parentPlayerRelations)
      .leftJoin(players, eq(parentPlayerRelations.playerId, players.id))
      .where(eq(parentPlayerRelations.parentUserId, userId));

    const summaries = await Promise.all(
      childRelations.map(async (child) => {
        if (!child.playerId) return null;

        const latestSkills = await database
          .select()
          .from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, child.playerId))
          .orderBy(desc(playerSkillScores.id))
          .limit(1);

        const totalActivities = await database
          .select({ count: sql<number>`count(*)` })
          .from(playerActivities)
          .where(eq(playerActivities.playerId, child.playerId));

        let teamName = null;
        if (child.teamId) {
          const teamResult = await database.select({ name: teams.name }).from(teams).where(eq(teams.id, child.teamId)).limit(1);
          teamName = teamResult[0]?.name || null;
        }

        return {
          playerId: child.playerId,
          relationshipType: child.relationshipType,
          playerName: `${child.firstName || ''} ${child.lastName || ''}`.trim(),
          firstName: child.firstName,
          lastName: child.lastName,
          playerAge: child.dateOfBirth ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          playerPosition: child.position,
          playerTeam: teamName,
          playerPhoto: child.photoUrl,
          ageGroup: child.ageGroup,
          status: child.status,
          overallRating: latestSkills[0]?.overallRating || 0,
          technicalAvg: latestSkills[0]?.technicalOverall || 0,
          physicalAvg: latestSkills[0]?.physicalOverall || 0,
          tacticalAvg: latestSkills[0]?.defensiveOverall || 0,
          mentalAvg: latestSkills[0]?.mentalOverall || 0,
          totalActivities: totalActivities[0]?.count || 0,
        };
      })
    );

    return summaries.filter(Boolean);
  }),

  /**
   * Get upcoming sessions for next 7 days
   */
  getUpcomingSessions: parentProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const sessions = await database
      .select({
        id: privateTrainingBookings.id,
        playerId: privateTrainingBookings.playerId,
        firstName: players.firstName,
        lastName: players.lastName,
        playerPhoto: players.photoUrl,
        coachId: privateTrainingBookings.coachId,
        coachName: users.name,
        /* These were `as any` casts onto columns that do not exist, so each
           resolved to undefined and Drizzle threw "Cannot convert undefined or
           null to object" while ordering the selected fields — the whole parent
           dashboard 500'd. Mapped onto the real columns instead: photoUrl (not
           profilePhoto), endTime (duration is derived), locationId (not location).
           There is no sessionType column either, but the client renders it as the
           session title and calendar event name, so it is derived — every row in
           this query is by definition a private training booking. */
        coachPhoto: coachProfiles.photoUrl,
        sessionDate: privateTrainingBookings.sessionDate,
        startTime: privateTrainingBookings.startTime,
        endTime: privateTrainingBookings.endTime,
        sessionType: sql<string>`'Private Training'`,
        status: privateTrainingBookings.status,
        locationId: privateTrainingBookings.locationId,
      })
      .from(privateTrainingBookings)
      .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
      .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
      .leftJoin(coachProfiles, eq(privateTrainingBookings.coachId, coachProfiles.userId))
      .where(
        and(
          sql`${privateTrainingBookings.playerId} IN (SELECT playerId FROM parent_player_relations WHERE parentUserId = ${userId})`,
          gte(privateTrainingBookings.sessionDate, new Date()),
          sql`${privateTrainingBookings.sessionDate} <= ${sevenDaysFromNow}`
        )
      )
      .orderBy(privateTrainingBookings.sessionDate);

    return sessions.map(s => ({ ...s, playerName: `${s.firstName || ''} ${s.lastName || ''}`.trim() }));
  }),

  /**
   * Get recent notifications for last 30 days
   */
  getRecentNotifications: parentProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentNotifications = await database
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          gte(notifications.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return recentNotifications;
  }),

  /**
   * Get recent progress reports
   * TODO: Implement when progressReportHistory table is added to schema
   */
  getRecentReports: parentProcedure.query(async ({ ctx }) => {
    // Placeholder - return empty array until table is created
    return [];
  }),

  /**
   * Get comprehensive per-child data: attendance, feedback, injuries, fees, match history
   */
  getChildData: parentProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const userId = ctx.user.id;

      // Verify this parent has access to this player
      const relation = await database
        .select()
        .from(parentPlayerRelations)
        .where(and(eq(parentPlayerRelations.parentUserId, userId), eq(parentPlayerRelations.playerId, input.playerId)))
        .limit(1);
      if (!relation.length) throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this player' });

      // Attendance (last 30 records)
      const attendanceRecords = await database
        .select()
        .from(attendance)
        .where(eq(attendance.playerId, input.playerId))
        .orderBy(desc(attendance.sessionDate))
        .limit(30);
      const totalSessions = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((a: any) => a.status === 'present').length;
      const lateCount = attendanceRecords.filter((a: any) => a.status === 'late').length;
      const absentCount = attendanceRecords.filter((a: any) => a.status === 'absent').length;
      const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

      // Coach Feedback (visible to parent)
      const feedbackRecords = await database
        .select({
          id: coachFeedback.id,
          feedbackDate: coachFeedback.feedbackDate,
          category: coachFeedback.category,
          rating: coachFeedback.rating,
          strengths: coachFeedback.strengths,
          areasToImprove: coachFeedback.areasToImprove,
          recommendations: coachFeedback.recommendations,
          coachName: users.name,
        })
        .from(coachFeedback)
        .leftJoin(users, eq(coachFeedback.coachId, users.id))
        .where(and(eq(coachFeedback.playerId, input.playerId), eq(coachFeedback.isVisibleToParent, true)))
        .orderBy(desc(coachFeedback.feedbackDate))
        .limit(10);

      // Injuries (active and recent)
      const injuryRecords = await database
        .select()
        .from(injuries)
        .where(eq(injuries.playerId, input.playerId))
        .orderBy(desc(injuries.injuryDate))
        .limit(10);

      // Fees (current year)
      const currentYear = new Date().getFullYear();
      const feeRecords = await database
        .select()
        .from(playerFees)
        .where(and(eq(playerFees.playerId, input.playerId), sql`year = ${currentYear}`))
        .orderBy(desc(playerFees.dueDate))
        .limit(12);
      const totalFees = feeRecords.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      const paidFees = feeRecords.filter((f: any) => f.status === 'paid').reduce((sum: number, f: any) => sum + (f.paidAmount || f.amount || 0), 0);
      const pendingFees = feeRecords.filter((f: any) => f.status === 'pending' || f.status === 'overdue').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      const nextDue = feeRecords.find((f: any) => f.status === 'pending' || f.status === 'overdue');

      // Match History (last 10 matches)
      const matchHistoryRaw = await database
        .select({
          id: playerMatchStats.id,
          matchId: playerMatchStats.matchId,
          minutesPlayed: playerMatchStats.minutesPlayed,
          goals: playerMatchStats.goals,
          assists: playerMatchStats.assists,
          shots: playerMatchStats.shots,
          passes: playerMatchStats.passes,
          passAccuracy: playerMatchStats.passAccuracy,
          yellowCards: playerMatchStats.yellowCards,
          redCards: playerMatchStats.redCards,
          coachRating: playerMatchStats.coachRating,
          matchDate: matches.matchDate,
          opponent: matches.opponent,
          isHome: matches.isHome,
          teamScore: matches.teamScore,
          opponentScore: matches.opponentScore,
          ourTeamName: teams.name,
        })
        .from(playerMatchStats)
        .leftJoin(matches, eq(playerMatchStats.matchId, matches.id))
        .leftJoin(teams, eq(matches.teamId, teams.id))
        .where(eq(playerMatchStats.playerId, input.playerId))
        .orderBy(desc(matches.matchDate))
        .limit(10);

      const matchHistory = matchHistoryRaw.map((m) => ({
        ...m,
        homeTeam: m.isHome === false ? (m.opponent || 'Opponent') : (m.ourTeamName || 'Our Team'),
        awayTeam: m.isHome === false ? (m.ourTeamName || 'Our Team') : (m.opponent || 'Opponent'),
        homeScore: m.isHome === false ? m.opponentScore : m.teamScore,
        awayScore: m.isHome === false ? m.teamScore : m.opponentScore,
      }));

      // Upcoming sessions (next 14 days for the player's team)
      const playerRow = await database
        .select({ teamId: players.teamId })
        .from(players)
        .where(eq(players.id, input.playerId))
        .limit(1);
      const teamId = playerRow[0]?.teamId;
      const upcomingSessions = teamId ? await database
        .select()
        .from(trainingSessions)
        .where(and(
          eq(trainingSessions.teamId, teamId),
          gte(trainingSessions.sessionDate, new Date()),
          sql`sessionDate <= DATE_ADD(NOW(), INTERVAL 14 DAY)`
        ))
        .orderBy(trainingSessions.sessionDate)
        .limit(5) : [];

      return {
        attendance: {
          rate: attendanceRate,
          total: totalSessions,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          recent: attendanceRecords.slice(0, 10),
        },
        feedback: feedbackRecords,
        injuries: injuryRecords,
        fees: {
          total: totalFees,
          paid: paidFees,
          pending: pendingFees,
          nextDue: nextDue ? { amount: nextDue.amount, dueDate: nextDue.dueDate, month: nextDue.month } : null,
          records: feeRecords,
        },
        matchHistory,
        upcomingSessions,
      };
    }),
});
