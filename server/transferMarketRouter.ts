import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { players, playerSkillScores, performanceMetrics, injuries, transferListings, transferOffers, playerValuations, scoutingWatchlist, users, teams } from "../drizzle/schema";
import { eq, desc, and, or, gte, lte, inArray, isNull, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── AI Valuation Engine ──────────────────────────────────────────────────────
async function computeAIValuation(playerId: number, ctx: any) {
  const database = (await getDb())!;
  // Gather all data for the player
  const player = await database.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player[0]) throw new Error("Player not found");
  const p = player[0];

  // Latest skill assessment
  const skills = await database.select().from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.assessmentDate)).limit(1);
  const s = skills[0];

  // Recent performance (last 10 sessions)
  const perf = await database.select().from(performanceMetrics)
    .where(eq(performanceMetrics.playerId, playerId))
    .orderBy(desc(performanceMetrics.sessionDate)).limit(10);

  // Injury history
  const injuryHistory = await database.select().from(injuries)
    .where(eq(injuries.playerId, playerId));

  // Age calculation
  const dob = new Date(p.dateOfBirth);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));

  // ── Factor Scoring ──────────────────────────────────────────────────────────
  // 1. Technical Score (from skill assessment)
  const technicalScore = s ? Math.round(
    ((s.ballControl ?? 0) + (s.firstTouch ?? 0) + (s.dribbling ?? 0) + (s.passing ?? 0) + (s.shooting ?? 0) + (s.crossing ?? 0) + (s.heading ?? 0)) / 7
  ) : 50;

  // 2. Physical Score
  const physicalScore = s ? Math.round(
    ((s.speed ?? 0) + (s.acceleration ?? 0) + (s.agility ?? 0) + (s.stamina ?? 0) + (s.strength ?? 0) + (s.jumping ?? 0)) / 6
  ) : 50;

  // 3. Mental Score
  const mentalScore = s ? Math.round(
    ((s.positioning ?? 0) + (s.vision ?? 0) + (s.composure ?? 0) + (s.decisionMaking ?? 0) + (s.workRate ?? 0)) / 5
  ) : 50;

  // 4. Performance Score (from recent matches/training)
  let performanceScore = 50;
  if (perf.length > 0) {
    const avgOverall = perf.reduce((sum, m) => sum + (m.overallScore || 50), 0) / perf.length;
    performanceScore = Math.round(avgOverall);
  }

  // 5. Potential Score (age-based: younger = higher potential ceiling)
  let potentialScore = 50;
  if (age <= 17) potentialScore = 85;
  else if (age <= 20) potentialScore = 78;
  else if (age <= 23) potentialScore = 72;
  else if (age <= 26) potentialScore = 65;
  else if (age <= 29) potentialScore = 55;
  else if (age <= 32) potentialScore = 42;
  else potentialScore = 30;

  // 6. Market Demand Score (position scarcity)
  const positionDemand: Record<string, number> = {
    goalkeeper: 60, defender: 65, midfielder: 75, forward: 80
  };
  const marketDemandScore = positionDemand[p.position] || 65;

  // 7. Injury Risk Score (fewer injuries = higher score)
  const activeInjuries = injuryHistory.filter(i => i.status === "active" || i.status === "recovering").length;
  const totalInjuries = injuryHistory.length;
  let injuryRiskScore = 80;
  if (activeInjuries > 0) injuryRiskScore -= 25;
  if (totalInjuries > 3) injuryRiskScore -= 15;
  else if (totalInjuries > 1) injuryRiskScore -= 8;
  injuryRiskScore = Math.max(20, injuryRiskScore);

  // 8. Contract Score (no contract info = assume free, high value)
  const contractScore = 70; // Default - can be updated with actual contract data

  // ── Overall Rating ──────────────────────────────────────────────────────────
  const overallRating = Math.round(
    technicalScore * 0.25 +
    physicalScore * 0.20 +
    mentalScore * 0.15 +
    performanceScore * 0.20 +
    potentialScore * 0.10 +
    marketDemandScore * 0.05 +
    injuryRiskScore * 0.05
  );

  // ── Market Value Calculation ────────────────────────────────────────────────
  // Base value by position (USD)
  const baseValues: Record<string, number> = {
    forward: 500000, midfielder: 450000, defender: 400000, goalkeeper: 350000
  };
  let baseValue = baseValues[p.position] || 400000;

  // Multiply by rating factor
  const ratingMultiplier = Math.pow(overallRating / 50, 2.5);
  baseValue *= ratingMultiplier;

  // Age adjustment (peak value at 24-27)
  let ageMultiplier = 1.0;
  if (age >= 24 && age <= 27) ageMultiplier = 1.3;
  else if (age >= 21 && age <= 23) ageMultiplier = 1.1;
  else if (age <= 20) ageMultiplier = 0.9; // Young but high potential
  else if (age >= 28 && age <= 30) ageMultiplier = 0.85;
  else if (age >= 31) ageMultiplier = 0.6;

  const estimatedValue = Math.round(baseValue * ageMultiplier);

  // ── Trend ───────────────────────────────────────────────────────────────────
  let trend: "rising" | "stable" | "declining" = "stable";
  if (perf.length >= 3) {
    const recent3 = perf.slice(0, 3).reduce((s, m) => s + (m.overallScore || 50), 0) / 3;
    const older3 = perf.slice(-3).reduce((s, m) => s + (m.overallScore || 50), 0) / 3;
    if (recent3 > older3 + 5) trend = "rising";
    else if (recent3 < older3 - 5) trend = "declining";
  }

  // ── Comparable Player ───────────────────────────────────────────────────────
  const comparables: Record<string, Record<string, string>> = {
    forward: { "80+": "Salah-tier", "70-79": "Trezeguet-tier", "60-69": "Solid Forward", "50-59": "Developing Forward" },
    midfielder: { "80+": "De Bruyne-tier", "70-79": "Elneny-tier", "60-69": "Solid Midfielder", "50-59": "Developing Midfielder" },
    defender: { "80+": "Van Dijk-tier", "70-79": "Solid CB", "60-69": "Reliable Defender", "50-59": "Developing Defender" },
    goalkeeper: { "80+": "Alisson-tier", "70-79": "Solid GK", "60-69": "Reliable GK", "50-59": "Developing GK" },
  };
  const posComp = comparables[p.position] || comparables.midfielder;
  let comparablePlayer = posComp["50-59"];
  if (overallRating >= 80) comparablePlayer = posComp["80+"];
  else if (overallRating >= 70) comparablePlayer = posComp["70-79"];
  else if (overallRating >= 60) comparablePlayer = posComp["60-69"];

  return {
    estimatedValue,
    technicalScore,
    physicalScore,
    mentalScore,
    performanceScore,
    potentialScore,
    marketDemandScore,
    injuryRiskScore,
    contractScore,
    overallRating,
    trend,
    comparablePlayer,
    age,
    position: p.position,
    playerName: `${p.firstName} ${p.lastName}`,
  };
}

