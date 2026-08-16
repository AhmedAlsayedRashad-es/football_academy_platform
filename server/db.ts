import "dotenv/config";
import { eq, desc, and, sql, gte, lte, or, asc, isNull, ne, inArray, notInArray } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, users, 
  players, InsertPlayer, Player,
  teams, InsertTeam, Team,
  parentPlayerRelations,
  performanceMetrics, InsertPerformanceMetric,
  mentalAssessments, InsertMentalAssessment,
  workoutPlans, InsertWorkoutPlan,
  injuries, InsertInjury,
  mealPlans, InsertMealPlan,
  nutritionLogs, InsertNutritionLog,
  trainingSessions, InsertTrainingSession,
  developmentPlans, InsertDevelopmentPlan,
  developmentGoals, InsertDevelopmentGoal,
  achievements, InsertAchievement,
  notifications, InsertNotification,
  coachFeedback, InsertCoachFeedback,
  leagueStandings, InsertLeagueStanding,
  manOfTheMatch, InsertManOfTheMatch,
  playerMatchStats, InsertPlayerMatchStat,
  playerSkillScores, InsertPlayerSkillScore,
  aiTrainingRecommendations, InsertAITrainingRecommendation,
  videoAnalysis, InsertVideoAnalysis,
  matches, InsertMatch, Match,
  registrationRequests, InsertRegistrationRequest,
  contactInquiries, InsertContactInquiry,
  gpsTrackerData, InsertGpsTrackerData,
  academyEvents, InsertAcademyEvent,
  coachProfiles, InsertCoachProfile,
  eventRegistrations, InsertEventRegistration,
  coachAvailability, InsertCoachAvailability,
  membershipPlans, InsertMembershipPlan,
  attendance, InsertAttendance,
  playerPoints, InsertPlayerPoints,
  pointsTransactions, InsertPointsTransaction,
  rewards, InsertReward,
  rewardRedemptions, InsertRewardRedemption,
  playerActivities, InsertPlayerActivity,
  weeklyTargets, InsertWeeklyTarget,
  aiVideoAnalysis, InsertAIVideoAnalysis,
  masterclassContent, InsertMasterclassContent,
  drillAssignments, InsertDrillAssignment, DrillAssignment,
  trainingVideos, InsertTrainingVideo, TrainingVideo,
  trainingLocations, InsertTrainingLocation, TrainingLocation,
  coachReviews, InsertCoachReview, CoachReview,
  coachScheduleSlots, InsertCoachScheduleSlot, CoachScheduleSlot,
  privateTrainingBookings, InsertPrivateTrainingBooking, PrivateTrainingBooking,
  videoClips, InsertVideoClip, VideoClip,
  matchShots, InsertMatchShot, MatchShot,
  matchPasses, InsertMatchPass, MatchPass,
  matchDefensiveActions, InsertMatchDefensiveAction, MatchDefensiveAction,
  userStreaks,
  streakRewards,
  forumCategories,
  forumPosts,
  forumReplies,
  forumVotes,
  userReputation,
  videoTags, InsertVideoTag, VideoTag,
  videoAnnotations, InsertVideoAnnotation, VideoAnnotation,
  playerHeatmaps, InsertPlayerHeatmap, PlayerHeatmap,
  formations, InsertFormation, Formation,
  setPieces, InsertSetPiece, SetPiece,
  oppositionAnalysis, InsertOppositionAnalysis, OppositionAnalysis,
  matchBriefings, InsertMatchBriefing, MatchBriefing,
  liveMatchNotes, InsertLiveMatchNote, LiveMatchNote,
  playerInstructions, InsertPlayerInstruction, PlayerInstruction,
  academyVideos, InsertAcademyVideo, AcademyVideo,
  videoEvents, VideoEvent, InsertVideoEvent,
  opponents, Opponent, InsertOpponent,
  opponentVideos, OpponentVideo, InsertOpponentVideo,
  matchStrategies, MatchStrategy, InsertMatchStrategy,
  matchEventSessions, MatchEventSession, InsertMatchEventSession,
  videoAnalyses, SavedVideoAnalysis, InsertSavedVideoAnalysis,
  playermakerSettings, InsertPlayermakerSettings,
  playermakerSessions, InsertPlayermakerSession,
  playermakerPlayerMetrics, InsertPlayermakerPlayerMetrics,
  playermakerSyncHistory, InsertPlayermakerSyncHistory,
  playermakerCoachAnnotations, InsertPlayermakerCoachAnnotation,
  homePageContent, InsertHomePageContent, HomePageContent,
  liveMatches, InsertLiveMatch, LiveMatch,
  matchEvents, InsertMatchEvent, MatchEvent,
  tacticalChanges, InsertTacticalChange, TacticalChange,
  playerPositions, InsertPlayerPosition, PlayerPosition,
  gpsLiveSync, InsertGpsLiveSync, GpsLiveSync,
  teamCoaches, InsertTeamCoach, TeamCoach,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// `ReturnType<typeof drizzle>` resolves to the wrong overload of the (heavily
// overloaded) drizzle() signature, so name the database type directly.
let _db: MySql2Database<Record<string, unknown>> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  const databaseUrl = ENV.databaseUrl || process.env.DATABASE_URL || "";

  if (!_db && databaseUrl) {
    try {
      _pool = mysql.createPool({
        uri: databaseUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 30000,
      });
      _db = drizzle(_pool);
      console.log("[Database] Connection pool created");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = (await getDb())!;
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const MAX_RETRIES = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const values: InsertUser = {
        openId: user.openId,
      };
      const updateSet: Record<string, unknown> = {};

      const textFields = ["name", "email", "loginMethod", "avatarUrl", "phone", "whatsappPhone"] as const;
      type TextField = (typeof textFields)[number];

      const assignNullable = (field: TextField) => {
        const value = user[field];
        if (value === undefined) return;
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      };

      textFields.forEach(assignNullable);

      if (user.lastSignedIn !== undefined) {
        values.lastSignedIn = user.lastSignedIn;
        updateSet.lastSignedIn = user.lastSignedIn;
      }
      // Determine role
      if (user.role !== undefined) {
        values.role = user.role;
        updateSet.role = user.role;
      } else if (user.openId === ENV.ownerOpenId) {
        values.role = 'admin';
        updateSet.role = 'admin';
      }

      // Auto-approve admin/owner accounts
      const isOwner = user.openId === ENV.ownerOpenId;
      const isAdmin = (values.role === 'admin') || (user.role === 'admin');
      if (isOwner || isAdmin) {
        values.accountStatus = 'approved';
        updateSet.accountStatus = 'approved';
      } else if (user.accountStatus !== undefined) {
        values.accountStatus = user.accountStatus;
        updateSet.accountStatus = user.accountStatus;
      } else {
        // New users default to approved so they can log in immediately
        values.accountStatus = 'approved';
      }

      if (user.whatsappNotifications !== undefined) {
        values.whatsappNotifications = user.whatsappNotifications;
        updateSet.whatsappNotifications = user.whatsappNotifications;
      }

      if (!values.lastSignedIn) {
        values.lastSignedIn = new Date();
      }

      if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = new Date();
      }

      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
      return; // success
    } catch (error: unknown) {
      lastError = error;
      const msg = (error instanceof Error) ? error.message : String(error);
      const isTransient = msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('PROTOCOL_CONNECTION_LOST');
      if (isTransient && attempt < MAX_RETRIES) {
        console.warn(`[Database] Transient error on attempt ${attempt}, retrying...`, msg);
        // Reset pool on transient errors so next attempt gets a fresh connection
        _db = null;
        _pool = null;
        await new Promise(r => setTimeout(r, 200 * attempt));
        continue;
      }
      console.error("[Database] Failed to upsert user:", error);
      throw error;
    }
  }
  throw lastError;
}

export async function getUserByOpenId(openId: string) {
  const db = (await getDb())!;
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: InsertUser['role']) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPendingUser(data: {
  name: string;
  email: string;
  phone?: string;
  requestedRole: InsertUser['role'];
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  // Generate a temporary openId for pending users
  const tempOpenId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const result = await db.insert(users).values({
    openId: tempOpenId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: 'player', // Default role, will be updated on approval
    requestedRole: data.requestedRole,
    accountStatus: 'pending',
  });
  
  // Return the created user ID
  const createdUser = await getUserByEmail(data.email);
  return createdUser?.id || 0;
}

export async function getPendingUsers() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(users).where(eq(users.accountStatus, 'pending')).orderBy(desc(users.createdAt));
}

export async function approveUser(userId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  
  await db.update(users).set({
    accountStatus: 'approved',
    role: user.requestedRole || user.role,
  }).where(eq(users.id, userId));
}

export async function rejectUser(userId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ accountStatus: 'rejected' }).where(eq(users.id, userId));
}

export async function markOnboardingComplete(userId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId));
}

export async function updateWhatsAppSettings(userId: number, whatsappPhone: string | null, whatsappNotifications: boolean) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ 
    whatsappPhone, 
    whatsappNotifications 
  }).where(eq(users.id, userId));
}

export async function updateUserAvatar(userId: number, avatarUrl: string | null) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
}

// ==================== PLAYER FUNCTIONS ====================

export async function createPlayer(player: InsertPlayer) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(players).values(player);
  return result[0].insertId;
}

export async function getPlayerById(id: number) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Returns null rather than undefined: this is handed straight back from
// players.getByUserId, and a tRPC query resolving to undefined makes React Query
// throw "Query data cannot be undefined" instead of rendering an empty state.
export async function getPlayerByUserId(userId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllPlayers() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(players).orderBy(desc(players.createdAt));
}

export async function getPlayersByTeam(teamId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(players).where(eq(players.teamId, teamId));
}

export async function getPlayersByTeamType(teamType: 'main' | 'academy') {
  const db = (await getDb())!;
  if (!db) return [];
  // Get teams of the specified type, then get players from those teams
  const teamsOfType = await db.select().from(teams).where(eq(teams.teamType, teamType));
  if (teamsOfType.length === 0) return [];
  const teamIds = teamsOfType.map(t => t.id);
  return db.select().from(players).where(inArray(players.teamId, teamIds)).orderBy(desc(players.createdAt));
}

export async function getPlayersByAgeGroup(ageGroup: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(players).where(eq(players.ageGroup, ageGroup));
}

export async function updatePlayer(id: number, data: Partial<InsertPlayer>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(players).set(data).where(eq(players.id, id));
}

export async function getPlayerByAcademyCode(academyCode: string) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.academyCode as any, academyCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function generateAcademyCode(playerId: number, firstName: string, lastName: string): Promise<string> {
  return `AHA-${String(playerId).padStart(4, '0')}-${firstName.substring(0, 2).toUpperCase()}${lastName.substring(0, 2).toUpperCase()}`;
}

export async function getPlayersForParent(parentUserId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  const relations = await db.select().from(parentPlayerRelations).where(eq(parentPlayerRelations.parentUserId, parentUserId));
  if (relations.length === 0) return [];
  const playerIds = relations.map(r => r.playerId);
  // Use inArray for proper SQL IN clause
  const result = await db.select().from(players).where(inArray(players.id, playerIds));
  return result;
}

// ==================== TEAM FUNCTIONS ====================

export async function createTeam(team: InsertTeam) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teams).values(team);
  return result[0].insertId;
}

export async function getAllTeams() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(teams).orderBy(teams.ageGroup);
}

export async function getTeamById(id: number) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTeamsByType(teamType: 'main' | 'academy') {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(teams).where(eq(teams.teamType, teamType)).orderBy(teams.ageGroup);
}

// ==================== TEAM-COACH ASSIGNMENT FUNCTIONS ====================

export async function assignCoachToTeam(data: InsertTeamCoach) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamCoaches).values(data);
  return result[0].insertId;
}

export async function removeCoachFromTeam(teamId: number, coachUserId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.delete(teamCoaches).where(
    and(eq(teamCoaches.teamId, teamId), eq(teamCoaches.coachUserId, coachUserId))
  );
}

export async function getTeamCoaches(teamId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select({
    id: teamCoaches.id,
    teamId: teamCoaches.teamId,
    coachUserId: teamCoaches.coachUserId,
    role: teamCoaches.role,
    customRole: (teamCoaches as any).customRole,
    notes: (teamCoaches as any).notes,
    isPrimary: teamCoaches.isPrimary,
    assignedAt: teamCoaches.assignedAt,
    coachName: users.name,
    coachEmail: users.email,
    coachAvatar: users.avatarUrl,
  })
  .from(teamCoaches)
  .leftJoin(users, eq(teamCoaches.coachUserId, users.id))
  .where(eq(teamCoaches.teamId, teamId));
}

export async function getCoachTeams(coachUserId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select({
    id: teamCoaches.id,
    teamId: teamCoaches.teamId,
    role: teamCoaches.role,
    isPrimary: teamCoaches.isPrimary,
    teamName: teams.name,
    teamType: teams.teamType,
    ageGroup: teams.ageGroup,
  })
  .from(teamCoaches)
  .leftJoin(teams, eq(teamCoaches.teamId, teams.id))
  .where(eq(teamCoaches.coachUserId, coachUserId));
}

export async function getAllTeamCoachAssignments() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select({
    id: teamCoaches.id,
    teamId: teamCoaches.teamId,
    coachUserId: teamCoaches.coachUserId,
    role: teamCoaches.role,
    customRole: (teamCoaches as any).customRole,
    notes: (teamCoaches as any).notes,
    isPrimary: teamCoaches.isPrimary,
    assignedAt: teamCoaches.assignedAt,
    teamName: teams.name,
    teamType: teams.teamType,
    ageGroup: teams.ageGroup,
    coachName: users.name,
    coachEmail: users.email,
    coachAvatar: users.avatarUrl,
  })
  .from(teamCoaches)
  .leftJoin(teams, eq(teamCoaches.teamId, teams.id))
  .leftJoin(users, eq(teamCoaches.coachUserId, users.id));
}

export async function updateCoachRole(assignmentId: number, role: InsertTeamCoach['role'], isPrimary: boolean, customRole?: string, notes?: string) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.update(teamCoaches).set({ role, isPrimary, ...(customRole !== undefined ? { customRole } : {}), ...(notes !== undefined ? { notes } : {}) } as any).where(eq(teamCoaches.id, assignmentId));
}

export async function getAvailableCoaches() {
  const db = (await getDb())!;
  if (!db) return [];
  // Return all approved non-player/non-parent users so technical/admin/medical staff can be assigned
  return db.select().from(users).where(
    and(
      notInArray(users.role, ['player', 'parent'] as any[]),
      eq(users.accountStatus, 'approved')
    )
  );
}

// ==================== PERFORMANCE METRICS FUNCTIONS ====================

export async function createPerformanceMetric(metric: InsertPerformanceMetric) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(performanceMetrics).values(metric);
  return result[0].insertId;
}

export async function getPlayerPerformanceMetrics(playerId: number, limit = 30) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(performanceMetrics)
    .where(eq(performanceMetrics.playerId, playerId))
    .orderBy(desc(performanceMetrics.sessionDate))
    .limit(limit);
}

