/**
 * Cache Warmup Service
 * Pre-populates frequently-requested AI analyses during off-peak hours
 * to maximize cache hits and improve response times
 */

import * as AIService from "./aiService";
import * as db from "./db";
import { getDb } from "./db";
import { players, performanceMetrics } from "../drizzle/schema";
import { desc, eq, and, gte } from "drizzle-orm";

/**
 * Warmup Configuration
 */
const WARMUP_CONFIG = {
  // Number of top players to pre-analyze
  topPlayersCount: 20,
  
  // Age groups to generate training plans for
  ageGroups: ["U10", "U12", "U14", "U16", "U18"],
  
  // Common focus areas for training drills
  trainingFocusAreas: [
    "passing",
    "shooting",
    "dribbling",
    "defending",
    "positioning",
    "fitness",
  ],
  
  // Skill levels for drill recommendations
  skillLevels: ["beginner", "intermediate", "advanced"],
  
  // Common match scenarios for strategy
  matchScenarios: [
    { importance: "league", conditions: "normal" },
    { importance: "cup", conditions: "rainy" },
    { importance: "friendly", conditions: "hot" },
  ],
};

/**
 * Warmup player analyses for top active players
 */
export async function warmupPlayerAnalyses(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  console.log("[Cache Warmup] Starting player analyses warmup...");
  
  const database = await getDb();
  const results = { success: 0, failed: 0, errors: [] as string[] };

  if (!database) {
    results.errors.push("Database unavailable — skipping warmup");
    return results;
  }

  try {
    // Get top active players by recent activity
    const topPlayers = await database
      .select()
      .from(players)
      .where(eq(players.status, "active"))
      .limit(WARMUP_CONFIG.topPlayersCount);

    for (const player of topPlayers) {
      try {
        // Get recent performance stats
        const recentStats = await database
          .select()
          .from(performanceMetrics)
          .where(eq(performanceMetrics.playerId, player.id))
          .orderBy(desc(performanceMetrics.createdAt))
          .limit(10);

        // Generate player analysis (will be cached)
        await AIService.analyzePlayerPerformance({
          name: `${player.firstName} ${player.lastName}`,
          position: player.position,
          recentStats: recentStats.map(stat => ({
            goals: 0,
            assists: 0,
            minutesPlayed: 90,
            date: stat.createdAt,
            technicalScore: stat.technicalScore,
            physicalScore: stat.physicalScore,
            tacticalScore: stat.tacticalScore,
          })),
          age: calculateAge(player.dateOfBirth),
          ageGroup: player.ageGroup || "U16",
        });

        results.success++;
        console.log(`[Cache Warmup] ✓ Analyzed player: ${player.firstName} ${player.lastName}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to analyze player ${player.id}: ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMsg);
        console.error(`[Cache Warmup] ✗ ${errorMsg}`);
      }
    }
  } catch (error) {
    console.error("[Cache Warmup] Error in warmupPlayerAnalyses:", error);
    results.errors.push(`Database error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log(`[Cache Warmup] Player analyses complete: ${results.success} success, ${results.failed} failed`);
  return results;
}

/**
 * Warmup training plans for common scenarios
 */
export async function warmupTrainingPlans(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  console.log("[Cache Warmup] Starting training plans warmup...");
  
  const results = { success: 0, failed: 0, errors: [] as string[] };

  // Common player profiles for training plans
  const commonProfiles = [
    {
      name: "Generic Forward",
      position: "forward",
      weaknesses: ["heading", "defensive positioning"],
      strengths: ["speed", "shooting", "dribbling"],
      availableTime: 8,
    },
    {
      name: "Generic Midfielder",
      position: "midfielder",
      weaknesses: ["long passing", "stamina"],
      strengths: ["ball control", "vision", "short passing"],
      availableTime: 10,
    },
    {
      name: "Generic Defender",
      position: "defender",
      weaknesses: ["ball control", "attacking"],
      strengths: ["tackling", "heading", "positioning"],
      availableTime: 6,
    },
    {
      name: "Generic Goalkeeper",
      position: "goalkeeper",
      weaknesses: ["distribution", "one-on-one"],
      strengths: ["shot stopping", "positioning", "command of area"],
      availableTime: 5,
    },
  ];

  for (const ageGroup of WARMUP_CONFIG.ageGroups) {
    for (const profile of commonProfiles) {
      try {
        await AIService.generateTrainingPlan({
          ...profile,
          ageGroup,
        });

        results.success++;
        console.log(`[Cache Warmup] ✓ Generated training plan: ${profile.position} ${ageGroup}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to generate training plan for ${profile.position} ${ageGroup}: ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMsg);
        console.error(`[Cache Warmup] ✗ ${errorMsg}`);
      }
    }
  }

  console.log(`[Cache Warmup] Training plans complete: ${results.success} success, ${results.failed} failed`);
  return results;
}

/**
 * Warmup drill recommendations for common focus areas
 */
export async function warmupDrillRecommendations(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  console.log("[Cache Warmup] Starting drill recommendations warmup...");
  
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const focusArea of WARMUP_CONFIG.trainingFocusAreas) {
    for (const ageGroup of WARMUP_CONFIG.ageGroups) {
      for (const skillLevel of WARMUP_CONFIG.skillLevels) {
        try {
          await AIService.recommendDrills(focusArea, ageGroup, skillLevel);

          results.success++;
          console.log(`[Cache Warmup] ✓ Generated drills: ${focusArea} ${ageGroup} ${skillLevel}`);
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to generate drills for ${focusArea} ${ageGroup} ${skillLevel}: ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMsg);
          console.error(`[Cache Warmup] ✗ ${errorMsg}`);
        }
      }
    }
  }

  console.log(`[Cache Warmup] Drill recommendations complete: ${results.success} success, ${results.failed} failed`);
  return results;
}

/**
 * Warmup match strategies for common scenarios
 */
export async function warmupMatchStrategies(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  console.log("[Cache Warmup] Starting match strategies warmup...");
  
  const results = { success: 0, failed: 0, errors: [] as string[] };

  // Generic team profiles
  const genericTeam = {
    name: "Generic Team",
    formation: "4-3-3",
    strengths: ["possession", "pressing"],
    weaknesses: ["set pieces", "counter-attacks"],
  };

  for (const scenario of WARMUP_CONFIG.matchScenarios) {
    try {
      await AIService.generateMatchStrategy({
        ourTeam: genericTeam,
        opponentTeam: { ...genericTeam, name: "Opponent Team" },
        matchImportance: scenario.importance,
        conditions: scenario.conditions,
      });

      results.success++;
      console.log(`[Cache Warmup] ✓ Generated match strategy: ${scenario.importance} ${scenario.conditions}`);
    } catch (error) {
      results.failed++;
      const errorMsg = `Failed to generate match strategy for ${scenario.importance} ${scenario.conditions}: ${error instanceof Error ? error.message : String(error)}`;
      results.errors.push(errorMsg);
      console.error(`[Cache Warmup] ✗ ${errorMsg}`);
    }
  }

  console.log(`[Cache Warmup] Match strategies complete: ${results.success} success, ${results.failed} failed`);
  return results;
}

/**
 * Run full cache warmup
 */
export async function runFullWarmup(): Promise<{
  totalSuccess: number;
  totalFailed: number;
  duration: number;
  details: {
    playerAnalyses: { success: number; failed: number; errors: string[] };
    trainingPlans: { success: number; failed: number; errors: string[] };
    drillRecommendations: { success: number; failed: number; errors: string[] };
    matchStrategies: { success: number; failed: number; errors: string[] };
  };
}> {
  const startTime = Date.now();
  console.log("[Cache Warmup] ========================================");
  console.log("[Cache Warmup] Starting full cache warmup...");
  console.log("[Cache Warmup] ========================================");

  const playerAnalyses = await warmupPlayerAnalyses();
  const trainingPlans = await warmupTrainingPlans();
  const drillRecommendations = await warmupDrillRecommendations();
  const matchStrategies = await warmupMatchStrategies();

  const totalSuccess =
    playerAnalyses.success +
    trainingPlans.success +
    drillRecommendations.success +
    matchStrategies.success;

  const totalFailed =
    playerAnalyses.failed +
    trainingPlans.failed +
    drillRecommendations.failed +
    matchStrategies.failed;

  const duration = Date.now() - startTime;

  console.log("[Cache Warmup] ========================================");
  console.log(`[Cache Warmup] Full warmup complete in ${(duration / 1000).toFixed(2)}s`);
  console.log(`[Cache Warmup] Total: ${totalSuccess} success, ${totalFailed} failed`);
  console.log("[Cache Warmup] ========================================");

  return {
    totalSuccess,
    totalFailed,
    duration,
    details: {
      playerAnalyses,
      trainingPlans,
      drillRecommendations,
      matchStrategies,
    },
  };
}

/**
 * Helper function to calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
