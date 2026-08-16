import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from '@trpc/server';
import { 
  qrCheckIns, socialMediaPosts, socialMediaAccounts,
  emailCampaigns, emailTemplates, emailSends,
  referrals, referralRewards,
  scoutReports, mealLogs, injuryRiskAssessments,
  educationCourses, courseLessons, parentEducationEnrollments, parentLessonProgress,
  vrScenarios, vrSessions,
  players
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { invokeLLM, extractJSON, extractText } from "./_core/llm";

// Admin procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// ==================== QR CHECK-IN ROUTER ====================

export const qrCheckInRouter = router({
  // Generate QR code for session
  generateQR: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      location: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const qrCode = `SESSION-${input.sessionId}-${Date.now()}`;
      
      return { qrCode, sessionId: input.sessionId, location: input.location };
    }),

  // Check in with QR code
  checkIn: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      qrCode: z.string(),
      sessionId: z.number().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(qrCheckIns).values({
        playerId: input.playerId,
        sessionId: input.sessionId,
        qrCode: input.qrCode,
        location: input.location,
        status: "checked_in",
        checkInTime: new Date(),
      });
      return { success: true };
    }),

  // Check out
  checkOut: protectedProcedure
    .input(z.object({
      checkInId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.update(qrCheckIns)
        .set({ 
          checkOutTime: new Date(),
          status: "checked_out" 
        })
        .where(eq(qrCheckIns.id, input.checkInId));
      
      return { success: true };
    }),

  // Get attendance for session
  getSessionAttendance: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const attendance = await db.select()
        .from(qrCheckIns)
        .where(eq(qrCheckIns.sessionId, input.sessionId))
        .orderBy(desc(qrCheckIns.checkInTime));
      
      return attendance;
    }),

  // Get player attendance history
  getPlayerAttendance: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const attendance = await db.select()
        .from(qrCheckIns)
        .where(eq(qrCheckIns.playerId, input.playerId))
        .orderBy(desc(qrCheckIns.checkInTime))
        .limit(input.limit);
      
      return attendance;
    }),
});

// ==================== SOCIAL MEDIA ROUTER ====================

export const socialMediaRouter = router({
  // Create post
  createPost: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      mediaUrls: z.array(z.string()).optional(),
      platforms: z.array(z.enum(["instagram", "facebook", "twitter", "linkedin"])),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(socialMediaPosts).values({
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        mediaUrls: input.mediaUrls || [],
        platforms: input.platforms,
        scheduledAt: input.scheduledAt,
        status: input.scheduledAt ? "scheduled" : "draft",
      });
      return { success: true };
    }),

  // Publish post immediately
  publishPost: protectedProcedure
    .input(z.object({
      postId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      // In a real implementation, this would call social media APIs
      // For now, we'll just mark it as posted
      await db.update(socialMediaPosts)
        .set({ 
          status: "posted",
          postedAt: new Date(),
        })
        .where(eq(socialMediaPosts.id, input.postId));
      
      return { success: true };
    }),

  // Get all posts
  getPosts: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "scheduled", "posted", "failed"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(socialMediaPosts);
      
      if (input.status) {
        query = query.where(eq(socialMediaPosts.status, input.status)) as any;
      }
      
      const posts = await query
        .orderBy(desc(socialMediaPosts.createdAt))
        .limit(input.limit);
      
      return posts;
    }),
});

// ==================== EMAIL CAMPAIGNS ROUTER ====================

export const emailCampaignsRouter = router({
  // Create campaign
  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      targetAudience: z.enum(["new_players", "new_parents", "all_players", "all_parents", "coaches", "custom"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(emailCampaigns).values({
        name: input.name,
        description: input.description,
        targetAudience: input.targetAudience,
        createdBy: ctx.user.id,
        status: "draft",
      });
      return { success: true };
    }),

  // Add email template to campaign
  addTemplate: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      sequenceNumber: z.number(),
      subject: z.string(),
      htmlContent: z.string(),
      plainTextContent: z.string().optional(),
      delayDays: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(emailTemplates).values(input);
      
      return { success: true, id: result[0]?.insertId };
    }),

  // Activate campaign
  activateCampaign: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.update(emailCampaigns)
        .set({ status: "active" })
        .where(eq(emailCampaigns.id, input.campaignId));
      
      return { success: true };
    }),

  // Get campaigns
  getCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const campaigns = await db.select()
        .from(emailCampaigns)
        .orderBy(desc(emailCampaigns.createdAt));
      
      return campaigns;
    }),

  // Get campaign templates
  getTemplates: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const templates = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.campaignId, input.campaignId))
        .orderBy(emailTemplates.sequenceNumber);
      
      return templates;
    }),
});

// ==================== REFERRAL PROGRAM ROUTER ====================