export async function getLatestPerformanceMetric(playerId: number) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(performanceMetrics)
    .where(eq(performanceMetrics.playerId, playerId))
    .orderBy(desc(performanceMetrics.sessionDate))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== MENTAL ASSESSMENT FUNCTIONS ====================

export async function createMentalAssessment(assessment: InsertMentalAssessment) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mentalAssessments).values(assessment);
  return result[0].insertId;
}

export async function getPlayerMentalAssessments(playerId: number, limit = 10) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(mentalAssessments)
    .where(eq(mentalAssessments.playerId, playerId))
    .orderBy(desc(mentalAssessments.assessmentDate))
    .limit(limit);
}

export async function getLatestMentalAssessment(playerId: number) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(mentalAssessments)
    .where(eq(mentalAssessments.playerId, playerId))
    .orderBy(desc(mentalAssessments.assessmentDate))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== WORKOUT PLAN FUNCTIONS ====================

export async function createWorkoutPlan(plan: InsertWorkoutPlan) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutPlans).values(plan);
  return result[0].insertId;
}

export async function getPlayerWorkoutPlans(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(workoutPlans)
    .where(eq(workoutPlans.playerId, playerId))
    .orderBy(desc(workoutPlans.scheduledDate));
}

export async function getTeamWorkoutPlans(teamId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(workoutPlans)
    .where(eq(workoutPlans.teamId, teamId))
    .orderBy(desc(workoutPlans.scheduledDate));
}

export async function updateWorkoutPlan(id: number, data: Partial<InsertWorkoutPlan>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(workoutPlans).set(data).where(eq(workoutPlans.id, id));
}

// ==================== INJURY FUNCTIONS ====================

export async function createInjury(injury: InsertInjury) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(injuries).values(injury);
  return result[0].insertId;
}

export async function getPlayerInjuries(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(injuries)
    .where(eq(injuries.playerId, playerId))
    .orderBy(desc(injuries.injuryDate));
}

export async function getActiveInjuries() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(injuries)
    .where(eq(injuries.status, 'active'))
    .orderBy(desc(injuries.injuryDate));
}

export async function getActiveInjuriesWithPlayerInfo() {
  const db = (await getDb())!;
  if (!db) return [];
  const activeInjuries = await db
    .select()
    .from(injuries)
    .where(or(eq(injuries.status, 'active'), eq(injuries.status, 'recovering')))
    .orderBy(desc(injuries.injuryDate));
  // Enrich with player and team info
  const enriched = await Promise.all(activeInjuries.map(async (inj) => {
    const [player] = await db.select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      position: players.position,
      teamId: players.teamId,
      photoUrl: players.photoUrl,
    }).from(players).where(eq(players.id, inj.playerId));
    let teamName = 'Unknown';
    if (player?.teamId) {
      const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, player.teamId));
      teamName = team?.name || 'Unknown';
    }
    const today = new Date();
    const recoveryDate = inj.expectedRecoveryDate ? new Date(inj.expectedRecoveryDate) : null;
    const daysRemaining = recoveryDate ? Math.max(0, Math.ceil((recoveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : null;
    const daysInjured = inj.injuryDate ? Math.ceil((today.getTime() - new Date(inj.injuryDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    return {
      ...inj,
      playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown',
      playerPosition: player?.position || 'Unknown',
      playerAvatarUrl: player?.photoUrl || null,
      teamId: player?.teamId || null,
      teamName,
      daysRemaining,
      daysInjured,
    };
  }));
  return enriched;
}

export async function getFullPlayerReport(playerId: number, fromDate?: Date, toDate?: Date) {
  const db = (await getDb())!;
  if (!db) return null;
  // Player info
  const player = await getPlayerById(playerId);
  if (!player) return null;
  // Team info
  let teamName = 'Unknown';
  if (player.teamId) {
    const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, player.teamId));
    teamName = team?.name || 'Unknown';
  }
  // Attendance
  const attendance = await getPlayerAttendance(playerId, 200);
  const filteredAttendance = fromDate ? attendance.filter((a: any) => {
    const d = new Date(a.sessionDate || a.date || a.createdAt);
    return d >= fromDate && (!toDate || d <= toDate);
  }) : attendance;
  const attendanceRate = await getPlayerAttendanceRate(playerId);
  // Performance metrics
  const perfMetrics = await getPlayerPerformanceMetrics(playerId, 50);
  const filteredPerf = fromDate ? perfMetrics.filter((p: any) => {
    const d = new Date(p.sessionDate);
    return d >= fromDate && (!toDate || d <= toDate);
  }) : perfMetrics;
  // Injuries
  const allInjuries = await getPlayerInjuries(playerId);
  // Skill scores
  const skillHistory = await getSkillScoreHistory(playerId);
  const latestSkill = skillHistory[0] || null;
  const baselineSkill = skillHistory[skillHistory.length - 1] || null;
  // Achievements
  const achievements = await getPlayerAchievements(playerId);
  // Points
  const points = await getPlayerPoints(playerId);
  // Match stats
  const matchStats = await getPlayerMatchStats(playerId);
  // Feedback
  const feedback = await getPlayerFeedback(playerId, 10);
  return {
    player: { ...player, teamName },
    attendance: {
      records: filteredAttendance.slice(0, 50),
      total: filteredAttendance.length,
      rate: attendanceRate.rate,
    },
    performance: {
      metrics: filteredPerf,
      summary: filteredPerf.length > 0 ? {
        avgPasses: Math.round(filteredPerf.reduce((s: number, m: any) => s + (m.passes || 0), 0) / filteredPerf.length),
        avgPassAccuracy: Math.round(filteredPerf.reduce((s: number, m: any) => s + (m.passAccuracy || 0), 0) / filteredPerf.length),
        avgDistance: Math.round(filteredPerf.reduce((s: number, m: any) => s + (m.distanceCovered || 0), 0) / filteredPerf.length),
        avgSprints: Math.round(filteredPerf.reduce((s: number, m: any) => s + (m.sprints || 0), 0) / filteredPerf.length),
        totalGoals: filteredPerf.reduce((s: number, m: any) => s + (m.shots || 0), 0),
        sessions: filteredPerf.length,
      } : null,
    },
    injuries: allInjuries,
    skills: {
      history: skillHistory,
      latest: latestSkill,
      baseline: baselineSkill,
    },
    achievements: achievements,
    points: points,
    matchStats: matchStats,
    feedback: feedback,
  };
}

export async function updateInjury(id: number, data: Partial<InsertInjury>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(injuries).set(data).where(eq(injuries.id, id));
}

// ==================== MEAL PLAN FUNCTIONS ====================

export async function createMealPlan(plan: InsertMealPlan) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mealPlans).values(plan);
  return result[0].insertId;
}

export async function getPlayerMealPlans(playerId: number, date?: string) {
  const db = (await getDb())!;
  if (!db) return [];
  if (date) {
    return db.select().from(mealPlans)
      .where(and(eq(mealPlans.playerId, playerId), eq(mealPlans.planDate, new Date(date))))
      .orderBy(mealPlans.mealType);
  }
  return db.select().from(mealPlans)
    .where(eq(mealPlans.playerId, playerId))
    .orderBy(desc(mealPlans.planDate));
}

// ==================== NUTRITION LOG FUNCTIONS ====================

export async function createNutritionLog(log: InsertNutritionLog) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nutritionLogs).values(log);
  return result[0].insertId;
}

export async function getPlayerNutritionLogs(playerId: number, limit = 30) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(nutritionLogs)
    .where(eq(nutritionLogs.playerId, playerId))
    .orderBy(desc(nutritionLogs.logDate))
    .limit(limit);
}

// ==================== TRAINING SESSION FUNCTIONS ====================

export async function createTrainingSession(session: InsertTrainingSession) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trainingSessions).values(session);
  return result[0].insertId;
}

export async function getTeamTrainingSessions(teamId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(trainingSessions)
    .where(eq(trainingSessions.teamId, teamId))
    .orderBy(desc(trainingSessions.sessionDate));
}

export async function getUpcomingTrainingSessions(teamId?: number) {
  const db = (await getDb())!;
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  if (teamId) {
    return db.select().from(trainingSessions)
      .where(and(eq(trainingSessions.teamId, teamId), gte(trainingSessions.sessionDate, new Date(today))))
      .orderBy(trainingSessions.sessionDate);
  }
  return db.select().from(trainingSessions)
    .where(gte(trainingSessions.sessionDate, new Date(today)))
    .orderBy(trainingSessions.sessionDate);
}

export async function updateTrainingSession(id: number, data: Partial<InsertTrainingSession>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(trainingSessions).set(data).where(eq(trainingSessions.id, id));
}

// ==================== DEVELOPMENT PLAN FUNCTIONS ====================

export async function createDevelopmentPlan(plan: InsertDevelopmentPlan) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(developmentPlans).values(plan);
  return result[0].insertId;
}

export async function getPlayerDevelopmentPlans(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(developmentPlans)
    .where(eq(developmentPlans.playerId, playerId))
    .orderBy(desc(developmentPlans.startDate));
}

export async function getActiveDevelopmentPlan(playerId: number) {
  const db = (await getDb())!;
  if (!db) return undefined;
  const result = await db.select().from(developmentPlans)
    .where(and(eq(developmentPlans.playerId, playerId), eq(developmentPlans.status, 'active')))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== DEVELOPMENT GOAL FUNCTIONS ====================

export async function createDevelopmentGoal(goal: InsertDevelopmentGoal) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(developmentGoals).values(goal);
  return result[0].insertId;
}

export async function getPlanGoals(planId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(developmentGoals)
    .where(eq(developmentGoals.planId, planId))
    .orderBy(developmentGoals.category);
}

export async function updateDevelopmentGoal(id: number, data: Partial<InsertDevelopmentGoal>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(developmentGoals).set(data).where(eq(developmentGoals.id, id));
}

// ==================== ACHIEVEMENT FUNCTIONS ====================

export async function createAchievement(achievement: InsertAchievement) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(achievements).values(achievement);
  return result[0].insertId;
}

export async function getPlayerAchievements(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(achievements)
    .where(eq(achievements.playerId, playerId))
    .orderBy(desc(achievements.achievedDate));
}

// ==================== NOTIFICATION FUNCTIONS ====================

export async function createNotification(notification: InsertNotification) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(userId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
}

// ==================== COACH FEEDBACK FUNCTIONS ====================

export async function createCoachFeedback(feedback: InsertCoachFeedback) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coachFeedback).values(feedback);
  return result[0].insertId;
}

export async function getPlayerFeedback(playerId: number, limit = 10) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(coachFeedback)
    .where(eq(coachFeedback.playerId, playerId))
    .orderBy(desc(coachFeedback.feedbackDate))
    .limit(limit);
}

export async function getPlayerFeedbackForParent(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(coachFeedback)
    .where(and(eq(coachFeedback.playerId, playerId), eq(coachFeedback.isVisibleToParent, true)))
    .orderBy(desc(coachFeedback.feedbackDate));
}

// ==================== PARENT-PLAYER RELATION FUNCTIONS ====================

export async function linkParentToPlayer(parentUserId: number, playerId: number, relationship: string = 'guardian', isPrimary: boolean = false) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  // Validate relationship value
  const validRelationships = ['father', 'mother', 'guardian', 'other'];
  const rel = validRelationships.includes(relationship) ? relationship : 'guardian';
  
  await db.insert(parentPlayerRelations).values({
    parentUserId,
    playerId,
    relationship: rel as any,
    isPrimary
  });
}

export async function getParentPlayerRelations(parentUserId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(parentPlayerRelations)
    .where(eq(parentPlayerRelations.parentUserId, parentUserId));
}

// ==================== ANALYTICS FUNCTIONS ====================

export async function getAcademyStats() {
  const db = (await getDb())!;
  if (!db) return { totalPlayers: 0, totalTeams: 0, activeInjuries: 0, upcomingSessions: 0 };
  
  const [playerCount] = await db.select({ count: sql<number>`count(*)` }).from(players);
  const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(teams);
  const [injuryCount] = await db.select({ count: sql<number>`count(*)` }).from(injuries).where(eq(injuries.status, 'active'));
  const today = new Date().toISOString().split('T')[0];
  const [sessionCount] = await db.select({ count: sql<number>`count(*)` }).from(trainingSessions)
    .where(gte(trainingSessions.sessionDate, new Date(today)));
  
  return {
    totalPlayers: playerCount?.count || 0,
    totalTeams: teamCount?.count || 0,
    activeInjuries: injuryCount?.count || 0,
    upcomingSessions: sessionCount?.count || 0
  };
}

export async function getPlayerOverallStats(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const latestPerformance = await getLatestPerformanceMetric(playerId);
  const latestMental = await getLatestMentalAssessment(playerId);
  const activeInjuries = await db.select().from(injuries)
    .where(and(eq(injuries.playerId, playerId), eq(injuries.status, 'active')));
  const achievementCount = await db.select({ count: sql<number>`count(*)` }).from(achievements)
    .where(eq(achievements.playerId, playerId));
  
  return {
    technicalScore: latestPerformance?.technicalScore || 0,
    physicalScore: latestPerformance?.physicalScore || 0,
    tacticalScore: latestPerformance?.tacticalScore || 0,
    mentalScore: latestMental?.overallMentalScore || 0,
    overallScore: latestPerformance?.overallScore || 0,
    hasActiveInjury: activeInjuries.length > 0,
    achievementCount: achievementCount[0]?.count || 0
  };
}

// ==================== IDP (INDIVIDUAL DEVELOPMENT PLAN) FUNCTIONS ====================

export async function getAllIDPs() {
  const db = (await getDb())!;
  if (!db) return [];
  const idps = await db.select().from(developmentPlans)
    .orderBy(desc(developmentPlans.createdAt));
  
  // Fetch player info for each IDP
  const result = await Promise.all(idps.map(async (idp) => {
    const player = await getPlayerById(idp.playerId);
    return { ...idp, player };
  }));
  
  return result;
}

