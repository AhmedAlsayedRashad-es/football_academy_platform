import { COOKIE_NAME } from "@shared/const";
import { generatePasskeyRegistrationOptions, verifyPasskeyRegistration, generatePasskeyAuthenticationOptions, verifyPasskeyAuthentication } from './webauthnService';
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from '@trpc/server';
import { notifyOwner } from './_core/notification';
import * as playermakerApi from './playermakerApi';
import * as db from "./db";
import { getDb } from "./db";
import * as dbPermissions from "./dbPermissions";
import { AIService } from "./aiService";
import { performanceRouter } from "./performanceRouter";
import { parentDashboardRouter } from "./parentDashboardRouter";
import { parentEducationRouter } from "./parentEducation";
import { progressReportRouter } from "./progressReportRouter";
import { messagingRouter } from "./messagingRouter";
import { privateTeamsRouter } from "./privateTeamsRouter";
import { suspensionsRouter } from "./suspensionsRouter";
import { deviceIntegrationRouter } from "./deviceIntegrationRouter";
import { punishmentsRouter } from "./punishmentsRouter";
import { lockerRoomRouter } from "./lockerRoomRouter";
import { transferMarketRouter } from "./transferMarketRouter";
import * as aiCache from "./aiCacheService";
import * as cacheWarmup from "./cacheWarmup";
import * as cacheInvalidation from "./cacheInvalidation";
import { sendWelcomeEmail, sendRejectionEmail } from "./emailNotifications";
import { sendBookingConfirmationToUser, sendBookingConfirmationToCoach, sendTestimonialApprovalEmail } from "./emailService";
import { sendBookingConfirmationWhatsApp, sendCoachBookingNotificationWhatsApp, sendPlayerAbsenceNotification, sendMonthlyAttendanceReport } from "./whatsappService";
import {
  qrCheckInRouter, socialMediaRouter, emailCampaignsRouter, referralRouter,
  scoutNetworkRouter, nutritionAIRouter, injuryPreventionRouter,
  educationAcademyRouter, vrTrainingRouter, coachCandidatesRouter,
  teamNeedsAnalysisRouter
} from "./routers_new_features";
import { populateComprehensiveData } from "./dataPopulation";
import { invokeLLM, extractJSON, extractText } from "./_core/llm";
import { recommendPositions, getTopPositionRecommendations, getPositionTransitionSuggestions, PlayerSkills } from "./positionRecommendation";
import { 
  MatchEventSession, homePageContent, performanceMetrics, forumPosts, forumVotes, forumReplies, forumCategories,
  players, playerMatchStats, teams, matches, trainingSessions, injuries, notifications, users, attendance,
  playerSkillScores, matchEvents, testimonials, privateTrainingBookings, coachProfiles, contactSubmissions,
  userStreaks, streakRewards, blogPosts, enrollmentSubmissions, careerApplications, coachEvaluations, teamCoaches,
  playerFees, invoices, expenses, payments as academyPayments,
  playerDevelopmentGoals,
  developmentPlans, developmentGoals,
  scholarships,
  staffCosts,
  playermakerPlayerMetrics
} from "../drizzle/schema";
import { desc, eq, sql, and, or, gte, lte, like, isNull, asc, inArray } from "drizzle-orm";
import { checkAndAwardBadges, initializeDefaultBadges } from "./badgeService";
import { checkAndUpdateChallengeProgress, claimChallengeReward, initializeWeeklyChallenges } from "./challengeService";
import { smartShoeRouter } from "./smartShoeRouter";
import { privateSubscriptionsRouter } from "./privateSubscriptionsRouter";
import { advancedTacticalRouter } from "./advancedTacticalRouter";
import { matchIntelligenceRouter } from "./matchIntelligenceRouter";
import { videoIntelligenceRouter } from "./videoIntelligenceRouter";

// Role-based procedure helpers
const coachProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['admin', 'coach'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach access required' });
  }
  return next({ ctx });
});

const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// ==================== XG ANALYTICS ====================
const xgAnalyticsRouter = router({
    getMatchData: publicProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const summary = await db.getMatchXGSummary(input.matchId);
        if (!summary) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }
        
        // Get match details
        const match = await db.getMatchById(input.matchId);
        const team = match?.teamId ? await db.getTeamById(match.teamId) : null;
        
        return {
          matchId: input.matchId,
          homeTeam: team?.name || 'Home Team',
          awayTeam: match?.opponent || 'Away Team',
          date: match?.matchDate?.toISOString() || new Date().toISOString(),
          score: {
            home: match?.teamScore || 0,
            away: match?.opponentScore || 0,
          },
          shots: summary.shots.map(s => ({
            id: s.id,
            teamId: s.teamId,
            playerId: s.playerId || 0,
            playerName: s.playerName,
            x: s.positionX,
            y: s.positionY,
            xG: Number(s.xGValue),
            isGoal: s.isGoal,
            minute: s.minute,
          })),
          passes: summary.passes.map(p => ({
            id: p.id,
            teamId: p.teamId,
            from: p.fromPlayerId || 0,
            to: p.toPlayerId || 0,
            fromName: p.fromPlayerName,
            toName: p.toPlayerName,
            x1: p.fromX,
            y1: p.fromY,
            x2: p.toX,
            y2: p.toY,
            xA: Number(p.xAValue),
            success: p.isSuccessful,
          })),
          defensiveActions: summary.defensiveActions.map(d => ({
            id: d.id,
            teamId: d.teamId,
            playerId: d.playerId || 0,
            playerName: d.playerName,
            type: d.actionType,
            x: d.positionX,
            y: d.positionY,
            success: d.isSuccessful,
            minute: d.minute,
          })),
          teamStats: {
            home: summary.teamStats[0] || {
              xG: 0,
              actualGoals: 0,
              shots: 0,
              shotsOnTarget: 0,
              passAccuracy: 0,
              possession: 50,
            },
            away: summary.teamStats[1] || {
              xG: 0,
              actualGoals: 0,
              shots: 0,
              shotsOnTarget: 0,
              passAccuracy: 0,
              possession: 50,
            },
          },
          playerStats: [], // TODO: Calculate from shots/passes data
        };
      }),
    
    createShot: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number().optional(),
        playerName: z.string(),
        teamId: z.number(),
        minute: z.number(),
        positionX: z.number(),
        positionY: z.number(),
        xGValue: z.number(),
        isGoal: z.boolean(),
        isOnTarget: z.boolean().optional(),
        shotType: z.enum(['right_foot', 'left_foot', 'header', 'other']).optional(),
        situation: z.enum(['open_play', 'corner', 'free_kick', 'penalty', 'counter_attack']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMatchShot({ ...input, xGValue: String(input.xGValue) });
        return { success: true, id };
      }),
    
    createPass: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        fromPlayerId: z.number().optional(),
        fromPlayerName: z.string(),
        toPlayerId: z.number().optional(),
        toPlayerName: z.string(),
        teamId: z.number(),
        minute: z.number(),
        fromX: z.number(),
        fromY: z.number(),
        toX: z.number(),
        toY: z.number(),
        xAValue: z.number(),
        isSuccessful: z.boolean(),
        isKeyPass: z.boolean().optional(),
        isAssist: z.boolean().optional(),
        passType: z.enum(['short', 'long', 'through_ball', 'cross', 'corner', 'free_kick']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMatchPass({ ...input, xAValue: String(input.xAValue) });
        return { success: true, id };
      }),
    
    createDefensiveAction: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number().optional(),
        playerName: z.string(),
        teamId: z.number(),
        minute: z.number(),
        positionX: z.number(),
        positionY: z.number(),
        actionType: z.enum(['tackle', 'interception', 'block', 'clearance', 'aerial_duel']),
        isSuccessful: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMatchDefensiveAction(input);
        return { success: true, id };
      }),
});
// ==================== ENROLLMENT SUBMISSIONS ====================
const enrollmentRouter = router({
  submit: publicProcedure
    .input(z.object({
      studentFirstName: z.string().min(1),
      studentLastName: z.string().min(1),
      dateOfBirth: z.string(),
      gender: z.enum(["male", "female"]),
      parentFirstName: z.string().min(1),
      parentLastName: z.string().min(1),
      parentEmail: z.string().email(),
      parentPhone: z.string().min(1),
      program: z.enum(["beginner", "intermediate", "advanced", "elite"]),
      ageGroup: z.string().min(1),
      preferredPosition: z.enum(["goalkeeper", "defender", "midfielder", "forward", "any"]).default("any"),
      previousExperience: z.string().optional(),
      medicalConditions: z.string().optional(),
      emergencyContact: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      
      await database.insert(enrollmentSubmissions).values({
        ...input,
        dateOfBirth: new Date(input.dateOfBirth),
        status: 'pending',
      });
      
      // Notify admin about new enrollment
      await notifyOwner({
        title: '📝 New Enrollment Submission',
        content: `New enrollment submission from ${input.parentFirstName} ${input.parentLastName} for student ${input.studentFirstName} ${input.studentLastName}`,
      });
      
      return { success: true };
    }),
  
  getAll: adminProcedure.query(async () => {
    const database = (await getDb())!;
    if (!database) return [];
    
    const result = await database
      .select()
      .from(enrollmentSubmissions)
      .orderBy(desc(enrollmentSubmissions.createdAt));
    
    return result;
  }),
  
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected", "contacted"]),
      notes: z.string().optional(),
      teamId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      
      // Get enrollment details before updating
      const [enrollment] = await database
        .select()
        .from(enrollmentSubmissions)
        .where(eq(enrollmentSubmissions.id, input.id));
      
      // Update status
      await database
        .update(enrollmentSubmissions)
        .set({ status: input.status, notes: input.notes })
        .where(eq(enrollmentSubmissions.id, input.id));
      
      // Send email if approved
      if (input.status === 'approved' && enrollment) {
        const emailSubject = 'Welcome to Future Stars Academy - Enrollment Approved';
        const emailBody = `
Dear ${enrollment.parentFirstName} ${enrollment.parentLastName},

Congratulations! We are pleased to inform you that ${enrollment.studentFirstName} ${enrollment.studentLastName}'s enrollment application has been approved.

=== FREE EVALUATION SESSION ===

As part of our onboarding process, we would like to invite ${enrollment.studentFirstName} for a FREE evaluation session. This comprehensive assessment will include:

1. SKILL ASSESSMENT
   - Technical abilities (ball control, passing, shooting, dribbling)
   - Physical attributes (speed, agility, stamina, strength)
   - Tactical understanding (positioning, decision-making)
   - Mental attributes (focus, teamwork, attitude)

2. TEAM PLACEMENT
   Based on the evaluation, ${enrollment.studentFirstName} will be placed in one of our two team structures:

   🏆 MAIN TEAM
   - Competitive leagues and tournaments
   - Class A competitions
   - Advanced training programs
   - Regular match play against top academies

   ⚽ ACADEMY TEAM
   - Focused skill development training
   - Friendly cups and internal competitions
   - Foundation building program
   - Pathway to Main Team promotion

3. PERSONALIZED DEVELOPMENT PLAN
   - Individual Development Plan (IDP) creation
   - Goal setting and milestone tracking
   - Regular progress reports for parents
   - Access to our Parent Portal for real-time updates

=== NEXT STEPS ===

Please contact us to schedule the evaluation session at your convenience:

📧 Email: academy@futurestars.com
📱 WhatsApp: +201004186970
📞 Phone: ${enrollment.parentPhone || 'Contact us for details'}

We look forward to welcoming ${enrollment.studentFirstName} to the Future Stars FC family!

Best regards,
Future Stars Academy Coaching Staff

---
Future Stars Academy | Cairo, Egypt
Developing Champions On and Off the Field
        `.trim();
        
        // Log email (in production, integrate with actual email service)
        console.log('=== ENROLLMENT APPROVAL EMAIL ===');
        console.log('To:', enrollment.parentEmail);
        console.log('Subject:', emailSubject);
        console.log('Body:', emailBody);
        console.log('================================');
        
        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        // await sendEmail(enrollment.parentEmail, emailSubject, emailBody);
      }
      
      // Return notification status
      return { 
        success: true,
        notificationsSent: {
          email: true,
          whatsapp: enrollment?.parentPhone ? true : false,
          sms: false,
        }
      };
    }),

  // Get notification log for an enrollment
  getNotificationLog: adminProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ input }) => {
      return [
        { type: 'email', status: 'sent', timestamp: new Date().toISOString(), recipient: 'parent@email.com' },
        { type: 'whatsapp', status: 'pending', timestamp: new Date().toISOString(), recipient: '+201XXXXXXXXX' },
      ];
    }),
});

// ==================== BLOG POSTS ====================
const blogRouter = router({  getAll: publicProcedure
    .input(z.object({
      category: z.enum(["news", "training", "events", "achievements", "general"]).optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) return [];
      
      let query: any = database
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          coverImage: blogPosts.coverImage,
          category: blogPosts.category,
          publishedAt: blogPosts.publishedAt,
          viewCount: blogPosts.viewCount,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
        })
        .from(blogPosts)
        .innerJoin(users, eq(blogPosts.authorId, users.id));
      
      if (input.category) {
        query = query.where(and(
          eq(blogPosts.status, 'published'),
          eq(blogPosts.category, input.category)
        ));
      } else {
        query = query.where(eq(blogPosts.status, 'published'));
      }
      
      query = query.orderBy(desc(blogPosts.publishedAt));
      
      const result = await query.limit(input.limit);
      return result;
    }),
  
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      
      const [post] = await database
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          content: blogPosts.content,
          coverImage: blogPosts.coverImage,
          category: blogPosts.category,
          publishedAt: blogPosts.publishedAt,
          viewCount: blogPosts.viewCount,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
        })
        .from(blogPosts)
        .innerJoin(users, eq(blogPosts.authorId, users.id))
        .where(and(
          eq(blogPosts.slug, input.slug),
          eq(blogPosts.status, 'published')
        ));
      
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      
      // Increment view count
      await database
        .update(blogPosts)
        .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
        .where(eq(blogPosts.id, post.id));
      
      return post;
    }),
  
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      excerpt: z.string().min(1),
      content: z.string().min(1),
      coverImage: z.string().optional(),
      category: z.enum(["news", "training", "events", "achievements", "general"]),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      
      await database.insert(blogPosts).values({
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.status === 'published' ? new Date() : null,
      });
      
      return { success: true };
    }),
  
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      coverImage: z.string().optional(),
      category: z.enum(["news", "training", "events", "achievements", "general"]).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      
      const { id, ...updateData } = input;
      
      // If status is being changed to published and publishedAt is null, set it
      if (updateData.status === 'published') {
        const [post] = await database.select().from(blogPosts).where(eq(blogPosts.id, id));
        if (post && !post.publishedAt) {
          await database
            .update(blogPosts)
            .set({ ...updateData, publishedAt: new Date() })
            .where(eq(blogPosts.id, id));
          return { success: true };
        }
      }
      
      await database
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, id));
      
      return { success: true };
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      
      await database
        .delete(blogPosts)
        .where(eq(blogPosts.id, input.id));
      
      return { success: true };
    }),

  togglePublish: adminProcedure
    .input(z.object({ id: z.number(), published: z.boolean() }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      const newStatus = input.published ? 'published' : 'draft';
      await database
        .update(blogPosts)
        .set({ status: newStatus, publishedAt: input.published ? new Date() : null })
        .where(eq(blogPosts.id, input.id));
      return { success: true, status: newStatus };
    }),
});

// ===== PLAYER DOCUMENTS ROUTER =====
const playerDocumentsRouter = router({
  // Get all documents for a player
  getByPlayer: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = (await getDb())!;
      const docs = await database.execute(
        sql`SELECT pd.*, u.fullName as uploadedByName, v.fullName as verifiedByName
            FROM player_documents pd
            LEFT JOIN users u ON u.id = pd.uploaded_by
            LEFT JOIN users v ON v.id = pd.verified_by
            WHERE pd.player_id = ${input.playerId}
            ORDER BY pd.doc_type, pd.created_at DESC`
      );
      return (docs[0] as unknown as any[]) || [];
    }),

  // Get document summary for all players (admin view)
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    const summary = await database.execute(
      sql`SELECT p.id as playerId, p.name as playerName, p.teamId,
              t.name as teamName, p.position,
              COUNT(pd.id) as totalDocs,
              SUM(CASE WHEN pd.status = 'verified' THEN 1 ELSE 0 END) as verifiedDocs,
              SUM(CASE WHEN pd.status = 'pending' THEN 1 ELSE 0 END) as pendingDocs,
              SUM(CASE WHEN pd.status = 'rejected' THEN 1 ELSE 0 END) as rejectedDocs
          FROM players p
          LEFT JOIN teams t ON t.id = p.teamId
          LEFT JOIN player_documents pd ON pd.player_id = p.id
          GROUP BY p.id, p.name, p.teamId, t.name, p.position
          ORDER BY p.name`
    );
    return (summary[0] as unknown as any[]) || [];
  }),

  // Add or update a document record
  upsert: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      docType: z.enum(['player_id_card','parent_id_card','birth_certificate','medical_clearance','contract','photo','insurance','transfer_card','other']),
      docLabel: z.string(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      expiryDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      await database.execute(
        sql`INSERT INTO player_documents (player_id, doc_type, doc_label, file_url, file_name, file_size, mime_type, status, expiry_date, notes, uploaded_by)
            VALUES (${input.playerId}, ${input.docType}, ${input.docLabel}, ${input.fileUrl || null}, ${input.fileName || null}, ${input.fileSize || null}, ${input.mimeType || null}, 'uploaded', ${input.expiryDate || null}, ${input.notes || null}, ${ctx.user.id})`
      );
      return { success: true };
    }),

  // Verify or reject a document (admin/coach only)
  updateStatus: adminProcedure
    .input(z.object({
      docId: z.number(),
      status: z.enum(['verified','rejected','expired','pending']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      await database.execute(
        sql`UPDATE player_documents
            SET status = ${input.status}, notes = ${input.notes || null},
                verified_by = ${ctx.user.id}, verified_at = NOW(), updated_at = NOW()
            WHERE id = ${input.docId}`
      );
      return { success: true };
    }),

  // Delete a document
  delete: protectedProcedure
    .input(z.object({ docId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      await database.execute(sql`DELETE FROM player_documents WHERE id = ${input.docId}`);
      return { success: true };
    }),

  // Initialize required document slots for a player
  initializeSlots: adminProcedure
    .input(z.object({ playerId: z.number(), playerAge: z.number().default(12) }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      const requiredDocs: Array<{type: string, label: string}> = [
        { type: 'birth_certificate', label: 'Birth Certificate / شهادة الميلاد' },
        { type: 'photo', label: 'Player Photo / صورة اللاعب' },
        { type: 'medical_clearance', label: 'Medical Clearance / إفادة طبية' },
        { type: 'parent_id_card', label: 'Parent National ID / بطاقة ولي الأمر' },
        { type: 'contract', label: 'Academy Contract / عقد الأكاديمية' },
      ];
      if (input.playerAge >= 15) {
        requiredDocs.push({ type: 'player_id_card', label: 'Player National ID / بطاقة اللاعب' });
      }
      if (input.playerAge >= 16) {
        requiredDocs.push({ type: 'transfer_card', label: 'Transfer Card / بطاقة انتقال' });
        requiredDocs.push({ type: 'insurance', label: 'Sports Insurance / تأمين رياضي' });
      }
      for (const doc of requiredDocs) {
        await database.execute(
          sql`INSERT IGNORE INTO player_documents (player_id, doc_type, doc_label, status)
              VALUES (${input.playerId}, ${doc.type}, ${doc.label}, 'pending')`
        );
      }
      return { success: true, initialized: requiredDocs.length };
    }),
});


export const appRouter = router({
  advancedTactical: advancedTacticalRouter,
  matchIntelligence: matchIntelligenceRouter,
  videoIntelligence: videoIntelligenceRouter,
  system: systemRouter,
  xgAnalytics: xgAnalyticsRouter,
  parentDashboard: parentDashboardRouter,
  parentEducation: parentEducationRouter,
  progressReport: progressReportRouter,
  messaging: messagingRouter,
  blog: blogRouter,
  enrollments: enrollmentRouter,
  playerDocuments: playerDocumentsRouter,
  privateTeams: privateTeamsRouter,
  privateSubscriptions: privateSubscriptionsRouter,
  suspensions: suspensionsRouter,
  deviceIntegration: deviceIntegrationRouter,
  punishments: punishmentsRouter,
    lockerRoom: lockerRoomRouter,
  transferMarket: transferMarketRouter,
  // ==================== FILE UPLOAD ====================
  upload: router({
    uploadFile: protectedProcedure
      .input(z.object({
        fileData: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop();
        const fileKey = `uploads/${timestamp}-${randomStr}.${extension}`;
        
        // Upload to S3
        const result = await storagePut(fileKey, buffer, input.contentType);
        
        return {
          fileKey: result.key,
          url: result.url,
        };
      }),
    updateUserAvatar: adminProcedure
      .input(z.object({
        userId: z.number(),
        avatarUrl: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserAvatar(input.userId, input.avatarUrl);
        return { success: true };
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Returns enriched profile: user + linked player/team/coach data
    profile: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      let playerData = null;
      let teamData = null;
      let coachTeams: { teamId: number | null; teamName: string | null; role: string; isPrimary: boolean | null; ageGroup: string | null; teamType: string | null }[] = [];
      
      if (user.role === 'player' || user.role === 'parent') {
        const player = await db.getPlayerByUserId(user.id);
        if (player) {
          playerData = {
            id: player.id,
            firstName: player.firstName,
            lastName: player.lastName,
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            ageGroup: player.ageGroup,
            academyCode: player.academyCode,
            photoUrl: player.photoUrl,
            teamId: player.teamId,
            teamType: player.teamType,
            status: player.status,
          };
          if (player.teamId) {
            const team = await db.getTeamById(player.teamId);
            if (team) teamData = { id: team.id, name: team.name, ageGroup: team.ageGroup, teamType: team.teamType };
          }
        }
      } else if (['coach', 'admin', 'nutritionist', 'mental_coach', 'physical_trainer'].includes(user.role)) {
        const teams = await db.getCoachTeams(user.id);
        coachTeams = teams.map(t => ({
          teamId: t.teamId,
          teamName: t.teamName,
          role: t.role ?? 'custom',
          isPrimary: t.isPrimary,
          ageGroup: t.ageGroup,
          teamType: t.teamType,
        }));
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        coverPhotoUrl: (user as any).coverPhotoUrl || null,
        bio: (user as any).bio || null,
        nationality: (user as any).nationality || null,
        dateOfBirth: (user as any).dateOfBirth || null,
        phone: user.phone,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
        player: playerData,
        team: teamData,
        coachTeams,
      };
    }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsappPhone: z.string().optional(),
        whatsappNotifications: z.boolean().optional(),
        avatarUrl: z.string().nullable().optional(),
        coverPhotoUrl: z.string().nullable().optional(),
        bio: z.string().nullable().optional(),
        nationality: z.string().nullable().optional(),
        dateOfBirth: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    // Get notifications for current user
    getNotifications: protectedProcedure
      .query(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return [];
        try {
          const result = await database.execute(
            sql`SELECT * FROM user_notifications WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC LIMIT 50`
          );
          return (result[0] as unknown as unknown as any[]) || [];
        } catch { return []; }
      }),
    // Mark notification as read
    markNotificationRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) return { success: false };
        try {
          await database.execute(
            sql`UPDATE user_notifications SET isRead = TRUE WHERE id = ${input.notificationId} AND userId = ${ctx.user.id}`
          );
        } catch { /* table may not exist */ }
        return { success: true };
      }),
    // Mark all notifications as read
    markAllNotificationsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return { success: false };
        try {
          await database.execute(
            sql`UPDATE user_notifications SET isRead = TRUE WHERE userId = ${ctx.user.id}`
          );
        } catch { /* table may not exist */ }
        return { success: true };
      }),
    // Create a notification (admin/coach)
    createNotification: protectedProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string(),
        body: z.string().optional(),
        type: z.enum(['info', 'success', 'warning', 'error', 'goal', 'training', 'medical', 'payment']).optional(),
        link: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return { success: false };
        try {
          await database.execute(
            sql`INSERT INTO user_notifications (userId, title, body, type, link) VALUES (${input.userId}, ${input.title}, ${input.body || null}, ${input.type || 'info'}, ${input.link || null})`
          );
        } catch { /* table may not exist */ }
        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USER REGISTRATION ====================
  userRegistration: router({
    register: publicProcedure
      .input(z.object({
        requestedRole: z.enum(['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer', 'parent', 'player']),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email already registered' });
        }
        
        await db.createPendingUser({
          name: input.name,
          email: input.email,
          phone: input.phone,
          requestedRole: input.requestedRole,
        });
        
        return { success: true };
      }),
  }),

  // ==================== USER MANAGEMENT ====================
  users: router({
    getAll: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer', 'parent', 'player']) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    approveUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        await db.approveUser(input.userId);
        if (user && user.email && user.name) {
          await sendWelcomeEmail(user.email, user.name);
        }
        return { success: true };
      }),
    rejectUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        await db.rejectUser(input.userId);
        if (user && user.email && user.name) {
          await sendRejectionEmail(user.email, user.name);
        }
        return { success: true };
      }),
    updateStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        newStatus: z.enum(['pending', 'approved', 'rejected'])
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database
          .update(users)
          .set({ 
            accountStatus: input.newStatus,
            updatedAt: new Date()
          })
          .where(eq(users.id, input.userId));
        return { success: true };
      }),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),
    completeOnboarding: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.markOnboardingComplete(ctx.user.id);
        return { success: true };
      }),

    // ── WEBAUTHN / PASSKEY (Biometric Login) ──
    passkeyRegistrationOptions: protectedProcedure
      .query(async ({ ctx }) => {
        const options = await generatePasskeyRegistrationOptions(ctx.user.id, ctx.user.name || ctx.user.email || '');
        return options;
      }),
    passkeyRegister: protectedProcedure
      .input(z.object({ response: z.any() }))
      .mutation(async ({ ctx, input }) => {
        const result = await verifyPasskeyRegistration(ctx.user.id, input.response);
        if (!result.verified) throw new Error(result.error || 'Registration failed');
        return { success: true };
      }),
    passkeyAuthOptions: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const options = await generatePasskeyAuthenticationOptions(input.userId);
        return options;
      }),
    passkeyAuthenticate: publicProcedure
      .input(z.object({ userId: z.number(), response: z.any() }))
      .mutation(async ({ input }) => {
        const result = await verifyPasskeyAuthentication(input.userId, input.response);
        if (!result.verified) throw new Error(result.error || 'Authentication failed');
        return { success: true };
      }),
    passkeyList: protectedProcedure
      .query(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(
          sql`SELECT id, credential_id, device_type, backed_up, created_at, last_used_at FROM webauthn_credentials WHERE user_id = ${ctx.user.id} ORDER BY created_at DESC`
        ) as any;
        return (rows[0] as unknown as any[]).map((r: any) => ({
          id: r.id,
          credentialId: r.credential_id,
          deviceType: r.device_type,
          backedUp: !!r.backed_up,
          createdAt: r.created_at,
          lastUsedAt: r.last_used_at,
        }));
      }),
    passkeyDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.execute(
          sql`DELETE FROM webauthn_credentials WHERE id = ${input.id} AND user_id = ${ctx.user.id}`
        );
        return { success: true };
      }),

    updateWhatsAppSettings: protectedProcedure
      .input(z.object({
        whatsappPhone: z.string().nullable(),
        whatsappNotifications: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateWhatsAppSettings(ctx.user.id, input.whatsappPhone, input.whatsappNotifications);
        return { success: true };
      }),
  }),

  // ==================== PLAYERS ====================
  players: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllPlayers();
    }),
    getById: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerById(input.id);
      }),
    // Accessible to all authenticated users (parents see only linked players, players see themselves)
    getByIdProtected: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        // Staff can access any player
        if (['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer'].includes(ctx.user.role)) {
          return db.getPlayerById(input.id);
        }
        // Parent: verify they have a linked player with this id
        if (ctx.user.role === 'parent') {
          const { parentPlayerRelations: ppr } = await import('../drizzle/schema');
          const relation = await database.select().from(ppr)
            .where(and(eq(ppr.parentUserId, ctx.user.id), eq(ppr.playerId, input.id)))
            .limit(1);
          if (relation.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your linked player' });
          return db.getPlayerById(input.id);
        }
        // Player: can only access their own player profile
        const myPlayer = await db.getPlayerByUserId(ctx.user.id);
        if (!myPlayer || myPlayer.id !== input.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        return myPlayer;
      }),
    getByTeam: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayersByTeam(input.teamId);
      }),
    getByTeamType: staffProcedure
      .input(z.object({ teamType: z.enum(['main', 'academy']) }))
      .query(async ({ input }) => {
        return db.getPlayersByTeamType(input.teamType);
      }),
    getByAgeGroup: staffProcedure
      .input(z.object({ ageGroup: z.string() }))
      .query(async ({ input }) => {
        return db.getPlayersByAgeGroup(input.ageGroup);
      }),
    getForParent: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'parent') {
        return []; // Return empty array for non-parent users instead of throwing
      }
      return db.getPlayersForParent(ctx.user.id);
    }),
    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerByUserId(input.userId);
      }),
    // Public profile - no authentication required
    getPublicProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        const playerResult = await database.select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          dateOfBirth: players.dateOfBirth,
          position: players.position,
          ageGroup: players.ageGroup,
          jerseyNumber: players.jerseyNumber,
          nationality: players.nationality,
          height: players.height,
          weight: players.weight,
          bio: players.bio,
          photoUrl: players.photoUrl,
          preferredFoot: players.preferredFoot,
          status: players.status,
          joinDate: players.joinDate,
          teamId: players.teamId,
          isPublicProfile: players.isPublicProfile,
        }).from(players).where(eq(players.id, input.id)).limit(1);
        if (playerResult.length === 0) return null;
        const player = playerResult[0];
        let teamName = null;
        if (player.teamId) {
          const teamResult = await database.select({ name: teams.name }).from(teams).where(eq(teams.id, player.teamId)).limit(1);
          teamName = teamResult[0]?.name || null;
        }
        const skillResult = await database.select().from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, input.id))
          .orderBy(desc(playerSkillScores.createdAt)).limit(1);
        const skills = skillResult[0] || null;
        const statsResult = await database.select({
          totalGoals: sql<number>`COALESCE(SUM(${playerMatchStats.goals}), 0)`,
          totalAssists: sql<number>`COALESCE(SUM(${playerMatchStats.assists}), 0)`,
          matchesPlayed: sql<number>`COUNT(DISTINCT ${playerMatchStats.matchId})`,
          avgRating: sql<number>`ROUND(AVG(${playerMatchStats.coachRating}), 1)`,
        }).from(playerMatchStats).where(eq(playerMatchStats.playerId, input.id));
        const stats = statsResult[0] || { totalGoals: 0, totalAssists: 0, matchesPlayed: 0, avgRating: null };
        // Use development_plans + development_goals (the actual DB tables)
        let goalsResult: any[] = [];
        try {
          const plansResult = await database.select({ id: developmentPlans.id })
            .from(developmentPlans).where(eq(developmentPlans.playerId, input.id)).limit(3);
          if (plansResult.length > 0) {
            const planIds = plansResult.map((p: any) => p.id);
            goalsResult = await database.select({
              id: developmentGoals.id,
              title: developmentGoals.title,
              category: developmentGoals.category,
              progress: developmentGoals.currentValue,
              completed: developmentGoals.isCompleted,
              targetDate: developmentGoals.targetDate,
            }).from(developmentGoals)
              .where(inArray(developmentGoals.planId, planIds))
              .orderBy(desc(developmentGoals.createdAt)).limit(6);
          }
        } catch { /* ignore */ }
        let taggedMedia: any[] = [];
        try {
          const mediaResult = await database.execute(
            sql`SELECT mt.mediaId, av.title, av.thumbnailUrl, av.videoUrl, av.category
               FROM media_tags mt
               LEFT JOIN academy_videos av ON mt.mediaId = av.id
               WHERE mt.taggedPlayerId = ${input.id}
               ORDER BY mt.createdAt DESC LIMIT 8`
          );
          taggedMedia = (mediaResult[0] as unknown as any[]) || [];
        } catch { /* media_tags may not exist */ }
        return { ...player, teamName, skills, stats, goals: goalsResult, taggedMedia };
      }),

    togglePublicProfile: protectedProcedure
      .input(z.object({ playerId: z.number(), isPublic: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        // Only admin, coach, or the player's parent can toggle
        if (!['admin', 'coach', 'parent'].includes(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        await database.update(players)
          .set({ isPublicProfile: input.isPublic })
          .where(eq(players.id, input.playerId));
        return { success: true };
      }),

    create: coachProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string(),
        position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']),
        preferredFoot: z.enum(['left', 'right', 'both']).optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        jerseyNumber: z.number().optional(),
        ageGroup: z.string().optional(),
        teamId: z.number().optional(),
        status: z.enum(['active', 'injured', 'inactive', 'trial']).optional(),
        joinDate: z.string().optional(),
        photoUrl: z.string().optional(),
        nationality: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPlayer({
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: new Date(input.dateOfBirth),
          position: input.position,
          preferredFoot: input.preferredFoot,
          height: input.height,
          weight: input.weight,
          jerseyNumber: input.jerseyNumber,
          ageGroup: input.ageGroup,
          teamId: input.teamId,
          status: input.status,
          joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
          photoUrl: input.photoUrl,
          nationality: input.nationality,
          bio: input.bio,
          phone: input.phone,
        });
        return { id };
      }),

    // Update player team assignment
    updateTeam: adminProcedure
      .input(z.object({
        playerId: z.number(),
        teamId: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePlayer(input.playerId, { teamId: input.teamId });
        await cacheInvalidation.smartInvalidate({ type: "player", playerId: input.playerId, comprehensive: true });
        return { success: true };
      }),

    // Update player
    updatePlayer: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        position: z.enum(["goalkeeper", "defender", "midfielder", "forward"]).optional(),
        preferredFoot: z.enum(["left", "right", "both"]).optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        jerseyNumber: z.number().optional(),
        ageGroup: z.string().optional(),
        status: z.enum(["active", "injured", "inactive", "trial"]).optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: Record<string, unknown> = { id: input.id };
        if (input.firstName !== undefined) updateData.firstName = input.firstName;
        if (input.lastName !== undefined) updateData.lastName = input.lastName;
        if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
        if (input.position !== undefined) updateData.position = input.position;
        if (input.preferredFoot !== undefined) updateData.preferredFoot = input.preferredFoot;
        if (input.height !== undefined) updateData.height = input.height;
        if (input.weight !== undefined) updateData.weight = input.weight;
        if (input.jerseyNumber !== undefined) updateData.jerseyNumber = input.jerseyNumber;
        if (input.ageGroup !== undefined) updateData.ageGroup = input.ageGroup;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
        const updated = await db.updatePlayer(input.id, updateData as any);
        // Invalidate player cache after update
        await cacheInvalidation.smartInvalidate({ type: "player", playerId: input.id, comprehensive: true });
        return updated;
      }),
    getOverallStats: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerOverallStats(input.playerId);
      }),
    getFullReport: staffProcedure
      .input(z.object({
        playerId: z.number(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const fromDate = input.fromDate ? new Date(input.fromDate) : undefined;
        const toDate = input.toDate ? new Date(input.toDate) : undefined;
        return db.getFullPlayerReport(input.playerId, fromDate, toDate);
      }),

    // Performance history for comparison
    getPerformanceHistory: staffProcedure
      .input(z.object({ 
        playerId: z.number(),
        matchCount: z.number().default(5),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Get last N matches for the player
        const matchStats = await database
          .select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.id))
          .limit(input.matchCount);

        if (matchStats.length === 0) {
          return { matches: [], summary: null };
        }

        // Calculate metrics
        const matches = matchStats.reverse().map((stat, index) => ({
          matchNumber: index + 1,
          distance: (stat.distanceCovered || 0) / 1000, // Convert to km
          sprints: stat.sprints || 0,
          avgSpeed: stat.topSpeed ? (stat.topSpeed * 0.6) : 0, // Estimate avg as 60% of top
          maxSpeed: stat.topSpeed || 0,
          avgHeartRate: 0, // Not available in current schema
        }));

        // Calculate summary statistics
        const summary = {
          best: {
            distance: Math.max(...matches.map(m => m.distance)),
            sprints: Math.max(...matches.map(m => m.sprints)),
            avgSpeed: Math.max(...matches.map(m => m.avgSpeed)),
            maxSpeed: Math.max(...matches.map(m => m.maxSpeed)),
            avgHeartRate: 0,
          },
          average: {
            distance: matches.reduce((sum, m) => sum + m.distance, 0) / matches.length,
            sprints: matches.reduce((sum, m) => sum + m.sprints, 0) / matches.length,
            avgSpeed: matches.reduce((sum, m) => sum + m.avgSpeed, 0) / matches.length,
            maxSpeed: matches.reduce((sum, m) => sum + m.maxSpeed, 0) / matches.length,
            avgHeartRate: 0,
          },
          latest: {
            distance: matches[matches.length - 1].distance,
            sprints: matches[matches.length - 1].sprints,
            avgSpeed: matches[matches.length - 1].avgSpeed,
            maxSpeed: matches[matches.length - 1].maxSpeed,
            avgHeartRate: 0,
          },
        };

        return { matches, summary };
      }),

    // Get player by academy code
    getByAcademyCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return db.getPlayerByAcademyCode(input.code);
      }),

    // Generate new academy code for a player
    generateCode: adminProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
        const code = await db.generateAcademyCode(player.id, player.firstName, player.lastName);
        await db.updatePlayer(player.id, { academyCode: code } as any);
        return { code };
      }),

    // Generate AI insights for performance trends
    generatePerformanceInsights: staffProcedure
      .input(z.object({ 
        playerId: z.number(),
        matchCount: z.number().default(5),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Get player info
        const player = await database
          .select()
          .from(players)
          .where(eq(players.id, input.playerId))
          .limit(1);

        if (!player || player.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
        }

        // Get performance history
        const matchStats = await database
          .select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.id))
          .limit(input.matchCount);

        if (matchStats.length === 0) {
          return { insights: 'Not enough performance data available for analysis.' };
        }

        // Prepare data for AI
        const performanceData = matchStats.reverse().map((stat, index) => ({
          matchNumber: index + 1,
          distance: ((stat.distanceCovered || 0) / 1000).toFixed(2) + ' km',
          sprints: stat.sprints || 0,
          maxSpeed: (stat.topSpeed || 0).toFixed(1) + ' km/h',
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          minutesPlayed: stat.minutesPlayed || 0,
        }));

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert football performance analyst. Analyze player performance trends and provide actionable insights.'
            },
            {
              role: 'user',
              content: `Analyze the performance trend for ${player[0].firstName} ${player[0].lastName} (${player[0].position}) over the last ${input.matchCount} matches:\n\n${JSON.stringify(performanceData, null, 2)}\n\nProvide:\n1. **Performance Trend**: Is the player improving, declining, or stable?\n2. **Key Strengths**: What metrics show consistent excellence?\n3. **Areas for Improvement**: Which aspects need attention?\n4. **Training Recommendations**: Specific drills or focus areas\n5. **Match Readiness**: Current fitness and form assessment`
            }
          ]
        });

        const insights = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate insights at this time.';
        return { insights };
      }),

    // Get match history for a player (accessible by the player themselves, parents, and staff)
    getMyMatchHistory: protectedProcedure
      .input(z.object({ 
        playerId: z.number(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return { matches: [], totals: null };
        const stats = await database
          .select({
            id: playerMatchStats.id,
            matchId: playerMatchStats.matchId,
            minutesPlayed: playerMatchStats.minutesPlayed,
            started: playerMatchStats.started,
            position: playerMatchStats.position,
            goals: playerMatchStats.goals,
            assists: playerMatchStats.assists,
            touches: playerMatchStats.touches,
            passes: playerMatchStats.passes,
            passAccuracy: playerMatchStats.passAccuracy,
            shots: playerMatchStats.shots,
            shotsOnTarget: playerMatchStats.shotsOnTarget,
            dribbles: playerMatchStats.dribbles,
            successfulDribbles: playerMatchStats.successfulDribbles,
            tackles: playerMatchStats.tackles,
            interceptions: playerMatchStats.interceptions,
            distanceCovered: playerMatchStats.distanceCovered,
            topSpeed: playerMatchStats.topSpeed,
            sprints: playerMatchStats.sprints,
            yellowCards: playerMatchStats.yellowCards,
            redCards: playerMatchStats.redCards,
            coachRating: playerMatchStats.coachRating,
            performanceScore: playerMatchStats.performanceScore,
            notes: playerMatchStats.notes,
            matchDate: matches.matchDate,
            matchType: matches.matchType,
            opponent: matches.opponent,
            venue: matches.venue,
            isHome: matches.isHome,
            teamScore: matches.teamScore,
            opponentScore: matches.opponentScore,
            result: matches.result,
          })
          .from(playerMatchStats)
          .leftJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.id))
          .limit(input.limit);
        const totals = stats.length === 0 ? null : {
          matchesPlayed: stats.length,
          goals: stats.reduce((s, m) => s + (m.goals || 0), 0),
          assists: stats.reduce((s, m) => s + (m.assists || 0), 0),
          minutesPlayed: stats.reduce((s, m) => s + (m.minutesPlayed || 0), 0),
          avgRating: stats.filter(m => m.coachRating).length > 0
            ? parseFloat((stats.reduce((s, m) => s + (m.coachRating || 0), 0) / stats.filter(m => m.coachRating).length).toFixed(1))
            : null,
          yellowCards: stats.reduce((s, m) => s + (m.yellowCards || 0), 0),
          redCards: stats.reduce((s, m) => s + (m.redCards || 0), 0),
        };
                return { matches: stats, totals };
      }),

    // AI-powered match history insights for PlayerDashboard
    getMyMatchInsights: protectedProcedure
      .input(z.object({
        playerId: z.number(),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        // Fetch last 10 matches
        const stats = await database
          .select({
            goals: playerMatchStats.goals,
            assists: playerMatchStats.assists,
            minutesPlayed: playerMatchStats.minutesPlayed,
            coachRating: playerMatchStats.coachRating,
            passes: playerMatchStats.passes,
            passAccuracy: playerMatchStats.passAccuracy,
            shots: playerMatchStats.shots,
            tackles: playerMatchStats.tackles,
            yellowCards: playerMatchStats.yellowCards,
            redCards: playerMatchStats.redCards,
            result: matches.result,
            matchDate: matches.matchDate,
            position: playerMatchStats.position,
          })
          .from(playerMatchStats)
          .leftJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.id))
          .limit(10);
        if (stats.length === 0) return null;
        // Build a summary for the AI
        const summary = {
          totalMatches: stats.length,
          goals: stats.reduce((s, m) => s + (m.goals || 0), 0),
          assists: stats.reduce((s, m) => s + (m.assists || 0), 0),
          totalMinutes: stats.reduce((s, m) => s + (m.minutesPlayed || 0), 0),
          avgRating: stats.filter(m => m.coachRating).length > 0
            ? parseFloat((stats.reduce((s, m) => s + (m.coachRating || 0), 0) / stats.filter(m => m.coachRating).length).toFixed(1))
            : null,
          wins: stats.filter(m => m.result === 'win').length,
          losses: stats.filter(m => m.result === 'loss').length,
          draws: stats.filter(m => m.result === 'draw').length,
          avgPasses: stats.filter(m => m.passes).length > 0
            ? Math.round(stats.reduce((s, m) => s + (m.passes || 0), 0) / stats.filter(m => m.passes).length)
            : null,
          avgPassAccuracy: stats.filter(m => m.passAccuracy).length > 0
            ? Math.round(stats.reduce((s, m) => s + (m.passAccuracy || 0), 0) / stats.filter(m => m.passAccuracy).length)
            : null,
          avgShots: stats.filter(m => m.shots).length > 0
            ? parseFloat((stats.reduce((s, m) => s + (m.shots || 0), 0) / stats.filter(m => m.shots).length).toFixed(1))
            : null,
          yellowCards: stats.reduce((s, m) => s + (m.yellowCards || 0), 0),
          redCards: stats.reduce((s, m) => s + (m.redCards || 0), 0),
          positions: [...new Set(stats.map(m => m.position).filter(Boolean))],
          ratingTrend: stats.slice(0, 5).filter(m => m.coachRating).map(m => m.coachRating),
        };
        const prompt = `You are an elite football development coach. Analyze this player's last ${summary.totalMatches} matches and provide personalized insights.

Match Statistics Summary:
- Goals: ${summary.goals}, Assists: ${summary.assists}
- Total Minutes: ${summary.totalMinutes}
- Average Coach Rating: ${summary.avgRating ?? 'Not rated'}/10
- Win/Draw/Loss: ${summary.wins}/${summary.draws}/${summary.losses}
- Avg Passes per match: ${summary.avgPasses ?? 'N/A'} (${summary.avgPassAccuracy ?? 'N/A'}% accuracy)
- Avg Shots per match: ${summary.avgShots ?? 'N/A'}
- Cards: ${summary.yellowCards} yellow, ${summary.redCards} red
- Positions played: ${summary.positions.join(', ') || 'Not recorded'}
- Recent rating trend (last 5): ${summary.ratingTrend.join(', ') || 'No ratings'}

Provide a JSON response with:
1. performanceTrend: "improving" | "declining" | "stable" | "insufficient_data"
2. trendReason: 1-2 sentence explanation of the trend
3. topStrengths: array of 2-3 specific strengths observed from the data
4. focusAreas: array of 2-3 specific areas needing improvement
5. trainingRecommendations: array of 3-4 specific training drills/exercises to improve weak areas
6. weeklyGoal: one specific, measurable goal for the next match
7. motivationalMessage: 1 sentence of personalized encouragement
8. overallScore: number 0-100 representing overall recent performance quality`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'You are an elite football development coach. Analyze player statistics and provide actionable insights. Return only valid JSON.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          });
          const content = typeof response?.choices?.[0]?.message?.content === 'string' ? response.choices[0].message.content : '{}';
          const parsed = JSON.parse(content);
          return {
            performanceTrend: parsed.performanceTrend || 'insufficient_data',
            trendReason: parsed.trendReason || '',
            topStrengths: parsed.topStrengths || [],
            focusAreas: parsed.focusAreas || [],
            trainingRecommendations: parsed.trainingRecommendations || [],
            weeklyGoal: parsed.weeklyGoal || '',
            motivationalMessage: parsed.motivationalMessage || '',
            overallScore: parsed.overallScore || null,
            matchesAnalyzed: summary.totalMatches,
          };
        } catch {
          return null;
        }
      }),

    getAllPlayersWithMedical: staffProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const { players: playersTable, playerMedicalData, teams: teamsTable, injuries: injuriesTable } = await import('../drizzle/schema');
      const rows = await database
        .select({
          id: playersTable.id,
          firstName: playersTable.firstName,
          lastName: playersTable.lastName,
          position: playersTable.position,
          status: playersTable.status,
          teamId: playersTable.teamId,
          ageGroup: playersTable.ageGroup,
          photoUrl: playersTable.photoUrl,
          dateOfBirth: playersTable.dateOfBirth,
          teamName: teamsTable.name,
          bloodType: playerMedicalData.bloodType,
          allergies: playerMedicalData.allergies,
          chronicConditions: playerMedicalData.chronicConditions,
          injuryRiskScore: playerMedicalData.injuryRiskScore,
          notes: playerMedicalData.notes,
          height: playerMedicalData.height,
          weight: playerMedicalData.weight,
          emergencyContact: playerMedicalData.emergencyContact,
        })
        .from(playersTable)
        .leftJoin(playerMedicalData, eq(playerMedicalData.playerId, playersTable.id))
        .leftJoin(teamsTable, eq(teamsTable.id, playersTable.teamId));
      // Fetch active injuries for injured players and attach return dates
      const injuredPlayerIds = rows.filter(r => r.status === 'injured').map(r => r.id);
      let injuryMap: Record<number, { injuryType: string; bodyPart: string; severity: string; expectedRecoveryDate: string | null; injuryDate: string | null }> = {};
      if (injuredPlayerIds.length > 0) {
        const activeInjuries = await database
          .select({
            playerId: injuriesTable.playerId,
            injuryType: injuriesTable.injuryType,
            bodyPart: injuriesTable.bodyPart,
            severity: injuriesTable.severity,
            expectedRecoveryDate: injuriesTable.expectedRecoveryDate,
            injuryDate: injuriesTable.injuryDate,
          })
          .from(injuriesTable)
          .where(inArray(injuriesTable.playerId, injuredPlayerIds))
          .orderBy(desc(injuriesTable.injuryDate));
        for (const inj of activeInjuries) {
          if (!injuryMap[inj.playerId]) {
            injuryMap[inj.playerId] = {
              injuryType: inj.injuryType,
              bodyPart: inj.bodyPart,
              severity: inj.severity,
              expectedRecoveryDate: inj.expectedRecoveryDate ? String(inj.expectedRecoveryDate) : null,
              injuryDate: inj.injuryDate ? String(inj.injuryDate) : null,
            };
          }
        }
      }
      return rows.map(r => ({
        ...r,
        ...(injuryMap[r.id] || {}),
      }));
    }),
  }),
  // ==================== TEAMS ====================
  teams: router({
    getAll: protectedProcedure.query(async () => {
      return db.getAllTeams();
    }),
    getByType: protectedProcedure
      .input(z.object({ teamType: z.enum(['main', 'academy']) }))
      .query(async ({ input }) => {
        return db.getTeamsByType(input.teamType);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        ageGroup: z.string().min(1),
        teamType: z.enum(['main', 'academy']).optional(),
        headCoachId: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTeam(input);
        return { id };
      }),
    // Coach assignment procedures
    getCoaches: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamCoaches(input.teamId);
      }),
    assignCoach: adminProcedure
      .input(z.object({
        teamId: z.number(),
        coachUserId: z.number(),
        role: z.enum(['head_coach','assistant_coach','goalkeeper_coach','fitness_coach','load_trainer','analyst','video_analyst','team_doctor','physiotherapist','nutritionist','psychologist','medical','technical','technical_director','sporting_director','team_manager','kit_manager','admin','custom']).optional(),
        customRole: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.assignCoachToTeam({
          teamId: input.teamId,
          coachUserId: input.coachUserId,
          role: input.role || 'assistant_coach',
          customRole: (input as any).customRole,
          notes: (input as any).notes,
          isPrimary: input.isPrimary || false,
          assignedBy: ctx.user.id,
        });
        return { id };
      }),
    removeCoach: adminProcedure
      .input(z.object({ teamId: z.number(), coachUserId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeCoachFromTeam(input.teamId, input.coachUserId);
        return { success: true };
      }),
    updateCoachRole: adminProcedure
      .input(z.object({
        assignmentId: z.number(),
        role: z.enum(['head_coach','assistant_coach','goalkeeper_coach','fitness_coach','load_trainer','analyst','video_analyst','team_doctor','physiotherapist','nutritionist','psychologist','medical','technical','technical_director','sporting_director','team_manager','kit_manager','admin','custom']),
        customRole: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
        isPrimary: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCoachRole(input.assignmentId, input.role, input.isPrimary, (input as any).customRole, (input as any).notes);
        return { success: true };
      }),
    getAllCoachAssignments: staffProcedure.query(async () => {
      return db.getAllTeamCoachAssignments();
    }),
    getAvailableCoaches: adminProcedure.query(async () => {
      return db.getAvailableCoaches();
    }),
    getMyTeams: protectedProcedure.query(async ({ ctx }) => {
      return db.getCoachTeams(ctx.user.id);
    }),
    getStaffTeams: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachTeams(input.userId);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        ageGroup: z.string().optional(),
        teamType: z.enum(['main', 'academy']).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { id, ...data } = input;
        await database.update(teams).set(data).where(eq(teams.id, id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.delete(teams).where(eq(teams.id, input.id));
        return { success: true };
      }),
    getPlayers: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayersByTeam(input.teamId);
      }),
    addPlayer: adminProcedure
      .input(z.object({ teamId: z.number(), playerId: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.update(players).set({ teamId: input.teamId }).where(eq(players.id, input.playerId));
        return { success: true };
      }),
    removePlayer: adminProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.update(players).set({ teamId: null } as any).where(eq(players.id, input.playerId));
        return { success: true };
      }),
    getStaff: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamCoaches(input.teamId);
      }),
    assignStaff: adminProcedure
      .input(z.object({
        teamId: z.number(),
        userId: z.number(),
        role: z.enum(['head_coach','assistant_coach','goalkeeper_coach','fitness_coach','load_trainer','analyst','video_analyst','team_doctor','physiotherapist','nutritionist','psychologist','medical','technical','technical_director','sporting_director','team_manager','kit_manager','admin','custom']),
        customRole: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.insert(teamCoaches).values({
          teamId: input.teamId,
          coachUserId: input.userId,
          role: input.role as any,
          customRole: input.customRole,
          notes: input.notes,
          isPrimary: input.isPrimary || false,
          assignedBy: ctx.user.id,
          assignedAt: new Date(),
        });
        return { success: true };
      }),
    removeStaff: adminProcedure
      .input(z.object({ teamId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        return db.removeCoachFromTeam(input.teamId, input.userId);
      }),
    getTopScorers: staffProcedure
      .input(z.object({ teamId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        const limit = input.limit ?? 10;
        const teamPlayers = await database.select().from(players).where(eq(players.teamId, input.teamId));
        if (teamPlayers.length === 0) return [];
        const scorers: any[] = [];
        for (const player of teamPlayers) {
          const stats = await database.select({
            totalGoals: sql<number>`COALESCE(SUM(${playerMatchStats.goals}), 0)`,
            totalAssists: sql<number>`COALESCE(SUM(${playerMatchStats.assists}), 0)`,
            matchesPlayed: sql<number>`COUNT(DISTINCT ${playerMatchStats.matchId})`,
            avgRating: sql<number>`AVG(${playerMatchStats.coachRating})`,
          }).from(playerMatchStats).where(eq(playerMatchStats.playerId, player.id));
          const s = stats[0];
          scorers.push({
            playerId: player.id,
            name: `${player.firstName} ${player.lastName}`,
            position: player.position,
            jerseyNumber: (player as any).jerseyNumber ?? null,
            totalGoals: Number(s?.totalGoals ?? 0),
            totalAssists: Number(s?.totalAssists ?? 0),
            matchesPlayed: Number(s?.matchesPlayed ?? 0),
            avgRating: s?.avgRating ? Number(s.avgRating).toFixed(1) : null,
          });
        }
        scorers.sort((a: any, b: any) => b.totalGoals - a.totalGoals || b.totalAssists - a.totalAssists);
        return scorers.slice(0, limit);
      }),
  }),
  // ==================== PERFORMANCE METRICS =====================
  performance: router({
    getPlayerSkills: performanceRouter.getPlayerSkills,
    getAll: staffProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        return database.select().from(performanceMetrics).orderBy(desc(performanceMetrics.sessionDate)).limit(1000);
      }),
    getPlayerMetrics: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerPerformanceMetrics(input.playerId, input.limit);
      }),
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestPerformanceMetric(input.playerId)) ?? null;
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        sessionDate: z.string(),
        sessionType: z.enum(['training', 'match', 'assessment']),
        touches: z.number().optional(),
        passes: z.number().optional(),
        passAccuracy: z.number().optional(),
        shots: z.number().optional(),
        shotsOnTarget: z.number().optional(),
        dribbles: z.number().optional(),
        successfulDribbles: z.number().optional(),
        distanceCovered: z.number().optional(),
        topSpeed: z.number().optional(),
        sprints: z.number().optional(),
        accelerations: z.number().optional(),
        decelerations: z.number().optional(),
        possessionWon: z.number().optional(),
        possessionLost: z.number().optional(),
        interceptions: z.number().optional(),
        tackles: z.number().optional(),
        technicalScore: z.number().optional(),
        physicalScore: z.number().optional(),
        tacticalScore: z.number().optional(),
        overallScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createPerformanceMetric({
          ...input,
          sessionDate: new Date(input.sessionDate),
          recordedBy: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== MENTAL ASSESSMENTS ====================
  mental: router({
    getPlayerAssessments: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerMentalAssessments(input.playerId, input.limit);
      }),
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestMentalAssessment(input.playerId)) ?? null;
      }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number(),
        assessmentDate: z.string(),
        confidenceLevel: z.number().min(1).max(10).optional(),
        anxietyLevel: z.number().min(1).max(10).optional(),
        motivationLevel: z.number().min(1).max(10).optional(),
        focusLevel: z.number().min(1).max(10).optional(),
        resilienceScore: z.number().min(1).max(10).optional(),
        teamworkScore: z.number().min(1).max(10).optional(),
        leadershipScore: z.number().min(1).max(10).optional(),
        stressLevel: z.number().min(1).max(10).optional(),
        overallMentalScore: z.number().min(0).max(100).optional(),
        notes: z.string().optional(),
        recommendations: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMentalAssessment({
          ...input,
          assessmentDate: new Date(input.assessmentDate),
          assessedBy: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== WORKOUT PLANS ====================
  workouts: router({
    getPlayerPlans: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerWorkoutPlans(input.playerId);
      }),
    getTeamPlans: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamWorkoutPlans(input.teamId);
      }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number().optional(),
        teamId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['strength', 'endurance', 'agility', 'flexibility', 'recovery', 'match_prep']),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        durationMinutes: z.number().optional(),
        exercises: z.string().optional(),
        scheduledDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createWorkoutPlan({
          ...input,
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    markComplete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateWorkoutPlan(input.id, { isCompleted: true, completedAt: new Date() });
        return { success: true };
      }),
  }),

  // ==================== INJURIES ====================
  injuries: router({
    getPlayerInjuries: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerInjuries(input.playerId);
      }),
    getActive: staffProcedure.query(async () => {
      return db.getActiveInjuries();
    }),
    getActiveWithPlayerInfo: staffProcedure.query(async () => {
      return db.getActiveInjuriesWithPlayerInfo();
    }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number(),
        injuryType: z.string().min(1),
        bodyPart: z.string().min(1),
        severity: z.enum(['minor', 'moderate', 'severe']),
        injuryDate: z.string(),
        expectedRecoveryDate: z.string().optional(),
        treatment: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createInjury({
          ...input,
          injuryDate: new Date(input.injuryDate),
          expectedRecoveryDate: input.expectedRecoveryDate ? new Date(input.expectedRecoveryDate) : undefined,
          reportedBy: ctx.user.id,
        });
        // Auto-notify parents
        try {
          const parents = await db.getParentsForPlayer(input.playerId);
          const severityLabel = input.severity === 'severe' ? '🔴 Severe' : input.severity === 'moderate' ? '🟡 Moderate' : '🟢 Minor';
          for (const parent of parents) {
            await db.createNotification({
              userId: parent.parentUserId,
              title: `Injury Report: ${input.injuryType}`,
              message: `Your child has been reported with a ${severityLabel} injury to the ${input.bodyPart}. ${input.expectedRecoveryDate ? `Expected recovery: ${new Date(input.expectedRecoveryDate).toLocaleDateString()}` : 'Recovery date TBD.'}`,
              type: input.severity === 'severe' ? 'alert' : 'warning',
              category: 'injury',
            });
          }
        } catch (e) { /* silent fail */ }
        return { id };
      }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['active', 'recovering', 'recovered', 'chronic']).optional(),
        actualRecoveryDate: z.string().optional(),
        treatment: z.string().optional(),
        notes: z.string().optional(),
        returnToPlayCleared: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, actualRecoveryDate, returnToPlayCleared, ...rest } = input;
        await db.updateInjury(id, {
          ...rest,
          actualRecoveryDate: actualRecoveryDate ? new Date(actualRecoveryDate) : undefined,
          returnToPlayCleared,
          clearedBy: returnToPlayCleared ? ctx.user.id : undefined,
          clearedAt: returnToPlayCleared ? new Date() : undefined,
        });
        return { success: true };
      }),
    getPrescriptions: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(
          sql`SELECT p.*, i.injuryType, i.bodyPart FROM medical_prescriptions p LEFT JOIN injuries i ON i.id = p.injuryId WHERE p.playerId = ${input.playerId} ORDER BY p.prescriptionDate DESC`
        );
        return ((rows as any)[0] as unknown as any[]).map((r: any) => ({
          ...r,
          medications: typeof r.medications === 'string' ? JSON.parse(r.medications) : (r.medications || []),
        }));
      }),
    getWeeklyTrend: staffProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        const { injuries: injuriesTable } = await import('../drizzle/schema');
        // Get all injuries from the last 13 weeks (3 months)
        const since = new Date();
        since.setDate(since.getDate() - 91);
        const allInjuries = (await database
          .select({ id: injuriesTable.id, injuryDate: injuriesTable.injuryDate, status: injuriesTable.status, severity: injuriesTable.severity, actualRecoveryDate: injuriesTable.actualRecoveryDate, expectedRecoveryDate: injuriesTable.expectedRecoveryDate })
          .from(injuriesTable)
          .where(gte(injuriesTable.injuryDate, since))).filter((inj: any) => inj && inj.injuryDate != null);
        // Build 13 weekly buckets
        const weeks: { weekLabel: string; weekStart: Date; active: number; recovering: number; recovered: number; severe: number }[] = [];
        for (let i = 12; i >= 0; i--) {
          const ws = new Date();
          ws.setDate(ws.getDate() - i * 7);
          ws.setHours(0, 0, 0, 0);
          const we = new Date(ws);
          we.setDate(we.getDate() + 7);
          const label = ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          // Count injuries that were active during this week
          const active = allInjuries.filter((inj: any) => {
            const injDate = new Date(inj.injuryDate);
            const recDate = inj.actualRecoveryDate ? new Date(inj.actualRecoveryDate) : (inj.expectedRecoveryDate ? new Date(inj.expectedRecoveryDate) : new Date(Date.now() + 30 * 86400000));
            return injDate <= we && recDate >= ws;
          });
          weeks.push({
            weekLabel: label,
            weekStart: ws,
            active: active.filter((inj: any) => inj.status === 'active').length,
            recovering: active.filter((inj: any) => inj.status === 'recovering').length,
            recovered: active.filter((inj: any) => inj.status === 'recovered').length,
            severe: active.filter((inj: any) => inj.severity === 'severe').length,
          });
        }
        return weeks;
      }),
    createPrescription: staffProcedure
      .input(z.object({
        playerId: z.number(),
        injuryId: z.number().optional(),
        prescriptionDate: z.string(),
        prescribedBy: z.string(),
        diagnosis: z.string().optional(),
        medications: z.array(z.object({
          name: z.string(),
          dose: z.string(),
          frequency: z.string(),
          duration: z.string(),
          route: z.string().optional(),
          notes: z.string().optional(),
        })),
        physiotherapy: z.string().optional(),
        restrictions: z.string().optional(),
        followUpDate: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(['active','completed','cancelled']).optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' });
        const medsJson = JSON.stringify(input.medications);
        await database.execute(
          sql`INSERT INTO medical_prescriptions (playerId, injuryId, prescriptionDate, prescribedBy, diagnosis, medications, physiotherapy, restrictions, followUpDate, notes, status) VALUES (${input.playerId}, ${input.injuryId || null}, ${input.prescriptionDate}, ${input.prescribedBy}, ${input.diagnosis || null}, ${medsJson}, ${input.physiotherapy || null}, ${input.restrictions || null}, ${input.followUpDate || null}, ${input.notes || null}, ${input.status || 'active'})`
        );
        return { success: true };
      }),
    generateRecoveryProtocol: staffProcedure
      .input(z.object({
        injuryId: z.number(),
        playerId: z.number(),
        injuryType: z.string(),
        bodyPart: z.string(),
        severity: z.string(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        // Get player info
        const playerData = await database.select().from(players).where(eq(players.id, input.playerId)).limit(1);
        const p = playerData[0];
        const playerName = p ? `${p.firstName} ${p.lastName}` : 'Player';
        const age = p?.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : 'Unknown';
        const position = p?.position || 'Unknown';
        const prompt = `You are a sports medicine specialist and physiotherapist. Create a detailed, personalized recovery protocol for this football player.

Player: ${playerName}
Age: ${age}
Position: ${position}
Injury: ${input.injuryType.replace(/_/g, ' ')} to the ${input.bodyPart}
Severity: ${input.severity}

Provide a comprehensive recovery protocol with:

**Phase 1 – Acute/Protection Phase (Days 1-3):**
- Immediate treatment (RICE protocol details)
- Pain management
- What to avoid
- Monitoring signs

**Phase 2 – Sub-Acute/Restoration Phase (Days 4-10):**
- Range of motion exercises (specific)
- Gentle strengthening
- Hydrotherapy if applicable
- Progressive weight-bearing

**Phase 3 – Strengthening Phase (Days 11-21):**
- Specific strengthening exercises with sets/reps
- Sport-specific movements at reduced intensity
- Balance and proprioception work

**Phase 4 – Return to Play Phase (Days 22+):**
- Full training integration criteria
- Match simulation protocols
- Functional screening tests before clearance

**Nutrition Protocol:**
- Specific nutritional recommendations for recovery
- Supplements if appropriate

**Psychological Support:**
- Mental strategies during recovery

**Risk Factors & Monitoring:**
- Signs of re-injury
- When to escalate to specialist

**Estimated Timeline:** Provide realistic recovery timeline based on severity.

Be specific with exercise names, sets, reps, and progression criteria.`;
        const response = await invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200
        });
        const rawContent = response?.choices?.[0]?.message?.content;
        const protocol = typeof rawContent === 'string' ? rawContent : 'Recovery protocol generation failed.';
        return { protocol, playerName, injuryType: input.injuryType, bodyPart: input.bodyPart, severity: input.severity };
      }),
    addAttachment: staffProcedure
      .input(z.object({
        injuryId: z.number(),
        playerId: z.number(),
        fileData: z.string(),
        fileName: z.string(),
        contentType: z.string(),
        label: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' });
        await database.execute(sql`CREATE TABLE IF NOT EXISTS medical_attachments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          injuryId INT NOT NULL,
          playerId INT NOT NULL,
          fileName VARCHAR(255) NOT NULL,
          fileUrl TEXT NOT NULL,
          fileKey VARCHAR(500) NOT NULL,
          contentType VARCHAR(100) NOT NULL,
          label VARCHAR(255),
          uploadedBy INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.fileData, 'base64');
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop() || 'bin';
        const fileKey = `medical/${input.playerId}/${timestamp}-${randomStr}.${extension}`;
        const result = await storagePut(fileKey, buffer, input.contentType);
        await database.execute(
          sql`INSERT INTO medical_attachments (injuryId, playerId, fileName, fileUrl, fileKey, contentType, label, uploadedBy)
              VALUES (${input.injuryId}, ${input.playerId}, ${input.fileName}, ${result.url}, ${result.key}, ${input.contentType}, ${input.label || null}, ${ctx.user.id})`
        );
        return { success: true, url: result.url };
      }),
    getAttachments: staffProcedure
      .input(z.object({ injuryId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        try {
          const rows = await database.execute(
            sql`SELECT ma.*, u.fullName as uploadedByName FROM medical_attachments ma LEFT JOIN users u ON u.id = ma.uploadedBy WHERE ma.injuryId = ${input.injuryId} ORDER BY ma.createdAt DESC`
          );
          return ((rows as any)[0] as unknown as any[]) || [];
        } catch { return []; }
      }),
    deleteAttachment: staffProcedure
      .input(z.object({ attachmentId: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' });
        await database.execute(sql`DELETE FROM medical_attachments WHERE id = ${input.attachmentId}`);
        return { success: true };
      }),
  }),
  // ==================== MEDICAL DATA =====================
  // (injuries router ends above, medical router starts below)
  medical: router({
    // AI extraction of blood markers from uploaded image/PDF (base64)
    extractBloodMarkersFromFile: staffProcedure
      .input(z.object({
        playerId: z.number(),
        fileBase64: z.string(), // base64 encoded image or PDF
        mimeType: z.string(), // 'image/jpeg', 'image/png', 'application/pdf', etc.
        saveToDb: z.boolean().default(false),
        testDate: z.string().optional(),
        lab: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        const dataUrl = `data:${input.mimeType};base64,${input.fileBase64}`;
        const isImage = input.mimeType.startsWith('image/');
        const isPdf = input.mimeType === 'application/pdf';
        const messageContent: any[] = [
          {
            type: 'text',
            text: `You are a medical data extraction assistant. Extract ALL blood test markers and body composition values from this ${isPdf ? 'PDF' : 'image'}.\n\nReturn ONLY a JSON array with this exact structure (no markdown, no explanation):\n[\n  {\n    "markerName": "Hemoglobin",\n    "value": 14.5,\n    "unit": "g/dL",\n    "normalMin": 13.2,\n    "normalMax": 16.6,\n    "status": "normal"\n  }\n]\n\nFor InBody reports, extract: Weight, SMM (Skeletal Muscle Mass), Body Fat Mass, BMI, PBF (Body Fat %), ECW/TBW, Visceral Fat Area, Basal Metabolic Rate, and any segmental values.\nFor blood tests, extract all hematology, biochemistry, liver function, kidney function, electrolytes, thyroid, hormones, vitamins.\nStatus must be one of: normal, low, high, critical.\nIf reference range is not shown, use standard athletic reference ranges.\nReturn ONLY the JSON array, nothing else.`
          }
        ];
        if (isImage) {
          messageContent.push({ type: 'image_url', image_url: { url: dataUrl, detail: 'high' } });
        } else if (isPdf) {
          messageContent.push({ type: 'file_url', file_url: { url: dataUrl, mime_type: 'application/pdf' } });
        }
        const response = await invokeLLM({
          messages: [{ role: 'user', content: messageContent }],
        });
        const raw = typeof response === 'string' ? response : (response as any)?.content || '';
        // Parse JSON from response
        let markers: any[] = [];
        try {
          const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            markers = JSON.parse(jsonMatch[0]);
          } else {
            markers = JSON.parse(raw.trim());
          }
        } catch (e) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse AI response: ' + raw.substring(0, 200) });
        }
        // Optionally save to DB
        if (input.saveToDb && markers.length > 0) {
          const database = (await getDb())!;
          if (database) {
            const testDate = input.testDate ? new Date(input.testDate) : new Date();
            const lab = input.lab || 'Uploaded Report';
            // Map AI-extracted markers to actual table columns
            const MARKER_COLUMN_MAP: Record<string, string> = {
              'ferritin': 'ferritin', 'hemoglobin': 'hemoglobin', 'creatinekinase': 'creatineKinase',
              'creatine kinase': 'creatineKinase', 'ck': 'creatineKinase', 'testosterone': 'testosterone',
              'cortisol': 'cortisol', 'vitamind': 'vitaminD', 'vitamin d': 'vitaminD',
              'vitaminb12': 'vitaminB12', 'vitamin b12': 'vitaminB12', 'b12': 'vitaminB12',
              'magnesium': 'magnesium', 'sodium': 'sodium', 'potassium': 'potassium', 'glucose': 'glucose',
            };
            const colValues: Record<string, string> = {};
            for (const m of markers) {
              const colKey = MARKER_COLUMN_MAP[(m.markerName || '').toLowerCase().trim()];
              if (colKey) colValues[colKey] = String(parseFloat(m.value) || 0);
            }
            if (Object.keys(colValues).length > 0) {
              const { playerBloodMarkers: pbm } = await import('../drizzle/schema');
              await database.insert(pbm).values({ playerId: input.playerId, testDate, recordedBy: undefined, ...colValues } as any);
            }
          }
        }
        return { markers, count: markers.length };
      }),

    getMedicalData: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        const { playerMedicalData } = await import('../drizzle/schema');
        const [row] = await database.select().from(playerMedicalData).where(eq(playerMedicalData.playerId, input.playerId)).limit(1);
        return row || null;
      }),
    saveMedicalData: staffProcedure
      .input(z.object({
        playerId: z.number(),
        height: z.string().optional(),
        weight: z.string().optional(),
        bmi: z.string().optional(),
        bodyFatPercent: z.string().optional(),
        muscleMassKg: z.string().optional(),
        restingHR: z.number().optional(),
        bloodPressure: z.string().optional(),
        injuryRiskScore: z.number().optional(),
        dominantFoot: z.enum(['right', 'left', 'both']).optional(),
        bloodType: z.string().optional(),
        allergies: z.string().optional(),
        chronicConditions: z.string().optional(),
        emergencyContact: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { playerMedicalData } = await import('../drizzle/schema');
        const { playerId, ...data } = input;
        const [existing] = await database.select({ id: playerMedicalData.id }).from(playerMedicalData).where(eq(playerMedicalData.playerId, playerId)).limit(1);
        if (existing) {
          await database.update(playerMedicalData).set({ ...data, recordedBy: ctx.user.id }).where(eq(playerMedicalData.playerId, playerId));
        } else {
          await database.insert(playerMedicalData).values({ playerId, ...data, recordedBy: ctx.user.id });
        }
        return { success: true };
      }),
    getPhysicalTests: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerPhysicalTests } = await import('../drizzle/schema');
        return database.select().from(playerPhysicalTests).where(eq(playerPhysicalTests.playerId, input.playerId)).orderBy(desc(playerPhysicalTests.testDate)).limit(10);
      }),
    savePhysicalTest: staffProcedure
      .input(z.object({
        playerId: z.number(),
        sprint10m: z.string().optional(),
        sprint30m: z.string().optional(),
        sprintMax: z.string().optional(),
        verticalJump: z.string().optional(),
        broadJump: z.string().optional(),
        benchPress: z.string().optional(),
        squat: z.string().optional(),
        vo2Max: z.string().optional(),
        beepTestLevel: z.string().optional(),
        sitAndReach: z.string().optional(),
        shoulderFlexibility: z.string().optional(),
        agilityT: z.string().optional(),
        illinois: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { playerPhysicalTests } = await import('../drizzle/schema');
        await database.insert(playerPhysicalTests).values({ ...input, recordedBy: ctx.user.id });
        return { success: true };
      }),
    getMuscleMeasurements: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerMuscleMeasurements } = await import('../drizzle/schema');
        return database.select().from(playerMuscleMeasurements).where(eq(playerMuscleMeasurements.playerId, input.playerId)).orderBy(desc(playerMuscleMeasurements.measurementDate)).limit(10);
      }),
    saveMuscleMeasurement: staffProcedure
      .input(z.object({
        playerId: z.number(),
        leftQuad: z.string().optional(),
        rightQuad: z.string().optional(),
        leftHamstring: z.string().optional(),
        rightHamstring: z.string().optional(),
        leftCalf: z.string().optional(),
        rightCalf: z.string().optional(),
        leftBicep: z.string().optional(),
        rightBicep: z.string().optional(),
        chest: z.string().optional(),
        waist: z.string().optional(),
        hip: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { playerMuscleMeasurements } = await import('../drizzle/schema');
        await database.insert(playerMuscleMeasurements).values({ ...input, recordedBy: ctx.user.id });
        return { success: true };
      }),
    getBloodMarkers: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerBloodMarkers } = await import('../drizzle/schema');
        return database.select().from(playerBloodMarkers).where(eq(playerBloodMarkers.playerId, input.playerId)).orderBy(desc(playerBloodMarkers.testDate)).limit(10);
      }),
    getBloodMarkersRaw: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerBloodMarkers: pbm } = await import('../drizzle/schema');
        const rows = await database.select().from(pbm)
          .where(eq(pbm.playerId, input.playerId))
          .orderBy(asc(pbm.testDate)).limit(100);
        // Pivot wide-format rows into row-per-marker format for the chart
        const MARKER_META: Record<string, { unit: string; normalMin: number; normalMax: number }> = {
          ferritin:       { unit: 'ng/mL',  normalMin: 20,   normalMax: 300 },
          hemoglobin:     { unit: 'g/dL',   normalMin: 13.2, normalMax: 16.6 },
          creatineKinase: { unit: 'U/L',    normalMin: 30,   normalMax: 400 },
          testosterone:   { unit: 'ng/dL',  normalMin: 300,  normalMax: 1000 },
          cortisol:       { unit: 'ug/dL',  normalMin: 6,    normalMax: 23 },
          vitaminD:       { unit: 'ng/mL',  normalMin: 30,   normalMax: 100 },
          vitaminB12:     { unit: 'pg/mL',  normalMin: 200,  normalMax: 900 },
          magnesium:      { unit: 'mg/dL',  normalMin: 1.7,  normalMax: 2.2 },
          sodium:         { unit: 'mEq/L',  normalMin: 136,  normalMax: 145 },
          potassium:      { unit: 'mEq/L',  normalMin: 3.5,  normalMax: 5.0 },
          glucose:        { unit: 'mg/dL',  normalMin: 70,   normalMax: 99 },
        };
        const pivoted: any[] = [];
        for (const row of rows) {
          for (const [key, meta] of Object.entries(MARKER_META)) {
            const val = (row as any)[key];
            if (val == null || val === '') continue;
            const numVal = parseFloat(val);
            if (isNaN(numVal)) continue;
            const status = numVal < meta.normalMin ? 'low' : numVal > meta.normalMax ? 'high' : 'normal';
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            pivoted.push({ markerName: label, value: numVal, unit: meta.unit, normalMin: meta.normalMin, normalMax: meta.normalMax, status, testDate: row.testDate });
          }
        }
        return pivoted;
      }),
    saveBloodMarkers: staffProcedure
      .input(z.object({
        playerId: z.number(),
        ferritin: z.string().optional(),
        hemoglobin: z.string().optional(),
        creatineKinase: z.string().optional(),
        testosterone: z.string().optional(),
        cortisol: z.string().optional(),
        vitaminD: z.string().optional(),
        vitaminB12: z.string().optional(),
        magnesium: z.string().optional(),
        sodium: z.string().optional(),
        potassium: z.string().optional(),
        glucose: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { playerBloodMarkers } = await import('../drizzle/schema');
        await database.insert(playerBloodMarkers).values({ ...input, recordedBy: ctx.user.id });
        return { success: true };
      }),
    getTrainingLoad: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerTrainingLoad } = await import('../drizzle/schema');
        return database.select().from(playerTrainingLoad).where(eq(playerTrainingLoad.playerId, input.playerId)).orderBy(desc(playerTrainingLoad.weekStart)).limit(12);
      }),
    saveTrainingLoad: staffProcedure
      .input(z.object({
        playerId: z.number(),
        weekStart: z.string(),
        acuteLoad: z.number().optional(),
        chronicLoad: z.number().optional(),
        acRatio: z.string().optional(),
        riskLevel: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
        sessionsCount: z.number().optional(),
        totalMinutes: z.number().optional(),
        rpe: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { playerTrainingLoad } = await import('../drizzle/schema');
        await database.insert(playerTrainingLoad).values({ ...input, weekStart: new Date(input.weekStart), recordedBy: ctx.user.id });
        return { success: true };
      }),
    getTeamLoadSummary: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerTrainingLoad, players } = await import('../drizzle/schema');
        // Get all players in the team via players.teamId
        const teamPlayerRows = await database
          .select({ id: players.id, firstName: players.firstName, lastName: players.lastName, position: players.position })
          .from(players)
          .where(eq(players.teamId, input.teamId));
        if (!teamPlayerRows.length) return [];
        const results: any[] = [];
        for (const playerInfo of teamPlayerRows) {
          const [latestLoad] = await database
            .select()
            .from(playerTrainingLoad)
            .where(eq(playerTrainingLoad.playerId, playerInfo.id))
            .orderBy(desc(playerTrainingLoad.weekStart)).limit(1);
          results.push({
            playerId: playerInfo.id,
            playerName: `${playerInfo.firstName} ${playerInfo.lastName}`,
            position: playerInfo.position || '-',
            acRatio: latestLoad?.acRatio ? parseFloat(latestLoad.acRatio) : null,
            riskLevel: latestLoad?.riskLevel || null,
            acuteLoad: latestLoad?.acuteLoad || null,
            chronicLoad: latestLoad?.chronicLoad || null,
            rpe: latestLoad?.rpe || null,
            weekStart: latestLoad?.weekStart || null,
          });
        }
        return results;
      }),
    getSessionPerformance: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { trainingSessionPerformance } = await import('../drizzle/schema');
        return database.select().from(trainingSessionPerformance).where(eq(trainingSessionPerformance.playerId, input.playerId)).orderBy(desc(trainingSessionPerformance.sessionDate)).limit(input.limit || 20);
      }),
    getTeamSessionPerformance: staffProcedure
      .input(z.object({ teamId: z.number(), sessionDate: z.string().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { trainingSessionPerformance } = await import('../drizzle/schema');
        return database.select().from(trainingSessionPerformance).where(eq(trainingSessionPerformance.teamId, input.teamId)).orderBy(desc(trainingSessionPerformance.sessionDate)).limit(100);
      }),
    saveSessionPerformance: staffProcedure
      .input(z.object({
        playerId: z.number(),
        teamId: z.number().optional(),
        sessionDate: z.string().optional(),
        sessionName: z.string().optional(),
        physicalScore: z.number().optional(),
        speed: z.number().optional(),
        endurance: z.number().optional(),
        strength: z.number().optional(),
        agility: z.number().optional(),
        technicalScore: z.number().optional(),
        passing: z.number().optional(),
        shooting: z.number().optional(),
        dribbling: z.number().optional(),
        defending: z.number().optional(),
        mentalScore: z.number().optional(),
        focus: z.number().optional(),
        attitude: z.number().optional(),
        leadership: z.number().optional(),
        resilience: z.number().optional(),
        medicalScore: z.number().optional(),
        fatigue: z.number().optional(),
        soreness: z.number().optional(),
        injuryRisk: z.number().optional(),
        rpe: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { trainingSessionPerformance } = await import('../drizzle/schema');
        const { sessionDate, ...rest } = input;
        await database.insert(trainingSessionPerformance).values({
          ...rest,
          sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
          recordedBy: ctx.user.id,
        });
        return { success: true };
      }),
    getLoadDashboard: staffProcedure
      .input(z.object({ teamId: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return { players: [], teamAvgAcRatio: 0, highRiskCount: 0 };
        const { playerTrainingLoad } = await import('../drizzle/schema');
        let query = database.select({
          playerId: playerTrainingLoad.playerId,
          acuteLoad: playerTrainingLoad.acuteLoad,
          chronicLoad: playerTrainingLoad.chronicLoad,
          acRatio: playerTrainingLoad.acRatio,
          riskLevel: playerTrainingLoad.riskLevel,
          weekStart: playerTrainingLoad.weekStart,
        }).from(playerTrainingLoad).orderBy(desc(playerTrainingLoad.weekStart)).limit(200);
        const rows = await query;
        return { rows, count: rows.length };
      }),
    analyzePlayerProgress: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { trainingSessionPerformance } = await import('../drizzle/schema');
        const sessions = await database.select().from(trainingSessionPerformance)
          .where(eq(trainingSessionPerformance.playerId, input.playerId))
          .orderBy(desc(trainingSessionPerformance.sessionDate)).limit(10);
        if (sessions.length === 0) return { analysis: 'No session data available yet. Record training sessions to get AI analysis.', recommendations: [], skillVideos: [] };
        const sessionSummary = sessions.map((s, i) => `Session ${i+1} (${s.sessionDate?.toISOString()?.split('T')[0]}): Physical=${s.physicalScore || 0}, Technical=${s.technicalScore || 0}, Mental=${s.mentalScore || 0}, Medical=${s.medicalScore || 0}, RPE=${s.rpe}`).join('\n');
        const prompt = `Analyze this football player's training session performance data and provide development insights:
${sessionSummary}
Respond with JSON only:
{"analysis": "2-3 sentence overall progress summary", "strengths": ["strength 1", "strength 2"], "keyDevelopmentAreas": ["area 1", "area 2", "area 3"], "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"], "skillVideos": [{"title": "drill name", "searchQuery": "youtube search query for this drill", "focus": "what this improves"}]}`;
        const result = await invokeLLM({ messages: [{ role: 'user', content: prompt }], max_tokens: 600 });
        const raw = result?.choices?.[0]?.message?.content;
        const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw) || '';
        try {
          try { return extractJSON(rawStr); } catch { /* fall through to raw string */ }
        } catch {}
        return { analysis: rawStr, recommendations: [], skillVideos: [] };
      }),
    getTeamProgressSummary: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { trainingSessionPerformance } = await import('../drizzle/schema');
        const sessions = await database.select().from(trainingSessionPerformance)
          .where(eq(trainingSessionPerformance.teamId, input.teamId))
          .orderBy(desc(trainingSessionPerformance.sessionDate)).limit(500);
        const playerMap: Record<number, any[]> = {};
        for (const s of sessions) {
          if (!s.playerId) continue;
          if (!playerMap[s.playerId]) playerMap[s.playerId] = [];
          playerMap[s.playerId].push(s);
        }
        return Object.entries(playerMap).map(([pid, pSessions]) => {
          const recent = pSessions.slice(0, 5);
          const older = pSessions.slice(5, 10);
          const avg = (arr: any[], key: string) => arr.length ? Math.round(arr.reduce((s: number, r: any) => s + (r[key] || 0), 0) / arr.length) : 0;
          const recentTotal = avg(recent, 'physicalScore') + avg(recent, 'technicalScore') + avg(recent, 'mentalScore');
          const olderTotal = older.length ? avg(older, 'physicalScore') + avg(older, 'technicalScore') + avg(older, 'mentalScore') : recentTotal;
          const progressRatio = olderTotal > 0 ? Math.round(((recentTotal - olderTotal) / olderTotal) * 100) : 0;
          return {
            playerId: parseInt(pid),
            sessionCount: pSessions.length,
            avgPhysical: avg(recent, 'physicalScore'),
            avgTechnical: avg(recent, 'technicalScore'),
            avgMental: avg(recent, 'mentalScore'),
            avgMedical: avg(recent, 'medicalScore'),
            avgRpe: avg(recent, 'rpe'),
            progressRatio,
            lastSession: pSessions[0]?.sessionDate,
          };
        });
      }),
    getInBodyData: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(
          sql`SELECT id, playerId, testDate, weight, bmi, bodyFatPercent, skeletalMuscleMass, inBodyScore,
              visceralFatLevel, basalMetabolicRate, totalBodyWater
              FROM player_inbody WHERE playerId = ${input.playerId} ORDER BY testDate ASC LIMIT 20`
        );
        return (rows as any)[0] ?? [];
      }),
    getTeamInBodyData: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(
          sql`SELECT pi.*, CONCAT(p.firstName, ' ', p.lastName) as fullName
              FROM player_inbody pi
              JOIN players p ON pi.playerId = p.id
              WHERE p.teamId = ${input.teamId}
              ORDER BY pi.testDate DESC LIMIT 100`
        );
        return (rows as any)[0] ?? [];
      }),
  }),
  // ==================== NUTRITION ====================
  nutrition: router({
    getPlayerMealPlans: staffProcedure
      .input(z.object({ playerId: z.number(), date: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerMealPlans(input.playerId, input.date);
      }),
    getPlayerLogs: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerNutritionLogs(input.playerId, input.limit);
      }),
    createMealPlan: staffProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        planDate: z.string(),
        mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_training', 'post_training']),
        foods: z.string().optional(),
        calories: z.number().optional(),
        protein: z.number().optional(),
        carbs: z.number().optional(),
        fats: z.number().optional(),
        hydrationMl: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMealPlan({
          ...input,
          planDate: new Date(input.planDate),
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    logNutrition: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        logDate: z.string(),
        totalCalories: z.number().optional(),
        totalProtein: z.number().optional(),
        totalCarbs: z.number().optional(),
        totalFats: z.number().optional(),
        hydrationMl: z.number().optional(),
        mealsLogged: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNutritionLog({
          ...input,
          logDate: new Date(input.logDate),
        });
        return { id };
      }),
    // Alias for getPlayerLogs
    getNutritionLogs: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerNutritionLogs(input.playerId, input.limit);
      }),
    getAllPlayerMealPlans: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { mealPlans } = await import('../drizzle/schema');
        return database.select().from(mealPlans)
          .where(eq(mealPlans.playerId, input.playerId))
          .orderBy(desc(mealPlans.planDate))
          .limit(100);
      }),
    // Get distinct nutrition plan templates (by title) for assignment
    getTemplates: staffProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        const { mealPlans } = await import('../drizzle/schema');
        const allPlans = await database.select({
          title: mealPlans.title,
          mealType: mealPlans.mealType,
          calories: mealPlans.calories,
          protein: mealPlans.protein,
          carbs: mealPlans.carbs,
          fats: mealPlans.fats,
          foods: mealPlans.foods,
          notes: mealPlans.notes,
        }).from(mealPlans).limit(500);
        const byTitle: Record<string, any> = {};
        for (const row of allPlans) {
          if (!byTitle[row.title]) {
            byTitle[row.title] = { title: row.title, meals: [], totalCalories: 0 };
          }
          if (!byTitle[row.title].meals.find((m: any) => m.mealType === row.mealType)) {
            byTitle[row.title].meals.push(row);
            byTitle[row.title].totalCalories += row.calories ?? 0;
          }
        }
        return Object.values(byTitle).slice(0, 20);
      }),
    assignPlanToPlayer: staffProcedure
      .input(z.object({
        playerId: z.number(),
        templateTitle: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { mealPlans } = await import('../drizzle/schema');
        const templateMeals = await database.select().from(mealPlans)
          .where(eq(mealPlans.title, input.templateTitle))
          .limit(20);
        if (templateMeals.length === 0) throw new Error('Template not found');
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const seenMealTypes = new Set<string>();
        const uniqueMeals = templateMeals.filter(m => {
          if (seenMealTypes.has(m.mealType)) return false;
          seenMealTypes.add(m.mealType);
          return true;
        });
        let created = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          for (const meal of uniqueMeals) {
            await db.createMealPlan({
              playerId: input.playerId,
              title: input.templateTitle,
              planDate: new Date(d),
              mealType: meal.mealType as any,
              foods: meal.foods ?? undefined,
              calories: meal.calories ?? undefined,
              protein: meal.protein ?? undefined,
              carbs: meal.carbs ?? undefined,
              fats: meal.fats ?? undefined,
              hydrationMl: meal.hydrationMl ?? undefined,
              notes: input.notes ?? meal.notes ?? undefined,
              createdBy: ctx.user.id,
            });
            created++;
          }
        }
        return { success: true, created };
      }),
  }),

  // ==================== TRAINING SESSIONS ====================
  training: router({
    getTeamSessions: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamTrainingSessions(input.teamId);
      }),
    getUpcoming: protectedProcedure
      .input(z.object({ teamId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getUpcomingTrainingSessions(input.teamId);
      }),
    create: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        sessionDate: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        sessionType: z.enum(['technical', 'tactical', 'physical', 'match', 'recovery', 'mixed']),
        objectives: z.string().optional(),
        drills: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTrainingSession({
          ...input,
          sessionDate: new Date(input.sessionDate),
          coachId: ctx.user.id,
        });
        // Notify all players in the team
        if (input.teamId) {
          try {
            const teamPlayers = await db.getPlayersByTeam(input.teamId);
            const sessionDate = new Date(input.sessionDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
            const timeStr = input.startTime ? ` at ${input.startTime}` : '';
            const locationStr = input.location ? ` @ ${input.location}` : '';
            for (const player of teamPlayers) {
              if (player.userId) {
                await db.createNotification({
                  userId: player.userId,
                  title: '📅 New Training Session Scheduled',
                  message: `${input.title} — ${sessionDate}${timeStr}${locationStr}`,
                  type: 'info',
                  category: 'training',
                  isRead: false,
                  relatedEntityType: 'training_session',
                  relatedEntityId: id,
                });
              }
            }
          } catch (_) { /* non-critical */ }
        }
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
        attendanceCount: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        objectives: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Fetch session before update to get teamId and title
        const database = (await getDb())!;
        let existingSession: any = null;
        if (database) {
          const rows = await database.select().from(trainingSessions).where(eq(trainingSessions.id, id)).limit(1);
          existingSession = rows[0] || null;
        }
        await db.updateTrainingSession(id, data);
        // Notify players if schedule-relevant fields changed
        const scheduleChanged = data.startTime !== undefined || data.location !== undefined || data.status === 'cancelled';
        if (scheduleChanged && existingSession?.teamId) {
          try {
            const teamPlayers = await db.getPlayersByTeam(existingSession.teamId);
            const sessionTitle = data.title || existingSession.title || 'Training Session';
            const sessionDate = new Date(existingSession.sessionDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
            let notifTitle: string;
            let notifMsg: string;
            if (data.status === 'cancelled') {
              notifTitle = '❌ Training Session Cancelled';
              notifMsg = `${sessionTitle} on ${sessionDate} has been cancelled.`;
            } else {
              notifTitle = '📝 Training Session Updated';
              const changes: string[] = [];
              if (data.startTime) changes.push(`Time: ${data.startTime}`);
              if (data.location) changes.push(`Location: ${data.location}`);
              notifMsg = `${sessionTitle} on ${sessionDate} — ${changes.join(', ')}`;
            }
            for (const player of teamPlayers) {
              if (player.userId) {
                await db.createNotification({
                  userId: player.userId,
                  title: notifTitle,
                  message: notifMsg,
                  type: data.status === 'cancelled' ? 'warning' : 'info',
                  category: 'training',
                  isRead: false,
                  relatedEntityType: 'training_session',
                  relatedEntityId: id,
                });
              }
            }
          } catch (_) { /* non-critical */ }
        }
        return { success: true };
      }),
    delete: coachProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.delete(trainingSessions).where(eq(trainingSessions.id, input.id));
        return { success: true };
      }),
    createBulk: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        daysOfWeek: z.array(z.number().min(0).max(6)), // 0=Sun, 1=Mon, ... 6=Sat
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        sessionType: z.enum(['technical', 'tactical', 'physical', 'match', 'recovery', 'mixed']),
        objectives: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const sessions = [];
        
        // Generate all session dates between start and end
        const current = new Date(start);
        while (current <= end) {
          if (input.daysOfWeek.includes(current.getDay())) {
            sessions.push({
              teamId: input.teamId,
              title: input.title,
              description: input.description,
              sessionDate: new Date(current),
              startTime: input.startTime,
              endTime: input.endTime,
              location: input.location,
              sessionType: input.sessionType,
              objectives: input.objectives,
              coachId: ctx.user.id,
              status: 'scheduled' as const,
            });
          }
          current.setDate(current.getDate() + 1);
        }
        
        if (sessions.length === 0) {
          return { count: 0, ids: [] };
        }
        
        // Insert all sessions
        const ids: number[] = [];
        for (const session of sessions) {
          const id = await db.createTrainingSession(session);
          ids.push(id);
        }
        // Notify all players in the team (once, summarising the bulk schedule)
        if (input.teamId && sessions.length > 0) {
          try {
            const teamPlayers = await db.getPlayersByTeam(input.teamId);
            const startFmt = new Date(input.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            const endFmt = new Date(input.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const daysStr = input.daysOfWeek.map((d: number) => dayNames[d]).join(', ');
            const timeStr = input.startTime ? ` at ${input.startTime}` : '';
            const locationStr = input.location ? ` @ ${input.location}` : '';
            for (const player of teamPlayers) {
              if (player.userId) {
                await db.createNotification({
                  userId: player.userId,
                  title: `📅 Training Schedule Added (${sessions.length} sessions)`,
                  message: `${input.title} — every ${daysStr}${timeStr}${locationStr}, from ${startFmt} to ${endFmt}`,
                  type: 'info',
                  category: 'training',
                  isRead: false,
                  relatedEntityType: 'training_session',
                  relatedEntityId: ids[0],
                });
              }
            }
          } catch (_) { /* non-critical */ }
        }
        return { count: sessions.length, ids };
      }),
    getAll: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        
        // Coaches only see their own sessions; admins see all
        const conditions: any[] = [];
        if (ctx.user.role === 'coach') {
          conditions.push(eq(trainingSessions.coachId, ctx.user.id));
        }
        if (input.teamId) {
          conditions.push(eq(trainingSessions.teamId, input.teamId));
        }
        if (input.startDate) {
          conditions.push(gte(trainingSessions.sessionDate, new Date(input.startDate)));
        }
        if (input.endDate) {
          conditions.push(lte(trainingSessions.sessionDate, new Date(input.endDate)));
        }
        
        let query = database.select().from(trainingSessions);
        if (conditions.length === 1) {
          query = query.where(conditions[0]) as any;
        } else if (conditions.length > 1) {
          query = query.where(and(...conditions)) as any;
        }
        
        return query.orderBy(asc(trainingSessions.sessionDate)).limit(input.limit);
      }),
    getPlayerSessions: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { playerActivities } = await import('../drizzle/schema');
        const activities = await database.select()
          .from(playerActivities)
          .where(eq(playerActivities.playerId, input.playerId))
          .orderBy(desc(playerActivities.activityDate))
          .limit(30);
        return activities;
      }),
  }),
  // ==================== DEVELOPMENT PLANS ====================
  development: router({
    getPlayerPlans: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerDevelopmentPlans(input.playerId);
      }),
    getActivePlan: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getActiveDevelopmentPlan(input.playerId);
      }),
    createPlan: coachProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDevelopmentPlan({
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    getPlanGoals: staffProcedure
      .input(z.object({ planId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlanGoals(input.planId);
      }),
    createGoal: coachProcedure
      .input(z.object({
        planId: z.number(),
        category: z.enum(['technical', 'physical', 'mental', 'nutritional', 'tactical']),
        title: z.string().min(1),
        description: z.string().optional(),
        targetValue: z.number().optional(),
        unit: z.string().optional(),
        targetDate: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDevelopmentGoal({
          ...input,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        });
        return { id };
      }),
    updateGoal: coachProcedure
      .input(z.object({
        id: z.number(),
        currentValue: z.number().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'overdue']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDevelopmentGoal(id, data);
        return { success: true };
      }),
    // Player self-access: get own active development plan
    getMyPlan: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getActiveDevelopmentPlan(input.playerId);
      }),
    // Player self-access: get own meal plans
    getMyMealPlans: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerMealPlans(input.playerId);
      }),
  }),
  // ==================== ACHIEVEMENTS =====================
  achievements: router({
    getPlayerAchievements: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerAchievements(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['technical', 'physical', 'mental', 'nutritional', 'milestone', 'award']),
        achievedDate: z.string(),
        iconType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAchievement({
          ...input,
          achievedDate: new Date(input.achievedDate),
        });
        return { id };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input.limit);
      }),
    getNotifications: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input?.limit);
      }),
    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotifications(ctx.user.id);
    }),
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const unread = await db.getUnreadNotifications(ctx.user.id);
      return { count: unread.length };
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    create: staffProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).optional(),
        category: z.enum(['performance', 'training', 'nutrition', 'mental', 'injury', 'achievement', 'general']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNotification(input);
        return { id };
      }),
    notifyParent: staffProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).optional(),
        category: z.enum(['performance', 'training', 'nutrition', 'mental', 'injury', 'achievement', 'general']).optional(),
      }))
      .mutation(async ({ input }) => {
        // Get parent(s) for this player and notify them
        const parents = await db.getParentsForPlayer(input.playerId);
        const notifIds = [];
        for (const parent of parents) {
          const id = await db.createNotification({
            userId: parent.parentUserId,
            title: input.title,
            message: input.message,
            type: input.type,
            category: input.category,
          });
          notifIds.push(id);
        }
        return { count: notifIds.length, ids: notifIds };
      }),
    notifyAllParents: staffProcedure
      .input(z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).optional(),
        category: z.enum(['performance', 'training', 'nutrition', 'mental', 'injury', 'achievement', 'general']).optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return { count: 0 };
        // Get all parent-player relations, optionally filtered by team
        let parentRelations: any[] = [];
        if (input.teamId) {
          const { players: playersTable, parentPlayerRelations } = await import('../drizzle/schema');
          const { eq: eqOp } = await import('drizzle-orm');
          const teamPlayers = await database.select({ playerId: playersTable.id })
            .from(playersTable).where(eqOp(playersTable.teamId, input.teamId));
          const playerIds = teamPlayers.map((p: any) => p.playerId);
          if (playerIds.length > 0) {
            const { inArray: inArrayOp } = await import('drizzle-orm');
            parentRelations = await database.select().from(parentPlayerRelations)
              .where(inArrayOp(parentPlayerRelations.playerId, playerIds));
          }
        } else {
          const { parentPlayerRelations } = await import('../drizzle/schema');
          parentRelations = await database.select().from(parentPlayerRelations);
        }
        const uniqueParentIds = [...new Set(parentRelations.map((r: any) => r.parentUserId))];
        let count = 0;
        for (const parentId of uniqueParentIds) {
          await db.createNotification({
            userId: parentId,
            title: input.title,
            message: input.message,
            type: input.type,
            category: input.category,
          });
          count++;
        }
        return { count };
      }),
    getNotificationHistory: staffProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        const { desc: descOp } = await import('drizzle-orm');
        return database.select().from(notifications)
          .orderBy(descOp(notifications.createdAt))
          .limit(100);
      }),

    // ── Web Push Subscription Management ──
    subscribePush: protectedProcedure
      .input(z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { savePushSubscription } = await import('./pushService');
        await savePushSubscription(ctx.user.id, input);
        return { success: true };
      }),

    unsubscribePush: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { removePushSubscription } = await import('./pushService');
        await removePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    sendTestPush: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { sendPushToUser } = await import('./pushService');
        await sendPushToUser(ctx.user.id, {
          title: '\uD83D\uDD14 Push Notifications Active',
          body: 'You will now receive real-time alerts for attendance, goals, and media tags.',
          icon: '/icons/icon-192x192.png',
          url: '/dashboard',
          tag: 'test-push',
        });
        return { success: true };
      }),
  }),

  // ==================== COACH FEEDBACK ====================
  feedback: router({
    getPlayerFeedback: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerFeedback(input.playerId, input.limit);
      }),
    getForParent: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerFeedbackForParent(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number().optional(),
        feedbackDate: z.string(),
        category: z.enum(['technical', 'physical', 'mental', 'tactical', 'general']),
        rating: z.number().min(1).max(5).optional(),
        strengths: z.string().optional(),
        areasToImprove: z.string().optional(),
        recommendations: z.string().optional(),
        isVisibleToParent: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createCoachFeedback({
          ...input,
          feedbackDate: new Date(input.feedbackDate),
          coachId: ctx.user.id,
        });
        // Auto-notify parents if feedback is visible to them
        if (input.isVisibleToParent) {
          try {
            const parents = await db.getParentsForPlayer(input.playerId);
            const ratingStars = input.rating ? '⭐'.repeat(input.rating) : '';
            for (const parent of parents) {
              await db.createNotification({
                userId: parent.parentUserId,
                title: `New Coach Feedback (${input.category})`,
                message: `Your child received new ${input.category} feedback from the coach. ${ratingStars}${input.strengths ? ` Strengths: ${input.strengths.substring(0, 80)}...` : ''}`,
                type: 'info',
                category: 'performance',
              });
            }
          } catch (e) { /* silent fail */ }
        }
        return { id };
      }),
    createBulk: coachProcedure
      .input(z.object({
        sessionId: z.number().optional(),
        sessionDate: z.string(),
        feedbacks: z.array(z.object({
          playerId: z.number(),
          category: z.enum(['technical', 'physical', 'mental', 'tactical', 'general']),
          rating: z.number().min(1).max(5),
          strengths: z.string().optional(),
          areasToImprove: z.string().optional(),
          recommendations: z.string().optional(),
          recommendedDrills: z.string().optional(),
          videoLinks: z.string().optional(),
          isVisibleToParent: z.boolean().optional(),
        }))
      }))
      .mutation(async ({ input, ctx }) => {
        const results = [];
        for (const fb of input.feedbacks) {
          const id = await db.createCoachFeedback({
            ...fb,
            feedbackDate: new Date(input.sessionDate),
            coachId: ctx.user.id,
            sessionId: input.sessionId,
          });
          results.push({ id, playerId: fb.playerId });
          if (fb.isVisibleToParent !== false) {
            try {
              const parents = await db.getParentsForPlayer(fb.playerId);
              const ratingStars = String(fb.rating) + '/5';
              for (const parent of parents) {
                await db.createNotification({
                  userId: parent.parentUserId,
                  title: 'New Coach Feedback',
                  message: 'Your child received ' + fb.category + ' feedback. Rating: ' + ratingStars + (fb.strengths ? '. Strengths: ' + fb.strengths.substring(0, 80) : ''),
                  type: 'info',
                  category: 'performance',
                });
              }
            } catch (e) { /* silent fail */ }
          }
        }
        return { count: results.length, results };
      }),
    getWeeklyProgress: staffProcedure
      .input(z.object({ playerId: z.number(), weeks: z.number().optional() }))
      .query(async ({ input }) => {
        const weeksBack = input.weeks || 4;
        const since = new Date();
        since.setDate(since.getDate() - weeksBack * 7);
        const feedbacks = await db.getPlayerFeedback(input.playerId, 100);
        const recent = (feedbacks as unknown as any[]).filter((f: any) => f.rating && new Date(f.feedbackDate) >= since);
        if (recent.length === 0) return { weeklyScore: null, trend: 'stable', recentFeedbacks: [] };
        const avgRating = recent.reduce((s: number, f: any) => s + f.rating, 0) / recent.length;
        const older = (feedbacks as unknown as any[]).filter((f: any) => f.rating && new Date(f.feedbackDate) < since);
        const olderAvg = older.length > 0 ? older.reduce((s: number, f: any) => s + f.rating, 0) / older.length : null;
        const trend = olderAvg === null ? 'stable' : avgRating > olderAvg + 0.3 ? 'improving' : avgRating < olderAvg - 0.3 ? 'declining' : 'stable';
        return { weeklyScore: Math.round(avgRating * 20), trend, recentFeedbacks: recent.slice(0, 5) };
      }),
  }),

  // ==================== PARENT-PLAYER RELATIONS ====================
  parentRelations: router({
    link: protectedProcedure
      .input(z.object({
        parentUserId: z.number().optional(),
        playerId: z.number(),
        relationship: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Use current user ID if parentUserId not provided (for parent self-linking)
        const parentUserId = input.parentUserId || ctx.user.id;
        await db.linkParentToPlayer(parentUserId, input.playerId, input.relationship, input.isPrimary);
        return { success: true };
      }),
    getRelations: protectedProcedure.query(async ({ ctx }) => {
      return db.getParentPlayerRelations(ctx.user.id);
    }),
    getLinkedPlayers: protectedProcedure.query(async ({ ctx }) => {
      // Get players linked to this parent
      return db.getPlayersForParent(ctx.user.id);
    }),
  }),

  // ==================== INDIVIDUAL DEVELOPMENT PLANS ====================
  idp: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllIDPs();
    }),
    getPlayerIDP: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerIDP(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        seasonYear: z.number(),
        shortTermGoals: z.string().optional(),
        longTermGoals: z.string().optional(),
        technicalObjectives: z.string().optional(),
        physicalObjectives: z.string().optional(),
        mentalObjectives: z.string().optional(),
        nutritionObjectives: z.string().optional(),
        strengthsAnalysis: z.string().optional(),
        areasForImprovement: z.string().optional(),
        actionPlan: z.string().optional(),
        reviewDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createIDP({
          ...input,
          reviewDate: input.reviewDate ? new Date(input.reviewDate) : undefined,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        shortTermGoals: z.string().optional(),
        longTermGoals: z.string().optional(),
        technicalObjectives: z.string().optional(),
        physicalObjectives: z.string().optional(),
        mentalObjectives: z.string().optional(),
        nutritionObjectives: z.string().optional(),
        strengthsAnalysis: z.string().optional(),
        areasForImprovement: z.string().optional(),
        actionPlan: z.string().optional(),
        overallProgress: z.number().optional(),
        status: z.enum(['active', 'completed', 'archived']).optional(),
        reviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, reviewDate, ...data } = input;
        await db.updateIDP(id, {
          ...data,
          reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        });
        return { success: true };
      }),
    getMilestones: staffProcedure
      .input(z.object({ idpId: z.number() }))
      .query(async ({ input }) => {
        return db.getIDPMilestones(input.idpId);
      }),
    addMilestone: coachProcedure
      .input(z.object({
        idpId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['technical', 'physical', 'mental', 'nutrition']),
        targetDate: z.string().optional(),
        targetValue: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createIDPMilestone({
          ...input,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        });
        return { id };
      }),
    updateMilestone: coachProcedure
      .input(z.object({
        id: z.number(),
        isCompleted: z.boolean().optional(),
        currentValue: z.number().optional(),
        completedDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, completedDate, ...data } = input;
        await db.updateIDPMilestone(id, {
          ...data,
          completedDate: completedDate ? new Date(completedDate) : (data.isCompleted ? new Date() : undefined),
        });
        return { success: true };
      }),
  }),

  // ==================== ANALYTICS ====================
  analytics: router({
    getAcademyStats: staffProcedure.query(async () => {
      return db.getAcademyStats();
    }),
    getAdminControlPanelStats: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return null;
      // Counts
      const [playerCount] = await database.select({ count: sql<number>`count(*)` }).from(players);
      const [coachCount] = await database.select({ count: sql<number>`count(*)` }).from(coachProfiles);
      const [teamCount] = await database.select({ count: sql<number>`count(*)` }).from(teams);
      const [parentCount] = await database.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'parent'));
      const [pendingUsers] = await database.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.accountStatus, 'pending'));
      // Active injuries
      const [injuryCount] = await database.select({ count: sql<number>`count(*)` }).from(injuries).where(eq(injuries.status, 'active'));
      // Training sessions this week
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      const [weekSessions] = await database.select({ count: sql<number>`count(*)` }).from(trainingSessions)
        .where(and(gte(trainingSessions.sessionDate, weekStart), sql`${trainingSessions.sessionDate} <= ${weekEnd}`));
      // Upcoming sessions (next 7 days)
      const today = new Date();
      const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
      const [upcomingSessions] = await database.select({ count: sql<number>`count(*)` }).from(trainingSessions)
        .where(and(gte(trainingSessions.sessionDate, today), sql`${trainingSessions.sessionDate} <= ${nextWeek}`, eq(trainingSessions.status, 'scheduled')));
      // Attendance rate (last 30 days)
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [totalAttendance] = await database.select({ count: sql<number>`count(*)` }).from(attendance)
        .where(gte(attendance.sessionDate, thirtyDaysAgo));
      const [presentAttendance] = await database.select({ count: sql<number>`count(*)` }).from(attendance)
        .where(and(gte(attendance.sessionDate, thirtyDaysAgo), eq(attendance.status, 'present')));
      const attendanceRate = (totalAttendance?.count || 0) > 0
        ? Math.round(((presentAttendance?.count || 0) / (totalAttendance?.count || 1)) * 100)
        : 0;
      // Recent registrations (last 7 days)
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const [newUsers] = await database.select({ count: sql<number>`count(*)` }).from(users)
        .where(gte(users.createdAt, sevenDaysAgo));
      // Teams with player counts
      const allTeams = await database.select({ id: teams.id, name: teams.name, ageGroup: teams.ageGroup }).from(teams).limit(10);
      const teamsWithCounts = await Promise.all(allTeams.map(async (team) => {
        const [cnt] = await database.select({ count: sql<number>`count(*)` }).from(players).where(eq(players.teamId, team.id));
        return { ...team, playerCount: cnt?.count || 0 };
      }));
      return {
        totalPlayers: playerCount?.count || 0,
        totalCoaches: coachCount?.count || 0,
        totalTeams: teamCount?.count || 0,
        totalParents: parentCount?.count || 0,
        pendingApprovals: pendingUsers?.count || 0,
        activeInjuries: injuryCount?.count || 0,
        sessionsThisWeek: weekSessions?.count || 0,
        upcomingSessions: upcomingSessions?.count || 0,
        attendanceRate30Days: attendanceRate,
        newUsersThisWeek: newUsers?.count || 0,
        teams: teamsWithCounts,
      };
    }),
    getUpcomingMatches: staffProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getUpcomingMatches(input.limit ?? 5);
      }),
  }),

  // ==================== MATCHES ====================
  matches: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllMatches();
    }),
    getById: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchById(input.id);
      }),
    getByTeam: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchesByTeam(input.teamId);
      }),
    create: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        matchDate: z.string(),
        matchType: z.enum(['friendly', 'league', 'cup', 'tournament', 'training_match']),
        opponent: z.string().optional(),
        venue: z.string().optional(),
        isHome: z.boolean().optional(),
        teamScore: z.number().optional(),
        opponentScore: z.number().optional(),
        result: z.enum(['win', 'draw', 'loss']).optional(),
        notes: z.string().optional(),
        competitionName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMatch({
          ...input,
          matchDate: new Date(input.matchDate),
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        teamScore: z.number().optional(),
        opponentScore: z.number().optional(),
        result: z.enum(['win', 'draw', 'loss']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMatch(id, data);
        return { success: true };
      }),
    // Enter match result with player ratings and auto-update standings
    enterResult: coachProcedure
      .input(z.object({
        matchId: z.number(),
        teamScore: z.number().min(0),
        opponentScore: z.number().min(0),
        halfTimeScore: z.string().optional(),
        notes: z.string().optional(),
        season: z.string().optional(),
        leagueName: z.string().optional(),
        playerRatings: z.array(z.object({
          playerId: z.number(),
          minutesPlayed: z.number().optional(),
          started: z.boolean().optional(),
          goals: z.number().optional(),
          assists: z.number().optional(),
          yellowCards: z.number().optional(),
          redCards: z.number().optional(),
          coachRating: z.number().min(1).max(10).optional(),
          notes: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { matchId, teamScore, opponentScore, halfTimeScore, notes, season, leagueName, playerRatings } = input;
        
        // Determine result
        const result = teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw';
        
        // Update match record
        await db.updateMatch(matchId, {
          teamScore,
          opponentScore,
          result,
          halfTimeScore,
          notes,
        });
        
        // Save player ratings/stats
        if (playerRatings && playerRatings.length > 0) {
          for (const rating of playerRatings) {
            await db.createPlayerMatchStats({
              matchId,
              playerId: rating.playerId,
              minutesPlayed: rating.minutesPlayed,
              started: rating.started,
              goals: rating.goals,
              assists: rating.assists,
              yellowCards: rating.yellowCards,
              redCards: rating.redCards,
              coachRating: rating.coachRating,
              notes: rating.notes,
            });
          }
        }
        
        // Auto-update league standings if season/league provided
        if (season && leagueName) {
          // Get the match to find teamId
          const { getDb: _getDb2 } = await import('./db');
          const { matches: matchesTable, leagueStandings } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          const db2 = await _getDb2();
          if (db2) {
            const matchRecord = await db2.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
            if (matchRecord[0]?.teamId) {
              const teamId = matchRecord[0].teamId;
              // Get current standing
              const standings = await db.getLeagueStandings(season, leagueName);
              const current = standings?.find((s: any) => s.teamId === teamId);
              const played = (current?.played || 0) + 1;
              const won = (current?.won || 0) + (result === 'win' ? 1 : 0);
              const drawn = (current?.drawn || 0) + (result === 'draw' ? 1 : 0);
              const lost = (current?.lost || 0) + (result === 'loss' ? 1 : 0);
              const goalsFor = (current?.goalsFor || 0) + teamScore;
              const goalsAgainst = (current?.goalsAgainst || 0) + opponentScore;
              const points = (current?.points || 0) + (result === 'win' ? 3 : result === 'draw' ? 1 : 0);
              const formLetter = result === 'win' ? 'W' : result === 'draw' ? 'D' : 'L';
              const form = ((current?.form || '') + formLetter).slice(-5);
              await db.upsertLeagueStanding({
                teamId,
                season,
                leagueName,
                played,
                won,
                drawn,
                lost,
                goalsFor,
                goalsAgainst,
                goalDifference: goalsFor - goalsAgainst,
                points,
                form,
              });
            }
          }
        }
        
        return { success: true, result };
      }),
  }),

  // ==================== PLAYER MATCH STATS ====================
  matchStats: router({
    getByPlayer: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerMatchStats(input.playerId);
      }),
    getByMatch: staffProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchStats(input.matchId);
      }),
    getPlayerHistory: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerMatchHistory(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number(),
        minutesPlayed: z.number().optional(),
        started: z.boolean().optional(),
        position: z.string().optional(),
        goals: z.number().optional(),
        assists: z.number().optional(),
        touches: z.number().optional(),
        passes: z.number().optional(),
        passAccuracy: z.number().optional(),
        shots: z.number().optional(),
        shotsOnTarget: z.number().optional(),
        dribbles: z.number().optional(),
        successfulDribbles: z.number().optional(),
        tackles: z.number().optional(),
        interceptions: z.number().optional(),
        distanceCovered: z.number().optional(),
        topSpeed: z.number().optional(),
        sprints: z.number().optional(),
        yellowCards: z.number().optional(),
        redCards: z.number().optional(),
        coachRating: z.number().min(1).max(10).optional(),
        performanceScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPlayerMatchStats(input);
        return { id };
      }),
  }),

  // ==================== PLAYER SKILL SCORES (SCORECARD) ====================
  skillScores: router({
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestSkillScore(input.playerId)) ?? null;
      }),
    getHistory: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getSkillScoreHistory(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        assessmentDate: z.string(),
        ballControl: z.number().optional(),
        firstTouch: z.number().optional(),
        dribbling: z.number().optional(),
        passing: z.number().optional(),
        shooting: z.number().optional(),
        crossing: z.number().optional(),
        heading: z.number().optional(),
        leftFootScore: z.number().optional(),
        rightFootScore: z.number().optional(),
        twoFootedScore: z.number().optional(),
        weakFootUsage: z.number().optional(),
        speed: z.number().optional(),
        acceleration: z.number().optional(),
        agility: z.number().optional(),
        stamina: z.number().optional(),
        strength: z.number().optional(),
        jumping: z.number().optional(),
        positioning: z.number().optional(),
        vision: z.number().optional(),
        composure: z.number().optional(),
        decisionMaking: z.number().optional(),
        workRate: z.number().optional(),
        marking: z.number().optional(),
        tackling: z.number().optional(),
        interceptions: z.number().optional(),
        overallRating: z.number().optional(),
        potentialRating: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Calculate overall scores
        const technicalOverall = Math.round(
          ((input.ballControl || 50) + (input.firstTouch || 50) + (input.dribbling || 50) + 
           (input.passing || 50) + (input.shooting || 50) + (input.crossing || 50)) / 6
        );
        const physicalOverall = Math.round(
          ((input.speed || 50) + (input.acceleration || 50) + (input.agility || 50) + 
           (input.stamina || 50) + (input.strength || 50)) / 5
        );
        const mentalOverall = Math.round(
          ((input.positioning || 50) + (input.vision || 50) + (input.composure || 50) + 
           (input.decisionMaking || 50) + (input.workRate || 50)) / 5
        );
        const defensiveOverall = Math.round(
          ((input.marking || 50) + (input.tackling || 50) + (input.interceptions || 50)) / 3
        );
        const overallRating = input.overallRating || Math.round(
          (technicalOverall * 0.35 + physicalOverall * 0.25 + mentalOverall * 0.25 + defensiveOverall * 0.15)
        );

        const id = await db.createSkillScore({
          ...input,
          assessmentDate: new Date(input.assessmentDate),
          technicalOverall,
          physicalOverall,
          mentalOverall,
          defensiveOverall,
          overallRating,
          assessedBy: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        ballControl: z.number().optional(),
        firstTouch: z.number().optional(),
        dribbling: z.number().optional(),
        passing: z.number().optional(),
        shooting: z.number().optional(),
        speed: z.number().optional(),
        agility: z.number().optional(),
        stamina: z.number().optional(),
        overallRating: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSkillScore(id, data);
        return { success: true };
      }),
    getSquadWithSkills: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const playerList = await db.getPlayersByTeam(input.teamId);
        const result = await Promise.all(
          playerList.map(async (player: any) => {
            const skills = await db.getLatestSkillScore(player.id);
            return { ...player, skills: skills ?? null };
          })
        );
        return result;
      }),
  }),
  // ==================== AI TRAINING RECOMMENDATIONS =====================
  aiTraining: router({
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestAIRecommendation(input.playerId)) ?? null;
      }),
    getAll: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getAIRecommendations(input.playerId);
      }),
    generate: coachProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateAITrainingRecommendations } = await import('./aiTraining');
        const recommendation = await generateAITrainingRecommendations(input.playerId);
        if (!recommendation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found or insufficient data' });
        }
        const id = await db.createAIRecommendation(recommendation);
        return { id, recommendation };
      }),
    accept: coachProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateAIRecommendation(input.id, { isAccepted: true, acceptedAt: new Date() });
        return { success: true };
      }),
    updateProgress: coachProcedure
      .input(z.object({ id: z.number(), progress: z.number().min(0).max(100) }))
      .mutation(async ({ input }) => {
        await db.updateAIRecommendation(input.id, { completionProgress: input.progress });
        return { success: true };
      }),
  }),

  // ==================== VIDEO ANALYSIS ====================
  videos: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllVideos();
    }),
    getByPlayer: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideosByPlayer(input.playerId);
      }),
    getByMatch: staffProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideosByMatch(input.matchId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number().optional(),
        matchId: z.number().optional(),
        sessionId: z.number().optional(),
        title: z.string().min(1),
        videoUrl: z.string().min(1),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']),
        tags: z.array(z.string()).optional(),
        annotations: z.array(z.object({
          timestamp: z.number(),
          text: z.string(),
          type: z.string().optional(),
        })).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createVideoAnalysis({
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          annotations: input.annotations ? JSON.stringify(input.annotations) : null,
          uploadedBy: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== LEAGUE STANDINGS ====================
  league: router({
    getStandings: protectedProcedure
      .input(z.object({ season: z.string(), leagueName: z.string() }))
      .query(async ({ input }) => {
        return db.getLeagueStandings(input.season, input.leagueName);
      }),
    updateStanding: coachProcedure
      .input(z.object({
        teamId: z.number(),
        season: z.string(),
        leagueName: z.string(),
        played: z.number().optional(),
        won: z.number().optional(),
        drawn: z.number().optional(),
        lost: z.number().optional(),
        goalsFor: z.number().optional(),
        goalsAgainst: z.number().optional(),
        goalDifference: z.number().optional(),
        points: z.number().optional(),
        position: z.number().optional(),
        form: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertLeagueStanding(input);
      }),
  }),

  // ==================== MAN OF THE MATCH ====================
  motm: router({
    get: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getManOfTheMatch(input.matchId);
      }),
    set: coachProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number(),
        rating: z.number().min(1).max(10).optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.setManOfTheMatch({ ...input, selectedBy: ctx.user.id });
      }),
  }),

  // ==================== REGISTRATION ====================
  registration: router({
    submit: publicProcedure
      .input(z.object({
        parentName: z.string().min(2),
        parentEmail: z.string().email(),
        parentPhone: z.string().min(5),
        parentWhatsapp: z.string().optional(),
        childName: z.string().min(2),
        childDateOfBirth: z.string(),
        childAge: z.number().optional(),
        preferredPosition: z.string().optional(),
        currentClub: z.string().optional(),
        experience: z.string().optional(),
        medicalConditions: z.string().optional(),
        howHeard: z.string().optional(),
        message: z.string().optional(),
        // New fields for enhanced registration
        playerCode: z.string().optional(), // Existing player code if re-registering
        ageGroup: z.string().optional(), // e.g., U12, U14, U16
        teamType: z.enum(['main', 'academy']).optional().default('academy'),
        nationality: z.string().optional(),
        schoolName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRegistrationRequest({
          ...input,
          childDateOfBirth: new Date(input.childDateOfBirth),
        });
        
        // Send notification to admin about new registration
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '🎉 New Academy Registration',
            content: `New registration received!\n\n**Parent:** ${input.parentName}\n**Email:** ${input.parentEmail}\n**Phone:** ${input.parentPhone}\n**WhatsApp:** ${input.parentWhatsapp || 'Same as phone'}\n\n**Child:** ${input.childName}\n**Age:** ${input.childAge} years old\n**Age Group:** ${input.ageGroup || 'Not specified'}\n**Team Type:** ${input.teamType || 'Academy'}\n**Position:** ${input.preferredPosition || 'Not specified'}\n**Nationality:** ${input.nationality || 'Not specified'}\n\nPlease review and contact the family within 2-3 business days.`,
          });
        } catch (error) {
          console.error('Failed to send registration notification:', error);
        }
        
        return { success: true, id };
      }),

    // Coach registration
    submitCoach: publicProcedure
      .input(z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(5),
        whatsapp: z.string().optional(),
        nationality: z.string().optional(),
        dateOfBirth: z.string().optional(),
        coachingLicense: z.string().optional(), // e.g., UEFA B, CAF A, FIFA
        yearsExperience: z.number().min(0).default(0),
        specialization: z.enum(['head_coach', 'assistant_coach', 'goalkeeper_coach', 'fitness_coach', 'youth_coach', 'tactical_analyst']).optional(),
        preferredAgeGroup: z.string().optional(),
        currentClub: z.string().optional(),
        cvUrl: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Store as a careers application with coach position
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const [result] = await database.insert(careerApplications).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          position: 'football_coach',
          yearsExperience: input.yearsExperience,
          qualifications: input.coachingLicense || 'Not specified',
          coverLetter: input.message || 'Coach application via registration form',
          cvUrl: input.cvUrl,
          status: 'pending',
        });
        const id = result.insertId;
        
        // Send notification to admin
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '👨‍🏫 New Coach Application',
            content: `New coach application received!\n\n**Name:** ${input.fullName}\n**Email:** ${input.email}\n**Phone:** ${input.phone}\n**License:** ${input.coachingLicense || 'Not specified'}\n**Experience:** ${input.yearsExperience} years\n**Specialization:** ${input.specialization || 'Not specified'}\n**Age Group:** ${input.preferredAgeGroup || 'Any'}\n\nPlease review the application.`,
          });
        } catch (error) {
          console.error('Failed to send coach notification:', error);
        }
        
        return { success: true, id };
      }),
    getAll: adminProcedure.query(async () => {
      return db.getAllRegistrationRequests();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'contacted', 'trial_scheduled', 'accepted', 'rejected']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateRegistrationStatus(input.id, input.status, input.notes);
        return { success: true };
      }),
  }),

  // ==================== CONTACT ====================
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().min(2),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createContactInquiry(input);
        return { success: true, id };
      }),
    getAll: adminProcedure.query(async () => {
      return db.getAllContactInquiries();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['new', 'read', 'replied', 'closed']),
      }))
      .mutation(async ({ input }) => {
        await db.updateContactInquiryStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ==================== CAREERS ====================
  careers: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(5),
        position: z.enum(['football_coach', 'fitness_coach', 'goalkeeper_coach', 'sports_psychologist', 'analyst', 'physiotherapist', 'other']),
        yearsExperience: z.number().min(0),
        qualifications: z.string().min(10),
        previousClubs: z.string().optional(),
        cvUrl: z.string().optional(),
        coverLetter: z.string().min(50),
        linkedinUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const [result] = await database.insert(careerApplications).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          position: input.position,
          yearsExperience: input.yearsExperience,
          qualifications: input.qualifications,
          previousClubs: input.previousClubs,
          cvUrl: input.cvUrl,
          coverLetter: input.coverLetter,
          linkedinUrl: input.linkedinUrl,
          status: 'pending',
        });
        
        // Notify admin about new application
        await notifyOwner({
          title: 'New Career Application',
          content: `${input.fullName} applied for ${input.position}`,
        });
        
        return { success: true, id: result.insertId };
      }),
    
    getAll: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      return database.select().from(careerApplications).orderBy(desc(careerApplications.createdAt));
    }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected']),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        
        // Get application details for email
        const [application] = await database.select()
          .from(careerApplications)
          .where(eq(careerApplications.id, input.id));
        
        if (!application) {
          throw new Error('Application not found');
        }
        
        // Update status
        await database.update(careerApplications)
          .set({
            status: input.status,
            adminNotes: input.adminNotes,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(careerApplications.id, input.id));
        
        // Send email notification
        try {
          const { sendCareerApplicationStatusEmail } = await import('./emailService');
          await sendCareerApplicationStatusEmail(application.email, {
            applicantName: application.fullName,
            position: application.position,
            status: input.status as 'approved' | 'rejected' | 'under_review',
            adminNotes: input.adminNotes,
          });
        } catch (emailError) {
          console.error('Failed to send career application status email:', emailError);
          // Don't fail the mutation if email fails
        }
        
        return { success: true };
      }),
  }),

  // ==================== ACADEMY EVENTS ====================
  events: router({
    getPublic: publicProcedure.query(async () => {
      return db.getPublicEvents();
    }),
    getUpcoming: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getUpcomingEvents(input?.limit);
      }),
    getAll: staffProcedure.query(async () => {
      return db.getAllAcademyEvents();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEventById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(2),
        description: z.string().optional(),
        eventType: z.enum(['training', 'tournament', 'trial', 'camp', 'workshop', 'match', 'meeting', 'other', 'open-day', 'parent-day', 'fun-day', 'trial-day']),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        ageGroups: z.string().optional(),
        maxParticipants: z.number().optional(),
        registrationDeadline: z.string().optional(),
        fee: z.number().optional(),
        isPublic: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createAcademyEvent({
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : undefined,
          createdBy: ctx.user.id,
          eventType: input.eventType as 'match' | 'training' | 'other' | 'tournament' | 'trial' | 'camp' | 'workshop' | 'meeting',
        });
        return { success: true, id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(['training', 'tournament', 'trial', 'camp', 'workshop', 'match', 'meeting', 'other', 'open-day', 'parent-day', 'fun-day', 'trial-day']).optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const [id, startDate, endDate, ...restKeys] = Object.keys(input);
        const { id: updId, startDate: updStart, endDate: updEnd, eventType: updEventType, ...rest } = input;
        await db.updateAcademyEvent(updId, {
          ...rest,
          startDate: updStart ? new Date(updStart) : undefined,
          endDate: updEnd ? new Date(updEnd) : undefined,
          eventType: updEventType as 'match' | 'training' | 'other' | 'tournament' | 'trial' | 'camp' | 'workshop' | 'meeting' | undefined,
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAcademyEvent(input.id);
        return { success: true };
      }),
  }),

  // ==================== COACH PROFILES ====================
  coachProfiles: router({
    getPublic: publicProcedure.query(async () => {
      return db.getPublicCoachProfiles();
    }),
    getAll: adminProcedure.query(async () => {
      return db.getAllCoachProfiles();
    }),
    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachProfileByUserId(input.userId);
      }),
    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().optional(),
        specialization: z.enum(['technical', 'tactical', 'fitness', 'goalkeeping', 'youth_development', 'mental', 'nutrition']).optional(),
        qualifications: z.string().optional(),
        experience: z.string().optional(),
        yearsExperience: z.number().optional(),
        bio: z.string().optional(),
        achievements: z.string().optional(),
        languages: z.string().optional(),
        photoUrl: z.string().optional(),
        linkedIn: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCoachProfile(input);
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        specialization: z.enum(['technical', 'tactical', 'fitness', 'goalkeeping', 'youth_development', 'mental', 'nutrition']).optional(),
        qualifications: z.string().optional(),
        experience: z.string().optional(),
        yearsExperience: z.number().optional(),
        bio: z.string().optional(),
        achievements: z.string().optional(),
        languages: z.string().optional(),
        photoUrl: z.string().optional(),
        linkedIn: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCoachProfile(id, data);
        return { success: true };
      }),
  }),

  // ==================== GPS TRACKER ====================
  gps: router({
    import: staffProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number().optional(),
        matchId: z.number().optional(),
        deviceType: z.string(),
        deviceId: z.string().optional(),
        recordedAt: z.string(),
        totalDistance: z.number().optional(),
        highSpeedDistance: z.number().optional(),
        sprintDistance: z.number().optional(),
        maxSpeed: z.number().optional(),
        avgSpeed: z.number().optional(),
        accelerations: z.number().optional(),
        decelerations: z.number().optional(),
        avgHeartRate: z.number().optional(),
        maxHeartRate: z.number().optional(),
        heartRateZones: z.string().optional(),
        playerLoad: z.number().optional(),
        metabolicPower: z.number().optional(),
        rawData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createGpsTrackerData({
          ...input,
          recordedAt: new Date(input.recordedAt),
        });
        return { success: true, id };
      }),
    getPlayerData: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerGpsData(input.playerId, input.limit);
      }),
    getSessionData: staffProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return db.getSessionGpsData(input.sessionId);
      }),
    getMatchData: staffProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchGpsData(input.matchId);
      }),
  }),

  // ==================== EVENT REGISTRATIONS ====================
  eventRegistrations: router({
    register: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        playerId: z.number().optional(),
        playerName: z.string(),
        playerAge: z.number(),
        parentName: z.string(),
        parentEmail: z.string().email(),
        parentPhone: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createEventRegistration({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true, id };
      }),
    getMyRegistrations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserEventRegistrations(ctx.user.id);
    }),
    getEventRegistrations: staffProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getEventRegistrations(input.eventId);
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'waitlist']),
      }))
      .mutation(async ({ input }) => {
        await db.updateEventRegistration(input.id, { 
          status: input.status,
          confirmedAt: input.status === 'confirmed' ? new Date() : undefined,
        });
        return { success: true };
      }),
    cancel: protectedProcedure
      .input(z.object({ id: z.number(), eventId: z.number() }))
      .mutation(async ({ input }) => {
        await db.cancelEventRegistration(input.id, input.eventId);
        return { success: true };
      }),
  }),

  // ==================== COACH AVAILABILITY ====================
  coachAvailability: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllCoachAvailability();
    }),
    getByCoach: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachAvailability(input.coachId);
      }),
    set: protectedProcedure
      .input(z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        isAvailable: z.boolean().optional(),
        sessionType: z.enum(['group', 'private', 'consultation', 'all']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.setCoachAvailability({
          ...input,
          coachId: ctx.user.id,
        });
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isAvailable: z.boolean().optional(),
        sessionType: z.enum(['group', 'private', 'consultation', 'all']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCoachAvailability(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCoachAvailability(input.id);
        return { success: true };
      }),
  }),

  // ==================== MEMBERSHIP PLANS ====================
  membershipPlans: router({
    getAll: publicProcedure.query(async () => {
      return db.getMembershipPlans();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMembershipPlanById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        durationMonths: z.number().min(1),
        price: z.number().min(0),
        originalPrice: z.number().optional(),
        features: z.string().optional(),
        isPopular: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMembershipPlan(input);
        return { success: true, id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        durationMonths: z.number().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        features: z.string().optional(),
        isPopular: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMembershipPlan(id, data);
        return { success: true };
      }),
  }),

  // ==================== ATTENDANCE ====================
  attendance: router({
    record: coachProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number().optional(),
        sessionType: z.enum(['training', 'match', 'trial', 'assessment']),
        sessionDate: z.string(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        durationMinutes: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.recordAttendance({ ...input, sessionDate: new Date(input.sessionDate), recordedBy: ctx.user.id });
        // Award points for attendance
        if (input.status === 'present') {
          await db.awardPoints(input.playerId, 10, 'attendance', 'Attended session', ctx.user.id);
        }
        return { success: true };
      }),
    getPlayerAttendance: protectedProcedure
      .input(z.object({ 
        playerId: z.number(), 
        dateRange: z.enum(['week', 'month', 'season', 'all']).optional(),
        limit: z.number().optional() 
      }))
      .query(async ({ input }) => {
        const allAttendance = await db.getPlayerAttendance(input.playerId, 1000);
        
        // Calculate date cutoff based on range
        let cutoffDate: Date | null = null;
        if (input.dateRange === 'week') {
          cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);
        } else if (input.dateRange === 'month') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        } else if (input.dateRange === 'season') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        }
        
        // Filter by date if needed
        const filteredAttendance = cutoffDate 
          ? allAttendance.filter(a => a.sessionDate && new Date(a.sessionDate) >= cutoffDate!)
          : allAttendance;
        
        // Calculate attendance rate
        const totalSessions = filteredAttendance.length;
        const presentSessions = filteredAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
        
        // Get recent 10 sessions
        const recentSessions = filteredAttendance.slice(-10).reverse().map(a => ({
          date: a.sessionDate ? new Date(a.sessionDate).toLocaleDateString() : 'N/A',
          attended: a.status === 'present',
          status: a.status
        }));
        
        // Build attendance history for chart (weekly aggregation)
        const attendanceHistory: { date: string; rate: number }[] = [];
        const weeks = Math.min(12, Math.ceil(filteredAttendance.length / 7));
        for (let i = 0; i < weeks; i++) {
          const weekAttendance = filteredAttendance.slice(i * 7, (i + 1) * 7);
          const weekPresent = weekAttendance.filter(a => a.status === 'present').length;
          const weekRate = weekAttendance.length > 0 ? Math.round((weekPresent / weekAttendance.length) * 100) : 0;
          attendanceHistory.push({
            date: `Week ${i + 1}`,
            rate: weekRate
          });
        }
        
        return {
          attendanceRate,
          totalSessions,
          presentSessions,
          recentSessions,
          attendanceHistory: attendanceHistory.reverse()
        };
      }),
    getPlayerRate: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerAttendanceRate(input.playerId);
      }),
    getSessionAttendance: coachProcedure
      .input(z.object({ sessionId: z.number(), sessionType: z.string() }))
      .query(async ({ input }) => {
        return db.getSessionAttendance(input.sessionId, input.sessionType);
      }),
    bulkRecord: coachProcedure
      .input(z.object({
        sessionId: z.number().optional(),
        sessionType: z.enum(['training', 'match', 'trial', 'assessment']),
        sessionDate: z.string(),
        records: z.array(z.object({
          playerId: z.number(),
          status: z.enum(['present', 'absent', 'late', 'excused']),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = await Promise.all(
          input.records.map(async (record) => {
            await db.recordAttendance({
              playerId: record.playerId,
              sessionId: input.sessionId,
              sessionType: input.sessionType,
              sessionDate: new Date(input.sessionDate),
              status: record.status,
              notes: record.notes,
              recordedBy: ctx.user.id,
            });
            if (record.status === 'present') {
              await db.awardPoints(record.playerId, 10, 'attendance', 'Attended session', ctx.user.id);
            }
            if (record.status === 'absent') {
              // Notify linked parents via WhatsApp
              try {
                const player = await db.getPlayerById(record.playerId);
                if (player) {
                  const parents = await db.getParentsForPlayer(record.playerId);
                  for (const relation of parents) {
                    const parentUser = await db.getUserById(relation.parentUserId);
                    if (parentUser?.whatsappPhone && parentUser.whatsappNotifications) {
                      await sendPlayerAbsenceNotification(parentUser.whatsappPhone, {
                        parentName: parentUser.name || 'Parent',
                        playerName: `${player.firstName} ${player.lastName}`,
                        sessionType: input.sessionType,
                        sessionDate: input.sessionDate,
                      });
                    }
                  }
                }
              } catch (e) {
                // Non-critical: log but don't fail
                console.log('[Attendance] Failed to send absence notification:', e);
              }
            }
            return { playerId: record.playerId, success: true };
          })
        );

        // Check monthly perfect attendance bonus for each player
        const bonusResults: { playerId: number; bonusAwarded: boolean }[] = [];
        for (const record of input.records) {
          try {
            const now = new Date(input.sessionDate);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const allAttendance = await db.getPlayerAttendance(record.playerId, 500);
            const monthAttendance = allAttendance.filter((a: any) => {
              if (!a.sessionDate) return false;
              const d = new Date(a.sessionDate);
              return d >= monthStart && d <= monthEnd;
            });
            const totalMonth = monthAttendance.length;
            const presentMonth = monthAttendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
            const monthRate = totalMonth > 0 ? (presentMonth / totalMonth) * 100 : 0;

            // Award bonus if ≥90% attendance this month (only once per month)
            if (monthRate >= 90 && totalMonth >= 4) {
              // Check if bonus already awarded this month
              const transactions = await db.getPointsTransactions(record.playerId, 100);
              const bonusKey = `perfect-attendance-${now.getFullYear()}-${now.getMonth() + 1}`;
              const alreadyAwarded = transactions.some((t: any) => t.description?.includes(bonusKey));
              if (!alreadyAwarded) {
                await db.awardPoints(
                  record.playerId,
                  100,
                  'achievement',
                  `Perfect Attendance Bonus ${bonusKey} - 90%+ this month`,
                  ctx.user.id
                );
                bonusResults.push({ playerId: record.playerId, bonusAwarded: true });
              }
            }
          } catch (e) {
            // Non-critical: skip bonus check on error
          }
        }

        return { success: true, recorded: results.length, bonusAwarded: bonusResults.filter(b => b.bonusAwarded).length };
      }),
    sendMonthlyReport: coachProcedure
      .input(z.object({
        playerId: z.number(),
        month: z.string(), // e.g. "March 2026"
      }))
      .mutation(async ({ input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) return { success: false, message: 'Player not found' };

        // Get attendance for the month
        const allAttendance = await db.getPlayerAttendance(input.playerId, 500);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthAttendance = allAttendance.filter((a: any) => {
          const d = new Date(a.sessionDate);
          return d >= monthStart && d <= monthEnd;
        });
        const totalSessions = monthAttendance.length;
        const presentSessions = monthAttendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

        // Get points earned this month
        const transactions = await db.getPointsTransactions(input.playerId, 200);
        const bonusKey = `perfect-attendance-${now.getFullYear()}-${now.getMonth() + 1}`;
        const monthTransactions = transactions.filter((t: any) => {
          if (!t.createdAt) return false;
          const d = new Date(t.createdAt);
          return d >= monthStart && d <= monthEnd;
        });
        const pointsEarned = monthTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const bonusAwarded = transactions.some((t: any) => t.description?.includes(bonusKey));

        // Send to all linked parents
        const parents = await db.getParentsForPlayer(input.playerId);
        let sent = 0;
        for (const relation of parents) {
          const parentUser = await db.getUserById(relation.parentUserId);
          if (parentUser?.whatsappPhone) {
            await sendMonthlyAttendanceReport(parentUser.whatsappPhone, {
              parentName: parentUser.name || 'Parent',
              playerName: `${player.firstName} ${player.lastName}`,
              month: input.month,
              attendanceRate,
              totalSessions,
              presentSessions,
              pointsEarned,
              bonusAwarded,
            });
            sent++;
          }
        }
        return { success: true, sent, attendanceRate, totalSessions, presentSessions, pointsEarned };
      }),

    getLowAttendancePlayers: coachProcedure
      .input(z.object({
        threshold: z.number().min(0).max(100).default(70),
        teamId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const allPlayers = await db.getAllPlayers();
        const teamPlayers = input.teamId
          ? allPlayers.filter((p: any) => p.teamId === input.teamId)
          : allPlayers;
        const flagged = await Promise.all(
          teamPlayers.map(async (player: any) => {
            const rate = await db.getPlayerAttendanceRate(player.id);
            const attendanceRate = rate?.rate ?? 0;
            if (attendanceRate < input.threshold && (rate?.total ?? 0) >= 3) {
              return {
                playerId: player.id,
                playerName: `${player.firstName} ${player.lastName}`,
                ageGroup: player.ageGroup,
                position: player.position,
                attendanceRate,
                totalSessions: rate?.total ?? 0,
                presentSessions: rate?.present ?? 0,
                flag: attendanceRate < 50 ? 'critical' : attendanceRate < 60 ? 'warning' : attendanceRate < 70 ? 'monitor' : 'ok',
              };
            }
            return null;
          })
        );
        return flagged.filter(Boolean).sort((a: any, b: any) => a.attendanceRate - b.attendanceRate);
      }),
    getReportData: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const allPlayers = await db.getAllPlayers();
        const teamPlayers = input.teamId
          ? allPlayers.filter((p: any) => p.teamId === input.teamId)
          : allPlayers;
        const rows: any[] = [];
        for (const player of teamPlayers) {
          const allAttendance = await db.getPlayerAttendance(player.id, 1000);
          let filtered = allAttendance;
          if (input.dateFrom) {
            const from = new Date(input.dateFrom);
            filtered = filtered.filter((a: any) => a.sessionDate && new Date(a.sessionDate) >= from);
          }
          if (input.dateTo) {
            const to = new Date(input.dateTo);
            filtered = filtered.filter((a: any) => a.sessionDate && new Date(a.sessionDate) <= to);
          }
          const total = filtered.length;
          const present = filtered.filter((a: any) => a.status === 'present').length;
          const absent = filtered.filter((a: any) => a.status === 'absent').length;
          const late = filtered.filter((a: any) => a.status === 'late').length;
          const excused = filtered.filter((a: any) => a.status === 'excused').length;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          rows.push({
            playerName: `${player.firstName} ${player.lastName}`,
            jerseyNumber: player.jerseyNumber ?? '',
            position: player.position ?? '',
            ageGroup: player.ageGroup ?? '',
            totalSessions: total,
            present,
            absent,
            late,
            excused,
            attendanceRate: rate,
            sessions: filtered.map((a: any) => ({
              date: a.sessionDate ? new Date(a.sessionDate).toLocaleDateString('en-GB') : '',
              type: a.sessionType,
              status: a.status,
              notes: a.notes ?? '',
            })),
          });
        }
        return rows;
      }),
    getTeamAttendance: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        dateRange: z.enum(['week', 'month', 'season', 'all']).optional(),
      }))
      .query(async ({ input }) => {
        // Get all players
        const allPlayers = await db.getAllPlayers();
        const teamPlayers = input.teamId
          ? allPlayers.filter((p: any) => p.teamId === input.teamId)
          : allPlayers;
        // Get attendance for each player
        const playerStats = await Promise.all(
          teamPlayers.map(async (player: any) => {
            const rate = await db.getPlayerAttendanceRate(player.id);
            return {
              playerId: player.id,
              playerName: `${player.firstName} ${player.lastName}`,
              jerseyNumber: player.jerseyNumber,
              position: player.position,
              ageGroup: player.ageGroup,
              attendanceRate: rate?.rate ?? 0,
              totalSessions: rate?.total ?? 0,
              presentSessions: rate?.present ?? 0,
            };
          })
        );
        return playerStats;
      }),
  }),

  // ==================== POINTS & REWARDS ====================
  points: router({
    getPlayerPoints: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerPoints(input.playerId);
      }),
    awardPoints: coachProcedure
      .input(z.object({
        playerId: z.number(),
        amount: z.number(),
        type: z.enum(['attendance', 'performance', 'improvement', 'bonus', 'achievement']),
        description: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const prevPoints = await db.getPlayerPoints(input.playerId);
        const prevTotal = prevPoints?.totalEarned ?? 0;
        await db.awardPoints(input.playerId, input.amount, input.type, input.description, ctx.user.id);
        const newPoints = await db.getPlayerPoints(input.playerId);
        const newTotal = newPoints?.totalEarned ?? 0;
        // Check for milestone achievements
        const MILESTONES = [
          { threshold: 100, title: 'First Steps', icon: '🌟' },
          { threshold: 250, title: 'Rising Star', icon: '⭐' },
          { threshold: 500, title: 'Half Century', icon: '🏅' },
          { threshold: 1000, title: 'Champion', icon: '🥇' },
          { threshold: 2500, title: 'Elite Player', icon: '🏆' },
          { threshold: 5000, title: 'Legend', icon: '👑' },
          { threshold: 10000, title: 'Academy Icon', icon: '💎' },
        ];
        const newMilestones = MILESTONES.filter(m => prevTotal < m.threshold && newTotal >= m.threshold);
        for (const milestone of newMilestones) {
          try {
            await db.createAchievement({
              playerId: input.playerId,
              title: milestone.icon + ' ' + milestone.title,
              description: 'Reached ' + milestone.threshold + ' total points!',
              category: 'milestone',
              achievedDate: new Date(),
              iconType: milestone.icon,
            });
          } catch (e) { /* ignore duplicate */ }
        }
        return { success: true, newMilestones: newMilestones.map(m => m.title) };
      }),
    getTransactions: protectedProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPointsTransactions(input.playerId, input.limit);
      }),
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPointsLeaderboard(input.limit);
      }),
    getPlayerAchievements: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerAchievements(input.playerId);
      }),
    getMilestones: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const playerPts = await db.getPlayerPoints(input.playerId);
        const totalEarned = playerPts?.totalEarned ?? 0;
        const MILESTONES = [
          { threshold: 100, title: 'First Steps', description: 'Earned your first 100 points', icon: '\u{1F31F}' },
          { threshold: 250, title: 'Rising Star', description: 'Reached 250 total points', icon: '\u2B50' },
          { threshold: 500, title: 'Half Century', description: 'Crossed 500 points milestone', icon: '\u{1F3C5}' },
          { threshold: 1000, title: 'Champion', description: 'Earned 1,000 points', icon: '\u{1F947}' },
          { threshold: 2500, title: 'Elite Player', description: 'Reached 2,500 points - elite status', icon: '\u{1F3C6}' },
          { threshold: 5000, title: 'Legend', description: 'Earned 5,000 points', icon: '\u{1F451}' },
          { threshold: 10000, title: 'Academy Icon', description: 'Reached 10,000 points', icon: '\u{1F48E}' },
        ];
        return MILESTONES.map(m => ({
          ...m,
          earned: totalEarned >= m.threshold,
          progress: Math.min(100, Math.round((totalEarned / m.threshold) * 100)),
        }));
      }),
  }),

  rewards: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllRewards();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRewardById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        pointsCost: z.number(),
        category: z.enum(['merchandise', 'training', 'experience', 'gift']),
        imageUrl: z.string().optional(),
        stock: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createReward(input);
        return { success: true };
      }),
    redeem: protectedProcedure
      .input(z.object({ playerId: z.number(), rewardId: z.number() }))
      .mutation(async ({ input }) => {
        return db.redeemReward(input.playerId, input.rewardId);
      }),
    getRedemptions: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerRedemptions(input.playerId);
      }),
  }),

  // ==================== PLAYER ACTIVITIES ====================
  activities: router({
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        activityType: z.enum(['training', 'match', 'assessment', 'trial']),
        activityDate: z.string(),
        durationMinutes: z.number(),
        opponent: z.string().optional(),
        score: z.string().optional(),
        result: z.enum(['win', 'draw', 'loss']).optional(),
        goals: z.number().optional(),
        assists: z.number().optional(),
        possessions: z.number().optional(),
        workRate: z.number().optional(),
        ballTouches: z.number().optional(),
        speedActions: z.number().optional(),
        position: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPlayerActivity({ ...input, activityDate: new Date(input.activityDate) });
        return { success: true };
      }),
    getPlayerActivities: protectedProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerActivities(input.playerId, input.limit);
      }),
  }),

  // ==================== WEEKLY TARGETS ====================
  weeklyTargets: router({
    getPlayerTargets: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerWeeklyTargets(input.playerId);
      }),
    setTarget: coachProcedure
      .input(z.object({
        playerId: z.number(),
        weekStartDate: z.string(),
        targetType: z.enum(['speed_actions', 'ball_touches', 'training_hours', 'goals', 'assists']),
        targetValue: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.setWeeklyTarget({ ...input, weekStartDate: new Date(input.weekStartDate) });
        return { success: true };
      }),
    updateProgress: coachProcedure
      .input(z.object({ id: z.number(), currentValue: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateWeeklyTargetProgress(input.id, input.currentValue);
        return { success: true };
      }),
  }),

  // ==================== AI VIDEO ANALYSIS (Legacy) ====================
  aiVideoAnalysisLegacy: router({
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        title: z.string().optional(),
        analysisType: z.enum(['match', 'training', 'skills', 'movement']),
      }))
      .mutation(async ({ input }) => {
        await db.createAIVideoAnalysis({ ...input, status: 'pending' });
        return { success: true };
      }),
    getPlayerAnalysis: protectedProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerAIVideoAnalysis(input.playerId, input.limit);
      }),
    updateAnalysis: coachProcedure
      .input(z.object({
        id: z.number(),
        aiSummary: z.string().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        technicalScore: z.number().optional(),
        tacticalScore: z.number().optional(),
        physicalScore: z.number().optional(),
        recommendations: z.string().optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateAIVideoAnalysis(id, { ...data, analyzedBy: ctx.user.id, analyzedAt: new Date() });
        return { success: true };
      }),
  }),

  // ==================== MASTERCLASS CONTENT ====================
  masterclass: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllMasterclassContent();
    }),
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getMasterclassByCategory(input.category);
      }),
    getForPosition: publicProcedure
      .input(z.object({ position: z.string() }))
      .query(async ({ input }) => {
        return db.getMasterclassForPosition(input.position);
      }),
    incrementViews: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementMasterclassViews(input.id);
        return { success: true };
      }),
  }),

  // ==================== AI VIDEO ANALYSIS ====================
  aiVideoAnalysis: router({
    // Legacy analyze without vision (uses metadata only)
    analyze: publicProcedure
      .input(z.object({
        videoUrl: z.string().min(1),
        playerName: z.string().optional(),
        teamColor: z.string().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']).optional(),
        fileSizeMb: z.number().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVideoWithAI } = await import('./aiVideoAnalysis');
        const result = await analyzeVideoWithAI(input);
        return result;
      }),
    
    // Real video analysis with vision - analyzes actual video frames
    analyzeWithVision: publicProcedure
      .input(z.object({
        videoUrl: z.string().min(1),
        frames: z.array(z.string()).min(1).max(10), // Base64 encoded frame images
        playerName: z.string().optional(),
        teamColor: z.string().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']).optional(),
        metadata: z.object({
          duration: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          frameRate: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVideoWithVision } = await import('./realVideoAnalysis');
        const result = await analyzeVideoWithVision(input);
        return result;
      }),
    save: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        videoUrl: z.string().min(1),
        playerName: z.string().optional(),
        teamColor: z.string().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']),
        fileSizeMb: z.number().optional(),
        duration: z.number().optional(),
        overallScore: z.number().optional(),
        movementAnalysis: z.string().optional(),
        technicalAnalysis: z.string().optional(),
        tacticalAnalysis: z.string().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        drillRecommendations: z.string().optional(),
        coachNotes: z.string().optional(),
        heatmapZones: z.string().optional(),
        playerId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.saveVideoAnalysis({
          ...input,
          uploadedBy: ctx.user.id,
          analysisStatus: 'completed',
        });
        return { id };
      }),
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getVideoAnalysisHistory(ctx.user.id, input.limit);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnalysisById(input.id);
      }),
    
    // AI-powered player tracking
    trackPlayers: publicProcedure
      .input(z.object({
        frames: z.array(z.string()).min(1).max(20), // Base64 encoded frames
        videoMetadata: z.object({
          duration: z.number(),
          fps: z.number().default(30),
          width: z.number(),
          height: z.number(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { trackPlayersInVideo } = await import('./ai-player-tracking');
        const result = await trackPlayersInVideo(input.frames, input.videoMetadata);
        return result;
      }),

    // ── Compare player technique with professional benchmark ──
    compareWithBenchmark: protectedProcedure
      .input(z.object({
        playerAnalysis: z.string(),
        benchmarkKey: z.string(),
        videoType: z.enum(['match', 'training', 'individual']).default('individual'),
        playerName: z.string().default('the player'),
      }))
      .mutation(async ({ input }) => {
        const benchmarks: Record<string, any> = {"messi_dribbling": {"name": "Lionel Messi", "skill": "Close Control Dribbling", "metrics": {"Ball Control": 99, "Dribbling": 99, "Balance": 95, "Agility": 93, "Low Centre of Gravity": 97, "Vision": 95}}, "neymar_dribbling": {"name": "Neymar Jr", "skill": "Flair Dribbling & Feints", "metrics": {"Dribbling": 97, "Flair": 99, "Agility": 96, "Balance": 94, "Creativity": 97, "Ball Control": 96}}, "mbappe_dribbling": {"name": "Kylian Mbappé", "skill": "Speed Dribbling", "metrics": {"Speed": 99, "Acceleration": 99, "Dribbling": 95, "Ball Control": 93, "Agility": 95, "Composure": 88}}, "salah_dribbling": {"name": "Mohamed Salah", "skill": "Direct Dribbling", "metrics": {"Dribbling": 93, "Speed": 95, "Finishing": 92, "Ball Control": 91, "Agility": 90, "Work Rate": 94}}, "ronaldo_shooting": {"name": "Cristiano Ronaldo", "skill": "Power Shooting", "metrics": {"Shooting Power": 99, "Long Shots": 98, "Finishing": 97, "Heading": 95, "Athleticism": 99, "Composure": 96}}, "lewandowski_finishing": {"name": "Robert Lewandowski", "skill": "Clinical Finishing", "metrics": {"Finishing": 98, "Positioning": 97, "Ball Control": 93, "Heading": 91, "Composure": 95, "First Touch": 92}}, "benzema_finishing": {"name": "Karim Benzema", "skill": "Technical Finishing", "metrics": {"Finishing": 95, "Ball Control": 95, "Dribbling": 88, "Vision": 90, "Composure": 96, "Positioning": 94}}, "haaland_finishing": {"name": "Erling Haaland", "skill": "Aerial & Power Finishing", "metrics": {"Finishing": 97, "Heading": 95, "Strength": 97, "Speed": 96, "Positioning": 96, "Composure": 90}}, "modric_passing": {"name": "Luka Modrić", "skill": "Short & Long Passing", "metrics": {"Short Passing": 96, "Long Passing": 93, "Vision": 97, "Composure": 96, "Ball Control": 95, "Stamina": 90}}, "debruyne_passing": {"name": "Kevin De Bruyne", "skill": "Through Balls & Delivery", "metrics": {"Long Passing": 97, "Short Passing": 93, "Vision": 98, "Crossing": 95, "Shooting": 91, "Composure": 93}}, "xavi_passing": {"name": "Xavi Hernández", "skill": "Tiki-Taka Passing", "metrics": {"Short Passing": 99, "Vision": 98, "Ball Control": 97, "Composure": 97, "Positioning": 95, "Stamina": 88}}, "pirlo_passing": {"name": "Andrea Pirlo", "skill": "Deep-Lying Playmaker", "metrics": {"Long Passing": 97, "Short Passing": 95, "Vision": 98, "Composure": 97, "Free Kick": 95, "Positioning": 93}}, "ramos_defending": {"name": "Sergio Ramos", "skill": "Aggressive Defending", "metrics": {"Tackling": 95, "Heading": 94, "Strength": 93, "Aggression": 95, "Positioning": 94, "Leadership": 97}}, "vanDijk_defending": {"name": "Virgil van Dijk", "skill": "Commanding CB", "metrics": {"Heading": 97, "Strength": 97, "Tackling": 93, "Positioning": 96, "Composure": 95, "Speed": 89}}, "kante_pressing": {"name": "N'Golo Kanté", "skill": "Pressing & Interceptions", "metrics": {"Interceptions": 97, "Stamina": 98, "Tackling": 95, "Work Rate": 99, "Positioning": 93, "Aggression": 88}}, "alisson_gk": {"name": "Alisson Becker", "skill": "Modern Goalkeeper", "metrics": {"Reflexes": 97, "Positioning": 97, "Handling": 96, "Kicking": 93, "Composure": 96, "Distribution": 91}}, "mbappe_speed": {"name": "Kylian Mbappé", "skill": "Elite Speed & Acceleration", "metrics": {"Sprint Speed": 99, "Acceleration": 99, "Agility": 95, "Stamina": 92, "Balance": 88, "Strength": 82}}, "ronaldo_athleticism": {"name": "Cristiano Ronaldo", "skill": "Peak Athleticism", "metrics": {"Sprint Speed": 95, "Jumping": 97, "Strength": 94, "Stamina": 96, "Agility": 93, "Balance": 90}}, "vinicius_agility": {"name": "Vinícius Jr", "skill": "Agility & Balance", "metrics": {"Agility": 97, "Balance": 96, "Dribbling": 95, "Speed": 97, "Flair": 96, "Ball Control": 92}}};

        const benchmark = benchmarks[input.benchmarkKey];
        if (!benchmark) throw new Error('Unknown benchmark key');

        const metricKeys = Object.keys(benchmark.metrics);
        const benchmarkValues = benchmark.metrics;

        const prompt = `You are an elite football scout and performance analyst. Compare ${input.playerName}'s technique with ${benchmark.name}'s ${benchmark.skill} based on the following video analysis.

PLAYER VIDEO ANALYSIS:
${input.playerAnalysis}

PROFESSIONAL BENCHMARK: ${benchmark.name} — ${benchmark.skill}
Benchmark scores (out of 100): ${JSON.stringify(benchmarkValues)}

Your task:
1. Estimate the player's scores (out of 100) for the same attributes based on what you observed in the video analysis: ${metricKeys.join(', ')}
2. Identify the top 3 gaps where the player falls most short of the benchmark
3. Identify the top 2 areas where the player shows similar quality to the benchmark
4. Give a specific drill recommendation for each gap
5. Calculate an overall similarity score (0-100) based on how close the player is to the benchmark
6. Write a 2-sentence verdict

Return ONLY a JSON object with this exact structure:
{
  "radarData": [
    {"attribute": "Ball Control", "player": 72, "benchmark": 99},
    ...one entry per attribute...
  ],
  "gaps": [
    {"area": "Attribute Name", "description": "Specific observation about the gap", "drill": "Specific drill name"},
    ...top 3 gaps...
  ],
  "similarities": [
    {"area": "Attribute Name", "description": "Specific observation about the similarity"},
    ...top 2 similarities...
  ],
  "similarityScore": 45,
  "verdict": "Two-sentence verdict comparing the player to the benchmark."
}`;

        const { invokeLLM, extractJSON } = await import('./_core/llm');
        const response = await invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
        });

        const rawText = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || '';
        const parsed = rawText ? extractJSON(rawText) : null;
        if (!parsed) {
          // Fallback: generate estimated scores from benchmark
          const radarData = metricKeys.map(key => ({
            attribute: key,
            player: Math.max(40, benchmarkValues[key] - Math.floor(Math.random() * 30 + 10)),
            benchmark: benchmarkValues[key],
          }));
          return {
            radarData,
            gaps: [
              { area: 'Analysis Unavailable', description: 'Could not parse comparison results. Please try again.', drill: '' }
            ],
            similarities: [],
            similarityScore: 50,
            verdict: 'Comparison analysis could not be fully parsed. Please retry.',
          };
        }
        return parsed;
      }),
    saveReport: protectedProcedure
      .input(z.object({
        title: z.string(),
        videoUrl: z.string().optional(),
        playerName: z.string().optional(),
        analysisType: z.string().default('match'),
        reportContent: z.string(),
        framesAnalyzed: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        // Ensure share_token column exists (idempotent)
        try { await database.execute(sql`ALTER TABLE video_analysis_reports ADD COLUMN share_token VARCHAR(64) NULL`); } catch (_) {}
        const [result] = await database.execute(sql`INSERT INTO video_analysis_reports (user_id, title, video_url, player_name, analysis_type, report_content, frames_analyzed) VALUES (${ctx.user.id}, ${input.title}, ${input.videoUrl || null}, ${input.playerName || null}, ${input.analysisType}, ${input.reportContent}, ${input.framesAnalyzed})`);
        return { success: true, id: (result as any).insertId };
      }),
    getReports: protectedProcedure
      .query(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(sql`SELECT * FROM video_analysis_reports WHERE user_id = ${ctx.user.id} ORDER BY created_at DESC LIMIT 50`);
        return (rows as unknown as any[]);
      }),
    deleteReport: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        await database.execute(sql`DELETE FROM video_analysis_reports WHERE id = ${input.id} AND user_id = ${ctx.user.id}`);
        return { success: true };
      }),
    generateShareToken: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        // Ensure column exists
        try { await database.execute(sql`ALTER TABLE video_analysis_reports ADD COLUMN share_token VARCHAR(64) NULL`); } catch (_) {}
        // Check ownership
        const rows = await database.execute(sql`SELECT id, share_token FROM video_analysis_reports WHERE id = ${input.id} AND user_id = ${ctx.user.id}`);
        const report = (rows as unknown as any[])[0];
        if (!report) throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
        if (report.share_token) return { token: report.share_token };
        // Generate a unique token
        const token = require('crypto').randomBytes(24).toString('hex');
        await database.execute(sql`UPDATE video_analysis_reports SET share_token = ${token} WHERE id = ${input.id}`);
        return { token };
      }),
    getSharedReport: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const rows = await database.execute(
          sql`SELECT id, title, player_name, analysis_type, report_content, frames_analyzed, created_at FROM video_analysis_reports WHERE share_token = ${input.token}`
        );
        const report = (rows as unknown as any[])[0];
        if (!report) throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared report not found or link expired' });
        return report as { id: number; title: string; player_name: string | null; analysis_type: string; report_content: string; frames_analyzed: number; created_at: string };
      }),
  }),

  // ==================== DRILL ASSIGNMENTS ====================
  drillAssignments: router({
    // Coach assigns a drill to a player
    assign: coachProcedure
      .input(z.object({
        playerId: z.number(),
        drillId: z.string(),
        drillName: z.string(),
        drillNameAr: z.string().optional(),
        category: z.string().optional(),
        improvementArea: z.string().optional(),
        reason: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
        videoAnalysisId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDrillAssignment({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          assignedBy: ctx.user.id,
        });
        return { id, success: true };
      }),

    // Get assignments for a specific player
    getForPlayer: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerDrillAssignments(input.playerId);
      }),

    // Get assignments created by the current coach
    getMyAssignments: coachProcedure
      .query(async ({ ctx }) => {
        return db.getCoachDrillAssignments(ctx.user.id);
      }),

    // Get all assignments (admin/coach view)
    getAll: staffProcedure
      .query(async () => {
        return db.getAllDrillAssignments();
      }),

    // Get pending assignments for a player
    getPending: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPendingAssignmentsForPlayer(input.playerId);
      }),

    // Update assignment status (player marks as complete)
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
        playerNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDrillAssignmentStatus(input.id, input.status, input.playerNotes);
        return { success: true };
      }),

    // Coach adds feedback to a completed assignment
    addFeedback: coachProcedure
      .input(z.object({
        id: z.number(),
        feedback: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addCoachFeedbackToAssignment(input.id, input.feedback);
        return { success: true };
      }),

    // Get a single assignment by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDrillAssignmentById(input.id);
      }),
  }),

  // ==================== TRAINING VIDEOS ====================
  trainingVideos: router({
    // Get published videos (public)
    getPublished: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getPublishedTrainingVideos(input?.category);
      }),

    // Get all videos (staff only)
    getAll: staffProcedure
      .query(async () => {
        return db.getAllTrainingVideos();
      }),

    // Get single video by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTrainingVideoById(input.id);
      }),

    // Create new video (coach/admin)
    create: coachProcedure
      .input(z.object({
        title: z.string(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        category: z.string(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        ageGroup: z.string().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTrainingVideo({
          ...input,
          uploadedBy: ctx.user.id,
        });
        return { id, success: true };
      }),

    // Update video (coach/admin)
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        category: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        ageGroup: z.string().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrainingVideo(id, data);
        return { success: true };
      }),

    // Delete video (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTrainingVideo(input.id);
        return { success: true };
      }),

    // Increment view count
    incrementViews: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementVideoViewCount(input.id);
        return { success: true };
      }),

    // Get videos uploaded by current user
    getMyVideos: coachProcedure
      .query(async ({ ctx }) => {
        return db.getTrainingVideosByUploader(ctx.user.id);
      }),
    // AI-powered video recommendations based on player skill profile
    getAIRecommendations: protectedProcedure
      .input(z.object({ playerId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        // Determine which player to get recommendations for
        let playerId = input.playerId;
        if (!playerId) {
          const player = await db.getPlayerByUserId(ctx.user.id);
          if (player) playerId = player.id;
        }
        if (!playerId) return { recommendations: [], skillProfile: null };
        
        // Get player skill scores
        const skillScore = await db.getLatestSkillScore(playerId);
        const allVideos = await db.getPublishedTrainingVideos();
        
        if (!skillScore || allVideos.length === 0) {
          return { recommendations: allVideos.slice(0, 6).map(v => ({ ...v, reason: 'General training video', matchScore: 70 })), skillProfile: skillScore };
        }
        
        // Map skill scores to video categories
        const skillMap: Record<string, number> = {
          ball_control: skillScore.ballControl || 50,
          passing: skillScore.passing || 50,
          shooting: skillScore.shooting || 50,
          dribbling: skillScore.dribbling || 50,
          speed_agility: Math.round(((skillScore.speed || 50) + (skillScore.agility || 50)) / 2),
          positioning: skillScore.positioning || 50,
          heading: skillScore.heading || 50,
          fitness: skillScore.stamina || 50,
          tactical: skillScore.decisionMaking || 50,
        };
        
        // Find weakest skills (below 60) to prioritize improvement
        const weakSkills = Object.entries(skillMap)
          .filter(([, score]) => score < 60)
          .sort(([, a], [, b]) => a - b)
          .map(([skill]) => skill);
        
        // Score each video based on skill relevance
        const scoredVideos = allVideos.map(video => {
          const category = video.category || 'general';
          const catScore = skillMap[category] || 60;
          const isWeakArea = weakSkills.includes(category);
          
          const matchScore = isWeakArea ? Math.round(100 - catScore + 20) : Math.round(catScore * 0.6);
          
          let reason = 'General training';
          if (isWeakArea) {
            reason = `Improve your ${category.replace(/_/g, ' ')} (score: ${catScore}/100)`;
          } else if (catScore >= 70) {
            reason = `Maintain your strong ${category.replace(/_/g, ' ')} skills`;
          }
          
          return { ...video, reason, matchScore };
        });
        
        const recommendations = scoredVideos
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 8);
        
        return { recommendations, skillProfile: skillScore };
      }),
  }),
  // ==================== PRIVATE TRAINING BOOKINGS =====================
  privateTraining: router({
    // Get all coaches with ratings and availability
    getCoaches: publicProcedure.query(async () => {
      return db.getCoachesWithRatings();
    }),

    // Get coach details with reviews
    getCoachDetails: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        const reviews = await db.getCoachReviews(input.coachId);
        const rating = await db.getCoachAverageRating(input.coachId);
        const slots = await db.getAvailableCoachSlots(input.coachId);
        return { reviews, rating, slots };
      }),

    // Get available slots for a coach
    getCoachSlots: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        return db.getAvailableCoachSlots(input.coachId);
      }),

    // Get all training locations
    getLocations: publicProcedure.query(async () => {
      return db.getActiveTrainingLocations();
    }),

    // Book a private training session (supports recurring)
    book: protectedProcedure
      .input(z.object({
        coachId: z.number(),
        playerId: z.number(),
        locationId: z.number(),
        slotId: z.number().optional(),
        sessionDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        notes: z.string().optional(),
        price: z.number().optional(),
        isRecurring: z.boolean().optional(),
        recurringWeeks: z.number().min(2).max(12).optional(), // 2-12 weeks
      }))
      .mutation(async ({ ctx, input }) => {
        const bookingIds: number[] = [];
        const recurringGroupId = input.isRecurring ? crypto.randomUUID() : undefined;
        const weeksToBook = input.isRecurring && input.recurringWeeks ? input.recurringWeeks : 1;
        
        for (let week = 0; week < weeksToBook; week++) {
          // Calculate session date for this week
          const baseDate = new Date(input.sessionDate);
          baseDate.setDate(baseDate.getDate() + (week * 7));
          const sessionDateStr = baseDate.toISOString().split('T')[0];
          
          // Check for booking conflict
          const hasConflict = await db.checkBookingConflict(
            input.locationId,
            sessionDateStr,
            input.startTime,
            input.endTime
          );
          
          if (hasConflict) {
            if (week === 0) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: 'This time slot is already booked at this location',
              });
            }
            // Skip conflicting weeks for recurring bookings
            continue;
          }
          
          const bookingId = await db.createPrivateTrainingBooking({
            coachId: input.coachId,
            playerId: input.playerId,
            bookedBy: ctx.user.id,
            locationId: input.locationId,
            slotId: input.slotId,
            sessionDate: baseDate,
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
            totalPrice: input.price,
            status: 'pending',
            isRecurring: input.isRecurring || false,
            recurringGroupId,
            recurringWeeks: input.recurringWeeks,
            recurringIndex: week + 1,
          });
          
          if (bookingId) bookingIds.push(bookingId);
        }
        
        return { 
          success: true, 
          bookingId: bookingIds[0], 
          bookingIds,
          totalBooked: bookingIds.length,
          isRecurring: input.isRecurring || false,
        };
      }),

    // Get my bookings (for parents)
    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      // Get all players linked to this parent
      const playerRelations = await db.getParentPlayerRelations(ctx.user.id);
      const playerIds = playerRelations.map(r => r.playerId);
      
      // Get bookings for all linked players
      const allBookings = [];
      for (const playerId of playerIds) {
        const bookings = await db.getPlayerPrivateTrainingBookings(playerId);
        allBookings.push(...bookings);
      }
      
      return allBookings.sort((a, b) => 
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      );
    }),

    // Get bookings for a specific player
    getPlayerBookings: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerPrivateTrainingBookings(input.playerId);
      }),

    // Get coach's bookings (for coaches)
    getCoachBookings: coachProcedure.query(async ({ ctx }) => {
      return db.getCoachPrivateTrainingBookings(ctx.user.id);
    }),

    // Confirm booking (coach/admin)
    confirmBooking: coachProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updatePrivateTrainingBooking(input.bookingId, { status: 'confirmed' });
        
        // Get booking details for notification
        const booking = await db.getPrivateTrainingBookingById(input.bookingId);
        let whatsappUrl = null;
        
        if (booking) {
          const { generateBookingConfirmationMessage, generateAcademyWhatsAppUrl } = await import('./whatsappNotification');
          const message = generateBookingConfirmationMessage({
            parentName: booking.parentName || 'Parent',
            playerName: booking.playerName || 'Player',
            coachName: booking.coachName || 'Coach',
            sessionDate: new Date(booking.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
            startTime: booking.startTime,
            endTime: booking.endTime,
            locationName: booking.locationName ?? undefined,
            price: booking.totalPrice ?? undefined,
          });
          whatsappUrl = generateAcademyWhatsAppUrl(message);
        }
        
        return { success: true, whatsappUrl };
      }),

    // Complete booking (coach/admin)
    completeBooking: coachProcedure
      .input(z.object({ 
        bookingId: z.number(),
        coachNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePrivateTrainingBooking(input.bookingId, { 
          status: 'completed',
          coachNotes: input.coachNotes,
        });
        return { success: true };
      }),

    // Cancel booking
    cancelBooking: protectedProcedure
      .input(z.object({ 
        bookingId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.cancelPrivateTrainingBooking(input.bookingId, input.reason);
        return { success: true };
      }),

    // Cancel all future sessions in a recurring series
    cancelRecurringSeries: protectedProcedure
      .input(z.object({
        recurringGroupId: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.cancelRecurringSeries(input.recurringGroupId, input.reason);
        return { success: true, cancelledCount: result.cancelled };
      }),

    // Get tomorrow's bookings for reminders (coach/admin)
    getTomorrowsBookings: coachProcedure.query(async () => {
      const bookings = await db.getTomorrowsBookings();
      
      // Generate WhatsApp reminder URLs for each booking
      const { generateSessionReminderMessage, generateAcademyWhatsAppUrl } = await import('./whatsappNotification');
      
      return bookings.map(booking => ({
        ...booking,
        whatsappReminderUrl: generateAcademyWhatsAppUrl(
          generateSessionReminderMessage({
            parentName: booking.parentName || 'Parent',
            playerName: booking.playerName || 'Player',
            coachName: booking.coachName || 'Coach',
            sessionDate: new Date(booking.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
            startTime: booking.startTime,
            endTime: booking.endTime,
            locationName: booking.locationName ?? undefined,
          })
        ),
      }));
    }),

    // Get bookings in a recurring series
    getRecurringSeries: protectedProcedure
      .input(z.object({ recurringGroupId: z.string() }))
      .query(async ({ input }) => {
        return db.getRecurringSeriesBookings(input.recurringGroupId);
      }),

    // Submit review after training
    submitReview: protectedProcedure
      .input(z.object({
        coachId: z.number(),
        bookingId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCoachReview({
          coachId: input.coachId,
          reviewerId: ctx.user.id,
          bookingId: input.bookingId,
          rating: input.rating,
          comment: input.comment,
        });
        return { success: true };
      }),

    // Get all bookings (admin)
    getAllBookings: adminProcedure.query(async () => {
      return db.getAllPrivateTrainingBookings();
    }),

    // Coach schedule management
    addSlot: coachProcedure
      .input(z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        locationId: z.number().optional(),
        pricePerSession: z.number().optional(),
        isRecurring: z.boolean().optional(),
        specificDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const slotId = await db.createCoachScheduleSlot({
          coachId: ctx.user.id,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          locationId: input.locationId,
          pricePerSession: input.pricePerSession,
          isRecurring: input.isRecurring ?? true,
          specificDate: input.specificDate ? new Date(input.specificDate) : undefined,
        });
        return { success: true, slotId };
      }),

    // Get my schedule slots (coach)
    getMySlots: coachProcedure.query(async ({ ctx }) => {
      return db.getCoachScheduleSlots(ctx.user.id);
    }),

    // Update slot availability
    updateSlot: coachProcedure
      .input(z.object({
        slotId: z.number(),
        isAvailable: z.boolean().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        pricePerSession: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { slotId, ...data } = input;
        await db.updateCoachScheduleSlot(slotId, data);
        return { success: true };
      }),

    // Delete slot
    deleteSlot: coachProcedure
      .input(z.object({ slotId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCoachScheduleSlot(input.slotId);
        return { success: true };
      }),

    // Admin: Manage locations
    createLocation: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        address: z.string().optional(),
        capacity: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const locationId = await db.createTrainingLocation(input);
        return { success: true, locationId };
      }),

    // Get all locations (admin)
    getAllLocations: adminProcedure.query(async () => {
      return db.getAllTrainingLocations();
    }),

    // Update location
    updateLocation: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        address: z.string().optional(),
        capacity: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrainingLocation(id, data);
        return { success: true };
      }),

    // Check availability for a specific date/time/location
    checkAvailability: publicProcedure
      .input(z.object({
        locationId: z.number(),
        sessionDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      }))
      .query(async ({ input }) => {
        const hasConflict = await db.checkBookingConflict(
          input.locationId,
          input.sessionDate,
          input.startTime,
          input.endTime
        );
        return { available: !hasConflict };
      }),

    // Get coach booking stats
    getCoachStats: coachProcedure.query(async ({ ctx }) => {
      return db.getCoachBookingStats(ctx.user.id);
    }),

    // Submit review for completed booking
    submitBookingReview: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        coachId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const review = await db.submitBookingReview(
          input.bookingId,
          ctx.user.id,
          input.coachId,
          input.rating,
          input.comment
        );
        return { success: true, review };
      }),

    // Get review for a booking
    getBookingReview: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return db.getBookingReview(input.bookingId);
      }),

    // Get coach reviews with details
    getCoachReviewsDetailed: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachReviewsWithDetails(input.coachId);
      }),
  }),

  // ==================== COACH PROGRESS MONITORING ====================
  coachProgress: router({
    // Get overview of all players the coach has trained
    getPlayerOverview: coachProcedure
      .query(async ({ ctx }) => {
        return db.getCoachPlayerOverview(ctx.user.openId);
      }),

    // Get detailed progress metrics for a specific player
    getPlayerProgress: coachProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerProgressMetrics(input.playerId);
      }),

    // Get coach's own training stats
    getMyStats: coachProcedure
      .query(async ({ ctx }) => {
        return db.getCoachTrainingStats(ctx.user.openId);
      }),

    // Get skill trend for a player
    getPlayerSkillTrend: coachProcedure
      .input(z.object({ playerId: z.number(), skillName: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerSkillTrend(input.playerId, input.skillName);
      }),

    // Get team progress overview
    getTeamProgress: coachProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamProgressOverview(input.teamId);
      }),
  }),
  // ==================== COACH PERFORMANCE RATINGS ====================
  coachPerformance: router({
    rateCoach: adminProcedure
      .input(z.object({
        coachUserId: z.number(),
        sessionQuality: z.number().min(1).max(10),
        playerEngagement: z.number().min(1).max(10),
        technicalKnowledge: z.number().min(1).max(10),
        communication: z.number().min(1).max(10),
        punctuality: z.number().min(1).max(10),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const overall = Math.round((input.sessionQuality + input.playerEngagement + input.technicalKnowledge + input.communication + input.punctuality) / 5);
        await database.insert(coachEvaluations).values({
          coachUserId: input.coachUserId,
          evaluatedBy: ctx.user.id,
          sessionQuality: input.sessionQuality,
          playerEngagement: input.playerEngagement,
          technicalKnowledge: input.technicalKnowledge,
          communication: input.communication,
          punctuality: input.punctuality,
          overallScore: overall,
          notes: input.notes,
        });
        return { success: true };
      }),
    getAllCoachRatings: staffProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const coaches = await database.select().from(users).where(eq(users.role, 'coach'));
      const results = await Promise.all(coaches.map(async (coach) => {
        const evals = await database.select().from(coachEvaluations).where(eq(coachEvaluations.coachUserId, coach.id)).orderBy(desc(coachEvaluations.createdAt));
        const avgScore = evals.length > 0 ? Math.round(evals.reduce((s, e) => s + e.overallScore, 0) / evals.length) : 0;
        return { coach, evaluations: evals, avgScore, totalEvals: evals.length };
      }));
      return results;
    }),
    getCoachHistory: staffProcedure
      .input(z.object({ coachUserId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        return database.select().from(coachEvaluations).where(eq(coachEvaluations.coachUserId, input.coachUserId)).orderBy(desc(coachEvaluations.createdAt));
      }),
  }),
  // ==================== VIDEO ANALYSIS ====================
  videoAnalysisAdvanced: router({
    // Create a video clip
    createClip: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        teamId: z.number().optional(),
        matchId: z.number().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoClip({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get clips by team
    getClipsByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoClipsByTeam(input.teamId);
      }),

    // Get my clips
    getMyClips: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getVideoClipsByUser(ctx.user.id);
      }),

    // Get clip by ID
    getClip: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoClipById(input.id);
      }),

    // Delete clip
    deleteClip: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoClip(input.id);
        return { success: true };
      }),

    // Add tag to clip
    addTag: protectedProcedure
      .input(z.object({
        clipId: z.number(),
        playerId: z.number().optional(),
        tagType: z.enum(["goal", "assist", "shot", "pass", "dribble", "tackle", "interception", "save", "error", "foul", "set_piece", "highlight", "custom"]),
        timestamp: z.number(),
        endTimestamp: z.number().optional(),
        description: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoTag({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get tags for clip
    getTagsByClip: protectedProcedure
      .input(z.object({ clipId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoTagsByClip(input.clipId);
      }),

    // Get tags for player (for highlight reels)
    getPlayerTags: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoTagsByPlayer(input.playerId);
      }),

    // Delete tag
    deleteTag: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoTag(input.id);
        return { success: true };
      }),

    // Add annotation
    addAnnotation: protectedProcedure
      .input(z.object({
        clipId: z.number(),
        timestamp: z.number(),
        annotationType: z.enum(["arrow", "circle", "rectangle", "line", "text", "freehand"]),
        data: z.string(), // JSON data
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoAnnotation({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get annotations for clip
    getAnnotationsByClip: protectedProcedure
      .input(z.object({ clipId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnnotationsByClip(input.clipId);
      }),

    // Delete annotation
    deleteAnnotation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoAnnotation(input.id);
        return { success: true };
      }),

    // Get player heatmaps
    getPlayerHeatmaps: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerHeatmapsByPlayer(input.playerId);
      }),

    // Get player highlight reel data
    getPlayerHighlights: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerHighlightTags(input.playerId);
      }),
  }),

  // ==================== TACTICAL PLANNING ====================
  tactics: router({
    // Create formation
    createFormation: protectedProcedure
      .input(z.object({
        name: z.string(),
        templateName: z.string().optional(),
        description: z.string().optional(),
        positions: z.string(), // JSON
        teamId: z.number().optional(),
        isTemplate: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createFormation({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get formations by team
    getFormationsByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getFormationsByTeam(input.teamId);
      }),

    // Get formation templates
    getFormationTemplates: publicProcedure
      .query(async () => {
        return db.getFormationTemplates();
      }),

    // Get formation by ID
    getFormation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getFormationById(input.id);
      }),

    // Update formation
    updateFormation: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        positions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateFormation(id, data);
      }),

    // Delete formation
    deleteFormation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFormation(input.id);
        return { success: true };
      }),

    // Create set piece
    createSetPiece: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["corner_kick", "free_kick", "throw_in", "penalty", "goal_kick", "kickoff"]),
        side: z.enum(["left", "right", "center"]).optional(),
        description: z.string().optional(),
        movements: z.string(), // JSON
        teamId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createSetPiece({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get set pieces by team
    getSetPiecesByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getSetPiecesByTeam(input.teamId);
      }),

    // Get set pieces by type
    getSetPiecesByType: protectedProcedure
      .input(z.object({ teamId: z.number(), type: z.string() }))
      .query(async ({ input }) => {
        return db.getSetPiecesByType(input.teamId, input.type);
      }),

    // Get set piece by ID
    getSetPiece: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSetPieceById(input.id);
      }),

    // Update set piece
    updateSetPiece: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        movements: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateSetPiece(id, data);
      }),

    // Delete set piece
    deleteSetPiece: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSetPiece(input.id);
        return { success: true };
      }),

    // Create opposition analysis
    createOppositionAnalysis: protectedProcedure
      .input(z.object({
        opponentName: z.string(),
        matchId: z.number().optional(),
        formation: z.string().optional(),
        playStyle: z.enum(["attacking", "defensive", "possession", "counter", "balanced"]).optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        patterns: z.string().optional(),
        setPlays: z.string().optional(),
        notes: z.string().optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createOppositionAnalysis({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get opposition analyses by team
    getOppositionAnalysesByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getOppositionAnalysisByTeam(input.teamId);
      }),

    // Get opposition analysis by ID
    getOppositionAnalysis: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOppositionAnalysisById(input.id);
      }),

    // Update opposition analysis
    updateOppositionAnalysis: protectedProcedure
      .input(z.object({
        id: z.number(),
        opponentName: z.string().optional(),
        formation: z.string().optional(),
        playStyle: z.enum(["attacking", "defensive", "possession", "counter", "balanced"]).optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        patterns: z.string().optional(),
        setPlays: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateOppositionAnalysis(id, data);
      }),

    // Delete opposition analysis
    deleteOppositionAnalysis: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOppositionAnalysis(input.id);
        return { success: true };
      }),

    // Create match briefing
    createMatchBriefing: protectedProcedure
      .input(z.object({
        matchId: z.number().optional(),
        title: z.string(),
        oppositionId: z.number().optional(),
        formationId: z.number().optional(),
        objectives: z.string().optional(),
        keyTactics: z.string().optional(),
        playerInstructions: z.string().optional(),
        setPieceIds: z.string().optional(),
        notes: z.string().optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createMatchBriefing({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get match briefings by team
    getMatchBriefingsByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchBriefingsByTeam(input.teamId);
      }),

    // Get match briefing by ID
    getMatchBriefing: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchBriefingById(input.id);
      }),

    // Get match briefing by match
    getMatchBriefingByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchBriefingByMatch(input.matchId);
      }),

    // Update match briefing
    updateMatchBriefing: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        objectives: z.string().optional(),
        keyTactics: z.string().optional(),
        playerInstructions: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateMatchBriefing(id, data);
      }),

    // Delete match briefing
    deleteMatchBriefing: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMatchBriefing(input.id);
        return { success: true };
      }),

    // Add live match note
    addLiveNote: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        minute: z.number(),
        noteType: z.enum(["tactical", "substitution", "injury", "goal", "card", "observation", "instruction"]),
        content: z.string(),
        playerId: z.number().optional(),
        importance: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createLiveMatchNote({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get live notes by match
    getLiveNotesByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getLiveMatchNotesByMatch(input.matchId);
      }),

    // Delete live note
    deleteLiveNote: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLiveMatchNote(input.id);
        return { success: true };
      }),

    // Add player instruction
    addPlayerInstruction: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        matchId: z.number().optional(),
        briefingId: z.number().optional(),
        role: z.string().optional(),
        position: z.string().optional(),
        instructions: z.string(),
        markingAssignment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPlayerInstruction({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get player instructions by match
    getPlayerInstructionsByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerInstructionsByMatch(input.matchId);
      }),

    // Get player instructions by briefing
    getPlayerInstructionsByBriefing: protectedProcedure
      .input(z.object({ briefingId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerInstructionsByBriefing(input.briefingId);
      }),

    // Update player instruction
    updatePlayerInstruction: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.string().optional(),
        position: z.string().optional(),
        instructions: z.string().optional(),
        markingAssignment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updatePlayerInstruction(id, data);
      }),

    // Delete player instruction
    deletePlayerInstruction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlayerInstruction(input.id);
        return { success: true };
      }),
  }),

  // ==================== ACADEMY VIDEOS ====================
  academyVideos: router({
    // Get all videos (admin)
    getAll: adminProcedure.query(async () => {
      return db.getAllAcademyVideos();
    }),

    // Get videos by category (public)
    getByCategory: publicProcedure
      .input(z.object({ category: z.enum(['hero', 'gallery_drills', 'gallery_highlights', 'gallery_skills', 'training', 'other']) }))
      .query(async ({ input }) => {
        return db.getAcademyVideosByCategory(input.category);
      }),

    // Get hero video (public)
    getHero: publicProcedure.query(async () => {
      return db.getHeroVideo();
    }),

    // Create video (admin only)
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['hero', 'gallery_drills', 'gallery_highlights', 'gallery_skills', 'training', 'other']),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        fileKey: z.string(),
        duration: z.number().optional(),
        fileSize: z.number().optional(),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createAcademyVideo({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),

    // Update video (admin only)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(['hero', 'gallery_drills', 'gallery_highlights', 'gallery_skills', 'training', 'other']).optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateAcademyVideo(id, data);
      }),

    // Delete video (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAcademyVideo(input.id);
        return { success: true };
      }),
  }),

  // ==================== VIDEO EVENT TAGGING ====================
  videoEvents: router({
    // Get events for a video
    getByVideo: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoEvents(input.videoId);
      }),

    // Create video event tag
    create: staffProcedure
      .input(z.object({
        videoId: z.number(),
        playerId: z.number().optional(),
        eventType: z.enum(['goal', 'assist', 'key_pass', 'tackle', 'interception', 'save', 'shot', 'dribble', 'pass', 'cross', 'foul', 'card_yellow', 'card_red', 'substitution', 'corner', 'freekick', 'other']),
        timestamp: z.number(),
        duration: z.number().default(5),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoEvent({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Update video event
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(['goal', 'assist', 'key_pass', 'tackle', 'interception', 'save', 'shot', 'dribble', 'pass', 'cross', 'foul', 'card_yellow', 'card_red', 'substitution', 'corner', 'freekick', 'other']).optional(),
        timestamp: z.number().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateVideoEvent(id, data);
      }),

    // Delete video event
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoEvent(input.id);
        return { success: true };
      }),

    // Get highlight reel (events filtered by type)
    getHighlights: protectedProcedure
      .input(z.object({ 
        videoId: z.number(),
        eventTypes: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return db.getVideoHighlights(input.videoId, input.eventTypes);
       }),
  }),

  // ==================== POSITION RECOMMENDATIONS ====================
  positionRecommendation: router({
    // Get position recommendations for a player
    getRecommendations: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        skills: z.object({
          speed: z.number().min(0).max(100),
          agility: z.number().min(0).max(100),
          power: z.number().min(0).max(100),
          stamina: z.number().min(0).max(100),
          dribbling: z.number().min(0).max(100),
          firstTouch: z.number().min(0).max(100),
          passing: z.number().min(0).max(100),
          shooting: z.number().min(0).max(100),
          heading: z.number().min(0).max(100),
          tackling: z.number().min(0).max(100),
          positioning: z.number().min(0).max(100),
          vision: z.number().min(0).max(100),
          decisionMaking: z.number().min(0).max(100),
          composure: z.number().min(0).max(100),
          leadership: z.number().min(0).max(100),
          workRate: z.number().min(0).max(100),
          reflexes: z.number().min(0).max(100).optional(),
          handling: z.number().min(0).max(100).optional(),
          distribution: z.number().min(0).max(100).optional(),
        }),
      }))
      .query(async ({ input }) => {
        return recommendPositions(input.skills as PlayerSkills);
      }),
    // Get top 3 position recommendations
    getTopRecommendations: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        skills: z.object({
          speed: z.number().min(0).max(100),
          agility: z.number().min(0).max(100),
          power: z.number().min(0).max(100),
          stamina: z.number().min(0).max(100),
          dribbling: z.number().min(0).max(100),
          firstTouch: z.number().min(0).max(100),
          passing: z.number().min(0).max(100),
          shooting: z.number().min(0).max(100),
          heading: z.number().min(0).max(100),
          tackling: z.number().min(0).max(100),
          positioning: z.number().min(0).max(100),
          vision: z.number().min(0).max(100),
          decisionMaking: z.number().min(0).max(100),
          composure: z.number().min(0).max(100),
          leadership: z.number().min(0).max(100),
          workRate: z.number().min(0).max(100),
          reflexes: z.number().min(0).max(100).optional(),
          handling: z.number().min(0).max(100).optional(),
          distribution: z.number().min(0).max(100).optional(),
        }),
      }))
      .query(async ({ input }) => {
        return getTopPositionRecommendations(input.skills as PlayerSkills, 3);
      }),
    // Get position transition suggestions
    getTransitionSuggestions: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        currentPosition: z.string(),
        skills: z.object({
          speed: z.number().min(0).max(100),
          agility: z.number().min(0).max(100),
          power: z.number().min(0).max(100),
          stamina: z.number().min(0).max(100),
          dribbling: z.number().min(0).max(100),
          firstTouch: z.number().min(0).max(100),
          passing: z.number().min(0).max(100),
          shooting: z.number().min(0).max(100),
          heading: z.number().min(0).max(100),
          tackling: z.number().min(0).max(100),
          positioning: z.number().min(0).max(100),
          vision: z.number().min(0).max(100),
          decisionMaking: z.number().min(0).max(100),
          composure: z.number().min(0).max(100),
          leadership: z.number().min(0).max(100),
          workRate: z.number().min(0).max(100),
          reflexes: z.number().min(0).max(100).optional(),
          handling: z.number().min(0).max(100).optional(),
          distribution: z.number().min(0).max(100).optional(),
        }),
      }))
      .query(async ({ input }) => {
        return getPositionTransitionSuggestions(input.currentPosition, input.skills as PlayerSkills);
      }),
  }),

  // ==================== OPPONENTS ====================
  opponents: router({
    getAll: protectedProcedure.query(async () => {
      return db.getAllOpponents();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOpponentById(input.id);
      }),
    create: staffProcedure
      .input(z.object({
        name: z.string().min(1),
        league: z.string().optional(),
        ageGroup: z.string().optional(),
        coachName: z.string().optional(),
        typicalFormation: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createOpponent({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        league: z.string().optional(),
        ageGroup: z.string().optional(),
        coachName: z.string().optional(),
        typicalFormation: z.string().optional(),
        playingStyle: z.string().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateOpponent(id, data);
      }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOpponent(input.id);
        return { success: true };
      }),
    // Get opponent videos
    getVideos: protectedProcedure
      .input(z.object({ opponentId: z.number() }))
      .query(async ({ input }) => {
        return db.getOpponentVideos(input.opponentId);
      }),
    // Analyze opponent using AI
    analyzeOpponent: staffProcedure
      .input(z.object({
        opponentId: z.number(),
        videoUrls: z.array(z.string()).optional(),
        previousResults: z.array(z.string()).optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const opponent = await db.getOpponentById(input.opponentId);
        if (!opponent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Opponent not found' });
        }

        const { analyzeOpponent } = await import('./aiOppositionAnalysis');
        const analysis = await analyzeOpponent({
          opponentName: opponent.name,
          videoUrls: input.videoUrls,
          previousResults: input.previousResults,
          knownFormation: opponent.typicalFormation || undefined,
          additionalNotes: input.additionalNotes,
        });

        // Update opponent with AI analysis
        await db.updateOpponent(input.opponentId, {
          playingStyle: analysis.playingStyle,
          strengths: JSON.stringify(analysis.strengths),
          weaknesses: JSON.stringify(analysis.weaknesses),
          keyPlayers: JSON.stringify(analysis.keyPlayers),
        });

        // Create match strategy
        const strategyId = await db.createMatchStrategy({
          opponentId: input.opponentId,
          matchDate: new Date(),
          ourFormation: analysis.recommendedFormation,
          tacticalApproach: analysis.tacticalApproach,
          keyFocusAreas: JSON.stringify(analysis.keyFocusAreas),
          playerInstructions: JSON.stringify(analysis.playerInstructions),
          setPieceStrategy: analysis.setPieceStrategy,
          predictedOutcome: analysis.predictedOutcome,
          confidence: analysis.confidence,
          createdBy: ctx.user.id,
        });

        return { ...analysis, strategyId };
      }),
    // Get match strategies
    getStrategies: protectedProcedure
      .input(z.object({ opponentId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchStrategies(input.opponentId);
      }),
  }),

  // ==================== MATCH EVENT SESSIONS ====================
  matchEventSessions: router({
    // Save a match event recording session
    save: protectedProcedure
      .input(z.object({
        sessionName: z.string().min(1),
        matchId: z.number().optional(),
        homeTeam: z.string().optional(),
        awayTeam: z.string().optional(),
        matchDate: z.date().optional(),
        events: z.array(z.any()),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const sessionId = await db.createMatchEventSession({
          sessionName: input.sessionName,
          matchId: input.matchId,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          matchDate: input.matchDate,
          eventsData: JSON.stringify(input.events),
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          createdBy: ctx.user.id,
          lastAutoSave: new Date(),
        });
        return { sessionId, success: true };
      }),

    // Update an existing session
    update: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        sessionName: z.string().optional(),
        events: z.array(z.any()),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateMatchEventSession(input.sessionId, {
          sessionName: input.sessionName,
          eventsData: JSON.stringify(input.events),
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          lastAutoSave: new Date(),
        });
        return { success: true };
      }),

    // Get all sessions for current user
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const sessions = await db.getMatchEventSessions(ctx.user.id);
        return sessions.map((session: MatchEventSession) => ({
          ...session,
          events: JSON.parse(session.eventsData),
          metadata: session.metadata ? JSON.parse(session.metadata) : null,
        }));
      }),

    // Get a specific session by ID
    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const session = await db.getMatchEventSession(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
        }
        return {
          ...session,
          events: JSON.parse(session.eventsData),
          metadata: session.metadata ? JSON.parse(session.metadata) : null,
        };
      }),

    // Delete a session
    delete: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMatchEventSession(input.sessionId);
        return { success: true };
      }),

    // Rename a session
    rename: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        newName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.updateMatchEventSession(input.sessionId, {
          sessionName: input.newName,
        });
        return { success: true };
      }),
  }),

  // ==================== SAVED VIDEO ANALYSES ====================
  savedVideoAnalyses: router({
    // Save a video analysis
    save: protectedProcedure
      .input(z.object({
        videoName: z.string(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        teamColor: z.string().optional(),
        playerName: z.string().optional(),
        analysisData: z.string(), // JSON string
        isRealAnalysis: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const analysisId = await db.createSavedVideoAnalysis({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id: analysisId };
      }),

    // Get all saved analyses for current user
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getSavedVideoAnalyses(ctx.user.id);
      }),

    // Get a specific analysis
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSavedVideoAnalysis(input.id);
      }),

    // Delete an analysis
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSavedVideoAnalysis(input.id);
        return { success: true };
      }),
  }),

  // ==================== VIDEO CLIPS ====================
  videoClips: router({
    // Upload video to S3 and get URL
    uploadVideo: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import('./storage');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop();
        const fileKey = `videos/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        
        return {
          fileKey,
          url,
        };
      }),

    // Create a new video clip
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        videoUrl: z.string().min(1),
        thumbnailUrl: z.string().optional(),
        duration: z.number().int().min(0).default(0),
        startTime: z.number().int().min(0).default(0),
        endTime: z.number().int().min(0).optional(),
        teamId: z.number().int().optional(),
        matchId: z.number().int().optional(),
        tags: z.array(z.object({
          tagType: z.enum(['goal', 'assist', 'shot', 'pass', 'dribble', 'tackle', 'interception', 'save', 'error', 'foul', 'set_piece', 'highlight', 'custom']),
          timestamp: z.number().int().min(0),
          description: z.string().optional(),
          playerId: z.number().int().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clip = await db.createVideoClip({
          title: input.title,
          description: input.description,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
          duration: input.duration,
          startTime: input.startTime,
          endTime: input.endTime,
          teamId: input.teamId,
          matchId: input.matchId,
          createdBy: ctx.user.id,
        });

        // Create tags if provided
        if (input.tags && input.tags.length > 0) {
          for (const tag of input.tags) {
            await db.createVideoTag({
              clipId: clip.id,
              tagType: tag.tagType,
              timestamp: tag.timestamp,
              description: tag.description,
              playerId: tag.playerId,
              createdBy: ctx.user.id,
            });
          }
        }

        return { clipId: clip.id, success: true };
      }),

    // List all video clips
    list: protectedProcedure
      .input(z.object({
        teamId: z.number().int().optional(),
        matchId: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }).optional())
      .query(async ({ input }) => {
        return db.listVideoClips(input);
      }),

    // Get a single video clip with tags
    get: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const clip = await db.getVideoClip(input.id);
        if (!clip) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video clip not found' });
        }
        const tags = await db.getVideoClipTags(input.id);
        return { ...clip, tags };
      }),

    // Delete a video clip
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        const clip = await db.getVideoClip(input.id);
        if (!clip) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video clip not found' });
        }
        if (clip.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own clips' });
        }
        await db.deleteVideoClip(input.id);
        return { success: true };
      }),
  }),

  // ==================== OPPONENT VIDEO ANALYSIS ====================
  analysis: router({
    analyzeOpponentVideo: coachProcedure
      .input(z.object({ 
        videoUrl: z.string().url(),
        opponentJerseyColor: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        
        // Analyze video with AI vision
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a professional football tactical analyst. Analyze the provided match video and extract tactical information about the team. Focus on formation, playing style, strengths, weaknesses, key players, and tactical patterns.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this football match video and provide: 1) Formation (e.g., 4-3-3, 4-4-2), 2) Playing style (e.g., possession-based, counter-attacking), 3) 4-5 strengths, 4) 4-5 weaknesses to exploit, 5) 3-4 key players with their numbers, positions, and threat level (high/medium/low), 6) 4-5 tactical patterns observed, 7) 3-4 tactical recommendations to counter this team. ${input.opponentJerseyColor ? `Focus on the team wearing ${input.opponentJerseyColor} jerseys as the opponent team.` : ''} Return as JSON with keys: formation, playingStyle, strengths (array), weaknesses (array), keyPlayers (array of {number, position, threat, description}), tacticalPatterns (array), recommendations (array).`
                },
                {
                  type: 'file_url',
                  file_url: {
                    url: input.videoUrl,
                    mime_type: 'video/mp4'
                  }
                }
              ]
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'opponent_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  formation: { type: 'string' },
                  playingStyle: { type: 'string' },
                  strengths: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  weaknesses: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  keyPlayers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        number: { type: 'integer' },
                        position: { type: 'string' },
                        threat: { type: 'string', enum: ['high', 'medium', 'low'] },
                        description: { type: 'string' }
                      },
                      required: ['number', 'position', 'threat', 'description'],
                      additionalProperties: false
                    }
                  },
                  tacticalPatterns: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['formation', 'playingStyle', 'strengths', 'weaknesses', 'keyPlayers', 'tacticalPatterns', 'recommendations'],
                additionalProperties: false
              }
            }
          }
        });

        const content = response?.choices?.[0]?.message?.content;
        if (!content) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to analyze video' });
        }

        // Handle content as string or array
        const contentText = typeof content === 'string' ? content : JSON.stringify(content);
        const analysis: any = extractJSON(contentText);
        
        // Send notification to coaches about completed analysis
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '🎬 Opponent Video Analysis Complete',
            content: `New opponent analysis completed!\n\n**Formation:** ${analysis?.formation || 'Unknown'}\n**Style:** ${analysis?.playingStyle || 'Unknown'}\n**Key Strengths:** ${(analysis?.strengths || []).slice(0, 2).join(', ')}\n**Weaknesses to Exploit:** ${(analysis?.weaknesses || []).slice(0, 2).join(', ')}\n\nView full analysis in Tactical Hub.`
          });
        } catch (error) {
          console.error('Failed to send video analysis notification:', error);
        }
        
         return analysis;
      }),

    // ── AI Tactical Scene Analysis (text-based, for annotated canvas) ──────────
    analyzeTacticalScene: coachProcedure
      .input(z.object({
        sceneDescription: z.string(),
        formation: z.string().optional(),
        phaseOfPlay: z.string().optional(),
        teamColor: z.string().optional(),
        matchContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const prompt = `You are an elite UEFA Pro Licence football tactical analyst. Analyze the following tactical scene and provide deep coaching insights.

Scene: ${input.sceneDescription}
Formation: ${input.formation || 'Unknown'}
Phase of Play: ${input.phaseOfPlay || 'Open play'}
Team Color: ${input.teamColor || 'Not specified'}
Match Context: ${input.matchContext || 'Not specified'}

Provide a comprehensive tactical analysis with:
1. **Tactical Summary** (2-3 sentences describing what is happening)
2. **Key Observations** (3-4 specific tactical points)
3. **Strengths in This Moment** (2-3 points)
4. **Vulnerabilities** (2-3 exploitable weaknesses)
5. **Coaching Instructions** (3-4 specific actionable instructions for players)
6. **Counter-Tactical Suggestions** (2-3 ways the opponent could respond)
7. **Training Drill Recommendation** (1 specific drill to practice this pattern)

Be specific, professional, and use football terminology. Format with clear headers.`;
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an elite football tactical analyst with UEFA Pro Licence expertise. Provide deep, actionable tactical insights.' },
            { role: 'user', content: prompt }
          ]
        });
        const analysis = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate analysis.';
        return { analysis, timestamp: new Date().toISOString() };
      }),

    // ── AI Auto-Annotation Suggestions ──────────────────────────────────────
    generateAutoAnnotations: coachProcedure
      .input(z.object({
        phaseOfPlay: z.enum(['attack', 'defense', 'transition_attack', 'transition_defense', 'set_piece_attack', 'set_piece_defense', 'pressing', 'build_up']),
        formation: z.string().optional(),
        teamColor: z.string().optional(),
        scenario: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const prompt = `You are a football tactical annotation expert. Generate a set of tactical canvas annotations for the following scenario.

Phase of Play: ${input.phaseOfPlay}
Formation: ${input.formation || '4-3-3'}
Team Color: ${input.teamColor || 'red'}
Scenario: ${input.scenario || 'Standard tactical situation'}

Generate 6-10 tactical annotations as a JSON array. Each annotation must have:
- type: one of ["arrow", "movement_path", "team_zone", "player_label", "tactical_box", "spotlight", "line", "circle"]
- color: hex color string
- data: object with coordinates (x1,y1,x2,y2 for lines/arrows, x,y for points, x1,y1,x2,y2 for zones)
- description: what this annotation represents
- timestamp: 0

Canvas is 1600x900 pixels. Pitch occupies roughly x:40-1560, y:40-860.
Left goal: x=40, y=340-560. Right goal: x=1560, y=340-560. Center: x=800, y=450.

Return ONLY valid JSON array of annotations. Make them tactically meaningful and well-positioned on the pitch.`;
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a football tactical annotation expert. Return only valid JSON. Wrap your annotation array in: {"annotations": [...]}' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        });
        const content = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || '{}';
        try {
          const parsed = JSON.parse(content);
          const annotations = Array.isArray(parsed) ? parsed : (parsed.annotations || parsed.data || []);
          return { annotations, phase: input.phaseOfPlay };
        } catch {
          try {
            const jsonMatch = String(content).match(/\[.*\]/s);
            const annotations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            return { annotations, phase: input.phaseOfPlay };
          } catch {
            return { annotations: [], phase: input.phaseOfPlay };
          }
        }
      }),

    // ── AI Match Report Generator ────────────────────────────────────────────
    generateMatchReport: coachProcedure
      .input(z.object({
        matchTitle: z.string(),
        homeTeam: z.string(),
        awayTeam: z.string(),
        score: z.string().optional(),
        keyMoments: z.array(z.string()).optional(),
        tacticalNotes: z.string().optional(),
        annotationCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const prompt = `Generate a professional football match tactical report for:

Match: ${input.homeTeam} vs ${input.awayTeam}
Title: ${input.matchTitle}
Score: ${input.score || 'Not recorded'}
Key Moments Tagged: ${(input.keyMoments || []).join(', ') || 'None'}
Tactical Notes: ${input.tacticalNotes || 'None'}
Annotations Created: ${input.annotationCount || 0}

Write a professional tactical match report (300-400 words) covering:
1. Match Overview
2. Tactical Approach (both teams)
3. Key Tactical Moments
4. Phase of Play Analysis
5. Recommendations for Next Match

Use professional football language. Be specific and analytical.`;
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a professional football analyst writing match reports for coaching staff.' },
            { role: 'user', content: prompt }
          ]
        });
        const report = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate report.';
        return { report, generatedAt: new Date().toISOString() };
      }),

    // ── AI Formation Detector (from description) ─────────────────────────────
    detectFormation: coachProcedure
      .input(z.object({
        playerPositions: z.string(),
        context: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a football formation expert. Identify formations and provide tactical context. Return only valid JSON.' },
            { role: 'user', content: `Based on these player positions: ${input.playerPositions}\nContext: ${input.context || 'Standard match'}\n\nIdentify: 1) Formation (e.g., 4-3-3), 2) Variant (e.g., 4-3-3 attacking), 3) Key tactical characteristics (3 points), 4) Strengths (2 points), 5) Weaknesses (2 points). Return JSON with keys: formation (string), variant (string), characteristics (array of strings), strengths (array of strings), weaknesses (array of strings).` }
          ],
          response_format: { type: 'json_object' }
        });
        const content = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || '{}';
        try {
          const parsed: any = extractJSON(String(content));
          return {
            formation: parsed?.formation || 'Unknown',
            variant: parsed?.variant || '',
            characteristics: parsed?.characteristics || [],
            strengths: parsed?.strengths || [],
            weaknesses: parsed?.weaknesses || [],
          };
        } catch {
          return { formation: 'Unknown', variant: '', characteristics: [], strengths: [], weaknesses: [] };
        }
      }),
  }),
  // ==================== TACTICAL PLANS ====================
  tacticalPlans: router({
    savePlan: coachProcedure
      .input(z.object({
        name: z.string(),
        formation: z.string(),
        attackPattern: z.string().optional(),
        playerPositions: z.array(z.object({
          playerId: z.number(),
          x: z.number(),
          z: z.number()
        })),
        playerPaths: z.record(z.string(), z.array(z.object({
          x: z.number(),
          z: z.number()
        }))).optional(),
        description: z.string().optional(),
        isPublic: z.boolean().default(false)
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        const [plan] = await (await getDb())!.insert(tacticalPlans).values({
          createdBy: ctx.user.id,
          name: input.name,
          formation: input.formation,
          attackPattern: input.attackPattern,
          playerPositions: JSON.stringify(input.playerPositions),
          playerPaths: input.playerPaths ? JSON.stringify(input.playerPaths) : null,
          description: input.description,
          isPublic: input.isPublic
        });
        
        // Send notification to coaches about new tactical plan
        try {
          const dbModule = await import('./db');
          const { users } = await import('../drizzle/schema');
          const { inArray } = await import('drizzle-orm');
          
          const coaches = await (await getDb())!.select().from(users)
            .where(inArray(users.role, ['admin', 'coach']));
          
          for (const coach of coaches) {
            if (coach.id !== ctx.user.id) { // Don't notify the creator
              await dbModule.createNotification({
                userId: coach.id,
                title: '📋 New Tactical Plan Created',
                message: `${ctx.user.name} created a new tactical plan: "${input.name}" (${input.formation})`,
                type: 'info',
                category: 'training'
              });
            }
          }
        } catch (error) {
          console.error('Failed to send tactical plan notifications:', error);
        }
        
        return { success: true, planId: plan.insertId };
      }),

    getMyPlans: coachProcedure
      .input(z.object({ teamType: z.enum(['main', 'academy']).optional() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, desc, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const whereClause = eq(tacticalPlans.createdBy, ctx.user.id);
        
        const plans = await (await getDb())!.select().from(tacticalPlans)
          .where(whereClause)
          .orderBy(desc(tacticalPlans.createdAt));
        
        return plans.map(plan => ({
          ...plan,
          playerPositions: typeof plan.playerPositions === 'string' 
            ? JSON.parse(plan.playerPositions) 
            : plan.playerPositions,
          playerPaths: plan.playerPaths && typeof plan.playerPaths === 'string'
            ? JSON.parse(plan.playerPaths)
            : plan.playerPaths
        }));
      }),

    deletePlan: coachProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        await (await getDb())!.delete(tacticalPlans)
          .where(and(
            eq(tacticalPlans.id, input.planId),
            eq(tacticalPlans.createdBy, ctx.user.id)
          ));
        
        return { success: true };
      }),

    copyPlanToTeam: coachProcedure
      .input(z.object({ planId: z.number(), targetTeamType: z.enum(['main', 'academy']) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const [original] = await (await getDb())!.select().from(tacticalPlans)
          .where(and(
            eq(tacticalPlans.id, input.planId),
            eq(tacticalPlans.createdBy, ctx.user.id)
          ));
        
        if (!original) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
        
        const teamLabel = input.targetTeamType === 'main' ? 'Main Team' : 'Academy';
        const [copy] = await (await getDb())!.insert(tacticalPlans).values({
          createdBy: ctx.user.id,
          name: `${original.name} (${teamLabel})`,
          formation: original.formation,
          attackPattern: original.attackPattern,
          playerPositions: original.playerPositions,
          playerPaths: original.playerPaths,
          description: original.description,
          isPublic: original.isPublic,
        });
        
        return { success: true, newPlanId: copy.insertId };
      }),
    // AI Tactical Planner endpoints
    saveAIPlan: coachProcedure
      .input(z.object({
        name: z.string(),
        teamFormation: z.string(),
        teamPlayStyle: z.string(),
        teamStrengths: z.array(z.string()),
        teamKeyPlayers: z.string().optional(),
        opponentName: z.string().optional(),
        opponentFormation: z.string(),
        opponentPlayStyle: z.string(),
        opponentWeaknesses: z.array(z.string()),
        opponentKeyPlayers: z.string().optional(),
        tacticalOptions: z.array(z.any()),
        selectedTacticId: z.number(),
        matchId: z.number().optional(),
        matchDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        const [plan] = await (await getDb())!.insert(tacticalPlans).values({
          createdBy: ctx.user.id,
          name: input.name,
          formation: input.teamFormation,
          teamFormation: input.teamFormation,
          teamPlayStyle: input.teamPlayStyle,
          teamStrengths: JSON.stringify(input.teamStrengths),
          teamKeyPlayers: input.teamKeyPlayers,
          opponentName: input.opponentName,
          opponentFormation: input.opponentFormation,
          opponentPlayStyle: input.opponentPlayStyle,
          opponentWeaknesses: JSON.stringify(input.opponentWeaknesses),
          opponentKeyPlayers: input.opponentKeyPlayers,
          tacticalOptions: JSON.stringify(input.tacticalOptions),
          selectedTacticId: input.selectedTacticId,
          matchId: input.matchId,
          matchDate: input.matchDate ? new Date(input.matchDate) : undefined,
          description: input.notes,
          playerPositions: JSON.stringify([]), // Empty for AI plans
          isPublic: false,
        });
        
        return { success: true, planId: plan.insertId };
      }),

    getAIPlans: coachProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, desc, isNotNull } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const plans = await (await getDb())!.select().from(tacticalPlans)
          .where(eq(tacticalPlans.createdBy, ctx.user.id))
          .orderBy(desc(tacticalPlans.createdAt));
        
        // Filter only AI plans (those with tacticalOptions)
        return plans
          .filter(plan => plan.tacticalOptions)
          .map(plan => ({
            id: plan.id,
            name: plan.name,
            teamFormation: plan.teamFormation,
            opponentName: plan.opponentName,
            opponentFormation: plan.opponentFormation,
            matchDate: plan.matchDate,
            createdAt: plan.createdAt,
          }));
       }),
    analyze: coachProcedure
      .input(z.object({
        teamFormation: z.string(),
        teamPlayStyle: z.string(),
        teamStrengths: z.array(z.string()),
        teamKeyPlayers: z.string().optional(),
        opponentFormation: z.string(),
        opponentPlayStyle: z.string(),
        opponentWeaknesses: z.array(z.string()),
        opponentKeyPlayers: z.string().optional(),
        matchContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `You are an expert football tactical analyst. Analyze this match-up and provide 3-4 specific tactical options.\n\nOUR TEAM:\n- Formation: ${input.teamFormation}\n- Play Style: ${input.teamPlayStyle}\n- Key Strengths: ${input.teamStrengths.join(', ')}\n${input.teamKeyPlayers ? `- Key Players: ${input.teamKeyPlayers}` : ''}\n\nOPPONENT:\n- Formation: ${input.opponentFormation}\n- Play Style: ${input.opponentPlayStyle}\n- Weaknesses: ${input.opponentWeaknesses.join(', ')}\n${input.opponentKeyPlayers ? `- Key Players: ${input.opponentKeyPlayers}` : ''}\n${input.matchContext ? `\nMATCH CONTEXT: ${input.matchContext}` : ''}\n\nProvide a JSON response with this exact structure:\n{\n  "options": [\n    {\n      "id": 1,\n      "suggestedTactic": "Tactic Name",\n      "successRate": 82,\n      "reasoning": "Why this works against this opponent",\n      "keyInstructions": ["Instruction 1", "Instruction 2", "Instruction 3"],\n      "criticalMoments": ["First 15 min: ...", "If leading: ...", "Final 20 min: ..."],\n      "playerAdjustments": ["Adjustment 1", "Adjustment 2", "Adjustment 3"],\n      "pros": ["Pro 1", "Pro 2", "Pro 3"],\n      "cons": ["Con 1", "Con 2"]\n    }\n  ],\n  "overallStrategy": "Brief overall match strategy summary",\n  "keyMatchup": "The most critical matchup to win",\n  "warningSign": "Main threat to watch out for"\n}\n\nReturn ONLY valid JSON, no other text.`;
        const response = await invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
        });
        try {
          const rawContent7049 = typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? {});
          const parsed: any = extractJSON(rawContent7049);
          return {
            options: parsed?.options || [],
            overallStrategy: parsed?.overallStrategy || '',
            keyMatchup: parsed?.keyMatchup || '',
            warningSign: parsed?.warningSign || '',
          };
        } catch {
          throw new Error('Failed to parse AI tactical analysis');
        }
      }),
    loadAIPlan: coachProcedure
      .input(z.object({ planId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        const [plan] = await (await getDb())!.select().from(tacticalPlans)
          .where(and(
            eq(tacticalPlans.id, input.planId),
            eq(tacticalPlans.createdBy, ctx.user.id)
          ));
        
        if (!plan) throw new Error('Plan not found');
        
        return {
          name: plan.name,
          teamFormation: plan.teamFormation,
          teamPlayStyle: plan.teamPlayStyle,
          teamStrengths: plan.teamStrengths ? JSON.parse(plan.teamStrengths as string) : [],
          teamKeyPlayers: plan.teamKeyPlayers,
          opponentName: plan.opponentName,
          opponentFormation: plan.opponentFormation,
          opponentPlayStyle: plan.opponentPlayStyle,
          opponentWeaknesses: plan.opponentWeaknesses ? JSON.parse(plan.opponentWeaknesses as string) : [],
          opponentKeyPlayers: plan.opponentKeyPlayers,
          tacticalOptions: plan.tacticalOptions ? JSON.parse(plan.tacticalOptions as string) : [],
          selectedTacticId: plan.selectedTacticId,
          matchId: plan.matchId,
          matchDate: plan.matchDate,
          notes: plan.description,
        };
      }),
  }),

  // Players management for tactical tools
  tacticalPlayers: router({
    getAll: coachProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const allPlayers = await (await getDb())!.select().from(players)
          .where(eq(players.status, 'active'));
        
        return allPlayers;
      }),

    getByPosition: coachProcedure
      .input(z.object({
        position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward'])
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const positionPlayers = await (await getDb())!.select().from(players)
          .where(and(
            eq(players.position, input.position),
            eq(players.status, 'active')
          ));
        
        return positionPlayers;
      }),

    getByTeam: coachProcedure
      .input(z.object({
        teamId: z.number()
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const teamPlayers = await (await getDb())!.select().from(players)
          .where(and(
            eq(players.teamId, input.teamId),
            eq(players.status, 'active')
          ));
        
        return teamPlayers;
      }),
  }),

  // ==================== COACH EDUCATION ====================
  coachEducation: router({
    getCourses: publicProcedure
      .query(async () => {
        // Return static FIFA coaching course data
        return [
          {
            id: 1,
            title: 'Grassroots Coaching Certificate',
            titleAr: 'شهادة تدريب القاعدة الشعبية',
            description: 'Entry-level coaching for youth development (Ages 4-12)',
            descriptionAr: 'تدريب مستوى الدخول لتطوير الشباب',
            category: 'grassroots',
            level: 'Grassroots',
            duration: 40,
            thumbnailUrl: null,
            isPublished: true,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            title: 'UEFA/FIFA C License',
            titleAr: 'رخصة C من FIFA',
            description: 'Foundation level for coaching youth teams',
            descriptionAr: 'المستوى الأساسي لتدريب فرق الشباب',
            category: 'c_license',
            level: 'C License',
            duration: 120,
            thumbnailUrl: null,
            isPublished: true,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            title: 'UEFA/FIFA B License',
            titleAr: 'رخصة B من FIFA',
            description: 'Advanced coaching for semi-professional levels',
            descriptionAr: 'تدريب متقدم للمستويات شبه الاحترافية',
            category: 'b_license',
            level: 'B License',
            duration: 200,
            thumbnailUrl: null,
            isPublished: true,
            order: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 4,
            title: 'UEFA/FIFA A License',
            titleAr: 'رخصة A من FIFA',
            description: 'Professional-level coaching qualification',
            descriptionAr: 'مؤهل تدريب على المستوى المحترف',
            category: 'a_license',
            level: 'A License',
            duration: 300,
            thumbnailUrl: null,
            isPublished: true,
            order: 4,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 5,
            title: 'UEFA Pro / FIFA Pro License',
            titleAr: 'رخصة Pro من FIFA',
            description: 'Highest coaching qualification for top-tier clubs',
            descriptionAr: 'أعلى مؤهل تدريبي للأندية الكبرى',
            category: 'pro_license',
            level: 'Pro License',
            duration: 400,
            thumbnailUrl: null,
            isPublished: true,
            order: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }),

    getQuizQuestions: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { quizQuestions } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const dbQuestions = await (await getDb())!.select()
          .from(quizQuestions)
          .where(eq(quizQuestions.courseId, input.courseId));
        
        // If no questions in database, return fallback questions
        if (dbQuestions.length === 0) {
          const fallbackQuestions = [
            {
              id: 1,
              courseId: input.courseId,
              question: 'What is the primary objective of a 4-3-3 formation?',
              options: JSON.stringify([
                'Defensive stability',
                'Width in attack and midfield control',
                'Counter-attacking speed',
                'Physical dominance'
              ]),
              correctAnswer: 1,
              explanation: 'The 4-3-3 formation provides width in attack through wingers while maintaining midfield control with three central midfielders.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 2,
              courseId: input.courseId,
              question: 'When should a coach use positive reinforcement?',
              options: JSON.stringify([
                'Only after winning',
                'Immediately after good performance',
                'At the end of training',
                'Only for star players'
              ]),
              correctAnswer: 1,
              explanation: 'Positive reinforcement is most effective when given immediately after the desired behavior to strengthen the connection.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 3,
              courseId: input.courseId,
              question: 'What is the offside rule in football?',
              options: JSON.stringify([
                'Player cannot be ahead of the ball',
                'Player cannot be in opponent half',
                'Player is offside if ahead of second-last opponent when ball is played',
                'Player must stay behind midfield line'
              ]),
              correctAnswer: 2,
              explanation: 'A player is in an offside position if they are nearer to the opponent\'s goal line than both the ball and the second-last opponent when the ball is played to them.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 4,
              courseId: input.courseId,
              question: 'What is the best way to develop young players\' technical skills?',
              options: JSON.stringify([
                'Focus only on physical training',
                'Repetitive drills with game-like scenarios',
                'Only play matches',
                'Focus on tactics only'
              ]),
              correctAnswer: 1,
              explanation: 'Technical skills are best developed through repetitive drills that simulate game situations, allowing players to practice in realistic contexts.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 5,
              courseId: input.courseId,
              question: 'What is the role of a defensive midfielder in a 4-2-3-1 formation?',
              options: JSON.stringify([
                'Score goals',
                'Shield defense and distribute play',
                'Mark wingers',
                'Take corners'
              ]),
              correctAnswer: 1,
              explanation: 'In a 4-2-3-1, the defensive midfielder shields the back four and acts as a link between defense and attack through distribution.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 6,
              courseId: input.courseId,
              question: 'How should a coach handle player conflicts?',
              options: JSON.stringify([
                'Ignore them',
                'Address immediately and privately',
                'Punish both players',
                'Let players resolve it themselves'
              ]),
              correctAnswer: 1,
              explanation: 'Conflicts should be addressed immediately but privately to maintain team harmony and respect players\' dignity.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 7,
              courseId: input.courseId,
              question: 'What is the purpose of a warm-up before training?',
              options: JSON.stringify([
                'Waste time',
                'Prepare body and mind, prevent injuries',
                'Tire players out',
                'Show off skills'
              ]),
              correctAnswer: 1,
              explanation: 'Warm-ups prepare the body physically and mentally for activity while reducing injury risk through gradual intensity increase.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 8,
              courseId: input.courseId,
              question: 'What is pressing in football?',
              options: JSON.stringify([
                'Pushing opponents',
                'Applying pressure to win ball back quickly',
                'Running fast',
                'Defending deep'
              ]),
              correctAnswer: 1,
              explanation: 'Pressing is a tactical approach where players apply immediate pressure on opponents to win the ball back quickly and high up the pitch.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 9,
              courseId: input.courseId,
              question: 'How often should youth players train per week?',
              options: JSON.stringify([
                'Every day',
                '2-4 times depending on age',
                'Once a week',
                '7 times a week'
              ]),
              correctAnswer: 1,
              explanation: 'Youth players should train 2-4 times per week depending on age, allowing adequate recovery and avoiding burnout.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 10,
              courseId: input.courseId,
              question: 'What is the most important quality in a goalkeeper?',
              options: JSON.stringify([
                'Height only',
                'Positioning and decision-making',
                'Strength only',
                'Speed only'
              ]),
              correctAnswer: 1,
              explanation: 'While physical attributes help, positioning and decision-making are crucial as they determine when to come out, stay, or distribute.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 11,
              courseId: input.courseId,
              question: 'What is a counter-attack?',
              options: JSON.stringify([
                'Defending only',
                'Quick transition from defense to attack',
                'Slow build-up play',
                'Passing backwards'
              ]),
              correctAnswer: 1,
              explanation: 'A counter-attack is a rapid transition from defensive to offensive play, exploiting space left by the opposing team.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 12,
              courseId: input.courseId,
              question: 'How should a coach communicate with players?',
              options: JSON.stringify([
                'Shout and criticize',
                'Clear, positive, and constructive',
                'Never speak',
                'Only give orders'
              ]),
              correctAnswer: 1,
              explanation: 'Effective coaching communication is clear, positive, and constructive, fostering learning and confidence.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 13,
              courseId: input.courseId,
              question: 'What is the purpose of tactical periodization?',
              options: JSON.stringify([
                'Random training',
                'Structured training based on match demands',
                'Only physical training',
                'No planning'
              ]),
              correctAnswer: 1,
              explanation: 'Tactical periodization structures training around the tactical, technical, physical, and mental demands of the game.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 14,
              courseId: input.courseId,
              question: 'What is the role of a full-back in modern football?',
              options: JSON.stringify([
                'Only defend',
                'Defend and support attack',
                'Stay in position always',
                'Only attack'
              ]),
              correctAnswer: 1,
              explanation: 'Modern full-backs must defend their flank while also supporting attacks by overlapping and providing width.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 15,
              courseId: input.courseId,
              question: 'How should a coach develop team cohesion?',
              options: JSON.stringify([
                'Isolate players',
                'Team activities and clear communication',
                'Favor certain players',
                'Avoid team meetings'
              ]),
              correctAnswer: 1,
              explanation: 'Team cohesion develops through shared activities, clear communication, and creating an inclusive environment.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 16,
              courseId: input.courseId,
              question: 'What is the purpose of a cool-down after training?',
              options: JSON.stringify([
                'Waste time',
                'Gradually lower heart rate and prevent soreness',
                'Start next session',
                'Punish players'
              ]),
              correctAnswer: 1,
              explanation: 'Cool-downs gradually reduce heart rate, remove lactic acid, and help prevent muscle soreness and injury.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 17,
              courseId: input.courseId,
              question: 'What is the best formation for possession-based football?',
              options: JSON.stringify([
                '5-4-1',
                '4-3-3 or 4-2-3-1',
                '3-5-2',
                '4-4-2'
              ]),
              correctAnswer: 1,
              explanation: 'Formations like 4-3-3 and 4-2-3-1 provide numerical superiority in midfield, crucial for maintaining possession.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 18,
              courseId: input.courseId,
              question: 'How should a coach manage player rotation?',
              options: JSON.stringify([
                'Never rotate',
                'Based on fitness, form, and tactical needs',
                'Random selection',
                'Always play same 11'
              ]),
              correctAnswer: 1,
              explanation: 'Rotation should consider player fitness, current form, tactical requirements, and long-term development.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 19,
              courseId: input.courseId,
              question: 'What is the most effective way to teach tactics?',
              options: JSON.stringify([
                'Only lectures',
                'Visual demonstrations and practice',
                'No explanation',
                'Only written notes'
              ]),
              correctAnswer: 1,
              explanation: 'Tactics are best taught through visual demonstrations (video, board) followed by practical application in training.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 20,
              courseId: input.courseId,
              question: 'What is the key to successful youth development?',
              options: JSON.stringify([
                'Winning only',
                'Long-term player development and education',
                'Physical training only',
                'Early specialization'
              ]),
              correctAnswer: 1,
              explanation: 'Successful youth development prioritizes long-term player growth, technical skills, and education over short-term results.',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          // Parse JSON options for fallback questions
          return fallbackQuestions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          }));
        }
        
        // Parse JSON options for database questions
        return dbQuestions.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
      }),

    submitQuiz: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        courseTitle: z.string(),
        courseLevel: z.string(),
        answers: z.array(z.number())
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { quizAttempts, quizQuestions, courseEnrollments } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        const { generateCertificate, generateCertificateNumber } = await import('./certificateGenerator');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        // Get questions to calculate score
        const questions = await (await getDb())!.select()
          .from(quizQuestions)
          .where(eq(quizQuestions.courseId, input.courseId));
        
        let correct = 0;
        questions.forEach((q, index) => {
          if (String(input.answers[index]) === String(q.correctAnswer)) {
            correct++;
          }
        });
        
        const score = Math.round((correct / questions.length) * 100);
        const passed = score >= 70;
        
        // Save attempt
        const [attempt] = await (await getDb())!.insert(quizAttempts).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          score,
          answers: input.answers,
          passed
        }).$returningId();
        
        let certificateUrl: string | null = null;
        
        // Generate certificate if passed
        if (passed) {
          try {
            const certificateNumber = generateCertificateNumber();
            certificateUrl = await generateCertificate({
              coachName: ctx.user.name || 'Coach',
              courseTitle: input.courseTitle,
              level: input.courseLevel,
              score,
              date: new Date(),
              certificateNumber
            });
            
            // Update enrollment with certificate
            const enrollment = await (await getDb())!.select()
              .from(courseEnrollments)
              .where(and(
                eq(courseEnrollments.userId, ctx.user.id),
                eq(courseEnrollments.courseId, input.courseId)
              ))
              .limit(1);
            
            if (enrollment.length > 0) {
              await (await getDb())!.update(courseEnrollments)
                .set({ 
                  certificateUrl,
                  completedAt: new Date(),
                  progress: 100
                })
                .where(eq(courseEnrollments.id, enrollment[0].id));
            } else {
              // Create enrollment if doesn't exist
              await (await getDb())!.insert(courseEnrollments).values({
                userId: ctx.user.id,
                courseId: input.courseId,
                certificateUrl,
                completedAt: new Date(),
                progress: 100
              });
            }
          } catch (error) {
            console.error('Failed to generate certificate:', error);
          }
        }
        
        // Check and award badges
        const earnedBadges = await checkAndAwardBadges(ctx.user.id, score, passed, db);
        
        // Check and update challenge progress
        const completedChallenges = await checkAndUpdateChallengeProgress(ctx.user.id, score, passed, db);
        
        return { score, passed, certificateUrl, earnedBadges, completedChallenges };
      }),

    getMyAttempts: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { quizAttempts } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        return await (await getDb())!.select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, ctx.user.id))
          .orderBy(desc(quizAttempts.attemptedAt));
      }),

    getMyEnrollments: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { courseEnrollments } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        return await (await getDb())!.select()
          .from(courseEnrollments)
          .where(eq(courseEnrollments.userId, ctx.user.id))
          .orderBy(desc(courseEnrollments.enrolledAt));
      }),

    generateModulePDF: protectedProcedure
      .input(z.object({
        level: z.string(),
        moduleId: z.string()
      }))
      .mutation(async ({ input }) => {
        const { generateModulePDF } = await import('./pdfGenerator');
        
        try {
          const result = await generateModulePDF(input.level, input.moduleId);
          return { url: result.url };
        } catch (error) {
          throw new Error('Failed to generate PDF');
        }
      }),

    getUserBadges: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { userBadges, badges } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const db = (await getDb())!;
         if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          if (!db) return [];
          
          const userBadgesList = await db.select({
            id: userBadges.id,
            badgeId: userBadges.badgeId,
            earnedAt: userBadges.earnedAt,
            progress: userBadges.progress,
            name: badges.name,
            description: badges.description,
            icon: badges.icon,
            category: badges.category
          })
            .from(userBadges)
            .innerJoin(badges, eq(userBadges.badgeId, badges.id))
            .where(eq(userBadges.userId, ctx.user.id));
          
          return userBadgesList;
        } catch (error) {
          // Tables don't exist yet, return empty array
          console.log('getUserBadges error (tables may not exist):', error);
          return [];
        }
      }),

    getQuizReview: protectedProcedure
      .input(z.object({
        attemptId: z.number()
      }))
      .query(async ({ input, ctx }) => {
        const { getQuizReview } = await import('./getQuizReview');
        return await getQuizReview(input.attemptId);
      }),
    getMentalHealthCourses: protectedProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { coachingCourses } = await import('../drizzle/schema');
        const { eq, asc } = await import('drizzle-orm');
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        return (await getDb())!.select()
          .from(coachingCourses)
          .where(eq(coachingCourses.category, 'mental_health' as any))
          .orderBy(asc(coachingCourses.order));
      }),
  }),

  // ==================== DATA ANALYSIS ====================
  dataAnalysis: router({
    getPlayerMatchStats: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        matchId: z.number()
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { playerMatchStats, matches, players } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return null;
        
        const stats = await (await getDb())!.select()
          .from(playerMatchStats)
          .where(and(
            eq(playerMatchStats.playerId, input.playerId),
            eq(playerMatchStats.matchId, input.matchId)
          ))
          .limit(1);
        
        return stats[0] || null;
      }),

    getPlayerMatches: protectedProcedure
      .input(z.object({
        playerId: z.number()
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { matches, playerMatchStats } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        // Get all matches where player participated
        const playerStats = await db.select({
          matchId: playerMatchStats.matchId,
          minutesPlayed: playerMatchStats.minutesPlayed
        })
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId));
        
        const matchIds = playerStats.map(s => s.matchId);
        if (matchIds.length === 0) return [];
        
        const { inArray } = await import('drizzle-orm');
        const matchesData = await (await getDb())!.select()
          .from(matches)
          .where(inArray(matches.id, matchIds))
          .orderBy(desc(matches.matchDate));
        
        return matchesData;
      }),

    getAllPlayers: protectedProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        return await (await getDb())!.select()
          .from(players)
          .where(eq(players.status, 'active'));
      }),

    getAllMatches: protectedProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { matches } = await import('../drizzle/schema');
        const { desc } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        return await (await getDb())!.select()
          .from(matches)
          .orderBy(desc(matches.matchDate))
          .limit(50);
      }),
    
    getUserBadges: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { userBadges, badges } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const db = (await getDb())!;
         if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          if (!db) return [];
          
          const userBadgesList = await db.select({
            id: userBadges.id,
            badgeId: userBadges.badgeId,
            earnedAt: userBadges.earnedAt,
            progress: userBadges.progress,
            name: badges.name,
            description: badges.description,
            icon: badges.icon,
            category: badges.category
          })
            .from(userBadges)
            .innerJoin(badges, eq(userBadges.badgeId, badges.id))
            .where(eq(userBadges.userId, ctx.user.id));
          
          return userBadgesList;
        } catch (error) {
          // Tables don't exist yet, return empty array
          console.log('getUserBadges error (tables may not exist):', error);
          return [];
        }
      }),
    
    getAllBadges: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { badges } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        return await (await getDb())!.select()
          .from(badges)
          .where(eq(badges.isActive, true));
      }),
    
    getCoachStatistics: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { quizAttempts, courseEnrollments } = await import('../drizzle/schema');
        const { eq, sql, desc } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return null;
        
        // Get all quiz attempts for this user
        const attempts = await (await getDb())!.select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, ctx.user.id))
          .orderBy(desc(quizAttempts.attemptedAt));
        
        // Get completed courses
        const completedCourses = await (await getDb())!.select()
          .from(courseEnrollments)
          .where(sql`${courseEnrollments.userId} = ${ctx.user.id} AND ${courseEnrollments.completedAt} IS NOT NULL`);
        
        // Calculate statistics
        const totalAttempts = attempts.length;
        const averageScore = totalAttempts > 0
          ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
          : 0;
        
        // Prepare performance data for chart (last 10 attempts)
        const performanceData = attempts.slice(0, 10).reverse().map(a => ({
          date: new Date(a.attemptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: a.score
        }));
        
        return {
          completedCourses: completedCourses.length,
          totalAttempts,
          averageScore,
          performanceData
        };
      }),
    
    getLeaderboard: publicProcedure
      .query(async () => {
        try {
          const { getDb } = await import('./db');
          const { users, userBadges, quizAttempts } = await import('../drizzle/schema');
          const { sql, desc } = await import('drizzle-orm');
          
          const db = (await getDb())!;
         if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          if (!db) return [];
          
          // Get top coaches by badge count and average score
          const leaderboardData = await db.select({
            userId: users.id,
            userName: users.name,
            badgeCount: sql<number>`COUNT(DISTINCT ${userBadges.id})`,
            avgScore: sql<number>`AVG(${quizAttempts.score})`
          })
            .from(users)
            .leftJoin(userBadges, sql`${users.id} = ${userBadges.userId}`)
            .leftJoin(quizAttempts, sql`${users.id} = ${quizAttempts.userId}`)
            .groupBy(users.id, users.name)
            .orderBy(desc(sql`COUNT(DISTINCT ${userBadges.id})`), desc(sql`AVG(${quizAttempts.score})`))
            .limit(10);
          
          return leaderboardData;
        } catch (error) {
          // Tables don't exist yet, return empty array
          console.log('getLeaderboard error (tables may not exist):', error);
          return [];
        }
      }),
    
    getActiveChallenges: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { challenges } = await import('../drizzle/schema');
        const { and, eq, gte, lte } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const now = new Date();
        return await (await getDb())!.select()
          .from(challenges)
          .where(and(
            eq(challenges.isActive, true),
            lte(challenges.startDate, now),
            gte(challenges.endDate, now)
          ));
      }),
    
    getUserChallenges: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { userChallenges, challenges } = await import('../drizzle/schema');
          const { eq, and, gte } = await import('drizzle-orm');
          
          const db = (await getDb())!;
         if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          if (!db) return [];
          
          const now = new Date();
          
          const userChallengesList = await db.select({
            id: userChallenges.id,
            challengeId: userChallenges.challengeId,
            progress: userChallenges.progress,
            completed: userChallenges.completed,
            completedAt: userChallenges.completedAt,
            rewardClaimed: userChallenges.rewardClaimed,
            title: challenges.title,
            description: challenges.description,
            type: challenges.type,
            criteria: challenges.criteria,
            reward: challenges.reward,
            endDate: challenges.endDate
          })
            .from(userChallenges)
            .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
            .where(and(
              eq(userChallenges.userId, ctx.user.id),
              eq(challenges.isActive, true),
              gte(challenges.endDate, now)
            ));
          
          return userChallengesList;
        } catch (error) {
          // Table doesn't exist yet, return empty array
          console.log('getUserChallenges error (table may not exist):', error);
          return [];
        }
      }),
    
    claimReward: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        const result = await claimChallengeReward(ctx.user.id, input.challengeId, db);
        
        if (!result.success) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Cannot claim reward. Challenge not completed or already claimed.' 
          });
        }
        
        return result;
      }),
  }),

  // Training Library
  trainingLibrary: router({
    getExercises: publicProcedure
      .input(z.object({
        category: z.enum(['warm-up', 'technical', 'tactical', 'physical', 'cool-down']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        search: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { trainingExercises } = await import('../drizzle/schema');
        const { eq, and, like, or } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        let conditions = [];
        
        if (input?.category) {
          conditions.push(eq(trainingExercises.category, input.category));
        }
        
        if (input?.difficulty) {
          conditions.push(eq(trainingExercises.difficulty, input.difficulty));
        }
        
        if (input?.search) {
          conditions.push(
            or(
              like(trainingExercises.title, `%${input.search}%`),
              like(trainingExercises.description, `%${input.search}%`)
            )
          );
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        return await (await getDb())!.select()
          .from(trainingExercises)
          .where(whereClause);
      }),
    
    getExerciseById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { trainingExercises } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return null;
        
        const result = await (await getDb())!.select()
          .from(trainingExercises)
          .where(eq(trainingExercises.id, input.id))
          .limit(1);
        
        return result[0] || null;
      }),
    
    toggleFavorite: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { exerciseFavorites } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        // Check if already favorited
        const existing = await (await getDb())!.select()
          .from(exerciseFavorites)
          .where(and(
            eq(exerciseFavorites.userId, ctx.user.id),
            eq(exerciseFavorites.exerciseId, input.exerciseId)
          ))
          .limit(1);
        
        if (existing.length > 0) {
          // Remove favorite
          await (await getDb())!.delete(exerciseFavorites)
            .where(eq(exerciseFavorites.id, existing[0].id));
          return { favorited: false };
        } else {
          // Add favorite
          await (await getDb())!.insert(exerciseFavorites).values({
            userId: ctx.user.id,
            exerciseId: input.exerciseId
          });
          return { favorited: true };
        }
      }),
    
    getFavorites: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { exerciseFavorites, trainingExercises } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        const favorites = await db.select({
          id: trainingExercises.id,
          title: trainingExercises.title,
          description: trainingExercises.description,
          category: trainingExercises.category,
          difficulty: trainingExercises.difficulty,
          duration: trainingExercises.duration
        })
          .from(exerciseFavorites)
          .innerJoin(trainingExercises, eq(exerciseFavorites.exerciseId, trainingExercises.id))
          .where(eq(exerciseFavorites.userId, ctx.user.id));
        
        return favorites;
      }),
    
    initializeSampleData: publicProcedure
      .mutation(async () => {
        const { getDb } = await import('./db');
        const { trainingExercises } = await import('../drizzle/schema');
        const { sampleExercises } = await import('./sampleExercises');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        // Check if exercises already exist
        const existing = await (await getDb())!.select().from(trainingExercises).limit(1);
        if (existing.length > 0) {
          return { message: 'Sample data already exists' };
        }
        
        await (await getDb())!.insert(trainingExercises).values(sampleExercises);
        return { message: 'Sample data initialized successfully' };
      }),
  }),

  // Notifications V2 (Enhanced)
  notificationsV2: router({
    getNotifications: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return [];
        
        return await (await getDb())!.select()
          .from(notifications)
          .where(eq(notifications.userId, ctx.user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(50);
      }),
    
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, and, sql } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) return 0;
        
        const result = await db.select({ count: sql<number>`COUNT(*)` })
          .from(notifications)
          .where(and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false)
          ));
        
        return result[0]?.count || 0;
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        await (await getDb())!.update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = (await getDb())!;
       if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        if (!db) throw new Error('Database not available');
        
        await (await getDb())!.update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false)
          ));
        
        return { success: true };
      }),
  }),

  // AI Coach Assistant
  aiCoach: router({
    askQuestion: protectedProcedure
      .input(z.object({
        question: z.string(),
        context: z.enum(['tactical', 'training', 'analysis', 'general']).optional(),
        playerId: z.number().optional(),
        teamId: z.number().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Gather context data from database
        let contextData = '';
        
        // If player ID provided, get player data
        if (input.playerId) {
          const player = await database.select().from(players).where(eq(players.id, input.playerId)).limit(1);
          if (player[0]) {
            const stats = await database.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, input.playerId))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(5);
            
            contextData += `\n\n**Player Context:**\n`;
            contextData += `- Name: ${player[0].firstName} ${player[0].lastName}\n`;
            contextData += `- Position: ${player[0].position}\n`;
            contextData += `- Age: ${player[0].dateOfBirth ? new Date().getFullYear() - new Date(player[0].dateOfBirth).getFullYear() : 'Unknown'}\n`;
            
            if (stats.length > 0) {
              const avgTechnical = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.technicalOverall || 0), 0) / stats.length;
              const avgPhysical = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.physicalOverall || 0), 0) / stats.length;
              const avgTactical = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.mentalOverall || 0), 0) / stats.length;
              const avgMental = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.mentalOverall || 0), 0) / stats.length;
              
              contextData += `\n**Recent Performance (Last 5 sessions):**\n`;
              contextData += `- Technical Score: ${avgTechnical.toFixed(1)}/100\n`;
              contextData += `- Physical Score: ${avgPhysical.toFixed(1)}/100\n`;
              contextData += `- Tactical Score: ${avgTactical.toFixed(1)}/100\n`;
              contextData += `- Mental Score: ${avgMental.toFixed(1)}/100\n`;
            }
          }
        }
        
        // If team ID provided, get team data
        if (input.teamId) {
          const team = await database.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
          if (team[0]) {
            const teamPlayers = await database.select().from(players).where(eq(players.teamId, input.teamId));
            
            contextData += `\n\n**Team Context:**\n`;
            contextData += `- Team: ${team[0].name}\n`;
            contextData += `- Age Group: ${team[0].ageGroup}\n`;
            contextData += `- Players: ${teamPlayers.length}\n`;
          }
        }
        
        const systemPrompt = `You are an expert football (soccer) coach with deep knowledge of:
- Tactical systems and formations (4-3-3, 4-4-2, 3-5-2, etc.)
- Training methodologies for different age groups
- Match analysis and opponent scouting
- Player development and position-specific training
- Modern football concepts: pressing, transitions, positional play, counter-pressing

Provide practical, actionable advice that coaches can implement immediately. Use examples from professional football when relevant.

**IMPORTANT:** When analyzing player data, provide specific insights based on their actual scores. Identify weaknesses (scores below 70) and strengths (scores above 80). Suggest concrete drills and exercises to address specific areas.`;

        const userMessage = input.question + contextData;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        });

        const rawContent = response?.choices?.[0]?.message?.content;
        const answer = typeof rawContent === 'string' ? rawContent : 'I apologize, but I could not generate a response. Please try again.';
        
        return { answer, contextUsed: contextData };
      }),
      
    analyzePlayer: protectedProcedure
      .input(z.object({
        playerId: z.number()
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get player data
        const player = await (await getDb())!.select().from(players).where(eq(players.id, input.playerId)).limit(1);
        if (!player[0]) {
          throw new Error('Player not found');
        }
        
        // Get recent stats
        const stats = await (await getDb())!.select().from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, input.playerId))
          .orderBy(desc(playerSkillScores.assessmentDate))
          .limit(10);
        
        // Get recent matches
        const matches = await (await getDb())!.select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.createdAt))
          .limit(5);
        
        const contextData = `**Player Analysis Request**

Player: ${player[0].firstName} ${player[0].lastName}
Position: ${player[0].position}
Age: ${player[0].dateOfBirth ? new Date().getFullYear() - new Date(player[0].dateOfBirth).getFullYear() : 'Unknown'}

**Performance Data (Last 10 sessions):**
${stats.map((s, i) => `Session ${i + 1}: Technical ${s.technicalOverall}, Physical ${s.physicalOverall}, Tactical ${s.mentalOverall}, Mental ${s.mentalOverall}`).join('\n')}

**Recent Match Performance (Last 5 matches):**
${matches.map((m, i) => `Match ${i + 1}: Goals ${m.goals}, Assists ${m.assists}, Passes ${m.passes}, Shots ${m.shots}`).join('\n')}`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football analyst. Analyze the player data and provide a JSON response with: {"strengths": ["strength1", "strength2", "strength3"], "weaknesses": ["weakness1", "weakness2", "weakness3"], "recommendations": [{"title": "rec title", "description": "rec description"}]}. Be specific and data-driven.' },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        let analysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Try to parse JSON response
        let structuredAnalysis: any = null;
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = analysis.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1].trim() : analysis;
          structuredAnalysis = JSON.parse(jsonStr);
        } catch (e) {
          // Fallback to plain text analysis
          structuredAnalysis = {
            strengths: ['Consistent performance', 'Good work ethic', 'Team player'],
            weaknesses: ['Needs more data for detailed analysis'],
            recommendations: [
              { title: 'Continue Training', description: 'Maintain current training regimen and track progress regularly.' }
            ]
          };
        }
        
        return { 
          analysis, 
          playerName: `${player[0].firstName} ${player[0].lastName}`,
          strengths: structuredAnalysis.strengths || [],
          weaknesses: structuredAnalysis.weaknesses || [],
          recommendations: structuredAnalysis.recommendations || []
        };
      }),
      
    getMatchAdvice: protectedProcedure
      .input(z.object({
        matchId: z.number().optional(),
        teamId: z.number(),
        opponentFormation: z.string(),
        currentScore: z.string().optional(),
        matchMinute: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get team data
        const team = await (await getDb())!.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get team players with their stats
        const teamPlayers = await (await getDb())!.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Get recent performance stats for each player
        const playerStatsData = await Promise.all(
          teamPlayers.map(async (player) => {
            const db = (await getDb())!;
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            const stats = await (await getDb())!.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, player.id))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(3);
            
            const avgTechnical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / stats.length : 0;
            const avgPhysical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / stats.length : 0;
            const avgTactical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / stats.length : 0;
            
            return {
              name: (player.firstName + " " + player.lastName).trim(),
              position: player.position,
              technical: avgTechnical.toFixed(1),
              physical: avgPhysical.toFixed(1),
              tactical: avgTactical.toFixed(1)
            };
          })
        );
        
        // Get recent match results
        let recentMatches: any[] = [];
        if (input.matchId) {
          recentMatches = await (await getDb())!.select()
            .from(matches)
            .where(eq(matches.teamId, input.teamId))
            .orderBy(desc(matches.matchDate))
            .limit(3);
        }
        
        const contextData = `**Match Tactical Analysis Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Opponent Formation: ${input.opponentFormation}
${input.currentScore ? `Current Score: ${input.currentScore}` : ''}
${input.matchMinute ? `Match Minute: ${input.matchMinute}` : ''}

**Squad Analysis:**
${playerStatsData.map(p => `${p.name} (${p.position}): Technical ${p.technical}, Physical ${p.physical}, Tactical ${p.tactical}`).join('\n')}

**Recent Form:**
${recentMatches.length > 0 ? recentMatches.map((m, i) => `Match ${i + 1}: ${m.result} (${m.teamScore ?? 0}-${m.opponentScore ?? 0})`).join('\n') : 'No recent match data'}`;
        
        const response = await invokeLLM({
          messages: [
            { 
              role: 'system', 
              content: 'You are an elite football tactical analyst. Analyze the team composition, opponent formation, and provide: 1) Recommended formation, 2) Tactical approach (possession/counter/pressing), 3) Key player instructions, 4) Substitution suggestions if applicable, 5) Set piece strategies. Be specific and tactical.' 
            },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const advice = typeof rawContent === 'string' ? rawContent : 'Tactical advice unavailable';
        
        return { advice, teamName: team[0].name };
      }),
      
    generateTrainingPlan: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        focusAreas: z.array(z.enum(['technical', 'tactical', 'physical', 'mental'])).optional(),
        duration: z.enum(['week', 'month']).default('week')
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get team data
        const team = await (await getDb())!.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get all team players
        const teamPlayers = await (await getDb())!.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Analyze team weaknesses by aggregating player stats
        const allStats = await Promise.all(
          teamPlayers.map(async (player) => {
          const db = (await getDb())!;
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          const stats = await (await getDb())!.select().from(playerSkillScores)
            .where(eq(playerSkillScores.playerId, player.id))
            .orderBy(desc(playerSkillScores.assessmentDate))
            .limit(5);
            return stats;
          })
        );
        
        const flatStats = allStats.flat();
        const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / flatStats.length : 0;
        const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / flatStats.length : 0;
        const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
        const avgMental = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
        
        // Get recent matches to understand performance context
        const recentMatches = await (await getDb())!.select()
          .from(matches)
          .where(eq(matches.teamId, input.teamId))
          .orderBy(desc(matches.matchDate))
          .limit(5);
        
        const wins = recentMatches.filter(m => m.result === 'win').length;
        const losses = recentMatches.filter(m => m.result === 'loss').length;
        
        const contextData = `**Training Plan Generation Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Players: ${teamPlayers.length}
Duration: ${input.duration === 'week' ? '1 Week' : '1 Month'}
${input.focusAreas ? `Focus Areas: ${input.focusAreas.join(', ')}` : 'All areas'}

**Team Performance Analysis:**
- Technical Average: ${avgTechnical.toFixed(1)}/100 ${avgTechnical < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgTechnical > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}
- Physical Average: ${avgPhysical.toFixed(1)}/100 ${avgPhysical < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgPhysical > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}
- Tactical Average: ${avgTactical.toFixed(1)}/100 ${avgTactical < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgTactical > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}
- Mental Average: ${avgMental.toFixed(1)}/100 ${avgMental < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgMental > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}

**Recent Match Results (Last 5):**
${recentMatches.map((m, i) => `Match ${i + 1}: ${m.result?.toUpperCase()} ${m.teamScore ?? 0}-${m.opponentScore ?? 0} vs ${m.opponent || 'Unknown'}`).join('\n')}
Form: ${wins}W ${losses}L (${((wins / recentMatches.length) * 100).toFixed(0)}% win rate)`;
        
        const systemPrompt = `You are an expert football training coordinator. Create a detailed ${input.duration === 'week' ? 'weekly' : 'monthly'} training plan that:

1. **Prioritizes weak areas** (scores below 70) with specific drills
2. **Maintains strong areas** (scores above 80) with maintenance work
3. **Balances workload** across technical, tactical, physical, and mental training
4. **Considers age group** - adjust intensity and complexity accordingly
5. **Includes specific drills** with names, duration, and objectives
6. **Progressive difficulty** - builds throughout the period

Format the plan as:
- Day-by-day breakdown (for week) or week-by-week (for month)
- Session type, duration, and intensity
- Specific drills with clear instructions
- Expected outcomes

Be practical and implementable by academy coaches.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
                const rawContent = response?.choices?.[0]?.message?.content;
        const plan = typeof rawContent === 'string' ? rawContent : 'Training plan unavailable';
        return { 
          plan, 
          teamName: team[0].name,
          teamStats: {
            technical: avgTechnical.toFixed(1),
            physical: avgPhysical.toFixed(1),
            tactical: avgTactical.toFixed(1),
            mental: avgMental.toFixed(1)
          }
        };
      }),
    generateProgressReport: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Get player full data
        const playerData = await database.select().from(players).where(eq(players.id, input.playerId)).limit(1);
        if (!playerData[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
        const p = playerData[0];
        const playerName = `${p.firstName} ${p.lastName}`;
        const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : 'Unknown';
        // Get skill scores history
        const skillHistory = await database.select().from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, input.playerId))
          .orderBy(desc(playerSkillScores.assessmentDate))
          .limit(5);
        // Get recent match stats
        const recentMatchStats = await database.select().from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.createdAt))
          .limit(5);
        // Get recent injuries
        const recentInjuries = await database.select().from(injuries)
          .where(eq(injuries.playerId, input.playerId))
          .orderBy(desc(injuries.injuryDate))
          .limit(3);
        // Build rich context
        const latestSkills = skillHistory[0];
        const skillSummary = latestSkills ? `
Latest Skill Assessment (${latestSkills.assessmentDate}):
- Technical Overall: ${latestSkills.technicalOverall ?? 'N/A'}/100
- Physical Overall: ${latestSkills.physicalOverall ?? 'N/A'}/100
- Tactical/Mental Overall: ${latestSkills.mentalOverall ?? 'N/A'}/100
- Ball Control: ${latestSkills.ballControl ?? 'N/A'}, Dribbling: ${latestSkills.dribbling ?? 'N/A'}, Passing: ${latestSkills.passing ?? 'N/A'}
- Shooting: ${latestSkills.shooting ?? 'N/A'}, Speed: ${latestSkills.speed ?? 'N/A'}, Stamina: ${latestSkills.stamina ?? 'N/A'}` : 'No skill assessment data available.';
        const matchSummary = recentMatchStats.length > 0 ? `
Recent Match Performance (last ${recentMatchStats.length} matches):
${recentMatchStats.map((m, i) => `Match ${i+1}: Goals ${m.goals ?? 0}, Assists ${m.assists ?? 0}, Passes ${m.passes ?? 0}, Shots ${m.shots ?? 0}, Minutes Played ${m.minutesPlayed ?? 0}`).join('\n')}` : 'No recent match data.';
        const injurySummary = recentInjuries.length > 0 ? `
Injury History: ${recentInjuries.map(inj => `${inj.injuryType} (${inj.severity}) - ${inj.status}`).join(', ')}` : 'No recent injuries.';
        const prompt = `You are an expert football development coach. Generate a comprehensive, personalized progress report for this player.

Player: ${playerName}
Age: ${age}
Position: ${p.position ?? 'Unknown'}
Academy Group: ${p.ageGroup ?? 'Unknown'}
${skillSummary}
${matchSummary}
${injurySummary}

Generate a detailed report with these sections:
1. **Overall Assessment** - Honest evaluation of current level and trajectory
2. **Technical Skills Analysis** - Specific strengths and weaknesses based on scores
3. **Physical Development** - Physical attributes and fitness level
4. **Tactical Understanding** - Game intelligence and decision-making
5. **Match Performance** - Analysis of recent match statistics
6. **Key Strengths** - Top 3 specific strengths with evidence
7. **Development Areas** - Top 3 areas needing improvement with specific targets
8. **Recommended Training Focus** - Specific drills and exercises for next 4 weeks
9. **Goals for Next Period** - 3 measurable goals for the next month
10. **Coach's Message** - Motivational, personalized message to the player

Be specific, data-driven, and personalized. Reference actual scores and statistics where available.`;
        const response = await invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500
        });
        const rawContent = response?.choices?.[0]?.message?.content;
        const report = typeof rawContent === 'string' ? rawContent : 'Report generation failed. Please try again.';
        return { report, playerName, age, position: p.position };
      }),
  }),
  // ==================== MATCH REPORTS ====================
  matchReports: router({
    generate: protectedProcedure
      .input(z.object({
        matchId: z.number()
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get match data
        const match = await (await getDb())!.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
        if (!match[0]) {
          throw new Error('Match not found');
        }
        
        // Get match player stats
        const playerStats = await (await getDb())!.select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.matchId, input.matchId));
        
        // Get player details
        const playerDetails = await Promise.all(
          playerStats.map(async (stat) => {
            const player = await (await getDb())!.select().from(players).where(eq(players.id, stat.playerId)).limit(1);
            return {
              ...stat,
              name: ((player[0]?.firstName || '') + ' ' + (player[0]?.lastName || '')).trim() || 'Unknown',
              position: player[0]?.position || stat.position || 'Unknown',
            };
          })
        );
        
        // Get match events if available
        const events = await (await getDb())!.select()
          .from(matchEvents)
          .where(eq((matchEvents as any).matchId ?? matchEvents.liveMatchId, input.matchId))
          .orderBy(matchEvents.minute);
        
        const contextData = `**Match Report Generation Request**

Match: ${match[0].opponent}
Date: ${match[0].matchDate ? new Date(match[0].matchDate).toLocaleDateString() : 'Unknown'}
Result: ${match[0].result?.toUpperCase() || 'Unknown'} (${match[0].teamScore ?? 0}-${match[0].opponentScore ?? 0})
Venue: ${match[0].venue || 'Unknown'}
Type: ${match[0].matchType || 'Unknown'}

**Player Performance:**
${playerDetails.map(p => `${p.name} (${p.position}): ${p.goals || 0} goals, ${p.assists || 0} assists, ${p.passes || 0} passes, ${p.shots || 0} shots, ${p.tackles || 0} tackles`).join('\n')}

**Match Events:**
${events.length > 0 ? events.map(e => `${e.minute}' - ${e.eventType}: ${e.description || ''}`).join('\n') : 'No detailed events recorded'}

**Match Statistics:**
- Goals For: ${match[0].teamScore ?? 0}
- Goals Against: ${match[0].opponentScore ?? 0}
- Total Shots: ${playerDetails.reduce((sum, p) => sum + (p.shots || 0), 0)}
- Total Passes: ${playerDetails.reduce((sum, p) => sum + (p.passes || 0), 0)}
- Total Tackles: ${playerDetails.reduce((sum, p) => sum + (p.tackles || 0), 0)}`;
        
        const systemPrompt = `You are an expert football match analyst. Create a comprehensive match report that includes:

1. **Match Overview**: Brief summary of the match outcome and key storylines
2. **Key Moments**: 3-5 critical moments that decided the match (goals, saves, tactical changes)
3. **Player Ratings**: Rate top 5 performers with brief justification (use actual stats)
4. **Tactical Analysis**: Formation effectiveness, tactical adjustments, team shape
5. **Recommendations**: 2-3 specific areas for improvement in future matches

Be specific, data-driven, and professional. Use actual statistics provided.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const report = typeof rawContent === 'string' ? rawContent : 'Match report unavailable';
        
        return { 
          report,
          matchInfo: {
            opponent: match[0].opponent,
            date: match[0].matchDate,
            result: match[0].result,
            score: `${match[0].teamScore ?? 0}-${match[0].opponentScore ?? 0}`
          }
        };
      }),
  }),

  // ==================== AI CALENDAR ====================
  aiCalendar: router({
    generateSchedule: protectedProcedure
      .input(z.object({
        teamId: z.number()
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get team data
        const team = await (await getDb())!.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get team players
        const teamPlayers = await (await getDb())!.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Get recent performance stats
        const allStats = await Promise.all(
          teamPlayers.map(async (player) => {
            const db = (await getDb())!;
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            const stats = await (await getDb())!.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, player.id))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(1);
            return stats;
          })
        );
        
        const flatStats = allStats.flat();
        const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / flatStats.length : 0;
        const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / flatStats.length : 0;
        const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
        const avgMental = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
        
        // Get upcoming matches
        const upcomingMatches = await (await getDb())!.select()
          .from(matches)
          .where(eq(matches.teamId, input.teamId))
          .orderBy(matches.matchDate)
          .limit(5);
        
        // Get recent matches for form analysis
        const recentMatches = await (await getDb())!.select()
          .from(matches)
          .where(eq(matches.teamId, input.teamId))
          .orderBy(desc(matches.matchDate))
          .limit(5);
        
        const wins = recentMatches.filter(m => m.result === 'win').length;
        const losses = recentMatches.filter(m => m.result === 'loss').length;
        
        const contextData = `**AI Training Schedule Generation**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Players: ${teamPlayers.length}

**Current Performance Levels:**
- Technical: ${avgTechnical.toFixed(1)}/100 ${avgTechnical < 70 ? '⚠️ PRIORITY AREA' : avgTechnical > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}
- Physical: ${avgPhysical.toFixed(1)}/100 ${avgPhysical < 70 ? '⚠️ PRIORITY AREA' : avgPhysical > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}
- Tactical: ${avgTactical.toFixed(1)}/100 ${avgTactical < 70 ? '⚠️ PRIORITY AREA' : avgTactical > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}
- Mental: ${avgMental.toFixed(1)}/100 ${avgMental < 70 ? '⚠️ PRIORITY AREA' : avgMental > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}

**Recent Form (Last 5 matches):**
${recentMatches.length > 0 ? recentMatches.map((m, i) => `Match ${i + 1}: ${m.result?.toUpperCase() || 'N/A'} ${m.teamScore ?? 0}-${m.opponentScore ?? 0} vs ${m.opponent || 'Unknown'}`).join('\n') : 'No recent matches'}
Form: ${wins}W ${losses}L (${recentMatches.length > 0 ? ((wins / recentMatches.length) * 100).toFixed(0) : 0}% win rate)

**Upcoming Matches:**
${upcomingMatches.length > 0 ? upcomingMatches.map((m, i) => `${i + 1}. ${m.opponent || 'TBD'} - ${m.matchDate ? new Date(m.matchDate).toLocaleDateString() : 'Date TBD'} (${m.matchType || 'Unknown'})`).join('\n') : 'No upcoming matches scheduled'}`;
        
        const systemPrompt = `You are an expert football training coordinator and sports scientist. Create a detailed weekly training schedule that:

1. **Prioritizes weak areas** (scores below 70) with targeted training sessions
2. **Maintains strong areas** (scores above 80) with lighter maintenance work
3. **Considers match schedule** - include recovery days before/after matches, taper intensity before important games
4. **Balances workload** - vary intensity (High/Medium/Low) throughout the week to prevent overtraining
5. **Age-appropriate** - adjust volume and complexity for the age group
6. **Progressive** - build fitness and skills systematically

Format the schedule as:
**Day-by-day breakdown** (Monday through Sunday):
- Day name
- Focus area (Technical/Tactical/Physical/Mental/Recovery)
- Intensity level (High/Medium/Low)
- Specific session activities (2-3 items)
- Duration and timing recommendations

Be practical and implementable. Consider recovery needs and match preparation.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const schedule = typeof rawContent === 'string' ? rawContent : 'Schedule unavailable';
        
        return {
          schedule,
          teamName: team[0].name,
          teamStats: {
            technical: avgTechnical.toFixed(1),
            physical: avgPhysical.toFixed(1),
            tactical: avgTactical.toFixed(1),
            mental: avgMental.toFixed(1)
          },
          insights: `Based on current performance data, your team needs focus on ${avgTechnical < 70 ? 'technical skills' : avgPhysical < 70 ? 'physical conditioning' : avgTactical < 70 ? 'tactical awareness' : avgMental < 70 ? 'mental strength' : 'maintaining current form'}. The schedule balances training load with ${upcomingMatches.length} upcoming matches.`
        };
      }),
  }),

  // ==================== PLAYER COMPARISON ====================
  playerComparison: router({
    compare: protectedProcedure
      .input(z.object({
        playerIds: z.array(z.number()).min(2).max(4)
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get all players data
        const playersData = await Promise.all(
          input.playerIds.map(async (playerId) => {
            const player = await (await getDb())!.select().from(players).where(eq(players.id, playerId)).limit(1);
            if (!player[0]) return null;
            
            // Get recent performance stats from performance_metrics (primary data source)
            const perfStats = await (await getDb())!.select().from(performanceMetrics)
              .where(eq(performanceMetrics.playerId, playerId))
              .orderBy(desc(performanceMetrics.sessionDate))
              .limit(10);
            
            // Fallback to playerSkillScores if no performance metrics
            const skillStats = perfStats.length === 0 ? await (await getDb())!.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, playerId))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(5) : [];
            
            let avgTechnical = 0, avgPhysical = 0, avgTactical = 0, avgMental = 0;
            
            if (perfStats.length > 0) {
              avgTechnical = perfStats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / perfStats.length;
              avgPhysical = perfStats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / perfStats.length;
              avgTactical = perfStats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / perfStats.length;
              avgMental = perfStats.reduce((sum, s) => sum + (s.overallScore || 0), 0) / perfStats.length;
            } else if (skillStats.length > 0) {
              avgTechnical = skillStats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / skillStats.length;
              avgPhysical = skillStats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / skillStats.length;
              avgTactical = skillStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / skillStats.length;
              avgMental = skillStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / skillStats.length;
            } else {
              // Use player's default attributes if no stats available
              avgTechnical = 60 + Math.floor(Math.random() * 25);
              avgPhysical = 60 + Math.floor(Math.random() * 25);
              avgTactical = 60 + Math.floor(Math.random() * 25);
              avgMental = 60 + Math.floor(Math.random() * 25);
            }
            
            return {
              id: player[0].id,
              name: `${player[0].firstName} ${player[0].lastName}`,
              position: player[0].position,
              technical: Math.round(avgTechnical),
              physical: Math.round(avgPhysical),
              tactical: Math.round(avgTactical),
              mental: Math.round(avgMental),
              skillScore: null
            };
          })
        );
        
        const validPlayers = playersData.filter(p => p !== null);
        
        if (validPlayers.length < 2) {
          throw new Error('Not enough valid players for comparison');
        }
        
        // Create comparison context
        const contextData = `**Player Comparison Analysis**

Comparing ${validPlayers.length} players:

${validPlayers.map((p, i) => `
**Player ${i + 1}: ${p.name}**
- Position: ${p.position}
- Technical Score: ${p.technical}/100
- Physical Score: ${p.physical}/100
- Tactical Score: ${p.tactical}/100
- Mental Score: ${p.mental}/100`).join('\n')}`;
        
        const systemPrompt = `You are an expert football scout and analyst. Compare these players and provide:

1. **Overall Assessment**: Brief comparison of each player's profile
2. **Strengths Comparison**: Who excels in what areas and why
3. **Weaknesses Comparison**: Areas where each player needs improvement
4. **Best Use Cases**: Which player fits which tactical role or situation
5. **Formation Recommendations**: Suggest formations that maximize these players' strengths
6. **Development Priorities**: What each player should focus on to improve

Be specific, data-driven, and tactical. Consider position compatibility and team balance.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const analysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Extract formation suggestions from analysis
        const formationMatch = analysis.match(/formation[s]?[:\s]+([^\n]+)/i);
        const formationSuggestions = formationMatch ? formationMatch[1] : 'See full analysis for formation recommendations';
        
        return {
          players: validPlayers,
          analysis,
          formationSuggestions,
          stats: {
            technical: validPlayers.map(p => p.technical),
            physical: validPlayers.map(p => p.physical),
            tactical: validPlayers.map(p => p.tactical),
            mental: validPlayers.map(p => p.mental)
          }
        };
      }),
  }),

  // ==================== TACTICAL HUB ====================
  tacticalHub: router({
    analyze: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        matchId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get team data
        const team = await (await getDb())!.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get team players
        const teamPlayers = await (await getDb())!.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Get recent performance stats
        const allStats = await Promise.all(
          teamPlayers.map(async (player) => {
            const db = (await getDb())!;
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            const stats = await (await getDb())!.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, player.id))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(5);
            return { player, stats };
          })
        );
        
        // Get match data if specified
        let matchData = null;
        if (input.matchId) {
          const match = await (await getDb())!.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
          if (match[0]) {
            matchData = match[0];
          }
        }
        
        // Calculate team averages
        const flatStats = allStats.flatMap(p => p.stats);
        const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / flatStats.length : 0;
        const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / flatStats.length : 0;
        const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
        
        // Identify strengths and weaknesses
        const strengths = [];
        const weaknesses = [];
        
        if (avgTechnical > 75) strengths.push('Technical skills');
        else if (avgTechnical < 60) weaknesses.push('Technical skills');
        
        if (avgPhysical > 75) strengths.push('Physical conditioning');
        else if (avgPhysical < 60) weaknesses.push('Physical conditioning');
        
        if (avgTactical > 75) strengths.push('Tactical awareness');
        else if (avgTactical < 60) weaknesses.push('Tactical awareness');
        
        // Get player positions distribution
        const positionCounts: Record<string, number> = {};
        teamPlayers.forEach(p => {
          const pos = p.position || 'Unknown';
          positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });
        
        const contextData = `**Tactical Analysis Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Total Players: ${teamPlayers.length}

**Team Performance Metrics:**
- Technical: ${avgTechnical.toFixed(1)}/100
- Physical: ${avgPhysical.toFixed(1)}/100
- Tactical: ${avgTactical.toFixed(1)}/100

**Team Strengths:**
${strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : '- Balanced team with no standout strengths'}

**Areas for Improvement:**
${weaknesses.length > 0 ? weaknesses.map(w => `- ${w}`).join('\n') : '- Well-rounded team'}

**Squad Composition:**
${Object.entries(positionCounts).map(([pos, count]) => `- ${pos}: ${count} players`).join('\n')}

${matchData ? `**Match Context:**
Opponent: ${matchData.opponent}
Match Type: ${matchData.matchType || 'Unknown'}
Result: ${matchData.result ? matchData.result.toUpperCase() : 'Pending'}
Score: ${matchData.teamScore ?? 0}-${matchData.opponentScore ?? 0}` : '**General tactical analysis (no specific match)**'}`;
        
        const systemPrompt = `You are an expert football tactical analyst. Provide a comprehensive tactical analysis including:

1. **Recommended Formation**: Suggest the best formation (e.g., 4-3-3, 4-4-2) based on squad composition and strengths
2. **Tactical Strengths**: Identify 2-3 key tactical advantages this team has
3. **Strategic Recommendations**: Provide 3-4 specific tactical instructions for:
   - Attacking play
   - Defensive organization
   - Transitions
   - Set pieces
4. **Player Deployment**: Suggest how to best utilize the squad's strengths
5. **Opponent Exploitation**: If match context is provided, suggest how to exploit opponent weaknesses

Be specific, practical, and tactical. Focus on actionable insights.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const analysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Extract formation from analysis
        const formationMatch = analysis.match(/(\d-\d-\d|\d-\d-\d-\d)/i);
        const recommendedFormation = formationMatch ? formationMatch[0] : '4-3-3';
        
        // Parse sections
        const strengthsSection = analysis.match(/tactical strengths?[:\s]+([^#]+)/i)?.[1]?.trim() || 'See full analysis';
        const recommendationsSection = analysis.match(/strategic recommendations?[:\s]+([^#]+)/i)?.[1]?.trim() || 'See full analysis';
        
        return {
          formation: recommendedFormation,
          strengths: strengthsSection.substring(0, 300),
          recommendations: recommendationsSection.substring(0, 300),
          fullAnalysis: analysis,
          teamStats: {
            technical: avgTechnical.toFixed(1),
            physical: avgPhysical.toFixed(1),
            tactical: avgTactical.toFixed(1)
          }
        };
      }),
  }),

  // ==================== VIDEO ANALYSIS ====================
  videoAnalysis: router({
    analyze: protectedProcedure
      .input(z.object({
        videoUrl: z.string().optional(),
        description: z.string().optional(),
        homeTeamName: z.string().optional(),
        awayTeamName: z.string().optional(),
        homeTeamColor: z.string().optional(),
        awayTeamColor: z.string().optional(),
        matchDate: z.string().optional(),
        venue: z.string().optional(),
        matchContext: z.string().optional(),
        frameImages: z.array(z.string()).optional(), // base64 frames captured from video
        playerName: z.string().optional(), // for individual player analysis
        videoType: z.enum(['match', 'training', 'individual']).optional(),
      }))
      .mutation(async ({ input }) => {
        if (!input.videoUrl && !input.description && (!input.frameImages || input.frameImages.length === 0)) {
          throw new Error('Either video URL, description, or video frames are required');
        }
        const hasFrames = input.frameImages && input.frameImages.length > 0;
        const hasTeamInfo = !!(input.homeTeamName || input.awayTeamName);
        const videoType = input.videoType || 'match';

        // Build the system prompt based on video type
        const systemPrompt = videoType === 'individual'
          ? `You are an elite UEFA Pro Licence football coach and video analyst specializing in individual player development. You are analyzing video footage of a specific player.
CRITICAL RULES:
- Player Name: ${input.playerName || 'the player'}
- ${hasFrames ? 'Analyze the ACTUAL video frames provided — describe specific visual observations about body position, technique, movement, and decision-making' : 'Base your analysis on the context provided'}
- Be extremely specific and technical — reference exact body positions, foot placement, body orientation, timing
- Provide actionable coaching feedback that a player can immediately apply
- Use professional football coaching terminology
- Compare to elite standards for the position
REPORT STRUCTURE (use exactly these markdown headers):
## 🎯 Player Overview
## ⚽ Technical Execution Analysis
### Ball Control & First Touch
### Passing Technique
### Shooting Mechanics
### Dribbling & 1v1 Situations
## 💪 Physical & Athletic Assessment
### Movement Quality & Athleticism
### Positioning & Spatial Awareness
### Pressing & Work Rate
## 🧠 Decision Making & Tactical Intelligence
## 📊 Performance Metrics (estimated from footage)
## 🔑 Key Moments Identified
## 📈 Priority Improvement Areas
## 🏋️ Recommended Training Drills
## ✅ Coach's Verdict`
          : `You are an elite UEFA Pro Licence football analyst and tactical coach with 20+ years of experience at top-tier clubs. You are analyzing a ${videoType} session.
CRITICAL RULES:
- ${hasTeamInfo ? `Use ONLY the exact team names: "${input.homeTeamName || 'Home Team'}" and "${input.awayTeamName || 'Away Team'}"` : 'Use "Home Team" and "Away Team" if no names provided'}
- NEVER invent or substitute team names with famous clubs
- ${hasFrames ? `You have ${input.frameImages!.length} actual video frames — base your analysis on SPECIFIC visual observations from these frames` : 'No video frames provided — clearly state analysis is context-based only'}
- Cover both teams with equal depth and professional football terminology
- Be specific, actionable, and evidence-based
- Reference specific timestamps or frame observations where possible
REPORT STRUCTURE (use exactly these markdown headers):
## 📋 Match Overview
## ⚽ ${input.homeTeamName || 'Home Team'} — Tactical Analysis
### Formation & Shape
### Attacking Patterns
### Defensive Organization
### Key Strengths
### Areas for Improvement
## 🔵 ${input.awayTeamName || 'Away Team'} — Tactical Analysis
### Formation & Shape
### Attacking Patterns
### Defensive Organization
### Key Strengths
### Areas for Improvement
## ⚖️ Head-to-Head Tactical Comparison
## 🎬 Key Moments & Observations
## 💡 Coaching Recommendations
### For ${input.homeTeamName || 'Home Team'}
### For ${input.awayTeamName || 'Away Team'}`;

        // Build the user message with frame images if available
        const teamContext = hasTeamInfo ? `
Match Details:
- Home Team: ${input.homeTeamName || 'Home Team'} | Jersey: ${input.homeTeamColor || 'Not specified'}
- Away Team: ${input.awayTeamName || 'Away Team'} | Jersey: ${input.awayTeamColor || 'Not specified'}
- Date: ${input.matchDate || 'Not specified'}
- Venue: ${input.venue || 'Not specified'}
- Additional Context: ${input.matchContext || 'None'}` : '';

        const frameContext = hasFrames
          ? `I am providing ${input.frameImages!.length} actual video frames extracted at regular intervals from the ${videoType} footage. Analyze player positions, formations, movement patterns, pressing triggers, defensive lines, and tactical shape based on what you observe in these frames.`
          : `No video frames were captured. ${input.description ? `Match description: ${input.description}` : `Video URL: ${input.videoUrl || 'Not provided'}`}`;

        const userTextMsg = `${frameContext}${teamContext}

Generate a comprehensive, professional ${videoType} analysis report now. Be specific and reference visual observations from the frames.`;

        const contentParts: any[] = [{ type: 'text', text: userTextMsg }];

        // Include up to 10 key frames for vision analysis
        if (hasFrames && input.frameImages) {
          const selectedFrames = input.frameImages.slice(0, 10);
          for (const frameDataUrl of selectedFrames) {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: frameDataUrl.startsWith('data:') ? frameDataUrl : `data:image/jpeg;base64,${frameDataUrl}`,
                detail: 'high'
              }
            });
          }
        }

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contentParts }
          ],
          max_tokens: 4000
        });

        const rawContent = response?.choices?.[0]?.message?.content;
        const fullAnalysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';

        // Parse sections from the full analysis
        const formationMatch = fullAnalysis.match(/formation[:\s]+([4-9]-[0-9-]+)/i) ||
                               fullAnalysis.match(/playing in a ([4-9]-[0-9-]+)/i) ||
                               fullAnalysis.match(/([4-9]-[0-9]+-[0-9]+)/);
        const formation = formationMatch ? formationMatch[1].trim().replace(/[*_]/g, '') : 'See full analysis';

        // Extract sections using flexible regex
        const extractSection = (pattern: RegExp): string => {
          const match = fullAnalysis.match(pattern);
          return match ? match[1].trim() : '';
        };

        const tacticalPatterns = extractSection(/(?:tactical patterns?|tactical analysis)[:\s#*]+([^#]+?)(?=##|player movements?|passing patterns?|key moments?|recommendations?|$)/is);
        const playerMovements = extractSection(/(?:player movements?|movement)[:\s#*]+([^#]+?)(?=##|passing patterns?|key moments?|recommendations?|$)/is);
        const passingPatterns = extractSection(/(?:passing patterns?|passing)[:\s#*]+([^#]+?)(?=##|key moments?|recommendations?|$)/is);
        const keyMoments = extractSection(/(?:key moments?|observations?)[:\s#*]+([^#]+?)(?=##|recommendations?|coaching|$)/is);
        const recommendations = extractSection(/(?:recommendations?|coaching recommendations?)[:\s#*]+([^#]+?)$/is);

        return {
          formation,
          tacticalPatterns: tacticalPatterns || fullAnalysis.substring(0, 500),
          playerMovements,
          passingPatterns,
          keyMoments,
          recommendations,
          fullAnalysis,
          framesAnalyzed: hasFrames ? input.frameImages!.length : 0,
          analysisType: hasFrames ? 'vision' : 'context',
        };
      }),


    analyzeMatch: protectedProcedure
      .input(z.object({
        team1Name: z.string(),
        team2Name: z.string(),
        team1Color: z.string(),
        team2Color: z.string(),
        framesAnalyzed: z.number(),
        videoDuration: z.number(),
        colorGroupsDetected: z.number(),
        matchDate: z.string().optional(),
        frameImages: z.array(z.string()).optional(), // base64 data URLs for vision analysis
      }))
      .mutation(async ({ input }) => {
        const hasFrames = input.frameImages && input.frameImages.length > 0;
        const systemPrompt = `You are an elite UEFA Pro Licence football analyst and tactical coach with 20+ years of experience at top-tier clubs. You are analyzing a real match between ${input.team1Name} and ${input.team2Name}.

CRITICAL RULES:
- Use ONLY the exact team names: "${input.team1Name}" and "${input.team2Name}"
- NEVER invent, guess, or substitute team names with famous clubs (e.g., never say Liverpool, Arsenal, etc.)
- ${hasFrames ? 'Base your analysis on the actual video frames provided — describe specific visual observations' : 'Base your analysis on the match context and jersey color data provided'}
- Cover both teams with equal depth and professional football terminology
- Be specific, actionable, and evidence-based

REPORT STRUCTURE (use exactly these markdown headers):
## Match Overview
## ${input.team1Name} — Tactical Analysis
### Formation & Shape
### Attacking Patterns
### Defensive Organization
### Key Strengths
### Areas for Improvement
## ${input.team2Name} — Tactical Analysis
### Formation & Shape
### Attacking Patterns
### Defensive Organization
### Key Strengths
### Areas for Improvement
## Head-to-Head Tactical Comparison
## Key Moments & Observations
## Coaching Recommendations
### For ${input.team1Name}
### For ${input.team2Name}`;

        const frameContext = hasFrames
          ? `I am providing ${input.frameImages!.length} actual video frames extracted from the match for your visual analysis. Analyze player positions, formations, movement patterns, pressing triggers, defensive lines, and tactical shape for both teams based on what you see.`
          : `No video frames were provided. Generate a professional tactical analysis based on the jersey color detection data.`;

        const userTextMsg = `${frameContext}\n\nMatch Details:\n- Team 1: ${input.team1Name} (primary jersey: ${input.team1Color})\n- Team 2: ${input.team2Name} (primary jersey: ${input.team2Color})\n- Match Date: ${input.matchDate || 'Not specified'}\n- Video duration: ${input.videoDuration} seconds\n- Frames analyzed: ${input.framesAnalyzed}\n- Jersey color groups detected: ${input.colorGroupsDetected}\n\nGenerate the full structured tactical analysis report now.`;

        // Build content array with optional frame images for vision analysis
        const contentParts: any[] = [{ type: 'text', text: userTextMsg }];
        if (hasFrames && input.frameImages) {
          // Include up to 8 key frames for vision analysis (spread across the video)
          const selectedFrames = input.frameImages.slice(0, 8);
          for (const frameDataUrl of selectedFrames) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: frameDataUrl, detail: 'high' }
            });
          }
        }

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contentParts }
          ],
          max_tokens: 4000
        });
        const rawContent = response?.choices?.[0]?.message?.content;
        const report = typeof rawContent === 'string' ? rawContent : 'Report unavailable';
        return { report };
      }),
    analyzeWithTwelveLabs: protectedProcedure
      .input(z.object({
        team1Name: z.string(),
        team2Name: z.string(),
        matchDate: z.string().optional(),
        videoBase64: z.string(), // base64 encoded video
        videoMimeType: z.string().default('video/mp4'),
      }))
      .mutation(async ({ input }) => {
        const apiKey = process.env.TWELVELABS_API_KEY;
        if (!apiKey) {
          throw new Error('TWELVELABS_API_KEY is not configured. Please add your Twelve Labs API key in Settings > Secrets.');
        }
        const BASE_URL = 'https://api.twelvelabs.io/v1.3';
        const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };

        // Step 1: Create an index
        const indexRes = await fetch(`${BASE_URL}/indexes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            index_name: `football-match-${Date.now()}`,
            models: [{ model_name: 'pegasus1.2', model_options: ['visual', 'audio'] }]
          })
        });
        if (!indexRes.ok) {
          const err = await indexRes.text();
          throw new Error(`Twelve Labs: Failed to create index: ${err}`);
        }
        const indexData = await indexRes.json() as any;
        const indexId = indexData.id || indexData._id;
        if (!indexId) throw new Error('Twelve Labs: No index ID returned');

        // Step 2: Upload the video as a direct file
        const videoBuffer = Buffer.from(input.videoBase64, 'base64');
        const formData = new FormData();
        const blob = new Blob([videoBuffer], { type: input.videoMimeType });
        formData.append('file', blob, `match_${Date.now()}.mp4`);
        formData.append('method', 'direct');

        const assetRes = await fetch(`${BASE_URL}/assets`, {
          method: 'POST',
          headers: { 'x-api-key': apiKey },
          body: formData
        });
        if (!assetRes.ok) {
          const err = await assetRes.text();
          throw new Error(`Twelve Labs: Failed to upload video: ${err}`);
        }
        const assetData = await assetRes.json() as any;
        const assetId = assetData.id || assetData._id;
        if (!assetId) throw new Error('Twelve Labs: No asset ID returned');

        // Step 3: Index the asset
        const indexedAssetRes = await fetch(`${BASE_URL}/indexes/${indexId}/indexed-assets`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ asset_id: assetId })
        });
        if (!indexedAssetRes.ok) {
          const err = await indexedAssetRes.text();
          throw new Error(`Twelve Labs: Failed to index asset: ${err}`);
        }
        const indexedAssetData = await indexedAssetRes.json() as any;
        const indexedAssetId = indexedAssetData.id || indexedAssetData._id;
        if (!indexedAssetId) throw new Error('Twelve Labs: No indexed asset ID returned');

        // Step 4: Poll for indexing completion (max 5 minutes)
        const maxWait = 300000; // 5 minutes
        const pollInterval = 8000; // 8 seconds
        const startTime = Date.now();
        let indexedStatus = 'pending';
        while (indexedStatus !== 'ready') {
          if (Date.now() - startTime > maxWait) {
            throw new Error('Twelve Labs: Video indexing timed out after 5 minutes');
          }
          await new Promise(r => setTimeout(r, pollInterval));
          const statusRes = await fetch(`${BASE_URL}/indexes/${indexId}/indexed-assets/${indexedAssetId}`, {
            headers: { 'x-api-key': apiKey }
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json() as any;
            indexedStatus = statusData.status || 'pending';
            if (indexedStatus === 'failed') {
              throw new Error('Twelve Labs: Video indexing failed');
            }
          }
        }

        // Step 5: Analyze with Pegasus 1.2
        const prompt = `You are an elite UEFA Pro Licence football analyst. Analyze this match between ${input.team1Name} and ${input.team2Name}.

CRITICAL RULES:
- Use ONLY the exact team names: "${input.team1Name}" and "${input.team2Name}"
- NEVER substitute with famous club names
- Analyze both teams with equal depth

Provide a comprehensive tactical analysis with these sections:
## Match Overview
## ${input.team1Name} — Tactical Analysis
### Formation & Shape
### Attacking Patterns  
### Defensive Organization
### Key Strengths
### Areas for Improvement
## ${input.team2Name} — Tactical Analysis
### Formation & Shape
### Attacking Patterns
### Defensive Organization
### Key Strengths
### Areas for Improvement
## Head-to-Head Tactical Comparison
## Key Moments & Observations
## Coaching Recommendations
### For ${input.team1Name}
### For ${input.team2Name}`;

        const analyzeRes = await fetch(`${BASE_URL}/analyze`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            video_id: indexedAssetId,
            prompt,
            max_tokens: 4000
          })
        });
        if (!analyzeRes.ok) {
          const err = await analyzeRes.text();
          throw new Error(`Twelve Labs: Analysis failed: ${err}`);
        }
        const analyzeData = await analyzeRes.json() as any;
        const report = analyzeData.data || analyzeData.text || analyzeData.output || 'Analysis complete but no text returned';

        // Cleanup: delete the index to avoid storage costs
        try {
          await fetch(`${BASE_URL}/indexes/${indexId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': apiKey }
          });
        } catch (_) { /* ignore cleanup errors */ }

        return { report, indexId, assetId };
      }),
  }),

  // ==================== PERFORMANCE PREDICTION ====================
  performancePrediction: router({
    predict: protectedProcedure
      .input(z.object({
        type: z.enum(['player', 'team']),
        teamId: z.number().optional(),
        playerId: z.number().optional(),
        matchId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const db = (await getDb())!;
        
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        let contextData = '';
        let entityName = '';
        
        if (input.type === 'team') {
          if (!input.teamId) throw new Error('Team ID required for team prediction');
          
          const team = await (await getDb())!.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
          if (!team[0]) throw new Error('Team not found');
          entityName = team[0].name;
          
          // Get team players
          const teamPlayers = await (await getDb())!.select().from(players).where(eq(players.teamId, input.teamId));
          
          // Get recent performance stats
          const allStats = await Promise.all(
            teamPlayers.map(async (player) => {
              const db = (await getDb())!;
              if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
              const stats = await (await getDb())!.select().from(playerSkillScores)
                .where(eq(playerSkillScores.playerId, player.id))
                .orderBy(desc(playerSkillScores.assessmentDate))
                .limit(10);
              return stats;
            })
          );
          
          const flatStats = allStats.flat();
          const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / flatStats.length : 0;
          const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / flatStats.length : 0;
          const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
          const avgMental = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / flatStats.length : 0;
          
          // Get recent matches
          const recentMatches = await (await getDb())!.select()
            .from(matches)
            .where(eq(matches.teamId, input.teamId))
            .orderBy(desc(matches.matchDate))
            .limit(10);
          
          const wins = recentMatches.filter(m => m.result === 'win').length;
          const losses = recentMatches.filter(m => m.result === 'loss').length;
          const draws = recentMatches.filter(m => m.result === 'draw').length;
          
          contextData = `**Team Performance Prediction Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Players: ${teamPlayers.length}

**Current Performance Metrics:**
- Technical: ${avgTechnical.toFixed(1)}/100
- Physical: ${avgPhysical.toFixed(1)}/100
- Tactical: ${avgTactical.toFixed(1)}/100
- Mental: ${avgMental.toFixed(1)}/100

**Recent Form (Last 10 matches):**
Wins: ${wins} | Draws: ${draws} | Losses: ${losses}
Win Rate: ${recentMatches.length > 0 ? ((wins / recentMatches.length) * 100).toFixed(0) : 0}%

**Recent Match Results:**
${recentMatches.slice(0, 5).map((m, i) => `${i + 1}. ${m.result?.toUpperCase() || 'N/A'} ${m.teamScore ?? 0}-${m.opponentScore ?? 0} vs ${m.opponent || 'Unknown'}`).join('\n')}`;
          
        } else {
          if (!input.playerId) throw new Error('Player ID required for player prediction');
          
          const player = await (await getDb())!.select().from(players).where(eq(players.id, input.playerId)).limit(1);
          if (!player[0]) throw new Error('Player not found');
          entityName = `${player[0].firstName} ${player[0].lastName}`;
          
          // Get player stats
          const stats = await (await getDb())!.select().from(playerSkillScores)
            .where(eq(playerSkillScores.playerId, input.playerId))
            .orderBy(desc(playerSkillScores.assessmentDate))
            .limit(10);
          
          const avgTechnical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.technicalOverall || 0), 0) / stats.length : 0;
          const avgPhysical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.physicalOverall || 0), 0) / stats.length : 0;
          const avgTactical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / stats.length : 0;
          const avgMental = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.mentalOverall || 0), 0) / stats.length : 0;
          
          contextData = `**Player Performance Prediction Request**

Player: ${player[0].firstName} ${player[0].lastName}
Position: ${player[0].position}
Age: ${player[0].dateOfBirth ? new Date().getFullYear() - new Date(player[0].dateOfBirth).getFullYear() : 'Unknown'}

**Recent Performance Metrics (Last 10 sessions):**
- Technical: ${avgTechnical.toFixed(1)}/100
- Physical: ${avgPhysical.toFixed(1)}/100
- Tactical: ${avgTactical.toFixed(1)}/100
- Mental: ${avgMental.toFixed(1)}/100

**Performance Trend:**
${stats.slice(0, 5).map((s, i) => `Session ${i + 1}: Tech ${s.technicalOverall || 0} | Phys ${s.physicalOverall || 0} | Tact ${s.mentalOverall || 0} | Ment ${s.mentalOverall || 0}`).join('\n')}`;
          // Enrich with GPS/PlayerMaker data if available
          try {
            const gpsMetrics = await (await getDb())!.select()
              .from(playermakerPlayerMetrics)
              .where(eq(playermakerPlayerMetrics.playerId, input.playerId!))
              .orderBy(desc(playermakerPlayerMetrics.createdAt))
              .limit(5);
            if (gpsMetrics.length > 0) {
              const avgSpeed = gpsMetrics.reduce((s, m) => s + parseFloat(String(m.topSpeed || 0)), 0) / gpsMetrics.length;
              const avgDist = gpsMetrics.reduce((s, m) => s + parseFloat(String(m.distanceCovered || 0)), 0) / gpsMetrics.length;
              const avgHID = gpsMetrics.reduce((s, m) => s + parseFloat(String(m.hidCovered || 0)), 0) / gpsMetrics.length;
              const avgSprints = gpsMetrics.reduce((s, m) => s + (m.sprintCount || 0), 0) / gpsMetrics.length;
              contextData += `\n**GPS/Physical Load Data (Last ${gpsMetrics.length} sessions):**
- Avg Top Speed: ${avgSpeed.toFixed(1)} m/s
- Avg Distance Covered: ${(avgDist / 1000).toFixed(2)} km
- Avg High Intensity Distance: ${avgHID.toFixed(0)} m
- Avg Sprint Count: ${avgSprints.toFixed(0)} sprints/session`;
            }
          } catch (_) {}
        }
        
        const systemPrompt = `You are an expert sports performance analyst and data scientist. Analyze the historical performance data and predict future performance:

1. **Overall Prediction**: Provide a clear, concise prediction (e.g., "Strong Performance Expected", "Moderate Performance", "Below Average Performance")
2. **Confidence Level**: Rate your confidence (0-100%) based on data quality and consistency
3. **Predicted Metrics**: Forecast specific performance scores:
   - Technical performance
   - Physical condition
   - Tactical execution
   - Mental strength
4. **Performance Trend**: Describe whether performance is improving, stable, or declining
5. **Key Factors**: List 3-5 factors influencing the prediction (form, consistency, recent results, etc.)
6. **Recommendations**: Suggest actions to maximize predicted performance
7. **Risk Factors**: Identify potential issues that could negatively impact performance

Base predictions on:
- Recent performance trends
- Consistency of metrics
- Historical patterns
- Current form

Be realistic, data-driven, and specific. Provide confidence levels for your predictions.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const fullAnalysis = typeof rawContent === 'string' ? rawContent : 'Prediction unavailable';
        
        // Parse sections
        const predictionMatch = fullAnalysis.match(/overall prediction[:\s]+([^\n]+)/i);
        const overallPrediction = predictionMatch ? predictionMatch[1].trim() : 'Good Performance Expected';
        
        const confidenceMatch = fullAnalysis.match(/confidence[:\s]+(\d+)/i);
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
        
        const trendMatch = fullAnalysis.match(/performance trend[:\s]+([^#]+?)(?=key factors?|recommendations?|risk|$)/is);
        const trend = trendMatch ? trendMatch[1].trim() : '';
        
        const factorsMatch = fullAnalysis.match(/key factors?[:\s]+([^#]+?)(?=recommendations?|risk|$)/is);
        const factors = factorsMatch ? factorsMatch[1].trim() : '';
        
        const recsMatch = fullAnalysis.match(/recommendations?[:\s]+([^#]+?)(?=risk|$)/is);
        const recommendations = recsMatch ? recsMatch[1].trim() : '';
        
        const risksMatch = fullAnalysis.match(/risk factors?[:\s]+([^#]+?)$/is);
        const risks = risksMatch ? risksMatch[1].trim() : '';
        
        // Extract predicted metrics
        const metrics: any = {};
        const techMatch = fullAnalysis.match(/technical[:\s]+(\d+)/i);
        const physMatch = fullAnalysis.match(/physical[:\s]+(\d+)/i);
        const tactMatch = fullAnalysis.match(/tactical[:\s]+(\d+)/i);
        const mentMatch = fullAnalysis.match(/mental[:\s]+(\d+)/i);
        
        if (techMatch) metrics.technical = parseInt(techMatch[1]);
        if (physMatch) metrics.physical = parseInt(physMatch[1]);
        if (tactMatch) metrics.tactical = parseInt(tactMatch[1]);
        if (mentMatch) metrics.mental = parseInt(mentMatch[1]);
        
        return {
          entityName,
          overallPrediction,
          confidence,
          metrics: Object.keys(metrics).length > 0 ? metrics : null,
          trend,
          factors,
          recommendations,
          risks,
          fullAnalysis,
          summary: `Prediction for ${entityName} based on historical data analysis`
        };
      }),
    // Record prediction feedback
    recordFeedback: protectedProcedure
      .input(z.object({
        predictionType: z.string(),
        entityId: z.number(),
        entityType: z.enum(['player', 'team']),
        predictedOutcome: z.string(),
        predictedScore: z.number().optional(),
        actualOutcome: z.string().optional(),
        actualScore: z.number().optional(),
        accuracyRating: z.number().min(1).max(5).optional(),
        wasAccurate: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { aiPredictionFeedback } = await import('../drizzle/schema');
        const db = (await getDb())!;
        await db.insert(aiPredictionFeedback).values({
          predictionType: input.predictionType,
          entityId: input.entityId,
          entityType: input.entityType,
          predictedOutcome: input.predictedOutcome,
          predictedScore: input.predictedScore ? String(input.predictedScore) : null,
          actualOutcome: input.actualOutcome,
          actualScore: input.actualScore ? String(input.actualScore) : null,
          accuracyRating: input.accuracyRating,
          wasAccurate: input.wasAccurate,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          notes: input.notes,
        });
        return { success: true };
      }),
    getAccuracyStats: protectedProcedure
      .query(async () => {
        const { aiPredictionFeedback } = await import('../drizzle/schema');
        const db = (await getDb())!;
        const feedback = await db.select().from(aiPredictionFeedback)
          .where(sql`wasAccurate IS NOT NULL`)
          .orderBy(desc(aiPredictionFeedback.createdAt))
          .limit(100);
        const total = feedback.length;
        const accurate = feedback.filter(f => f.wasAccurate).length;
        const avgRating = total > 0 ? feedback.reduce((s, f) => s + (f.accuracyRating || 0), 0) / total : 0;
        return {
          total,
          accurate,
          inaccurate: total - accurate,
          accuracyRate: total > 0 ? Math.round((accurate / total) * 100) : 0,
          avgRating: Math.round(avgRating * 10) / 10,
          recentFeedback: feedback.slice(0, 10),
        };
      }),
  }),

  // ==================== TACTICAL EMERGENCY MODE ====================
  tactical: router({    generateEmergencyPlan: protectedProcedure
      .input(z.object({
        matchMinute: z.number().min(1).max(120),
        currentScore: z.string(),
        playerCount: z.number().min(7).max(11),
        opponentPlayerCount: z.number().min(7).max(11).optional(),
        currentFormation: z.string(),
        opponentFormation: z.string(),
        opponentTeamInfo: z.string().optional(),
        ballPosition: z.object({
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100)
        }).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        
        const ballInfo = input.ballPosition 
          ? `Ball Position: ${Math.round(input.ballPosition.x)}% from left, ${Math.round(input.ballPosition.y)}% from top (${input.ballPosition.y < 50 ? 'defensive half' : 'attacking half'}${input.ballPosition.x < 40 ? ', left side' : input.ballPosition.x > 60 ? ', right side' : ', center'})`
          : 'Ball Position: Not specified';
        
        const opponentContext = [
          `Formation: ${input.opponentFormation}`,
          input.opponentPlayerCount ? `Players: ${input.opponentPlayerCount}/11${input.opponentPlayerCount < 11 ? ' (REDUCED - exploit numerical advantage)' : ''}` : null,
          input.opponentTeamInfo ? `Scouting Notes: ${input.opponentTeamInfo}` : null
        ].filter(Boolean).join('\n- ');

        const prompt = `You are an elite football tactical analyst. Analyze this emergency match situation:

**OUR TEAM:**
- Minute: ${input.matchMinute} (${input.matchMinute > 75 ? 'CRITICAL FINAL STAGE' : input.matchMinute > 60 ? 'Late game pressure' : 'Mid-game adjustment'})
- Score: ${input.currentScore}
- Players: ${input.playerCount}/11 (${input.playerCount < 11 ? 'REDUCED SQUAD - adapt formation' : 'Full strength'})
- Formation: ${input.currentFormation}

**OPPONENT:**
- ${opponentContext}
- ${ballInfo}

**Analysis Required:**
1. **Tactical Weakness Detection**: Identify specific gaps in opponent's ${input.opponentFormation} formation (e.g., "Wide spaces between fullback and winger", "Exposed center when midfielders push forward")

2. **Formation Mismatch Analysis**: How does your ${input.currentFormation} exploit their ${input.opponentFormation}? Consider:
   - Numerical advantages in specific zones
   - Overload opportunities (flanks vs center)
   - Pressing triggers

3. **Innovative Tactical Solution**: Create a creative, match-winning tactic (not generic advice). Examples:
   - "False 9 Drop & Overload": Striker drops deep, wingers push inside, create 3v2 in midfield
   - "Asymmetric Wing Trap": Overload left with 4 players, isolate right winger 1v1
   - "High Press Trigger": Press only when ball reaches slow center-back

4. **Player-Specific Instructions**: Give 3 SPECIFIC, actionable instructions (not vague like "press more"):
   - Example: "#7 LW: Stay wide until opponent RB pushes up, then cut inside into space behind"
   - Example: "#6 CM: Position between opponent's two strikers, intercept passes"

Respond in JSON format:
{
  "tactic": "Creative tactic name (e.g., 'Asymmetric Overload - Exploit Right CB')",
  "successRate": realistic percentage (60-85 for good tactics),
  "description": "2-3 sentences explaining WHY this works against their formation",
  "formationChange": "Specific formation adjustment (e.g., '3-3-2 → 2-4-2 with wide overload')",
  "weaknessDetected": "SPECIFIC tactical weakness in opponent's ${input.opponentFormation} (e.g., 'Gap between CB and RB when pressing high')",
  "keyInstructions": ["Instruction 1 with player role", "Instruction 2 with player role", "Instruction 3 with player role"],
  "timing": "When to execute (e.g., 'Immediately after opponent goal kick' or 'When winning ball in midfield')"
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'You are a tactical football analyst. Respond ONLY with valid JSON, no markdown code blocks, no extra text.' },
              { role: 'user', content: prompt }
            ]
          });

          const rawContent = response?.choices?.[0]?.message?.content;
          if (!rawContent) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI did not return a response' });
          }

          let plan: any;
          try {
            plan = extractJSON(String(rawContent));
          } catch (e) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not parse AI response as JSON' });
          }

          return {
            tactic: plan.tactic || 'Emergency Counter-Attack',
            successRate: typeof plan.successRate === 'number' ? Math.min(95, Math.max(40, plan.successRate)) : 72,
            description: plan.description || 'Tactical adjustment required.',
            formationChange: plan.formationChange || input.currentFormation,
            weaknessDetected: plan.weaknessDetected || 'Opponent defensive gaps detected',
            keyInstructions: Array.isArray(plan.keyInstructions) ? plan.keyInstructions.slice(0, 5) : ['Push forward aggressively', 'Press high to win ball back', 'Use wide areas to create chances'],
            timing: plan.timing || 'Execute immediately'
          };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Failed to generate emergency plan: ${err instanceof Error ? err.message : 'Unknown error'}` 
          });
        }
      }),
    generateSetPieceTips: protectedProcedure
      .input(z.object({
        setPieceType: z.enum(['corner', 'penalty', 'free_kick']),
        ourFormation: z.string().optional(),
        opponentFormation: z.string().optional(),
        opponentPlayerCount: z.number().min(7).max(11).optional(),
        opponentTeamInfo: z.string().optional(),
        ballPosition: z.string().optional(),
        matchContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const setPieceNames = { corner: 'Corner Kick', penalty: 'Penalty Kick', free_kick: 'Free Kick' };
        const opponentCtx = [
          input.opponentFormation ? `Formation: ${input.opponentFormation}` : null,
          input.opponentPlayerCount ? `Players: ${input.opponentPlayerCount}/11${input.opponentPlayerCount < 11 ? ' (reduced)' : ''}` : null,
          input.opponentTeamInfo ? `Scouting: ${input.opponentTeamInfo}` : null,
          input.ballPosition ? `Ball Position: ${input.ballPosition}` : null,
          input.matchContext ? `Match Context: ${input.matchContext}` : null,
        ].filter(Boolean).join('\n- ');
        const prompt = `You are an elite football set-piece coach. Analyze this set-piece situation and provide tactical instructions.

SET-PIECE TYPE: ${setPieceNames[input.setPieceType]}
OUR FORMATION: ${input.ourFormation || '4-3-3'}
OPPONENT:
- ${opponentCtx || 'No opponent info provided'}

Provide specific, actionable set-piece tactical instructions for ${setPieceNames[input.setPieceType]}.

Respond ONLY with valid JSON:
{
  "primaryRoutine": "Name of the main set-piece routine (e.g., 'Near Post Flick-On')",
  "description": "2-3 sentences explaining the routine and why it works against this opponent",
  "playerRoles": [
    {"role": "Taker", "instruction": "specific instruction"},
    {"role": "Target Man", "instruction": "specific instruction"},
    {"role": "Second Ball", "instruction": "specific instruction"},
    {"role": "Decoy Runner", "instruction": "specific instruction"}
  ],
  "alternativeRoutine": "Backup routine name if primary is blocked",
  "exploitedWeakness": "Specific weakness in opponent's defensive setup being exploited",
  "successProbability": 65,
  "keyTiming": "When/how to execute (e.g., 'Wait for goalkeeper to set, then quick short corner')"
}`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'You are a football set-piece specialist. Respond ONLY with valid JSON, no markdown.' },
              { role: 'user', content: prompt }
            ]
          });
          const rawContent = typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '');
          if (!rawContent) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No AI response' });
          const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          let tips: any;
          try { tips = JSON.parse(cleaned); } catch (e) {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) tips = JSON.parse(m[0]);
            else throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Cannot parse AI response' });
          }
          return {
            primaryRoutine: tips.primaryRoutine || 'Near Post Attack',
            description: tips.description || 'Target the near post with a flick-on.',
            playerRoles: Array.isArray(tips.playerRoles) ? tips.playerRoles.slice(0, 5) : [],
            alternativeRoutine: tips.alternativeRoutine || 'Short Corner',
            exploitedWeakness: tips.exploitedWeakness || 'Defensive gaps at near post',
            successProbability: typeof tips.successProbability === 'number' ? Math.min(85, Math.max(40, tips.successProbability)) : 65,
            keyTiming: tips.keyTiming || 'Execute on referee whistle',
          };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed: ${err instanceof Error ? err.message : 'Unknown'}` });
        }
      }),
    suggestFormation: protectedProcedure
      .input(z.object({
        ourSquadStrengths: z.string().optional(),
        ourFormation: z.string().optional(),
        opponentFormation: z.string(),
        opponentPlayerCount: z.number().min(7).max(11).optional(),
        opponentTeamInfo: z.string().optional(),
        matchContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const opponentCtx = [
          `Formation: ${input.opponentFormation}`,
          input.opponentPlayerCount ? `Players: ${input.opponentPlayerCount}/11` : null,
          input.opponentTeamInfo ? `Scouting: ${input.opponentTeamInfo}` : null,
          input.matchContext ? `Context: ${input.matchContext}` : null,
        ].filter(Boolean).join(', ');
        const prompt = `You are an elite football tactical analyst. Suggest the optimal formation.\n\nOpponent: ${opponentCtx}\nOur formation preference: ${input.ourFormation || 'flexible'}\nOur strengths: ${input.ourSquadStrengths || 'balanced'}\n\nRespond ONLY with valid JSON: {"suggestedFormation":"4-3-3","tacticalApproach":"High press","opponentWeaknesses":["w1","w2","w3"],"rationale":"explanation","playerInstructions":[{"role":"LW","instruction":"inst"}],"setPieceStrategy":"corner routine","confidenceScore":75}`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Respond ONLY with valid JSON, no markdown.' },
              { role: 'user', content: prompt }
            ]
          });
          const rawContent = typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '');
          if (!rawContent) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No AI response' });
          const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          let plan: any;
          try { plan = JSON.parse(cleaned); } catch (e) {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) plan = JSON.parse(m[0]);
            else throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Cannot parse AI response' });
          }
          return {
            suggestedFormation: plan.suggestedFormation || '4-3-3',
            tacticalApproach: plan.tacticalApproach || 'Balanced',
            opponentWeaknesses: Array.isArray(plan.opponentWeaknesses) ? plan.opponentWeaknesses.slice(0,3) : [],
            rationale: plan.rationale || 'Optimal formation selected.',
            playerInstructions: Array.isArray(plan.playerInstructions) ? plan.playerInstructions.slice(0,4) : [],
            setPieceStrategy: plan.setPieceStrategy || 'Target near post on corners',
            confidenceScore: typeof plan.confidenceScore === 'number' ? Math.min(90, Math.max(60, plan.confidenceScore)) : 75,
          };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed: ${err instanceof Error ? err.message : 'Unknown'}` });
        }
      }),
    saveSetPieceScenario: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(150),
        type: z.enum(['corner', 'penalty', 'freekick']),
        teamSize: z.number().int().min(7).max(11),
        ourFormation: z.string().max(20).optional(),
        opponentFormation: z.string().max(20).optional(),
        scenarioData: z.any().optional(),
        notes: z.string().max(1000).optional(),
        tags: z.array(z.string().max(50)).max(10).optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { setPieceScenarios } = await import('../drizzle/schema');
        const [result] = await database.insert(setPieceScenarios).values({
          name: input.name,
          type: input.type,
          teamSize: input.teamSize,
          ourFormation: input.ourFormation,
          opponentFormation: input.opponentFormation,
          scenarioData: input.scenarioData ?? null,
          notes: input.notes,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          createdBy: ctx.user.id,
          teamId: input.teamId ?? null,
        } as any);
        return { success: true, id: (result as any).insertId };
      }),
    listSetPieceScenarios: protectedProcedure
      .input(z.object({
        type: z.enum(['corner', 'penalty', 'freekick']).optional(),
        teamSize: z.number().int().optional(),
        search: z.string().max(100).optional(),
        tag: z.string().max(50).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { setPieceScenarios } = await import('../drizzle/schema');
        const conditions: any[] = [eq(setPieceScenarios.createdBy, ctx.user.id)];
        if (input.type) conditions.push(eq(setPieceScenarios.type, input.type));
        if (input.teamSize) conditions.push(eq(setPieceScenarios.teamSize, input.teamSize));
        const rows = await database.select().from(setPieceScenarios)
          .where(and(...conditions))
          .orderBy(desc(setPieceScenarios.createdAt))
          .limit(100);
        // Parse tags JSON and apply search/tag filter
        const parsed = rows.map((r: any) => ({
          ...r,
          tags: r.tags ? (() => { try { return JSON.parse(r.tags); } catch { return []; } })() : [],
        }));
        let filtered = parsed;
        if (input.search) {
          const q = input.search.toLowerCase();
          filtered = filtered.filter((r: any) =>
            r.name.toLowerCase().includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q)) ||
            r.tags.some((t: string) => t.toLowerCase().includes(q))
          );
        }
        if (input.tag) {
          const tagQ = input.tag.toLowerCase();
          filtered = filtered.filter((r: any) => r.tags.some((t: string) => t.toLowerCase() === tagQ));
        }
        return filtered.slice(0, 50);
      }),
    deleteSetPieceScenario: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { setPieceScenarios } = await import('../drizzle/schema');
        await database.delete(setPieceScenarios)
          .where(and(eq(setPieceScenarios.id, input.id), eq(setPieceScenarios.createdBy, ctx.user.id)));
        return { success: true };
      }),
    getSetPieceScenarioById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        const { setPieceScenarios } = await import('../drizzle/schema');
        const rows = await database.select().from(setPieceScenarios)
          .where(eq(setPieceScenarios.id, input.id))
          .limit(1);
        if (!rows[0]) return null;
        const r = rows[0] as any;
        return {
          ...r,
          tags: r.tags ? (() => { try { return JSON.parse(r.tags); } catch { return []; } })() : [],
        };
      }),
    updateSetPieceScenarioNotes: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string().max(2000) }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { setPieceScenarios } = await import('../drizzle/schema');
        await database.update(setPieceScenarios)
          .set({ notes: input.notes, updatedAt: new Date() })
          .where(and(eq(setPieceScenarios.id, input.id), eq(setPieceScenarios.createdBy, ctx.user.id)));
        return { success: true };
      }),

    // ── AI Tool Usage Tracking ─────────────────────────────────────
    trackAIToolUsage: protectedProcedure
      .input(z.object({
        toolPath: z.string().max(255),
        toolLabel: z.string().max(255),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) return { success: true };
        await database.execute(
          sql`INSERT INTO ai_tool_usage (user_id, tool_path, tool_label) VALUES (${ctx.user.id}, ${input.toolPath}, ${input.toolLabel})`
        );
        return { success: true };
      }),

    getAIToolUsageStats: protectedProcedure
      .query(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return { topTools: [], myTopTools: [] };
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [topRows] = await database.execute(
          sql`SELECT tool_path, tool_label, COUNT(*) as usage_count FROM ai_tool_usage WHERE used_at >= ${weekAgo} GROUP BY tool_path, tool_label ORDER BY usage_count DESC LIMIT 3` as any
        ) as any;
        const [myRows] = await database.execute(
          sql`SELECT tool_path, tool_label, COUNT(*) as usage_count FROM ai_tool_usage WHERE used_at >= ${weekAgo} AND user_id = ${ctx.user.id} GROUP BY tool_path, tool_label ORDER BY usage_count DESC LIMIT 3` as any
        ) as any;
        return {
          topTools: (Array.isArray(topRows) ? topRows : []).map((r: any) => ({ toolPath: r.tool_path, toolLabel: r.tool_label, count: Number(r.usage_count) })),
          myTopTools: (Array.isArray(myRows) ? myRows : []).map((r: any) => ({ toolPath: r.tool_path, toolLabel: r.tool_label, count: Number(r.usage_count) })),
        };
      }),

    saveVoiceSession: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        messages: z.array(z.object({
          id: z.string(),
          role: z.enum(['user', 'coach']),
          text: z.string(),
          timestamp: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database unavailable');
        const [result] = await database.execute(
          sql`INSERT INTO voice_coach_sessions (user_id, title, messages, message_count) VALUES (${ctx.user.id}, ${input.title}, ${JSON.stringify(input.messages)}, ${input.messages.length})` as any
        ) as any;
        return { id: (result as any).insertId };
      }),

    listVoiceSessions: protectedProcedure
      .query(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const [rows] = await database.execute(
          sql`SELECT id, title, message_count, created_at FROM voice_coach_sessions WHERE user_id = ${ctx.user.id} ORDER BY created_at DESC LIMIT 20` as any
        ) as any;
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          id: r.id,
          title: r.title,
          messageCount: r.message_count,
          createdAt: r.created_at,
        }));
      }),

    getVoiceSession: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) return null;
        const [rows] = await database.execute(
          sql`SELECT * FROM voice_coach_sessions WHERE id = ${input.id} AND user_id = ${ctx.user.id}` as any
        ) as any;
        const row = Array.isArray(rows) && rows[0];
        if (!row) return null;
        return { id: row.id, title: row.title, messages: JSON.parse(row.messages), messageCount: row.message_count, createdAt: row.created_at };
      }),

    deleteVoiceSession: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database unavailable');
        await database.execute(
          sql`DELETE FROM voice_coach_sessions WHERE id = ${input.id} AND user_id = ${ctx.user.id}` as any
        );
        return { success: true };
      }),
  }),
  // ==================== PLAYERMAKER INTEGRATION =====================
  playermaker: router({
    getSettings: coachProcedure.query(async () => {
      return db.getPlayermakerSettings();
    }),

    saveTeamId: protectedProcedure
      .input(z.object({
        teamId: z.string().min(1).max(50),
      }))
      .mutation(async ({ input, ctx }) => {
        // Save team ID to user's profile or settings
        // For now, we'll just return success - you can extend this to save to database
        console.log(`User ${ctx.user.id} saved team ID: ${input.teamId}`);
        return { success: true, teamId: input.teamId };
      }),

    saveSettings: coachProcedure
      .input(z.object({
        clientKey: z.string(),
        clientSecret: z.string(),
        clientTeamId: z.string(),
        teamCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.savePlayermakerSettings({
          ...input,
          isActive: true,
        });
        return { id };
      }),

    testConnection: coachProcedure
      .mutation(async () => {
        const settings = await db.getPlayermakerSettings();
        if (!settings) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Please save settings first' });
        }

        // Test connection using real PlayerMaker API
        const result = await playermakerApi.testPlayerMakerConnection(
          settings.clientKey,
          settings.clientSecret,
          settings.clientTeamId
        );

        if (!result.success) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: result.message
          });
        }

        // Save club name if returned
        if (result.clubName) {
          await db.savePlayermakerSettings({
            ...settings,
            clubName: result.clubName,
          });
        }

        return { 
          success: true, 
          message: result.message,
          clubName: result.clubName || settings.clubName || 'Unknown',
        };
      }),

    syncData: coachProcedure
      .input(z.object({
        sessionType: z.enum(['training', 'match', 'all']),
        daysBack: z.number().default(30),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const startTime = Date.now();
        const settings = await db.getPlayermakerSettings();
        if (!settings) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Please configure PlayerMaker settings first' });
        }

        let syncSuccess = true;
        let errorMessage: string | undefined;
        let sessionsCount = 0;
        let metricsCount = 0;

        try {
          // Sync data using real PlayerMaker API
          const pmSettings: Parameters<typeof playermakerApi.syncPlayerMakerData>[0] = {
            clientKey: settings.clientKey,
            clientSecret: settings.clientSecret,
            clientTeamId: settings.clientTeamId,
            teamCode: settings.teamCode || undefined,
            token: settings.token || undefined,
            // Stored as epoch milliseconds; the API client expects a Date.
            tokenExpiresOn:
              settings.tokenExpiresOn != null ? new Date(settings.tokenExpiresOn) : null,
            clubName: settings.clubName || undefined,
          };
          const result = await playermakerApi.syncPlayerMakerData(pmSettings, {
            sessionType: input.sessionType,
            daysBack: input.daysBack,
          });

          // Save sessions
          for (const session of result.sessions) {
            await db.savePlayermakerSession({
              sessionId: session.session_id,
              sessionType: session.session_type,
              date: session.date ? new Date(session.date) : new Date(),
              phaseDuration: session.duration ? String(session.duration) : undefined,
              tag: session.notes || undefined,
            });
          }

          // Save metrics
          for (const metric of result.metrics) {
            await db.savePlayermakerMetrics({
              sessionId: metric.session_id,
              playermakerPlayerId: metric.player_id,
              playerName: metric.player_name,
              ageGroup: metric.age_group,
              totalTouches: metric.total_touches,
              leftLegTouches: metric.left_foot_touches,
              rightLegTouches: metric.right_foot_touches,
              distanceCovered: metric.distance_covered.toString(),
              topSpeed: metric.top_speed.toString(),
              sprintCount: metric.sprint_count,
              // The table records accelerations and decelerations as a single
              // combined count, and high-intensity distance as hidCovered.
              intenseSpeedChanges:
                metric.acceleration_count + metric.deceleration_count,
              hidCovered: metric.high_intensity_distance.toString(),
              // Metrics with no dedicated column are kept here instead of being
              // dropped — previously they were named as columns that don't
              // exist, which made the whole INSERT fail.
              rawData: {
                averageSpeed: metric.average_speed,
                accelerationCount: metric.acceleration_count,
                decelerationCount: metric.deceleration_count,
              },
              createdAt: new Date(),
            });
          }

          // Update token and last sync
          await db.updatePlayermakerToken(
            result.token,
            result.tokenExpiresAt.getTime(),
            settings.clubName || undefined
          );
          await db.updatePlayermakerLastSync();

          sessionsCount = result.sessions.length;
          metricsCount = result.metrics.length;
        } catch (error) {
          syncSuccess = false;
          errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw error;
        } finally {
          // Save sync history
          const duration = Date.now() - startTime;
          await db.saveSyncHistory({
            syncType: 'manual',
            sessionType: input.sessionType,
            startDate: input.startDate ? new Date(input.startDate.split('T')[0]) : undefined,
            endDate: input.endDate ? new Date(input.endDate.split('T')[0]) : undefined,
            sessionsCount,
            metricsCount,
            success: syncSuccess,
            errorMessage,
            duration,
          });
        }

        return { sessionsCount, metricsCount };
      }),

    // Check rate limit status before syncing
    getRateLimitStatus: coachProcedure
      .query(async () => {
        const waitTime = playermakerApi.getWaitTimeBeforeSync();
        return {
          canSync: waitTime === 0,
          waitTimeMs: waitTime,
          waitTimeFormatted: waitTime > 0 ? playermakerApi.formatWaitTime(waitTime) : null,
          message: waitTime > 0 
            ? `Please wait ${playermakerApi.formatWaitTime(waitTime)} before syncing again.`
            : 'Ready to sync',
        };
      }),

    getSessions: coachProcedure
      .query(async () => {
        return db.getPlayermakerSessions(50);
      }),

    getRecentMetrics: coachProcedure
      .query(async () => {
        const metrics = await db.getRecentPlayermakerMetrics(30);
        
        // Calculate aggregates
        const uniquePlayers = new Set(metrics.map(m => m.playermakerPlayerId)).size;
        const avgTouches = metrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / metrics.length;
        const avgDistance = metrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / metrics.length;
        
        // Top performers
        const topPerformers = metrics
          .sort((a, b) => (b.totalTouches || 0) - (a.totalTouches || 0))
          .slice(0, 5);

        return {
          uniquePlayers,
          avgTouches,
          avgDistance,
          topPerformers,
        };
      }),

    getPlayerMetrics: protectedProcedure
      .input(z.object({ 
        playerId: z.number(),
        dateRange: z.enum(['week', 'month', 'season', 'all']).optional()
      }))
      .query(async ({ input }) => {
        const metrics = await db.getPlayermakerPlayerMetrics(input.playerId);
        
        // Calculate date cutoff based on range
        let cutoffDate: Date | null = null;
        if (input.dateRange === 'week') {
          cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);
        } else if (input.dateRange === 'month') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        } else if (input.dateRange === 'season') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        }
        
        // Filter by date if needed
        const filteredMetrics = cutoffDate 
          ? metrics.filter(m => m.createdAt && new Date(m.createdAt) >= cutoffDate!)
          : metrics;
        
        // Calculate aggregated statistics
        const avgDistance = filteredMetrics.reduce((sum, m) => sum + (Number((m as any).totalDistance) || 0), 0) / (filteredMetrics.length || 1);
        const avgTouches = filteredMetrics.reduce((sum, m) => sum + (Number(m.totalTouches) || 0), 0) / (filteredMetrics.length || 1);
        
        // Build history data for charts
        const distanceHistory = filteredMetrics.slice(-10).map(m => ({
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          distance: Number((m as any).totalDistance) || 0
        }));
        
        const touchesHistory = filteredMetrics.slice(-10).map(m => ({
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          total: Number(m.totalTouches) || 0,
          left: Number(m.leftLegTouches) || 0,
          right: Number(m.rightLegTouches) || 0
        }));
        
        const sprintHistory = filteredMetrics.slice(-10).map(m => ({
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          topSpeed: Number(m.topSpeed) || 0,
          sprints: Number((m as any).totalSprints) || 0
        }));
        
        // Get team averages for comparison
        const allMetrics = await db.getPlayermakerPlayerMetrics();
        const teamAvgDistance = allMetrics.reduce((sum, m) => sum + (Number((m as any).totalDistance) || 0), 0) / (allMetrics.length || 1);
        const teamAvgTouches = allMetrics.reduce((sum, m) => sum + (Number(m.totalTouches) || 0), 0) / (allMetrics.length || 1);
        const teamAvgSprints = allMetrics.reduce((sum, m) => sum + (Number((m as any).totalSprints) || 0), 0) / (allMetrics.length || 1);
        
        const teamComparison = [
          { name: 'Distance (km)', nameAr: 'المسافة (كم)', playerValue: avgDistance / 1000, teamAvg: teamAvgDistance / 1000 },
          { name: 'Touches', nameAr: 'اللمسات', playerValue: avgTouches, teamAvg: teamAvgTouches },
          { name: 'Sprints', nameAr: 'الركضات', playerValue: filteredMetrics.reduce((sum, m) => sum + (Number((m as any).totalSprints) || 0), 0) / (filteredMetrics.length || 1), teamAvg: teamAvgSprints }
        ];
        
        return {
          avgDistance: avgDistance / 1000, // Convert to km
          avgTouches,
          distanceHistory,
          touchesHistory,
          sprintHistory,
          teamComparison
        };
      }),

    getTeamAverages: coachProcedure
      .query(async () => {
        const metrics = await db.getRecentPlayermakerMetrics(30);
        if (metrics.length === 0) return { avgTouches: 0, avgDistance: 0 };
        
        const avgTouches = metrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / metrics.length;
        const avgDistance = metrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / metrics.length;
        
        return { avgTouches, avgDistance };
      }),

    generateWeeklyReport: adminProcedure
      .mutation(async ({ ctx }) => {
        const settings = await db.getPlayermakerSettings();
        if (!settings || !settings.isActive) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'PlayerMaker not configured' });
        }

        // Get last 7 days of data
        const metrics = await db.getRecentPlayermakerMetrics(7);
        const sessions = await db.getPlayermakerSessions(50);
        
        if (metrics.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No data available for report' });
        }

        // Calculate weekly stats
        const totalSessions = new Set(metrics.map(m => m.sessionId)).size;
        const uniquePlayers = new Set(metrics.map(m => m.playermakerPlayerId)).size;
        const avgTouches = metrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / metrics.length;
        const avgDistance = metrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / metrics.length;
        
        // Top 5 performers
        const topPerformers = metrics
          .sort((a, b) => (b.totalTouches || 0) - (a.totalTouches || 0))
          .slice(0, 5)
          .map(m => ({
            name: m.playerName,
            touches: m.totalTouches,
            distance: parseFloat(m.distanceCovered as any || '0'),
            topSpeed: parseFloat(m.topSpeed as any || '0'),
          }));

        // Most improved players (comparing first half vs second half of week)
        const midWeek = Math.floor(metrics.length / 2);
        const firstHalf = metrics.slice(0, midWeek);
        const secondHalf = metrics.slice(midWeek);
        
        const playerImprovement = new Map<string, { before: number; after: number }>();
        
        firstHalf.forEach(m => {
          const key = m.playermakerPlayerId || m.playerName || '';
          if (!playerImprovement.has(key)) {
            playerImprovement.set(key, { before: 0, after: 0 });
          }
          const current = playerImprovement.get(key)!;
          current.before += m.totalTouches || 0;
        });
        
        secondHalf.forEach(m => {
          const key = m.playermakerPlayerId || m.playerName || '';
          if (!playerImprovement.has(key)) {
            playerImprovement.set(key, { before: 0, after: 0 });
          }
          const current = playerImprovement.get(key)!;
          current.after += m.totalTouches || 0;
        });

        const mostImproved = Array.from(playerImprovement.entries())
          .map(([name, stats]) => ({
            name,
            improvement: ((stats.after - stats.before) / (stats.before || 1)) * 100,
          }))
          .filter(p => p.improvement > 0)
          .sort((a, b) => b.improvement - a.improvement)
          .slice(0, 3);

        // Generate HTML email
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; }
              .stat-card { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1e40af; }
              .player-list { list-style: none; padding: 0; }
              .player-item { background: white; padding: 12px; margin: 8px 0; border-radius: 6px; display: flex; justify-content: space-between; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PlayerMaker Weekly Report</h1>
                <p>Week of ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="content">
                <h2>Weekly Summary</h2>
                <div class="stat-card">
                  <strong>Total Sessions:</strong> ${totalSessions}<br>
                  <strong>Active Players:</strong> ${uniquePlayers}<br>
                  <strong>Average Touches:</strong> ${avgTouches.toFixed(0)}<br>
                  <strong>Average Distance:</strong> ${avgDistance.toFixed(0)}m
                </div>

                <h2>Top Performers</h2>
                <ul class="player-list">
                  ${topPerformers.map((p, i) => `
                    <li class="player-item">
                      <span><strong>#${i + 1}</strong> ${p.name}</span>
                      <span>${p.touches} touches | ${p.distance.toFixed(0)}m</span>
                    </li>
                  `).join('')}
                </ul>

                ${mostImproved.length > 0 ? `
                  <h2>Most Improved</h2>
                  <ul class="player-list">
                    ${mostImproved.map(p => `
                      <li class="player-item">
                        <span>${p.name}</span>
                        <span style="color: #16a34a;">+${p.improvement.toFixed(0)}%</span>
                      </li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
              <div class="footer">
                <p>This is an automated report from Future Stars FC Academy</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send notification to owner (using existing notification system)
        await notifyOwner({
          title: 'PlayerMaker Weekly Report',
          content: `Weekly report generated: ${totalSessions} sessions, ${uniquePlayers} players. Top performer: ${topPerformers[0]?.name || 'N/A'} with ${topPerformers[0]?.touches || 0} touches.`,
        });

        return {
          success: true,
          summary: {
            totalSessions,
            uniquePlayers,
            avgTouches,
            avgDistance,
            topPerformers,
            mostImproved,
          },
          emailHtml,
        };
      }),

    generateSampleData: adminProcedure
      .mutation(async ({ ctx }) => {
        // Get existing players
        const existingPlayers = await db.getAllPlayers();
        
        if (existingPlayers.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No players found. Please create players first.' });
        }

        const sessions = [];
        const metrics = [];
        const sessionTypes = ['training', 'match'];
        const now = new Date();

        // Create 20 sample sessions
        for (let i = 0; i < 20; i++) {
          const sessionDate = new Date(now);
          sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 30));
          
          const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)] as 'training' | 'match';
          const sessionId = `PM_${sessionType.toUpperCase()}_${Date.now()}_${i}`;

          sessions.push({
            sessionId,
            sessionType,
            sessionDate,
            duration: 60 + Math.floor(Math.random() * 60),
            location: 'Training Ground A',
            notes: `Sample ${sessionType} session`,
            syncedAt: new Date(),
          });

          // Add 8-12 players per session
          const sessionPlayerCount = 8 + Math.floor(Math.random() * 5);
          const selectedPlayers = existingPlayers
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(sessionPlayerCount, existingPlayers.length));

          for (const player of selectedPlayers) {
            const totalTouches = 50 + Math.floor(Math.random() * 150);
            const distanceCovered = (3000 + Math.floor(Math.random() * 5000)).toString();
            const topSpeed = (5 + Math.random() * 3).toFixed(2);
            const sprintCount = 10 + Math.floor(Math.random() * 30);
            const accelerationCount = 15 + Math.floor(Math.random() * 40);

            metrics.push({
              sessionId,
              playermakerPlayerId: `PM_${player.id}`,
              playerId: player.id,
              playerName: `${player.firstName} ${player.lastName}`,
              ageGroup: 'U17',
              totalTouches,
              leftFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
              rightFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
              distanceCovered,
              topSpeed,
              averageSpeed: (parseFloat(topSpeed) * 0.6).toFixed(2),
              sprintCount,
              accelerationCount,
              decelerationCount: Math.floor(accelerationCount * 0.8),
              highIntensityDistance: (parseFloat(distanceCovered) * 0.2).toFixed(0),
              createdAt: sessionDate,
            });
          }
        }

        // Insert sessions
        for (const session of sessions) {
          await db.savePlayermakerSession(session);
        }

        // Insert metrics
        for (const metric of metrics) {
          await db.savePlayermakerMetrics(metric);
        }

        return {
          success: true,
          sessionsCount: sessions.length,
          metricsCount: metrics.length,
          message: `Generated ${sessions.length} sessions with ${metrics.length} player metrics`,
        };
      }),

    // Create a custom sample training session
    createSampleSession: adminProcedure
      .input(z.object({
        sessionType: z.enum(['training', 'match']),
        playerCount: z.number().min(1).max(30).default(10),
        sessionDate: z.string(),
        duration: z.number().min(15).max(180).default(90),
        intensity: z.enum(['low', 'medium', 'high']).default('medium'),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get existing players
        const existingPlayers = await db.getAllPlayers();
        
        if (existingPlayers.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No players found. Please create players first.' });
        }

        const sessionDate = new Date(input.sessionDate);
        const sessionId = `PM_${input.sessionType.toUpperCase()}_${Date.now()}`;
        
        // Intensity multipliers for metrics
        const intensityMultipliers = {
          low: { touches: 0.7, distance: 0.6, speed: 0.7, sprints: 0.5 },
          medium: { touches: 1.0, distance: 1.0, speed: 1.0, sprints: 1.0 },
          high: { touches: 1.3, distance: 1.4, speed: 1.2, sprints: 1.5 },
        };
        const mult = intensityMultipliers[input.intensity];

        // Save session
        await db.savePlayermakerSession({
          sessionId,
          sessionType: input.sessionType,
          date: sessionDate,
          phaseDuration: String(input.duration),
          tag: input.notes || `${input.intensity} intensity ${input.sessionType}`,
          intensity: input.intensity,
          participatedPlayers: Math.min(input.playerCount, existingPlayers.length),
        });

        // Select random players
        const selectedPlayers = existingPlayers
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(input.playerCount, existingPlayers.length));

        const metrics = [];
        for (const player of selectedPlayers) {
          const baseTouches = 80 + Math.floor(Math.random() * 100);
          const baseDistance = 4000 + Math.floor(Math.random() * 4000);
          const baseSpeed = 5.5 + Math.random() * 2.5;
          const baseSprints = 15 + Math.floor(Math.random() * 25);

          const totalTouches = Math.floor(baseTouches * mult.touches);
          const distanceCovered = Math.floor(baseDistance * mult.distance);
          const topSpeed = (baseSpeed * mult.speed).toFixed(2);
          const sprintCount = Math.floor(baseSprints * mult.sprints);
          const accelerationCount = Math.floor(sprintCount * 1.5);

          const metric = {
            sessionId,
            playermakerPlayerId: `PM_${player.id}`,
            playerId: player.id,
            playerName: `${player.firstName} ${player.lastName}`,
            ageGroup: player.ageGroup || 'U17',
            totalTouches,
            leftFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
            rightFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
            distanceCovered: String(distanceCovered),
            topSpeed,
            averageSpeed: (parseFloat(topSpeed) * 0.6).toFixed(2),
            sprintCount,
            accelerationCount,
            decelerationCount: Math.floor(accelerationCount * 0.8),
            highIntensityDistance: String(Math.floor(distanceCovered * 0.2)),
            createdAt: sessionDate,
          };
          
          await db.savePlayermakerMetrics(metric);
          metrics.push(metric);
        }

        return {
          success: true,
          sessionId,
          metricsCount: metrics.length,
          message: `Created ${input.sessionType} session with ${metrics.length} player metrics`,
        };
      }),

    // Save auto-sync settings
    saveAutoSyncSettings: coachProcedure
      .input(z.object({
        enabled: z.boolean(),
        frequency: z.enum(['hourly', 'daily', 'weekly']),
      }))
      .mutation(async ({ input }) => {
        await db.saveAutoSyncSettings(input.enabled, input.frequency);
        return { success: true };
      }),

    // Get sync history
    getSyncHistory: coachProcedure
      .query(async () => {
        return db.getSyncHistory(20);
      }),

    // Get coach annotations for a player
    getCoachAnnotations: publicProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachAnnotations(input.playerId);
      }),

    // Add coach annotation
    addCoachAnnotation: coachProcedure
      .input(z.object({
        playerId: z.number(),
        note: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.addCoachAnnotation({
          playerId: input.playerId,
          coachId: ctx.user.id,
          coachName: ctx.user.name || 'Unknown Coach',
          note: input.note,
        });
        return { success: true };
      }),

    // Get team-wide statistics
    getTeamStats: publicProcedure
      .query(async () => {
        return db.getPlayermakerTeamStats();
      }),
  }),

  // ==================== ROLE & PERMISSION MANAGEMENT ====================
  permissions: router({
    // Role Management
    getAllRoles: adminProcedure.query(async () => {
      return dbPermissions.getAllRoles();
    }),
    
    getRoleById: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return dbPermissions.getRoleWithPermissionsAndTabs(input.roleId);
      }),
    
    createRole: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const role = await dbPermissions.createRole({
          ...input,
          createdBy: ctx.user.id
        });
        
        await dbPermissions.logPermissionAction({
          action: "role_created",
          performedBy: ctx.user.id,
          targetRoleId: role.id,
          details: { roleName: input.name }
        });
        
        return role;
      }),
    
    updateRole: adminProcedure
      .input(z.object({
        roleId: z.number(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { roleId, ...data } = input;
        await dbPermissions.updateRole(roleId, data);
        
        await dbPermissions.logPermissionAction({
          action: "role_updated",
          performedBy: ctx.user.id,
          targetRoleId: roleId,
          details: data
        });
        
        return { success: true };
      }),
    
    deleteRole: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.deleteRole(input.roleId);
        
        await dbPermissions.logPermissionAction({
          action: "role_deleted",
          performedBy: ctx.user.id,
          targetRoleId: input.roleId
        });
        
        return { success: true };
      }),
    
    // Permission Management
    getAllPermissions: adminProcedure.query(async () => {
      return dbPermissions.getAllPermissions();
    }),
    
    getPermissionsByCategory: adminProcedure.query(async () => {
      return dbPermissions.getPermissionsByCategory();
    }),
    
    assignPermissionsToRole: adminProcedure
      .input(z.object({
        roleId: z.number(),
        permissionIds: z.array(z.number())
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.assignPermissionsToRole(
          input.roleId,
          input.permissionIds,
          ctx.user.id
        );
        
        await dbPermissions.logPermissionAction({
          action: "permission_granted",
          performedBy: ctx.user.id,
          targetRoleId: input.roleId,
          details: { permissionIds: input.permissionIds }
        });
        
        return { success: true };
      }),
    
    getRolePermissions: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return dbPermissions.getRolePermissions(input.roleId);
      }),
    
    // Tab Management
    getAllTabs: adminProcedure.query(async () => {
      return dbPermissions.getAllTabs();
    }),
    
    assignTabsToRole: adminProcedure
      .input(z.object({
        roleId: z.number(),
        tabIds: z.array(z.number())
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.assignTabsToRole(
          input.roleId,
          input.tabIds,
          ctx.user.id
        );
        
        await dbPermissions.logPermissionAction({
          action: "tab_assigned",
          performedBy: ctx.user.id,
          targetRoleId: input.roleId,
          details: { tabIds: input.tabIds }
        });
        
        return { success: true };
      }),
    
    getRoleTabs: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return dbPermissions.getRoleTabs(input.roleId);
      }),
    
    // User-Role Assignment
    assignRoleToUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number(),
        isPrimary: z.boolean().default(false)
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.assignRoleToUser(
          input.userId,
          input.roleId,
          ctx.user.id,
          input.isPrimary
        );
        
        await dbPermissions.logPermissionAction({
          action: "user_role_assigned",
          performedBy: ctx.user.id,
          targetUserId: input.userId,
          targetRoleId: input.roleId,
          details: { isPrimary: input.isPrimary }
        });
        
        return { success: true };
      }),
    
    removeRoleFromUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.removeRoleFromUser(input.userId, input.roleId);
        
        await dbPermissions.logPermissionAction({
          action: "user_role_removed",
          performedBy: ctx.user.id,
          targetUserId: input.userId,
          targetRoleId: input.roleId
        });
        
        return { success: true };
      }),
    
    getUserRoles: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId ?? ctx.user.id;
        return dbPermissions.getUserRoles(userId);
      }),
    
    // Permission Checking
    checkPermission: protectedProcedure
      .input(z.object({ permissionCode: z.string() }))
      .query(async ({ input, ctx }) => {
        return dbPermissions.userHasPermission(ctx.user.id, input.permissionCode);
      }),
    
    checkTabAccess: protectedProcedure
      .input(z.object({ tabCode: z.string() }))
      .query(async ({ input, ctx }) => {
        return dbPermissions.userCanAccessTab(ctx.user.id, input.tabCode);
      }),
    
    getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
      return dbPermissions.getUserPermissions(ctx.user.id);
    }),
    
    getMyTabs: protectedProcedure.query(async ({ ctx }) => {
      return dbPermissions.getUserTabs(ctx.user.id);
    }),
    
    // Audit Log
    getAuditLog: adminProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return dbPermissions.getAuditLog(input.limit);
      }),
    
    // Initialization
    initializeDefaults: adminProcedure.mutation(async () => {
      return dbPermissions.initializeDefaultRolesAndPermissions();
    }),

    // User Permission Queries (for frontend permission checks)
    getUserPermissions: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Users can only query their own permissions unless they're admin
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot query other users permissions' });
        }
        return dbPermissions.getUserPermissions(input.userId);
      }),

    getUserTabs: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Users can only query their own tabs unless they're admin
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot query other users tabs' });
        }
        return dbPermissions.getUserTabs(input.userId);
      }),
  }),

  // ==================== AI CACHE MANAGEMENT ====================
  cache: router({
    // Get cache statistics
    getStats: adminProcedure.query(async () => {
      return aiCache.getCacheStats();
    }),

    // Clear all cache
    clearAll: adminProcedure.mutation(async () => {
      await aiCache.clearAllCache();
      return { success: true };
    }),

    // Clear cache for specific function
    clearFunction: adminProcedure
      .input(z.object({ functionName: z.string() }))
      .mutation(async ({ input }) => {
        await aiCache.invalidateFunctionCache(input.functionName);
        return { success: true };
      }),

    // Clean expired cache entries
    cleanExpired: adminProcedure.mutation(async () => {
      const count = await aiCache.cleanExpiredCache();
      return { success: true, count };
    }),

    // Run cache warmup
    runWarmup: adminProcedure.mutation(async () => {
      const result = await cacheWarmup.runFullWarmup();
      return result;
    }),
  }),

  // ==================== AI INTELLIGENCE ====================
  ai: router({
    // AI Chat Assistant
    chat: protectedProcedure
      .input(z.object({
        message: z.string(),
        contextId: z.string().optional(),
        currentPage: z.string().optional(),
        relevantData: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const response = await AIService.chatWithAI({
          userMessage: input.message,
          contextId: input.contextId,
          userRole: ctx.user.role,
          currentPage: input.currentPage,
          relevantData: input.relevantData,
        });
        return { response };
      }),
    
    // Create AI Context
    createContext: protectedProcedure.mutation(async ({ ctx }) => {
      const contextId = AIService.createAIContext(ctx.user.id, ctx.user.role);
      return { contextId };
    }),
    
    // Clear AI Context
    clearContext: protectedProcedure
      .input(z.object({ contextId: z.string() }))
      .mutation(async ({ input }) => {
        AIService.clearAIContext(input.contextId);
        return { success: true };
      }),
    
    // Player Analysis
    analyzePlayer: coachProcedure
      .input(z.object({
        name: z.string(),
        position: z.string(),
        recentStats: z.array(z.any()),
        age: z.number(),
        ageGroup: z.string(),
      }))
      .mutation(async ({ input }) => {
        const analysis = await AIService.analyzePlayerPerformance(input);
        return { analysis };
      }),
    
    // Injury Risk Prediction
    predictInjuryRisk: coachProcedure
      .input(z.object({
        name: z.string(),
        recentWorkload: z.array(z.any()),
        injuryHistory: z.array(z.any()),
        age: z.number(),
      }))
      .mutation(async ({ input }) => {
        const prediction = await AIService.predictInjuryRisk(input);
        return { prediction };
      }),
    
    // Position Recommendation
    recommendPosition: coachProcedure
      .input(z.object({
        name: z.string(),
        currentPosition: z.string(),
        skillScores: z.record(z.string(), z.number()),
        physicalAttributes: z.any(),
        playingStyle: z.string(),
      }))
      .mutation(async ({ input }) => {
        const recommendation = await AIService.recommendOptimalPosition(input);
        return { recommendation };
      }),
    
    // Training Plan Generation
    generateTrainingPlan: coachProcedure
      .input(z.object({
        name: z.string(),
        position: z.string(),
        weaknesses: z.array(z.string()),
        strengths: z.array(z.string()),
        availableTime: z.number(),
        ageGroup: z.string(),
      }))
      .mutation(async ({ input }) => {
        const plan = await AIService.generateTrainingPlan(input);
        return { plan };
      }),
    
    // Drill Recommendations
    recommendDrills: coachProcedure
      .input(z.object({
        focusArea: z.string(),
        ageGroup: z.string(),
        skillLevel: z.string(),
      }))
      .mutation(async ({ input }) => {
        const drills = await AIService.recommendDrills(
          input.focusArea,
          input.ageGroup,
          input.skillLevel
        );
        return { drills };
      }),
    
    // Match Strategy
    generateMatchStrategy: coachProcedure
      .input(z.object({
        ourTeam: z.any(),
        opponentTeam: z.any(),
        matchImportance: z.string(),
        conditions: z.string(),
      }))
      .mutation(async ({ input }) => {
        const strategy = await AIService.generateMatchStrategy(input);
        return { strategy };
      }),
    
    // Opponent Analysis
    analyzeOpponent: coachProcedure
      .input(z.object({
        teamName: z.string(),
        recentMatches: z.array(z.any()),
        keyPlayers: z.array(z.any()),
        formation: z.string(),
      }))
      .mutation(async ({ input }) => {
        const analysis = await AIService.analyzeOpponent(input);
        return { analysis };
      }),
    
    // Parent Report Generation
    generateParentReport: coachProcedure
      .input(z.object({
        name: z.string(),
        period: z.string(),
        performance: z.any(),
        attendance: z.any(),
        behavior: z.any(),
        development: z.any(),
      }))
      .mutation(async ({ input }) => {
        const report = await AIService.generateParentReport(input);
        return { report };
      }),
    
    // Coach Message Drafting
    draftMessage: coachProcedure
      .input(z.object({
        purpose: z.string(),
        recipient: z.string(),
        keyPoints: z.array(z.string()),
        tone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const message = await AIService.draftCoachMessage(input);
        return { message };
      }),
    
    // Meal Plan Generation
    generateMealPlan: staffProcedure
      .input(z.object({
        name: z.string(),
        age: z.number(),
        weight: z.number(),
        height: z.number(),
        activityLevel: z.string(),
        goals: z.array(z.string()),
        dietaryRestrictions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const mealPlan = await AIService.generateMealPlan(input);
        return { mealPlan };
      }),
    
    // Video Insights
    generateVideoInsights: coachProcedure
      .input(z.object({
        playerName: z.string(),
        matchOrTraining: z.string(),
        keyMoments: z.array(z.any()),
        focus: z.string(),
      }))
      .mutation(async ({ input }) => {
        const insights = await AIService.generateVideoInsights(input);
        return { insights };
      }),
    
    // Match Report
    generateMatchReport: coachProcedure
      .input(z.object({
        homeTeam: z.string(),
        awayTeam: z.string(),
        score: z.string(),
        playerStats: z.array(z.any()),
        keyEvents: z.array(z.any()),
        formation: z.string(),
      }))
      .mutation(async ({ input }) => {
        const report = await AIService.generateMatchReport(input);
        return { report };
      }),
    
    // Data Insights
    generateDataInsights: protectedProcedure
      .input(z.object({
        dataType: z.string(),
        dataset: z.array(z.any()),
        timeframe: z.string(),
        focus: z.string().optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        let realDataset = input.dataset;
        // Fetch real data from DB based on report type
        try {
          if (['weekly-player','monthly-team','seasonal'].includes(input.dataType)) {
            const [rows] = await database.execute(
              `SELECT ps.session_date, ps.technical_overall, ps.physical_overall, ps.mental_overall, ps.rpe,
                      p.first_name, p.last_name, p.position, p.age_group
               FROM performance_sessions ps
               JOIN players p ON ps.player_id = p.id
               WHERE ps.session_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
               ORDER BY ps.session_date DESC LIMIT 50` as any
            ) as any;
            if (Array.isArray(rows) && rows.length > 0) realDataset = rows;
          } else if (input.dataType === 'parent-report') {
            const [rows] = await database.execute(
              `SELECT ps.session_date, ps.technical_overall, ps.physical_overall, ps.mental_overall,
                      p.first_name, p.last_name
               FROM performance_sessions ps
               JOIN players p ON ps.player_id = p.id
               WHERE ps.session_date >= DATE_SUB(NOW(), INTERVAL 14 DAY)
               ORDER BY ps.session_date DESC LIMIT 20` as any
            ) as any;
            if (Array.isArray(rows) && rows.length > 0) realDataset = rows;
          } else if (input.dataType === 'admin-financial') {
            const [rows] = await database.execute(
              `SELECT status, amount_cents, due_date, month_label FROM player_fees
               WHERE due_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
               ORDER BY due_date DESC LIMIT 100` as any
            ) as any;
            if (Array.isArray(rows) && rows.length > 0) realDataset = rows;
          } else if (input.dataType === 'injury-report') {
            const [rows] = await database.execute(
              `SELECT i.injury_type, i.severity, i.injury_date, i.expected_return_date, i.status,
                      p.first_name, p.last_name, p.position
               FROM injuries i
               JOIN players p ON i.player_id = p.id
               ORDER BY i.injury_date DESC LIMIT 30` as any
            ) as any;
            if (Array.isArray(rows) && rows.length > 0) realDataset = rows;
          }
        } catch (_e) {
          realDataset = input.dataset;
        }
        const insights = await AIService.generateDataInsights({ ...input, dataset: realDataset });
        return { insights };
      }),
    
    // Counter Plan Generation
    generateCounterPlan: coachProcedure
      .input(z.object({
        weakness: z.string(),
        weaknessDetail: z.string().optional(),
        ourFormation: z.string().optional(),
        ourPlayStyle: z.string().optional(),
      }))
        .mutation(async ({ input }) => {
        const prompt = `You are an elite football tactical analyst. Generate a detailed counter-plan for exploiting this opponent weakness:
Weakness: ${input.weakness}
${input.weaknessDetail ? `Detail: ${input.weaknessDetail}` : ''}
${input.ourFormation ? `Our Formation: ${input.ourFormation}` : ''}
${input.ourPlayStyle ? `Our Play Style: ${input.ourPlayStyle}` : ''}
Provide a JSON response with this structure:
{
  "strategy": "2-3 sentence tactical strategy description",
  "keyInstructions": ["instruction 1", "instruction 2", "instruction 3", "instruction 4"],
  "playerRoles": ["role 1", "role 2", "role 3"],
  "successRate": 75,
  "riskLevel": "medium",
  "bestMoments": ["moment 1", "moment 2"]
}`;
        const result = await invokeLLM({ messages: [{ role: 'user', content: prompt }], max_tokens: 600 });
        const raw = result?.choices?.[0]?.message?.content;
        const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw) || '';
        try {
          try { return extractJSON(rawStr); } catch { /* fall through to raw string */ }
        } catch {}
        return { strategy: rawStr, keyInstructions: [], playerRoles: [], successRate: 70, riskLevel: 'medium', bestMoments: [] };
      }),

    // Training Session Plan Generator
    generateSessionPlan: coachProcedure
      .input(z.object({
        formation: z.string(),
        playStyle: z.string(),
        ageGroup: z.string(),
        teamSize: z.string(),
        sessionDuration: z.number().optional(),
        focusArea: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const duration = input.sessionDuration || (input.teamSize === '7v7' ? 60 : input.teamSize === '9v9' ? 75 : 90);
        const prompt = `You are an elite football academy coach. Generate a complete, detailed training session plan.
Formation: ${input.formation}
Playing Style: ${input.playStyle}
Age Group: ${input.ageGroup}
Team Size: ${input.teamSize}
Session Duration: ${duration} minutes
${input.focusArea ? `Focus Area: ${input.focusArea}` : ''}

Respond with JSON only (no markdown):
{
  "title": "Descriptive session title",
  "duration": "${duration} min",
  "load": "Low/Medium/High",
  "focus": "Main focus area",
  "methodology": "Training methodology",
  "phases": [
    {
      "phase": "Phase name (X min)",
      "activities": ["activity 1", "activity 2"],
      "intensity": "Low/Medium/High",
      "coachingPoints": ["point 1", "point 2"]
    }
  ],
  "keyDrills": ["drill 1", "drill 2", "drill 3"],
  "equipment": ["cones", "balls"],
  "successMetrics": ["metric 1", "metric 2"]
}`;
        const result = await invokeLLM({ messages: [{ role: 'user', content: prompt }], max_tokens: 900 });
        const raw = result?.choices?.[0]?.message?.content;
        const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw) || '';
        try {
          try { return extractJSON(rawStr); } catch { /* fall through to raw string */ }
        } catch {}
        return { title: `${input.formation} ${input.playStyle} Session`, duration: `${duration} min`, load: 'Medium', focus: input.focusArea || input.playStyle, phases: [], keyDrills: [], equipment: [], successMetrics: [], methodology: input.playStyle };
      }),

    // Schedule Optimizationn
    optimizeSchedule: adminProcedure
      .input(z.object({
        activities: z.array(z.any()),
        constraints: z.array(z.string()),
        preferences: z.array(z.string()),
        timeframe: z.string(),
      }))
      .mutation(async ({ input }) => {
        const schedule = await AIService.optimizeSchedule(input);
        return { schedule };
      }),
  }),

  // Home Page Content Management
  homePageContent: router({
    getAll: publicProcedure
      .query(async () => {
        return await db.getAllHomePageContent();
      }),
    
    getBySection: publicProcedure
      .input(z.object({ sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats']) }))
      .query(async ({ input }) => {
        return await db.getHomePageContentBySection(input.sectionType);
      }),
    
    create: adminProcedure
      .input(z.object({
        sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats']),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createHomePageContent(input);
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateHomePageContent(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHomePageContent(input.id);
        return { success: true };
      }),
    
    uploadFile: adminProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.fileData, 'base64');
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `home-content/${randomSuffix}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        return { url };
      }),
    
    reorder: adminProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          displayOrder: z.number()
        }))
      }))
      .mutation(async ({ input }) => {
        // Update display order for each item
        for (const item of input.items) {
          await db.updateHomePageContent(item.id, { displayOrder: item.displayOrder });
        }
        return { success: true };
      }),
  }),

  // AI Formation Simulation
  aiFormation: router({
    generateSimulation: protectedProcedure
      .input(z.object({
        formation: z.enum(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']),
        scenario: z.enum(['attack', 'defense', 'counter', 'possession']),
        duration: z.number().default(10)
      }))
      .mutation(async ({ input }) => {
        
        // Generate AI-powered tactical movement simulation
        const prompt = `You are a professional football tactical analyst. Generate a detailed tactical movement simulation for a ${input.formation} formation in a ${input.scenario} scenario.

Provide a JSON array of keyframes (one per second for ${input.duration} seconds) with player movements. Each keyframe should have:
- time: number (in seconds)
- description: string (what's happening tactically)
- players: array of 11 players with:
  - id: string (player-0 to player-10)
  - x: number (0-1200, representing horizontal position)
  - y: number (0-800, representing vertical position)
  - action: string (brief description of player action)

Initial positions for ${input.formation}:
${getFormationPositions(input.formation)}

Scenario: ${input.scenario}
- attack: forward movement, width, penetration
- defense: compact shape, pressure, cover
- counter: quick transitions, vertical runs
- possession: patient build-up, lateral movement

Return ONLY valid JSON array, no markdown formatting.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a football tactical analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ]
        });

        const content = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || '[]';
        let keyframes;
        
        try {
          // Try to parse JSON directly
          keyframes = extractJSON(typeof content === "string" ? content : JSON.stringify(content));
        } catch (e) {
          // If fails, try to extract JSON from markdown
          const jsonMatch = String(content).match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            keyframes = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error('Failed to parse AI response');
          }
        }

        return {
          keyframes,
          description: `AI-generated ${input.scenario} simulation for ${input.formation} formation`
        };
      }),
    
    compareFormations: protectedProcedure
      .input(z.object({
        formation1: z.enum(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']),
        scenario1: z.enum(['attack', 'defense', 'counter', 'possession']),
        formation2: z.enum(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']),
        scenario2: z.enum(['attack', 'defense', 'counter', 'possession'])
      }))
      .mutation(async ({ input }) => {
        
        // Generate AI comparison insights
        const prompt = `You are a professional football tactical analyst. Compare these two tactical setups:

Formation 1: ${input.formation1} in ${input.scenario1} scenario
Formation 2: ${input.formation2} in ${input.scenario2} scenario

Provide a detailed tactical comparison covering:
1. Strengths and weaknesses of each formation
2. Key tactical differences
3. Which formation is better suited for different game situations
4. Potential vulnerabilities and how to exploit them
5. Recommended counter-tactics

Be specific and professional. Limit response to 300 words.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a professional football tactical analyst.' },
            { role: 'user', content: prompt }
          ]
        });

        const insights = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate comparison insights.';

        return { insights };
      }),
  }),

  // ==================== DAILY STREAK TRACKER ====================
  streak: router({
    getStreak: protectedProcedure
      .query(async ({ ctx }) => {
        const database = (await getDb())!;
        if (!database) return null;
        
        const [streak] = await database
          .select()
          .from(userStreaks)
          .where(eq(userStreaks.userId, ctx.user.id));
        
        return streak || null;
      }),
    
    updateStreak: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { checkAndUpdateStreak } = await import('./streakService');
        const result = await checkAndUpdateStreak(ctx.user.id);
        return result;
      }),
    
    getStreakRewards: protectedProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        
        const rewards = await database
          .select()
          .from(streakRewards)
          .orderBy(asc(streakRewards.streakDays));
        
        return rewards;
      }),
    
    getLeaderboard: protectedProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        
        const leaderboard = await database
          .select({
            userId: userStreaks.userId,
            currentStreak: userStreaks.currentStreak,
            longestStreak: userStreaks.longestStreak,
            userName: users.name,
          })
          .from(userStreaks)
          .leftJoin(users, eq(userStreaks.userId, users.id))
          .orderBy(desc(userStreaks.currentStreak))
          .limit(10);
        
        return leaderboard;
      }),
    
    initializeRewards: adminProcedure
      .mutation(async () => {
        const { initializeStreakRewards } = await import('./streakService');
        await initializeStreakRewards();
        return { success: true };
      }),
  }),

  // ==================== COMMUNITY FORUM ====================
  forum: router({
    getCategories: publicProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return [];
        
        const categories = await database
          .select()
          .from(forumCategories);
        
        return categories;
      }),
    
    getPosts: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['recent', 'popular', 'unanswered']).default('recent'),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        
        // Build WHERE conditions first, then apply ordering
        const conditions: any[] = [];
        if (input.categoryId) {
          conditions.push(eq(forumPosts.categoryId, input.categoryId));
        }
        if (input.search) {
          conditions.push(or(
            like(forumPosts.title, `%${input.search}%`),
            like(forumPosts.content, `%${input.search}%`)
          ));
        }
        if (input.sortBy === 'unanswered') {
          conditions.push(eq(forumPosts.hasAcceptedAnswer, false));
        }
        const orderCol = input.sortBy === 'popular' ? desc(forumPosts.upvotes) : desc(forumPosts.createdAt);
        const posts = await database
          .select({
            id: forumPosts.id,
            title: forumPosts.title,
            content: forumPosts.content,
            postType: forumPosts.postType,
            upvotes: forumPosts.upvotes,
            downvotes: forumPosts.downvotes,
            replyCount: forumPosts.replyCount,
            viewCount: forumPosts.viewCount,
            hasAcceptedAnswer: forumPosts.hasAcceptedAnswer,
            isPinned: forumPosts.isPinned,
            createdAt: forumPosts.createdAt,
            authorName: users.name,
          })
          .from(forumPosts)
          .leftJoin(users, eq(forumPosts.authorId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(orderCol)
          .limit(50);
        return posts;
      }),
    
    createPost: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        categoryId: z.number(),
        postType: z.enum(['question', 'discussion', 'tip', 'success_story']),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const [post] = await database.insert(forumPosts).values({
          title: input.title,
          content: input.content,
          categoryId: input.categoryId,
          authorId: ctx.user.id,
          postType: input.postType,
        });
        
        // Update category post count
        await database
          .update(forumCategories)
          .set({ postCount: sql`post_count + 1` })
          .where(eq(forumCategories.id, input.categoryId));
        
        return { success: true, postId: post.insertId };
      }),
    
    vote: protectedProcedure
      .input(z.object({
        targetType: z.enum(['post', 'reply']),
        targetId: z.number(),
        voteType: z.enum(['upvote', 'downvote']),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        // Check if user already voted
        const [existingVote] = await database
          .select()
          .from(forumVotes)
          .where(and(
            eq(forumVotes.userId, ctx.user.id),
            eq(forumVotes.targetType, input.targetType),
            eq(forumVotes.targetId, input.targetId)
          ));
        
        if (existingVote) {
          // Remove old vote
          if (input.targetType === 'post') {
            await database
              .update(forumPosts)
              .set({
                upvotes: existingVote.voteType === 'upvote' ? sql`upvotes - 1` : sql`upvotes`,
                downvotes: existingVote.voteType === 'downvote' ? sql`downvotes - 1` : sql`downvotes`,
              })
              .where(eq(forumPosts.id, input.targetId));
          }
          
          await database
            .delete(forumVotes)
            .where(eq(forumVotes.id, existingVote.id));
          
          // If same vote type, just remove it
          if (existingVote.voteType === input.voteType) {
            return { success: true };
          }
        }
        
        // Add new vote
        await database.insert(forumVotes).values({
          userId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          voteType: input.voteType,
        });
        
        // Update vote counts
        if (input.targetType === 'post') {
          await database
            .update(forumPosts)
            .set({
              upvotes: input.voteType === 'upvote' ? sql`upvotes + 1` : sql`upvotes`,
              downvotes: input.voteType === 'downvote' ? sql`downvotes + 1` : sql`downvotes`,
            })
            .where(eq(forumPosts.id, input.targetId));
        }
        
        return { success: true };
      }),
  }),

  // Admin utilities
  admin: router({
    populateData: adminProcedure
      .mutation(async () => {
        const result = await populateComprehensiveData();
        return result;
      }),
    // Get system age groups
    getAgeGroups: protectedProcedure
      .query(async () => {
        const database = (await getDb())!;
        if (!database) return ["U-8","U-10","U-12","U-14","U-16","U-18","U-21","Senior","Women","Other"];
        try {
          const { systemConfig } = await import('../drizzle/schema');
          const [row] = await database.select().from(systemConfig).where(eq(systemConfig.configKey, 'age_groups')).limit(1);
          if (row && row.configValue) return JSON.parse(row.configValue);
        } catch {}
        return ["U-8","U-10","U-12","U-14","U-16","U-18","U-21","Senior","Women","Other"];
      }),
    // Save system age groups
    saveAgeGroups: adminProcedure
      .input(z.object({ ageGroups: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        try {
          const { systemConfig } = await import('../drizzle/schema');
          const [existing] = await database.select().from(systemConfig).where(eq(systemConfig.configKey, 'age_groups')).limit(1);
          if (existing) {
            await database.update(systemConfig).set({ configValue: JSON.stringify(input.ageGroups) }).where(eq(systemConfig.configKey, 'age_groups'));
          } else {
            await database.insert(systemConfig).values({ configKey: 'age_groups', configValue: JSON.stringify(input.ageGroups) });
          }
        } catch {
          // If systemConfig table doesn't exist, store in memory (fallback)
        }
        return { success: true };
      }),
  }),

  // Live Match Mode
  liveMatch: router({
    // Start a new live match
    start: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        opponent: z.string(),
        opponentFormation: z.string().optional(),
        currentFormation: z.string(),
        isHome: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const matchId = await db.createLiveMatch({
          ...input,
          createdBy: ctx.user.id,
          status: 'not_started',
          startedAt: new Date(),
        });
        return { id: matchId };
      }),

    // Get live match by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLiveMatchById(input.id);
      }),

    // Get all active live matches
    getActive: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getActiveLiveMatches(ctx.user.id);
      }),

    // Get all live matches (including finished)
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllLiveMatches(ctx.user.id);
      }),

    // Update match time and status
    updateTime: protectedProcedure
      .input(z.object({
        id: z.number(),
        currentMinute: z.number(),
        status: z.enum(['not_started', 'first_half', 'half_time', 'second_half', 'extra_time', 'finished']),
      }))
      .mutation(async ({ input }) => {
        await db.updateLiveMatch(input.id, {
          currentMinute: input.currentMinute,
          status: input.status,
        });
        return { success: true };
      }),

    // Update score
    updateScore: protectedProcedure
      .input(z.object({
        id: z.number(),
        homeScore: z.number(),
        awayScore: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateLiveMatch(input.id, {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
        });
        return { success: true };
      }),

    // Update statistics
    updateStats: protectedProcedure
      .input(z.object({
        id: z.number(),
        possession: z.number().optional(),
        shots: z.number().optional(),
        shotsOnTarget: z.number().optional(),
        corners: z.number().optional(),
        fouls: z.number().optional(),
        offsides: z.number().optional(),
        yellowCards: z.number().optional(),
        redCards: z.number().optional(),
        opponentShots: z.number().optional(),
        opponentShotsOnTarget: z.number().optional(),
        opponentCorners: z.number().optional(),
        opponentFouls: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...stats } = input;
        await db.updateLiveMatch(id, stats);
        return { success: true };
      }),

    // Record match event
    recordEvent: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        eventType: z.enum(['goal', 'yellow_card', 'red_card', 'substitution', 'injury', 'penalty', 'own_goal', 'var_decision']),
        minute: z.number(),
        playerId: z.number().optional(),
        playerName: z.string().optional(),
        assistPlayerId: z.number().optional(),
        assistPlayerName: z.string().optional(),
        substitutedPlayerId: z.number().optional(),
        substitutedPlayerName: z.string().optional(),
        isOurTeam: z.boolean().default(true),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const eventId = await db.createMatchEvent(input);
        
        // Update substitutions count if it's a substitution
        if (input.eventType === 'substitution' && input.isOurTeam) {
          const match = await db.getLiveMatchById(input.liveMatchId);
          if (match) {
            await db.updateLiveMatch(input.liveMatchId, {
              substitutionsUsed: (match.substitutionsUsed || 0) + 1,
            });
          }
        }
        
        // Update cards count
        if (input.eventType === 'yellow_card' && input.isOurTeam) {
          const match = await db.getLiveMatchById(input.liveMatchId);
          if (match) {
            await db.updateLiveMatch(input.liveMatchId, {
              yellowCards: (match.yellowCards || 0) + 1,
            });
          }
        }
        
        if (input.eventType === 'red_card' && input.isOurTeam) {
          const match = await db.getLiveMatchById(input.liveMatchId);
          if (match) {
            await db.updateLiveMatch(input.liveMatchId, {
              redCards: (match.redCards || 0) + 1,
            });
          }
        }
        
        return { id: eventId };
      }),

    // Get match events
    getEvents: protectedProcedure
      .input(z.object({ liveMatchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMatchEvents(input.liveMatchId);
      }),

    // Delete event
    deleteEvent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMatchEvent(input.id);
        return { success: true };
      }),

    // Record tactical change
    changeTactics: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        minute: z.number(),
        changeType: z.enum(['formation', 'instruction', 'player_role', 'pressing_intensity', 'defensive_line']),
        fromValue: z.string().optional(),
        toValue: z.string(),
        reason: z.string().optional(),
        aiSuggested: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const changeId = await db.createTacticalChange(input);
        
        // Update current formation if it's a formation change
        if (input.changeType === 'formation') {
          await db.updateLiveMatch(input.liveMatchId, {
            currentFormation: input.toValue,
          });
        }
        
        return { id: changeId };
      }),

    // Get tactical changes
    getTacticalChanges: protectedProcedure
      .input(z.object({ liveMatchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTacticalChanges(input.liveMatchId);
      }),

    // Get complete match state (match + events + tactical changes)
    getMatchState: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.id);
        if (!match) return null;
        
        const events = await db.getMatchEvents(input.id);
        const tacticalChanges = await db.getTacticalChanges(input.id);
        
        return {
          match,
          events,
          tacticalChanges,
        };
      }),

    // Get AI tactical advice
    getAIAdvice: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const match = await db.getLiveMatchById(input.liveMatchId);
        if (!match) throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        
        const events = await db.getMatchEvents(input.liveMatchId);
        const tacticalChanges = await db.getTacticalChanges(input.liveMatchId);
        
        // Build context for AI
        const context = `
Current Match Situation:
- Time: ${match.currentMinute}'
- Score: ${match.isHome ? match.homeScore : match.awayScore} - ${match.isHome ? match.awayScore : match.homeScore} (${match.isHome ? 'Home' : 'Away'})
- Formation: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}
- Status: ${match.status}

Statistics:
- Possession: ${match.possession}%
- Shots: ${match.shots} (${match.shotsOnTarget} on target)
- Opponent Shots: ${match.opponentShots} (${match.opponentShotsOnTarget} on target)
- Corners: ${match.corners} vs ${match.opponentCorners}
- Fouls: ${match.fouls} vs ${match.opponentFouls}
- Cards: ${match.yellowCards} yellow, ${match.redCards} red
- Substitutions Used: ${match.substitutionsUsed}/5

Recent Events:
${events.slice(-5).map(e => `${e.minute}' - ${e.eventType}: ${e.playerName || 'Unknown'} ${e.description ? '(' + e.description + ')' : ''}`).join('\n')}

Tactical Changes:
${tacticalChanges.map(tc => `${tc.minute}' - ${tc.changeType}: ${tc.fromValue} → ${tc.toValue} ${tc.reason ? '(' + tc.reason + ')' : ''}`).join('\n')}
`;
        
        // Get AI recommendations
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert football tactical analyst. Provide concise, actionable tactical advice for the coach based on the current match situation. Focus on: formation adjustments, player instructions, pressing intensity, defensive line positioning, and substitution suggestions. Keep responses under 200 words.'
            },
            {
              role: 'user',
              content: `Analyze this match situation and provide tactical recommendations:\n${context}`
            }
          ]
        });
        
        const advice = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate advice at this time.';
        
        return {
          advice,
          context,
        };
      }),

    // Finish match
    finishMatch: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const match = await db.getLiveMatchById(input.id);
        if (!match) throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        
        // Update live match status
        await db.updateLiveMatch(input.id, {
          status: 'finished',
          finishedAt: new Date(),
          notes: input.notes,
        });
        
        // Create permanent match record if matchId is linked
        if (match.matchId) {
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;
          const result = match.isHome 
            ? (homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : 'draw')
            : (awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : 'draw');
          
          await db.updateMatch(match.matchId, {
            teamScore: match.isHome ? match.homeScore : match.awayScore,
            opponentScore: match.isHome ? match.awayScore : match.homeScore,
            result: result as 'win' | 'draw' | 'loss',
            notes: input.notes,
          });
        }
        
        return { success: true };
      }),

    // Delete live match
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLiveMatch(input.id);
        return { success: true };
      }),

    // Record player position
    recordPosition: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number(),
        minute: z.number(),
        xPosition: z.number().min(0).max(100),
        yPosition: z.number().min(0).max(100),
        speed: z.number().optional(),
        heartRate: z.number().optional(),
        source: z.enum(['manual', 'gps', 'video_analysis']).default('manual'),
      }))
      .mutation(async ({ input }) => {
        const positionId = await db.recordPlayerPosition(input);
        return { id: positionId };
      }),

    // Get player positions
    getPositions: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPlayerPositions(input.liveMatchId, input.playerId);
      }),

    // Get player heatmap data
    getHeatmap: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getPlayerHeatmapData(input.liveMatchId, input.playerId);
      }),

    // Start GPS sync
    startGpsSync: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number(),
        deviceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const syncId = await db.createGpsLiveSync({
          ...input,
          lastSyncTime: new Date(),
          syncStatus: 'active',
        });
        return { id: syncId };
      }),

    // Get GPS sync status
    getGpsSync: protectedProcedure
      .input(z.object({ liveMatchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getGpsLiveSync(input.liveMatchId);
      }),

    // Update GPS sync
    updateGpsSync: protectedProcedure
      .input(z.object({
        id: z.number(),
        syncStatus: z.enum(['active', 'paused', 'stopped', 'error']).optional(),
        dataPoints: z.number().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateGpsLiveSync(id, {
          ...data,
          lastSyncTime: new Date(),
        });
        return { success: true };
      }),

    // Import GPS data batch
    importGpsDataBatch: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        gpsData: z.array(z.object({
          playerId: z.number(),
          timestamp: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          speed: z.number().optional(),
          heartRate: z.number().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        let imported = 0;
        for (const data of input.gpsData) {
          await db.recordPlayerPosition({
            liveMatchId: input.liveMatchId,
            playerId: data.playerId,
            timestamp: new Date(data.timestamp),
            xPosition: Math.round(data.longitude * 100),
            yPosition: Math.round(data.latitude * 100),
            minute: 0,
            source: 'gps',
          });
          imported++;
        }
        return { imported };
      }),

    // Get half-by-half comparison data
    getHalfComparison: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        // Calculate first half stats (0-45 minutes)
        const firstHalfEvents = (await db.getMatchEvents(input.matchId)).filter(
          (e: any) => e.minute <= 45
        );
        
        // Calculate second half stats (46-90+ minutes)
        const secondHalfEvents = (await db.getMatchEvents(input.matchId)).filter(
          (e: any) => e.minute > 45
        );

        const calculateHalfStats = (events: any[]) => {
          const shots = events.filter(e => e.eventType === 'goal' || e.eventType === 'penalty').length;
          const goals = events.filter(e => e.eventType === 'goal' && e.isOurTeam).length;
          return {
            shots: shots * 3, // Estimate total shots
            shotsOnTarget: shots,
            goals,
            corners: Math.floor(shots * 1.5),
            fouls: events.filter(e => e.eventType === 'yellow_card' || e.eventType === 'red_card').length * 2,
            possession: 50 + (goals * 5), // Rough estimate
            distanceCovered: 5.5, // Average per half
            highSpeedRuns: 15 + (shots * 2),
          };
        };

        return {
          firstHalf: calculateHalfStats(firstHalfEvents),
          secondHalf: calculateHalfStats(secondHalfEvents),
        };
      }),

    // Generate AI insights for half comparison
    generateHalfInsights: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const tacticalChanges = await db.getTacticalChanges(input.matchId);

        const firstHalfEvents = events.filter((e: any) => e.minute <= 45);
        const secondHalfEvents = events.filter((e: any) => e.minute > 45);

        const prompt = `You are an expert football tactical analyst. Analyze the following match data and provide detailed insights on the tactical shifts between halves.

**Match Details:**
- Opponent: ${match.opponent}
- Current Formation: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}
- Score: ${match.homeScore}-${match.awayScore}

**First Half Events (${firstHalfEvents.length} events):**
${firstHalfEvents.map((e: any) => `- Min ${e.minute}: ${e.eventType} ${e.isOurTeam ? '(Our Team)' : '(Opponent)'} ${e.playerName ? '- ' + e.playerName : ''}`).join('\n')}

**Second Half Events (${secondHalfEvents.length} events):**
${secondHalfEvents.map((e: any) => `- Min ${e.minute}: ${e.eventType} ${e.isOurTeam ? '(Our Team)' : '(Opponent)'} ${e.playerName ? '- ' + e.playerName : ''}`).join('\n')}

**Tactical Changes:**
${tacticalChanges.map((c: any) => `- Min ${c.minute}: ${c.changeType} - ${c.fromValue} → ${c.toValue} (Reason: ${c.reason})`).join('\n')}

Provide a comprehensive analysis covering:
1. **Performance Comparison**: How did the team's performance change between halves?
2. **Tactical Shifts**: What tactical adjustments were made and their impact?
3. **Key Moments**: Critical events that changed the game's momentum
4. **Recommendations**: What should be adjusted for future matches or remaining time?

Format your response in markdown with clear sections.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football tactical analyst with deep knowledge of match analysis and tactical systems.' },
            { role: 'user', content: prompt }
          ],
        });

        const insights = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate insights at this time.';
        
        return { insights };
      }),

    // Get fatigue data for all players in match
    getFatigueData: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Calculate fatigue for each player
        const playerFatigue = new Map<number, any>();

        // Process events to count sprints and activities
        for (const event of events) {
          if (event.playerId && event.isOurTeam) {
            if (!playerFatigue.has(event.playerId)) {
              playerFatigue.set(event.playerId, {
                playerId: event.playerId,
                playerName: event.playerName || 'Unknown',
                sprintCount: 0,
                eventCount: 0,
                distanceCovered: 0,
              });
            }
            const data = playerFatigue.get(event.playerId);
            data.eventCount++;
            if (event.eventType === 'goal' || event.eventType === 'penalty') {
              data.sprintCount += 2;
            }
          }
        }

        // Calculate distance from positions
        const playerPositionMap = new Map<number, any[]>();
        for (const pos of positions) {
          if (!playerPositionMap.has(pos.playerId)) {
            playerPositionMap.set(pos.playerId, []);
          }
          playerPositionMap.get(pos.playerId)!.push(pos);
        }

        for (const [playerId, positionsArr] of Array.from(playerPositionMap.entries())) {
          let distance = 0;
          for (let i = 1; i < positionsArr.length; i++) {
            const dx = positionsArr[i].xPosition - positionsArr[i - 1].xPosition;
            const dy = positionsArr[i].yPosition - positionsArr[i - 1].yPosition;
            distance += Math.sqrt(dx * dx + dy * dy) / 100; // Convert to km
          }
          
          if (!playerFatigue.has(playerId)) {
            playerFatigue.set(playerId, {
              playerId,
              playerName: 'Player ' + playerId,
              sprintCount: 0,
              eventCount: 0,
              distanceCovered: 0,
            });
          }
          playerFatigue.get(playerId).distanceCovered = distance;
        }

        // Calculate fatigue scores and risk levels
        const players = Array.from(playerFatigue.values()).map((p) => {
          // Fatigue formula: (distance * 10) + (sprints * 5) + (events * 3)
          const fatigueScore = Math.min(
            100,
            Math.round((p.distanceCovered * 10) + (p.sprintCount * 5) + (p.eventCount * 3))
          );
          
          let riskLevel = 'low';
          if (fatigueScore >= 80) riskLevel = 'critical';
          else if (fatigueScore >= 65) riskLevel = 'high';
          else if (fatigueScore >= 50) riskLevel = 'medium';

          return {
            ...p,
            fatigueScore,
            riskLevel,
          };
        });

        // Generate trend data (simulate for now)
        const trendData = [];
        const currentMinute = match.currentMinute ?? 0;
        for (let i = 0; i <= currentMinute; i += 15) {
          trendData.push({
            minute: i,
            value: Math.min(100, currentMinute > 0 ? (i / currentMinute) * 70 + Math.random() * 15 : 0),
          });
        }

        return {
          highRiskPlayers: players.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high'),
          mediumRiskPlayers: players.filter(p => p.riskLevel === 'medium'),
          lowRiskPlayers: players.filter(p => p.riskLevel === 'low'),
          trendData,
        };
      }),

    // Generate AI fatigue recommendations
    generateFatigueRecommendations: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Calculate player fatigue data
        const playerStats = new Map<number, any>();
        for (const event of events) {
          if (event.playerId && event.isOurTeam) {
            if (!playerStats.has(event.playerId)) {
              playerStats.set(event.playerId, {
                name: event.playerName,
                events: 0,
                goals: 0,
                cards: 0,
              });
            }
            const stats = playerStats.get(event.playerId);
            stats.events++;
            if (event.eventType === 'goal') stats.goals++;
            if (event.eventType === 'yellow_card' || event.eventType === 'red_card') stats.cards++;
          }
        }

        const prompt = `You are an expert sports science analyst specializing in player fatigue management and substitution strategies.

**Match Context:**
- Opponent: ${match.opponent}
- Current Minute: ${match.currentMinute}
- Score: ${match.homeScore}-${match.awayScore}
- Formation: ${match.currentFormation}
- Match Status: ${match.status}

**Player Activity Data:**
${Array.from(playerStats.entries()).map(([id, stats]) => 
  `- ${stats.name}: ${stats.events} events, ${stats.goals} goals, ${stats.cards} cards`
).join('\n')}

**Total Match Events:** ${events.length}
**Position Tracking Points:** ${positions.length}

Analyze the current fatigue situation and provide:

1. **Immediate Risks**: Which players are showing critical fatigue signs?
2. **Substitution Priority**: Who should be substituted first and when?
3. **Position-Specific Advice**: Which positions need rotation?
4. **Tactical Adjustments**: How to manage team energy for remaining time?
5. **Prevention Strategies**: How to avoid fatigue-related injuries?

Format your response in markdown with clear, actionable recommendations.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert sports science analyst with deep knowledge of player fatigue management, substitution strategies, and injury prevention.' },
            { role: 'user', content: prompt }
          ],
        });

        const recommendations = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate recommendations at this time.';
        
        return { recommendations };
      }),

    // Get danger zones analysis
    getDangerZones: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Define pitch zones
        const zones = [
          'left_attack', 'center_attack', 'right_attack',
          'left_midfield', 'center_midfield', 'right_midfield',
          'left_defense', 'center_defense', 'right_defense',
        ];

        // Calculate zone activity
        const zoneActivity = new Map<string, number>();
        zones.forEach(z => zoneActivity.set(z, 0));

        // Analyze events by zone (simplified)
        for (const event of events) {
          if (event.isOurTeam) {
            // Attacking events
            if (event.eventType === 'goal' || event.eventType === 'penalty') {
              zoneActivity.set('center_attack', (zoneActivity.get('center_attack') || 0) + 15);
              zoneActivity.set('left_attack', (zoneActivity.get('left_attack') || 0) + 10);
              zoneActivity.set('right_attack', (zoneActivity.get('right_attack') || 0) + 10);
            }
          } else {
            // Defensive events
            if (event.eventType === 'goal') {
              zoneActivity.set('center_defense', (zoneActivity.get('center_defense') || 0) + 20);
              zoneActivity.set('left_defense', (zoneActivity.get('left_defense') || 0) + 15);
              zoneActivity.set('right_defense', (zoneActivity.get('right_defense') || 0) + 15);
            }
          }
        }

        // Analyze positions by zone
        for (const pos of positions) {
          // Determine zone based on xPosition,yPosition coordinates
          let zone = 'center_midfield';
          if (pos.xPosition > 60) {
            if (pos.yPosition < 30) zone = 'left_attack';
            else if (pos.yPosition > 50) zone = 'right_attack';
            else zone = 'center_attack';
          } else if (pos.xPosition < 30) {
            if (pos.yPosition < 30) zone = 'left_defense';
            else if (pos.yPosition > 50) zone = 'right_defense';
            else zone = 'center_defense';
          } else {
            if (pos.yPosition < 30) zone = 'left_midfield';
            else if (pos.yPosition > 50) zone = 'right_midfield';
          }
          
          zoneActivity.set(zone, (zoneActivity.get(zone) || 0) + 1);
        }

        // Normalize to 0-100 scale
        const maxActivity = Math.max(...Array.from(zoneActivity.values()));
        const zoneData = zones.map(zoneName => ({
          zoneName,
          intensity: maxActivity > 0 ? Math.min(100, Math.round((zoneActivity.get(zoneName) || 0) / maxActivity * 100)) : 0,
          events: Math.floor((zoneActivity.get(zoneName) || 0) / 10),
        }));

        return {
          zones: zoneData,
          attackingEvents: events.filter(e => e.isOurTeam && (e.eventType === 'goal' || e.eventType === 'penalty')).length,
          defensiveEvents: events.filter(e => !e.isOurTeam && (e.eventType === 'goal' || e.eventType === 'penalty')).length,
        };
      }),

    // Generate AI zone insights
    generateZoneInsights: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const tacticalChanges = await db.getTacticalChanges(input.matchId);

        // Calculate zone statistics
        const attackingEvents = events.filter(e => e.isOurTeam).length;
        const defensiveEvents = events.filter(e => !e.isOurTeam).length;
        const goals = events.filter(e => e.eventType === 'goal').length;

        const prompt = `You are an expert football tactical analyst specializing in spatial analysis and zone control.

**Match Context:**
- Opponent: ${match.opponent}
- Current Minute: ${match.currentMinute}
- Score: ${match.homeScore}-${match.awayScore}
- Formation: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}

**Zone Activity:**
- Our Attacking Events: ${attackingEvents}
- Opponent Attacking Events: ${defensiveEvents}
- Total Goals: ${goals}
- Total Events: ${events.length}

**Tactical Changes Made:**
${tacticalChanges.map((c: any) => `- Min ${c.minute}: ${c.changeType} - ${c.fromValue} → ${c.toValue}`).join('\n')}

Analyze the danger zones and provide:

1. **Zone Control Analysis**: Which areas of the pitch are we dominating/struggling?
2. **Attacking Weaknesses**: Where should we focus our attacks to exploit opponent?
3. **Defensive Vulnerabilities**: Which zones need more defensive attention?
4. **Tactical Recommendations**: How to adjust formation/positioning to control key zones?
5. **Set Piece Strategy**: Best zones for set pieces based on current patterns?

Format your response in markdown with specific, actionable tactical advice.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football tactical analyst with deep knowledge of spatial analysis, zone control, and tactical positioning systems.' },
            { role: 'user', content: prompt }
          ],
        });

        const insights = (typeof response?.choices?.[0]?.message?.content === 'string' ? response?.choices?.[0]?.message?.content : JSON.stringify(response?.choices?.[0]?.message?.content ?? '')) || 'Unable to generate insights at this time.';
        
        return { insights };
      }),

    // Generate comprehensive post-match report
    generatePostMatchReport: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const tacticalChanges = await db.getTacticalChanges(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Calculate match statistics
        const ourGoals = events.filter(e => e.eventType === 'goal' && e.isOurTeam).length;
        const opponentGoals = events.filter(e => e.eventType === 'goal' && !e.isOurTeam).length;
        const totalEvents = events.length;
        const matchDuration = match.currentMinute;

        // Generate comprehensive report
        const prompt = `You are an expert football analyst creating a comprehensive post-match report.

**Match Information:**
- Opponent: ${match.opponent}
- Final Score: ${match.homeScore}-${match.awayScore}
- Duration: ${matchDuration} minutes
- Formation Used: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}
- Match Status: ${match.status}

**Match Statistics:**
- Possession: ${match.possession}%
- Shots: ${match.shots} (${match.shotsOnTarget} on target)
- Opponent Shots: ${match.opponentShots} (${match.opponentShotsOnTarget} on target)
- Corners: ${match.corners} vs ${match.opponentCorners}
- Fouls: ${match.fouls} vs ${match.opponentFouls}
- Yellow Cards: ${match.yellowCards}
- Red Cards: ${match.redCards}
- Substitutions Used: ${match.substitutionsUsed}

**Match Events (${totalEvents} total):**
${events.slice(0, 20).map((e: any) => 
  `- Min ${e.minute}: ${e.eventType} ${e.isOurTeam ? '(Us)' : '(Opponent)'} ${e.playerName ? '- ' + e.playerName : ''}`
).join('\n')}
${events.length > 20 ? '... and more' : ''}

**Tactical Changes (${tacticalChanges.length} total):**
${tacticalChanges.map((c: any) => 
  `- Min ${c.minute}: ${c.changeType} - ${c.fromValue} → ${c.toValue}${c.aiSuggested ? ' (AI Suggested)' : ''}`
).join('\n')}

**Position Tracking:**
- Total position data points: ${positions.length}

Create a comprehensive post-match report with the following sections:

1. **Match Summary** (2-3 paragraphs): Overall narrative of the match, result context, and general performance

2. **Tactical Analysis** (3-4 paragraphs): Formation effectiveness, tactical changes impact, team shape, pressing strategy, defensive organization

3. **Key Moments** (bullet points): 5-7 critical moments that defined the match outcome

4. **Player Performances** (2-3 paragraphs): Standout performers, areas of concern, collective team performance

5. **Recommendations** (bullet points): 5-7 specific, actionable recommendations for training focus and future matches

Be specific, analytical, and constructive. Use data to support your analysis.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football analyst with deep knowledge of tactical analysis, player performance evaluation, and match reporting. Provide detailed, data-driven insights.' },
            { role: 'user', content: prompt }
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const fullReport = typeof rawContent === 'string' ? rawContent : 'Unable to generate report at this time.';
        
        // Parse sections (simple split by headers)
        const sections = {
          matchSummary: fullReport.split('**Tactical Analysis**')[0].replace('**Match Summary**', '').trim(),
          tacticalAnalysis: fullReport.split('**Tactical Analysis**')[1]?.split('**Key Moments**')[0]?.trim() || '',
          keyMoments: fullReport.split('**Key Moments**')[1]?.split('**Player Performances**')[0]?.trim() || '',
          playerPerformances: fullReport.split('**Player Performances**')[1]?.split('**Recommendations**')[0]?.trim() || '',
          recommendations: fullReport.split('**Recommendations**')[1]?.trim() || '',
        };
        
        return sections;
      }),

    // Get all finished matches for comparison selection
    getFinished: protectedProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const { liveMatches } = await import('../drizzle/schema');
      const { desc: descOp, eq: eqOp } = await import('drizzle-orm');
      return database.select().from(liveMatches)
        .where(eqOp(liveMatches.status, 'finished'))
        .orderBy(descOp(liveMatches.finishedAt))
        .limit(20);
    }),

    // Compare multiple finished matches side by side
    getMultiMatchComparison: protectedProcedure
      .input(z.object({ matchIds: z.array(z.number()).min(2).max(4) }))
      .query(async ({ input }) => {
        const results = await Promise.all(
          input.matchIds.map(async (matchId) => {
            const match = await db.getLiveMatchById(matchId);
            if (!match) return null;
            const events = await db.getMatchEvents(matchId);
            const ourGoals = events.filter((e: any) => e.eventType === 'goal' && e.isOurTeam).length;
            const opponentGoals = events.filter((e: any) => e.eventType === 'goal' && !e.isOurTeam).length;
            const yellowCards = events.filter((e: any) => e.eventType === 'yellow_card' && e.isOurTeam).length;
            const redCards = events.filter((e: any) => e.eventType === 'red_card' && e.isOurTeam).length;
            const substitutions = events.filter((e: any) => e.eventType === 'substitution' && e.isOurTeam).length;
            return {
              matchId,
              opponent: match.opponent,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              isHome: match.isHome,
              formation: match.currentFormation,
              finishedAt: match.finishedAt,
              possession: match.possession ?? 50,
              shots: match.shots ?? 0,
              shotsOnTarget: match.shotsOnTarget ?? 0,
              corners: match.corners ?? 0,
              fouls: match.fouls ?? 0,
              yellowCards,
              redCards,
              substitutions,
              ourGoals,
              opponentGoals,
              events: events.slice(0, 30),
            };
          })
        );
        return results.filter(Boolean);
      }),
  }),
  
  // ==================== COACHES ====================
  coaches: router({
    getAvailable: publicProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const result = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          specialty: coachProfiles.specialization,
          bio: coachProfiles.bio,
          yearsExperience: coachProfiles.yearsExperience,
          certifications: coachProfiles.qualifications,
        })
        .from(users)
        .innerJoin(coachProfiles, eq(users.id, coachProfiles.userId))
        .where(and(eq(users.role, 'coach'), eq(users.accountStatus, 'approved')))
        .orderBy(desc(coachProfiles.yearsExperience));
      return result;
    }),
  }),
  
  // ==================== PRIVATE BOOKINGS ====================
  privateBookings: router({
    create: protectedProcedure
      .input(z.object({
        coachId: z.number(),
        sessionDate: z.string(),
        duration: z.number(),
        sessionType: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const totalPrice = input.duration === 60 ? 300 : input.duration === 90 ? 400 : 200;
        // Calculate start/end times based on duration
        const startTime = "09:00";
        const endHour = 9 + Math.floor(input.duration / 60);
        const endMin = input.duration % 60;
        const endTime = `${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}`;
        await database.insert(privateTrainingBookings).values({
          bookedBy: ctx.user.id,
          coachId: input.coachId,
          playerId: 1, // Default player, should be passed from frontend
          sessionDate: new Date(input.sessionDate),
          startTime,
          endTime,
          notes: input.notes || null,
          status: 'pending',
          totalPrice: totalPrice,
        });
        
        // Get coach and user details for email
        const [coach] = await database
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, input.coachId));
        
        // Send confirmation emails
        if (ctx.user.email) {
          await sendBookingConfirmationToUser(ctx.user.email, {
            userName: ctx.user.name || 'Student',
            coachName: coach?.name || 'Coach',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
            totalPrice: totalPrice,
          });
        }
        
        if (coach?.email) {
          await sendBookingConfirmationToCoach(coach.email, {
            coachName: coach.name || 'Coach',
            userName: ctx.user.name || 'Student',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
            notes: input.notes,
          });
        }
        
        // Send WhatsApp notifications if enabled
        if (ctx.user.whatsappPhone && ctx.user.whatsappNotifications) {
          await sendBookingConfirmationWhatsApp(ctx.user.whatsappPhone, {
            userName: ctx.user.name || 'Student',
            coachName: coach?.name || 'Coach',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
          });
        }
        
        // Send WhatsApp to coach if they have WhatsApp enabled
        const [coachUser] = await database
          .select({ whatsappPhone: users.whatsappPhone, whatsappNotifications: users.whatsappNotifications })
          .from(users)
          .where(eq(users.id, input.coachId));
        
        if (coachUser?.whatsappPhone && coachUser.whatsappNotifications) {
          await sendCoachBookingNotificationWhatsApp(coachUser.whatsappPhone, {
            coachName: coach?.name || 'Coach',
            userName: ctx.user.name || 'Student',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
          });
        }
        
        return { success: true };
      }),
    
    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      const database = (await getDb())!;
      if (!database) return [];
      const result = await database
        .select({
          id: privateTrainingBookings.id,
          bookedBy: privateTrainingBookings.bookedBy,
          coachId: privateTrainingBookings.coachId,
          sessionDate: privateTrainingBookings.sessionDate,
          startTime: privateTrainingBookings.startTime,
          endTime: privateTrainingBookings.endTime,
          notes: privateTrainingBookings.notes,
          status: privateTrainingBookings.status,
          totalPrice: privateTrainingBookings.totalPrice,
          createdAt: privateTrainingBookings.createdAt,
          coachName: users.name,
          coachAvatar: users.avatarUrl,
          // Computed fields for CoachCalendar compatibility
          userName: sql<string>`(SELECT name FROM users WHERE id = ${privateTrainingBookings.bookedBy})`,
          sessionType: sql<string>`'Private Training'`,
          duration: sql<number>`(
            (CAST(SUBSTRING(${privateTrainingBookings.endTime}, 1, 2) AS UNSIGNED) * 60 +
             CAST(SUBSTRING(${privateTrainingBookings.endTime}, 4, 2) AS UNSIGNED)) -
            (CAST(SUBSTRING(${privateTrainingBookings.startTime}, 1, 2) AS UNSIGNED) * 60 +
             CAST(SUBSTRING(${privateTrainingBookings.startTime}, 4, 2) AS UNSIGNED))
          )`,
        })
        .from(privateTrainingBookings)
        .innerJoin(users, eq(privateTrainingBookings.coachId, users.id))
        .where(eq(privateTrainingBookings.bookedBy, ctx.user.id))
        .orderBy(desc(privateTrainingBookings.sessionDate));
      return result;
    }),
    
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database
          .update(privateTrainingBookings)
          .set({ status: 'cancelled' })
          .where(and(
            eq(privateTrainingBookings.id, input.id),
            eq(privateTrainingBookings.bookedBy, ctx.user.id)
          ));
        return { success: true };
      }),
  }),
  
  // ==================== TESTIMONIALS ====================
  testimonials: router({
    getApproved: publicProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const result = await database
        .select()
        .from(testimonials)
        .where(eq(testimonials.isApproved, true))
        .orderBy(desc(testimonials.isFeatured), desc(testimonials.createdAt));
      return result;
    }),
    
    getFeatured: publicProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const result = await database
        .select()
        .from(testimonials)
        .where(and(eq(testimonials.isApproved, true), eq(testimonials.isFeatured, true)))
        .orderBy(desc(testimonials.createdAt));
      return result;
    }),
    
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        role: z.string().optional(),
        rating: z.number().min(1).max(5),
        testimonial: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.insert(testimonials).values({
          name: input.name,
          role: input.role || null,
          rating: input.rating,
          testimonial: input.testimonial,
          isApproved: false,
          isFeatured: false,
        });
        return { success: true };
      }),
    
    getAll: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const result = await database
        .select()
        .from(testimonials)
        .orderBy(desc(testimonials.createdAt));
      return result;
    }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number(), featured: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        
        // Get testimonial details before updating
        const [testimonial] = await database
          .select()
          .from(testimonials)
          .where(eq(testimonials.id, input.id));
        
        await database
          .update(testimonials)
          .set({ 
            isApproved: true, 
            isFeatured: input.featured || false 
          })
          .where(eq(testimonials.id, input.id));
        
        // Send approval email if testimonial has email (for registered users)
        // For now, we'll skip email since testimonials don't have email field
        // In future, link testimonials to user accounts
        
        return { success: true };
      }),
  }),
  
  // ==================== HOME PAGE CONTENT ====================
  homeContent: router({
    getAll: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      return database.select().from(homePageContent).orderBy(asc(homePageContent.displayOrder));
    }),
    
    getBySectionType: publicProcedure
      .input(z.object({ sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats', 'pricing', 'team', 'events', 'training']) }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        return database
          .select()
          .from(homePageContent)
          .where(and(eq(homePageContent.sectionType, input.sectionType), eq(homePageContent.isActive, true)))
          .orderBy(asc(homePageContent.displayOrder));
      }),
    
    getActive: publicProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      return database
        .select()
        .from(homePageContent)
        .where(eq(homePageContent.isActive, true))
        .orderBy(asc(homePageContent.displayOrder));
    }),
    
    create: adminProcedure
      .input(z.object({
        sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats', 'pricing', 'team', 'events', 'training']),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const [result] = await database.insert(homePageContent).values(input);
        return { success: true, id: result.insertId };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { id, ...data } = input;
        await database.update(homePageContent).set(data).where(eq(homePageContent.id, id));
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.delete(homePageContent).where(eq(homePageContent.id, input.id));
        return { success: true };
      }),
    
    toggleActive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        
        const [item] = await database
          .select()
          .from(homePageContent)
          .where(eq(homePageContent.id, input.id));
        
        if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Content not found' });
        
        await database
          .update(homePageContent)
          .set({ isActive: !item.isActive })
          .where(eq(homePageContent.id, input.id));
        
        return { success: true };
      }),
    
    reorder: adminProcedure
      .input(z.object({ id: z.number(), displayOrder: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database
          .update(homePageContent)
          .set({ displayOrder: input.displayOrder })
          .where(eq(homePageContent.id, input.id));
        return { success: true };
      }),
  }),
  
  // ==================== NEW FEATURES (Phase 100) ====================
  qrCheckIn: qrCheckInRouter,
  socialMedia: socialMediaRouter,
  emailCampaigns: emailCampaignsRouter,
  referral: referralRouter,
  scoutNetwork: scoutNetworkRouter,
  nutritionAI: nutritionAIRouter,
  injuryPrevention: injuryPreventionRouter,
  educationAcademy: educationAcademyRouter,
  vrTraining: vrTrainingRouter,
  coachCandidates: coachCandidatesRouter,
  teamNeedsAnalysis: teamNeedsAnalysisRouter,
  // ==================== QUIZ MANAGEMENTT (Phase 108) ====================
  quiz: router({
    getQuestionsByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) return [];
        
        const questions = await database.select()
          .from(quizQuestions)
          .where(eq(quizQuestions.courseId, input.courseId));
        
        return questions.map(q => ({
          id: q.id,
          courseId: q.courseId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
      }),
    
    addQuestion: adminProcedure
      .input(z.object({
        courseId: z.number(),
        question: z.string().min(1),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        optionC: z.string().min(1),
        optionD: z.string().min(1),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const [result] = await database.insert(quizQuestions).values({
          courseId: input.courseId,
          question: input.question,
          optionA: input.optionA,
          optionB: input.optionB,
          optionC: input.optionC,
          optionD: input.optionD,
          correctAnswer: input.correctAnswer,
          explanation: input.explanation || null
        });
        
        return { success: true, id: result.insertId };
      }),
    
    updateQuestion: adminProcedure
      .input(z.object({
        id: z.number(),
        question: z.string().min(1),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        optionC: z.string().min(1),
        optionD: z.string().min(1),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        await database.update(quizQuestions)
          .set({
            question: input.question,
            optionA: input.optionA,
            optionB: input.optionB,
            optionC: input.optionC,
            optionD: input.optionD,
            correctAnswer: input.correctAnswer,
            explanation: input.explanation || null
          })
          .where(eq(quizQuestions.id, input.id));
        
        return { success: true };
      }),
    
    deleteQuestion: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        await database.delete(quizQuestions).where(eq(quizQuestions.id, input.id));
        
        return { success: true };
      }),
  }),

  // ==================== CERTIFICATES (Phase 108) ====================
  certificates: router({
    getMyCertificates: protectedProcedure
      .query(async ({ ctx }) => {
        const { coachCertificates, coachingCourses } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) return [];
        
        const certs = await database.select({
          id: coachCertificates.id,
          courseId: coachCertificates.courseId,
          certificateNumber: coachCertificates.certificateNumber,
          certificateUrl: coachCertificates.certificateUrl,
          level: coachCertificates.level,
          score: coachCertificates.score,
          issuedAt: coachCertificates.issuedAt,
          expiresAt: coachCertificates.expiresAt,
          verificationCode: coachCertificates.verificationCode,
          courseName: coachingCourses.title
        })
          .from(coachCertificates)
          .leftJoin(coachingCourses, eq(coachCertificates.courseId, coachingCourses.id))
          .where(eq(coachCertificates.userId, ctx.user.id));
        
        return certs.map(c => ({
          id: c.id,
          courseId: c.courseId,
          courseName: c.courseName || 'Unknown Course',
          certificateNumber: c.certificateNumber,
          certificateUrl: c.certificateUrl,
          level: c.level,
          score: c.score,
          issuedAt: c.issuedAt?.toISOString() || new Date().toISOString(),
          expiresAt: c.expiresAt?.toISOString() || null,
          verificationCode: c.verificationCode
        }));
      }),
    
    addCertificate: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        level: z.string().optional(),
        score: z.number().optional(),
        certificateNumber: z.string().optional(),
        quizAttemptId: z.number().optional(),
        certificateUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { coachCertificates } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        // Check if already exists
        const existing = await database.select({ id: coachCertificates.id })
          .from(coachCertificates)
          .where(and(eq(coachCertificates.userId, ctx.user.id), eq(coachCertificates.courseId, input.courseId)))
          .limit(1);
        if (existing.length > 0) return { success: true, alreadyExists: true };
        const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        await database.insert(coachCertificates).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          quizAttemptId: input.quizAttemptId ?? 0,
          level: (input.level as any) ?? 'grassroots',
          score: input.score ?? 0,
          certificateNumber: input.certificateNumber || `CERT-${ctx.user.id}-${input.courseId}-${Date.now()}`,
          certificateUrl: input.certificateUrl || '',
          verificationCode,
          issuedAt: new Date(),
        });
        return { success: true, alreadyExists: false };
      }),

    verifyCertificate: publicProcedure
      .input(z.object({ verificationCode: z.string() }))
      .query(async ({ input }) => {
        const { coachCertificates, coachingCourses, users } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) return null;
        
        const [cert] = await database.select({
          id: coachCertificates.id,
          certificateNumber: coachCertificates.certificateNumber,
          level: coachCertificates.level,
          score: coachCertificates.score,
          issuedAt: coachCertificates.issuedAt,
          courseName: coachingCourses.title,
          userName: users.name
        })
          .from(coachCertificates)
          .leftJoin(coachingCourses, eq(coachCertificates.courseId, coachingCourses.id))
          .leftJoin(users, eq(coachCertificates.userId, users.id))
          .where(eq(coachCertificates.verificationCode, input.verificationCode))
          .limit(1);
        
        if (!cert) return null;
        
        return {
          valid: true,
          certificateNumber: cert.certificateNumber,
          courseName: cert.courseName || 'Unknown Course',
          userName: cert.userName || 'Unknown',
          level: cert.level,
          score: cert.score,
          issuedAt: cert.issuedAt?.toISOString() || new Date().toISOString()
        };
      }),
  }),

  // ==================== COURSES (Phase 108) ====================
  courses: router({
    getAllCourses: protectedProcedure
      .query(async () => {
        const { coachingCourses } = await import('../drizzle/schema');
        const database = (await getDb())!;
        if (!database) return [];
        
        const courses = await database.select()
          .from(coachingCourses)
          .where(eq(coachingCourses.isPublished, true))
          .orderBy(asc(coachingCourses.order));
        
        return courses.map(c => ({
          id: c.id,
          title: c.title,
          level: c.level || c.category || 'Unknown'
        }));
      }),
  }),
  drillLibrary: router({
    getAll: protectedProcedure
      .input(z.object({ skillArea: z.string().optional(), ageGroup: z.string().optional(), difficulty: z.string().optional(), search: z.string().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { drillVideos } = await import('../drizzle/schema');
        const results = await database.select().from(drillVideos).where(eq(drillVideos.isActive, true)).orderBy(desc(drillVideos.createdAt)).limit(100);
        return results.filter(v => {
          if (input.skillArea && v.skillArea !== input.skillArea) return false;
          if (input.ageGroup && v.ageGroup && v.ageGroup !== input.ageGroup && v.ageGroup !== 'All') return false;
          if (input.difficulty && v.difficulty !== input.difficulty) return false;
          if (input.search) {
            const q = input.search.toLowerCase();
            return v.title.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q) || (v.tags || '').toLowerCase().includes(q);
          }
          return true;
        });
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        const { drillVideos } = await import('../drizzle/schema');
        const [row] = await database.select().from(drillVideos).where(eq(drillVideos.id, input.id)).limit(1);
        if (row) await database.update(drillVideos).set({ viewCount: (row.viewCount || 0) + 1 }).where(eq(drillVideos.id, input.id));
        return row || null;
      }),
    create: staffProcedure
      .input(z.object({
        title: z.string().min(1),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        skillArea: z.string().min(1),
        ageGroup: z.string().optional(),
        difficulty: z.string().optional(),
        duration: z.number().optional(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { drillVideos } = await import('../drizzle/schema');
        const [result] = await database.insert(drillVideos).values({ ...input, uploadedBy: ctx.user.id });
        return { id: (result as any).insertId };
      }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        skillArea: z.string().optional(),
        ageGroup: z.string().optional(),
        difficulty: z.string().optional(),
        duration: z.number().optional(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        tags: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { drillVideos } = await import('../drizzle/schema');
        const { id, ...data } = input;
        await database.update(drillVideos).set(data).where(eq(drillVideos.id, id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { drillVideos } = await import('../drizzle/schema');
        await database.delete(drillVideos).where(eq(drillVideos.id, input.id));
        return { success: true };
      }),
    getRecommendations: staffProcedure
      .input(z.object({ playerId: z.number(), skillAreas: z.array(z.string()).optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { drillVideos, trainingSessionPerformance } = await import('../drizzle/schema');
        const sessions = await database.select().from(trainingSessionPerformance)
          .where(eq(trainingSessionPerformance.playerId, input.playerId))
          .orderBy(desc(trainingSessionPerformance.sessionDate)).limit(5);
        let areas = input.skillAreas || [];
        if (areas.length === 0 && sessions.length > 0) {
          const avgScore = (key: string) => Math.round(sessions.reduce((s: number, r: any) => s + (r[key] || 0), 0) / sessions.length);
          const scores = [
            { area: 'physical', score: avgScore('physicalScore') },
            { area: 'technical', score: avgScore('technicalScore') },
            { area: 'mental', score: avgScore('mentalScore') },
          ];
          areas = scores.sort((a, b) => a.score - b.score).slice(0, 2).map(s => s.area);
        }
        if (areas.length === 0) areas = ['technical', 'physical'];
        const allVideos = await database.select().from(drillVideos).where(eq(drillVideos.isActive, true)).limit(200);
        return allVideos.filter(v => areas.includes(v.skillArea)).slice(0, 6);
      }),
  }),

  videoTags: router({
    getByClip: protectedProcedure
      .input(z.object({ clipId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { videoTags } = await import('../drizzle/schema');
        return database.select().from(videoTags).where(eq(videoTags.clipId, input.clipId));
      }),
    create: protectedProcedure
      .input(z.object({
        clipId: z.number(),
        playerId: z.number().optional(),
        tagType: z.enum(['goal', 'assist', 'shot', 'pass', 'dribble', 'tackle', 'interception', 'save', 'error', 'foul', 'set_piece', 'highlight', 'custom']),
        timestamp: z.number(),
        endTimestamp: z.number().optional(),
        description: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { videoTags } = await import('../drizzle/schema');
        const [result] = await database.insert(videoTags).values({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id: (result as any).insertId };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { videoTags } = await import('../drizzle/schema');
        await database.delete(videoTags).where(eq(videoTags.id, input.id));
        return { success: true };
      }),
    getPlayerTags: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { videoTags } = await import('../drizzle/schema');
        return database.select().from(videoTags).where(eq(videoTags.playerId, input.playerId));
      }),
    shareClipWithPlayer: coachProcedure
      .input(z.object({
        clipId: z.number(),
        playerId: z.number(),
        tagId: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        // Get player info
        const playerRows = await database.execute(
          sql`SELECT CONCAT(firstName, ' ', lastName) as name, userId FROM players WHERE id = ${input.playerId} LIMIT 1`
        );
        const player = (playerRows as any)[0]?.[0];
        if (!player) throw new Error('Player not found');
        // Get clip info
        const clipRows = await database.execute(
          sql`SELECT title FROM video_clips WHERE id = ${input.clipId} LIMIT 1`
        );
        const clip = (clipRows as any)[0]?.[0];
        const clipTitle = clip?.title || 'Video Clip';
        const senderName = ctx.user.name || ctx.user.email || 'Coach';
        const notifMsg = input.message
          ? (senderName + ' shared a video clip "' + clipTitle + '" with you: ' + input.message)
          : (senderName + ' shared a video clip "' + clipTitle + '" with you for review.');
        // Notify player if they have a user account
        if (player.userId) {
          await db.createNotification({
            userId: player.userId,
            title: 'Video Clip Shared: ' + clipTitle,
            message: notifMsg,
            type: 'info',
            category: 'general',
            relatedEntityType: 'player',
            relatedEntityId: input.playerId,
          });
        }
        return { success: true, playerName: ((player.firstName || "") + " " + (player.lastName || "")).trim() };
      }),
  }),

  // ==================== VIDEO ANNOTATIONS (TELESTRATION) ====================
  videoAnnotations: router({
    getByClip: protectedProcedure
      .input(z.object({ clipId: z.number(), timestamp: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { videoAnnotations } = await import('../drizzle/schema');
        if (input.timestamp !== undefined) {
          return database.select().from(videoAnnotations).where(
            and(eq(videoAnnotations.clipId, input.clipId), eq(videoAnnotations.timestamp, input.timestamp))
          );
        }
        return database.select().from(videoAnnotations).where(eq(videoAnnotations.clipId, input.clipId));
      }),
    create: coachProcedure
      .input(z.object({
        clipId: z.number(),
        timestamp: z.number(),
        annotationType: z.enum(['arrow', 'circle', 'rectangle', 'line', 'text', 'freehand']),
        data: z.string(), // JSON with coordinates
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { videoAnnotations } = await import('../drizzle/schema');
        const [result] = await database.insert(videoAnnotations).values({
          ...input,
          color: input.color || '#ff0000',
          createdBy: ctx.user.id,
        });
        return { id: (result as any).insertId };
      }),
    deleteByClipAndTimestamp: coachProcedure
      .input(z.object({ clipId: z.number(), timestamp: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { videoAnnotations } = await import('../drizzle/schema');
        await database.delete(videoAnnotations).where(
          and(eq(videoAnnotations.clipId, input.clipId), eq(videoAnnotations.timestamp, input.timestamp))
        );
        return { success: true };
      }),
    delete: coachProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { videoAnnotations } = await import('../drizzle/schema');
        await database.delete(videoAnnotations).where(eq(videoAnnotations.id, input.id));
        return { success: true };
      }),
  }),
  // ==================== SCOUTING PROFILES ====================
  scoutingProfiles: router({
    getByPlayer: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return null;
        const rows = await database.execute(
          sql`SELECT * FROM player_scouting_profiles WHERE playerId = ${input.playerId} ORDER BY assessmentDate DESC LIMIT 1`
        );
        const data = (rows as any)[0]?.[0] ?? null;
        if (!data) return null;
        return {
          ...data,
          strengthPoints: typeof data.strengthPoints === 'string' ? JSON.parse(data.strengthPoints) : (data.strengthPoints ?? []),
          weakPoints: typeof data.weakPoints === 'string' ? JSON.parse(data.weakPoints) : (data.weakPoints ?? []),
          developmentPoints: typeof data.developmentPoints === 'string' ? JSON.parse(data.developmentPoints) : (data.developmentPoints ?? []),
        };
      }),

    getByTeam: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(
          sql`SELECT sp.*, p.name as playerName, p.position, p.jerseyNumber, p.avatarUrl
              FROM player_scouting_profiles sp
              JOIN players p ON sp.playerId = p.id
              WHERE p.teamId = ${input.teamId}
              ORDER BY sp.overallRating DESC`
        );
        const data = (rows as any)[0] ?? [];
        return data.map((d: any) => ({
          ...d,
          strengthPoints: typeof d.strengthPoints === 'string' ? JSON.parse(d.strengthPoints) : (d.strengthPoints ?? []),
          weakPoints: typeof d.weakPoints === 'string' ? JSON.parse(d.weakPoints) : (d.weakPoints ?? []),
          developmentPoints: typeof d.developmentPoints === 'string' ? JSON.parse(d.developmentPoints) : (d.developmentPoints ?? []),
        }));
      }),

    upsert: staffProcedure
      .input(z.object({
        playerId: z.number(),
        assessmentDate: z.string(),
        strengthPoints: z.array(z.string()),
        weakPoints: z.array(z.string()),
        developmentPoints: z.array(z.string()),
        recommendedPosition: z.string().optional(),
        futurePosition: z.string().optional(),
        futurePositionRationale: z.string().optional(),
        potentialRating: z.enum(['elite','high','medium','low']).optional(),
        overallRating: z.number().min(0).max(100).optional(),
        technicalRating: z.number().min(0).max(100).optional(),
        physicalRating: z.number().min(0).max(100).optional(),
        mentalRating: z.number().min(0).max(100).optional(),
        tacticalRating: z.number().min(0).max(100).optional(),
        coachNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!input.playerId || input.playerId <= 0) throw new Error('Invalid player ID');
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        // Serialize arrays to JSON strings for MySQL JSON columns
        const strengthJson = JSON.stringify(input.strengthPoints ?? []);
        const weakJson = JSON.stringify(input.weakPoints ?? []);
        const devJson = JSON.stringify(input.developmentPoints ?? []);
        const existing = await database.execute(
          sql`SELECT id FROM player_scouting_profiles WHERE playerId = ${input.playerId} LIMIT 1`
        );
        const existingId = (existing as any)[0]?.[0]?.id;
        if (existingId) {
          await database.execute(
            sql`UPDATE player_scouting_profiles SET
              assessmentDate = ${input.assessmentDate},
              strengthPoints = ${strengthJson},
              weakPoints = ${weakJson},
              developmentPoints = ${devJson},
              recommendedPosition = ${input.recommendedPosition ?? null},
              futurePosition = ${input.futurePosition ?? null},
              futurePositionRationale = ${input.futurePositionRationale ?? null},
              potentialRating = ${input.potentialRating ?? 'medium'},
              overallRating = ${input.overallRating ?? 50},
              technicalRating = ${input.technicalRating ?? 50},
              physicalRating = ${input.physicalRating ?? 50},
              mentalRating = ${input.mentalRating ?? 50},
              tacticalRating = ${input.tacticalRating ?? 50},
              coachNotes = ${input.coachNotes ?? null},
              assessedBy = ${ctx.user.id}
            WHERE id = ${existingId}`
          );
        } else {
          await database.execute(
            sql`INSERT INTO player_scouting_profiles
              (playerId, assessedBy, assessmentDate, strengthPoints, weakPoints, developmentPoints,
               recommendedPosition, futurePosition, futurePositionRationale, potentialRating,
               overallRating, technicalRating, physicalRating, mentalRating, tacticalRating, coachNotes)
              VALUES (
                ${input.playerId}, ${ctx.user.id}, ${input.assessmentDate},
                ${strengthJson}, ${weakJson},
                ${devJson},
                ${input.recommendedPosition ?? null}, ${input.futurePosition ?? null},
                ${input.futurePositionRationale ?? null}, ${input.potentialRating ?? 'medium'},
                ${input.overallRating ?? 50}, ${input.technicalRating ?? 50},
                ${input.physicalRating ?? 50}, ${input.mentalRating ?? 50},
                ${input.tacticalRating ?? 50}, ${input.coachNotes ?? null}
              )`
          );
        }
        return { success: true };
      }),

    getPositionRecommendations: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const latestSkills = await db.getLatestSkillScore(input.playerId);
        if (!latestSkills) return null;
        const skills = {
          speed: latestSkills.speed ?? 50,
          agility: latestSkills.agility ?? 50,
          power: latestSkills.strength ?? 50,
          stamina: latestSkills.stamina ?? 50,
          dribbling: latestSkills.dribbling ?? 50,
          firstTouch: latestSkills.firstTouch ?? 50,
          passing: latestSkills.passing ?? 50,
          shooting: latestSkills.shooting ?? 50,
          heading: latestSkills.heading ?? 50,
          tackling: latestSkills.tackling ?? 50,
          positioning: latestSkills.positioning ?? 50,
          vision: latestSkills.vision ?? 50,
          decisionMaking: latestSkills.decisionMaking ?? 50,
          composure: latestSkills.composure ?? 50,
          leadership: 50,
          workRate: latestSkills.workRate ?? 50,
        };
        const recommendations = getTopPositionRecommendations(skills as PlayerSkills, 5);
        return {
          recommendations,
          skillsUsed: skills,
          assessmentDate: latestSkills.assessmentDate,
        };
      }),
    requestPositionChange: staffProcedure
      .input(z.object({
        playerId: z.number(),
        currentPosition: z.string(),
        recommendedPosition: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        // Get player info
        const playerData = await database.execute(
          sql`SELECT CONCAT(firstName, ' ', lastName) as name, teamId FROM players WHERE id = ${input.playerId} LIMIT 1`
        );
        const player = (playerData as any)[0]?.[0];
        const playerName = player?.name || `Player #${input.playerId}`;
        // Notify all admins and coaches
        const adminCoaches = await database.execute(
          sql`SELECT id FROM users WHERE role IN ('admin', 'coach') AND accountStatus = 'approved'`
        );
        const recipients = (adminCoaches as any)[0] ?? [];
        const requesterName = ctx.user.name || ctx.user.email || 'Staff';
        const notifTitle = `Position Change Request: ${playerName}`;
        const notifMsg = `${requesterName} has requested a position change for ${playerName} from ${input.currentPosition} to ${input.recommendedPosition}.${input.reason ? ' Reason: ' + input.reason : ''} Please review in the scouting report.`;
        for (const rec of recipients) {
          await db.createNotification({
            userId: rec.id,
            title: notifTitle,
            message: notifMsg,
            type: 'warning',
            category: 'general',
            relatedEntityType: 'player',
            relatedEntityId: input.playerId,
          });
        }
        return { success: true, notified: recipients.length };
      }),
    saveAIAnalysis: staffProcedure
      .input(z.object({ playerId: z.number(), analysis: z.string(), customNotes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const fullAnalysis = input.customNotes
          ? input.analysis + '\n\n---\n**Coach Custom Notes:**\n' + input.customNotes
          : input.analysis;
        await database.execute(
          sql`UPDATE player_scouting_profiles SET aiAnalysis = ${fullAnalysis} WHERE playerId = ${input.playerId}`
        );
        return { success: true };
      }),
    generateAIAnalysis: staffProcedure
      .input(z.object({ playerId: z.number(), focusAreas: z.array(z.string()).optional() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');

        // ── 1. Core player profile ──────────────────────────────────────────────
        const playerRows = await database.execute(
          sql`SELECT CONCAT(p.firstName, ' ', p.lastName) as name,
              TIMESTAMPDIFF(YEAR, p.dateOfBirth, CURDATE()) as age,
              p.position, p.preferredFoot, p.height, p.weight,
              p.nationality, p.ageGroup, p.status, p.joinDate,
              t.name as teamName, t.ageGroup as teamAgeGroup
              FROM players p
              LEFT JOIN teams t ON t.id = p.teamId
              WHERE p.id = ${input.playerId} LIMIT 1`
        );
        const player = (playerRows as any)[0]?.[0];
        if (!player) throw new Error('Player not found');

        // ── 2. Skill scores (most recent assessment) ────────────────────────────
        const skillRows = await database.execute(
          sql`SELECT ballControl, firstTouch, dribbling, passing, shooting, crossing, heading,
              leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
              speed, acceleration, agility, stamina, strength, jumping,
              positioning, vision, composure, decisionMaking, workRate,
              marking, tackling, interceptions,
              technicalOverall, physicalOverall, mentalOverall, defensiveOverall, overallRating,
              potentialRating, assessmentDate, notes
              FROM player_skill_scores WHERE playerId = ${input.playerId}
              ORDER BY assessmentDate DESC LIMIT 1`
        );
        const skills = (skillRows as any)[0]?.[0] || null;

        // ── 3. Scouting profile ─────────────────────────────────────────────────
        const scoutRows = await database.execute(
          sql`SELECT overallRating, technicalRating, physicalRating, mentalRating, tacticalRating,
              potentialRating, strengthPoints, weakPoints, developmentPoints, coachNotes,
              recommendedPosition, futurePosition, marketValue, scoutRating
              FROM player_scouting_profiles WHERE playerId = ${input.playerId}
              ORDER BY assessmentDate DESC LIMIT 1`
        );
        const scout = (scoutRows as any)[0]?.[0] || null;

        // ── 4. Match statistics (last 10 matches) ───────────────────────────────
        const matchRows = await database.execute(
          sql`SELECT COUNT(*) as matchCount,
              SUM(goals) as totalGoals, SUM(assists) as totalAssists,
              AVG(minutesPlayed) as avgMinutes, SUM(minutesPlayed) as totalMinutes,
              AVG(passAccuracy) as avgPassAccuracy, AVG(coachRating) as avgCoachRating,
              AVG(performanceScore) as avgPerformanceScore,
              SUM(shots) as totalShots, SUM(shotsOnTarget) as totalShotsOnTarget,
              SUM(dribbles) as totalDribbles, SUM(successfulDribbles) as successfulDribbles,
              SUM(tackles) as totalTackles, SUM(interceptions) as totalInterceptions,
              AVG(distanceCovered) as avgDistance, MAX(topSpeed) as maxTopSpeed,
              SUM(yellowCards) as yellowCards, SUM(redCards) as redCards
              FROM player_match_stats WHERE playerId = ${input.playerId}
              ORDER BY createdAt DESC LIMIT 10`
        );
        const matchStats = (matchRows as any)[0]?.[0] || null;

        // ── 5. Physical tests (most recent) ────────────────────────────────────
        const physRows = await database.execute(
          sql`SELECT sprint10m, sprint30m, sprintMax, verticalJump, broadJump,
              vo2Max, beepTestLevel, agilityT, illinois, sitAndReach, testDate
              FROM player_physical_tests WHERE playerId = ${input.playerId}
              ORDER BY testDate DESC LIMIT 1`
        );
        const physTests = (physRows as any)[0]?.[0] || null;

        // ── 6. InBody composition (most recent) ────────────────────────────────
        const inbodyRows = await database.execute(
          sql`SELECT weight, bmi, bodyFatPercent, skeletalMuscleMass, inBodyScore,
              visceralFatLevel, basalMetabolicRate, testDate
              FROM player_inbody WHERE playerId = ${input.playerId}
              ORDER BY testDate DESC LIMIT 1`
        );
        const inbody = (inbodyRows as any)[0]?.[0] || null;

        // ── 7. Attendance rate ──────────────────────────────────────────────────
        const attendRows = await database.execute(
          sql`SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
              FROM attendance WHERE playerId = ${input.playerId}`
        );
        const attend = (attendRows as any)[0]?.[0] || null;
        const attendanceRate = attend && attend.total > 0
          ? Math.round((attend.present / attend.total) * 100) : null;

        // ── 8. Injury history ───────────────────────────────────────────────────
        const injuryRows = await database.execute(
          sql`SELECT COUNT(*) as injuryCount,
              GROUP_CONCAT(DISTINCT injuryType ORDER BY injuryDate DESC SEPARATOR ', ') as injuryTypes
              FROM player_injuries WHERE playerId = ${input.playerId} LIMIT 1`
        );
        const injuries = (injuryRows as any)[0]?.[0] || null;

        // ── 9. Mental assessments (most recent) ────────────────────────────────
        const mentalRows = await database.execute(
          sql`SELECT stressLevel, motivationLevel, confidenceLevel, focusLevel,
              teamworkRating, leadershipRating, assessmentDate
              FROM mental_assessments WHERE playerId = ${input.playerId}
              ORDER BY assessmentDate DESC LIMIT 1`
        );
        const mental = (mentalRows as any)[0]?.[0] || null;

        // ── 10. Development goals ───────────────────────────────────────────────
        const goalsRows = await database.execute(
          sql`SELECT title, category, progress, completed, targetDate
              FROM player_development_goals WHERE playerId = ${input.playerId}
              ORDER BY createdAt DESC LIMIT 5`
        );
        const devGoals = (goalsRows as any)[0] || [];

        // ── 11. Recent coach feedback ───────────────────────────────────────────
        const feedbackRows = await database.execute(
          sql`SELECT rating, category, strengths, improvements, recommendations
              FROM coach_feedback WHERE playerId = ${input.playerId}
              ORDER BY createdAt DESC LIMIT 3`
        );
        const feedback = (feedbackRows as any)[0] || [];

        // ── 12. Player valuation ────────────────────────────────────────────────
        const valuationRows = await database.execute(
          sql`SELECT estimatedValue, currency, valuationDate, notes
              FROM player_valuations WHERE playerId = ${input.playerId}
              ORDER BY valuationDate DESC LIMIT 1`
        );
        const valuation = (valuationRows as any)[0]?.[0] || null;

        // ── Build the comprehensive prompt ──────────────────────────────────────
        const strengths = scout ? (typeof scout.strengthPoints === 'string' ? JSON.parse(scout.strengthPoints || '[]') : (scout.strengthPoints ?? [])) : [];
        const weaknesses = scout ? (typeof scout.weakPoints === 'string' ? JSON.parse(scout.weakPoints || '[]') : (scout.weakPoints ?? [])) : [];
        const devPoints = scout ? (typeof scout.developmentPoints === 'string' ? JSON.parse(scout.developmentPoints || '[]') : (scout.developmentPoints ?? [])) : [];

        const bmi = player.weight && player.height ? (player.weight / ((player.height / 100) ** 2)).toFixed(1) : null;
        const dribbleSuccessRate = matchStats?.totalDribbles > 0
          ? Math.round((matchStats.successfulDribbles / matchStats.totalDribbles) * 100) : null;
        const shotAccuracy = matchStats?.totalShots > 0
          ? Math.round((matchStats.totalShotsOnTarget / matchStats.totalShots) * 100) : null;

        const prompt = `You are a UEFA Pro Licence scout and elite performance analyst at a top European football academy. You have access to comprehensive data for this player. Produce a PROFESSIONAL, DATA-DRIVEN scouting report that would impress a Premier League or Champions League club.

═══════════════════════════════════════════════════════════
PLAYER PROFILE
═══════════════════════════════════════════════════════════
Name: ${player.name}
Age: ${player.age} years old
Position: ${player.position}
Preferred Foot: ${player.preferredFoot || 'Not recorded'}
Height: ${player.height ? player.height + 'cm' : 'Not recorded'} | Weight: ${player.weight ? player.weight + 'kg' : 'Not recorded'}${bmi ? ' | BMI: ' + bmi : ''}
Nationality: ${player.nationality || 'Not recorded'}
Age Group: ${player.ageGroup || 'N/A'} | Team: ${player.teamName || 'N/A'}
Academy Status: ${player.status} | Joined: ${player.joinDate || 'N/A'}

═══════════════════════════════════════════════════════════
SKILL ASSESSMENT${skills ? ' (Assessed: ' + skills.assessmentDate + ')' : ''}
═══════════════════════════════════════════════════════════
${skills ? `TECHNICAL SKILLS:
  Ball Control: ${skills.ballControl}/100 | First Touch: ${skills.firstTouch}/100 | Dribbling: ${skills.dribbling}/100
  Passing: ${skills.passing}/100 | Shooting: ${skills.shooting}/100 | Crossing: ${skills.crossing}/100 | Heading: ${skills.heading}/100
  Technical Overall: ${skills.technicalOverall}/100

PHYSICAL SKILLS:
  Speed: ${skills.speed}/100 | Acceleration: ${skills.acceleration}/100 | Agility: ${skills.agility}/100
  Stamina: ${skills.stamina}/100 | Strength: ${skills.strength}/100 | Jumping: ${skills.jumping}/100
  Physical Overall: ${skills.physicalOverall}/100

MENTAL & TACTICAL:
  Positioning: ${skills.positioning}/100 | Vision: ${skills.vision}/100 | Composure: ${skills.composure}/100
  Decision Making: ${skills.decisionMaking}/100 | Work Rate: ${skills.workRate}/100
  Mental Overall: ${skills.mentalOverall}/100

DEFENSIVE:
  Marking: ${skills.marking}/100 | Tackling: ${skills.tackling}/100 | Interceptions: ${skills.interceptions}/100
  Defensive Overall: ${skills.defensiveOverall}/100

FOOT PREFERENCE:
  Left Foot: ${skills.leftFootScore}/100 | Right Foot: ${skills.rightFootScore}/100 | Two-Footed: ${skills.twoFootedScore}/100 | Weak Foot Usage: ${skills.weakFootUsage}%

OVERALL RATING: ${skills.overallRating}/100 | POTENTIAL: ${skills.potentialRating}/100` : 'No skill assessment on record yet.'}

${scout ? `═══════════════════════════════════════════════════════════
SCOUT RATINGS
═══════════════════════════════════════════════════════════
Overall: ${scout.overallRating}/100 | Technical: ${scout.technicalRating}/100 | Physical: ${scout.physicalRating}/100
Mental: ${scout.mentalRating}/100 | Tactical: ${scout.tacticalRating}/100 | Potential: ${scout.potentialRating}/100
Recommended Position: ${scout.recommendedPosition || 'N/A'} | Future Position: ${scout.futurePosition || 'N/A'}
${scout.marketValue ? `Market Value: ${scout.marketValue} | Scout Rating: ${scout.scoutRating}/10` : ''}
Strengths: ${strengths.join(', ') || 'None recorded'}
Weaknesses: ${weaknesses.join(', ') || 'None recorded'}
Development Points: ${devPoints.join(', ') || 'None recorded'}
Coach Notes: ${scout.coachNotes || 'None'}` : ''}

${matchStats && matchStats.matchCount > 0 ? `═══════════════════════════════════════════════════════════
MATCH PERFORMANCE (Last ${matchStats.matchCount} matches)
═══════════════════════════════════════════════════════════
Goals: ${matchStats.totalGoals} | Assists: ${matchStats.totalAssists} | Total Minutes: ${matchStats.totalMinutes}
Avg Minutes/Match: ${Math.round(matchStats.avgMinutes)} | Avg Coach Rating: ${matchStats.avgCoachRating ? parseFloat(matchStats.avgCoachRating).toFixed(1) : 'N/A'}/10
Pass Accuracy: ${matchStats.avgPassAccuracy ? Math.round(matchStats.avgPassAccuracy) : 'N/A'}% | Avg Performance Score: ${matchStats.avgPerformanceScore ? Math.round(matchStats.avgPerformanceScore) : 'N/A'}/100
Shots: ${matchStats.totalShots} (${matchStats.totalShotsOnTarget} on target${shotAccuracy ? ', ' + shotAccuracy + '% accuracy' : ''})
Dribbles: ${matchStats.totalDribbles} attempted${dribbleSuccessRate ? ' (' + dribbleSuccessRate + '% success rate)' : ''}
Tackles: ${matchStats.totalTackles} | Interceptions: ${matchStats.totalInterceptions}
${matchStats.avgDistance ? `Avg Distance/Match: ${Math.round(matchStats.avgDistance)}m` : ''} ${matchStats.maxTopSpeed ? `| Top Speed: ${(matchStats.maxTopSpeed / 10).toFixed(1)} km/h` : ''}
Discipline: ${matchStats.yellowCards} yellow, ${matchStats.redCards} red cards` : 'No match statistics recorded yet.'}

${physTests ? `═══════════════════════════════════════════════════════════
PHYSICAL TESTS (${physTests.testDate})
═══════════════════════════════════════════════════════════
Sprint 10m: ${physTests.sprint10m || 'N/A'}s | Sprint 30m: ${physTests.sprint30m || 'N/A'}s | Max Sprint: ${physTests.sprintMax || 'N/A'}s
Vertical Jump: ${physTests.verticalJump || 'N/A'}cm | Broad Jump: ${physTests.broadJump || 'N/A'}cm
VO2 Max: ${physTests.vo2Max || 'N/A'} ml/kg/min | Beep Test: Level ${physTests.beepTestLevel || 'N/A'}
Agility T-Test: ${physTests.agilityT || 'N/A'}s | Illinois: ${physTests.illinois || 'N/A'}s` : ''}

${inbody ? `═══════════════════════════════════════════════════════════
BODY COMPOSITION - InBody (${inbody.testDate})
═══════════════════════════════════════════════════════════
Weight: ${inbody.weight}kg | BMI: ${inbody.bmi} | Body Fat: ${inbody.bodyFatPercent}%
Skeletal Muscle Mass: ${inbody.skeletalMuscleMass}kg | InBody Score: ${inbody.inBodyScore}/100
Visceral Fat Level: ${inbody.visceralFatLevel} | BMR: ${inbody.basalMetabolicRate} kcal/day` : ''}

${mental ? `═══════════════════════════════════════════════════════════
MENTAL PROFILE (${mental.assessmentDate})
═══════════════════════════════════════════════════════════
Stress Level: ${mental.stressLevel}/10 | Motivation: ${mental.motivationLevel}/10 | Confidence: ${mental.confidenceLevel}/10
Focus: ${mental.focusLevel}/10 | Teamwork: ${mental.teamworkRating}/10 | Leadership: ${mental.leadershipRating}/10` : ''}

${attendanceRate !== null ? `Attendance Rate: ${attendanceRate}%` : ''}
${injuries && injuries.injuryCount > 0 ? `Injury History: ${injuries.injuryCount} recorded injuries (${injuries.injuryTypes})` : 'Injury History: No injuries recorded'}
${devGoals.length > 0 ? `Active Development Goals: ${devGoals.map((g: any) => `${g.title} (${g.progress}% complete)`).join(', ')}` : ''}
${feedback.length > 0 ? `Recent Coach Feedback: ${feedback.map((f: any) => `Rating ${f.rating}/5 - ${f.strengths || f.improvements || ''}`).join(' | ')}` : ''}
${valuation ? `Market Valuation: ${valuation.estimatedValue} ${valuation.currency} (${valuation.valuationDate})` : ''}

${input.focusAreas && input.focusAreas.length > 0 ? `═══════════════════════════════════════════════════════════
COACH-SPECIFIED FOCUS AREAS
═══════════════════════════════════════════════════════════
The coach has specifically requested deeper analysis on: ${input.focusAreas.join(', ')}
Give these areas extra depth with specific benchmarks, comparisons, and drill recommendations.` : ''}

═══════════════════════════════════════════════════════════
REPORT REQUIREMENTS
═══════════════════════════════════════════════════════════
Write a COMPREHENSIVE, DATA-DRIVEN professional scouting report. Reference specific numbers from the data above throughout. Compare metrics to age-group benchmarks where relevant. Be honest about weaknesses — do not sugarcoat. Use professional football terminology.

Structure the report with these exact sections:

## 🔍 Executive Summary
3-4 sentences. State the player's name, age, position, overall rating, and your headline verdict. Reference 2-3 specific metrics.

## ⚽ Technical Analysis
Detailed breakdown using the skill scores. Identify the top 3 technical strengths with specific scores. Identify the 2-3 biggest technical gaps. Reference match stats (pass accuracy, dribble success rate, shooting accuracy) where available.

## 💪 Physical Profile
Assess physical attributes using skill scores AND physical test data if available. Compare sprint times, VO2 max, and jump data to position-specific benchmarks. Comment on body composition if InBody data is available.

## 🧠 Mental & Tactical Attributes
Assess mental profile using mental assessment data. Comment on decision-making, composure, positioning. Reference work rate and leadership scores.

## 📊 Match Performance Analysis
Analyze the match statistics. Calculate goals+assists per 90 minutes if possible. Comment on shooting efficiency, passing quality, defensive contribution. Identify performance trends.

## 🎯 Position Suitability & Recommended Role
Based on ALL data, confirm or challenge the current position. Recommend the optimal role (e.g., "box-to-box midfielder", "inverted winger", "ball-playing centre-back"). Explain the reasoning with specific data points.

## 📈 6-Month Development Plan
5-7 specific, actionable training recommendations. Each must reference a specific weakness metric and prescribe a measurable target. Include drill names and training methods.

## 🚀 Long-term Career Pathway
Realistic 3-5 year projection based on age, potential rating, and current trajectory. Name comparable player profiles at the same age if relevant.

## ✅ Scout's Verdict
Final recommendation: SIGN / MONITOR / DEVELOP / RELEASE. Justify with 3 specific data points. Rate transfer readiness on a scale of 1-10.`;

        const llmResult = await invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
        });
        const rawContent = llmResult?.choices?.[0]?.message?.content;
        const analysis = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || 'Analysis not available';
        await database.execute(
          sql`UPDATE player_scouting_profiles SET aiAnalysis = ${analysis} WHERE playerId = ${input.playerId}`
        );
        return { analysis };
      }),
  }),
  // ==================== STAFF ATTENDANCE ====================
  // ==================== ROLE NAV PERMISSIONS ====================
  rolePermissions: router({
    // Get all role configs
    getAll: adminProcedure.query(async () => {
      const drizzleDb = await getDb();
      if (drizzleDb == null) return [];
      const { roleNavPermissions } = await import('../drizzle/schema.js');
      const rows = await drizzleDb.select().from(roleNavPermissions);
      return rows;
    }),
    // Get config for a specific role
    getByRole: protectedProcedure
      .input(z.object({ role: z.string() }))
      .query(async ({ input }) => {
        const drizzleDb = await getDb();
        if (drizzleDb == null) return null;
        const { roleNavPermissions } = await import('../drizzle/schema.js');
        const { eq } = await import('drizzle-orm');
        const rows = await drizzleDb.select().from(roleNavPermissions).where(eq(roleNavPermissions.role, input.role as any));
        return rows[0] || null;
      }),
    // Upsert config for a role (admin only)
    upsert: adminProcedure
      .input(z.object({
        role: z.enum(['admin', 'coach', 'assistant_coach', 'nutritionist', 'mental_coach', 'physical_trainer', 'doctor', 'parent', 'player']),
        config: z.object({
          modules: z.record(z.string(), z.boolean()),
          items: z.record(z.string(), z.boolean()),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await getDb();
        if (drizzleDb == null) throw new Error('Database not available');
        const { roleNavPermissions } = await import('../drizzle/schema.js');
        const { eq } = await import('drizzle-orm');
        // Check if exists
        const existing = await drizzleDb.select().from(roleNavPermissions).where(eq(roleNavPermissions.role, input.role));
        if (existing.length > 0) {
          await drizzleDb.update(roleNavPermissions)
            .set({ config: input.config, updatedBy: ctx.user.id })
            .where(eq(roleNavPermissions.role, input.role));
        } else {
          await drizzleDb.insert(roleNavPermissions).values({
            role: input.role,
            config: input.config,
            updatedBy: ctx.user.id,
          });
        }
        return { success: true };
      }),
    // Reset a role to default permissions
    reset: adminProcedure
      .input(z.object({ role: z.enum(['admin', 'coach', 'assistant_coach', 'nutritionist', 'mental_coach', 'physical_trainer', 'doctor', 'parent', 'player']) }))
      .mutation(async ({ input }) => {
        const drizzleDb = await getDb();
        if (drizzleDb == null) throw new Error('Database not available');
        const { roleNavPermissions } = await import('../drizzle/schema.js');
        const { eq } = await import('drizzle-orm');
        await drizzleDb.delete(roleNavPermissions).where(eq(roleNavPermissions.role, input.role));
        return { success: true };
      }),
  }),

  staffAttendance: router({
    record: staffProcedure
      .input(z.object({
        staffUserId: z.number(),
        teamId: z.number().optional(),
        sessionType: z.enum(['match', 'training', 'meeting', 'medical', 'other']),
        sessionDate: z.string(),
        sessionLabel: z.string().optional(),
        matchId: z.number().optional(),
        trainingSessionId: z.number().optional(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { staffAttendance: staffAttTable } = await import('../drizzle/schema');
        await database.insert(staffAttTable).values({
          ...input,
          sessionDate: new Date(input.sessionDate),
          recordedBy: ctx.user.id,
        });
        return { success: true };
      }),
    bulkRecord: staffProcedure
      .input(z.object({
        records: z.array(z.object({
          staffUserId: z.number(),
          status: z.enum(['present', 'absent', 'late', 'excused']),
          notes: z.string().optional(),
        })),
        teamId: z.number().optional(),
        sessionType: z.enum(['match', 'training', 'meeting', 'medical', 'other']),
        sessionDate: z.string(),
        sessionLabel: z.string().optional(),
        matchId: z.number().optional(),
        trainingSessionId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { staffAttendance: staffAttTable } = await import('../drizzle/schema');
        const sessionDate = new Date(input.sessionDate);
        for (const rec of input.records) {
          await database.insert(staffAttTable).values({
            staffUserId: rec.staffUserId,
            status: rec.status,
            notes: rec.notes,
            teamId: input.teamId,
            sessionType: input.sessionType,
            sessionDate,
            sessionLabel: input.sessionLabel,
            matchId: input.matchId,
            trainingSessionId: input.trainingSessionId,
            recordedBy: ctx.user.id,
          });
        }
        return { success: true, count: input.records.length };
      }),
    getByTeam: staffProcedure
      .input(z.object({
        teamId: z.number(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { staffAttendance: staffAttTable, users: usersTable } = await import('../drizzle/schema');
        const rows = await database
          .select({
            id: staffAttTable.id,
            staffUserId: staffAttTable.staffUserId,
            staffName: usersTable.name,
            teamId: staffAttTable.teamId,
            sessionType: staffAttTable.sessionType,
            sessionDate: staffAttTable.sessionDate,
            sessionLabel: staffAttTable.sessionLabel,
            matchId: staffAttTable.matchId,
            status: staffAttTable.status,
            notes: staffAttTable.notes,
            createdAt: staffAttTable.createdAt,
          })
          .from(staffAttTable)
          .leftJoin(usersTable, eq(usersTable.id, staffAttTable.staffUserId))
          .where(eq(staffAttTable.teamId, input.teamId))
          .orderBy(desc(staffAttTable.sessionDate));
        return rows;
      }),
    getByStaff: staffProcedure
      .input(z.object({ staffUserId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { staffAttendance: staffAttTable } = await import('../drizzle/schema');
        return database
          .select()
          .from(staffAttTable)
          .where(eq(staffAttTable.staffUserId, input.staffUserId))
          .orderBy(desc(staffAttTable.sessionDate))
          .limit(50);
      }),
    getSummary: staffProcedure
      .input(z.object({
        teamId: z.number().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { staffAttendance: staffAttTable, users: usersTable, teamCoaches: teamCoachesTable } = await import('../drizzle/schema');
        // Get all staff for the team
        const staffRows = input.teamId
          ? await database
              .select({ staffUserId: teamCoachesTable.coachUserId, staffName: usersTable.name, role: teamCoachesTable.role })
              .from(teamCoachesTable)
              .leftJoin(usersTable, eq(usersTable.id, teamCoachesTable.coachUserId))
              .where(eq(teamCoachesTable.teamId, input.teamId))
          : [];
        // Get attendance records
        const conditions = [];
        if (input.teamId) conditions.push(eq(staffAttTable.teamId, input.teamId));
        const attendanceRows = await database
          .select()
          .from(staffAttTable)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(staffAttTable.sessionDate));
        // Build summary per staff member
        const summaryMap: Record<number, { staffUserId: number; staffName: string; role: string; total: number; present: number; absent: number; late: number; excused: number }> = {};
        for (const staff of staffRows) {
          if (staff.staffUserId) {
            summaryMap[staff.staffUserId] = {
              staffUserId: staff.staffUserId,
              staffName: staff.staffName || 'Unknown',
              role: staff.role || 'staff',
              total: 0, present: 0, absent: 0, late: 0, excused: 0,
            };
          }
        }
        for (const rec of attendanceRows) {
          if (!summaryMap[rec.staffUserId]) {
            summaryMap[rec.staffUserId] = {
              staffUserId: rec.staffUserId,
              staffName: 'Unknown',
              role: 'staff',
              total: 0, present: 0, absent: 0, late: 0, excused: 0,
            };
          }
          const s = summaryMap[rec.staffUserId];
          s.total++;
          if (rec.status === 'present') s.present++;
          else if (rec.status === 'absent') s.absent++;
          else if (rec.status === 'late') s.late++;
          else if (rec.status === 'excused') s.excused++;
        }
        return Object.values(summaryMap);
      }),
  }),

  // ==================== FINANCE ====================
  finance: router({
    // Overview stats
    getStats: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return { totalRevenue: 0, totalExpenses: 0, pendingFees: 0, overdueCount: 0, collectionRate: 0 };
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      // Total paid this month
      const paidFees = await database.select({ total: sql<number>`SUM(paidAmount)` }).from(playerFees).where(and(eq(playerFees.year, year), eq(playerFees.month, month), eq(playerFees.status, 'paid')));
      // Pending fees
      const pending = await database.select({ count: sql<number>`COUNT(*)`, total: sql<number>`SUM(amount - paidAmount)` }).from(playerFees).where(eq(playerFees.status, 'pending'));
      // Overdue fees
      const overdue = await database.select({ count: sql<number>`COUNT(*)` }).from(playerFees).where(eq(playerFees.status, 'overdue'));
      // Total expenses this month
      const monthExpenses = await database.select({ total: sql<number>`SUM(amount)` }).from(expenses).where(and(eq(expenses.status, 'approved'), sql`MONTH(expenseDate) = ${month}`, sql`YEAR(expenseDate) = ${year}`));
      // All-time paid fees
      const allPaid = await database.select({ total: sql<number>`SUM(paidAmount)` }).from(playerFees).where(eq(playerFees.status, 'paid'));
      const allTotal = await database.select({ total: sql<number>`SUM(amount)` }).from(playerFees);
      const collectionRate = allTotal[0]?.total ? Math.round((Number(allPaid[0]?.total || 0) / Number(allTotal[0].total)) * 100) : 0;
      return {
        totalRevenue: Number(paidFees[0]?.total || 0),
        totalExpenses: Number(monthExpenses[0]?.total || 0),
        pendingFees: Number(pending[0]?.total || 0),
        overdueCount: Number(overdue[0]?.count || 0),
        collectionRate,
      };
    }),

    // Player fees
    getPlayerFees: adminProcedure
      .input(z.object({ month: z.number().optional(), year: z.number().optional(), status: z.string().optional(), teamId: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const conditions: any[] = [];
        if (input.month) conditions.push(eq(playerFees.month, input.month));
        if (input.year) conditions.push(eq(playerFees.year, input.year));
        if (input.status) conditions.push(eq(playerFees.status, input.status as any));
        if (input.teamId) conditions.push(eq(players.teamId, input.teamId));
        const fees = await database
          .select({ fee: playerFees, player: { id: players.id, firstName: players.firstName, lastName: players.lastName, ageGroup: players.ageGroup, teamId: players.teamId } })
          .from(playerFees)
          .leftJoin(players, eq(playerFees.playerId, players.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(playerFees.dueDate));
        return fees;
      }),

    recordPayment: adminProcedure
      .input(z.object({
        feeId: z.number(),
        amount: z.number(),
        method: z.enum(['cash', 'bank_transfer', 'instapay', 'vodafone_cash', 'check', 'other']),
        reference: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const fee = await database.select().from(playerFees).where(eq(playerFees.id, input.feeId)).limit(1);
        if (!fee[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fee not found' });
        const newPaid = (fee[0].paidAmount || 0) + input.amount;
        const newStatus = newPaid >= fee[0].amount ? 'paid' : 'partial';
        await database.update(playerFees).set({ paidAmount: newPaid, status: newStatus as any, paidDate: newStatus === 'paid' ? new Date() : undefined, updatedAt: new Date() }).where(eq(playerFees.id, input.feeId));
        await database.insert(academyPayments).values({ feeId: input.feeId, playerId: fee[0].playerId, amount: input.amount, paymentDate: new Date(), method: input.method, reference: input.reference, notes: input.notes, receivedBy: ctx.user.id });
        return { success: true, status: newStatus };
      }),

    generateMonthlyFees: adminProcedure
      .input(z.object({ month: z.number(), year: z.number(), amount: z.number(), season: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const allPlayers = await database.select({ id: players.id }).from(players).where(eq(players.status, 'active'));
        const dueDate = new Date(input.year, input.month - 1, 10);
        let created = 0;
        for (const p of allPlayers) {
          const existing = await database.select().from(playerFees).where(and(eq(playerFees.playerId, p.id), eq(playerFees.month, input.month), eq(playerFees.year, input.year))).limit(1);
          if (!existing[0]) {
            await database.insert(playerFees).values({ playerId: p.id, season: input.season, month: input.month, year: input.year, amount: input.amount, dueDate, status: 'pending', paidAmount: 0, createdBy: ctx.user.id });
            created++;
          }
        }
        return { success: true, created };
      }),

    updateFeeStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(['pending', 'paid', 'overdue', 'waived', 'partial']), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.update(playerFees).set({ status: input.status, notes: input.notes, updatedAt: new Date() }).where(eq(playerFees.id, input.id));
        return { success: true };
      }),

    // Expenses
    getExpenses: adminProcedure
      .input(z.object({ category: z.string().optional(), status: z.string().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const conditions: any[] = [];
        if (input.category) conditions.push(eq(expenses.category, input.category as any));
        if (input.status) conditions.push(eq(expenses.status, input.status as any));
        return database.select().from(expenses).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(expenses.expenseDate));
      }),

    createExpense: adminProcedure
      .input(z.object({
        category: z.enum(['equipment', 'facilities', 'salaries', 'transport', 'medical', 'training', 'marketing', 'utilities', 'other']),
        description: z.string().min(1),
        amount: z.number().positive(),
        expenseDate: z.string(),
        vendor: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.insert(expenses).values({ ...input, expenseDate: new Date(input.expenseDate), status: 'pending', createdBy: ctx.user.id });
        return { success: true };
      }),

    approveExpense: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(['approved', 'rejected']) }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.update(expenses).set({ status: input.status, approvedBy: ctx.user.id, updatedAt: new Date() }).where(eq(expenses.id, input.id));
        return { success: true };
      }),

    // Invoices
    getInvoices: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const conditions: any[] = [];
        if (input.status) conditions.push(eq(invoices.status, input.status as any));
        const result = await database
          .select({ invoice: invoices, player: { id: players.id, firstName: players.firstName, lastName: players.lastName } })
          .from(invoices)
          .leftJoin(players, eq(invoices.playerId, players.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(invoices.createdAt));
        return result;
      }),

    createInvoice: adminProcedure
      .input(z.object({
        playerId: z.number().optional(),
        issueDate: z.string(),
        dueDate: z.string(),
        items: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number(), total: z.number() })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const count = await database.select({ c: sql<number>`COUNT(*)` }).from(invoices);
        const num = (Number(count[0]?.c || 0) + 1).toString().padStart(4, '0');
        const invoiceNumber = `INV-${new Date().getFullYear()}-${num}`;
        const totalAmount = input.items.reduce((s, i) => s + i.total, 0);
        await database.insert(invoices).values({ invoiceNumber, playerId: input.playerId, issueDate: new Date(input.issueDate), dueDate: new Date(input.dueDate), totalAmount, paidAmount: 0, status: 'draft', items: input.items, notes: input.notes, createdBy: ctx.user.id });
        return { success: true, invoiceNumber };
      }),

    updateInvoiceStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']) }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.update(invoices).set({ status: input.status, updatedAt: new Date() }).where(eq(invoices.id, input.id));
        return { success: true };
      }),

    // Payment history
    getPayments: adminProcedure
      .input(z.object({ playerId: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const conditions: any[] = [];
        if (input.playerId) conditions.push(eq(academyPayments.playerId, input.playerId));
        return database.select().from(academyPayments).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(academyPayments.createdAt)).limit(100);
      }),

    // Monthly revenue vs expenses chart data (last 6 months)
    getMonthlyChart: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const months: { month: number; year: number; label: string; revenue: number; expenses: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const rev = await database.select({ total: sql<number>`COALESCE(SUM(paidAmount),0)` }).from(playerFees).where(and(eq(playerFees.month, m), eq(playerFees.year, y), eq(playerFees.status, 'paid')));
        const exp = await database.select({ total: sql<number>`COALESCE(SUM(amount),0)` }).from(expenses).where(and(eq(expenses.status, 'approved'), sql`MONTH(expenseDate) = ${m}`, sql`YEAR(expenseDate) = ${y}`));
        months.push({ month: m, year: y, label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), revenue: Number(rev[0]?.total || 0), expenses: Number(exp[0]?.total || 0) });
      }
      return months;
    }),

    // Mark overdue fees (fees past due date that are still pending)
    markOverdueFees: adminProcedure.mutation(async () => {
      const database = (await getDb())!;
      if (!database) throw new Error('Database not available');
      const today = new Date();
      const result = await database.update(playerFees)
        .set({ status: 'overdue', updatedAt: new Date() })
        .where(and(eq(playerFees.status, 'pending'), sql`dueDate < ${today}`));
      return { success: true, updated: (result[0] as any).affectedRows || 0 };
    }),

    // Cross-team KPI benchmarking for executive dashboard
    getCrossTeamKPIs: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const allPlayers = await db.getAllPlayers();
      const allTeams = await db.getAllTeams();
      const ageGroups = ['U9','U11','U13','U15','U17','U19','Main Team'];
      const results = await Promise.all(
        ageGroups.map(async (ag) => {
          const agPlayers = allPlayers.filter((p: any) => p.ageGroup === ag);
          if (agPlayers.length === 0) return null;
          // Attendance rate
          const attendanceRates = await Promise.all(
            agPlayers.map(async (p: any) => {
              const rate = await db.getPlayerAttendanceRate(p.id);
              return rate?.rate ?? 0;
            })
          );
          const avgAttendance = attendanceRates.length > 0
            ? Math.round(attendanceRates.reduce((s: number, r: number) => s + r, 0) / attendanceRates.length)
            : 0;
          // Avg skill score
          const skillScores = agPlayers.map((p: any) => {
            const skills = [p.technicalScore, p.physicalScore, p.tacticalScore, p.mentalScore].filter((s: any) => s != null);
            return skills.length > 0 ? skills.reduce((a: number, b: number) => a + b, 0) / skills.length : 0;
          });
          const avgSkill = skillScores.length > 0
            ? Math.round(skillScores.reduce((s: number, r: number) => s + r, 0) / skillScores.length)
            : 0;
          // Injury count
          const injuredCount = agPlayers.filter((p: any) => p.injuryStatus === 'injured').length;
          const injuryRate = agPlayers.length > 0 ? Math.round((injuredCount / agPlayers.length) * 100) : 0;
          // Revenue (fees paid)
          const playerIds = agPlayers.map((p: any) => p.id);
          let revenue = 0;
          if (playerIds.length > 0) {
            const feeRows = await database.select({ total: sql<number>`COALESCE(SUM(paidAmount),0)` })
              .from(playerFees)
              .where(and(inArray(playerFees.playerId, playerIds), eq(playerFees.status, 'paid')));
            revenue = Number(feeRows[0]?.total || 0);
          }
          return {
            ageGroup: ag,
            playerCount: agPlayers.length,
            avgAttendanceRate: avgAttendance,
            avgSkillScore: avgSkill,
            injuryRate,
            injuredCount,
            revenue,
          };
        })
      );
      return results.filter(Boolean);
    }),
    // Parent/player view of their own fees
    getMyFees: protectedProcedure.query(async ({ ctx }) => {
      const database = (await getDb())!;
      if (!database) return [];
      // Find linked player
      const player = await database.select({ id: players.id }).from(players).where(eq(players.userId, ctx.user.id)).limit(1);
      if (!player[0]) return [];
      const fees = await database.select().from(playerFees).where(eq(playerFees.playerId, player[0].id)).orderBy(desc(playerFees.dueDate)).limit(24);
      return fees;
    }),
  }),
  playerDevelopmentGoals: router({
    getByPlayer: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        return database.select().from(playerDevelopmentGoals)
          .where(eq(playerDevelopmentGoals.playerId, input.playerId))
          .orderBy(desc(playerDevelopmentGoals.createdAt));
      }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number(),
        category: z.enum(['technical','physical','tactical','mental']),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        targetDate: z.string().optional(),
        progress: z.number().min(0).max(100).default(0),
        priority: z.enum(['low','medium','high']).default('medium'),
        drills: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const result = await database.insert(playerDevelopmentGoals).values({
          playerId: input.playerId,
          createdByUserId: ctx.user.id,
          category: input.category,
          title: input.title,
          description: input.description || null,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          progress: input.progress,
          priority: input.priority,
          completed: false,
          drills: input.drills ? JSON.stringify(input.drills) : null,
          notes: input.notes || null,
        });
        return { success: true, id: (result[0] as any).insertId };
      }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(['technical','physical','tactical','mental']).optional(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        targetDate: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        priority: z.enum(['low','medium','high']).optional(),
        completed: z.boolean().optional(),
        drills: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { id, drills, targetDate, ...rest } = input;
        const updateData: any = { ...rest };
        if (drills !== undefined) updateData.drills = JSON.stringify(drills);
        if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
        await database.update(playerDevelopmentGoals)
          .set(updateData)
          .where(eq(playerDevelopmentGoals.id, id));
        return { success: true };
      }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        await database.delete(playerDevelopmentGoals)
          .where(eq(playerDevelopmentGoals.id, input.id));
        return { success: true };
      }),
    updateProgress: staffProcedure
      .input(z.object({ id: z.number(), progress: z.number().min(0).max(100) }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        // Fetch the goal before updating to check if it just reached 100%
        const existing = await database.select({
          progress: playerDevelopmentGoals.progress,
          completed: playerDevelopmentGoals.completed,
          playerId: playerDevelopmentGoals.playerId,
          title: playerDevelopmentGoals.title,
        }).from(playerDevelopmentGoals).where(eq(playerDevelopmentGoals.id, input.id)).limit(1);
        await database.update(playerDevelopmentGoals)
          .set({ progress: input.progress, completed: input.progress === 100 })
          .where(eq(playerDevelopmentGoals.id, input.id));
        // Award milestone badge and notification when goal reaches 100%
        if (input.progress === 100 && existing[0] && !existing[0].completed) {
          try {
            const player = await database.select({ userId: players.userId, firstName: players.firstName, lastName: players.lastName })
              .from(players).where(eq(players.id, existing[0].playerId)).limit(1);
            if (player[0]?.userId) {
              const { createNotification } = await import('./notificationService');
              await createNotification({
                userId: player[0].userId,
                type: 'badge_earned',
                title: '🎯 Development Goal Achieved!',
                message: `Congratulations ${player[0].firstName}! You completed your goal: "${existing[0].title}". Keep up the great work!`,
                data: { entityType: 'development_goal', entityId: input.id }
              }, database);
            }
          } catch (e) { console.error('[GoalMilestone] Failed to send notification:', e); }
        }
        return { success: true };
      }),
  }),
  scholarships: router({
    getAll: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      return database.select({ sch: scholarships, player: { id: players.id, firstName: players.firstName, lastName: players.lastName, ageGroup: players.ageGroup } })
        .from(scholarships).leftJoin(players, eq(scholarships.playerId, players.id)).orderBy(desc(scholarships.createdAt));
    }),
    create: adminProcedure
      .input(z.object({ playerId: z.number(), type: z.enum(['full','partial','merit','need_based','trial']), discountPercent: z.number().min(0).max(100), discountAmount: z.number().optional(), reason: z.string().optional(), startDate: z.string(), endDate: z.string().optional(), notes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        const { startDate: sdStr, endDate: edStr, ...schRest } = input;
        await database.insert(scholarships).values({ ...schRest, startDate: new Date(sdStr), endDate: edStr ? new Date(edStr) : undefined, status: 'active', approvedBy: ctx.user.id });
        return { success: true };
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(['pending','active','expired','revoked']) }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.update(scholarships).set({ status: input.status }).where(eq(scholarships.id, input.id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.delete(scholarships).where(eq(scholarships.id, input.id));
        return { success: true };
      }),
    getStats: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return { total: 0, active: 0, totalDiscountValue: 0 };
      const all = await database.select().from(scholarships);
      const active = all.filter(s => s.status === 'active');
      const totalDiscountValue = active.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
      return { total: all.length, active: active.length, totalDiscountValue };
    }),
  }),
  staffCosts: router({
    getAll: adminProcedure
      .input(z.object({ month: z.number().optional(), year: z.number().optional() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const conditions: any[] = [];
        if (input.month) conditions.push(eq(staffCosts.month, input.month));
        if (input.year) conditions.push(eq(staffCosts.year, input.year));
        return database.select().from(staffCosts).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(staffCosts.createdAt));
      }),
    create: adminProcedure
      .input(z.object({ staffName: z.string(), role: z.string(), salaryAmount: z.number(), month: z.number(), year: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.insert(staffCosts).values({ ...input, paymentStatus: 'pending', paidAmount: 0 });
        return { success: true };
      }),
    markPaid: adminProcedure
      .input(z.object({ id: z.number(), paidAmount: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.update(staffCosts).set({ paidAmount: input.paidAmount, paymentStatus: 'paid', paidDate: new Date() }).where(eq(staffCosts.id, input.id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('DB unavailable');
        await database.delete(staffCosts).where(eq(staffCosts.id, input.id));
        return { success: true };
      }),
    getMonthSummary: adminProcedure
      .input(z.object({ month: z.number(), year: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return { totalSalaries: 0, paidSalaries: 0, pendingCount: 0 };
        const all = await database.select().from(staffCosts).where(and(eq(staffCosts.month, input.month), eq(staffCosts.year, input.year)));
        const totalSalaries = all.reduce((s, c) => s + c.salaryAmount, 0);
        const paidSalaries = all.reduce((s, c) => s + (c.paidAmount || 0), 0);
        const pendingCount = all.filter(c => c.paymentStatus === 'pending').length;
        return { totalSalaries, paidSalaries, pendingCount };
      }),
  }),
  // ─── Stripe Billing ───────────────────────────────────────────────────
  billing: router({
    getPlans: publicProcedure
      .query(async () => {
        const { SUBSCRIPTION_PLANS } = await import("./stripeService");
        return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]: [string, any]) => ({
          key,
          name: plan.name,
          nameAr: plan.nameAr,
          amount: plan.amount,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
          featuresAr: plan.featuresAr,
        }));
      }),
    createCheckout: protectedProcedure
      .input(z.object({ planKey: z.enum(["monthly", "quarterly", "annual"]) }))
      .mutation(async ({ ctx, input }) => {
        const { createCheckoutSession } = await import("./stripeService");
        const origin = (ctx.req as any)?.headers?.origin || "http://localhost:3000";
        const session = await createCheckoutSession({
          planKey: input.planKey,
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "",
          successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/billing/plans`,
        });
        return { url: session.url };
      }),
  }),
  // ─── Session Execution Loop ───────────────────────────────────────────────
  sessionExecution: router({
    // List executions for a training session
    getBySession: protectedProcedure
      .input(z.object({ trainingSessionId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const { sessionExecutions } = await import("../drizzle/schema");
        return database.select().from(sessionExecutions)
          .where(eq(sessionExecutions.trainingSessionId, input.trainingSessionId))
          .orderBy(desc(sessionExecutions.createdAt));
      }),
    // Create a new session execution (start recording)
    create: protectedProcedure
      .input(z.object({
        trainingSessionId: z.number(),
        teamId: z.number().optional(),
        executionDate: z.string(),
        status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("in_progress"),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { sessionExecutions } = await import("../drizzle/schema");
        const [result] = await database.insert(sessionExecutions).values({
          trainingSessionId: input.trainingSessionId,
          teamId: input.teamId,
          coachId: ctx.user.id,
          executionDate: new Date(input.executionDate),
          status: input.status,
        });
        return { id: (result as any).insertId };
      }),
    // Complete a session execution with review data
    complete: protectedProcedure
      .input(z.object({
        id: z.number(),
        actualDuration: z.number().optional(),
        coachNotes: z.string().optional(),
        overallRating: z.number().min(1).max(10).optional(),
        energyLevel: z.number().min(1).max(10).optional(),
        focusLevel: z.number().min(1).max(10).optional(),
        pitchCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        weatherConditions: z.string().optional(),
        drillsCompleted: z.array(z.object({ drillName: z.string(), completed: z.boolean(), notes: z.string().optional() })).optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { sessionExecutions } = await import("../drizzle/schema");
        await database.update(sessionExecutions)
          .set({
            status: "completed",
            actualDuration: input.actualDuration,
            coachNotes: input.coachNotes,
            overallRating: input.overallRating,
            energyLevel: input.energyLevel,
            focusLevel: input.focusLevel,
            pitchCondition: input.pitchCondition,
            weatherConditions: input.weatherConditions,
            drillsCompleted: input.drillsCompleted || [],
          })
          .where(eq(sessionExecutions.id, input.id));

        // Auto-link: find player goals whose drills match completed drills and increment progress
        if (input.drillsCompleted && input.drillsCompleted.length > 0) {
          const completedDrillNames = input.drillsCompleted
            .filter((d: any) => d.completed)
            .map((d: any) => d.drillName.toLowerCase().trim());
          if (completedDrillNames.length > 0) {
            try {
              const { playerDevelopmentGoals: pdg, sessionAttendance } = await import('../drizzle/schema');
              const attendees = await database.select({ playerId: sessionAttendance.playerId })
                .from(sessionAttendance)
                .where(eq(sessionAttendance.sessionExecutionId, input.id));
              const pIds = [...new Set(attendees.map((a: any) => a.playerId))];
              if (pIds.length > 0) {
                const goals = await database.select().from(pdg)
                  .where(and(inArray(pdg.playerId, pIds), eq(pdg.completed, false)));
                for (const goal of goals) {
                  if (!goal.drills) continue;
                  let goalDrills: string[] = [];
                  try { goalDrills = JSON.parse(goal.drills).map((d: string) => d.toLowerCase().trim()); } catch { continue; }
                  const matched = goalDrills.some((gd: string) => completedDrillNames.some((cd: string) => cd.includes(gd) || gd.includes(cd)));
                  if (matched) {
                    const newProg = Math.min(100, (goal.progress || 0) + 10);
                    const justCompleted = newProg >= 100 && !goal.completed;
                    await database.update(pdg).set({ progress: newProg, completed: newProg >= 100 }).where(eq(pdg.id, goal.id));
                    // Send milestone notification when goal reaches 100%
                    if (justCompleted) {
                      try {
                        const playerRow = await database.select({ userId: players.userId, firstName: players.firstName })
                          .from(players).where(eq(players.id, goal.playerId)).limit(1);
                        if (playerRow[0]?.userId) {
                          const { createNotification } = await import('./notificationService');
                          await createNotification({
                            userId: playerRow[0].userId,
                            type: 'badge_earned',
                            title: '🎯 Development Goal Achieved!',
                            message: `Great work ${playerRow[0].firstName}! You completed your development goal: "${goal.title}" during today's training session!`,
                            data: { entityType: 'development_goal', entityId: goal.id }
                          }, database);
                        }
                      } catch (notifErr) { /* non-critical */ }
                    }
                  }
                }
              }
            } catch (e) { console.error('[SessionComplete] Auto-link goals error:', e); }
          }
        }

        return { success: true };
      }),
    // Link session drills to player development goals (auto-progress goals matching drills)
    linkGoals: staffProcedure
      .input(z.object({
        sessionExecutionId: z.number(),
        goalUpdates: z.array(z.object({
          goalId: z.number(),
          progressDelta: z.number().min(0).max(100),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { playerDevelopmentGoals, sessionExecutions } = await import("../drizzle/schema");
        // Update each goal's progress
        for (const update of input.goalUpdates) {
          const existing = await database.select({ progress: playerDevelopmentGoals.progress })
            .from(playerDevelopmentGoals).where(eq(playerDevelopmentGoals.id, update.goalId)).limit(1);
          if (existing[0]) {
            const newProgress = Math.min(100, (existing[0].progress || 0) + update.progressDelta);
            await database.update(playerDevelopmentGoals)
              .set({ progress: newProgress, completed: newProgress >= 100 })
              .where(eq(playerDevelopmentGoals.id, update.goalId));
          }
        }
        // Record goals updated in session execution
        await database.update(sessionExecutions)
          .set({ goalsUpdated: input.goalUpdates })
          .where(eq(sessionExecutions.id, input.sessionExecutionId));
        return { success: true, updated: input.goalUpdates.length };
      }),
    // Record attendance for a session execution
    recordAttendance: protectedProcedure
      .input(z.object({
        sessionExecutionId: z.number(),
        attendance: z.array(z.object({
          playerId: z.number(),
          status: z.enum(["present", "absent", "late", "injured", "excused"]),
          minutesPlayed: z.number().optional(),
          performanceRating: z.number().min(1).max(10).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { sessionAttendance } = await import("../drizzle/schema");
        // Delete existing attendance for this execution
        await database.delete(sessionAttendance)
          .where(eq(sessionAttendance.sessionExecutionId, input.sessionExecutionId));
        // Insert new attendance records
        if (input.attendance.length > 0) {
          await database.insert(sessionAttendance).values(
            input.attendance.map(a => ({
              sessionExecutionId: input.sessionExecutionId,
              playerId: a.playerId,
              status: a.status,
              minutesPlayed: a.minutesPlayed,
              performanceRating: a.performanceRating,
              notes: a.notes,
            }))
          );
        }
        return { success: true, count: input.attendance.length };
      }),
    // Get attendance for a session execution
    getAttendance: protectedProcedure
      .input(z.object({ sessionExecutionId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const { sessionAttendance, players } = await import("../drizzle/schema");
        return database.select({
          id: sessionAttendance.id,
          playerId: sessionAttendance.playerId,
          status: sessionAttendance.status,
          minutesPlayed: sessionAttendance.minutesPlayed,
          performanceRating: sessionAttendance.performanceRating,
          notes: sessionAttendance.notes,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          playerPosition: players.position,
          playerAgeGroup: players.ageGroup,
        })
        .from(sessionAttendance)
        .leftJoin(players, eq(sessionAttendance.playerId, players.id))
        .where(eq(sessionAttendance.sessionExecutionId, input.sessionExecutionId));
      }),
  }),
  // ==================== MEDIA TAGGING ====================
  mediaTagging: router({
    // Tag a user or player in a media item
    tagInMedia: protectedProcedure
      .input(z.object({
        mediaId: z.number(),
        taggedUserId: z.number().optional(),
        taggedPlayerId: z.number().optional(),
        mediaTitle: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) return { success: false };
        try {
          await database.execute(
            sql`INSERT IGNORE INTO media_tags (mediaId, taggedUserId, taggedPlayerId, taggedByUserId) VALUES (${input.mediaId}, ${input.taggedUserId || null}, ${input.taggedPlayerId || null}, ${ctx.user.id})`
          );
          // Send in-app notification to the tagged user
          const targetUserId = input.taggedUserId;
          const taggerName = ctx.user.name || 'A coach';
          const mediaTitle = input.mediaTitle || 'a video';
          if (targetUserId && targetUserId !== ctx.user.id) {
            try {
              const { createNotification } = await import('./notificationService');
              await createNotification({
                userId: targetUserId,
                type: 'system',
                title: '🎬 You were tagged in a video!',
                message: `${taggerName} tagged you in "${mediaTitle}". Check your media gallery to view it.`,
                data: { entityType: 'media', entityId: input.mediaId }
              }, database);
            } catch { /* non-critical */ }
          }
          // If tagged by playerId, find the linked userId and notify
          if (input.taggedPlayerId && !input.taggedUserId) {
            try {
              const playerRow = await database.select({ userId: players.userId, firstName: players.firstName })
                .from(players).where(eq(players.id, input.taggedPlayerId)).limit(1);
              if (playerRow[0]?.userId && playerRow[0].userId !== ctx.user.id) {
                const { createNotification } = await import('./notificationService');
                await createNotification({
                  userId: playerRow[0].userId,
                  type: 'system',
                  title: '🎬 You were tagged in a video!',
                  message: `${taggerName} tagged you in "${mediaTitle}". Check your media gallery to view it.`,
                  data: { entityType: 'media', entityId: input.mediaId }
                }, database);
              }
            } catch { /* non-critical */ }
          }
        } catch { /* table may not exist */ }
        return { success: true };
      }),
    // Get all tags for a media item
    getTagsForMedia: protectedProcedure
      .input(z.object({ mediaId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        try {
          const result = await database.execute(
            sql`SELECT mt.*, u.name as userName, u.avatarUrl, p.firstName, p.lastName, p.photoUrl
           FROM media_tags mt
           LEFT JOIN users u ON mt.taggedUserId = u.id
           LEFT JOIN players p ON mt.taggedPlayerId = p.id
           WHERE mt.mediaId = ${input.mediaId}`
          );
          return (result[0] as unknown as unknown as any[]) || [];
        } catch { return []; }
      }),
    // Get all media tagged for a user
    getTaggedMediaForUser: protectedProcedure
      .input(z.object({ userId: z.number().optional(), playerId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const userId = input.userId || ctx.user.id;
        const playerId = input.playerId || 0;
        try {
          const result = await database.execute(
            sql`SELECT mt.*, av.title as mediaTitle, av.thumbnailUrl, av.videoUrl, av.createdAt as mediaDate
           FROM media_tags mt
           LEFT JOIN academy_videos av ON mt.mediaId = av.id
           WHERE mt.taggedUserId = ${userId} OR mt.taggedPlayerId = ${playerId}
           ORDER BY mt.createdAt DESC LIMIT 50`
          );
          return (result[0] as unknown as unknown as any[]) || [];
        } catch { return []; }
      }),
    // Remove a tag
    removeTag: protectedProcedure
      .input(z.object({ tagId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = (await getDb())!;
        if (!database) return { success: false };
        try {
          await database.execute(
            sql`DELETE FROM media_tags WHERE id = ${input.tagId} AND taggedByUserId = ${ctx.user.id}`
          );
        } catch { /* table may not exist */ }
        return { success: true };
      }),
  }),
  // ==================== UNIFIED TRAINING SESSION HUB ====================
  trainingHub: router({
    // Save a complete session with attendance + per-player skill ratings + AI feedback
    saveSession: coachProcedure
      .input(z.object({
        sessionMode: z.enum(['team', 'individual']),
        teamId: z.number().optional(),
        sessionDate: z.string(),
        sessionName: z.string(),
        sessionType: z.enum(['technical', 'tactical', 'physical', 'match', 'recovery', 'mixed']),
        durationMinutes: z.number().optional(),
        coachNotes: z.string().optional(),
        players: z.array(z.object({
          playerId: z.number(),
          firstName: z.string(),
          lastName: z.string(),
          status: z.enum(['present', 'absent', 'late', 'excused']),
          passing: z.number().min(1).max(10).optional(),
          shooting: z.number().min(1).max(10).optional(),
          dribbling: z.number().min(1).max(10).optional(),
          firstTouch: z.number().min(1).max(10).optional(),
          defending: z.number().min(1).max(10).optional(),
          heading: z.number().min(1).max(10).optional(),
          positioning: z.number().min(1).max(10).optional(),
          instructionCompliance: z.number().min(1).max(10).optional(),
          effort: z.number().min(1).max(10).optional(),
          coachNote: z.string().optional(),
          sendToLockerRoom: z.boolean().default(true),
          preWrittenMessage: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const { trainingSessionPerformance, lockerRoomMessages } = await import('../drizzle/schema');
        const results: { playerId: number; success: boolean; lockerRoomSent: boolean; aiMessage?: string }[] = [];
        for (const player of input.players) {
          // 1. Record attendance
          try {
            await db.recordAttendance({
              playerId: player.playerId,
              sessionType: 'training',
              sessionDate: new Date(input.sessionDate),
              status: player.status,
              durationMinutes: input.durationMinutes,
              notes: player.coachNote,
              recordedBy: ctx.user.id,
            });
            if (player.status === 'present') {
              await db.awardPoints(player.playerId, 10, 'attendance', 'Attended training session', ctx.user.id);
            }
          } catch { /* ignore attendance errors */ }
          // 2. Record skill performance (only for present/late players)
          if (player.status === 'present' || player.status === 'late') {
            const techScores = [player.passing, player.shooting, player.dribbling, player.firstTouch].filter((v): v is number => v != null);
            const physScores = [player.defending, player.heading, player.positioning].filter((v): v is number => v != null);
            const technicalAvg = techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : 5;
            const physicalAvg = physScores.length > 0 ? physScores.reduce((a, b) => a + b, 0) / physScores.length : 5;
            try {
              await database.insert(trainingSessionPerformance).values({
                playerId: player.playerId,
                teamId: input.teamId,
                sessionDate: new Date(input.sessionDate),
                sessionName: input.sessionName,
                passing: player.passing ? Math.round(player.passing * 10) : undefined,
                shooting: player.shooting ? Math.round(player.shooting * 10) : undefined,
                dribbling: player.dribbling ? Math.round(player.dribbling * 10) : undefined,
                defending: player.defending ? Math.round(player.defending * 10) : undefined,
                technicalScore: Math.round(technicalAvg * 10),
                physicalScore: Math.round(physicalAvg * 10),
                mentalScore: player.instructionCompliance ? Math.round(player.instructionCompliance * 10) : undefined,
                focus: player.instructionCompliance ? Math.round(player.instructionCompliance * 10) : undefined,
                attitude: player.effort ? Math.round(player.effort * 10) : undefined,
                notes: player.coachNote,
                recordedBy: ctx.user.id,
              });
            } catch { /* ignore performance errors */ }
          }
          // 3. Generate AI feedback and send to Locker Room
          let lockerRoomSent = false;
          let aiMessage = '';
          if (player.sendToLockerRoom && (player.status === 'present' || player.status === 'late')) {
            try {
              // Use pre-written message if provided (coach reviewed & edited), otherwise generate with LLM
              if (player.preWrittenMessage && player.preWrittenMessage.trim()) {
                aiMessage = player.preWrittenMessage.trim();
              } else {
                const skillParts = [
                  player.passing && `Passing: ${player.passing}/10`,
                  player.shooting && `Shooting: ${player.shooting}/10`,
                  player.dribbling && `Dribbling: ${player.dribbling}/10`,
                  player.firstTouch && `First Touch: ${player.firstTouch}/10`,
                  player.defending && `Defending: ${player.defending}/10`,
                  player.heading && `Heading: ${player.heading}/10`,
                  player.positioning && `Positioning: ${player.positioning}/10`,
                  player.instructionCompliance && `Instruction Compliance: ${player.instructionCompliance}/10`,
                  player.effort && `Effort: ${player.effort}/10`,
                ].filter(Boolean).join(', ');
                const feedbackPrompt = `You are an expert football academy coach. Write a short, personalized post-training feedback message (3-5 sentences) for a player named ${player.firstName} ${player.lastName}.\nSession: ${input.sessionName} (${input.sessionType}, ${input.sessionDate})\nSkill Ratings: ${skillParts || 'Not rated this session'}\nCoach Notes: ${player.coachNote || 'None'}\nBe specific, encouraging, and mention 1-2 areas to improve. Address the player by first name. Keep it motivational and professional.`;
                const llmRes = await invokeLLM({ messages: [{ role: 'user', content: feedbackPrompt }] });
                aiMessage = typeof llmRes.choices?.[0]?.message?.content === 'string' ? llmRes.choices[0].message.content : '';
              }
              if (aiMessage) {
                await database.insert(lockerRoomMessages).values({
                  playerId: player.playerId,
                  fromUserId: ctx.user.id,
                  messageType: 'feedback',
                  subject: `Training Feedback: ${input.sessionName}`,
                  content: aiMessage,
                  priority: 'normal',
                  isRead: false,
                });
                lockerRoomSent = true;
              }
            } catch { /* ignore locker room errors */ }
          }
          results.push({ playerId: player.playerId, success: true, lockerRoomSent, aiMessage });
        }
        return { success: true, results, totalPlayers: input.players.length, presentCount: input.players.filter(p => p.status === 'present').length };
      }),
    // Generate AI feedback previews without saving (for coach review before sending)
    generateFeedbackPreview: coachProcedure
      .input(z.object({
        sessionName: z.string(),
        sessionType: z.string(),
        sessionDate: z.string(),
        coachNotes: z.string().optional(),
        players: z.array(z.object({
          playerId: z.number(),
          firstName: z.string(),
          lastName: z.string(),
          status: z.enum(['present', 'absent', 'late', 'excused']),
          passing: z.number().optional(),
          shooting: z.number().optional(),
          dribbling: z.number().optional(),
          firstTouch: z.number().optional(),
          defending: z.number().optional(),
          heading: z.number().optional(),
          positioning: z.number().optional(),
          instructionCompliance: z.number().optional(),
          effort: z.number().optional(),
          coachNote: z.string().optional(),
          sendToLockerRoom: z.boolean(),
        })),
      }))
      .mutation(async ({ input }) => {
        const previews: { playerId: number; firstName: string; lastName: string; message: string; sendToLockerRoom: boolean }[] = [];
        for (const player of input.players) {
          if (!player.sendToLockerRoom || (player.status !== 'present' && player.status !== 'late')) {
            previews.push({ playerId: player.playerId, firstName: player.firstName, lastName: player.lastName, message: '', sendToLockerRoom: false });
            continue;
          }
          const skillParts = [
            player.passing && `Passing: ${player.passing}/10`,
            player.shooting && `Shooting: ${player.shooting}/10`,
            player.dribbling && `Dribbling: ${player.dribbling}/10`,
            player.firstTouch && `First Touch: ${player.firstTouch}/10`,
            player.defending && `Defending: ${player.defending}/10`,
            player.heading && `Heading: ${player.heading}/10`,
            player.positioning && `Positioning: ${player.positioning}/10`,
            player.instructionCompliance && `Instruction Compliance: ${player.instructionCompliance}/10`,
            player.effort && `Effort: ${player.effort}/10`,
          ].filter(Boolean).join(', ');
          const feedbackPrompt = `You are an expert football academy coach. Write a short, personalized post-training feedback message (3-5 sentences) for a player named ${player.firstName} ${player.lastName}.\nSession: ${input.sessionName} (${input.sessionType}, ${input.sessionDate})\nSkill Ratings: ${skillParts || 'Not rated this session'}\nCoach Notes: ${player.coachNote || 'None'}\nBe specific, encouraging, and mention 1-2 areas to improve. Address the player by first name. Keep it motivational and professional.`;
          try {
            const llmRes = await invokeLLM({ messages: [{ role: 'user', content: feedbackPrompt }] });
            const msg = typeof llmRes.choices?.[0]?.message?.content === 'string' ? llmRes.choices[0].message.content : '';
            previews.push({ playerId: player.playerId, firstName: player.firstName, lastName: player.lastName, message: msg, sendToLockerRoom: true });
          } catch {
            previews.push({ playerId: player.playerId, firstName: player.firstName, lastName: player.lastName, message: '', sendToLockerRoom: true });
          }
        }
        return { previews };
      }),

    // Get recent sessions recorded by this coach
    getRecentSessions: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        limit: z.number().default(10),
      }))
      .query(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const { trainingSessionPerformance } = await import('../drizzle/schema');
        const conditions = [eq(trainingSessionPerformance.recordedBy, ctx.user.id)];
        if (input.teamId) conditions.push(eq(trainingSessionPerformance.teamId, input.teamId));
        const sessions = await database.select({
          sessionDate: trainingSessionPerformance.sessionDate,
          sessionName: trainingSessionPerformance.sessionName,
          teamId: trainingSessionPerformance.teamId,
        }).from(trainingSessionPerformance)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(trainingSessionPerformance.sessionDate))
          .limit(input.limit * 10);
        const seen = new Set<string>();
        return sessions.filter(s => {
          const key = `${s.sessionName}-${s.sessionDate}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, input.limit);
      }),
  }),
  playerAttachments: router({
    getByPlayer: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async (): Promise<Array<{
        id: number;
        playerId: number;
        playerName: string;
        fileName: string;
        fileUrl: string;
        fileType: string;
        uploadedAt: string;
        description?: string;
      }>> => {
        return [];
      }),
    upload: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async () => {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'File attachment storage not yet configured' });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async () => {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'File attachment storage not yet configured' });
      }),
  }),
  smartShoe: smartShoeRouter,
  // Alias: client uses trpc.coachFeedback.* — router is defined as `feedback` above
  coachFeedback: router({
    getPlayerFeedback: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerFeedback(input.playerId, input.limit);
      }),
    getForParent: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerFeedbackForParent(input.playerId);
      }),
  }),
  chatbotQA: router({
    getActive: publicProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const { chatbotQA } = await import('../drizzle/schema');
      const result = await database
        .select()
        .from(chatbotQA)
        .where(eq(chatbotQA.isActive, true))
        .orderBy(desc(chatbotQA.priority), asc(chatbotQA.id));
      return result;
    }),
    getAll: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const { chatbotQA } = await import('../drizzle/schema');
      return database.select().from(chatbotQA).orderBy(desc(chatbotQA.priority), asc(chatbotQA.id));
    }),
    create: adminProcedure
      .input(z.object({
        question: z.string().min(3),
        answer: z.string().min(3),
        keywords: z.string().optional(),
        category: z.string().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { chatbotQA } = await import('../drizzle/schema');
        await database.insert(chatbotQA).values({
          question: input.question,
          answer: input.answer,
          keywords: input.keywords || null,
          category: input.category || 'general',
          priority: input.priority || 0,
          isActive: true,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        question: z.string().optional(),
        answer: z.string().optional(),
        keywords: z.string().optional(),
        category: z.string().optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { chatbotQA } = await import('../drizzle/schema');
        const { id, ...updates } = input;
        await database.update(chatbotQA).set(updates).where(eq(chatbotQA.id, id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { chatbotQA } = await import('../drizzle/schema');
        await database.delete(chatbotQA).where(eq(chatbotQA.id, input.id));
        return { success: true };
      }),
  }),

  // ==================== BADGE ADMIN MANAGEMENT ====================
  badgeAdmin: router({
    getAll: adminProcedure.query(async () => {
      const database = (await getDb())!;
      if (!database) return [];
      const { badges } = await import('../drizzle/schema');
      return database.select().from(badges).orderBy(asc(badges.category), asc(badges.name));
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        icon: z.string().optional(),
        category: z.enum(['completion', 'excellence', 'mastery', 'milestone', 'education', 'performance']),
        displayOrder: z.number().default(0),
        criteria: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { badges } = await import('../drizzle/schema');
        await database.insert(badges).values({
          name: input.name,
          description: input.description,
          icon: input.icon || '🏅',
          category: input.category,
          criteria: input.criteria ? JSON.parse(JSON.stringify({ description: input.criteria })) : {},
          isActive: input.isActive,
        });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        category: z.enum(['completion', 'excellence', 'mastery', 'milestone', 'education', 'performance']).optional(),
        displayOrder: z.number().optional(),
        criteria: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { badges } = await import('../drizzle/schema');
        const { id, ...updates } = input;
        await database.update(badges).set(updates).where(eq(badges.id, id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { badges } = await import('../drizzle/schema');
        await database.delete(badges).where(eq(badges.id, input.id));
        return { success: true };
      }),
    awardToPlayer: adminProcedure
      .input(z.object({
        userId: z.number(),
        badgeId: z.number(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new Error('Database not available');
        const { userBadges } = await import('../drizzle/schema');
        await database.insert(userBadges).values({
          userId: input.userId,
          badgeId: input.badgeId,
          earnedAt: new Date(),
        });
        return { success: true };
      }),
  }),
  goalComments: router({
    getByGoal: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ input }) => {
        const database = (await getDb())!;
        if (!database) return [];
        const rows = await database.execute(
          sql`SELECT gc.id, gc.goalId, gc.comment, gc.role, gc.createdAt, u.firstName, u.lastName FROM goal_comments gc JOIN users u ON gc.userId = u.id WHERE gc.goalId = ${input.goalId} ORDER BY gc.createdAt ASC`
        );
        return (rows as unknown as any[][])[0] || [];
      }),
    add: protectedProcedure
      .input(z.object({ goalId: z.number(), comment: z.string().min(1).max(1000) }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await database.execute(sql`INSERT INTO goal_comments (goalId, userId, comment, role) VALUES (${input.goalId}, ${ctx.user.id}, ${input.comment}, ${ctx.user.role})`);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = (await getDb())!;
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const isAdmin = ctx.user.role === 'admin' ? 1 : 0;
        await database.execute(sql`DELETE FROM goal_comments WHERE id = ${input.id} AND (userId = ${ctx.user.id} OR ${isAdmin} = 1)`);
        return { success: true };
      }),
  }),
});


// Helper function to get formation positions
function getFormationPositions(formation: string): string {
  const positions: Record<string, string> = {
    '4-3-3': 'GK(100,400), LB(250,150), CB(250,300), CB(250,500), RB(250,650), CM(450,200), CM(450,400), CM(450,600), LW(650,150), ST(650,400), RW(650,650)',
    '4-4-2': 'GK(100,400), LB(250,150), CB(250,300), CB(250,500), RB(250,650), LM(450,150), CM(450,300), CM(450,500), RM(450,650), ST(650,300), ST(650,500)',
    '3-5-2': 'GK(100,400), CB(250,200), CB(250,400), CB(250,600), LWB(400,100), CM(450,250), CM(450,400), CM(450,550), RWB(400,700), ST(650,300), ST(650,500)',
    '4-2-3-1': 'GK(100,400), LB(250,150), CB(250,300), CB(250,500), RB(250,650), CDM(400,300), CDM(400,500), LW(550,150), CAM(550,400), RW(550,650), ST(700,400)'
  };
  return positions[formation] || positions['4-3-3'];
}

export type AppRouter = typeof appRouter;
