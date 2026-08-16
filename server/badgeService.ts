import { eq, and, sql } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { createBadgeEarnedNotification } from './notificationService';

interface BadgeCriteria {
  type: 'course_completion' | 'perfect_score' | 'excellence' | 'master' | 'first_quiz' | 'quiz_streak';
  count?: number;
  scoreThreshold?: number;
}

export async function checkAndAwardBadges(
  userId: number,
  quizScore: number,
  passed: boolean,
  db: MySql2Database<any>
): Promise<Array<{ id: number; name: string; icon: string }>> {
  const { badges, userBadges, courseEnrollments, quizAttempts } = await import('../drizzle/schema');
  
  const earnedBadges: Array<{ id: number; name: string; icon: string }> = [];
  
  // Get all active badges
  const allBadges = await db.select()
    .from(badges)
    .where(eq(badges.isActive, true));
  
  // Get user's existing badges
  const existingBadges = await db.select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  
  const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));
  
  // Get user's completed courses
  const completedCourses = await db.select()
    .from(courseEnrollments)
    .where(and(
      eq(courseEnrollments.userId, userId),
      sql`${courseEnrollments.completedAt} IS NOT NULL`
    ));
  
  // Get user's quiz attempts with high scores
  const highScoreAttempts = await db.select()
    .from(quizAttempts)
    .where(and(
      eq(quizAttempts.userId, userId),
      sql`${quizAttempts.score} >= 90`
    ));
  
  // Get all quiz attempts
  const allQuizAttempts = await db.select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));
  
  // Get passing quiz attempts (70%+)
  const passingAttempts = await db.select()
    .from(quizAttempts)
    .where(and(
      eq(quizAttempts.userId, userId),
      sql`${quizAttempts.score} >= 70`
    ));
  
  const perfectScoreAttempts = await db.select()
    .from(quizAttempts)
    .where(and(
      eq(quizAttempts.userId, userId),
      eq(quizAttempts.score, 100)
    ));
  
  // Check each badge
  for (const badge of allBadges) {
    // Skip if user already has this badge
    if (existingBadgeIds.has(badge.id)) continue;
    
    const criteria = badge.criteria as BadgeCriteria;
    let shouldAward = false;
    
    switch (criteria.type) {
      case 'course_completion':
        // Award if user completed required number of courses
        if (completedCourses.length >= (criteria.count || 1)) {
          shouldAward = true;
        }
        break;
      
      case 'perfect_score':
        // Award if user got 100% on any quiz
        if (quizScore === 100 || perfectScoreAttempts.length > 0) {
          shouldAward = true;
        }
        break;
      
      case 'excellence':
        // Award if user scored 90%+ on required number of quizzes
        if (highScoreAttempts.length >= (criteria.count || 3)) {
          shouldAward = true;
        }
        break;
      
      case 'master':
        // Award if user completed all 5 courses
        if (completedCourses.length >= 5) {
          shouldAward = true;
        }
        break;
      
      case 'first_quiz':
        // Award if user completed their first quiz
        if (allQuizAttempts.length >= 1) {
          shouldAward = true;
        }
        break;
      
      case 'quiz_streak':
        // Award if user passed required number of quizzes
        if (passingAttempts.length >= (criteria.count || 5)) {
          shouldAward = true;
        }
        break;
    }
    
    if (shouldAward) {
      // Award the badge
      await db.insert(userBadges).values({
        userId,
        badgeId: badge.id,
        progress: 100,
        metadata: { earnedFrom: 'quiz_completion', score: quizScore }
      });
      
      // Create notification
      await createBadgeEarnedNotification(userId, badge.name, badge.id, db);
      
      earnedBadges.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon
      });
    }
  }
  
  return earnedBadges;
}

// Initialize default badges
export async function initializeDefaultBadges(db: MySql2Database<any>) {
  const { badges } = await import('../drizzle/schema');
  
  const defaultBadges = [
    {
      name: 'First Steps',
      description: 'Complete your first coaching course',
      icon: 'Award',
      category: 'completion' as const,
      criteria: { type: 'course_completion' as const, count: 1 },
      displayOrder: 1
    },
    {
      name: 'Bronze Coach',
      description: 'Complete 3 coaching courses',
      icon: 'Medal',
      category: 'completion' as const,
      criteria: { type: 'course_completion' as const, count: 3 },
      displayOrder: 2
    },
    {
      name: 'Silver Coach',
      description: 'Complete 5 coaching courses',
      icon: 'Trophy',
      category: 'completion' as const,
      criteria: { type: 'course_completion' as const, count: 5 },
      displayOrder: 3
    },
    {
      name: 'Perfect Score',
      description: 'Achieve 100% on any quiz',
      icon: 'Star',
      category: 'excellence' as const,
      criteria: { type: 'perfect_score' as const },
      displayOrder: 4
    },
    {
      name: 'Excellence',
      description: 'Score 90% or higher on 3 quizzes',
      icon: 'Sparkles',
      category: 'excellence' as const,
      criteria: { type: 'excellence' as const, count: 3 },
      displayOrder: 5
    },
    {
      name: 'Master Coach',
      description: 'Complete all coaching courses',
      icon: 'Crown',
      category: 'mastery' as const,
      criteria: { type: 'master' as const },
      displayOrder: 6
    }
  ];
  
  // Check if badges already exist
  const existing = await db.select().from(badges).limit(1);
  if (existing.length === 0) {
    await db.insert(badges).values(defaultBadges);
  }
}
