import { getDb } from "./db";
import { userStreaks, streakRewards, badges, userBadges, notifications, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendStreakMilestoneEmail } from "./emailService";
import { sendStreakMilestoneWhatsApp } from "./whatsappService";

/**
 * Check and update user's login streak
 * Called when user logs in
 */
export async function checkAndUpdateStreak(userId: number): Promise<{
  currentStreak: number;
  longestStreak: number;
  milestoneReached: boolean;
  rewardEarned?: { days: number; badgeId?: number };
}> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get existing streak record
  const [existingStreak] = await database
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId));

  if (!existingStreak) {
    // First login - create streak record
    await database.insert(userStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: today,
      totalLogins: 1,
    });

    return {
      currentStreak: 1,
      longestStreak: 1,
      milestoneReached: false,
    };
  }

  const lastLogin = new Date(existingStreak.lastLoginDate);
  lastLogin.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = existingStreak.currentStreak;
  let milestoneReached = false;
  let rewardEarned: { days: number; badgeId?: number } | undefined;

  if (daysDiff === 0) {
    // Already logged in today - no change
    return {
      currentStreak: existingStreak.currentStreak,
      longestStreak: existingStreak.longestStreak,
      milestoneReached: false,
    };
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    newStreak = existingStreak.currentStreak + 1;
  } else {
    // Streak broken - reset to 1
    newStreak = 1;
  }

  const newLongestStreak = Math.max(newStreak, existingStreak.longestStreak);

  // Update streak record
  await database
    .update(userStreaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastLoginDate: today,
      totalLogins: existingStreak.totalLogins + 1,
    })
    .where(eq(userStreaks.userId, userId));

  // Check for milestone rewards
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  if (milestones.includes(newStreak)) {
    milestoneReached = true;

    // Get reward for this milestone
    const [reward] = await database
      .select()
      .from(streakRewards)
      .where(eq(streakRewards.streakDays, newStreak));

    if (reward) {
      rewardEarned = {
        days: reward.streakDays,
        badgeId: reward.badgeId || undefined,
      };

      // Send milestone email
      const [user] = await database
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId));
      
      if (user?.email) {
        await sendStreakMilestoneEmail(user.email, {
          userName: user.name || 'Champion',
          streakDays: newStreak,
          reward: reward.rewardValue || `${newStreak}-Day Streak Badge`,
        });
      }
      
      // Send WhatsApp notification if enabled
      const [userWhatsApp] = await database
        .select({ whatsappPhone: users.whatsappPhone, whatsappNotifications: users.whatsappNotifications })
        .from(users)
        .where(eq(users.id, userId));
      
      if (userWhatsApp?.whatsappPhone && userWhatsApp.whatsappNotifications) {
        await sendStreakMilestoneWhatsApp(userWhatsApp.whatsappPhone, {
          userName: user?.name || 'Champion',
          streakDays: newStreak,
          reward: reward.rewardValue || `${newStreak}-Day Streak Badge`,
        });
      }
      
      // Award badge if specified
      if (reward.badgeId) {
        // Use and() for multiple conditions
        const [existingBadge] = await database
          .select()
          .from(userBadges)
          .where(and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeId, reward.badgeId)
          ));

        if (!existingBadge) {
          await database.insert(userBadges).values({
            userId,
            badgeId: reward.badgeId,
            earnedAt: new Date(),
          });

          // Get badge details for notification
          const [badgeDetails] = await database
            .select()
            .from(badges)
            .where(eq(badges.id, reward.badgeId));

          if (badgeDetails) {
            // Create notification directly
            await database.insert(notifications).values({
              userId,
              type: 'success',
              category: 'achievement',
              title: "Streak Milestone Badge Earned!",
              message: `You've earned the "${badgeDetails.name}" badge for ${newStreak} day streak!`,
              isRead: false,
            });
          }
        }
      }

      // Send streak milestone notification
      await database.insert(notifications).values({
        userId,
        type: 'success',
        category: 'achievement',
        title: `${newStreak} Day Streak! 🔥`,
        message: `Congratulations! You've maintained a ${newStreak} day login streak!`,
        isRead: false,
      });
    }
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    milestoneReached,
    rewardEarned,
  };
}

/**
 * Initialize default streak rewards
 * Called once to populate the streak_rewards table
 */
export async function initializeStreakRewards() {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const rewards = [
    { streakDays: 3, rewardType: "badge" as const, rewardValue: "3 Day Streak" },
    { streakDays: 7, rewardType: "badge" as const, rewardValue: "Week Warrior" },
    { streakDays: 14, rewardType: "badge" as const, rewardValue: "Two Week Champion" },
    { streakDays: 30, rewardType: "badge" as const, rewardValue: "Monthly Master" },
    { streakDays: 60, rewardType: "badge" as const, rewardValue: "60 Day Legend" },
    { streakDays: 90, rewardType: "badge" as const, rewardValue: "Quarter Year Hero" },
    { streakDays: 180, rewardType: "badge" as const, rewardValue: "Half Year Elite" },
    { streakDays: 365, rewardType: "badge" as const, rewardValue: "Year Long Champion" },
  ];

  for (const reward of rewards) {
    const [existing] = await database
      .select()
      .from(streakRewards)
      .where(eq(streakRewards.streakDays, reward.streakDays));

    if (!existing) {
      await database.insert(streakRewards).values(reward);
    }
  }
}