export async function getPlayerIDP(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(developmentPlans)
    .where(and(eq(developmentPlans.playerId, playerId), eq(developmentPlans.status, 'active')))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createIDP(data: {
  playerId: number;
  seasonYear: number;
  shortTermGoals?: string;
  longTermGoals?: string;
  technicalObjectives?: string;
  physicalObjectives?: string;
  mentalObjectives?: string;
  nutritionObjectives?: string;
  strengthsAnalysis?: string;
  areasForImprovement?: string;
  actionPlan?: string;
  reviewDate?: Date;
  createdBy: number;
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(developmentPlans).values({
    playerId: data.playerId,
    title: `IDP ${data.seasonYear}`,
    startDate: new Date(),
    endDate: data.reviewDate,
    status: 'active' as const,
    overallProgress: 0,
    shortTermGoals: data.shortTermGoals,
    longTermGoals: data.longTermGoals,
    technicalObjectives: data.technicalObjectives,
    physicalObjectives: data.physicalObjectives,
    mentalObjectives: data.mentalObjectives,
    nutritionObjectives: data.nutritionObjectives,
    strengthsAnalysis: data.strengthsAnalysis,
    areasForImprovement: data.areasForImprovement,
    actionPlan: data.actionPlan,
    createdBy: data.createdBy,
  });
  
  return result[0].insertId;
}

export async function updateIDP(id: number, data: Partial<{
  shortTermGoals: string;
  longTermGoals: string;
  technicalObjectives: string;
  physicalObjectives: string;
  mentalObjectives: string;
  nutritionObjectives: string;
  strengthsAnalysis: string;
  areasForImprovement: string;
  actionPlan: string;
  overallProgress: number;
  status: 'active' | 'completed' | 'archived';
  reviewDate: Date;
}>) {
  const db = (await getDb())!;
  if (!db) return;
  const { reviewDate, status, ...rest } = data;
  await db.update(developmentPlans).set({
    ...rest,
    ...(status && { status: status as 'active' | 'completed' | 'archived' }),
    ...(reviewDate && { endDate: reviewDate }),
  }).where(eq(developmentPlans.id, id));
}

export async function getIDPMilestones(idpId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(developmentGoals)
    .where(eq(developmentGoals.planId, idpId))
    .orderBy(developmentGoals.targetDate);
}

export async function createIDPMilestone(data: {
  idpId: number;
  title: string;
  description?: string;
  category: 'technical' | 'physical' | 'mental' | 'nutrition';
  targetDate?: Date;
  targetValue?: number;
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  // Map 'nutrition' to 'nutritional' for schema compatibility
  const categoryMap: Record<string, 'technical' | 'physical' | 'mental' | 'nutritional' | 'tactical'> = {
    'technical': 'technical',
    'physical': 'physical',
    'mental': 'mental',
    'nutrition': 'nutritional',
  };
  
  const result = await db.insert(developmentGoals).values({
    planId: data.idpId,
    title: data.title,
    description: data.description,
    category: categoryMap[data.category] || 'technical',
    targetDate: data.targetDate,
    targetValue: data.targetValue,
    currentValue: 0,
    isCompleted: false,
  });
  
  return result[0].insertId;
}

export async function updateIDPMilestone(id: number, data: Partial<{
  isCompleted: boolean;
  currentValue: number;
  completedDate: Date;
}>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(developmentGoals).set(data).where(eq(developmentGoals.id, id));
}


// ==================== MATCH FUNCTIONS ====================

export async function createMatch(match: InsertMatch) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(matches).values(match);
  return result[0].insertId;
}

export async function getMatchById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return match;
}

export async function getMatchesByTeam(teamId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matches).where(eq(matches.teamId, teamId)).orderBy(desc(matches.matchDate));
}

export async function getAllMatches() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matches).orderBy(desc(matches.matchDate));
}

export async function getUpcomingMatches(limit = 5) {
  const db = (await getDb())!;
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  const result = await db
    .select({
      id: matches.id,
      matchDate: matches.matchDate,
      opponent: matches.opponent,
      matchType: matches.matchType,
      venue: matches.venue,
      isHome: matches.isHome,
      teamId: matches.teamId,
    })
    .from(matches)
    .where(and(gte(matches.matchDate, new Date(today)), isNull(matches.result)))
    .orderBy(asc(matches.matchDate))
    .limit(limit);
  // Attach team name
  const withTeam = await Promise.all(result.map(async (m) => {
    if (!m.teamId) return { ...m, teamName: 'Unknown' };
    const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, m.teamId));
    return { ...m, teamName: team?.name || 'Unknown' };
  }));
  return withTeam;
}

export async function updateMatch(id: number, data: Partial<InsertMatch>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(matches).set(data).where(eq(matches.id, id));
}

// ==================== PLAYER MATCH STATS ====================

export async function createPlayerMatchStats(stats: InsertPlayerMatchStat) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(playerMatchStats).values(stats);
  return result[0].insertId;
}

export async function getPlayerMatchStats(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerMatchStats).where(eq(playerMatchStats.playerId, playerId));
}

export async function getMatchStats(matchId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerMatchStats).where(eq(playerMatchStats.matchId, matchId));
}

export async function getPlayerMatchHistory(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  // Join match stats with match info
  const stats = await db
    .select()
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));
  
  const matchIds = stats.map(s => s.matchId);
  if (matchIds.length === 0) return [];
  
  const matchList = await db.select().from(matches).where(inArray(matches.id, matchIds));
  
  return stats.map(stat => ({
    ...stat,
    match: matchList.find(m => m.id === stat.matchId)
  }));
}

// ==================== PLAYER SKILL SCORES (SCORECARD) ====================

export async function createSkillScore(score: InsertPlayerSkillScore) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(playerSkillScores).values(score);
  return result[0].insertId;
}

export async function getLatestSkillScore(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [score] = await db
    .select()
    .from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.assessmentDate))
    .limit(1);
  return score;
}

export async function getSkillScoreHistory(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.assessmentDate));
}

export async function updateSkillScore(id: number, data: Partial<InsertPlayerSkillScore>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(playerSkillScores).set(data).where(eq(playerSkillScores.id, id));
}

// ==================== AI TRAINING RECOMMENDATIONS ====================

export async function createAIRecommendation(rec: InsertAITrainingRecommendation) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(aiTrainingRecommendations).values(rec);
  return result[0].insertId;
}

export async function getLatestAIRecommendation(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [rec] = await db
    .select()
    .from(aiTrainingRecommendations)
    .where(eq(aiTrainingRecommendations.playerId, playerId))
    .orderBy(desc(aiTrainingRecommendations.generatedDate))
    .limit(1);
  return rec;
}

export async function getAIRecommendations(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(aiTrainingRecommendations)
    .where(eq(aiTrainingRecommendations.playerId, playerId))
    .orderBy(desc(aiTrainingRecommendations.generatedDate));
}

export async function updateAIRecommendation(id: number, data: Partial<InsertAITrainingRecommendation>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(aiTrainingRecommendations).set(data).where(eq(aiTrainingRecommendations.id, id));
}

// ==================== VIDEO ANALYSIS ====================

export async function createVideoAnalysis(video: InsertVideoAnalysis) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(videoAnalysis).values(video);
  if (!result || !result[0] || !result[0].insertId) {
    throw new Error('Failed to create video analysis');
  }
  return result[0].insertId;
}

export async function getVideosByPlayer(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(videoAnalysis)
    .where(eq(videoAnalysis.playerId, playerId))
    .orderBy(desc(videoAnalysis.createdAt));
}

export async function getVideosByMatch(matchId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(videoAnalysis)
    .where(eq(videoAnalysis.matchId, matchId));
}

export async function getAllVideos() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(videoAnalysis).orderBy(desc(videoAnalysis.createdAt));
}


// Get parents for a specific player
export async function getParentsForPlayer(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(parentPlayerRelations)
    .where(eq(parentPlayerRelations.playerId, playerId));
}

// ==================== LEAGUE STANDINGS ====================

export async function getLeagueStandings(season: string, leagueName: string) {
  const db = (await getDb())!;
  if (!db) return [];
  
  const result = await db
    .select({
      id: leagueStandings.id,
      teamId: leagueStandings.teamId,
      teamName: teams.name,
      season: leagueStandings.season,
      leagueName: leagueStandings.leagueName,
      played: leagueStandings.played,
      won: leagueStandings.won,
      drawn: leagueStandings.drawn,
      lost: leagueStandings.lost,
      goalsFor: leagueStandings.goalsFor,
      goalsAgainst: leagueStandings.goalsAgainst,
      goalDifference: leagueStandings.goalDifference,
      points: leagueStandings.points,
      position: leagueStandings.position,
      form: leagueStandings.form,
    })
    .from(leagueStandings)
    .leftJoin(teams, eq(leagueStandings.teamId, teams.id))
    .where(and(
      eq(leagueStandings.season, season),
      eq(leagueStandings.leagueName, leagueName)
    ))
    .orderBy(desc(leagueStandings.points), desc(leagueStandings.goalDifference));
  
  return result;
}

export async function upsertLeagueStanding(data: {
  teamId: number;
  season: string;
  leagueName: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points?: number;
  position?: number;
  form?: string;
}) {
  const db = (await getDb())!;
  if (!db) return null;
  
  await db.insert(leagueStandings).values(data).onDuplicateKeyUpdate({
    set: {
      played: data.played,
      won: data.won,
      drawn: data.drawn,
      lost: data.lost,
      goalsFor: data.goalsFor,
      goalsAgainst: data.goalsAgainst,
      goalDifference: data.goalDifference,
      points: data.points,
      position: data.position,
      form: data.form,
    }
  });
  
  return data;
}

// ==================== MAN OF THE MATCH ====================

export async function getManOfTheMatch(matchId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const result = await db
    .select({
      id: manOfTheMatch.id,
      matchId: manOfTheMatch.matchId,
      playerId: manOfTheMatch.playerId,
      playerName: sql<string>`CONCAT(${players.firstName}, ' ', ${players.lastName})`,
      rating: manOfTheMatch.rating,
      reason: manOfTheMatch.reason,
      createdAt: manOfTheMatch.createdAt,
    })
    .from(manOfTheMatch)
    .leftJoin(players, eq(manOfTheMatch.playerId, players.id))
    .where(eq(manOfTheMatch.matchId, matchId))
    .limit(1);
  
  return result[0] || null;
}

export async function setManOfTheMatch(data: {
  matchId: number;
  playerId: number;
  rating?: number;
  reason?: string;
  selectedBy?: number;
}) {
  const db = (await getDb())!;
  if (!db) return null;
  
  // Delete existing MOTM for this match
  await db.delete(manOfTheMatch).where(eq(manOfTheMatch.matchId, data.matchId));
  
  // Insert new MOTM
  const [result] = await db.insert(manOfTheMatch).values(data).$returningId();
  return result;
}


// ==================== REGISTRATION REQUESTS ====================

export async function createRegistrationRequest(data: InsertRegistrationRequest) {
  const db = (await getDb())!;
  if (!db) return;
  const result = await db.insert(registrationRequests).values(data);
  return result[0].insertId;
}

export async function getAllRegistrationRequests() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(registrationRequests).orderBy(desc(registrationRequests.createdAt));
}

export async function updateRegistrationStatus(id: number, status: string, notes?: string) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(registrationRequests)
    .set({ status: status as any, notes })
    .where(eq(registrationRequests.id, id));
}

// ==================== CONTACT INQUIRIES ====================

export async function createContactInquiry(data: InsertContactInquiry) {
  const db = (await getDb())!;
  if (!db) return;
  const result = await db.insert(contactInquiries).values(data);
  return result[0].insertId;
}

export async function getAllContactInquiries() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt));
}

export async function updateContactInquiryStatus(id: number, status: string) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(contactInquiries)
    .set({ status: status as any, repliedAt: status === 'replied' ? new Date() : undefined })
    .where(eq(contactInquiries.id, id));
}

// ==================== GPS TRACKER DATA ====================

export async function createGpsTrackerData(data: InsertGpsTrackerData) {
  const db = (await getDb())!;
  if (!db) return;
  const result = await db.insert(gpsTrackerData).values(data);
  return result[0].insertId;
}

export async function getPlayerGpsData(playerId: number, limit = 50) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(gpsTrackerData)
    .where(eq(gpsTrackerData.playerId, playerId))
    .orderBy(desc(gpsTrackerData.recordedAt))
    .limit(limit);
}

export async function getSessionGpsData(sessionId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(gpsTrackerData)
    .where(eq(gpsTrackerData.sessionId, sessionId));
}

export async function getMatchGpsData(matchId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(gpsTrackerData)
    .where(eq(gpsTrackerData.matchId, matchId));
}


// ==================== ACADEMY EVENTS ====================

export async function createAcademyEvent(data: InsertAcademyEvent) {
  const db = (await getDb())!;
  if (!db) return;
  const result = await db.insert(academyEvents).values(data);
  return result[0].insertId;
}

export async function getAllAcademyEvents() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(academyEvents).orderBy(desc(academyEvents.startDate));
}

export async function getUpcomingEvents(limit = 10) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(academyEvents)
    .where(and(
      gte(academyEvents.startDate, new Date()),
      eq(academyEvents.isPublic, true)
    ))
    .orderBy(academyEvents.startDate)
    .limit(limit);
}

export async function getPublicEvents() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(academyEvents)
    .where(eq(academyEvents.isPublic, true))
    .orderBy(academyEvents.startDate);
}

export async function getEventById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(academyEvents).where(eq(academyEvents.id, id));
  return result[0] || null;
}

export async function updateAcademyEvent(id: number, data: Partial<InsertAcademyEvent>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(academyEvents).set(data).where(eq(academyEvents.id, id));
}

export async function deleteAcademyEvent(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(academyEvents).where(eq(academyEvents.id, id));
}

// ==================== COACH PROFILES ====================

export async function createCoachProfile(data: InsertCoachProfile) {
  const db = (await getDb())!;
  if (!db) return;
  const result = await db.insert(coachProfiles).values(data);
  return result[0].insertId;
}

export async function getPublicCoachProfiles() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select({
    profile: coachProfiles,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl
    }
  })
    .from(coachProfiles)
    .leftJoin(users, eq(coachProfiles.userId, users.id))
    .where(eq(coachProfiles.isPublic, true));
}

export async function getAllCoachProfiles() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select({
    profile: coachProfiles,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl
    }
  })
    .from(coachProfiles)
    .leftJoin(users, eq(coachProfiles.userId, users.id));
}

export async function getCoachProfileByUserId(userId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(coachProfiles).where(eq(coachProfiles.userId, userId));
  return result[0] || null;
}

export async function updateCoachProfile(id: number, data: Partial<InsertCoachProfile>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(coachProfiles).set(data).where(eq(coachProfiles.id, id));
}


// ==================== EVENT REGISTRATIONS ====================

export async function createEventRegistration(data: InsertEventRegistration) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(eventRegistrations).values(data);
  
  // Update participant count
  await db.update(academyEvents)
    .set({ currentParticipants: sql`${academyEvents.currentParticipants} + 1` })
    .where(eq(academyEvents.id, data.eventId));
  
  return result[0].insertId;
}

export async function getEventRegistrations(eventId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
}

export async function getUserEventRegistrations(userId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(eventRegistrations).where(eq(eventRegistrations.userId, userId));
}

export async function updateEventRegistration(id: number, data: Partial<InsertEventRegistration>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(eventRegistrations).set(data).where(eq(eventRegistrations.id, id));
}

export async function cancelEventRegistration(id: number, eventId: number) {
  const db = (await getDb())!;
  if (!db) return;
  
  await db.update(eventRegistrations)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(eventRegistrations.id, id));
  
  // Decrease participant count
  await db.update(academyEvents)
    .set({ currentParticipants: sql`GREATEST(${academyEvents.currentParticipants} - 1, 0)` })
    .where(eq(academyEvents.id, eventId));
}

// ==================== COACH AVAILABILITY ====================

export async function getCoachAvailability(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(coachAvailability).where(eq(coachAvailability.coachId, coachId));
}

