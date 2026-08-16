import { getDb } from "./db";
import { aiResponseCache } from "../drizzle/schema";
import { eq, lt, gt, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * AI Response Cache Service
 * Provides caching functionality for AI responses to improve performance and reduce API costs
 */

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  playerAnalysis: 60 * 60 * 1000, // 1 hour
  trainingPlan: 24 * 60 * 60 * 1000, // 24 hours
  matchStrategy: 6 * 60 * 60 * 1000, // 6 hours
  opponentAnalysis: 48 * 60 * 60 * 1000, // 48 hours
  parentReport: 12 * 60 * 60 * 1000, // 12 hours
  injuryPrediction: 2 * 60 * 60 * 1000, // 2 hours
  nutritionPlan: 24 * 60 * 60 * 1000, // 24 hours
  mentalAssessment: 6 * 60 * 60 * 1000, // 6 hours
  scoutingReport: 48 * 60 * 60 * 1000, // 48 hours
  videoAnalysis: 12 * 60 * 60 * 1000, // 12 hours
  sessionPlan: 24 * 60 * 60 * 1000, // 24 hours
  default: 30 * 60 * 1000, // 30 minutes
};

/**
 * Generate a unique cache key from function name and parameters
 */
function generateCacheKey(functionName: string, params: any): string {
  const paramsString = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('sha256').update(paramsString).digest('hex');
  return `${functionName}:${hash}`;
}

/**
 * Get TTL for a specific function
 */
function getTTL(functionName: string): number {
  return CACHE_TTL[functionName as keyof typeof CACHE_TTL] || CACHE_TTL.default;
}

/**
 * Get cached AI response if available and not expired
 */
export async function getCachedResponse(
  functionName: string,
  params: any,
  userId?: number
): Promise<string | null> {
  const db = (await getDb())!;
  const cacheKey = generateCacheKey(functionName, params);

  try {
    const cached = await db
      .select()
      .from(aiResponseCache)
      .where(
        and(
          eq(aiResponseCache.cacheKey, cacheKey),
          // Check if not expired
          gt(aiResponseCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (cached.length > 0) {
      const entry = cached[0];
      
      // Update hit count and last accessed time
      await db
        .update(aiResponseCache)
        .set({
          hitCount: entry.hitCount + 1,
          lastAccessedAt: new Date(),
        })
        .where(eq(aiResponseCache.id, entry.id));

      console.log(`[AI Cache] HIT: ${functionName} (hits: ${entry.hitCount + 1})`);
      return entry.response;
    }

    console.log(`[AI Cache] MISS: ${functionName}`);
    return null;
  } catch (error) {
    console.error(`[AI Cache] Error getting cached response:`, error);
    return null;
  }
}

/**
 * Store AI response in cache
 */
export async function setCachedResponse(
  functionName: string,
  params: any,
  response: string,
  userId?: number,
  contextData?: any
): Promise<void> {
  const db = (await getDb())!;
  const cacheKey = generateCacheKey(functionName, params);
  const ttl = getTTL(functionName);
  const expiresAt = new Date(Date.now() + ttl);

  try {
    // Delete existing cache entry if it exists
    await db
      .delete(aiResponseCache)
      .where(eq(aiResponseCache.cacheKey, cacheKey));

    // Insert new cache entry
    await db.insert(aiResponseCache).values({
      cacheKey,
      functionName,
      requestParams: params,
      response,
      contextData,
      userId,
      expiresAt,
      hitCount: 0,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    });

    console.log(`[AI Cache] STORED: ${functionName} (expires: ${expiresAt.toISOString()})`);
  } catch (error) {
    console.error(`[AI Cache] Error storing cached response:`, error);
  }
}

/**
 * Invalidate cache for a specific function and parameters
 */
export async function invalidateCache(
  functionName: string,
  params: any
): Promise<void> {
  const db = (await getDb())!;
  const cacheKey = generateCacheKey(functionName, params);

  try {
    await db
      .delete(aiResponseCache)
      .where(eq(aiResponseCache.cacheKey, cacheKey));

    console.log(`[AI Cache] INVALIDATED: ${functionName}`);
  } catch (error) {
    console.error(`[AI Cache] Error invalidating cache:`, error);
  }
}

/**
 * Invalidate all cache entries for a specific function
 */
export async function invalidateFunctionCache(functionName: string): Promise<void> {
  const db = (await getDb())!;

  try {
    await db
      .delete(aiResponseCache)
      .where(eq(aiResponseCache.functionName, functionName));

    console.log(`[AI Cache] INVALIDATED ALL: ${functionName}`);
  } catch (error) {
    console.error(`[AI Cache] Error invalidating function cache:`, error);
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  const db = (await getDb())!;

  try {
    const result = await db
      .delete(aiResponseCache)
      .where(lt(aiResponseCache.expiresAt, new Date()));

    console.log(`[AI Cache] CLEANED: Removed expired entries`);
    return 0; // MySQL doesn't return affected rows count easily
  } catch (error) {
    console.error(`[AI Cache] Error cleaning expired cache:`, error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalHits: number;
  byFunction: Record<string, { count: number; hits: number }>;
}> {
  const db = (await getDb())!;

  try {
    const entries = await db
      .select()
      .from(aiResponseCache)
      .where(gt(aiResponseCache.expiresAt, new Date()));

    const stats = {
      totalEntries: entries.length,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      byFunction: {} as Record<string, { count: number; hits: number }>,
    };

    entries.forEach((entry) => {
      if (!stats.byFunction[entry.functionName]) {
        stats.byFunction[entry.functionName] = { count: 0, hits: 0 };
      }
      stats.byFunction[entry.functionName].count++;
      stats.byFunction[entry.functionName].hits += entry.hitCount;
    });

    return stats;
  } catch (error) {
    console.error(`[AI Cache] Error getting cache stats:`, error);
    return { totalEntries: 0, totalHits: 0, byFunction: {} };
  }
}

/**
 * Clear all cache entries (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  const db = (await getDb())!;

  try {
    await db.delete(aiResponseCache);
    console.log(`[AI Cache] CLEARED ALL CACHE`);
  } catch (error) {
    console.error(`[AI Cache] Error clearing all cache:`, error);
  }
}
