import { eq, and, sql, gte, lte } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createChallengeCompletedNotification } from './notificationService';

interface ChallengeCriteria {
  type: 'quiz_streak' | 'perfect_score' | 'multiple_courses' | 'high_average';
  count?: number;
  threshold?: number;
  days?: number;
}

interface ChallengeReward {
  type: 'badge' | 'points' | 'certificate';
  value: string | number;
}

export async function checkAndUpdateChallengeProgress(
  userId: number,
  quizScore: number,
  passed: boolean,
  db: MySql2Database<any>
): Promise<Array<{ id: number; title: string; completed: boolean }>> {
  const { challenges, userChallenges, quizAttempts } = await import('../drizzle/schema');
  
  const now = new Date();
  const updatedChallenges: Array<{ id: number; title: string; completed: boolean }> = [];
  
  // Get active challenges
  const activeChallenges = await db.select()
    .from(challenges)
    .where(and(
      eq(challenges.isActive, true),
      lte(challenges.startDate, now),
      gte(challenges.endDate, now)
    ));
  
  for (const challenge of activeChallenges) {
    // Get or create user challenge record
    let userChallenge = await db.select()
      .from(userChallenges)
      .where(and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challenge.id)
      ))
      .limit(1);
    
    if (userChallenge.length === 0) {
      // Create new user challenge
      await db.insert(userChallenges).values({
        userId,
        challengeId: challenge.id,
        progress: 0,
        completed: false
      });
      
      userChallenge = await db.select()
        .from(userChallenges)
        .where(and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challenge.id)
        ))
        .limit(1);
    }
    
    if (userChallenge[0].completed) continue;
    
    const criteria = challenge.criteria as ChallengeCriteria;
    let newProgress = userChallenge[0].progress || 0;
    let isCompleted = false;
    
    switch (criteria.type) {
      case 'quiz_streak':
        // Check consecutive days with quiz attempts
        const recentAttempts = await db.select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, userId))
          .orderBy(sql`${quizAttempts.attemptedAt} DESC`)
          .limit(criteria.days || 7);
        
        const uniqueDays = new Set(
          recentAttempts.map(a => 
            new Date(a.attemptedAt).toDateString()
          )
        );
        
        newProgress = uniqueDays.size;
        isCompleted = newProgress >= (criteria.count || 7);
        break;
      
      case 'perfect_score':
        // Check if got perfect score
        if (quizScore === 100) {
          newProgress = 1;
          isCompleted = true;
        }
        break;
      
      case 'multiple_courses':
        // Count completed courses
        const { courseEnrollments } = await import('../drizzle/schema');
        const completed = await db.select()
          .from(courseEnrollments)
          .where(and(
            eq(courseEnrollments.userId, userId),
            sql`${courseEnrollments.completedAt} IS NOT NULL`
          ));
        
        newProgress = completed.length;
        isCompleted = newProgress >= (criteria.count || 3);
        break;
      
      case 'high_average':
        // Calculate average score
        const allAttempts = await db.select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, userId));
        
        if (allAttempts.length >= (criteria.count || 5)) {
          const avgScore = allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length;
          newProgress = Math.round(avgScore);
          isCompleted = avgScore >= (criteria.threshold || 85);
        }
        break;
    }
    
    // Update user challenge
    await db.update(userChallenges)
      .set({
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null
      })
      .where(eq(userChallenges.id, userChallenge[0].id));
    
    if (isCompleted && !userChallenge[0].completed) {
      // Create notification
      await createChallengeCompletedNotification(userId, challenge.title, challenge.id, db);
      
      updatedChallenges.push({
        id: challenge.id,
        title: challenge.title,
        completed: true
      });
    }
  }
  
  return updatedChallenges;
}

export async function claimChallengeReward(
  userId: number,
  challengeId: number,
  db: MySql2Database<any>
): Promise<{ success: boolean; reward: ChallengeReward | null }> {
  const { challenges, userChallenges, userBadges, badges } = await import('../drizzle/schema');
  
  // Get user challenge
  const userChallenge = await db.select()
    .from(userChallenges)
    .where(and(
      eq(userChallenges.userId, userId),
      eq(userChallenges.challengeId, challengeId)
    ))
    .limit(1);
  
  if (userChallenge.length === 0 || !userChallenge[0].completed || userChallenge[0].rewardClaimed) {
    return { success: false, reward: null };
  }
  
  // Get challenge details
  const challenge = await db.select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);
  
  if (challenge.length === 0) {
    return { success: false, reward: null };
  }
  
  const reward = challenge[0].reward as ChallengeReward;
  
  // Apply reward
  if (reward.type === 'badge' && typeof reward.value === 'string') {
    // Find badge by name
    const badge = await db.select()
      .from(badges)
      .where(eq(badges.name, reward.value))
      .limit(1);
    
    if (badge.length > 0) {
      // Award badge if not already earned
      const existing = await db.select()
        .from(userBadges)
        .where(and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeId, badge[0].id)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(userBadges).values({
          userId,
          badgeId: badge[0].id,
          progress: 100,
          metadata: { earnedFrom: 'challenge', challengeId }
        });
      }
    }
  }
  
  // Mark reward as claimed
  await db.update(userChallenges)
    .set({
      rewardClaimed: true,
      claimedAt: new Date()
    })
    .where(eq(userChallenges.id, userChallenge[0].id));
  
  return { success: true, reward };
}

// Initialize default weekly challenges
export async function initializeWeeklyChallenges(db: MySql2Database<any>) {
  const { challenges } = await import('../drizzle/schema');
  
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const defaultChallenges = [
    {
      title: 'Quiz Master',
      description: 'Complete quizzes for 5 consecutive days',
      type: 'quiz_streak' as const,
      criteria: { type: 'quiz_streak' as const, count: 5, days: 7 },
      reward: { type: 'badge' as const, value: 'Quiz Master' },
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    },
    {
      title: 'Perfect Performance',
      description: 'Achieve a perfect score of 100% on any quiz',
      type: 'perfect_score' as const,
      criteria: { type: 'perfect_score' as const },
      reward: { type: 'badge' as const, value: 'Perfect Score' },
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    },
    {
      title: 'Course Champion',
      description: 'Complete 3 different coaching courses',
      type: 'multiple_courses' as const,
      criteria: { type: 'multiple_courses' as const, count: 3 },
      reward: { type: 'badge' as const, value: 'Bronze Coach' },
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    },
    {
      title: 'Excellence Streak',
      description: 'Maintain an average score of 85% or higher across 5 quizzes',
      type: 'high_average' as const,
      criteria: { type: 'high_average' as const, count: 5, threshold: 85 },
      reward: { type: 'badge' as const, value: 'Excellence' },
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    }
  ];
  
  // Check if challenges already exist for this week
  const existing = await db.select()
    .from(challenges)
    .where(and(
      gte(challenges.startDate, weekStart),
      lte(challenges.startDate, weekEnd)
    ))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(challenges).values(defaultChallenges);
  }
}