export async function getAllCoachAvailability() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(coachAvailability).where(eq(coachAvailability.isAvailable, true));
}

export async function setCoachAvailability(data: InsertCoachAvailability) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(coachAvailability).values(data);
  return result[0].insertId;
}

export async function updateCoachAvailability(id: number, data: Partial<InsertCoachAvailability>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(coachAvailability).set(data).where(eq(coachAvailability.id, id));
}

export async function deleteCoachAvailability(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(coachAvailability).where(eq(coachAvailability.id, id));
}

// ==================== MEMBERSHIP PLANS ====================

export async function getMembershipPlans() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(membershipPlans)
    .where(eq(membershipPlans.isActive, true))
    .orderBy(membershipPlans.sortOrder);
}

export async function getMembershipPlanById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id)).limit(1);
  return plan;
}

export async function createMembershipPlan(data: InsertMembershipPlan) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(membershipPlans).values(data);
  return result[0].insertId;
}

export async function updateMembershipPlan(id: number, data: Partial<InsertMembershipPlan>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(membershipPlans).set(data).where(eq(membershipPlans.id, id));
}


// ==================== ATTENDANCE HELPERS ====================

export async function recordAttendance(data: InsertAttendance) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(attendance).values(data);
  return result;
}

export async function getPlayerAttendance(playerId: number, limit = 50) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(attendance).where(eq(attendance.playerId, playerId)).orderBy(desc(attendance.sessionDate)).limit(limit);
}

export async function getSessionAttendance(sessionId: number, sessionType: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(attendance).where(and(eq(attendance.sessionId, sessionId), eq(attendance.sessionType, sessionType as any)));
}

export async function getPlayerAttendanceRate(playerId: number) {
  const db = (await getDb())!;
  if (!db) return { total: 0, present: 0, rate: 0 };
  const records = await db.select().from(attendance).where(eq(attendance.playerId, playerId));
  const total = records.length;
  const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
  return { total, present, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
}

export async function updateAttendance(id: number, data: Partial<InsertAttendance>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(attendance).set(data).where(eq(attendance.id, id));
}

// ==================== PLAYER POINTS HELPERS ====================

export async function getPlayerPoints(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(playerPoints).where(eq(playerPoints.playerId, playerId)).limit(1);
  return result[0] || null;
}

export async function initializePlayerPoints(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  await db.insert(playerPoints).values({ playerId, points: 0, totalEarned: 0, totalRedeemed: 0, level: 1 });
}

export async function awardPoints(playerId: number, amount: number, type: string, description: string, awardedBy?: number, referenceId?: number, referenceType?: string) {
  const db = (await getDb())!;
  if (!db) return null;
  
  // Record transaction
  await db.insert(pointsTransactions).values({
    playerId,
    amount,
    type: type as any,
    description,
    awardedBy,
    referenceId,
    referenceType
  });
  
  // Update player points
  const current = await getPlayerPoints(playerId);
  if (current) {
    const newPoints = current.points + amount;
    const newTotalEarned = current.totalEarned + amount;
    const newLevel = Math.floor(newTotalEarned / 1000) + 1;
    await db.update(playerPoints).set({ 
      points: newPoints, 
      totalEarned: newTotalEarned,
      level: newLevel
    }).where(eq(playerPoints.playerId, playerId));
  } else {
    await db.insert(playerPoints).values({ 
      playerId, 
      points: amount, 
      totalEarned: amount, 
      totalRedeemed: 0, 
      level: 1 
    });
  }
}

export async function getPointsTransactions(playerId: number, limit = 50) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(pointsTransactions).where(eq(pointsTransactions.playerId, playerId)).orderBy(desc(pointsTransactions.createdAt)).limit(limit);
}

export async function getPointsLeaderboard(limit = 20) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerPoints).orderBy(desc(playerPoints.totalEarned)).limit(limit);
}

// ==================== REWARDS HELPERS ====================

export async function getAllRewards() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(rewards).where(eq(rewards.isActive, true)).orderBy(rewards.pointsCost);
}

export async function getRewardById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
  return result[0] || null;
}

export async function createReward(data: InsertReward) {
  const db = (await getDb())!;
  if (!db) return null;
  return db.insert(rewards).values(data);
}

export async function redeemReward(playerId: number, rewardId: number) {
  const db = (await getDb())!;
  if (!db) return { success: false, message: 'Database unavailable' };
  
  const reward = await getRewardById(rewardId);
  if (!reward) return { success: false, message: 'Reward not found' };
  
  const playerPts = await getPlayerPoints(playerId);
  if (!playerPts || playerPts.points < reward.pointsCost) {
    return { success: false, message: 'Insufficient points' };
  }
  
  // Deduct points
  await db.update(playerPoints).set({ 
    points: playerPts.points - reward.pointsCost,
    totalRedeemed: playerPts.totalRedeemed + reward.pointsCost
  }).where(eq(playerPoints.playerId, playerId));
  
  // Record transaction
  await db.insert(pointsTransactions).values({
    playerId,
    amount: -reward.pointsCost,
    type: 'redemption',
    description: `Redeemed: ${reward.name}`,
    referenceId: rewardId,
    referenceType: 'reward'
  });
  
  // Create redemption record
  await db.insert(rewardRedemptions).values({
    playerId,
    rewardId,
    pointsSpent: reward.pointsCost,
    status: 'pending'
  });
  
  // Update stock if limited
  if (reward.stock !== null && reward.stock > 0) {
    await db.update(rewards).set({ stock: reward.stock - 1 }).where(eq(rewards.id, rewardId));
  }
  
  return { success: true, message: 'Reward redeemed successfully' };
}

export async function getPlayerRedemptions(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(rewardRedemptions).where(eq(rewardRedemptions.playerId, playerId)).orderBy(desc(rewardRedemptions.redeemedAt));
}

// ==================== PLAYER ACTIVITIES HELPERS ====================

export async function createPlayerActivity(data: InsertPlayerActivity) {
  const db = (await getDb())!;
  if (!db) return null;
  return db.insert(playerActivities).values(data);
}

export async function getPlayerActivities(playerId: number, limit = 50) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerActivities).where(eq(playerActivities.playerId, playerId)).orderBy(desc(playerActivities.activityDate)).limit(limit);
}

export async function getPlayerActivitiesByMonth(playerId: number, year: number, month: number) {
  const db = (await getDb())!;
  if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return db.select().from(playerActivities)
    .where(and(
      eq(playerActivities.playerId, playerId),
      gte(playerActivities.activityDate, startDate),
      lte(playerActivities.activityDate, endDate)
    ))
    .orderBy(desc(playerActivities.activityDate));
}

// ==================== WEEKLY TARGETS HELPERS ====================

export async function getPlayerWeeklyTargets(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(weeklyTargets)
    .where(eq(weeklyTargets.playerId, playerId))
    .orderBy(desc(weeklyTargets.weekStartDate))
    .limit(10);
}

export async function setWeeklyTarget(data: InsertWeeklyTarget) {
  const db = (await getDb())!;
  if (!db) return null;
  return db.insert(weeklyTargets).values(data);
}

export async function updateWeeklyTargetProgress(id: number, currentValue: number) {
  const db = (await getDb())!;
  if (!db) return;
  const target = await db.select().from(weeklyTargets).where(eq(weeklyTargets.id, id)).limit(1);
  if (target[0]) {
    const isCompleted = currentValue >= target[0].targetValue;
    await db.update(weeklyTargets).set({ currentValue, isCompleted }).where(eq(weeklyTargets.id, id));
  }
}

// ==================== AI VIDEO ANALYSIS HELPERS ====================

export async function createAIVideoAnalysis(data: InsertAIVideoAnalysis) {
  const db = (await getDb())!;
  if (!db) return null;
  return db.insert(aiVideoAnalysis).values(data);
}

export async function getPlayerAIVideoAnalysis(playerId: number, limit = 20) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(aiVideoAnalysis).where(eq(aiVideoAnalysis.playerId, playerId)).orderBy(desc(aiVideoAnalysis.createdAt)).limit(limit);
}

export async function updateAIVideoAnalysis(id: number, data: Partial<InsertAIVideoAnalysis>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(aiVideoAnalysis).set(data).where(eq(aiVideoAnalysis.id, id));
}

// ==================== MASTERCLASS CONTENT HELPERS ====================

export async function getAllMasterclassContent() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(masterclassContent).where(eq(masterclassContent.isPublished, true)).orderBy(masterclassContent.category, masterclassContent.partNumber);
}

export async function getMasterclassByCategory(category: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(masterclassContent)
    .where(and(eq(masterclassContent.isPublished, true), eq(masterclassContent.category, category as any)))
    .orderBy(masterclassContent.partNumber);
}

export async function getMasterclassForPosition(position: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(masterclassContent)
    .where(and(
      eq(masterclassContent.isPublished, true),
      or(eq(masterclassContent.position, position as any), eq(masterclassContent.position, 'all'))
    ))
    .orderBy(masterclassContent.category, masterclassContent.partNumber);
}

export async function incrementMasterclassViews(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  const content = await db.select().from(masterclassContent).where(eq(masterclassContent.id, id)).limit(1);
  if (content[0]) {
    await db.update(masterclassContent).set({ viewCount: (content[0].viewCount || 0) + 1 }).where(eq(masterclassContent.id, id));
  }
}


// ==================== AI VIDEO ANALYSIS ====================

export async function saveVideoAnalysis(data: {
  title: string;
  videoUrl: string;
  playerName?: string;
  teamColor?: string;
  videoType: string;
  fileSizeMb?: number;
  duration?: number;
  overallScore?: number;
  movementAnalysis?: string;
  technicalAnalysis?: string;
  tacticalAnalysis?: string;
  strengths?: string;
  improvements?: string;
  drillRecommendations?: string;
  coachNotes?: string;
  heatmapZones?: string;
  playerId?: number;
  uploadedBy: number;
  analysisStatus: string;
}) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(videoAnalysis).values({
    title: data.title,
    videoUrl: data.videoUrl,
    playerName: data.playerName,
    teamColor: data.teamColor,
    videoType: data.videoType as 'match_highlight' | 'training_clip' | 'skill_demo' | 'analysis' | 'full_match',
    fileSizeMb: data.fileSizeMb,
    duration: data.duration,
    overallScore: data.overallScore,
    movementAnalysis: data.movementAnalysis,
    technicalAnalysis: data.technicalAnalysis,
    tacticalAnalysis: data.tacticalAnalysis,
    strengths: data.strengths,
    improvements: data.improvements,
    drillRecommendations: data.drillRecommendations,
    coachNotes: data.coachNotes,
    heatmapZones: data.heatmapZones,
    playerId: data.playerId,
    uploadedBy: data.uploadedBy,
    analysisStatus: data.analysisStatus as 'pending' | 'processing' | 'completed' | 'failed',
  });
  return result[0].insertId;
}

export async function getVideoAnalysisHistory(userId: number, limit?: number) {
  const db = (await getDb())!;
  if (!db) return [];
  let query = db
    .select()
    .from(videoAnalysis)
    .where(eq(videoAnalysis.uploadedBy, userId))
    .orderBy(desc(videoAnalysis.createdAt));
  
  if (limit) {
    query = query.limit(limit) as typeof query;
  }
  
  return query;
}

export async function getVideoAnalysisById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db
    .select()
    .from(videoAnalysis)
    .where(eq(videoAnalysis.id, id))
    .limit(1);
  return result[0] || null;
}


// ==================== DRILL ASSIGNMENTS ====================

export async function createDrillAssignment(data: InsertDrillAssignment) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(drillAssignments).values(data);
  return result[0].insertId;
}

export async function getPlayerDrillAssignments(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(drillAssignments)
    .where(eq(drillAssignments.playerId, playerId))
    .orderBy(desc(drillAssignments.createdAt));
}

export async function getCoachDrillAssignments(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(drillAssignments)
    .where(eq(drillAssignments.assignedBy, coachId))
    .orderBy(desc(drillAssignments.createdAt));
}

export async function updateDrillAssignmentStatus(
  id: number, 
  status: 'pending' | 'in_progress' | 'completed' | 'skipped',
  playerNotes?: string
) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const updateData: Partial<DrillAssignment> = { status };
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  if (playerNotes) {
    updateData.playerNotes = playerNotes;
  }
  
  await db
    .update(drillAssignments)
    .set(updateData)
    .where(eq(drillAssignments.id, id));
  
  return id;
}

export async function addCoachFeedbackToAssignment(id: number, feedback: string) {
  const db = (await getDb())!;
  if (!db) return null;
  
  await db
    .update(drillAssignments)
    .set({ coachFeedback: feedback })
    .where(eq(drillAssignments.id, id));
  
  return id;
}

export async function getDrillAssignmentById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db
    .select()
    .from(drillAssignments)
    .where(eq(drillAssignments.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getPendingAssignmentsForPlayer(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(drillAssignments)
    .where(and(
      eq(drillAssignments.playerId, playerId),
      eq(drillAssignments.status, 'pending')
    ))
    .orderBy(drillAssignments.dueDate);
}

export async function getAllDrillAssignments() {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(drillAssignments)
    .orderBy(desc(drillAssignments.createdAt));
}


// ==================== TRAINING VIDEOS ====================

export async function createTrainingVideo(data: InsertTrainingVideo) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(trainingVideos).values(data);
  return result[0].insertId;
}

export async function getPublishedTrainingVideos(category?: string) {
  const db = (await getDb())!;
  if (!db) return [];
  
  if (category && category !== 'all') {
    return db
      .select()
      .from(trainingVideos)
      .where(and(
        eq(trainingVideos.isPublished, true),
        eq(trainingVideos.category, category)
      ))
      .orderBy(desc(trainingVideos.createdAt));
  }
  
  return db
    .select()
    .from(trainingVideos)
    .where(eq(trainingVideos.isPublished, true))
    .orderBy(desc(trainingVideos.createdAt));
}

export async function getAllTrainingVideos() {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(trainingVideos)
    .orderBy(desc(trainingVideos.createdAt));
}

export async function getTrainingVideoById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db
    .select()
    .from(trainingVideos)
    .where(eq(trainingVideos.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateTrainingVideo(id: number, data: Partial<InsertTrainingVideo>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(trainingVideos).set(data).where(eq(trainingVideos.id, id));
}

export async function deleteTrainingVideo(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(trainingVideos).where(eq(trainingVideos.id, id));
}

export async function incrementVideoViewCount(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  const video = await getTrainingVideoById(id);
  if (video) {
    await db.update(trainingVideos)
      .set({ viewCount: (video.viewCount || 0) + 1 })
      .where(eq(trainingVideos.id, id));
  }
}

export async function getTrainingVideosByUploader(userId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(trainingVideos)
    .where(eq(trainingVideos.uploadedBy, userId))
    .orderBy(desc(trainingVideos.createdAt));
}


// ==================== TRAINING LOCATIONS ====================

export async function createTrainingLocation(data: InsertTrainingLocation) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(trainingLocations).values(data);
  return result[0].insertId;
}

export async function getActiveTrainingLocations() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(trainingLocations).where(eq(trainingLocations.isActive, true));
}

export async function getAllTrainingLocations() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(trainingLocations);
}

