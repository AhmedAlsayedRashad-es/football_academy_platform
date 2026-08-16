/**
 * Cache Invalidation Helpers
 * Automatically invalidate relevant cache entries when underlying data changes
 */

import * as aiCache from "./aiCacheService";

/**
 * Invalidate player-related cache when player data is updated
 */
export async function invalidatePlayerCache(playerId: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating cache for player ${playerId}`);
  
  // Invalidate all player analysis cache
  await aiCache.invalidateFunctionCache("playerAnalysis");
  
  // Note: We invalidate all player analyses because:
  // 1. Player comparisons might be affected
  // 2. Team-level analyses might include this player
  // 3. Position recommendations might change
  
  console.log(`[Cache Invalidation] ✓ Player cache invalidated`);
}

/**
 * Invalidate training-related cache when training data is updated
 */
export async function invalidateTrainingCache(playerId?: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating training cache${playerId ? ` for player ${playerId}` : ""}`);
  
  // Invalidate training plans and drills
  await aiCache.invalidateFunctionCache("trainingPlan");
  
  console.log(`[Cache Invalidation] ✓ Training cache invalidated`);
}

/**
 * Invalidate match-related cache when match data is updated
 */
export async function invalidateMatchCache(matchId?: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating match cache${matchId ? ` for match ${matchId}` : ""}`);
  
  // Invalidate match strategies and opponent analyses
  await aiCache.invalidateFunctionCache("matchStrategy");
  await aiCache.invalidateFunctionCache("opponentAnalysis");
  
  console.log(`[Cache Invalidation] ✓ Match cache invalidated`);
}

/**
 * Invalidate performance-related cache when performance data is updated
 */
export async function invalidatePerformanceCache(playerId: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating performance cache for player ${playerId}`);
  
  // Invalidate player analysis and injury predictions
  await aiCache.invalidateFunctionCache("playerAnalysis");
  await aiCache.invalidateFunctionCache("injuryPrediction");
  
  console.log(`[Cache Invalidation] ✓ Performance cache invalidated`);
}

/**
 * Invalidate injury-related cache when injury data is updated
 */
export async function invalidateInjuryCache(playerId: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating injury cache for player ${playerId}`);
  
  // Invalidate injury predictions and player analyses
  await aiCache.invalidateFunctionCache("injuryPrediction");
  await aiCache.invalidateFunctionCache("playerAnalysis");
  
  console.log(`[Cache Invalidation] ✓ Injury cache invalidated`);
}

/**
 * Invalidate nutrition-related cache when nutrition data is updated
 */
export async function invalidateNutritionCache(playerId: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating nutrition cache for player ${playerId}`);
  
  // Invalidate nutrition plans
  await aiCache.invalidateFunctionCache("nutritionPlan");
  
  console.log(`[Cache Invalidation] ✓ Nutrition cache invalidated`);
}

/**
 * Invalidate parent report cache when player data is updated
 */
export async function invalidateParentReportCache(playerId: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating parent report cache for player ${playerId}`);
  
  // Invalidate parent reports
  await aiCache.invalidateFunctionCache("parentReport");
  
  console.log(`[Cache Invalidation] ✓ Parent report cache invalidated`);
}

/**
 * Invalidate video analysis cache when video data is updated
 */
export async function invalidateVideoCache(playerId?: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating video cache${playerId ? ` for player ${playerId}` : ""}`);
  
  // Invalidate video analyses
  await aiCache.invalidateFunctionCache("videoAnalysis");
  
  console.log(`[Cache Invalidation] ✓ Video cache invalidated`);
}

/**
 * Invalidate all player-related caches (comprehensive)
 */
export async function invalidateAllPlayerCaches(playerId: number): Promise<void> {
  console.log(`[Cache Invalidation] Invalidating ALL caches for player ${playerId}`);
  
  await Promise.all([
    invalidatePlayerCache(playerId),
    invalidatePerformanceCache(playerId),
    invalidateInjuryCache(playerId),
    invalidateNutritionCache(playerId),
    invalidateParentReportCache(playerId),
    invalidateVideoCache(playerId),
  ]);
  
  console.log(`[Cache Invalidation] ✓ All player caches invalidated`);
}

/**
 * Smart invalidation based on data type
 */
export async function smartInvalidate(params: {
  type: "player" | "performance" | "training" | "match" | "injury" | "nutrition" | "video" | "parent_report";
  playerId?: number;
  matchId?: number;
  comprehensive?: boolean; // If true, invalidate all related caches
}): Promise<void> {
  console.log(`[Cache Invalidation] Smart invalidation: ${params.type}${params.playerId ? ` (player ${params.playerId})` : ""}${params.matchId ? ` (match ${params.matchId})` : ""}`);
  
  if (params.comprehensive && params.playerId) {
    await invalidateAllPlayerCaches(params.playerId);
    return;
  }
  
  switch (params.type) {
    case "player":
      if (params.playerId) {
        await invalidatePlayerCache(params.playerId);
      }
      break;
      
    case "performance":
      if (params.playerId) {
        await invalidatePerformanceCache(params.playerId);
      }
      break;
      
    case "training":
      await invalidateTrainingCache(params.playerId);
      break;
      
    case "match":
      await invalidateMatchCache(params.matchId);
      break;
      
    case "injury":
      if (params.playerId) {
        await invalidateInjuryCache(params.playerId);
      }
      break;
      
    case "nutrition":
      if (params.playerId) {
        await invalidateNutritionCache(params.playerId);
      }
      break;
      
    case "video":
      await invalidateVideoCache(params.playerId);
      break;
      
    case "parent_report":
      if (params.playerId) {
        await invalidateParentReportCache(params.playerId);
      }
      break;
  }
  
  console.log(`[Cache Invalidation] ✓ Smart invalidation complete`);
}