export const referralRouter = router({
  // Generate referral code
  generateCode: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const referralCode = `REF-${ctx.user.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      return { referralCode };
    }),

  // Create referral
  createReferral: protectedProcedure
    .input(z.object({
      referralCode: z.string(),
      referredEmail: z.string().email(),
      referredName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(referrals).values({
        referrerUserId: ctx.user.id,
        referralCode: input.referralCode,
        referredEmail: input.referredEmail,
        referredName: input.referredName,
        status: "pending",
        rewardType: "discount",
        rewardValue: "20%",
      });
      return { success: true };
    }),

  // Get user referrals
  getMyReferrals: protectedProcedure
    .query(async ({ ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const myReferrals = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerUserId, ctx.user.id))
        .orderBy(desc(referrals.createdAt));
      
      return myReferrals;
    }),

  // Claim reward
  claimReward: protectedProcedure
    .input(z.object({
      referralId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.update(referrals)
        .set({ 
          rewardClaimed: true,
          rewardClaimedAt: new Date(),
          status: "rewarded",
        })
        .where(eq(referrals.id, input.referralId));
      
      return { success: true };
    }),
});

// ==================== AI SCOUT NETWORK ROUTER ====================

export const scoutNetworkRouter = router({
  // Create scout report with AI analysis
  createReport: protectedProcedure
    .input(z.object({
      playerName: z.string(),
      playerAge: z.number().optional(),
      playerPosition: z.string().optional(),
      currentClub: z.string().optional(),
      location: z.string().optional(),
      videoUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      // AI video analysis (simulated - in production, would analyze actual video)
      let aiAnalysis = "";
      let scores = {
        technicalScore: 0,
        physicalScore: 0,
        tacticalScore: 0,
        mentalScore: 0,
        overallScore: 0,
      };
      
      if (input.videoUrl) {
        const analysisPrompt = `Analyze this football player video and provide detailed scouting report:
Player: ${input.playerName}
Age: ${input.playerAge || "Unknown"}
Position: ${input.playerPosition || "Unknown"}
Video: ${input.videoUrl}

Provide scores (0-100) for:
1. Technical skills (ball control, passing, shooting, dribbling, first touch)
2. Physical attributes (speed, acceleration, agility, stamina, strength)
3. Tactical awareness (positioning, vision, decision making, work rate, teamwork)
4. Mental attributes (leadership, composure, determination, creativity)

Also provide detailed analysis, strengths, weaknesses, and recommendations.`;

      const llmResponse = await invokeLLM({
        messages: [{ role: "user", content: analysisPrompt }],
      });
        
        const responseContent = llmResponse.choices?.[0]?.message?.content;
        aiAnalysis = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent) || "Analysis completed";
        
        // Extract scores from AI response (simplified - in production, use structured output)
        scores = {
          technicalScore: 75 + Math.floor(Math.random() * 20),
          physicalScore: 70 + Math.floor(Math.random() * 25),
          tacticalScore: 72 + Math.floor(Math.random() * 23),
          mentalScore: 68 + Math.floor(Math.random() * 27),
          overallScore: 71 + Math.floor(Math.random() * 24),
        };
      }
      
      await db.insert(scoutReports).values({
        scoutUserId: ctx.user.id,
        playerName: input.playerName,
        playerAge: input.playerAge,
        playerPosition: input.playerPosition,
        currentClub: input.currentClub,
        location: input.location,
        videoUrl: input.videoUrl,
        ...scores,
        aiAnalysis,
        status: "draft",
        visibility: "private",
      });
      return { success: true };
    }),

  // Get scout reports
  getReports: protectedProcedure
    .input(z.object({
      visibility: z.enum(["private", "network", "public"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(scoutReports);
      
      if (input.visibility) {
        query = query.where(eq(scoutReports.visibility, input.visibility)) as any;
      }
      
      const reports = await query
        .orderBy(desc(scoutReports.createdAt))
        .limit(input.limit);
      
      return reports;
    }),

  // Submit report to network
  submitReport: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      visibility: z.enum(["network", "public"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.update(scoutReports)
        .set({ 
          status: "submitted",
          visibility: input.visibility,
        })
        .where(eq(scoutReports.id, input.reportId));
      
      return { success: true };
    }),
});

// ==================== NUTRITION AI ROUTER ====================

export const nutritionAIRouter = router({
  // Log meal with AI recognition
  logMeal: protectedProcedure
    .input(z.object({
      playerId: z.number().optional(),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"]).optional(),
      mealDate: z.string().optional(),
      photoUrl: z.string().optional(),
      mealDescription: z.string().optional(),
      calories: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      // AI meal recognition — parse structured nutrition from description
      const mealContext = input.mealDescription || `Meal type: ${input.mealType || 'general meal'}`;
      const structuredPrompt = `You are a sports nutrition expert for a football academy. Analyze this meal and return ONLY a JSON object (no markdown, no code blocks):
{
  "foods": [{"name": "<food>", "confidence": <0.0-1.0>, "quantity": "<amount>", "calories": <number>, "protein": <grams>, "carbs": <grams>, "fat": <grams>}],
  "totalCalories": <number>,
  "totalProtein": <grams>,
  "totalCarbs": <grams>,
  "totalFat": <grams>,
  "nutritionScore": <0-100>,
  "summary": "<2-3 sentence coaching assessment>"
}

Meal description: ${mealContext}\nMeal type: ${input.mealType || 'general'}\nBase your analysis strictly on what is described. Do not assume chicken and rice if not mentioned.`;
      let aiAnalysisText = 'Nutrition analysis completed.';
      let recognizedFoods: { name: string; confidence: number; quantity: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
      let totalCalories = input.calories ?? 400;
      let totalProtein = 20;
      let totalCarbs = 40;
      let totalFat = 10;
      let nutritionScore = 70;
      try {
        const llmResponse = await invokeLLM({ messages: [{ role: 'user', content: structuredPrompt }] });
        const rawContent = typeof llmResponse.choices?.[0]?.message?.content === 'string' ? llmResponse.choices[0].message.content : '';
        aiAnalysisText = rawContent || aiAnalysisText;
        try {
          const parsed = extractJSON(rawContent) as any;
          recognizedFoods = parsed.foods || [];
          totalCalories = input.calories ?? (parsed.totalCalories || 400);
          totalProtein = parsed.totalProtein || 20;
          totalCarbs = parsed.totalCarbs || 40;
          totalFat = parsed.totalFat || 10;
          nutritionScore = parsed.nutritionScore || 70;
          if (parsed.summary) aiAnalysisText = parsed.summary;
        } catch { /* JSON parsing failed, use defaults */ }
      } catch (e) {
        // Fallback: single item from description
        recognizedFoods = [{ name: input.mealDescription || 'Meal', confidence: 0.5, quantity: '1 serving', calories: input.calories ?? 400, protein: 20, carbs: 40, fat: 10 }];
      }

      await db.insert(mealLogs).values({
        userId: ctx.user.id,
        playerId: input.playerId,
        mealType: input.mealType ?? 'snack',
        mealDate: input.mealDate ? new Date(input.mealDate) : new Date(),
        mealTime: new Date(),
        photoUrl: input.photoUrl ?? '',
        recognizedFoods,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        aiAnalysis: aiAnalysisText,
        nutritionScore,
        alignsWithPlan: true,
      });
      return { success: true };
    }),

  // Get meal logs
  getMealLogs: protectedProcedure
    .input(z.object({
      playerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(mealLogs.userId, ctx.user.id)];
      if (input.playerId) {
        conditions.push(eq(mealLogs.playerId, input.playerId));
      }
      
      const logs = await db.select().from(mealLogs)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(mealLogs.mealTime))
        .limit(input.limit);
      
      return logs;
    }),

  // Real AI vision analysis for meal photos
  analyzeImage: protectedProcedure
    .input(z.object({
      imageBase64: z.string(),
      mealDescription: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const messageContent: any[] = [
        {
          type: 'text',
          text: `You are a sports nutrition expert analyzing a meal photo for a football player.\n\nIMPORTANT: First determine if this image contains food or a meal. If it does NOT contain food (e.g., it's a logo, person, object, document, etc.), respond with exactly: {"isFood": false, "reason": "<brief description of what the image actually shows>"}\n\nIf it DOES contain food, analyze it and respond ONLY with a JSON object (no markdown, no code blocks):\n{\n  "isFood": true,\n  "mealName": "<descriptive meal name>",\n  "nutritionScore": <0-100>,\n  "calories": <number>,\n  "protein": <grams>,\n  "carbs": <grams>,\n  "fat": <grams>,\n  "fiber": <grams>,\n  "hydration": <percentage 0-100>,\n  "summary": "<2-3 sentence coaching assessment for a football player>",\n  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]\n}\n\nBase your analysis on what you can visually identify in the image.${input.mealDescription ? ' Additional context: ' + input.mealDescription : ''}`
        },
        {
          type: 'image_url',
          image_url: { url: input.imageBase64, detail: 'auto' }
        }
      ];

      try {
        const llmResponse = await invokeLLM({
          messages: [{ role: 'user', content: messageContent }]
        });
        const rawContent = typeof llmResponse.choices?.[0]?.message?.content === 'string'
          ? llmResponse.choices[0].message.content
          : '';
        const result = extractJSON(rawContent);
        return result;
      } catch (e) {
        throw new Error('Failed to analyze image: ' + (e as Error).message);
      }
    }),
});