export async function updateTrainingLocation(id: number, data: Partial<InsertTrainingLocation>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(trainingLocations).set(data).where(eq(trainingLocations.id, id));
}

// ==================== COACH REVIEWS ====================

export async function createCoachReview(data: InsertCoachReview) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(coachReviews).values(data);
  return result[0].insertId;
}

export async function getCoachReviews(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(coachReviews)
    .where(and(eq(coachReviews.coachId, coachId), eq(coachReviews.isApproved, true)))
    .orderBy(desc(coachReviews.createdAt));
}

export async function getCoachAverageRating(coachId: number) {
  const db = (await getDb())!;
  if (!db) return { average: 0, count: 0 };
  const reviews = await db
    .select()
    .from(coachReviews)
    .where(and(eq(coachReviews.coachId, coachId), eq(coachReviews.isApproved, true)));
  
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: total / reviews.length, count: reviews.length };
}

// ==================== COACH SCHEDULE SLOTS ====================

export async function createCoachScheduleSlot(data: InsertCoachScheduleSlot) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(coachScheduleSlots).values(data);
  return result[0].insertId;
}

export async function getCoachScheduleSlots(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(coachScheduleSlots)
    .where(eq(coachScheduleSlots.coachId, coachId))
    .orderBy(coachScheduleSlots.dayOfWeek, coachScheduleSlots.startTime);
}

export async function getAvailableCoachSlots(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(coachScheduleSlots)
    .where(and(
      eq(coachScheduleSlots.coachId, coachId),
      eq(coachScheduleSlots.isAvailable, true)
    ))
    .orderBy(coachScheduleSlots.dayOfWeek, coachScheduleSlots.startTime);
}

export async function updateCoachScheduleSlot(id: number, data: Partial<InsertCoachScheduleSlot>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(coachScheduleSlots).set(data).where(eq(coachScheduleSlots.id, id));
}

export async function deleteCoachScheduleSlot(id: number) {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(coachScheduleSlots).where(eq(coachScheduleSlots.id, id));
}

// ==================== PRIVATE TRAINING BOOKINGS ====================

export async function createPrivateTrainingBooking(data: InsertPrivateTrainingBooking) {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.insert(privateTrainingBookings).values(data);
  return result[0].insertId;
}

export async function getPrivateTrainingBookingById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const [booking] = await db
    .select({
      id: privateTrainingBookings.id,
      playerId: privateTrainingBookings.playerId,
      playerName: sql<string>`CONCAT(${players.firstName}, ' ', ${players.lastName})`,
      coachId: privateTrainingBookings.coachId,
      coachName: users.name,
      sessionDate: privateTrainingBookings.sessionDate,
      startTime: privateTrainingBookings.startTime,
      endTime: privateTrainingBookings.endTime,
      locationId: privateTrainingBookings.locationId,
      locationName: trainingLocations.name,
      totalPrice: privateTrainingBookings.totalPrice,
      status: privateTrainingBookings.status,
      bookedBy: privateTrainingBookings.bookedBy,
      parentName: sql<string>`(SELECT name FROM users WHERE id = ${privateTrainingBookings.bookedBy})`,
    })
    .from(privateTrainingBookings)
    .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
    .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
    .leftJoin(trainingLocations, eq(privateTrainingBookings.locationId, trainingLocations.id))
    .where(eq(privateTrainingBookings.id, id));
  
  return booking || null;
}

export async function getPlayerPrivateTrainingBookings(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(privateTrainingBookings)
    .where(eq(privateTrainingBookings.playerId, playerId))
    .orderBy(desc(privateTrainingBookings.sessionDate));
}

export async function getCoachPrivateTrainingBookings(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(privateTrainingBookings)
    .where(eq(privateTrainingBookings.coachId, coachId))
    .orderBy(desc(privateTrainingBookings.sessionDate));
}

export async function getBookingsByDate(date: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(privateTrainingBookings)
    .where(eq(privateTrainingBookings.sessionDate, new Date(date)));
}

export async function checkBookingConflict(
  locationId: number,
  sessionDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: number
) {
  const db = (await getDb())!;
  if (!db) return false;
  
  // Get all bookings for this location and date
  let query = db
    .select()
    .from(privateTrainingBookings)
    .where(and(
      eq(privateTrainingBookings.locationId, locationId),
      eq(privateTrainingBookings.sessionDate, new Date(sessionDate)),
      eq(privateTrainingBookings.status, 'confirmed')
    ));
  
  const bookings = await query;
  
  // Check for time overlap
  for (const booking of bookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue;
    
    // Check if times overlap
    const existingStart = booking.startTime;
    const existingEnd = booking.endTime;
    
    // Overlap exists if: new start < existing end AND new end > existing start
    if (startTime < existingEnd && endTime > existingStart) {
      return true; // Conflict found
    }
  }
  
  return false; // No conflict
}

export async function updatePrivateTrainingBooking(id: number, data: Partial<InsertPrivateTrainingBooking>) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(privateTrainingBookings).set(data).where(eq(privateTrainingBookings.id, id));
}

export async function cancelPrivateTrainingBooking(id: number, reason?: string) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(privateTrainingBookings).set({
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelReason: reason,
  }).where(eq(privateTrainingBookings.id, id));
}

export async function getAllPrivateTrainingBookings() {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(privateTrainingBookings)
    .orderBy(desc(privateTrainingBookings.sessionDate));
}

export async function getUpcomingBookingsForLocation(locationId: number, fromDate: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select()
    .from(privateTrainingBookings)
    .where(and(
      eq(privateTrainingBookings.locationId, locationId),
      eq(privateTrainingBookings.status, 'confirmed')
    ))
    .orderBy(privateTrainingBookings.sessionDate, privateTrainingBookings.startTime);
}

// Get coaches with their profiles and average ratings
export async function getCoachesWithRatings() {
  const db = (await getDb())!;
  if (!db) return [];
  
  // Get all coach profiles with user info
  const coaches = await db
    .select({
      id: coachProfiles.id,
      userId: coachProfiles.userId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      specialization: coachProfiles.specialization,
      experience: coachProfiles.experience,
      bio: coachProfiles.bio,
      qualifications: coachProfiles.qualifications,
      isPublic: coachProfiles.isPublic,
      photoUrl: coachProfiles.photoUrl,
    })
    .from(coachProfiles)
    .innerJoin(users, eq(coachProfiles.userId, users.id))
    .where(eq(coachProfiles.isPublic, true));
  
  // Get ratings for each coach
  const coachesWithRatings = await Promise.all(
    coaches.map(async (coach) => {
      const rating = await getCoachAverageRating(coach.userId);
      const slots = await getAvailableCoachSlots(coach.userId);
      return {
        ...coach,
        averageRating: rating.average,
        reviewCount: rating.count,
        availableSlots: slots.length,
      };
    })
  );
  
  return coachesWithRatings;
}


// Get bookings for a coach with player and parent info
export async function getCoachBookings(coachId: number, status?: string) {
  const db = (await getDb())!;
  if (!db) return [];
  
  let query = db
    .select({
      id: privateTrainingBookings.id,
      playerId: privateTrainingBookings.playerId,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      sessionDate: privateTrainingBookings.sessionDate,
      startTime: privateTrainingBookings.startTime,
      endTime: privateTrainingBookings.endTime,
      status: privateTrainingBookings.status,
      totalPrice: privateTrainingBookings.totalPrice,
      notes: privateTrainingBookings.notes,
      locationId: privateTrainingBookings.locationId,
      locationName: trainingLocations.name,
      createdAt: privateTrainingBookings.createdAt,
      completedAt: privateTrainingBookings.completedAt,
      hasReview: privateTrainingBookings.hasReview,
    })
    .from(privateTrainingBookings)
    .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
    .leftJoin(trainingLocations, eq(privateTrainingBookings.locationId, trainingLocations.id))
    .where(eq(privateTrainingBookings.coachId, coachId))
    .orderBy(desc(privateTrainingBookings.sessionDate));
  
  const results = await query;
  
  if (status) {
    return results.filter(b => b.status === status);
  }
  return results;
}

// Get bookings for a parent (bookings they made)
export async function getParentBookings(parentId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  // Get all bookings made by this parent
  const bookings = await db
    .select({
      id: privateTrainingBookings.id,
      playerId: privateTrainingBookings.playerId,
      coachId: privateTrainingBookings.coachId,
      coachName: users.name,
      sessionDate: privateTrainingBookings.sessionDate,
      startTime: privateTrainingBookings.startTime,
      endTime: privateTrainingBookings.endTime,
      status: privateTrainingBookings.status,
      totalPrice: privateTrainingBookings.totalPrice,
      notes: privateTrainingBookings.notes,
      locationId: privateTrainingBookings.locationId,
      locationName: trainingLocations.name,
      createdAt: privateTrainingBookings.createdAt,
      completedAt: privateTrainingBookings.completedAt,
      hasReview: privateTrainingBookings.hasReview,
    })
    .from(privateTrainingBookings)
    .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
    .leftJoin(trainingLocations, eq(privateTrainingBookings.locationId, trainingLocations.id))
    .where(eq(privateTrainingBookings.bookedBy, parentId))
    .orderBy(desc(privateTrainingBookings.sessionDate));
  
  return bookings;
}

// Complete a booking (coach marks session as done)
export async function completeBooking(bookingId: number) {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(privateTrainingBookings).set({
    status: 'completed',
    completedAt: new Date(),
  }).where(eq(privateTrainingBookings.id, bookingId));
}

// Submit a review for a completed booking
export async function submitBookingReview(
  bookingId: number,
  reviewerId: number,
  coachId: number,
  rating: number,
  comment?: string
) {
  const db = (await getDb())!;
  if (!db) return null;
  
  // Create the review
  const result = await db.insert(coachReviews).values({
    coachId,
    reviewerId,
    bookingId,
    rating,
    comment,
  }).$returningId();
  
  // Mark booking as reviewed
  await db.update(privateTrainingBookings).set({
    hasReview: true,
  }).where(eq(privateTrainingBookings.id, bookingId));
  
  // Get the created review
  const [review] = await db.select().from(coachReviews).where(eq(coachReviews.id, result[0].id));
  
  return review;
}

// Get reviews for a booking
export async function getBookingReview(bookingId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [review] = await db
    .select()
    .from(coachReviews)
    .where(eq(coachReviews.bookingId, bookingId))
    .limit(1);
  return review || null;
}

// Get all reviews for a coach with reviewer info
export async function getCoachReviewsWithDetails(coachId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db
    .select({
      id: coachReviews.id,
      rating: coachReviews.rating,
      comment: coachReviews.comment,
      createdAt: coachReviews.createdAt,
      reviewerName: users.name,
      reviewerAvatar: users.avatarUrl,
    })
    .from(coachReviews)
    .leftJoin(users, eq(coachReviews.reviewerId, users.id))
    .where(eq(coachReviews.coachId, coachId))
    .orderBy(desc(coachReviews.createdAt));
}

// Get booking statistics for a coach
export async function getCoachBookingStats(coachId: number) {
  const db = (await getDb())!;
  if (!db) return { total: 0, completed: 0, upcoming: 0, cancelled: 0, revenue: 0 };
  
  const bookings = await db
    .select()
    .from(privateTrainingBookings)
    .where(eq(privateTrainingBookings.coachId, coachId));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    upcoming: bookings.filter(b => b.status === 'confirmed' && new Date(b.sessionDate) >= today).length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
  };
}


// Get tomorrow's confirmed bookings for reminders
export async function getTomorrowsBookings() {
  const db = (await getDb())!;
  if (!db) return [];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return db
    .select({
      id: privateTrainingBookings.id,
      playerId: privateTrainingBookings.playerId,
      playerName: sql<string>`CONCAT(${players.firstName}, ' ', ${players.lastName})`,
      coachId: privateTrainingBookings.coachId,
      coachName: users.name,
      sessionDate: privateTrainingBookings.sessionDate,
      startTime: privateTrainingBookings.startTime,
      endTime: privateTrainingBookings.endTime,
      locationId: privateTrainingBookings.locationId,
      locationName: trainingLocations.name,
      bookedBy: privateTrainingBookings.bookedBy,
      parentName: sql<string>`(SELECT name FROM users WHERE id = ${privateTrainingBookings.bookedBy})`,
    })
    .from(privateTrainingBookings)
    .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
    .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
    .leftJoin(trainingLocations, eq(privateTrainingBookings.locationId, trainingLocations.id))
    .where(and(
      eq(privateTrainingBookings.status, 'confirmed'),
      sql`DATE(${privateTrainingBookings.sessionDate}) = ${tomorrowStr}`
    ));
}

// Cancel all future sessions in a recurring series
export async function cancelRecurringSeries(recurringGroupId: string, reason?: string) {
  const db = (await getDb())!;
  if (!db) return { cancelled: 0 };
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Get count of bookings to be cancelled
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(privateTrainingBookings)
    .where(and(
      eq(privateTrainingBookings.recurringGroupId, recurringGroupId),
      sql`DATE(${privateTrainingBookings.sessionDate}) >= ${todayStr}`,
      sql`${privateTrainingBookings.status} IN ('pending', 'confirmed')`
    ));
  
  // Cancel all future bookings in the series
  await db.update(privateTrainingBookings).set({
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelReason: reason || 'Recurring series cancelled',
  }).where(and(
    eq(privateTrainingBookings.recurringGroupId, recurringGroupId),
    sql`DATE(${privateTrainingBookings.sessionDate}) >= ${todayStr}`,
    sql`${privateTrainingBookings.status} IN ('pending', 'confirmed')`
  ));
  
  return { cancelled: countResult?.count || 0 };
}

// Get all bookings in a recurring series
export async function getRecurringSeriesBookings(recurringGroupId: string) {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db
    .select()
    .from(privateTrainingBookings)
    .where(eq(privateTrainingBookings.recurringGroupId, recurringGroupId))
    .orderBy(privateTrainingBookings.sessionDate);
}


// ============ Coach Player Progress Monitoring ============

export async function getCoachPlayerOverview(coachOpenId: string) {
  const db = (await getDb())!;
  if (!db) return [];
  
  // First get the user id from openId
  const user = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.openId, coachOpenId))
    .limit(1);
  
  if (!user.length) return [];
  const userId = user[0].id;
  
  // Get players that this coach has trained (via private training bookings)
  const bookings = await db.select({
    playerId: privateTrainingBookings.playerId,
    playerFirstName: players.firstName,
    playerLastName: players.lastName,
    playerAgeGroup: players.ageGroup,
    playerPosition: players.position,
    teamId: players.teamId,
    sessionsCount: sql<number>`COUNT(DISTINCT ${privateTrainingBookings.id})`,
    completedSessions: sql<number>`SUM(CASE WHEN ${privateTrainingBookings.status} = 'completed' THEN 1 ELSE 0 END)`,
    lastSession: sql<string>`MAX(${privateTrainingBookings.sessionDate})`,
  })
    .from(privateTrainingBookings)
    .innerJoin(players, eq(privateTrainingBookings.playerId, players.id))
    .innerJoin(coachProfiles, eq(privateTrainingBookings.coachId, coachProfiles.id))
    .where(eq(coachProfiles.userId, userId))
    .groupBy(privateTrainingBookings.playerId, players.firstName, players.lastName, players.ageGroup, players.position, players.teamId);
  
  return bookings;
}