export const transferMarketRouter = router({
  // ── Valuation ──────────────────────────────────────────────────────────────
  valuatePlayer: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      const result = await computeAIValuation(input.playerId, ctx);

      // Generate AI narrative
      let aiNarrative = "";
      try {
        const prompt = `You are a football transfer market expert. Generate a 2-3 sentence professional valuation narrative for a ${result.age}-year-old ${result.position} named ${result.playerName} with an overall rating of ${result.overallRating}/100 and estimated market value of $${result.estimatedValue.toLocaleString()}. Technical: ${result.technicalScore}, Physical: ${result.physicalScore}, Mental: ${result.mentalScore}. Trend: ${result.trend}. Be specific and professional.`;
        const aiResp = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
        aiNarrative = (aiResp.choices?.[0]?.message?.content as string) || "";
      } catch {}

      // Save valuation
      const [saved] = await database.insert(playerValuations).values({
        playerId: input.playerId,
        estimatedValue: result.estimatedValue.toString(),
        currency: "USD",
        technicalScore: result.technicalScore,
        physicalScore: result.physicalScore,
        mentalScore: result.mentalScore,
        performanceScore: result.performanceScore,
        potentialScore: result.potentialScore,
        marketDemandScore: result.marketDemandScore,
        injuryRiskScore: result.injuryRiskScore,
        contractScore: result.contractScore,
        overallRating: result.overallRating,
        trend: result.trend,
        comparablePlayer: result.comparablePlayer,
        aiNarrative,
        valuedByUserId: ctx.user.id,
      });

      return { ...result, aiNarrative, id: (saved as any).insertId };
    }),

  getPlayerValuationHistory: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      return database.select().from(playerValuations)
        .where(eq(playerValuations.playerId, input.playerId))
        .orderBy(desc(playerValuations.createdAt))
        .limit(10);
    }),

  getLatestValuation: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const [val] = await database.select().from(playerValuations)
        .where(eq(playerValuations.playerId, input.playerId))
        .orderBy(desc(playerValuations.createdAt)).limit(1);
      return val || null;
    }),

  // ── Transfer Listings ──────────────────────────────────────────────────────
  createListing: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      listingType: z.enum(["sale", "loan", "free_agent", "swap"]),
      askingPrice: z.number().optional(),
      loanFee: z.number().optional(),
      currency: z.string().default("USD"),
      description: z.string().optional(),
      contractExpiryDate: z.string().optional(),
      currentSalary: z.number().optional(),
      agentName: z.string().optional(),
      agentContact: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      // Auto-compute AI valuation
      const valResult = await computeAIValuation(input.playerId, ctx);

      const [res] = await database.insert(transferListings).values({
        playerId: input.playerId,
        listingType: input.listingType,
        askingPrice: input.askingPrice?.toString(),
        loanFee: input.loanFee?.toString(),
        currency: input.currency,
        description: input.description,
        contractExpiryDate: input.contractExpiryDate ? new Date(input.contractExpiryDate) as any : undefined,
        currentSalary: input.currentSalary?.toString(),
        agentName: input.agentName,
        agentContact: input.agentContact,
        aiValuation: valResult.estimatedValue.toString(),
        valuationBreakdown: JSON.stringify(valResult),
        listedByUserId: ctx.user.id,
      });
      return { id: (res as any).insertId, aiValuation: valResult.estimatedValue };
    }),

  getListings: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "under_offer", "sold", "withdrawn", "expired", "all"]).default("active"),
      listingType: z.enum(["sale", "loan", "free_agent", "swap", "all"]).default("all"),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const conditions = [];
      if (input.status !== "all") conditions.push(eq(transferListings.status, input.status));
      if (input.listingType !== "all") conditions.push(eq(transferListings.listingType, input.listingType));

      const listings = await database.select({
        listing: transferListings,
        player: players,
      })
        .from(transferListings)
        .innerJoin(players, eq(transferListings.playerId, players.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(transferListings.createdAt))
        .limit(input.limit);

      return listings;
    }),

  updateListingStatus: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      status: z.enum(["active", "under_offer", "sold", "withdrawn", "expired"]),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      await database.update(transferListings)
        .set({ status: input.status })
        .where(eq(transferListings.id, input.listingId));
      return { success: true };
    }),

  deleteListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      await database.update(transferListings)
        .set({ status: "withdrawn" })
        .where(eq(transferListings.id, input.listingId));
      return { success: true };
    }),

  // ── Transfer Offers ────────────────────────────────────────────────────────
  makeOffer: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      playerId: z.number(),
      offerAmount: z.number(),
      offerType: z.enum(["purchase", "loan", "swap"]),
      offeringClub: z.string(),
      offeringContact: z.string().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      const [res] = await database.insert(transferOffers).values({
        listingId: input.listingId,
        playerId: input.playerId,
        offerAmount: input.offerAmount.toString(),
        offerType: input.offerType,
        offeringClub: input.offeringClub,
        offeringContact: input.offeringContact,
        message: input.message,
        offeredByUserId: ctx.user.id,
      });
      // Update listing status
      await database.update(transferListings)
        .set({ status: "under_offer" })
        .where(eq(transferListings.id, input.listingId));
      return { id: (res as any).insertId };
    }),

  respondToOffer: protectedProcedure
    .input(z.object({
      offerId: z.number(),
      status: z.enum(["accepted", "rejected", "countered"]),
      counterOffer: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      await database.update(transferOffers)
        .set({
          status: input.status,
          counterOffer: input.counterOffer?.toString(),
          respondedAt: new Date(),
        })
        .where(eq(transferOffers.id, input.offerId));
      return { success: true };
    }),

  getOffersForListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      return database.select().from(transferOffers)
        .where(eq(transferOffers.listingId, input.listingId))
        .orderBy(desc(transferOffers.createdAt));
    }),

  // ── Scouting Watchlist ─────────────────────────────────────────────────────
  addToWatchlist: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      priority: z.enum(["hot", "warm", "cold"]).default("warm"),
      notes: z.string().optional(),
      targetPosition: z.string().optional(),
      budgetRange: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      // Check if already in watchlist
      const existing = await database.select().from(scoutingWatchlist)
        .where(and(
          eq(scoutingWatchlist.playerId, input.playerId),
          eq(scoutingWatchlist.addedByUserId, ctx.user.id)
        )).limit(1);
      if (existing[0]) return { id: existing[0].id, alreadyExists: true };

      const [res] = await database.insert(scoutingWatchlist).values({
        playerId: input.playerId,
        addedByUserId: ctx.user.id,
        priority: input.priority,
        notes: input.notes,
        targetPosition: input.targetPosition,
        budgetRange: input.budgetRange,
      });
      return { id: (res as any).insertId, alreadyExists: false };
    }),

  getWatchlist: protectedProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    return database.select({
      watchlist: scoutingWatchlist,
      player: players,
    })
      .from(scoutingWatchlist)
      .innerJoin(players, eq(scoutingWatchlist.playerId, players.id))
      .where(eq(scoutingWatchlist.addedByUserId, ctx.user.id))
      .orderBy(desc(scoutingWatchlist.createdAt));
  }),

  removeFromWatchlist: protectedProcedure
    .input(z.object({ watchlistId: z.number() }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      await database.delete(scoutingWatchlist).where(eq(scoutingWatchlist.id, input.watchlistId));
      return { success: true };
    }),

  // ── Squad Overview ─────────────────────────────────────────────────────────
  getSquadWithValuations: protectedProcedure
    .input(z.object({ teamType: z.enum(["main", "academy", "all"]).default("main") }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const conditions = input.teamType !== "all" ? [eq(players.teamType, input.teamType)] : [];
      const squad = await database.select().from(players)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(players.position);

      // Get latest valuation for each player
      const result = await Promise.all(squad.map(async (player) => {
        const [latestVal] = await database.select().from(playerValuations)
          .where(eq(playerValuations.playerId, player.id))
          .orderBy(desc(playerValuations.createdAt)).limit(1);
        const [listing] = await database.select().from(transferListings)
          .where(and(eq(transferListings.playerId, player.id), eq(transferListings.status, "active")))
          .limit(1);
        return { player, valuation: latestVal || null, listing: listing || null };
      }));
      return result;
    }),

  // ── Market Stats ───────────────────────────────────────────────────────────
  getMarketStats: protectedProcedure.query(async () => {
    const database = (await getDb())!;
    const [totalListings] = await database.select({ count: sql<number>`count(*)` })
      .from(transferListings).where(eq(transferListings.status, "active"));
    const [totalOffers] = await database.select({ count: sql<number>`count(*)` })
      .from(transferOffers).where(eq(transferOffers.status, "pending"));
    const [totalSold] = await database.select({ count: sql<number>`count(*)` })
      .from(transferListings).where(eq(transferListings.status, "sold"));
    const [totalValuations] = await database.select({ count: sql<number>`count(*)` })
      .from(playerValuations);

    return {
      activeListings: totalListings?.count || 0,
      pendingOffers: totalOffers?.count || 0,
      completedTransfers: totalSold?.count || 0,
      totalValuations: totalValuations?.count || 0,
    };
  }),

  // ── Get All Offers (for dashboard) ─────────────────────────────────────────
  getAllOffers: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "accepted", "rejected", "countered", "withdrawn", "all"]).default("all"),
    }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      const conditions = input.status !== "all" ? [eq(transferOffers.status, input.status)] : [];
      const offers = await database.select({
        offer: transferOffers,
        player: {
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
          dateOfBirth: players.dateOfBirth,
        },
      })
      .from(transferOffers)
      .leftJoin(players, eq(transferOffers.playerId, players.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(transferOffers.createdAt))
      .limit(100);
      return offers;
    }),

  // ── AI Contract Intelligence ───────────────────────────────────────────────
  // ── Transfer History (per player) ──────────────────────────────────────────
  getTransferHistory: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      // Get all past listings for this player (sold, expired, cancelled)
      const listings = await database.select({
        listing: transferListings,
        player: {
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          position: players.position,
        },
      })
      .from(transferListings)
      .leftJoin(players, eq(transferListings.playerId, players.id))
      .where(eq(transferListings.playerId, input.playerId))
      .orderBy(desc(transferListings.createdAt))
      .limit(20);

      // Get valuation history for trend line
      const valuations = await database.select().from(playerValuations)
        .where(eq(playerValuations.playerId, input.playerId))
        .orderBy(desc(playerValuations.createdAt))
        .limit(10);

      return { listings, valuations };
    }),

  analyzeContractRisk: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = (await getDb())!;
      const [player] = await database.select().from(players).where(eq(players.id, input.playerId)).limit(1);
      if (!player) throw new Error("Player not found");

      const dob = new Date(player.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));

      const prompt = `You are a football contract intelligence expert. Analyze the contract risk for a ${age}-year-old ${player.position} named ${player.firstName} ${player.lastName}. 
      
      Provide a JSON response with:
      - riskLevel: "low" | "medium" | "high"
      - riskScore: number 0-100
      - keyRisks: string[] (3-4 bullet points)
      - recommendations: string[] (3-4 action items)
      - optimalContractLength: string
      - salaryBenchmark: string (estimated fair salary range)
      
      Base your analysis on the player's age, position, and typical market dynamics.`;

      try {
        const aiResp = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
        const content = (aiResp.choices?.[0]?.message?.content as string) || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch {}

      return {
        riskLevel: "medium",
        riskScore: 50,
        keyRisks: ["Age-related performance decline risk", "Market competition from younger players"],
        recommendations: ["Review contract terms annually", "Include performance-based clauses"],
        optimalContractLength: "2-3 years",
        salaryBenchmark: "Market-rate based on performance",
      };
    }),
});
