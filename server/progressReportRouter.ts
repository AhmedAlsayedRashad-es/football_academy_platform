import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import { progressReportHistory, players, parentPlayerRelations } from '../drizzle/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { generateReportData, generateHTMLReport, saveReportToDatabase } from './reportGenerationService';

// Coach/Admin procedure
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['admin', 'coach'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

// Parent procedure
const parentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'parent') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent access required' });
  }
  return next({ ctx });
});

export const progressReportRouter = router({
  /**
   * Generate a new progress report for a player
   */
  generateReport: staffProcedure
    .input(z.object({
      playerId: z.number(),
      reportType: z.enum(['weekly', 'monthly', 'quarterly', 'annual', 'custom']),
      periodStart: z.string(), // ISO date string
      periodEnd: z.string(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);

      // Generate report data
      const reportData = await generateReportData(
        input.playerId,
        periodStart,
        periodEnd,
        input.reportType
      );

      // Generate HTML report
      const htmlReport = generateHTMLReport(reportData);

      // In production, you would convert HTML to PDF here using puppeteer or similar
      // For now, we'll store the HTML and provide a download link
      const reportUrl = `/api/reports/${input.playerId}/${Date.now()}.html`;

      // Save to database
      const reportId = await saveReportToDatabase(
        input.playerId,
        reportData,
        reportUrl,
        ctx.user.id
      );

      return {
        success: true,
        reportId,
        reportUrl,
        htmlContent: htmlReport,
      };
    }),

  /**
   * Get all reports for a player (staff access)
   */
  getPlayerReports: staffProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const reports = await database
        .select()
        .from(progressReportHistory)
        .where(eq(progressReportHistory.playerId, input.playerId))
        .orderBy(desc(progressReportHistory.reportDate))
        .limit(input.limit);

      return reports;
    }),

  /**
   * Get reports for parent's children
   */
  getMyChildrenReports: parentProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;

      // Get all children for this parent
      const children = await database
        .select({ playerId: parentPlayerRelations.playerId })
        .from(parentPlayerRelations)
        .where(eq(parentPlayerRelations.parentUserId, userId));

      if (children.length === 0) {
        return [];
      }

      const playerIds = children.map(c => c.playerId).filter(Boolean) as number[];

      // Get reports for all children
      const reports = await database
        .select({
          id: progressReportHistory.id,
          playerId: progressReportHistory.playerId,
          playerName: players.firstName,
          playerLastName: players.lastName,
          reportDate: progressReportHistory.reportDate,
          reportType: progressReportHistory.reportType,
          overallRating: progressReportHistory.overallRating,
          pdfUrl: progressReportHistory.pdfUrl,
        })
        .from(progressReportHistory)
        .leftJoin(players, eq(progressReportHistory.playerId, players.id))
        .where(eq(progressReportHistory.playerId, playerIds[0])) // Simplified for now
        .orderBy(desc(progressReportHistory.reportDate))
        .limit(20);

      return reports.map(r => ({
        ...r,
        playerFullName: `${r.playerName} ${r.playerLastName}`,
      }));
    }),

  /**
   * Get a specific report by ID
   */
  getReportById: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const report = await database
        .select()
        .from(progressReportHistory)
        .where(eq(progressReportHistory.id, input.reportId))
        .limit(1);

      if (!report || report.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      }

      const reportData = report[0];

      // Check permissions
      if (ctx.user.role === 'parent') {
        // Verify parent has access to this player
        const hasAccess = await database
          .select()
          .from(parentPlayerRelations)
          .where(
            and(
              eq(parentPlayerRelations.parentUserId, ctx.user.id),
              eq(parentPlayerRelations.playerId, reportData.playerId)
            )
          )
          .limit(1);

        if (!hasAccess || hasAccess.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      }

      return reportData;
    }),

  /**
   * Download report as HTML (can be printed to PDF by browser)
   */
  downloadReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const report = await database
        .select()
        .from(progressReportHistory)
        .where(eq(progressReportHistory.id, input.reportId))
        .limit(1);

      if (!report || report.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      }

      const reportData = report[0];

      // Check permissions (same as getReportById)
      if (ctx.user.role === 'parent') {
        const hasAccess = await database
          .select()
          .from(parentPlayerRelations)
          .where(
            and(
              eq(parentPlayerRelations.parentUserId, ctx.user.id),
              eq(parentPlayerRelations.playerId, reportData.playerId)
            )
          )
          .limit(1);

        if (!hasAccess || hasAccess.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      }

      // Get player info
      const player = await database
        .select()
        .from(players)
        .where(eq(players.id, reportData.playerId))
        .limit(1);

      if (!player || player.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
      }

      const playerInfo = player[0];

      // Reconstruct report data for HTML generation
      const reconstructedData = {
        player: {
          id: playerInfo.id,
          name: `${playerInfo.firstName} ${playerInfo.lastName}`,
          position: playerInfo.position,
          ageGroup: playerInfo.ageGroup || 'N/A',
          photo: playerInfo.photoUrl || undefined,
        },
        period: {
          start: reportData.reportPeriodStart,
          end: reportData.reportPeriodEnd,
          type: reportData.reportType,
        },
        ratings: {
          overall: reportData.overallRating || 0,
          technical: reportData.technicalRating || 0,
          physical: reportData.physicalRating || 0,
          tactical: reportData.tacticalRating || 0,
          mental: reportData.mentalRating || 0,
        },
        statistics: {
          matchesPlayed: reportData.matchesPlayed || 0,
          trainingAttendance: reportData.trainingAttendance || 0,
          goalsScored: reportData.goalsScored || 0,
          assists: reportData.assists || 0,
          distanceCovered: 0,
          topSpeed: 0,
        },
        coachFeedback: {
          comments: reportData.coachComments || '',
          strengths: (reportData.strengths || '').split('\n').filter(Boolean),
          areasForImprovement: (reportData.areasForImprovement || '').split('\n').filter(Boolean),
          recommendations: (reportData.recommendations || '').split('\n').filter(Boolean),
        },
      };

      const htmlContent = generateHTMLReport(reconstructedData);

      return {
        htmlContent,
        fileName: `progress-report-${playerInfo.firstName}-${playerInfo.lastName}-${reportData.reportDate}.html`,
      };
    }),

  /**
   * Schedule automated report generation
   */
  scheduleReport: staffProcedure
    .input(z.object({
      playerId: z.number(),
      reportType: z.enum(['weekly', 'monthly', 'quarterly', 'annual']),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement scheduling logic using cron or similar
      // For now, just return success
      return {
        success: true,
        message: `Report scheduling ${input.enabled ? 'enabled' : 'disabled'} for player ${input.playerId}`,
      };
    }),
});