export async function getPlayerProgressMetrics(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  // Get performance metrics over time
  const metrics = await db.select()
    .from(performanceMetrics)
    .where(eq(performanceMetrics.playerId, playerId))
    .orderBy(desc(performanceMetrics.createdAt))
    .limit(20);
  
  // Get skill scores
  const skills = await db.select()
    .from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.assessmentDate))
    .limit(10);
  
  // Get attendance stats
  const attendanceStats = await db.select({
    totalSessions: sql<number>`COUNT(*)`,
    attendedSessions: sql<number>`SUM(CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END)`,
    lateSessions: sql<number>`SUM(CASE WHEN ${attendance.status} = 'late' THEN 1 ELSE 0 END)`,
  })
    .from(attendance)
    .where(eq(attendance.playerId, playerId));
  
  // Get training session completions
  const trainingSessions = await db.select({
    totalAssigned: sql<number>`COUNT(*)`,
    completed: sql<number>`SUM(CASE WHEN ${drillAssignments.status} = 'completed' THEN 1 ELSE 0 END)`,
  })
    .from(drillAssignments)
    .where(eq(drillAssignments.playerId, playerId));
  
  // Get match stats
  const matchStats = await db.select({
    totalMatches: sql<number>`COUNT(*)`,
    totalGoals: sql<number>`SUM(${playerMatchStats.goals})`,
    totalAssists: sql<number>`SUM(${playerMatchStats.assists})`,
    avgMinutesPlayed: sql<number>`AVG(${playerMatchStats.minutesPlayed})`,
  })
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));
  
  return {
    performanceMetrics: metrics,
    skillScores: skills,
    attendance: attendanceStats[0] || { totalSessions: 0, attendedSessions: 0, lateSessions: 0 },
    drillProgress: trainingSessions[0] || { totalAssigned: 0, completed: 0 },
    matchStats: matchStats[0] || { totalMatches: 0, totalGoals: 0, totalAssists: 0, avgMinutesPlayed: 0 },
  };
}