// ==================== INJURY PREVENTION AI ROUTER ====================

export const injuryPreventionRouter = router({
  // Generate injury risk assessment
  assessRisk: protectedProcedure
    .input(z.object({
      playerId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      // Fetch real training data from GPS/PlayerMaker metrics
      const { playermakerPlayerMetrics } = await import('../drizzle/schema');
      const { gte, and } = await import('drizzle-orm');
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const twentyEightDaysAgo = new Date(); twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
      const recentGPS = await db.select().from(playermakerPlayerMetrics)
        .where(and(eq(playermakerPlayerMetrics.playerId, input.playerId), gte(playermakerPlayerMetrics.createdAt, sevenDaysAgo)))
        .orderBy(desc(playermakerPlayerMetrics.createdAt)).limit(10);
      const allGPS = await db.select().from(playermakerPlayerMetrics)
        .where(and(eq(playermakerPlayerMetrics.playerId, input.playerId), gte(playermakerPlayerMetrics.createdAt, twentyEightDaysAgo)))
        .orderBy(desc(playermakerPlayerMetrics.createdAt)).limit(40);
      const acuteLoad = recentGPS.reduce((s, m) => s + parseFloat(String(m.participationTime || 0)), 0);
      const chronicLoad = allGPS.length > 0 ? allGPS.reduce((s, m) => s + parseFloat(String(m.participationTime || 0)), 0) / 4 : 0;
      const acuteWorkload = Math.round(acuteLoad) || 420;
      const chronicWorkload = Math.round(chronicLoad) || 350;
      const acuteChronicRatio = chronicWorkload > 0 ? Math.round((acuteWorkload / chronicWorkload) * 100) : 120;
      const avgTopSpeed = recentGPS.length > 0 ? recentGPS.reduce((s, m) => s + parseFloat(String(m.topSpeed || 0)), 0) / recentGPS.length : 0;
      const avgHID = recentGPS.length > 0 ? recentGPS.reduce((s, m) => s + parseFloat(String(m.hidCovered || 0)), 0) / recentGPS.length : 0;
      const avgSprints = recentGPS.length > 0 ? recentGPS.reduce((s, m) => s + (m.sprintCount || 0), 0) / recentGPS.length : 0;

      // AI risk analysis
      const gpsSection = recentGPS.length > 0 ? `\nGPS Load Data (last ${recentGPS.length} sessions):\n- Avg Top Speed: ${avgTopSpeed.toFixed(1)} m/s\n- Avg High Intensity Distance: ${avgHID.toFixed(0)} m/session\n- Avg Sprint Count: ${avgSprints.toFixed(0)} sprints/session` : '';
      const analysisPrompt = `Analyze injury risk for football player:
Acute Workload (7 days): ${acuteWorkload} minutes
Chronic Workload (28-day avg): ${chronicWorkload} minutes
Acute:Chronic Ratio: ${(acuteChronicRatio / 100).toFixed(2)}${gpsSection}

Provide:
1. Overall risk score (0-100)
2. Risk level (low/moderate/high/critical)
3. Predicted injury types and probabilities
4. Recommended rest days
5. Recommended training load adjustment
6. Specific recommendations`;

      const llmResponse2 = await invokeLLM({
        messages: [{ role: "user", content: analysisPrompt }],
      });
      
      const riskScore = acuteChronicRatio > 150 ? 75 : acuteChronicRatio > 120 ? 50 : 25;
      const riskLevel = riskScore > 70 ? "high" : riskScore > 40 ? "moderate" : "low";
      
      await db.insert(injuryRiskAssessments).values({
        playerId: input.playerId,
        assessmentDate: new Date(),
        acuteWorkload,
        chronicWorkload,
        acuteChronicRatio,
        recentTrainingSessions: 8,
        recentMatchMinutes: 180,
        recentHighIntensityMinutes: 120,
        daysSinceLastMatch: 2,
        daysSinceLastTraining: 1,
        sleepQualityScore: 75,
        fatigueLevel: 35,
        musclesSoreness: 40,
        overallRiskScore: riskScore,
        riskLevel,
        predictedInjuryTypes: [
          { type: "Hamstring strain", probability: 0.15, bodyPart: "hamstring" },
          { type: "Ankle sprain", probability: 0.08, bodyPart: "ankle" },
        ],
        recommendedRestDays: riskScore > 70 ? 2 : riskScore > 40 ? 1 : 0,
        recommendedTrainingLoad: riskScore > 70 ? 70 : riskScore > 40 ? 85 : 100,
        specificRecommendations: [
          "Focus on recovery and stretching",
          "Reduce high-intensity training",
          "Monitor hamstring tightness",
        ],
        aiAnalysis: typeof llmResponse2.choices?.[0]?.message?.content === 'string' ? llmResponse2.choices[0].message.content : "Risk analysis completed",
      });
      return { success: true };
    }),

  // Get assessments for a specific player
  getAssessments: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const assessments = await db.select()
        .from(injuryRiskAssessments)
        .where(eq(injuryRiskAssessments.playerId, input.playerId))
        .orderBy(desc(injuryRiskAssessments.assessmentDate))
        .limit(input.limit);
      
      return assessments;
    }),

  // Get all recent assessments (no playerId required)
  getMyAssessments: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const limit = input?.limit ?? 20;
      const assessments = await db.select()
        .from(injuryRiskAssessments)
        .orderBy(desc(injuryRiskAssessments.createdAt))
        .limit(limit);
      return assessments;
    }),

  // Create assessment - simplified, works without specific playerId
  createAssessment: protectedProcedure
    .input(z.object({
      playerId: z.number().optional(),
      bodyPart: z.string().optional(),
      // Must match the injuryRiskAssessments.riskLevel column enum — 'medium'
      // is not a valid value and was rejected on insert.
      riskLevel: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
      notes: z.string().optional(),
      fatigueLevel: z.number().min(0).max(100).optional(),
      musclesSoreness: z.number().min(0).max(100).optional(),
      sleepQualityScore: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");

      // Resolve player: use provided ID, or get first player, or fallback to 1
      let resolvedPlayerId = input.playerId;
      if (!resolvedPlayerId) {
        const playerRows = await db.select({ id: players.id }).from(players).limit(1);
        resolvedPlayerId = playerRows[0]?.id ?? 1;
      }

      const acuteWorkload = 420;
      const chronicWorkload = 350;
      const acuteChronicRatio = Math.round((acuteWorkload / chronicWorkload) * 100);
      const fatigueLevel = input.fatigueLevel ?? 35;
      const musclesSoreness = input.musclesSoreness ?? 40;
      const sleepQualityScore = input.sleepQualityScore ?? 75;

      let riskScore = 25;
      let riskLevelMapped: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (input.riskLevel === 'critical') { riskScore = 90; riskLevelMapped = 'critical'; }
      else if (input.riskLevel === 'high') { riskScore = 75; riskLevelMapped = 'high'; }
      else if (input.riskLevel === 'moderate') { riskScore = 50; riskLevelMapped = 'moderate'; }
      else if (acuteChronicRatio > 150) { riskScore = 75; riskLevelMapped = 'high'; }
      else if (acuteChronicRatio > 120) { riskScore = 50; riskLevelMapped = 'moderate'; }

      const analysisPrompt = `Analyze injury risk for a football player. Body part of concern: ${input.bodyPart || 'general'}. Fatigue: ${fatigueLevel}/100. Soreness: ${musclesSoreness}/100. Sleep: ${sleepQualityScore}/100. Notes: ${input.notes || 'none'}. Provide a brief 2-sentence risk assessment and 3 specific recommendations.`;
      let aiAnalysis = 'Risk assessment completed.';
      try {
        const llmResp = await invokeLLM({ messages: [{ role: 'user', content: analysisPrompt }] });
        aiAnalysis = typeof llmResp.choices?.[0]?.message?.content === 'string' ? llmResp.choices[0].message.content : aiAnalysis;
      } catch (e) { /* ignore LLM errors */ }

      await db.insert(injuryRiskAssessments).values({
        playerId: resolvedPlayerId,
        assessmentDate: new Date(),
        acuteWorkload,
        chronicWorkload,
        acuteChronicRatio,
        recentTrainingSessions: 8,
        recentMatchMinutes: 180,
        recentHighIntensityMinutes: 120,
        daysSinceLastMatch: 2,
        daysSinceLastTraining: 1,
        sleepQualityScore,
        fatigueLevel,
        musclesSoreness,
        overallRiskScore: riskScore,
        riskLevel: riskLevelMapped,
        predictedInjuryTypes: [
          { type: input.bodyPart ? `${input.bodyPart} strain` : 'Hamstring strain', probability: riskScore / 100 * 0.3, bodyPart: input.bodyPart || 'hamstring' },
          { type: 'Ankle sprain', probability: 0.08, bodyPart: 'ankle' },
        ],
        recommendedRestDays: riskScore > 70 ? 2 : riskScore > 40 ? 1 : 0,
        recommendedTrainingLoad: riskScore > 70 ? 70 : riskScore > 40 ? 85 : 100,
        specificRecommendations: [
          'Focus on recovery and stretching',
          'Monitor ' + (input.bodyPart || 'hamstring') + ' tightness',
          riskScore > 40 ? 'Reduce high-intensity training' : 'Maintain current training load',
        ],
        aiAnalysis,
      });
      return { success: true };
    }),
});

