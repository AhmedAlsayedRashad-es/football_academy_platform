import type { MySql2Database } from 'drizzle-orm/mysql2';

interface CreateNotificationParams {
  userId: number;
  type: 'badge_earned' | 'challenge_completed' | 'course_completed' | 'system';
  title: string;
  message: string;
  data?: any;
}

export async function createNotification(
  params: CreateNotificationParams,
  db: MySql2Database<any>
): Promise<void> {
  const { notifications } = await import('../drizzle/schema');
  
  // Map our types to existing schema types
  const typeMapping: Record<string, 'info' | 'success' | 'warning' | 'alert'> = {
    'badge_earned': 'success',
    'challenge_completed': 'success',
    'course_completed': 'success',
    'system': 'info'
  };
  
  const categoryMapping: Record<string, 'performance' | 'training' | 'nutrition' | 'mental' | 'injury' | 'achievement' | 'general'> = {
    'badge_earned': 'achievement',
    'challenge_completed': 'achievement',
    'course_completed': 'training',
    'system': 'general'
  };
  
  await db.insert(notifications).values({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: typeMapping[params.type] || 'info',
    category: categoryMapping[params.type] || 'general',
    isRead: false,
    relatedEntityType: params.data?.entityType,
    relatedEntityId: params.data?.entityId
  });
}

export async function createBadgeEarnedNotification(
  userId: number,
  badgeName: string,
  badgeId: number,
  db: MySql2Database<any>
): Promise<void> {
  await createNotification({
    userId,
    type: 'badge_earned',
    title: '🏆 Badge Earned!',
    message: `Congratulations! You've earned the "${badgeName}" badge!`,
    data: { entityType: 'badge', entityId: badgeId }
  }, db);
}

export async function createChallengeCompletedNotification(
  userId: number,
  challengeTitle: string,
  challengeId: number,
  db: MySql2Database<any>
): Promise<void> {
  await createNotification({
    userId,
    type: 'challenge_completed',
    title: '🎯 Challenge Completed!',
    message: `You've completed the "${challengeTitle}" challenge!`,
    data: { entityType: 'challenge', entityId: challengeId }
  }, db);
}

export async function createCourseCompletedNotification(
  userId: number,
  courseTitle: string,
  courseId: number,
  db: MySql2Database<any>
): Promise<void> {
  await createNotification({
    userId,
    type: 'course_completed',
    title: '📚 Course Completed!',
    message: `Congratulations on completing "${courseTitle}"!`,
    data: { entityType: 'course', entityId: courseId }
  }, db);
}