export async function getCoachTrainingStats(coachOpenId: string) {
  const db = (await getDb())!;
  if (!db) return null;
  
  // First get the user id from openId
  const user = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.openId, coachOpenId))
    .limit(1);
  
  if (!user.length) return null;
  const userId = user[0].id;
  
  // Get coach profile
  const profile = await db.select()
    .from(coachProfiles)
    .where(eq(coachProfiles.userId, userId))
    .limit(1);
  
  if (!profile.length) return null;
  
  const coachProfileId = profile[0].id;
  
  // Get overall stats
  const stats = await db.select({
    totalBookings: sql<number>`COUNT(*)`,
    completedSessions: sql<number>`SUM(CASE WHEN ${privateTrainingBookings.status} = 'completed' THEN 1 ELSE 0 END)`,
    cancelledSessions: sql<number>`SUM(CASE WHEN ${privateTrainingBookings.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    uniquePlayers: sql<number>`COUNT(DISTINCT ${privateTrainingBookings.playerId})`,
    totalRevenue: sql<number>`SUM(CASE WHEN ${privateTrainingBookings.status} = 'completed' THEN ${privateTrainingBookings.totalPrice} ELSE 0 END)`,
  })
    .from(privateTrainingBookings)
    .where(eq(privateTrainingBookings.coachId, coachProfileId));
  
  // Get reviews
  const reviews = await db.select({
    avgRating: sql<number>`AVG(${coachReviews.rating})`,
    totalReviews: sql<number>`COUNT(*)`,
  })
    .from(coachReviews)
    .where(eq(coachReviews.coachId, coachProfileId));
  
  // Get monthly trend (last 6 months)
  const monthlyTrend = await db.select({
    month: sql<string>`DATE_FORMAT(${privateTrainingBookings.sessionDate}, '%Y-%m')`,
    sessions: sql<number>`COUNT(*)`,
    revenue: sql<number>`SUM(CASE WHEN ${privateTrainingBookings.status} = 'completed' THEN ${privateTrainingBookings.totalPrice} ELSE 0 END)`,
  })
    .from(privateTrainingBookings)
    .where(and(
      eq(privateTrainingBookings.coachId, coachProfileId),
      gte(privateTrainingBookings.sessionDate, sql`DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`)
    ))
    .groupBy(sql`DATE_FORMAT(${privateTrainingBookings.sessionDate}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${privateTrainingBookings.sessionDate}, '%Y-%m')`);
  
  return {
    ...stats[0],
    avgRating: reviews[0]?.avgRating || 0,
    totalReviews: reviews[0]?.totalReviews || 0,
    monthlyTrend,
  };
}

export async function getPlayerSkillTrend(playerId: number, skillName?: string) {
  const db = (await getDb())!;
  if (!db) return [];
  
  // Get skill scores over time - the table has individual skill columns, not skillName/score
  const scores = await db.select({
    assessmentDate: playerSkillScores.assessmentDate,
    ballControl: playerSkillScores.ballControl,
    firstTouch: playerSkillScores.firstTouch,
    dribbling: playerSkillScores.dribbling,
    passing: playerSkillScores.passing,
    shooting: playerSkillScores.shooting,
    crossing: playerSkillScores.crossing,
    heading: playerSkillScores.heading,
  })
    .from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.assessmentDate))
    .limit(10);
  
  return scores;
}

export async function getTeamProgressOverview(teamId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  // Get team players with their progress
  const teamPlayers = await db.select({
    playerId: players.id,
    firstName: players.firstName,
    lastName: players.lastName,
    position: players.position,
    ageGroup: players.ageGroup,
  })
    .from(players)
    .where(eq(players.teamId, teamId));
  
  // Get aggregate stats for the team
  const teamStats = await db.select({
    avgAttendance: sql<number>`AVG(CASE WHEN ${attendance.status} = 'present' THEN 100 ELSE 0 END)`,
    totalTrainingSessions: sql<number>`COUNT(DISTINCT ${attendance.sessionId})`,
  })
    .from(attendance)
    .innerJoin(players, eq(attendance.playerId, players.id))
    .where(eq(players.teamId, teamId));
  
  // Get match performance
  const matchPerformance = await db.select({
    totalMatches: sql<number>`COUNT(DISTINCT ${matches.id})`,
    wins: sql<number>`SUM(CASE WHEN ${matches.result} = 'win' THEN 1 ELSE 0 END)`,
    draws: sql<number>`SUM(CASE WHEN ${matches.result} = 'draw' THEN 1 ELSE 0 END)`,
    losses: sql<number>`SUM(CASE WHEN ${matches.result} = 'loss' THEN 1 ELSE 0 END)`,
    goalsFor: sql<number>`SUM(${matches.teamScore})`,
    goalsAgainst: sql<number>`SUM(${matches.opponentScore})`,
  })
    .from(matches)
    .where(eq(matches.teamId, teamId));
  
  return {
    players: teamPlayers,
    stats: teamStats[0] || { avgAttendance: 0, totalTrainingSessions: 0 },
    matchPerformance: matchPerformance[0] || { totalMatches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
  };
}


// ==================== VIDEO CLIPS ====================

export async function createVideoClip(data: InsertVideoClip): Promise<VideoClip> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(videoClips).values(data);
  const insertId = result[0].insertId;
  const [clip] = await db.select().from(videoClips).where(eq(videoClips.id, insertId));
  return clip;
}

export async function getVideoClipById(id: number): Promise<VideoClip | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [clip] = await db.select().from(videoClips).where(eq(videoClips.id, id));
  return clip;
}

export async function getVideoClipsByTeam(teamId: number): Promise<VideoClip[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(videoClips).where(eq(videoClips.teamId, teamId)).orderBy(desc(videoClips.createdAt));
}

export async function getVideoClipsByUser(userId: number): Promise<VideoClip[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(videoClips).where(eq(videoClips.createdBy, userId)).orderBy(desc(videoClips.createdAt));
}

export async function deleteVideoClip(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(videoClips).where(eq(videoClips.id, id));
}

// ==================== VIDEO TAGS ====================

export async function createVideoTag(data: InsertVideoTag): Promise<VideoTag> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(videoTags).values(data);
  const insertId = result[0].insertId;
  const [tag] = await db.select().from(videoTags).where(eq(videoTags.id, insertId));
  return tag;
}

export async function getVideoTagsByClip(clipId: number): Promise<VideoTag[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(videoTags).where(eq(videoTags.clipId, clipId)).orderBy(videoTags.timestamp);
}

export async function getVideoTagsByPlayer(playerId: number): Promise<VideoTag[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(videoTags).where(eq(videoTags.playerId, playerId)).orderBy(desc(videoTags.createdAt));
}

export async function deleteVideoTag(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(videoTags).where(eq(videoTags.id, id));
}

// List video clips with optional filters
export async function listVideoClips(filters?: {
  teamId?: number;
  matchId?: number;
  limit?: number;
}): Promise<VideoClip[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  let query = db.select().from(videoClips);
  
  if (filters?.teamId) {
    query = query.where(eq(videoClips.teamId, filters.teamId)) as any;
  }
  if (filters?.matchId) {
    query = query.where(eq(videoClips.matchId, filters.matchId)) as any;
  }
  
  query = query.orderBy(desc(videoClips.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  return query;
}

// Get a single video clip (alias for getVideoClipById)
export async function getVideoClip(id: number): Promise<VideoClip | undefined> {
  return getVideoClipById(id);
}

// Get all tags for a video clip (alias for getVideoTagsByClip)
export async function getVideoClipTags(clipId: number): Promise<VideoTag[]> {
  return getVideoTagsByClip(clipId);
}

// ==================== VIDEO ANNOTATIONS ====================

export async function createVideoAnnotation(data: InsertVideoAnnotation): Promise<VideoAnnotation> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(videoAnnotations).values(data);
  const insertId = result[0].insertId;
  const [annotation] = await db.select().from(videoAnnotations).where(eq(videoAnnotations.id, insertId));
  return annotation;
}

export async function getVideoAnnotationsByClip(clipId: number): Promise<VideoAnnotation[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(videoAnnotations).where(eq(videoAnnotations.clipId, clipId)).orderBy(videoAnnotations.timestamp);
}

export async function deleteVideoAnnotation(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(videoAnnotations).where(eq(videoAnnotations.id, id));
}

// ==================== PLAYER HEATMAPS ====================

export async function createPlayerHeatmap(data: InsertPlayerHeatmap): Promise<PlayerHeatmap> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(playerHeatmaps).values(data);
  const insertId = result[0].insertId;
  const [heatmap] = await db.select().from(playerHeatmaps).where(eq(playerHeatmaps.id, insertId));
  return heatmap;
}

export async function getPlayerHeatmapsByPlayer(playerId: number): Promise<PlayerHeatmap[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerHeatmaps).where(eq(playerHeatmaps.playerId, playerId)).orderBy(desc(playerHeatmaps.createdAt));
}

export async function getPlayerHeatmapByMatch(playerId: number, matchId: number): Promise<PlayerHeatmap | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [heatmap] = await db.select().from(playerHeatmaps)
    .where(and(eq(playerHeatmaps.playerId, playerId), eq(playerHeatmaps.matchId, matchId)));
  return heatmap;
}

// ==================== FORMATIONS ====================

export async function createFormation(data: InsertFormation): Promise<Formation> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(formations).values(data);
  const insertId = result[0].insertId;
  const [formation] = await db.select().from(formations).where(eq(formations.id, insertId));
  return formation;
}

export async function getFormationById(id: number): Promise<Formation | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [formation] = await db.select().from(formations).where(eq(formations.id, id));
  return formation;
}

export async function getFormationsByTeam(teamId: number): Promise<Formation[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(formations).where(eq(formations.teamId, teamId)).orderBy(desc(formations.createdAt));
}

export async function getFormationTemplates(): Promise<Formation[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(formations).where(eq(formations.isTemplate, true)).orderBy(formations.name);
}

export async function updateFormation(id: number, data: Partial<InsertFormation>): Promise<Formation | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  await db.update(formations).set(data).where(eq(formations.id, id));
  const [formation] = await db.select().from(formations).where(eq(formations.id, id));
  return formation;
}

export async function deleteFormation(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(formations).where(eq(formations.id, id));
}

// ==================== SET PIECES ====================

export async function createSetPiece(data: InsertSetPiece): Promise<SetPiece> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(setPieces).values(data);
  const insertId = result[0].insertId;
  const [setPiece] = await db.select().from(setPieces).where(eq(setPieces.id, insertId));
  return setPiece;
}

export async function getSetPieceById(id: number): Promise<SetPiece | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [setPiece] = await db.select().from(setPieces).where(eq(setPieces.id, id));
  return setPiece;
}

export async function getSetPiecesByTeam(teamId: number): Promise<SetPiece[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(setPieces).where(eq(setPieces.teamId, teamId)).orderBy(desc(setPieces.createdAt));
}

export async function getSetPiecesByType(teamId: number, type: string): Promise<SetPiece[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(setPieces)
    .where(and(eq(setPieces.teamId, teamId), eq(setPieces.type, type as any)))
    .orderBy(setPieces.name);
}

export async function updateSetPiece(id: number, data: Partial<InsertSetPiece>): Promise<SetPiece | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  await db.update(setPieces).set(data).where(eq(setPieces.id, id));
  const [setPiece] = await db.select().from(setPieces).where(eq(setPieces.id, id));
  return setPiece;
}

export async function deleteSetPiece(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(setPieces).where(eq(setPieces.id, id));
}

// ==================== OPPOSITION ANALYSIS ====================

export async function createOppositionAnalysis(data: InsertOppositionAnalysis): Promise<OppositionAnalysis> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(oppositionAnalysis).values(data);
  const insertId = result[0].insertId;
  const [analysis] = await db.select().from(oppositionAnalysis).where(eq(oppositionAnalysis.id, insertId));
  return analysis;
}

export async function getOppositionAnalysisById(id: number): Promise<OppositionAnalysis | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [analysis] = await db.select().from(oppositionAnalysis).where(eq(oppositionAnalysis.id, id));
  return analysis;
}

export async function getOppositionAnalysisByTeam(teamId: number): Promise<OppositionAnalysis[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(oppositionAnalysis).where(eq(oppositionAnalysis.teamId, teamId)).orderBy(desc(oppositionAnalysis.createdAt));
}

export async function updateOppositionAnalysis(id: number, data: Partial<InsertOppositionAnalysis>): Promise<OppositionAnalysis | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  await db.update(oppositionAnalysis).set(data).where(eq(oppositionAnalysis.id, id));
  const [analysis] = await db.select().from(oppositionAnalysis).where(eq(oppositionAnalysis.id, id));
  return analysis;
}

export async function deleteOppositionAnalysis(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(oppositionAnalysis).where(eq(oppositionAnalysis.id, id));
}

// ==================== MATCH BRIEFINGS ====================

export async function createMatchBriefing(data: InsertMatchBriefing): Promise<MatchBriefing> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(matchBriefings).values(data);
  const insertId = result[0].insertId;
  const [briefing] = await db.select().from(matchBriefings).where(eq(matchBriefings.id, insertId));
  return briefing;
}

export async function getMatchBriefingById(id: number): Promise<MatchBriefing | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [briefing] = await db.select().from(matchBriefings).where(eq(matchBriefings.id, id));
  return briefing;
}

export async function getMatchBriefingsByTeam(teamId: number): Promise<MatchBriefing[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchBriefings).where(eq(matchBriefings.teamId, teamId)).orderBy(desc(matchBriefings.createdAt));
}

export async function getMatchBriefingByMatch(matchId: number): Promise<MatchBriefing | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [briefing] = await db.select().from(matchBriefings).where(eq(matchBriefings.matchId, matchId));
  return briefing;
}

export async function updateMatchBriefing(id: number, data: Partial<InsertMatchBriefing>): Promise<MatchBriefing | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  await db.update(matchBriefings).set(data).where(eq(matchBriefings.id, id));
  const [briefing] = await db.select().from(matchBriefings).where(eq(matchBriefings.id, id));
  return briefing;
}

export async function deleteMatchBriefing(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(matchBriefings).where(eq(matchBriefings.id, id));
}

// ==================== LIVE MATCH NOTES ====================

export async function createLiveMatchNote(data: InsertLiveMatchNote): Promise<LiveMatchNote> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(liveMatchNotes).values(data);
  const insertId = result[0].insertId;
  const [note] = await db.select().from(liveMatchNotes).where(eq(liveMatchNotes.id, insertId));
  return note;
}

export async function getLiveMatchNotesByMatch(matchId: number): Promise<LiveMatchNote[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(liveMatchNotes).where(eq(liveMatchNotes.matchId, matchId)).orderBy(liveMatchNotes.minute);
}

export async function deleteLiveMatchNote(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(liveMatchNotes).where(eq(liveMatchNotes.id, id));
}

// ==================== PLAYER INSTRUCTIONS ====================

export async function createPlayerInstruction(data: InsertPlayerInstruction): Promise<PlayerInstruction> {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');
  const result = await db.insert(playerInstructions).values(data);
  const insertId = result[0].insertId;
  const [instruction] = await db.select().from(playerInstructions).where(eq(playerInstructions.id, insertId));
  return instruction;
}

export async function getPlayerInstructionsByMatch(matchId: number): Promise<PlayerInstruction[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerInstructions).where(eq(playerInstructions.matchId, matchId));
}

export async function getPlayerInstructionsByBriefing(briefingId: number): Promise<PlayerInstruction[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerInstructions).where(eq(playerInstructions.briefingId, briefingId));
}

export async function updatePlayerInstruction(id: number, data: Partial<InsertPlayerInstruction>): Promise<PlayerInstruction | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  await db.update(playerInstructions).set(data).where(eq(playerInstructions.id, id));
  const [instruction] = await db.select().from(playerInstructions).where(eq(playerInstructions.id, id));
  return instruction;
}

export async function deletePlayerInstruction(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(playerInstructions).where(eq(playerInstructions.id, id));
}

// ==================== HIGHLIGHT REELS ====================

export async function getPlayerHighlightTags(playerId: number, tagTypes?: string[]): Promise<(VideoTag & { clip: VideoClip })[]> {
  const db = (await getDb())!;
  if (!db) return [];
  const tags = await db.select({
    tag: videoTags,
    clip: videoClips
  })
    .from(videoTags)
    .innerJoin(videoClips, eq(videoTags.clipId, videoClips.id))
    .where(eq(videoTags.playerId, playerId))
    .orderBy(desc(videoTags.createdAt));
  
  return tags.map((t: { tag: VideoTag; clip: VideoClip }) => ({ ...t.tag, clip: t.clip }));
}

// ==================== ACADEMY VIDEOS ====================

export async function createAcademyVideo(data: InsertAcademyVideo): Promise<AcademyVideo> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(academyVideos).values(data);
  const insertedId = result[0].insertId;
  
  const video = await getAcademyVideoById(insertedId);
  if (!video) throw new Error("Failed to retrieve inserted video");
  return video;
}

export async function getAcademyVideoById(id: number): Promise<AcademyVideo | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  const result = await db.select().from(academyVideos).where(eq(academyVideos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAcademyVideos(): Promise<AcademyVideo[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(academyVideos).where(eq(academyVideos.isActive, true)).orderBy(academyVideos.displayOrder, desc(academyVideos.createdAt));
}

export async function getAcademyVideosByCategory(category: string): Promise<AcademyVideo[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(academyVideos)
    .where(and(eq(academyVideos.category, category as any), eq(academyVideos.isActive, true)))
    .orderBy(academyVideos.displayOrder, desc(academyVideos.createdAt));
}

export async function getHeroVideo(): Promise<AcademyVideo | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  const result = await db.select().from(academyVideos)
    .where(and(eq(academyVideos.category, 'hero'), eq(academyVideos.isActive, true)))
    .orderBy(desc(academyVideos.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAcademyVideo(id: number, data: Partial<InsertAcademyVideo>): Promise<AcademyVideo | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  await db.update(academyVideos).set(data).where(eq(academyVideos.id, id));
  return getAcademyVideoById(id);
}

export async function deleteAcademyVideo(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  // Soft delete by setting isActive to false
  await db.update(academyVideos).set({ isActive: false }).where(eq(academyVideos.id, id));
}

export async function hardDeleteAcademyVideo(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(academyVideos).where(eq(academyVideos.id, id));
}

// ==================== VIDEO EVENT TAGGING ====================

export async function createVideoEvent(data: InsertVideoEvent): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoEvents).values(data);
  return result[0].insertId;
}

export async function getVideoEvents(videoId: number): Promise<VideoEvent[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(videoEvents)
    .where(eq(videoEvents.videoId, videoId))
    .orderBy(videoEvents.timestamp);
}

export async function getVideoEventById(id: number): Promise<VideoEvent | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  const result = await db.select().from(videoEvents).where(eq(videoEvents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoEvent(id: number, data: Partial<InsertVideoEvent>): Promise<VideoEvent | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  await db.update(videoEvents).set(data).where(eq(videoEvents.id, id));
  return getVideoEventById(id);
}

export async function deleteVideoEvent(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(videoEvents).where(eq(videoEvents.id, id));
}

export async function getVideoHighlights(videoId: number, eventTypes?: string[]): Promise<VideoEvent[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  const conditions = [eq(videoEvents.videoId, videoId)];
  
  if (eventTypes && eventTypes.length > 0) {
    conditions.push(inArray(videoEvents.eventType, eventTypes as any[]));
  }
  
  return db.select().from(videoEvents)
    .where(and(...conditions))
    .orderBy(videoEvents.timestamp);
}

// ==================== OPPONENT MANAGEMENT ====================

export async function getAllOpponents(): Promise<Opponent[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(opponents).orderBy(desc(opponents.createdAt));
}

export async function getOpponentById(id: number): Promise<Opponent | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  const result = await db.select().from(opponents).where(eq(opponents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOpponent(data: Omit<InsertOpponent, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(opponents).values(data);
  return result[0].insertId;
}

export async function updateOpponent(id: number, data: Partial<InsertOpponent>): Promise<Opponent | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  await db.update(opponents).set(data).where(eq(opponents.id, id));
  return getOpponentById(id);
}

export async function deleteOpponent(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(opponents).where(eq(opponents.id, id));
}

export async function getOpponentVideos(opponentId: number): Promise<OpponentVideo[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(opponentVideos)
    .where(eq(opponentVideos.opponentId, opponentId))
    .orderBy(desc(opponentVideos.createdAt));
}

export async function createOpponentVideo(data: Omit<InsertOpponentVideo, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(opponentVideos).values(data);
  return result[0].insertId;
}

export async function getMatchStrategies(opponentId: number): Promise<MatchStrategy[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(matchStrategies)
    .where(eq(matchStrategies.opponentId, opponentId))
    .orderBy(desc(matchStrategies.createdAt));
}

export async function createMatchStrategy(data: Omit<InsertMatchStrategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(matchStrategies).values(data);
  return result[0].insertId;
}

// ==================== MATCH EVENT SESSIONS ====================

export async function createMatchEventSession(data: Omit<InsertMatchEventSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(matchEventSessions).values(data);
  return result[0].insertId;
}

export async function getMatchEventSessions(userId: number): Promise<MatchEventSession[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(matchEventSessions)
    .where(eq(matchEventSessions.createdBy, userId))
    .orderBy(desc(matchEventSessions.updatedAt));
}

export async function getMatchEventSession(sessionId: number): Promise<MatchEventSession | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  const result = await db.select().from(matchEventSessions)
    .where(eq(matchEventSessions.id, sessionId))
    .limit(1);
  
  return result[0];
}

export async function updateMatchEventSession(
  sessionId: number,
  data: Partial<Omit<InsertMatchEventSession, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.update(matchEventSessions)
    .set(data)
    .where(eq(matchEventSessions.id, sessionId));
}

export async function deleteMatchEventSession(sessionId: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(matchEventSessions)
    .where(eq(matchEventSessions.id, sessionId));
}


// ==================== SAVED VIDEO ANALYSES ====================

export async function createSavedVideoAnalysis(data: Omit<InsertSavedVideoAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoAnalyses).values(data);
  return result[0].insertId;
}

export async function getSavedVideoAnalyses(userId: number): Promise<SavedVideoAnalysis[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(videoAnalyses)
    .where(eq(videoAnalyses.createdBy, userId))
    .orderBy(desc(videoAnalyses.createdAt));
}

export async function getSavedVideoAnalysis(analysisId: number): Promise<SavedVideoAnalysis | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  
  const result = await db.select().from(videoAnalyses)
    .where(eq(videoAnalyses.id, analysisId))
    .limit(1);
  
  return result[0];
}

export async function deleteSavedVideoAnalysis(analysisId: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(videoAnalyses)
    .where(eq(videoAnalyses.id, analysisId));
}


// ==================== PLAYERMAKER INTEGRATION ====================

export async function getPlayermakerSettings() {
  const db = (await getDb())!;
  if (!db) return null;
  const result = await db.select().from(playermakerSettings).limit(1);
  return result[0] || null;
}

export async function savePlayermakerSettings(settings: InsertPlayermakerSettings) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const existing = await getPlayermakerSettings();
  if (existing) {
    await db.update(playermakerSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(playermakerSettings.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(playermakerSettings).values(settings);
    if (!result || !result[0] || !result[0].insertId) {
      throw new Error('Failed to save PlayerMaker settings');
    }
    return result[0].insertId;
  }
}

export async function updatePlayermakerToken(token: string, expiresOn: number, clubName?: string) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const existing = await getPlayermakerSettings();
  if (!existing) throw new Error("Settings not found");
  
  await db.update(playermakerSettings)
    .set({ token, tokenExpiresOn: expiresOn, clubName, updatedAt: new Date() })
    .where(eq(playermakerSettings.id, existing.id));
}

export async function updatePlayermakerLastSync() {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const existing = await getPlayermakerSettings();
  if (!existing) throw new Error("Settings not found");
  
  await db.update(playermakerSettings)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(playermakerSettings.id, existing.id));
}

export async function savePlayermakerSession(session: InsertPlayermakerSession) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  // Check if session already exists
  const existing = await db.select().from(playermakerSessions)
    .where(eq(playermakerSessions.sessionId, session.sessionId))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(playermakerSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(playermakerSessions.sessionId, session.sessionId));
    return existing[0].id;
  } else {
    const result = await db.insert(playermakerSessions).values(session);
    if (!result || !result[0] || !result[0].insertId) {
      throw new Error('Failed to save PlayerMaker session');
    }
    return result[0].insertId;
  }
}

export async function savePlayermakerMetrics(metrics: InsertPlayermakerPlayerMetrics) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  // Check if metrics already exist
  const existing = await db.select().from(playermakerPlayerMetrics)
    .where(and(eq(playermakerPlayerMetrics.sessionId, metrics.sessionId), eq(playermakerPlayerMetrics.playermakerPlayerId, metrics.playermakerPlayerId || ''))).limit(1);
  
  if (existing.length > 0) {
    await db.update(playermakerPlayerMetrics)
      .set({ ...metrics, updatedAt: new Date() })
      .where(eq(playermakerPlayerMetrics.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(playermakerPlayerMetrics).values(metrics);
    if (!result || !result[0] || !result[0].insertId) {
      throw new Error('Failed to save PlayerMaker metrics');
    }
    return result[0].insertId;
  }
}

export async function getPlayermakerSessions(limit = 50) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playermakerSessions)
    .orderBy(desc(playermakerSessions.date))
    .limit(limit);
}

export async function getPlayermakerMetrics(sessionId: string) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playermakerPlayerMetrics)
    .where(eq(playermakerPlayerMetrics.sessionId, sessionId));
}

export async function getRecentPlayermakerMetrics(daysBack = 30) {
  const db = (await getDb())!;
  if (!db) return [];
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysBack);
  
  return db.select().from(playermakerPlayerMetrics)
    .orderBy(desc(playermakerPlayerMetrics.createdAt))
    .limit(1000);
}

export async function getPlayermakerPlayerMetrics(playerId?: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  if (playerId) {
    return db.select().from(playermakerPlayerMetrics)
      .where(eq(playermakerPlayerMetrics.playerId, playerId))
      .orderBy(desc(playermakerPlayerMetrics.createdAt));
  }
  
  return db.select().from(playermakerPlayerMetrics)
    .orderBy(desc(playermakerPlayerMetrics.createdAt));
}

export async function saveAutoSyncSettings(enabled: boolean, frequency: 'hourly' | 'daily' | 'weekly') {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const existing = await getPlayermakerSettings();
  if (!existing) throw new Error("Settings not found");
  
  // Calculate next scheduled sync time
  let nextSync = new Date();
  switch (frequency) {
    case 'hourly':
      nextSync.setHours(nextSync.getHours() + 1);
      break;
    case 'daily':
      nextSync.setDate(nextSync.getDate() + 1);
      nextSync.setHours(6, 0, 0, 0); // 6 AM
      break;
    case 'weekly':
      nextSync.setDate(nextSync.getDate() + (7 - nextSync.getDay() + 1) % 7 + 1); // Next Monday
      nextSync.setHours(6, 0, 0, 0); // 6 AM
      break;
  }
  
  await db.update(playermakerSettings)
    .set({ 
      autoSyncEnabled: enabled, 
      autoSyncFrequency: frequency,
      nextScheduledSync: nextSync,
      updatedAt: new Date() 
    })
    .where(eq(playermakerSettings.id, existing.id));
}

export async function saveSyncHistory(history: InsertPlayermakerSyncHistory) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.insert(playermakerSyncHistory).values(history);
}

export async function getSyncHistory(limit = 10) {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(playermakerSyncHistory)
    .orderBy(desc(playermakerSyncHistory.syncedAt))
    .limit(limit);
}

export async function getCoachAnnotations(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  return db.select().from(playermakerCoachAnnotations)
    .where(eq(playermakerCoachAnnotations.playerId, playerId))
    .orderBy(desc(playermakerCoachAnnotations.createdAt));
}

export async function addCoachAnnotation(annotation: InsertPlayermakerCoachAnnotation) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.insert(playermakerCoachAnnotations).values(annotation);
}

export async function getPlayermakerTeamStats() {
  const db = (await getDb())!;
  if (!db) return {
    totalPlayers: 0,
    totalSessions: 0,
    avgTouches: 0,
    avgDistance: 0,
    weeklyTrends: [],
    topPerformers: [],
  };
  
  try {
    // Get total player    // Get total players
    const totalPlayersResult = await db.select({
      count: sql<number>`COUNT(DISTINCT ${playermakerPlayerMetrics.playermakerPlayerId})`
    }).from(playermakerPlayerMetrics);
    const totalPlayers = totalPlayersResult[0]?.count || 0;    
    // Get total sessions
    const totalSessionsResult = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(playermakerSessions);
    const totalSessions = totalSessionsResult[0]?.count || 0;
    
    // Get average touches and distance
    const avgStatsResult = await db.select({
      avgTouches: sql<number>`AVG(${playermakerPlayerMetrics.totalTouches})`,
      avgDistance: sql<number>`AVG(CAST(${playermakerPlayerMetrics.distanceCovered} AS UNSIGNED))`
    }).from(playermakerPlayerMetrics);
    const avgStats = avgStatsResult[0];
    
    // Get weekly trends (last 8 weeks)
    const weeklyTrendsRaw = await db.select({
      year: sql<number>`YEAR(${playermakerPlayerMetrics.createdAt})`,
      week: sql<number>`WEEK(${playermakerPlayerMetrics.createdAt})`,
      avgTouches: sql<number>`AVG(${playermakerPlayerMetrics.totalTouches})`,
      avgDistance: sql<number>`AVG(CAST(${playermakerPlayerMetrics.distanceCovered} AS UNSIGNED))`
    }).from(playermakerPlayerMetrics)
      .where(gte(playermakerPlayerMetrics.createdAt, sql`DATE_SUB(NOW(), INTERVAL 8 WEEK)`))
      .groupBy(sql`YEAR(${playermakerPlayerMetrics.createdAt}), WEEK(${playermakerPlayerMetrics.createdAt})`)
      .orderBy(sql`YEAR(${playermakerPlayerMetrics.createdAt}), WEEK(${playermakerPlayerMetrics.createdAt})`);
    const weeklyTrendsResult = weeklyTrendsRaw.map(row => ({
      week: `${row.year}-W${String(row.week).padStart(2, "0")}`,
      avgTouches: row.avgTouches,
      avgDistance: row.avgDistance
    }));
    const topPerformersResult = await db.select({
      playerId: playermakerPlayerMetrics.playermakerPlayerId,
      playerName: playermakerPlayerMetrics.playerName,
      sessionCount: sql<number>`COUNT(*)`,
      totalTouches: sql<number>`SUM(${playermakerPlayerMetrics.totalTouches})`,
      avgTouches: sql<number>`AVG(${playermakerPlayerMetrics.totalTouches})`,
      totalDistance: sql<number>`SUM(CAST(${playermakerPlayerMetrics.distanceCovered} AS UNSIGNED))`,
      avgDistance: sql<number>`AVG(CAST(${playermakerPlayerMetrics.distanceCovered} AS UNSIGNED))`
    }).from(playermakerPlayerMetrics)
      .groupBy(playermakerPlayerMetrics.playermakerPlayerId, playermakerPlayerMetrics.playerName)
      .orderBy(sql`totalTouches DESC`)
      .limit(10);
    
    return {
      totalPlayers,
      totalSessions,
      avgTouches: avgStats?.avgTouches || 0,
      avgDistance: avgStats?.avgDistance || 0,
      weeklyTrends: weeklyTrendsResult || [],
      topPerformers: topPerformersResult || [],
    };
  } catch (error) {
    console.error('Error in getPlayermakerTeamStats:', error);
    return {
      totalPlayers: 0,
      totalSessions: 0,
      avgTouches: 0,
      avgDistance: 0,
      weeklyTrends: [],
      topPerformers: [],
    };
  }
}

// ==================== HOME PAGE CONTENT FUNCTIONS ====================

export async function getAllHomePageContent() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(homePageContent).orderBy(homePageContent.sectionType, homePageContent.displayOrder);
}

export async function getHomePageContentBySection(
  section: (typeof homePageContent.$inferSelect)["sectionType"]
) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(homePageContent)
    .where(eq(homePageContent.sectionType, section))
    .orderBy(homePageContent.displayOrder);
}

export async function getHomePageContentById(id: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const results = await db.select().from(homePageContent)
    .where(eq(homePageContent.id, id))
    .limit(1);
  return results[0] || null;
}

export async function createHomePageContent(content: InsertHomePageContent) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(homePageContent).values(content);
  if (!result || !result[0] || !result[0].insertId) {
    throw new Error('Failed to create home page content');
  }
  return result[0].insertId;
}

export async function updateHomePageContent(id: number, content: Partial<InsertHomePageContent>) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.update(homePageContent)
    .set({ ...content, updatedAt: new Date() })
    .where(eq(homePageContent.id, id));
}

export async function deleteHomePageContent(id: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.delete(homePageContent).where(eq(homePageContent.id, id));
}

export async function getPlayerSkills(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(playerSkillScores).where(eq(playerSkillScores.playerId, playerId));
}

export async function getPlayerMeasurements(playerId: number) {
  const db = (await getDb())!;
  if (!db) return { height: null, weight: null, speed: null, stamina: null };
  
  const metrics = await db.select().from(performanceMetrics)
    .where(eq(performanceMetrics.playerId, playerId))
    .orderBy(desc(performanceMetrics.sessionDate))
    .limit(1);
  
  if (metrics.length === 0) {
    return { height: null, weight: null, speed: null, stamina: null };
  }
  
  const latest = metrics[0];
  return {
    height: null,
    weight: null,
    speed: null,
    stamina: null
  };
}


// ==================== LIVE MATCH MODE ====================

export async function createLiveMatch(data: InsertLiveMatch): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(liveMatches).values(data);
  return result[0].insertId;
}

export async function getLiveMatchById(id: number): Promise<LiveMatch | undefined> {
  const db = (await getDb())!;
  if (!db) return undefined;
  const [match] = await db.select().from(liveMatches).where(eq(liveMatches.id, id));
  return match;
}

export async function getActiveLiveMatches(userId: number): Promise<LiveMatch[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(liveMatches)
    .where(and(
      eq(liveMatches.createdBy, userId),
      inArray(liveMatches.status, ['not_started', 'first_half', 'half_time', 'second_half', 'extra_time'])
    ))
    .orderBy(desc(liveMatches.createdAt));
}

export async function getAllLiveMatches(userId: number): Promise<LiveMatch[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(liveMatches)
    .where(eq(liveMatches.createdBy, userId))
    .orderBy(desc(liveMatches.createdAt));
}

export async function updateLiveMatch(id: number, data: Partial<InsertLiveMatch>): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(liveMatches).set(data).where(eq(liveMatches.id, id));
}

export async function deleteLiveMatch(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(liveMatches).where(eq(liveMatches.id, id));
}

// ==================== MATCH EVENTS ====================

export async function createMatchEvent(data: InsertMatchEvent): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchEvents).values(data);
  return result[0].insertId;
}

export async function getMatchEvents(liveMatchId: number): Promise<MatchEvent[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchEvents)
    .where(eq(matchEvents.liveMatchId, liveMatchId))
    .orderBy(matchEvents.minute);
}

export async function deleteMatchEvent(id: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(matchEvents).where(eq(matchEvents.id, id));
}

// ==================== TACTICAL CHANGES ====================

export async function createTacticalChange(data: InsertTacticalChange): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tacticalChanges).values(data);
  return result[0].insertId;
}

export async function getTacticalChanges(liveMatchId: number): Promise<TacticalChange[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(tacticalChanges)
    .where(eq(tacticalChanges.liveMatchId, liveMatchId))
    .orderBy(tacticalChanges.minute);
}

export async function updateTacticalChange(id: number, data: Partial<InsertTacticalChange>): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(tacticalChanges).set(data).where(eq(tacticalChanges.id, id));
}


// ==================== PLAYER POSITION TRACKING ====================

export async function recordPlayerPosition(data: InsertPlayerPosition): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(playerPositions).values(data);
  return result[0].insertId;
}

export async function getPlayerPositions(liveMatchId: number, playerId?: number): Promise<PlayerPosition[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  if (playerId) {
    return db.select().from(playerPositions)
      .where(and(
        eq(playerPositions.liveMatchId, liveMatchId),
        eq(playerPositions.playerId, playerId)
      ))
      .orderBy(playerPositions.minute);
  }
  
  return db.select().from(playerPositions)
    .where(eq(playerPositions.liveMatchId, liveMatchId))
    .orderBy(playerPositions.minute);
}

export async function getPlayerHeatmapData(liveMatchId: number, playerId: number): Promise<{ x: number; y: number; intensity: number }[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  const positions = await db.select().from(playerPositions)
    .where(and(
      eq(playerPositions.liveMatchId, liveMatchId),
      eq(playerPositions.playerId, playerId)
    ));
  
  // Create heatmap grid (10x10)
  const grid: { [key: string]: number } = {};
  
  positions.forEach(pos => {
    const gridX = Math.floor(pos.xPosition / 10);
    const gridY = Math.floor(pos.yPosition / 10);
    const key = `${gridX},${gridY}`;
    grid[key] = (grid[key] || 0) + 1;
  });
  
  // Convert to array format
  const maxIntensity = Math.max(...Object.values(grid));
  return Object.entries(grid).map(([key, count]) => {
    const [x, y] = key.split(',').map(Number);
    return {
      x: x * 10 + 5, // Center of grid cell
      y: y * 10 + 5,
      intensity: count / maxIntensity // Normalize to 0-1
    };
  });
}

export async function deletePlayerPositions(liveMatchId: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(playerPositions).where(eq(playerPositions.liveMatchId, liveMatchId));
}

// ==================== GPS LIVE SYNC ====================

export async function createGpsLiveSync(data: InsertGpsLiveSync): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gpsLiveSync).values(data);
  return result[0].insertId;
}

export async function getGpsLiveSync(liveMatchId: number): Promise<GpsLiveSync[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(gpsLiveSync)
    .where(eq(gpsLiveSync.liveMatchId, liveMatchId));
}

export async function updateGpsLiveSync(id: number, data: Partial<InsertGpsLiveSync>): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.update(gpsLiveSync).set(data).where(eq(gpsLiveSync.id, id));
}

export async function deleteGpsLiveSync(liveMatchId: number): Promise<void> {
  const db = (await getDb())!;
  if (!db) return;
  await db.delete(gpsLiveSync).where(eq(gpsLiveSync.liveMatchId, liveMatchId));
}

// ==================== XG ANALYTICS ====================

export async function createMatchShot(data: InsertMatchShot): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchShots).values(data);
  return result[0].insertId;
}

export async function getMatchShots(matchId: number): Promise<MatchShot[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchShots)
    .where(eq(matchShots.matchId, matchId))
    .orderBy(asc(matchShots.minute));
}

export async function getMatchShotsByTeam(matchId: number, teamId: number): Promise<MatchShot[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchShots)
    .where(and(eq(matchShots.matchId, matchId), eq(matchShots.teamId, teamId)))
    .orderBy(asc(matchShots.minute));
}

export async function createMatchPass(data: InsertMatchPass): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchPasses).values(data);
  return result[0].insertId;
}

export async function getMatchPasses(matchId: number): Promise<MatchPass[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchPasses)
    .where(eq(matchPasses.matchId, matchId))
    .orderBy(asc(matchPasses.minute));
}

export async function getMatchPassesByTeam(matchId: number, teamId: number): Promise<MatchPass[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchPasses)
    .where(and(eq(matchPasses.matchId, matchId), eq(matchPasses.teamId, teamId)))
    .orderBy(asc(matchPasses.minute));
}

export async function createMatchDefensiveAction(data: InsertMatchDefensiveAction): Promise<number> {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchDefensiveActions).values(data);
  return result[0].insertId;
}

export async function getMatchDefensiveActions(matchId: number): Promise<MatchDefensiveAction[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchDefensiveActions)
    .where(eq(matchDefensiveActions.matchId, matchId))
    .orderBy(asc(matchDefensiveActions.minute));
}

export async function getMatchDefensiveActionsByTeam(matchId: number, teamId: number): Promise<MatchDefensiveAction[]> {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(matchDefensiveActions)
    .where(and(eq(matchDefensiveActions.matchId, matchId), eq(matchDefensiveActions.teamId, teamId)))
    .orderBy(asc(matchDefensiveActions.minute));
}

// Get xG Analytics summary for a match
export async function getMatchXGSummary(matchId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const shots = await getMatchShots(matchId);
  const passes = await getMatchPasses(matchId);
  const defensiveActions = await getMatchDefensiveActions(matchId);
  
  // Group by team
  const teamIds = [...new Set(shots.map(s => s.teamId))];
  const teamStats = teamIds.map(teamId => {
    const teamShots = shots.filter(s => s.teamId === teamId);
    const teamPasses = passes.filter(p => p.teamId === teamId);
    
    return {
      teamId,
      xG: teamShots.reduce((sum, s) => sum + Number(s.xGValue), 0),
      actualGoals: teamShots.filter(s => s.isGoal).length,
      shots: teamShots.length,
      shotsOnTarget: teamShots.filter(s => s.isOnTarget).length,
      xA: teamPasses.reduce((sum, p) => sum + Number(p.xAValue), 0),
      keyPasses: teamPasses.filter(p => p.isKeyPass).length,
      assists: teamPasses.filter(p => p.isAssist).length,
    };
  });
  
  return {
    matchId,
    shots,
    passes,
    defensiveActions,
    teamStats,
  };
}

export async function updateUserProfile(userId: number, data: {
  name?: string;
  email?: string;
  phone?: string;
  whatsappPhone?: string;
  whatsappNotifications?: boolean;
  avatarUrl?: string | null;
  coverPhotoUrl?: string | null;
  bio?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.whatsappPhone !== undefined) updateData.whatsappPhone = data.whatsappPhone;
  if (data.whatsappNotifications !== undefined) updateData.whatsappNotifications = data.whatsappNotifications;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.coverPhotoUrl !== undefined) updateData.coverPhotoUrl = data.coverPhotoUrl;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.nationality !== undefined) updateData.nationality = data.nationality;
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
  if (Object.keys(updateData).length === 0) return;
  await (db as any).update(users).set(updateData).where(eq(users.id, userId));
}