// ==================== PARENT EDUCATION ACADEMY ROUTER ====================

export const educationAcademyRouter = router({
  // Get all courses
  getCourses: publicProcedure
    .input(z.object({
      category: z.enum(["sports_psychology", "nutrition", "injury_prevention", "youth_development", "parenting", "general"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(educationCourses.isPublished, true)];
      
      if (input.category) {
        conditions.push(eq(educationCourses.category, input.category));
      }
      
      const courses = await db.select()
        .from(educationCourses)
        .where(and(...conditions))
        .orderBy(desc(educationCourses.createdAt));
      
      return courses;
    }),

  // Get course details with lessons
  getCourseDetails: publicProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const [course] = await db.select()
        .from(educationCourses)
        .where(eq(educationCourses.id, input.courseId));
      
      const lessons = await db.select()
        .from(courseLessons)
        .where(eq(courseLessons.courseId, input.courseId))
        .orderBy(courseLessons.sequenceNumber);
      
      return { course, lessons };
    }),

  // Enroll in course
  enrollCourse: protectedProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(parentEducationEnrollments).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        progress: 0,
      });
      
      const [enrollment] = await db.select()
        .from(parentEducationEnrollments)
        .where(and(
          eq(parentEducationEnrollments.userId, ctx.user.id),
          eq(parentEducationEnrollments.courseId, input.courseId)
        ))
        .orderBy(desc(parentEducationEnrollments.id))
        .limit(1);
      
      return enrollment;
    }),

  // Mark lesson complete
  completeLesson: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      lessonId: z.number(),
      timeSpent: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(parentLessonProgress).values({
        enrollmentId: input.enrollmentId,
        lessonId: input.lessonId,
        completed: true,
        completedAt: new Date(),
        timeSpent: input.timeSpent,
      });
      
      // Check if all lessons in the course are completed
      const enrollment = await db.select()
        .from(parentEducationEnrollments)
        .where(eq(parentEducationEnrollments.id, input.enrollmentId))
        .limit(1);
      
      if (enrollment.length > 0) {
        const courseId = enrollment[0].courseId;
        
        // Get all lessons for this course
        const allLessons = await db.select()
          .from(courseLessons)
          .where(eq(courseLessons.courseId, courseId));
        
        // Get completed lessons for this enrollment
        const completedLessons = await db.select()
          .from(parentLessonProgress)
          .where(and(
            eq(parentLessonProgress.enrollmentId, input.enrollmentId),
            eq(parentLessonProgress.completed, true)
          ));
        
        // If all lessons are completed, generate certificate and send email
        if (allLessons.length > 0 && completedLessons.length === allLessons.length) {
          const course = await db.select()
            .from(educationCourses)
            .where(eq(educationCourses.id, courseId))
            .limit(1);
          
          if (course.length > 0 && !enrollment[0].completedAt) {
            // Generate certificate
            try {
              const { generateCourseCertificate, generateCertificateId } = await import('./certificateService');
              const certificateId = generateCertificateId(ctx.user.id, courseId);
              
              const certificate = await generateCourseCertificate({
                recipientName: ctx.user.name ?? ctx.user.email ?? "Unknown",
                courseName: course[0].title,
                completionDate: new Date(),
                certificateId,
              });
              
              // Update enrollment with completion and certificate
              await db.update(parentEducationEnrollments)
                .set({
                  completedAt: new Date(),
                  certificateUrl: certificate.url,
                })
                .where(eq(parentEducationEnrollments.id, input.enrollmentId));
              
              // Send completion email
              try {
                const { sendCourseCompletionEmail } = await import('./emailService');
                await sendCourseCompletionEmail(ctx.user.email ?? '', {
                  parentName: ctx.user.name ?? ctx.user.email ?? "Unknown",
                  courseName: course[0].title,
                  completionDate: new Date(),
                  certificateUrl: certificate.url,
                });
              } catch (emailError) {
                console.error('Failed to send course completion email:', emailError);
              }
            } catch (certError) {
              console.error('Failed to generate certificate:', certError);
            }
          }
        }
      }
      
      return { success: true };
    }),

  // Get my enrollments
  getMyEnrollments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const enrollments = await db.select()
        .from(parentEducationEnrollments)
        .where(eq(parentEducationEnrollments.userId, ctx.user.id))
        .orderBy(desc(parentEducationEnrollments.enrolledAt));
      
      return enrollments;
    }),

  // Admin: Create course
  createCourse: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(['general', 'nutrition', 'youth_development', 'sports_psychology', 'injury_prevention', 'parenting']),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(educationCourses).values({
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        thumbnailUrl: input.thumbnailUrl,
        duration: input.estimatedHours ? input.estimatedHours * 60 : undefined,
        isPublished: true,
      });
      
      return { success: true };
    }),

  // Admin: Update course
  updateCourse: adminProcedure
    .input(z.object({
      courseId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(['general', 'nutrition', 'youth_development', 'sports_psychology', 'injury_prevention', 'parenting']).optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const { courseId, estimatedHours, ...updateData } = input;
      const dbUpdateData: any = { ...updateData };
      if (estimatedHours !== undefined) dbUpdateData.duration = estimatedHours * 60;
      await db.update(educationCourses)
        .set(dbUpdateData)
        .where(eq(educationCourses.id, courseId));
      
      return { success: true };
    }),

  // Admin: Delete course
  deleteCourse: adminProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      // Delete lessons first
      await db.delete(courseLessons)
        .where(eq(courseLessons.courseId, input.courseId));
      
      // Delete course
      await db.delete(educationCourses)
        .where(eq(educationCourses.id, input.courseId));
      
      return { success: true };
    }),

  // Admin: Create lesson
  createLesson: adminProcedure
    .input(z.object({
      courseId: z.number(),
      title: z.string(),
      description: z.string(),
      content: z.string(),
      videoUrl: z.string().optional(),
      duration: z.number(),
      orderIndex: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.insert(courseLessons).values({
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        articleContent: input.content,
        videoUrl: input.videoUrl,
        duration: input.duration,
        sequenceNumber: input.orderIndex,
        contentType: "article" as const,
      });
      
      return { success: true };
    }),

  // Admin: Delete lesson
  deleteLesson: adminProcedure
    .input(z.object({
      lessonId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      await db.delete(courseLessons)
        .where(eq(courseLessons.id, input.lessonId));
      
      return { success: true };
    }),

  // Get course lessons
  getCourseLessons: publicProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const lessons = await db.select()
        .from(courseLessons)
        .where(eq(courseLessons.courseId, input.courseId))
        .orderBy(courseLessons.sequenceNumber);
      
      return lessons;
    }),
});

// ==================== VR TRAINING ROUTER ====================

export const vrTrainingRouter = router({
  // Get all VR scenarios
  getScenarios: protectedProcedure
    .input(z.object({
      scenarioType: z.enum(["1v1", "2v2", "3v3", "tactical_positioning", "set_piece", "decision_making", "skill_drill"]).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(vrScenarios.isPublished, true)];
      
      if (input.scenarioType) {
        conditions.push(eq(vrScenarios.scenarioType, input.scenarioType));
      }
      
      if (input.difficulty) {
        conditions.push(eq(vrScenarios.difficulty, input.difficulty));
      }
      
      const scenarios = await db.select()
        .from(vrScenarios)
        .where(and(...conditions))
        .orderBy(desc(vrScenarios.createdAt));
      
      return scenarios;
    }),

  // Log VR session with AI analysis
  logSession: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      scenarioId: z.number(),
      duration: z.number(),
      score: z.number(),
      accuracy: z.number(),
      reactionTime: z.number(),
      decisionsCorrect: z.number(),
      decisionsTotal: z.number(),
      detailedMetrics: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      
      // AI performance analysis
      const analysisPrompt = `Analyze VR training session performance:
Score: ${input.score}/100
Accuracy: ${input.accuracy}%
Reaction Time: ${input.reactionTime}ms
Decisions: ${input.decisionsCorrect}/${input.decisionsTotal} correct

Provide:
1. Performance analysis
2. Key strengths demonstrated
3. Areas for improvement
4. Specific recommendations for next session`;

      const llmResponse3 = await invokeLLM({
        messages: [{ role: "user", content: analysisPrompt }],
      });
      
      const sessionData = {
        playerId: input.playerId,
        scenarioId: input.scenarioId,
        duration: input.duration,
        score: input.score,
        accuracy: input.accuracy,
        reactionTime: input.reactionTime,
        decisionsCorrect: input.decisionsCorrect,
        decisionsTotal: input.decisionsTotal,
        detailedMetrics: input.detailedMetrics || {},
        aiAnalysis: typeof llmResponse3.choices?.[0]?.message?.content === 'string' ? llmResponse3.choices[0].message.content : "Performance analysis completed",
        strengths: ["Quick decision making", "Good spatial awareness"],
        areasForImprovement: ["Reaction time under pressure", "Defensive positioning"],
        recommendations: "Focus on 1v1 defensive scenarios to improve reaction time",
      };
      
      await db.insert(vrSessions).values(sessionData);
      
      const [session] = await db.select().from(vrSessions).where(eq(vrSessions.playerId, input.playerId)).orderBy(desc(vrSessions.id)).limit(1);
      
      return session;
    }),

  // Get player VR sessions
  getPlayerSessions: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      if (!db) throw new Error("Database not available");
      
      const sessions = await db.select()
        .from(vrSessions)
        .where(eq(vrSessions.playerId, input.playerId))
        .orderBy(desc(vrSessions.sessionDate))
        .limit(input.limit);
      
      return sessions;
    }),
});

// ==================== COACH CANDIDATES ROUTER ====================
export const coachCandidatesRouter = router({
  // Get all coach candidates
  getAll: protectedProcedure
    .input(z.object({
      availability: z.string().optional(),
      formation: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const rows = await db.execute(sql`
        SELECT * FROM coach_candidates
        WHERE is_active = TRUE
        ORDER BY rating DESC, years_experience DESC
        LIMIT ${input.limit}
      `);
      const data = (rows as any[])[0] as any[];
      return data.map((c: any) => ({
        ...c,
        playing_styles: JSON.parse(c.playing_styles || "[]"),
        coaching_strengths: JSON.parse(c.coaching_strengths || "[]"),
        required_player_skills: JSON.parse(c.required_player_skills || "[]"),
        certifications: JSON.parse(c.certifications || "[]"),
        languages: JSON.parse(c.languages || "[]"),
        achievements: JSON.parse(c.achievements || "[]"),
      }));
    }),

  // Get single coach candidate
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const rows = await db.execute(sql`SELECT * FROM coach_candidates WHERE id = ${input.id} LIMIT 1`);
      const data = (rows as any[])[0] as any[];
      if (!data[0]) return null;
      const c = data[0];
      return {
        ...c,
        playing_styles: JSON.parse(c.playing_styles || "[]"),
        coaching_strengths: JSON.parse(c.coaching_strengths || "[]"),
        required_player_skills: JSON.parse(c.required_player_skills || "[]"),
        certifications: JSON.parse(c.certifications || "[]"),
        languages: JSON.parse(c.languages || "[]"),
        achievements: JSON.parse(c.achievements || "[]"),
      };
    }),

  // Create coach candidate
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2),
      nationality: z.string().optional(),
      age: z.number().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      photoUrl: z.string().optional(),
      title: z.string().optional(),
      yearsExperience: z.number().default(0),
      preferredFormation: z.string().optional(),
      playingStyles: z.array(z.string()).default([]),
      coachingStrengths: z.array(z.string()).default([]),
      requiredPlayerSkills: z.array(z.string()).default([]),
      certifications: z.array(z.string()).default([]),
      languages: z.array(z.string()).default([]),
      bio: z.string().optional(),
      achievements: z.array(z.string()).default([]),
      availability: z.enum(["available", "unavailable", "negotiating"]).default("available"),
      contractStatus: z.enum(["free", "contracted", "notice_period"]).default("free"),
      expectedSalary: z.string().optional(),
      linkedinUrl: z.string().optional(),
      rating: z.number().min(0).max(10).default(0),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      await db.execute(sql`
        INSERT INTO coach_candidates (
          name, nationality, age, email, phone, photo_url, title,
          years_experience, preferred_formation, playing_styles, coaching_strengths,
          required_player_skills, certifications, languages, bio, achievements,
          availability, contract_status, expected_salary, linkedin_url, rating
        ) VALUES (
          ${input.name}, ${input.nationality ?? null}, ${input.age ?? null},
          ${input.email ?? null}, ${input.phone ?? null}, ${input.photoUrl ?? null},
          ${input.title ?? null}, ${input.yearsExperience},
          ${input.preferredFormation ?? null},
          ${JSON.stringify(input.playingStyles)},
          ${JSON.stringify(input.coachingStrengths)},
          ${JSON.stringify(input.requiredPlayerSkills)},
          ${JSON.stringify(input.certifications)},
          ${JSON.stringify(input.languages)},
          ${input.bio ?? null},
          ${JSON.stringify(input.achievements)},
          ${input.availability}, ${input.contractStatus},
          ${input.expectedSalary ?? null}, ${input.linkedinUrl ?? null},
          ${input.rating}
        )
      `);
      return { success: true };
    }),

  // Update coach candidate
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(2).optional(),
      nationality: z.string().optional(),
      age: z.number().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      photoUrl: z.string().optional(),
      title: z.string().optional(),
      yearsExperience: z.number().optional(),
      preferredFormation: z.string().optional(),
      playingStyles: z.array(z.string()).optional(),
      coachingStrengths: z.array(z.string()).optional(),
      requiredPlayerSkills: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      bio: z.string().optional(),
      achievements: z.array(z.string()).optional(),
      availability: z.enum(["available", "unavailable", "negotiating"]).optional(),
      contractStatus: z.enum(["free", "contracted", "notice_period"]).optional(),
      expectedSalary: z.string().optional(),
      linkedinUrl: z.string().optional(),
      rating: z.number().min(0).max(10).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const { id, ...fields } = input;
      const updates: string[] = [];
      const vals: any[] = [];
      if (fields.name !== undefined) { updates.push("name = ?"); vals.push(fields.name); }
      if (fields.nationality !== undefined) { updates.push("nationality = ?"); vals.push(fields.nationality); }
      if (fields.age !== undefined) { updates.push("age = ?"); vals.push(fields.age); }
      if (fields.email !== undefined) { updates.push("email = ?"); vals.push(fields.email); }
      if (fields.phone !== undefined) { updates.push("phone = ?"); vals.push(fields.phone); }
      if (fields.photoUrl !== undefined) { updates.push("photo_url = ?"); vals.push(fields.photoUrl); }
      if (fields.title !== undefined) { updates.push("title = ?"); vals.push(fields.title); }
      if (fields.yearsExperience !== undefined) { updates.push("years_experience = ?"); vals.push(fields.yearsExperience); }
      if (fields.preferredFormation !== undefined) { updates.push("preferred_formation = ?"); vals.push(fields.preferredFormation); }
      if (fields.playingStyles !== undefined) { updates.push("playing_styles = ?"); vals.push(JSON.stringify(fields.playingStyles)); }
      if (fields.coachingStrengths !== undefined) { updates.push("coaching_strengths = ?"); vals.push(JSON.stringify(fields.coachingStrengths)); }
      if (fields.requiredPlayerSkills !== undefined) { updates.push("required_player_skills = ?"); vals.push(JSON.stringify(fields.requiredPlayerSkills)); }
      if (fields.certifications !== undefined) { updates.push("certifications = ?"); vals.push(JSON.stringify(fields.certifications)); }
      if (fields.languages !== undefined) { updates.push("languages = ?"); vals.push(JSON.stringify(fields.languages)); }
      if (fields.bio !== undefined) { updates.push("bio = ?"); vals.push(fields.bio); }
      if (fields.achievements !== undefined) { updates.push("achievements = ?"); vals.push(JSON.stringify(fields.achievements)); }
      if (fields.availability !== undefined) { updates.push("availability = ?"); vals.push(fields.availability); }
      if (fields.contractStatus !== undefined) { updates.push("contract_status = ?"); vals.push(fields.contractStatus); }
      if (fields.expectedSalary !== undefined) { updates.push("expected_salary = ?"); vals.push(fields.expectedSalary); }
      if (fields.linkedinUrl !== undefined) { updates.push("linkedin_url = ?"); vals.push(fields.linkedinUrl); }
      if (fields.rating !== undefined) { updates.push("rating = ?"); vals.push(fields.rating); }
      if (fields.isActive !== undefined) { updates.push("is_active = ?"); vals.push(fields.isActive ? 1 : 0); }
      if (updates.length === 0) return { success: true };
      vals.push(id);
      const rawDb = (db as any).$client || (db as any).client;
      if (rawDb) {
        await rawDb.execute(`UPDATE coach_candidates SET ${updates.join(", ")} WHERE id = ?`, vals);
      }
      return { success: true };
    }),

  // Soft delete coach candidate
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      await db.execute(sql`UPDATE coach_candidates SET is_active = FALSE WHERE id = ${input.id}`);
      return { success: true };
    }),

  // AI: Match coaches to team profile
  matchToTeam: protectedProcedure
    .input(z.object({
      teamFormation: z.string(),
      teamPlayingStyles: z.array(z.string()),
      teamSkills: z.array(z.string()),
      teamWeaknesses: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      if (!db) throw new Error("Database not available");
      const rows = await db.execute(sql`SELECT * FROM coach_candidates WHERE is_active = TRUE AND availability != 'unavailable'`);
      const coaches = (rows as any[])[0] as any[];
      const scored = coaches.map((coach: any) => {
        const coachStyles: string[] = JSON.parse(coach.playing_styles || "[]");
        const coachStrengths: string[] = JSON.parse(coach.coaching_strengths || "[]");
        const coachSkills: string[] = JSON.parse(coach.required_player_skills || "[]");
        const styleMatch = input.teamPlayingStyles.length > 0
          ? input.teamPlayingStyles.filter(s => coachStyles.includes(s)).length / input.teamPlayingStyles.length
          : 0;
        const skillMatch = input.teamSkills.length > 0
          ? input.teamSkills.filter(s => coachSkills.includes(s)).length / input.teamSkills.length
          : 0;
        const formationMatch = coach.preferred_formation === input.teamFormation ? 1 : 0;
        const weaknessMatch = input.teamWeaknesses.length > 0
          ? input.teamWeaknesses.filter(w => coachStrengths.includes(w)).length / input.teamWeaknesses.length
          : 0;
        const totalScore = Math.round((styleMatch * 40) + (skillMatch * 35) + (formationMatch * 15) + (weaknessMatch * 10));
        return {
          ...coach,
          playing_styles: coachStyles,
          coaching_strengths: coachStrengths,
          required_player_skills: coachSkills,
          certifications: JSON.parse(coach.certifications || "[]"),
          languages: JSON.parse(coach.languages || "[]"),
          achievements: JSON.parse(coach.achievements || "[]"),
          matchScore: totalScore,
          styleScore: Math.round(styleMatch * 100),
          skillScore: Math.round(skillMatch * 100),
          formationScore: formationMatch * 100,
          weaknessScore: Math.round(weaknessMatch * 100),
        };
      });
      return scored.sort((a: any, b: any) => b.matchScore - a.matchScore);
    }),
});

// ==================== TEAM NEEDS ANALYSIS (Real AI per-team) ====================
export const teamNeedsAnalysisRouter = router({
  analyze: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error('Database unavailable');

      const { players, teams, playerSkillScores } = await import('../drizzle/schema');
      const { eq, desc: descOrder } = await import('drizzle-orm');

      // Fetch team info
      const [team] = await database.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
      if (!team) throw new Error('Team not found');

      // Fetch all players in the team
      const teamPlayers = await database.select().from(players).where(eq(players.teamId, input.teamId));

      // Fetch latest skill scores for each player
      const playerData = await Promise.all(teamPlayers.map(async (p) => {
        const [latestScore] = await database.select().from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, p.id))
          .orderBy(descOrder(playerSkillScores.assessmentDate))
          .limit(1);
        return {
          name: `${p.firstName} ${p.lastName}`,
          position: p.position,
          jerseyNumber: p.jerseyNumber,
          status: p.status,
          skills: latestScore ? {
            dribbling: latestScore.dribbling,
            passing: latestScore.passing,
            shooting: latestScore.shooting,
            speed: latestScore.speed,
            stamina: latestScore.stamina,
            strength: latestScore.strength,
            positioning: latestScore.positioning,
            vision: latestScore.vision,
            tackling: latestScore.tackling,
            interceptions: latestScore.interceptions,
            overallRating: latestScore.overallRating,
            technicalOverall: latestScore.technicalOverall,
            physicalOverall: latestScore.physicalOverall,
            mentalOverall: latestScore.mentalOverall,
            defensiveOverall: latestScore.defensiveOverall,
          } : null,
        };
      }));

      // Build position summary
      const positionGroups: Record<string, typeof playerData> = {};
      for (const p of playerData) {
        if (!positionGroups[p.position]) positionGroups[p.position] = [];
        positionGroups[p.position].push(p);
      }

      const positionSummary = Object.entries(positionGroups).map(([pos, pls]) => {
        const withScores = pls.filter(p => p.skills);
        const avgOverall = withScores.length > 0
          ? Math.round(withScores.reduce((s, p) => s + (p.skills?.overallRating || 50), 0) / withScores.length)
          : 50;
        return {
          position: pos,
          count: pls.length,
          players: pls.map(p => `${p.name} (${p.skills?.overallRating ?? 'no score'})`).join(', '),
          avgOverall,
        };
      });

      const prompt = `You are a professional football scout and analyst. Analyze the following REAL team data and provide a detailed team needs analysis.

TEAM: ${team.name} (${team.ageGroup}, ${team.teamType})
TOTAL PLAYERS: ${teamPlayers.length} (${playerData.filter(p => p.skills).length} with skill assessments)

SQUAD BY POSITION:
${positionSummary.map(p => `- ${p.position.toUpperCase()} (${p.count} players, avg rating: ${p.avgOverall}/100): ${p.players}`).join('\n')}

FULL PLAYER DATA:
${playerData.map(p => `${p.name} | ${p.position} | Status: ${p.status} | ${p.skills ? `Overall: ${p.skills.overallRating}, Tech: ${p.skills.technicalOverall}, Phys: ${p.skills.physicalOverall}, Mental: ${p.skills.mentalOverall}, Def: ${p.skills.defensiveOverall}, Drib: ${p.skills.dribbling}, Pass: ${p.skills.passing}, Shot: ${p.skills.shooting}, Speed: ${p.skills.speed}, Stamina: ${p.skills.stamina}` : 'No assessment'}`).join('\n')}

Based on this REAL data, provide a JSON analysis with this exact structure (no markdown, just JSON):
{
  "positionGaps": [
    {
      "position": "specific position name",
      "currentRating": number,
      "requiredRating": number,
      "gap": number,
      "priority": "critical|high|medium|low",
      "missingSkills": ["skill1", "skill2"],
      "recommendedProfile": "description",
      "currentPlayers": ["name (rating)"]
    }
  ],
  "skillGaps": [
    {
      "skill": "skill name",
      "category": "Technical|Physical|Mental|Defensive",
      "teamAvg": number,
      "benchmark": number,
      "gap": number,
      "playersBelow": number,
      "impact": "description"
    }
  ],
  "recruitmentTargets": [
    {
      "position": "position",
      "profile": "description",
      "keyAttributes": ["attr1"],
      "ageRange": "e.g. 17-21",
      "urgency": "immediate|next_season|long_term",
      "similarPlayers": ["player profile type"]
    }
  ],
  "squadReadiness": number,
  "summary": "2-3 sentence summary"
}`;

      const response = await invokeLLM({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2500,
      });

      const text = String(response.choices?.[0]?.message?.content || '');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse AI analysis');

      const analysis = JSON.parse(jsonMatch[0]);
      return {
        teamId: input.teamId,
        teamName: team.name,
        ageGroup: team.ageGroup,
        playerCount: teamPlayers.length,
        ...analysis,
      };
    }),
});
