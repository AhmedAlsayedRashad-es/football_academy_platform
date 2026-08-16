import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, json, bigint, decimal } from "drizzle-orm/mysql-core";

// ==================== USER & ROLE MANAGEMENT ====================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "coach", "nutritionist", "mental_coach", "physical_trainer", "parent", "player"]).default("player").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedRole: mysqlEnum("requestedRole", ["admin", "coach", "nutritionist", "mental_coach", "physical_trainer", "parent", "player"]),
  avatarUrl: text("avatarUrl"),
  coverPhotoUrl: text("coverPhotoUrl"),
  bio: text("bio"),
  nationality: varchar("nationality", { length: 100 }),
  dateOfBirth: date("dateOfBirth"),
  phone: varchar("phone", { length: 20 }),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }),
  whatsappNotifications: boolean("whatsappNotifications").default(false),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== PLAYERS ====================

export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: date("dateOfBirth").notNull(),
  position: mysqlEnum("position", ["goalkeeper", "defender", "midfielder", "forward"]).notNull(),
  preferredFoot: mysqlEnum("preferredFoot", ["left", "right", "both"]).default("right"),
  height: int("height"), // in cm
  weight: int("weight"), // in kg
  jerseyNumber: int("jerseyNumber"),
  ageGroup: varchar("ageGroup", { length: 10 }), // e.g., "U12", "U14"
  teamId: int("teamId"),
  status: mysqlEnum("status", ["active", "injured", "inactive", "trial"]).default("active"),
  joinDate: date("joinDate"),
  photoUrl: text("photoUrl"),
  nationality: varchar("nationality", { length: 100 }),
  bio: text("bio"),
  phone: varchar("phone", { length: 20 }),
  academyCode: varchar("academyCode", { length: 20 }).unique(),
  teamType: mysqlEnum("teamType", ["main", "academy"]).default("academy"),
  isPublicProfile: boolean("isPublicProfile").default(false), // Allow parents to share profile with scouts
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

// ==================== TEAMS ====================

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  ageGroup: varchar("ageGroup", { length: 10 }).notNull(),
  teamType: mysqlEnum("teamType", ["main", "academy"]).default("academy"),
  headCoachId: int("headCoachId").references(() => users.id),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ==================== TEAM-COACH ASSIGNMENTS ====================

export const teamCoaches = mysqlTable("team_coaches", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").references(() => teams.id).notNull(),
  coachUserId: int("coachUserId").references(() => users.id).notNull(),
  role: mysqlEnum("role", [
    "head_coach",
    "assistant_coach",
    "goalkeeper_coach",
    "fitness_coach",
    "load_trainer",
    "analyst",
    "video_analyst",
    "team_doctor",
    "physiotherapist",
    "nutritionist",
    "psychologist",
    "medical",
    "technical",
    "technical_director",
    "sporting_director",
    "team_manager",
    "kit_manager",
    "admin",
    "custom"
  ]).default("assistant_coach"),
  customRole: varchar("customRole", { length: 100 }),
  notes: varchar("notes", { length: 500 }),
  isPrimary: boolean("isPrimary").default(false),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamCoach = typeof teamCoaches.$inferSelect;
export type InsertTeamCoach = typeof teamCoaches.$inferInsert;

// ==================== PARENT-PLAYER RELATIONSHIP ====================

export const parentPlayerRelations = mysqlTable("parent_player_relations", {
  id: int("id").autoincrement().primaryKey(),
  parentUserId: int("parentUserId").references(() => users.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  relationship: mysqlEnum("relationship", ["father", "mother", "guardian", "other"]).default("guardian"),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== PERFORMANCE METRICS ====================

export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  sessionDate: date("sessionDate").notNull(),
  sessionType: mysqlEnum("sessionType", ["training", "match", "assessment"]).notNull(),
  // Technical metrics
  touches: int("touches").default(0),
  passes: int("passes").default(0),
  passAccuracy: int("passAccuracy").default(0), // percentage
  shots: int("shots").default(0),
  shotsOnTarget: int("shotsOnTarget").default(0),
  dribbles: int("dribbles").default(0),
  successfulDribbles: int("successfulDribbles").default(0),
  // Physical metrics
  distanceCovered: int("distanceCovered").default(0), // in meters
  topSpeed: int("topSpeed").default(0), // km/h * 10 for decimal
  sprints: int("sprints").default(0),
  accelerations: int("accelerations").default(0),
  decelerations: int("decelerations").default(0),
  // Tactical metrics
  possessionWon: int("possessionWon").default(0),
  possessionLost: int("possessionLost").default(0),
  interceptions: int("interceptions").default(0),
  tackles: int("tackles").default(0),
  // Overall scores
  technicalScore: int("technicalScore").default(0), // 0-100
  physicalScore: int("physicalScore").default(0), // 0-100
  tacticalScore: int("tacticalScore").default(0), // 0-100
  overallScore: int("overallScore").default(0), // 0-100
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// ==================== MENTAL HEALTH ASSESSMENTS ====================

export const mentalAssessments = mysqlTable("mental_assessments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  assessmentDate: date("assessmentDate").notNull(),
  // Psychological metrics (scale 1-10)
  confidenceLevel: int("confidenceLevel").default(5),
  anxietyLevel: int("anxietyLevel").default(5),
  motivationLevel: int("motivationLevel").default(5),
  focusLevel: int("focusLevel").default(5),
  resilienceScore: int("resilienceScore").default(5),
  teamworkScore: int("teamworkScore").default(5),
  leadershipScore: int("leadershipScore").default(5),
  stressLevel: int("stressLevel").default(5),
  // Overall mental wellness score
  overallMentalScore: int("overallMentalScore").default(50), // 0-100
  notes: text("notes"),
  recommendations: text("recommendations"),
  assessedBy: int("assessedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MentalAssessment = typeof mentalAssessments.$inferSelect;
export type InsertMentalAssessment = typeof mentalAssessments.$inferInsert;

// ==================== PHYSICAL TRAINING ====================

export const workoutPlans = mysqlTable("workout_plans", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id),
  teamId: int("teamId").references(() => teams.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["strength", "endurance", "agility", "flexibility", "recovery", "match_prep"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  durationMinutes: int("durationMinutes").default(60),
  exercises: text("exercises"), // JSON string of exercises
  scheduledDate: date("scheduledDate"),
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = typeof workoutPlans.$inferInsert;

// ==================== INJURY TRACKING ====================

export const injuries = mysqlTable("injuries", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  injuryType: varchar("injuryType", { length: 100 }).notNull(),
  bodyPart: varchar("bodyPart", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["minor", "moderate", "severe"]).notNull(),
  injuryDate: date("injuryDate").notNull(),
  expectedRecoveryDate: date("expectedRecoveryDate"),
  actualRecoveryDate: date("actualRecoveryDate"),
  status: mysqlEnum("status", ["active", "recovering", "recovered", "chronic"]).default("active"),
  treatment: text("treatment"),
  notes: text("notes"),
  returnToPlayCleared: boolean("returnToPlayCleared").default(false),
  clearedBy: int("clearedBy").references(() => users.id),
  clearedAt: timestamp("clearedAt"),
  reportedBy: int("reportedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Injury = typeof injuries.$inferSelect;
export type InsertInjury = typeof injuries.$inferInsert;

// ==================== NUTRITION ====================

export const mealPlans = mysqlTable("meal_plans", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  planDate: date("planDate").notNull(),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack", "pre_training", "post_training"]).notNull(),
  foods: text("foods"), // JSON string of food items
  calories: int("calories").default(0),
  protein: int("protein").default(0), // grams
  carbs: int("carbs").default(0), // grams
  fats: int("fats").default(0), // grams
  hydrationMl: int("hydrationMl").default(0),
  notes: text("notes"),
  isConsumed: boolean("isConsumed").default(false),
  consumedAt: timestamp("consumedAt"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = typeof mealPlans.$inferInsert;

export const nutritionLogs = mysqlTable("nutrition_logs", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  logDate: date("logDate").notNull(),
  totalCalories: int("totalCalories").default(0),
  totalProtein: int("totalProtein").default(0),
  totalCarbs: int("totalCarbs").default(0),
  totalFats: int("totalFats").default(0),
  hydrationMl: int("hydrationMl").default(0),
  mealsLogged: int("mealsLogged").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = typeof nutritionLogs.$inferInsert;

// ==================== TRAINING SESSIONS ====================

export const trainingSessions = mysqlTable("training_sessions", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").references(() => teams.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  sessionDate: date("sessionDate").notNull(),
  startTime: varchar("startTime", { length: 10 }), // HH:MM format
  endTime: varchar("endTime", { length: 10 }),
  location: varchar("location", { length: 200 }),
  sessionType: mysqlEnum("sessionType", ["technical", "tactical", "physical", "match", "recovery", "mixed"]).notNull(),
  objectives: text("objectives"),
  drills: text("drills"), // JSON string of drills
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  attendanceCount: int("attendanceCount").default(0),
  coachId: int("coachId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;

// ==================== INDIVIDUAL DEVELOPMENT PLANS ====================

export const developmentPlans = mysqlTable("development_plans", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active"),
  overallProgress: int("overallProgress").default(0), // 0-100
  // IDP-specific fields
  shortTermGoals: text("shortTermGoals"),
  longTermGoals: text("longTermGoals"),
  technicalObjectives: text("technicalObjectives"),
  physicalObjectives: text("physicalObjectives"),
  mentalObjectives: text("mentalObjectives"),
  nutritionObjectives: text("nutritionObjectives"),
  strengthsAnalysis: text("strengthsAnalysis"),
  areasForImprovement: text("areasForImprovement"),
  actionPlan: text("actionPlan"),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type InsertDevelopmentPlan = typeof developmentPlans.$inferInsert;

export const developmentGoals = mysqlTable("development_goals", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").references(() => developmentPlans.id).notNull(),
  category: mysqlEnum("category", ["technical", "physical", "mental", "nutritional", "tactical"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  targetValue: int("targetValue"),
  currentValue: int("currentValue").default(0),
  unit: varchar("unit", { length: 50 }),
  targetDate: date("targetDate"),
  completedDate: date("completedDate"),
  isCompleted: boolean("isCompleted").default(false),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "overdue"]).default("not_started"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevelopmentGoal = typeof developmentGoals.$inferSelect;
export type InsertDevelopmentGoal = typeof developmentGoals.$inferInsert;

// ==================== ACHIEVEMENTS ====================

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["technical", "physical", "mental", "nutritional", "milestone", "award"]).notNull(),
  achievedDate: date("achievedDate").notNull(),
  iconType: varchar("iconType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// ==================== NOTIFICATIONS ====================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "alert"]).default("info"),
  category: mysqlEnum("category", ["performance", "training", "nutrition", "mental", "injury", "achievement", "general"]).default("general"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: int("relatedEntityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==================== COACH FEEDBACK ====================

export const coachFeedback = mysqlTable("coach_feedback", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  coachId: int("coachId").references(() => users.id).notNull(),
  sessionId: int("sessionId").references(() => trainingSessions.id),
  feedbackDate: date("feedbackDate").notNull(),
  category: mysqlEnum("category", ["technical", "physical", "mental", "tactical", "general"]).notNull(),
  rating: int("rating"), // 1-5 stars
  strengths: text("strengths"),
  areasToImprove: text("areasToImprove"),
  recommendations: text("recommendations"),
  recommendedDrills: text("recommendedDrills"), // JSON: [{name, description, duration, youtubeUrl}]
  videoLinks: text("videoLinks"),               // JSON: [{title, url}]
  isVisibleToParent: boolean("isVisibleToParent").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachFeedback = typeof coachFeedback.$inferSelect;
export type InsertCoachFeedback = typeof coachFeedback.$inferInsert;


// ==================== MATCH RECORDS ====================

export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").references(() => teams.id),
  matchDate: date("matchDate").notNull(),
  matchType: mysqlEnum("matchType", ["friendly", "league", "cup", "tournament", "training_match"]).notNull(),
  opponent: varchar("opponent", { length: 200 }),
  venue: varchar("venue", { length: 200 }),
  isHome: boolean("isHome").default(true),
  teamScore: int("teamScore").default(0),
  opponentScore: int("opponentScore").default(0),
  result: mysqlEnum("result", ["win", "draw", "loss"]),
  halfTimeScore: varchar("halfTimeScore", { length: 10 }),
  notes: text("notes"),
  competitionName: varchar("competition_name", { length: 200 }),
  videoUrl: text("videoUrl"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

// ==================== PLAYER MATCH STATS ====================

export const playerMatchStats = mysqlTable("player_match_stats", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  // Playing time
  minutesPlayed: int("minutesPlayed").default(0),
  started: boolean("started").default(false),
  substitutedIn: int("substitutedIn"), // minute
  substitutedOut: int("substitutedOut"), // minute
  position: varchar("position", { length: 50 }),
  // Goals and assists
  goals: int("goals").default(0),
  assists: int("assists").default(0),
  // Technical stats
  touches: int("touches").default(0),
  passes: int("passes").default(0),
  passAccuracy: int("passAccuracy").default(0),
  shots: int("shots").default(0),
  shotsOnTarget: int("shotsOnTarget").default(0),
  dribbles: int("dribbles").default(0),
  successfulDribbles: int("successfulDribbles").default(0),
  crosses: int("crosses").default(0),
  // Defensive stats
  tackles: int("tackles").default(0),
  interceptions: int("interceptions").default(0),
  clearances: int("clearances").default(0),
  blocks: int("blocks").default(0),
  // Physical stats
  distanceCovered: int("distanceCovered").default(0), // meters
  topSpeed: int("topSpeed").default(0), // km/h * 10
  sprints: int("sprints").default(0),
  // Discipline
  yellowCards: int("yellowCards").default(0),
  redCards: int("redCards").default(0),
  foulsCommitted: int("foulsCommitted").default(0),
  foulsSuffered: int("foulsSuffered").default(0),
  // Ratings
  coachRating: int("coachRating"), // 1-10
  performanceScore: int("performanceScore").default(0), // 0-100
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerMatchStat = typeof playerMatchStats.$inferSelect;
export type InsertPlayerMatchStat = typeof playerMatchStats.$inferInsert;

// ==================== XG ANALYTICS TABLES ====================

export const matchShots = mysqlTable("match_shots", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  playerName: varchar("playerName", { length: 200 }).notNull(),
  teamId: int("teamId").references(() => teams.id).notNull(),
  minute: int("minute").notNull(),
  // Position on pitch (0-100 scale, x=horizontal, y=vertical)
  positionX: int("positionX").notNull(), // 0=own goal line, 100=opponent goal line
  positionY: int("positionY").notNull(), // 0=left touchline, 100=right touchline
  // xG metrics
  xGValue: decimal("xGValue", { precision: 5, scale: 3 }).notNull(), // Expected Goals value (0.000-1.000)
  isGoal: boolean("isGoal").default(false).notNull(),
  isOnTarget: boolean("isOnTarget").default(false),
  // Shot details
  shotType: mysqlEnum("shotType", ["right_foot", "left_foot", "header", "other"]),
  bodyPart: varchar("bodyPart", { length: 50 }),
  situation: mysqlEnum("situation", ["open_play", "corner", "free_kick", "penalty", "counter_attack"]),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchShot = typeof matchShots.$inferSelect;
export type InsertMatchShot = typeof matchShots.$inferInsert;

export const matchPasses = mysqlTable("match_passes", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id).notNull(),
  fromPlayerId: int("fromPlayerId").references(() => players.id),
  fromPlayerName: varchar("fromPlayerName", { length: 200 }).notNull(),
  toPlayerId: int("toPlayerId").references(() => players.id),
  toPlayerName: varchar("toPlayerName", { length: 200 }).notNull(),
  teamId: int("teamId").references(() => teams.id).notNull(),
  minute: int("minute").notNull(),
  // Pass positions (0-100 scale)
  fromX: int("fromX").notNull(),
  fromY: int("fromY").notNull(),
  toX: int("toX").notNull(),
  toY: int("toY").notNull(),
  // xA metrics
  xAValue: decimal("xAValue", { precision: 5, scale: 3 }).notNull(), // Expected Assists value
  isSuccessful: boolean("isSuccessful").default(true).notNull(),
  isKeyPass: boolean("isKeyPass").default(false), // Led to shot
  isAssist: boolean("isAssist").default(false), // Led to goal
  // Pass details
  passType: mysqlEnum("passType", ["short", "long", "through_ball", "cross", "corner", "free_kick"]),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchPass = typeof matchPasses.$inferSelect;
export type InsertMatchPass = typeof matchPasses.$inferInsert;

export const matchDefensiveActions = mysqlTable("match_defensive_actions", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  playerName: varchar("playerName", { length: 200 }).notNull(),
  teamId: int("teamId").references(() => teams.id).notNull(),
  minute: int("minute").notNull(),
  // Position on pitch (0-100 scale)
  positionX: int("positionX").notNull(),
  positionY: int("positionY").notNull(),
  // Action details
  actionType: mysqlEnum("actionType", ["tackle", "interception", "block", "clearance", "aerial_duel"]).notNull(),
  isSuccessful: boolean("isSuccessful").default(true).notNull(),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchDefensiveAction = typeof matchDefensiveActions.$inferSelect;
export type InsertMatchDefensiveAction = typeof matchDefensiveActions.$inferInsert;

// ==================== PLAYER SKILL SCORES (SCORECARD) ====================

export const playerSkillScores = mysqlTable("player_skill_scores", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  assessmentDate: date("assessmentDate").notNull(),
  // Technical Skills (0-100)
  ballControl: int("ballControl").default(50),
  firstTouch: int("firstTouch").default(50),
  dribbling: int("dribbling").default(50),
  passing: int("passing").default(50),
  shooting: int("shooting").default(50),
  crossing: int("crossing").default(50),
  heading: int("heading").default(50),
  // Foot Preference
  leftFootScore: int("leftFootScore").default(50),
  rightFootScore: int("rightFootScore").default(50),
  twoFootedScore: int("twoFootedScore").default(50), // Combined two-footed ability
  weakFootUsage: int("weakFootUsage").default(0), // Percentage of weak foot usage
  // Physical Skills (0-100)
  speed: int("speed").default(50),
  acceleration: int("acceleration").default(50),
  agility: int("agility").default(50),
  stamina: int("stamina").default(50),
  strength: int("strength").default(50),
  jumping: int("jumping").default(50),
  // Mental Skills (0-100)
  positioning: int("positioning").default(50),
  vision: int("vision").default(50),
  composure: int("composure").default(50),
  decisionMaking: int("decisionMaking").default(50),
  workRate: int("workRate").default(50),
  // Defensive Skills (0-100)
  marking: int("marking").default(50),
  tackling: int("tackling").default(50),
  interceptions: int("interceptions").default(50),
  // Overall Scores
  technicalOverall: int("technicalOverall").default(50),
  physicalOverall: int("physicalOverall").default(50),
  mentalOverall: int("mentalOverall").default(50),
  defensiveOverall: int("defensiveOverall").default(50),
  overallRating: int("overallRating").default(50),
  // Potential
  potentialRating: int("potentialRating").default(60),
  assessedBy: int("assessedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerSkillScore = typeof playerSkillScores.$inferSelect;
export type InsertPlayerSkillScore = typeof playerSkillScores.$inferInsert;

// ==================== AI TRAINING RECOMMENDATIONS ====================

export const aiTrainingRecommendations = mysqlTable("ai_training_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  generatedDate: date("generatedDate").notNull(),
  // Analysis
  strengthsIdentified: text("strengthsIdentified"), // JSON array
  weaknessesIdentified: text("weaknessesIdentified"), // JSON array
  // Recommendations
  recommendedDrills: text("recommendedDrills"), // JSON array of drill objects
  focusAreas: text("focusAreas"), // JSON array
  weeklyPlan: text("weeklyPlan"), // JSON object with daily recommendations
  // Priority metrics to improve
  priorityMetric1: varchar("priorityMetric1", { length: 100 }),
  priorityMetric2: varchar("priorityMetric2", { length: 100 }),
  priorityMetric3: varchar("priorityMetric3", { length: 100 }),
  // Foot-specific recommendations
  dominantFootTraining: text("dominantFootTraining"),
  weakFootTraining: text("weakFootTraining"),
  // Position-specific
  positionSpecificDrills: text("positionSpecificDrills"),
  // Status
  isActive: boolean("isActive").default(true),
  isAccepted: boolean("isAccepted").default(false),
  acceptedAt: timestamp("acceptedAt"),
  completionProgress: int("completionProgress").default(0), // 0-100
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AITrainingRecommendation = typeof aiTrainingRecommendations.$inferSelect;
export type InsertAITrainingRecommendation = typeof aiTrainingRecommendations.$inferInsert;

// ==================== VIDEO ANALYSIS ====================

export const videoAnalysis = mysqlTable("video_analysis", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id),
  matchId: int("matchId").references(() => matches.id),
  sessionId: int("sessionId").references(() => trainingSessions.id),
  title: varchar("title", { length: 200 }).notNull(),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // seconds
  fileSizeMb: int("fileSizeMb"), // file size in MB
  videoType: mysqlEnum("videoType", ["match_highlight", "training_clip", "skill_demo", "analysis", "full_match"]).notNull(),
  playerName: varchar("playerName", { length: 200 }),
  teamColor: varchar("teamColor", { length: 50 }),
  tags: text("tags"), // JSON array of tags
  annotations: text("annotations"), // JSON array of timestamped annotations
  // AI Analysis Results (JSON)
  aiAnalysis: text("aiAnalysis"), // Full AI-generated analysis JSON
  overallScore: int("overallScore"), // 0-100
  movementAnalysis: text("movementAnalysis"), // JSON
  technicalAnalysis: text("technicalAnalysis"), // JSON
  tacticalAnalysis: text("tacticalAnalysis"), // JSON
  strengths: text("strengths"), // JSON array
  improvements: text("improvements"), // JSON array
  drillRecommendations: text("drillRecommendations"), // JSON array
  coachNotes: text("coachNotes"), // AI coach notes
  heatmapZones: text("heatmapZones"), // JSON
  isPublic: boolean("isPublic").default(false),
  analysisStatus: mysqlEnum("analysisStatus", ["pending", "processing", "completed", "failed"]).default("pending"),
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoAnalysis = typeof videoAnalysis.$inferSelect;
export type InsertVideoAnalysis = typeof videoAnalysis.$inferInsert;

// ==================== LEAGUE STANDINGS ====================

export const leagueStandings = mysqlTable("league_standings", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").references(() => teams.id).notNull(),
  season: varchar("season", { length: 20 }).notNull(), // e.g., "2024-2025"
  leagueName: varchar("leagueName", { length: 100 }).notNull(),
  played: int("played").default(0),
  won: int("won").default(0),
  drawn: int("drawn").default(0),
  lost: int("lost").default(0),
  goalsFor: int("goalsFor").default(0),
  goalsAgainst: int("goalsAgainst").default(0),
  goalDifference: int("goalDifference").default(0),
  points: int("points").default(0),
  position: int("position").default(0),
  form: varchar("form", { length: 10 }), // e.g., "WWDLW"
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeagueStanding = typeof leagueStandings.$inferSelect;
export type InsertLeagueStanding = typeof leagueStandings.$inferInsert;

// ==================== MAN OF THE MATCH ====================

export const manOfTheMatch = mysqlTable("man_of_the_match", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  rating: int("rating").default(0), // 1-10 scale
  reason: text("reason"),
  selectedBy: int("selectedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ManOfTheMatch = typeof manOfTheMatch.$inferSelect;
export type InsertManOfTheMatch = typeof manOfTheMatch.$inferInsert;

// ==================== REGISTRATION REQUESTS ====================

export const registrationRequests = mysqlTable("registration_requests", {
  id: int("id").autoincrement().primaryKey(),
  parentName: varchar("parentName", { length: 200 }).notNull(),
  parentEmail: varchar("parentEmail", { length: 320 }).notNull(),
  parentPhone: varchar("parentPhone", { length: 20 }).notNull(),
  childName: varchar("childName", { length: 200 }).notNull(),
  childDateOfBirth: date("childDateOfBirth").notNull(),
  childAge: int("childAge"),
  preferredPosition: varchar("preferredPosition", { length: 50 }),
  currentClub: varchar("currentClub", { length: 200 }),
  experience: text("experience"),
  medicalConditions: text("medicalConditions"),
  howHeard: varchar("howHeard", { length: 100 }), // How did they hear about us
  message: text("message"),
  status: mysqlEnum("status", ["pending", "contacted", "trial_scheduled", "accepted", "rejected"]).default("pending"),
  notes: text("notes"), // Internal notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RegistrationRequest = typeof registrationRequests.$inferSelect;
export type InsertRegistrationRequest = typeof registrationRequests.$inferInsert;

// ==================== CONTACT INQUIRIES ====================

export const contactInquiries = mysqlTable("contact_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied", "closed"]).default("new"),
  repliedAt: timestamp("repliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = typeof contactInquiries.$inferInsert;

// ==================== GPS TRACKER DATA ====================

export const gpsTrackerData = mysqlTable("gps_tracker_data", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  sessionId: int("sessionId"), // Link to training session
  matchId: int("matchId"), // Link to match
  deviceType: varchar("deviceType", { length: 50 }), // STATSports, CITYPLAY, etc.
  deviceId: varchar("deviceId", { length: 100 }),
  recordedAt: timestamp("recordedAt").notNull(),
  // Physical metrics
  totalDistance: int("totalDistance"), // meters
  highSpeedDistance: int("highSpeedDistance"), // meters above 5.5 m/s
  sprintDistance: int("sprintDistance"), // meters above 7 m/s
  maxSpeed: int("maxSpeed"), // cm/s (for precision)
  avgSpeed: int("avgSpeed"), // cm/s
  accelerations: int("accelerations"), // count
  decelerations: int("decelerations"), // count
  // Heart rate data
  avgHeartRate: int("avgHeartRate"),
  maxHeartRate: int("maxHeartRate"),
  heartRateZones: text("heartRateZones"), // JSON string
  // Load metrics
  playerLoad: int("playerLoad"), // arbitrary units x 100
  metabolicPower: int("metabolicPower"), // W/kg x 100
  // Raw data
  rawData: text("rawData"), // JSON for additional metrics
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GpsTrackerData = typeof gpsTrackerData.$inferSelect;
export type InsertGpsTrackerData = typeof gpsTrackerData.$inferInsert;

// ==================== ACADEMY EVENTS ====================

export const academyEvents = mysqlTable("academy_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("eventType", ["training", "tournament", "trial", "camp", "workshop", "match", "meeting", "other"]).notNull(),
  location: varchar("location", { length: 200 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  ageGroups: text("ageGroups"), // JSON array of age groups e.g., ["U12", "U14"]
  maxParticipants: int("maxParticipants"),
  currentParticipants: int("currentParticipants").default(0),
  registrationDeadline: timestamp("registrationDeadline"),
  fee: int("fee"), // in cents
  isPublic: boolean("isPublic").default(true),
  status: mysqlEnum("status", ["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
  imageUrl: text("imageUrl"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademyEvent = typeof academyEvents.$inferSelect;
export type InsertAcademyEvent = typeof academyEvents.$inferInsert;

// ==================== COACHES EXTENDED PROFILES ====================

export const coachProfiles = mysqlTable("coach_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  title: varchar("title", { length: 100 }), // e.g., "Head Coach", "Assistant Coach"
  specialization: mysqlEnum("specialization", ["technical", "tactical", "fitness", "goalkeeping", "youth_development", "mental", "nutrition"]),
  qualifications: text("qualifications"), // JSON array of certifications
  experience: text("experience"), // Description of experience
  yearsExperience: int("yearsExperience"),
  bio: text("bio"),
  achievements: text("achievements"), // JSON array
  languages: text("languages"), // JSON array
  photoUrl: text("photoUrl"),
  linkedIn: varchar("linkedIn", { length: 200 }),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachProfile = typeof coachProfiles.$inferSelect;
export type InsertCoachProfile = typeof coachProfiles.$inferInsert;

// ==================== EVENT REGISTRATIONS ====================

export const eventRegistrations = mysqlTable("event_registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").references(() => academyEvents.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  playerName: varchar("playerName", { length: 200 }),
  playerAge: int("playerAge"),
  parentName: varchar("parentName", { length: 200 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  parentPhone: varchar("parentPhone", { length: 20 }),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "waitlist"]).default("pending"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid"),
  notes: text("notes"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
});

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = typeof eventRegistrations.$inferInsert;

// ==================== COACH AVAILABILITY ====================

export const coachAvailability = mysqlTable("coach_availability", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").references(() => users.id).notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 6=Saturday
  startTime: varchar("startTime", { length: 10 }).notNull(), // e.g., "09:00"
  endTime: varchar("endTime", { length: 10 }).notNull(), // e.g., "17:00"
  isAvailable: boolean("isAvailable").default(true),
  sessionType: mysqlEnum("sessionType", ["group", "private", "consultation", "all"]).default("all"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachAvailability = typeof coachAvailability.$inferSelect;
export type InsertCoachAvailability = typeof coachAvailability.$inferInsert;

// ==================== MEMBERSHIP PLANS ====================

export const membershipPlans = mysqlTable("membership_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  durationMonths: int("durationMonths").notNull(),
  price: int("price").notNull(), // in EGP
  originalPrice: int("originalPrice"), // for showing discounts
  features: text("features"), // JSON array of features
  isPopular: boolean("isPopular").default(false),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = typeof membershipPlans.$inferInsert;


// ==================== ATTENDANCE TRACKING ====================

export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  sessionId: int("sessionId"), // training session or match id
  sessionType: mysqlEnum("sessionType", ["training", "match", "trial", "assessment"]).notNull(),
  sessionDate: date("sessionDate").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).default("present").notNull(),
  checkInTime: timestamp("checkInTime"),
  checkOutTime: timestamp("checkOutTime"),
  durationMinutes: int("durationMinutes"),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// ==================== PLAYER POINTS & REWARDS ====================

export const playerPoints = mysqlTable("player_points", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  points: int("points").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalRedeemed: int("totalRedeemed").default(0).notNull(),
  level: int("level").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerPoints = typeof playerPoints.$inferSelect;
export type InsertPlayerPoints = typeof playerPoints.$inferInsert;

export const pointsTransactions = mysqlTable("points_transactions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  amount: int("amount").notNull(), // positive for earned, negative for redeemed
  type: mysqlEnum("type", ["attendance", "performance", "improvement", "bonus", "achievement", "redemption"]).notNull(),
  description: varchar("description", { length: 255 }),
  referenceId: int("referenceId"), // link to attendance, match, etc.
  referenceType: varchar("referenceType", { length: 50 }),
  awardedBy: int("awardedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = typeof pointsTransactions.$inferInsert;

export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  pointsCost: int("pointsCost").notNull(),
  category: mysqlEnum("category", ["merchandise", "training", "experience", "gift"]).notNull(),
  imageUrl: text("imageUrl"),
  stock: int("stock").default(-1), // -1 means unlimited
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

export const rewardRedemptions = mysqlTable("reward_redemptions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  rewardId: int("rewardId").references(() => rewards.id).notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "delivered", "cancelled"]).default("pending").notNull(),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  notes: text("notes"),
});

export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = typeof rewardRedemptions.$inferInsert;

// ==================== PLAYER ACTIVITIES (TRAINING & MATCHES) ====================

export const playerActivities = mysqlTable("player_activities", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  activityType: mysqlEnum("activityType", ["training", "match", "assessment", "trial"]).notNull(),
  activityDate: timestamp("activityDate").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  // Match specific
  opponent: varchar("opponent", { length: 100 }),
  score: varchar("score", { length: 20 }),
  result: mysqlEnum("result", ["win", "draw", "loss"]),
  goals: int("goals").default(0),
  assists: int("assists").default(0),
  // Performance metrics
  possessions: int("possessions"),
  workRate: int("workRate"), // stored as m/min * 10 for precision
  ballTouches: int("ballTouches"),
  speedActions: int("speedActions"),
  releases: int("releases"),
  leftFootPercent: int("leftFootPercent"),
  rightFootPercent: int("rightFootPercent"),
  // Position
  position: varchar("position", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerActivity = typeof playerActivities.$inferSelect;
export type InsertPlayerActivity = typeof playerActivities.$inferInsert;

// ==================== WEEKLY TARGETS ====================

export const weeklyTargets = mysqlTable("weekly_targets", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  weekStartDate: date("weekStartDate").notNull(),
  targetType: mysqlEnum("targetType", ["speed_actions", "ball_touches", "training_hours", "goals", "assists"]).notNull(),
  targetValue: int("targetValue").notNull(),
  currentValue: int("currentValue").default(0),
  isCompleted: boolean("isCompleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyTarget = typeof weeklyTargets.$inferSelect;
export type InsertWeeklyTarget = typeof weeklyTargets.$inferInsert;

// ==================== AI VIDEO ANALYSIS ====================

export const aiVideoAnalysis = mysqlTable("ai_video_analysis", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  title: varchar("title", { length: 200 }),
  analysisType: mysqlEnum("analysisType", ["match", "training", "skills", "movement"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  // AI Analysis Results
  aiSummary: text("aiSummary"),
  strengths: text("strengths"), // JSON array
  improvements: text("improvements"), // JSON array
  technicalScore: int("technicalScore"),
  tacticalScore: int("tacticalScore"),
  physicalScore: int("physicalScore"),
  recommendations: text("recommendations"), // JSON array
  analyzedAt: timestamp("analyzedAt"),
  analyzedBy: int("analyzedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIVideoAnalysis = typeof aiVideoAnalysis.$inferSelect;
export type InsertAIVideoAnalysis = typeof aiVideoAnalysis.$inferInsert;

// ==================== MASTERCLASS CONTENT ====================

export const masterclassContent = mysqlTable("masterclass_content", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  titleAr: varchar("titleAr", { length: 200 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: mysqlEnum("category", ["getting_started", "recommended", "position_specific", "skills", "tactics"]).notNull(),
  position: mysqlEnum("position", ["goalkeeper", "defender", "midfielder", "forward", "all"]).default("all"),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  durationMinutes: int("durationMinutes"),
  instructor: varchar("instructor", { length: 100 }),
  partNumber: int("partNumber"),
  seriesName: varchar("seriesName", { length: 100 }),
  isPublished: boolean("isPublished").default(true),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MasterclassContent = typeof masterclassContent.$inferSelect;
export type InsertMasterclassContent = typeof masterclassContent.$inferInsert;


// ==================== TRAINING DRILLS LIBRARY ====================

export const trainingDrills = mysqlTable("training_drills", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  titleAr: varchar("titleAr", { length: 200 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  category: mysqlEnum("category", [
    "ball_control",
    "passing",
    "shooting",
    "dribbling",
    "speed_agility",
    "positioning",
    "heading",
    "goalkeeper",
    "fitness",
    "tactical"
  ]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "elite"]).default("intermediate"),
  duration: int("duration").default(15), // in minutes
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  // Improvement areas this drill targets (for AI analysis linking)
  targetsBallControl: boolean("targetsBallControl").default(false),
  targetsPassing: boolean("targetsPassing").default(false),
  targetsShooting: boolean("targetsShooting").default(false),
  targetsDribbling: boolean("targetsDribbling").default(false),
  targetsSpeed: boolean("targetsSpeed").default(false),
  targetsPositioning: boolean("targetsPositioning").default(false),
  targetsFirstTouch: boolean("targetsFirstTouch").default(false),
  targetsHeading: boolean("targetsHeading").default(false),
  // Position-specific
  forPosition: mysqlEnum("forPosition", ["goalkeeper", "defender", "midfielder", "forward", "all"]).default("all"),
  // Metadata
  pointsReward: int("pointsReward").default(10),
  equipmentNeeded: text("equipmentNeeded"),
  equipmentNeededAr: text("equipmentNeededAr"),
  coachTips: text("coachTips"),
  coachTipsAr: text("coachTipsAr"),
  viewCount: int("viewCount").default(0),
  completionCount: int("completionCount").default(0),
  avgRating: int("avgRating").default(0), // 0-100
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingDrill = typeof trainingDrills.$inferSelect;
export type InsertTrainingDrill = typeof trainingDrills.$inferInsert;

// ==================== USER DRILL PROGRESS ====================

export const userDrillProgress = mysqlTable("user_drill_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  drillId: int("drillId").references(() => trainingDrills.id).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started"),
  completedAt: timestamp("completedAt"),
  watchTimeSeconds: int("watchTimeSeconds").default(0),
  rating: int("rating"), // 1-5 stars
  notes: text("notes"),
  pointsEarned: int("pointsEarned").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDrillProgress = typeof userDrillProgress.$inferSelect;
export type InsertUserDrillProgress = typeof userDrillProgress.$inferInsert;

// ==================== DRILL RECOMMENDATIONS (AI-LINKED) ====================

export const drillRecommendations = mysqlTable("drill_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  drillId: int("drillId").references(() => trainingDrills.id).notNull(),
  videoAnalysisId: int("videoAnalysisId"), // Link to AI video analysis that generated this recommendation
  reason: text("reason"), // Why this drill was recommended
  reasonAr: text("reasonAr"),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium"),
  improvementArea: varchar("improvementArea", { length: 100 }), // e.g., "ball_control", "passing"
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrillRecommendation = typeof drillRecommendations.$inferSelect;
export type InsertDrillRecommendation = typeof drillRecommendations.$inferInsert;


// ==================== DRILL ASSIGNMENTS (COACH-ASSIGNED) ====================

export const drillAssignments = mysqlTable("drill_assignments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  drillId: varchar("drillId", { length: 100 }).notNull(), // Drill ID from training library
  drillName: varchar("drillName", { length: 200 }).notNull(),
  drillNameAr: varchar("drillNameAr", { length: 200 }),
  category: varchar("category", { length: 100 }), // e.g., "ball_control", "passing"
  assignedBy: int("assignedBy").references(() => users.id).notNull(),
  videoAnalysisId: int("videoAnalysisId"), // Link to video analysis that prompted this assignment
  improvementArea: varchar("improvementArea", { length: 100 }), // e.g., "First Touch", "Passing Accuracy"
  reason: text("reason"), // Coach's note on why this drill was assigned
  dueDate: date("dueDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending"),
  completedAt: timestamp("completedAt"),
  playerNotes: text("playerNotes"), // Player's feedback after completing
  coachFeedback: text("coachFeedback"), // Coach's feedback on completion
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillAssignment = typeof drillAssignments.$inferSelect;
export type InsertDrillAssignment = typeof drillAssignments.$inferInsert;


// ==================== TRAINING VIDEOS (PUBLIC LIBRARY) ====================

export const trainingVideos = mysqlTable("training_videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  titleAr: varchar("titleAr", { length: 200 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(), // S3 URL
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }), // Optional thumbnail
  duration: int("duration"), // Duration in seconds
  category: varchar("category", { length: 100 }).notNull(), // e.g., "ball_control", "passing", "shooting"
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  ageGroup: varchar("ageGroup", { length: 50 }), // e.g., "U8", "U10", "U12", "all"
  tags: text("tags"), // JSON array of tags
  uploadedBy: int("uploadedBy").references(() => users.id).notNull(),
  isPublished: boolean("isPublished").default(false),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingVideo = typeof trainingVideos.$inferSelect;
export type InsertTrainingVideo = typeof trainingVideos.$inferInsert;


// ==================== TRAINING LOCATIONS (YARDS/FIELDS) ====================

export const trainingLocations = mysqlTable("training_locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  address: varchar("address", { length: 255 }),
  capacity: int("capacity").default(1), // How many simultaneous sessions
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingLocation = typeof trainingLocations.$inferSelect;
export type InsertTrainingLocation = typeof trainingLocations.$inferInsert;

// ==================== COACH REVIEWS ====================

export const coachReviews = mysqlTable("coach_reviews", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").references(() => users.id).notNull(),
  reviewerId: int("reviewerId").references(() => users.id).notNull(), // Parent or player
  bookingId: int("bookingId"), // Link to the private training booking
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isApproved: boolean("isApproved").default(true), // For moderation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachReview = typeof coachReviews.$inferSelect;
export type InsertCoachReview = typeof coachReviews.$inferInsert;

// ==================== COACH SCHEDULE SLOTS ====================

export const coachScheduleSlots = mysqlTable("coach_schedule_slots", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").references(() => users.id).notNull(),
  locationId: int("locationId").references(() => trainingLocations.id),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar("startTime", { length: 5 }).notNull(), // "09:00" format
  endTime: varchar("endTime", { length: 5 }).notNull(), // "10:00" format
  isRecurring: boolean("isRecurring").default(true), // Weekly recurring slot
  specificDate: date("specificDate"), // For one-time availability
  isAvailable: boolean("isAvailable").default(true),
  pricePerSession: int("pricePerSession"), // Price in EGP
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachScheduleSlot = typeof coachScheduleSlots.$inferSelect;
export type InsertCoachScheduleSlot = typeof coachScheduleSlots.$inferInsert;

// ==================== PRIVATE TRAINING BOOKINGS ====================

export const privateTrainingBookings = mysqlTable("private_training_bookings", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").references(() => users.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  bookedBy: int("bookedBy").references(() => users.id).notNull(), // Parent who booked
  locationId: int("locationId").references(() => trainingLocations.id),
  slotId: int("slotId").references(() => coachScheduleSlots.id),
  sessionDate: date("sessionDate").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(), // "09:00" format
  endTime: varchar("endTime", { length: 5 }).notNull(), // "10:00" format
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  totalPrice: int("totalPrice"), // Total price in EGP
  notes: text("notes"), // Special requests or focus areas
  coachNotes: text("coachNotes"), // Coach's notes after session
  completedAt: timestamp("completedAt"),
  hasReview: boolean("hasReview").default(false),
  cancelledAt: timestamp("cancelledAt"),
  cancelReason: text("cancelReason"),
  // Recurring booking fields
  isRecurring: boolean("isRecurring").default(false),
  recurringGroupId: varchar("recurringGroupId", { length: 36 }), // UUID to group recurring bookings
  recurringWeeks: int("recurringWeeks"), // Number of weeks for recurring booking
  recurringIndex: int("recurringIndex"), // Index in the recurring series (1, 2, 3...)
  // Payment fields
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded", "failed"]).default("pending"),
  paymentIntentId: varchar("paymentIntentId", { length: 255 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrivateTrainingBooking = typeof privateTrainingBookings.$inferSelect;
export type InsertPrivateTrainingBooking = typeof privateTrainingBookings.$inferInsert;


// ==================== VIDEO ANALYSIS ====================

export const videoClips = mysqlTable("video_clips", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").references(() => trainingVideos.id),
  matchId: int("matchId").references(() => matches.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // Duration in seconds
  startTime: int("startTime").default(0), // Start time in seconds for clip
  endTime: int("endTime"), // End time in seconds for clip
  createdBy: int("createdBy").references(() => users.id).notNull(),
  teamId: int("teamId").references(() => teams.id),
  isPublic: boolean("isPublic").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoClip = typeof videoClips.$inferSelect;
export type InsertVideoClip = typeof videoClips.$inferInsert;

export const videoTags = mysqlTable("video_tags", {
  id: int("id").autoincrement().primaryKey(),
  clipId: int("clipId").references(() => videoClips.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  tagType: mysqlEnum("tagType", ["goal", "assist", "shot", "pass", "dribble", "tackle", "interception", "save", "error", "foul", "set_piece", "highlight", "custom"]).notNull(),
  timestamp: int("timestamp").notNull(), // Time in seconds within the video
  endTimestamp: int("endTimestamp"), // Optional end time for duration-based tags
  description: text("description"),
  rating: int("rating"), // 1-5 rating for the action
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoTag = typeof videoTags.$inferSelect;
export type InsertVideoTag = typeof videoTags.$inferInsert;

export const videoAnnotations = mysqlTable("video_annotations", {
  id: int("id").autoincrement().primaryKey(),
  clipId: int("clipId").references(() => videoClips.id).notNull(),
  timestamp: int("timestamp").notNull(), // Time in seconds
  annotationType: mysqlEnum("annotationType", ["arrow", "circle", "rectangle", "line", "text", "freehand"]).notNull(),
  data: text("data").notNull(), // JSON with coordinates, color, size, text content
  color: varchar("color", { length: 20 }).default("#ff0000"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoAnnotation = typeof videoAnnotations.$inferSelect;
export type InsertVideoAnnotation = typeof videoAnnotations.$inferInsert;

export const playerHeatmaps = mysqlTable("player_heatmaps", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  matchId: int("matchId").references(() => matches.id),
  clipId: int("clipId").references(() => videoClips.id),
  heatmapData: text("heatmapData").notNull(), // JSON array of position coordinates
  averagePosition: varchar("averagePosition", { length: 50 }), // "x,y" format
  distanceCovered: int("distanceCovered"), // In meters
  topSpeed: int("topSpeed"), // km/h * 10
  sprintCount: int("sprintCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerHeatmap = typeof playerHeatmaps.$inferSelect;
export type InsertPlayerHeatmap = typeof playerHeatmaps.$inferInsert;

// ==================== TACTICAL PLANNING ====================

export const formations = mysqlTable("formations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "4-3-3 Attack"
  templateName: varchar("templateName", { length: 20 }), // e.g., "4-3-3", "4-4-2"
  description: text("description"),
  positions: text("positions").notNull(), // JSON array of {role, x, y, playerId?}
  teamId: int("teamId").references(() => teams.id),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  isTemplate: boolean("isTemplate").default(false), // System template vs custom
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Formation = typeof formations.$inferSelect;
export type InsertFormation = typeof formations.$inferInsert;

export const setPieces = mysqlTable("set_pieces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["corner_kick", "free_kick", "throw_in", "penalty", "goal_kick", "kickoff"]).notNull(),
  side: mysqlEnum("side", ["left", "right", "center"]),
  description: text("description"),
  movements: text("movements").notNull(), // JSON array of player movements with animations
  teamId: int("teamId").references(() => teams.id),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SetPiece = typeof setPieces.$inferSelect;
export type InsertSetPiece = typeof setPieces.$inferInsert;

export const oppositionAnalysis = mysqlTable("opposition_analysis", {
  id: int("id").autoincrement().primaryKey(),
  opponentName: varchar("opponentName", { length: 200 }).notNull(),
  matchId: int("matchId").references(() => matches.id),
  formation: varchar("formation", { length: 20 }), // e.g., "4-4-2"
  playStyle: mysqlEnum("playStyle", ["attacking", "defensive", "possession", "counter", "balanced"]),
  strengths: text("strengths"), // JSON array
  weaknesses: text("weaknesses"), // JSON array
  keyPlayers: text("keyPlayers"), // JSON array with player details
  patterns: text("patterns"), // JSON array of tactical patterns
  setPlays: text("setPlays"), // Notes on their set pieces
  notes: text("notes"),
  videoClipIds: text("videoClipIds"), // JSON array of related video clips
  createdBy: int("createdBy").references(() => users.id).notNull(),
  teamId: int("teamId").references(() => teams.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OppositionAnalysis = typeof oppositionAnalysis.$inferSelect;
export type InsertOppositionAnalysis = typeof oppositionAnalysis.$inferInsert;

export const matchBriefings = mysqlTable("match_briefings", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id),
  title: varchar("title", { length: 200 }).notNull(),
  oppositionId: int("oppositionId").references(() => oppositionAnalysis.id),
  formationId: int("formationId").references(() => formations.id),
  objectives: text("objectives"), // JSON array of match objectives
  keyTactics: text("keyTactics"), // JSON array of tactical instructions
  playerInstructions: text("playerInstructions"), // JSON object with player-specific instructions
  setPieceIds: text("setPieceIds"), // JSON array of set piece IDs to use
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  teamId: int("teamId").references(() => teams.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchBriefing = typeof matchBriefings.$inferSelect;
export type InsertMatchBriefing = typeof matchBriefings.$inferInsert;

export const liveMatchNotes = mysqlTable("live_match_notes", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id).notNull(),
  minute: int("minute").notNull(), // Match minute
  noteType: mysqlEnum("noteType", ["tactical", "substitution", "injury", "goal", "card", "observation", "instruction"]).notNull(),
  content: text("content").notNull(),
  playerId: int("playerId").references(() => players.id),
  importance: mysqlEnum("importance", ["low", "medium", "high"]).default("medium"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveMatchNote = typeof liveMatchNotes.$inferSelect;
export type InsertLiveMatchNote = typeof liveMatchNotes.$inferInsert;

export const playerInstructions = mysqlTable("player_instructions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  matchId: int("matchId").references(() => matches.id),
  briefingId: int("briefingId").references(() => matchBriefings.id),
  role: varchar("role", { length: 100 }), // Tactical role for this match
  position: varchar("position", { length: 50 }), // Position to play
  instructions: text("instructions").notNull(), // JSON array of specific instructions
  markingAssignment: varchar("markingAssignment", { length: 100 }), // Who to mark
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerInstruction = typeof playerInstructions.$inferSelect;
export type InsertPlayerInstruction = typeof playerInstructions.$inferInsert;

// ==================== ACADEMY VIDEOS ====================

export const academyVideos = mysqlTable("academy_videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["hero", "gallery_drills", "gallery_highlights", "gallery_skills", "training", "other"]).notNull(),
  videoUrl: text("videoUrl").notNull(), // S3 URL
  thumbnailUrl: text("thumbnailUrl"), // S3 URL for thumbnail
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 file key for deletion
  duration: int("duration"), // Duration in seconds
  fileSize: int("fileSize"), // File size in bytes
  uploadedBy: int("uploadedBy").references(() => users.id).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0), // For ordering videos in gallery
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademyVideo = typeof academyVideos.$inferSelect;
export type InsertAcademyVideo = typeof academyVideos.$inferInsert;

// ==================== VIDEO EVENT TAGGING ====================

export const videoEvents = mysqlTable("video_events", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").references(() => trainingVideos.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  eventType: mysqlEnum("eventType", [
    "goal", "assist", "key_pass", "tackle", "interception", 
    "save", "shot", "dribble", "pass", "cross", "foul", 
    "card_yellow", "card_red", "substitution", "corner", "freekick", "other"
  ]).notNull(),
  timestamp: int("timestamp").notNull(), // Timestamp in seconds from video start
  duration: int("duration").default(5), // Event duration in seconds
  title: varchar("title", { length: 200 }),
  description: text("description"),
  tags: text("tags"), // JSON array of additional tags
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoEvent = typeof videoEvents.$inferSelect;
export type InsertVideoEvent = typeof videoEvents.$inferInsert;

// ==================== OPPONENT ANALYSIS ====================

export const opponents = mysqlTable("opponents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  logo: text("logo"), // S3 URL for team logo
  league: varchar("league", { length: 100 }),
  ageGroup: varchar("ageGroup", { length: 50 }),
  coachName: varchar("coachName", { length: 100 }),
  typicalFormation: varchar("typicalFormation", { length: 50 }),
  playingStyle: text("playingStyle"), // AI-generated description
  strengths: text("strengths"), // JSON array
  weaknesses: text("weaknesses"), // JSON array
  keyPlayers: text("keyPlayers"), // JSON array
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opponent = typeof opponents.$inferSelect;
export type InsertOpponent = typeof opponents.$inferInsert;

export const opponentVideos = mysqlTable("opponent_videos", {
  id: int("id").autoincrement().primaryKey(),
  opponentId: int("opponentId").references(() => opponents.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  videoUrl: text("videoUrl").notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  matchDate: date("matchDate"),
  competition: varchar("competition", { length: 100 }),
  result: varchar("result", { length: 50 }), // e.g., "W 3-1", "L 0-2"
  analysisNotes: text("analysisNotes"), // AI-generated analysis
  uploadedBy: int("uploadedBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpponentVideo = typeof opponentVideos.$inferSelect;
export type InsertOpponentVideo = typeof opponentVideos.$inferInsert;

export const matchStrategies = mysqlTable("match_strategies", {
  id: int("id").autoincrement().primaryKey(),
  opponentId: int("opponentId").references(() => opponents.id).notNull(),
  matchDate: date("matchDate").notNull(),
  ourFormation: varchar("ourFormation", { length: 50 }).notNull(),
  tacticalApproach: text("tacticalApproach").notNull(), // AI-generated
  keyFocusAreas: text("keyFocusAreas").notNull(), // JSON array
  playerInstructions: text("playerInstructions"), // JSON object
  setPieceStrategy: text("setPieceStrategy"),
  substitutionPlan: text("substitutionPlan"),
  predictedOutcome: varchar("predictedOutcome", { length: 100 }), // AI prediction
  confidence: int("confidence"), // 0-100
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchStrategy = typeof matchStrategies.$inferSelect;
export type InsertMatchStrategy = typeof matchStrategies.$inferInsert;

// ==================== MATCH EVENT RECORDING SESSIONS ====================

export const matchEventSessions = mysqlTable("match_event_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionName: varchar("sessionName", { length: 255 }).notNull(),
  matchId: int("matchId").references(() => matches.id),
  homeTeam: varchar("homeTeam", { length: 100 }),
  awayTeam: varchar("awayTeam", { length: 100 }),
  matchDate: timestamp("matchDate"),
  eventsData: text("eventsData").notNull(), // JSON string of match events array
  metadata: text("metadata"), // JSON string of additional session metadata
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastAutoSave: timestamp("lastAutoSave"),
});

export type MatchEventSession = typeof matchEventSessions.$inferSelect;
export type InsertMatchEventSession = typeof matchEventSessions.$inferInsert;


// ==================== VIDEO ANALYSES ====================

export const videoAnalyses = mysqlTable("video_analyses", {
  id: int("id").autoincrement().primaryKey(),
  videoName: varchar("videoName", { length: 255 }).notNull(),
  videoUrl: varchar("videoUrl", { length: 500 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  teamColor: varchar("teamColor", { length: 50 }),
  playerName: varchar("playerName", { length: 100 }),
  analysisData: text("analysisData").notNull(), // JSON string of analysis results
  isRealAnalysis: boolean("isRealAnalysis").default(false), // Flag for AI vision analysis
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedVideoAnalysis = typeof videoAnalyses.$inferSelect;
export type InsertSavedVideoAnalysis = typeof videoAnalyses.$inferInsert;

// ==================== TACTICAL PLANS ====================

export const tacticalPlans = mysqlTable("tactical_plans", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  formation: varchar("formation", { length: 20 }).notNull(), // e.g., "4-4-2", "4-3-2-1"
  attackPattern: varchar("attackPattern", { length: 50 }), // e.g., "counter_attack", "wing_attack"
  playerPositions: json("playerPositions").notNull(), // Array of {playerId, x, z}
  playerPaths: json("playerPaths"), // Map of playerId to path points
  description: text("description"),
  isPublic: boolean("isPublic").default(false).notNull(),
  
  // AI Tactical Planner Data
  teamFormation: varchar("teamFormation", { length: 20 }),
  teamPlayStyle: varchar("teamPlayStyle", { length: 50 }),
  teamStrengths: json("teamStrengths"), // Array of strengths
  teamKeyPlayers: text("teamKeyPlayers"),
  opponentName: varchar("opponentName", { length: 200 }),
  opponentFormation: varchar("opponentFormation", { length: 20 }),
  opponentPlayStyle: varchar("opponentPlayStyle", { length: 50 }),
  opponentWeaknesses: json("opponentWeaknesses"), // Array of weaknesses
  opponentKeyPlayers: text("opponentKeyPlayers"),
  tacticalOptions: json("tacticalOptions"), // Array of AI generated options
  selectedTacticId: int("selectedTacticId"), // ID of selected tactic
  matchId: int("matchId").references(() => matches.id),
  matchDate: date("matchDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TacticalPlan = typeof tacticalPlans.$inferSelect;
export type InsertTacticalPlan = typeof tacticalPlans.$inferInsert;

// ==================== COACH EDUCATION ====================

// Coaching Courses
export const coachingCourses = mysqlTable("coaching_courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }), // Arabic title
  description: text("description").notNull(),
  descriptionAr: text("descriptionAr"), // Arabic description
  category: mysqlEnum("category", ["fifa_license", "laws_of_game", "tactics", "training", "youth_development", "psychology", "nutrition", "fitness"]).notNull(),
  level: mysqlEnum("level", ["grassroots", "c_license", "b_license", "a_license", "pro_license", "beginner", "intermediate", "advanced"]).notNull(),
  duration: int("duration"), // Duration in minutes
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  isPublished: boolean("isPublished").default(false).notNull(),
  order: int("order").default(0), // Display order
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachingCourse = typeof coachingCourses.$inferSelect;
export type InsertCoachingCourse = typeof coachingCourses.$inferInsert;

// Course Modules (Lessons within a course)
export const courseModules = mysqlTable("course_modules", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").references(() => coachingCourses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  videoUrl: varchar("videoUrl", { length: 500 }),
  content: text("content"), // Text content or HTML
  contentAr: text("contentAr"), // Arabic content
  duration: int("duration"), // Duration in minutes
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

// Course Enrollments
export const courseEnrollments = mysqlTable("course_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  courseId: int("courseId").references(() => coachingCourses.id).notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  progress: int("progress").default(0), // Percentage 0-100
  certificateUrl: varchar("certificateUrl", { length: 500 }),
});

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;

// Module Progress (Track which modules are completed)
export const moduleProgress = mysqlTable("module_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  moduleId: int("moduleId").references(() => courseModules.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  watchTime: int("watchTime").default(0), // Seconds watched
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = typeof moduleProgress.$inferInsert;

// Football Laws (Laws of the Game)
export const footballLaws = mysqlTable("football_laws", {
  id: int("id").autoincrement().primaryKey(),
  lawNumber: int("lawNumber").notNull(), // 1-17
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  content: text("content").notNull(), // Full law text in English
  contentAr: text("contentAr").notNull(), // Full law text in Arabic
  summary: text("summary"), // Short summary
  summaryAr: text("summaryAr"),
  diagramUrl: varchar("diagramUrl", { length: 500 }), // Illustration image
  videoUrl: varchar("videoUrl", { length: 500 }), // Explanation video
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FootballLaw = typeof footballLaws.$inferSelect;
export type InsertFootballLaw = typeof footballLaws.$inferInsert;

// Quiz Questions (for course assessments)
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").references(() => coachingCourses.id),
  moduleId: int("moduleId").references(() => courseModules.id),
  question: text("question").notNull(),
  questionAr: text("questionAr"),
  optionA: varchar("optionA", { length: 500 }),
  optionB: varchar("optionB", { length: 500 }),
  optionC: varchar("optionC", { length: 500 }),
  optionD: varchar("optionD", { length: 500 }),
  options: json("options"), // Legacy: Array of answer options
  optionsAr: json("optionsAr"), // Arabic options
  correctAnswer: varchar("correctAnswer", { length: 1 }).notNull().default('A'), // A, B, C, or D
  explanation: text("explanation"),
  explanationAr: text("explanationAr"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// Quiz Attempts
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  courseId: int("courseId").references(() => coachingCourses.id),
  moduleId: int("moduleId").references(() => courseModules.id),
  score: int("score").notNull(), // Percentage 0-100
  answers: json("answers").notNull(), // Array of user answers
  passed: boolean("passed").default(false).notNull(),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

// Coach Certificates
export const coachCertificates = mysqlTable("coach_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  courseId: int("courseId").references(() => coachingCourses.id).notNull(),
  quizAttemptId: int("quizAttemptId").references(() => quizAttempts.id).notNull(),
  certificateNumber: varchar("certificateNumber", { length: 50 }).notNull().unique(),
  certificateUrl: varchar("certificateUrl", { length: 500 }).notNull(),
  level: mysqlEnum("level", ["grassroots", "c_license", "b_license", "a_license", "pro_license"]).notNull(),
  score: int("score").notNull(), // Percentage 0-100
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Some certificates expire
  verificationCode: varchar("verificationCode", { length: 100 }).notNull().unique(), // For QR code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachCertificate = typeof coachCertificates.$inferSelect;
export type InsertCoachCertificate = typeof coachCertificates.$inferInsert;


// ==================== PLAYERMAKER INTEGRATION ====================

export const playermakerSettings = mysqlTable("playermaker_settings", {
  id: int("id").autoincrement().primaryKey(),
  clientKey: varchar("clientKey", { length: 255 }).notNull(),
  clientSecret: varchar("clientSecret", { length: 255 }).notNull(),
  clientTeamId: varchar("clientTeamId", { length: 100 }).notNull(),
  teamCode: varchar("teamCode", { length: 50 }),
  token: text("token"),
  tokenExpiresOn: bigint("tokenExpiresOn", { mode: "number" }),
  clubName: varchar("clubName", { length: 255 }),
  lastSyncAt: timestamp("lastSyncAt"),
  isActive: boolean("isActive").default(true).notNull(),
  // Auto-sync settings
  autoSyncEnabled: boolean("autoSyncEnabled").default(false),
  autoSyncFrequency: mysqlEnum("autoSyncFrequency", ["hourly", "daily", "weekly"]).default("daily"),
  nextScheduledSync: timestamp("nextScheduledSync"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayermakerSettings = typeof playermakerSettings.$inferSelect;
export type InsertPlayermakerSettings = typeof playermakerSettings.$inferInsert;

export const playermakerSessions = mysqlTable("playermaker_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull().unique(),
  season: varchar("season", { length: 50 }),
  date: date("date"),
  day: varchar("day", { length: 20 }),
  sessionType: mysqlEnum("sessionType", ["training", "match", "all"]),
  isValidated: boolean("isValidated"),
  phaseId: varchar("phaseId", { length: 100 }),
  phaseType: varchar("phaseType", { length: 100 }),
  tag: varchar("tag", { length: 255 }),
  phaseStartTime: varchar("phaseStartTime", { length: 50 }),
  phaseDuration: decimal("phaseDuration", { precision: 10, scale: 2 }), // minutes
  matchOpponent: varchar("matchOpponent", { length: 255 }),
  matchCompetition: varchar("matchCompetition", { length: 255 }),
  matchVenue: varchar("matchVenue", { length: 255 }),
  participatedPlayers: int("participatedPlayers"),
  format: varchar("format", { length: 100 }),
  intensity: varchar("intensity", { length: 50 }),
  fieldSize: varchar("fieldSize", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayermakerSession = typeof playermakerSessions.$inferSelect;
export type InsertPlayermakerSession = typeof playermakerSessions.$inferInsert;

export const playermakerPlayerMetrics = mysqlTable("playermaker_player_metrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  playerId: int("playerId").references(() => players.id),
  playermakerPlayerId: varchar("playermakerPlayerId", { length: 100 }),
  playerName: varchar("playerName", { length: 255 }),
  ageGroup: varchar("ageGroup", { length: 50 }),
  participationTime: decimal("participationTime", { precision: 10, scale: 2 }), // minutes
  
  // Ball touches
  totalTouches: int("totalTouches"),
  leftLegTouches: int("leftLegTouches"),
  rightLegTouches: int("rightLegTouches"),
  touchesPerMin: decimal("touchesPerMin", { precision: 10, scale: 2 }),
  
  // Releases
  releases: int("releases"),
  releasesLeft: int("releasesLeft"),
  releasesRight: int("releasesRight"),
  releasesPerMin: decimal("releasesPerMin", { precision: 10, scale: 2 }),
  
  // Possessions
  totalPossessions: int("totalPossessions"),
  oneTouch: int("oneTouch"),
  oneTouchLeft: int("oneTouchLeft"),
  oneTouchRight: int("oneTouchRight"),
  shortPossessions: int("shortPossessions"),
  avgTimeOnBallShort: decimal("avgTimeOnBallShort", { precision: 10, scale: 2 }),
  longPossessions: int("longPossessions"),
  avgTimeOnBallLong: decimal("avgTimeOnBallLong", { precision: 10, scale: 2 }),
  totalTimeOnBall: decimal("totalTimeOnBall", { precision: 10, scale: 2 }),
  successfulPasses: int("successfulPasses"),
  lostPossessions: int("lostPossessions"),
  regains: int("regains"),
  
  // Movement metrics
  topSpeed: decimal("topSpeed", { precision: 10, scale: 2 }), // m/s
  distanceCovered: decimal("distanceCovered", { precision: 10, scale: 2 }), // meters
  workRate: decimal("workRate", { precision: 10, scale: 2 }), // m/min
  hidCovered: decimal("hidCovered", { precision: 10, scale: 2 }), // High intensity distance
  hidPerMin: decimal("hidPerMin", { precision: 10, scale: 2 }),
  sprintDistance: decimal("sprintDistance", { precision: 10, scale: 2 }),
  sprintDistancePerMin: decimal("sprintDistancePerMin", { precision: 10, scale: 2 }),
  sprintCount: int("sprintCount"),
  
  // Speed zones (distance covered in meters)
  speedZone1: decimal("speedZone1", { precision: 10, scale: 2 }), // 0-1.5 m/s
  speedZone2: decimal("speedZone2", { precision: 10, scale: 2 }), // 1.5-2 m/s
  speedZone3: decimal("speedZone3", { precision: 10, scale: 2 }), // 2-3 m/s
  speedZone4: decimal("speedZone4", { precision: 10, scale: 2 }), // 3-4 m/s
  speedZone5: decimal("speedZone5", { precision: 10, scale: 2 }), // 4-5.5 m/s
  speedZone6: decimal("speedZone6", { precision: 10, scale: 2 }), // 5.5-7 m/s
  speedZone7: decimal("speedZone7", { precision: 10, scale: 2 }), // >7 m/s
  
  // Accelerations/Decelerations
  intenseSpeedChanges: int("intenseSpeedChanges"),
  intenseSpeedChangesPerMin: decimal("intenseSpeedChangesPerMin", { precision: 10, scale: 2 }),
  
  // Raw data JSON for additional metrics
  rawData: json("rawData"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayermakerPlayerMetrics = typeof playermakerPlayerMetrics.$inferSelect;
export type InsertPlayermakerPlayerMetrics = typeof playermakerPlayerMetrics.$inferInsert;

// Sync history for tracking all sync operations
export const playermakerSyncHistory = mysqlTable("playermaker_sync_history", {
  id: int("id").autoincrement().primaryKey(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  syncType: mysqlEnum("syncType", ["manual", "auto"]).default("manual"),
  sessionType: mysqlEnum("sessionType", ["training", "match", "all"]).default("all"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  sessionsCount: int("sessionsCount").default(0),
  metricsCount: int("metricsCount").default(0),
  success: boolean("success").default(true),
  errorMessage: text("errorMessage"),
  duration: int("duration"), // in milliseconds
});

export type PlayermakerSyncHistory = typeof playermakerSyncHistory.$inferSelect;
export type InsertPlayermakerSyncHistory = typeof playermakerSyncHistory.$inferInsert;

// Coach annotations for player performance
export const playermakerCoachAnnotations = mysqlTable("playermaker_coach_annotations", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull().references(() => players.id),
  coachId: int("coachId").notNull().references(() => users.id),
  coachName: varchar("coachName", { length: 255 }).notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayermakerCoachAnnotation = typeof playermakerCoachAnnotations.$inferSelect;
export type InsertPlayermakerCoachAnnotation = typeof playermakerCoachAnnotations.$inferInsert;


// ==================== ROLE-BASED ACCESS CONTROL (RBAC) ====================

// Custom roles that can be created by admins
export const customRoles = mysqlTable("custom_roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#3b82f6"), // hex color for UI
  isSystemRole: boolean("isSystemRole").default(false).notNull(), // true for built-in roles
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0), // for role hierarchy
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = typeof customRoles.$inferInsert;

// Available permissions in the system
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // e.g., "players.view", "training.create"
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // e.g., "Players", "Training", "Reports"
  resource: varchar("resource", { length: 50 }).notNull(), // e.g., "players", "training", "matches"
  action: mysqlEnum("action", ["view", "create", "edit", "delete", "export", "assign", "approve", "manage"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// Junction table: which permissions are assigned to which roles
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").references(() => customRoles.id, { onDelete: "cascade" }).notNull(),
  permissionId: int("permissionId").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  grantedBy: int("grantedBy").references(() => users.id),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
});

// Available tabs/pages in the system
export const tabs = mysqlTable("tabs", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // e.g., "dashboard", "players", "training"
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // icon name for UI
  path: varchar("path", { length: 200 }).notNull(), // route path
  category: varchar("category", { length: 50 }), // for grouping in UI
  displayOrder: int("displayOrder").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tab = typeof tabs.$inferSelect;
export type InsertTab = typeof tabs.$inferInsert;

// Junction table: which tabs are visible to which roles
export const roleTabs = mysqlTable("role_tabs", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").references(() => customRoles.id, { onDelete: "cascade" }).notNull(),
  tabId: int("tabId").references(() => tabs.id, { onDelete: "cascade" }).notNull(),
  displayOrder: int("displayOrder").default(0), // custom ordering per role
  assignedBy: int("assignedBy").references(() => users.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

// Junction table: which roles are assigned to which users
export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: int("roleId").references(() => customRoles.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("isPrimary").default(false), // primary role for display
  assignedBy: int("assignedBy").references(() => users.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // optional: time-based permissions
});

// Audit log for permission changes
export const permissionAuditLog = mysqlTable("permission_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["role_created", "role_updated", "role_deleted", "permission_granted", "permission_revoked", "tab_assigned", "tab_removed", "user_role_assigned", "user_role_removed"]).notNull(),
  performedBy: int("performedBy").references(() => users.id).notNull(),
  targetUserId: int("targetUserId").references(() => users.id),
  targetRoleId: int("targetRoleId").references(() => customRoles.id),
  targetPermissionId: int("targetPermissionId").references(() => permissions.id),
  targetTabId: int("targetTabId").references(() => tabs.id),
  details: json("details"), // additional context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PermissionAuditLog = typeof permissionAuditLog.$inferSelect;
export type InsertPermissionAuditLog = typeof permissionAuditLog.$inferInsert;


// ==================== AI RESPONSE CACHE ====================

export const aiResponseCache = mysqlTable("ai_response_cache", {
  id: int("id").autoincrement().primaryKey(),
  cacheKey: varchar("cache_key", { length: 255 }).notNull().unique(),
  functionName: varchar("function_name", { length: 100 }).notNull(),
  requestParams: json("request_params"), // Store input parameters as JSON
  response: text("response").notNull(), // Store AI response
  contextData: json("context_data"), // Store any relevant context
  userId: int("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  hitCount: int("hit_count").default(0).notNull(), // Track cache usage
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
});

export type AIResponseCache = typeof aiResponseCache.$inferSelect;
export type InsertAIResponseCache = typeof aiResponseCache.$inferInsert;


// ==================== HOME PAGE CONTENT ====================

export const homePageContent = mysqlTable("home_page_content", {
  id: int("id").autoincrement().primaryKey(),
  sectionType: mysqlEnum("section_type", ["hero", "features", "gallery", "video", "testimonials", "stats", "pricing", "team", "events", "training"]).notNull(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  content: text("content"),
  ctaText: varchar("cta_text", { length: 100 }),
  ctaLink: varchar("cta_link", { length: 255 }),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  displayOrder: int("display_order").default(0),
  isActive: boolean("is_active").default(true),
  metadata: json("metadata"), // For additional flexible data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HomePageContent = typeof homePageContent.$inferSelect;
export type InsertHomePageContent = typeof homePageContent.$inferInsert;


// ==================== BADGES & ACHIEVEMENTS ====================

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Icon name from lucide-react
  category: mysqlEnum("category", ["completion", "excellence", "mastery", "milestone", "education", "performance"]).notNull(),
  criteria: json("criteria").notNull(), // Flexible criteria definition
  displayOrder: int("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id).notNull(),
  badgeId: int("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  progress: int("progress").default(0), // For tracking progress toward badge
  metadata: json("metadata"), // Additional context about how badge was earned
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;


// Weekly Challenges
export const challenges = mysqlTable('challenges', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: mysqlEnum('type', ['quiz_streak', 'perfect_score', 'multiple_courses', 'high_average']).notNull(),
  criteria: json('criteria').notNull(), // { count: number, threshold: number, etc. }
  reward: json('reward').notNull(), // { type: 'badge' | 'points', value: string | number }
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const userChallenges = mysqlTable('user_challenges', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: int('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  progress: int('progress').default(0), // Current progress towards goal
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  rewardClaimed: boolean('reward_claimed').default(false),
  claimedAt: timestamp('claimed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});


// Notifications

// ==================== DAILY STREAK TRACKER ====================

export const userStreaks = mysqlTable('user_streaks', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: int('current_streak').default(0).notNull(),
  longestStreak: int('longest_streak').default(0).notNull(),
  lastLoginDate: date('last_login_date').notNull(),
  totalLogins: int('total_logins').default(0).notNull(),
  freezesUsed: int('freezes_used').default(0).notNull(), // Number of streak freezes used
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const streakRewards = mysqlTable('streak_rewards', {
  id: int('id').primaryKey().autoincrement(),
  streakDays: int('streak_days').notNull().unique(),
  rewardType: mysqlEnum('reward_type', ['badge', 'points', 'certificate']).notNull(),
  rewardValue: varchar('reward_value', { length: 255 }).notNull(),
  badgeId: int('badge_id').references(() => badges.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Training Exercises Library
export const trainingExercises = mysqlTable('training_exercises', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: mysqlEnum('category', ['warm-up', 'technical', 'tactical', 'physical', 'cool-down']).notNull(),
  difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']).notNull(),
  duration: int('duration').notNull(), // in minutes
  videoUrl: varchar('video_url', { length: 500 }),
  equipment: json('equipment'), // Array of equipment needed
  objectives: json('objectives'), // Array of learning objectives
  instructions: text('instructions'),
  variations: text('variations'),
  coachingPoints: json('coaching_points'), // Array of key coaching points
  ageGroup: varchar('age_group', { length: 50 }),
  playerCount: varchar('player_count', { length: 50 }),
  spaceRequired: varchar('space_required', { length: 100 }),
  createdBy: int('created_by').references(() => users.id),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const trainingPlans = mysqlTable('training_plans', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  level: mysqlEnum('level', ['beginner', 'intermediate', 'advanced']).notNull(),
  duration: int('duration').notNull(), // total duration in minutes
  focus: varchar('focus', { length: 100 }), // main focus area
  exercises: json('exercises').notNull(), // Array of { exerciseId, order, duration }
  createdBy: int('created_by').references(() => users.id),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const exerciseFavorites = mysqlTable('exercise_favorites', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: int('exercise_id').notNull().references(() => trainingExercises.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});

// ==================== COMMUNITY FORUM ====================

export const forumCategories = mysqlTable('forum_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  postCount: int('post_count').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

export const forumPosts = mysqlTable('forum_posts', {
  id: int('id').primaryKey().autoincrement(),
  categoryId: int('category_id').notNull().references(() => forumCategories.id, { onDelete: 'cascade' }),
  authorId: int('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  postType: mysqlEnum('post_type', ['question', 'discussion', 'tip', 'success_story']).default('discussion'),
  tags: json('tags'), // Array of tags
  upvotes: int('upvotes').default(0),
  downvotes: int('downvotes').default(0),
  replyCount: int('reply_count').default(0),
  viewCount: int('view_count').default(0),
  hasAcceptedAnswer: boolean('has_accepted_answer').default(false),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const forumReplies = mysqlTable('forum_replies', {
  id: int('id').primaryKey().autoincrement(),
  postId: int('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  authorId: int('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  upvotes: int('upvotes').default(0),
  downvotes: int('downvotes').default(0),
  isBestAnswer: boolean('is_best_answer').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const forumVotes = mysqlTable('forum_votes', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: mysqlEnum('target_type', ['post', 'reply']).notNull(),
  targetId: int('target_id').notNull(),
  voteType: mysqlEnum('vote_type', ['upvote', 'downvote']).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const userReputation = mysqlTable('user_reputation', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reputation: int('reputation').default(0),
  postsCount: int('posts_count').default(0),
  repliesCount: int('replies_count').default(0),
  bestAnswersCount: int('best_answers_count').default(0),
  upvotesReceived: int('upvotes_received').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});


// ==================== LIVE MATCH MODE ====================

export const liveMatches = mysqlTable("live_matches", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").references(() => matches.id),
  teamId: int("teamId").references(() => teams.id).notNull(),
  opponent: varchar("opponent", { length: 200 }).notNull(),
  opponentFormation: varchar("opponentFormation", { length: 20 }),
  currentFormation: varchar("currentFormation", { length: 20 }).notNull(),
  currentMinute: int("currentMinute").default(0),
  homeScore: int("homeScore").default(0),
  awayScore: int("awayScore").default(0),
  isHome: boolean("isHome").default(true),
  status: mysqlEnum("status", ["not_started", "first_half", "half_time", "second_half", "extra_time", "finished"]).default("not_started"),
  startedAt: timestamp("startedAt"),
  pausedAt: timestamp("pausedAt"),
  finishedAt: timestamp("finishedAt"),
  // Live statistics
  possession: int("possession").default(50), // percentage
  shots: int("shots").default(0),
  shotsOnTarget: int("shotsOnTarget").default(0),
  corners: int("corners").default(0),
  fouls: int("fouls").default(0),
  offsides: int("offsides").default(0),
  yellowCards: int("yellowCards").default(0),
  redCards: int("redCards").default(0),
  // Opponent stats
  opponentShots: int("opponentShots").default(0),
  opponentShotsOnTarget: int("opponentShotsOnTarget").default(0),
  opponentCorners: int("opponentCorners").default(0),
  opponentFouls: int("opponentFouls").default(0),
  substitutionsUsed: int("substitutionsUsed").default(0),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveMatch = typeof liveMatches.$inferSelect;
export type InsertLiveMatch = typeof liveMatches.$inferInsert;

export const matchEvents = mysqlTable("match_events", {
  id: int("id").autoincrement().primaryKey(),
  liveMatchId: int("liveMatchId").references(() => liveMatches.id).notNull(),
  eventType: mysqlEnum("eventType", ["goal", "yellow_card", "red_card", "substitution", "injury", "penalty", "own_goal", "var_decision"]).notNull(),
  minute: int("minute").notNull(),
  playerId: int("playerId").references(() => players.id),
  playerName: varchar("playerName", { length: 200 }),
  assistPlayerId: int("assistPlayerId").references(() => players.id),
  assistPlayerName: varchar("assistPlayerName", { length: 200 }),
  substitutedPlayerId: int("substitutedPlayerId").references(() => players.id),
  substitutedPlayerName: varchar("substitutedPlayerName", { length: 200 }),
  isOurTeam: boolean("isOurTeam").default(true),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchEvent = typeof matchEvents.$inferSelect;
export type InsertMatchEvent = typeof matchEvents.$inferInsert;

export const tacticalChanges = mysqlTable("tactical_changes", {
  id: int("id").autoincrement().primaryKey(),
  liveMatchId: int("liveMatchId").references(() => liveMatches.id).notNull(),
  minute: int("minute").notNull(),
  changeType: mysqlEnum("changeType", ["formation", "instruction", "player_role", "pressing_intensity", "defensive_line"]).notNull(),
  fromValue: varchar("fromValue", { length: 100 }),
  toValue: varchar("toValue", { length: 100 }).notNull(),
  reason: text("reason"),
  aiSuggested: boolean("aiSuggested").default(false),
  effectivenessRating: int("effectivenessRating"), // 1-10, rated post-match
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TacticalChange = typeof tacticalChanges.$inferSelect;
export type InsertTacticalChange = typeof tacticalChanges.$inferInsert;


// ==================== PLAYER POSITION TRACKING ====================

export const playerPositions = mysqlTable("player_positions", {
  id: int("id").autoincrement().primaryKey(),
  liveMatchId: int("liveMatchId").references(() => liveMatches.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  minute: int("minute").notNull(),
  xPosition: int("xPosition").notNull(), // 0-100 (percentage of pitch width)
  yPosition: int("yPosition").notNull(), // 0-100 (percentage of pitch length)
  speed: int("speed").default(0), // km/h * 10
  heartRate: int("heartRate"), // bpm
  source: mysqlEnum("source", ["manual", "gps", "video_analysis"]).default("manual"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerPosition = typeof playerPositions.$inferSelect;
export type InsertPlayerPosition = typeof playerPositions.$inferInsert;

export const gpsLiveSync = mysqlTable("gps_live_sync", {
  id: int("id").autoincrement().primaryKey(),
  liveMatchId: int("liveMatchId").references(() => liveMatches.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  deviceId: varchar("deviceId", { length: 100 }),
  lastSyncTime: timestamp("lastSyncTime").notNull(),
  syncStatus: mysqlEnum("syncStatus", ["active", "paused", "stopped", "error"]).default("active"),
  dataPoints: int("dataPoints").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GpsLiveSync = typeof gpsLiveSync.$inferSelect;
export type InsertGpsLiveSync = typeof gpsLiveSync.$inferInsert;


// ==================== POST-MATCH REPORTS ====================

export const postMatchReports = mysqlTable("post_match_reports", {
  id: int("id").autoincrement().primaryKey(),
  liveMatchId: int("liveMatchId").references(() => liveMatches.id).notNull(),
  matchId: int("matchId").references(() => matches.id),
  
  // AI-generated content
  matchSummary: text("matchSummary"), // Overall match summary
  tacticalAnalysis: text("tacticalAnalysis"), // Tactical insights
  keyMoments: text("keyMoments"), // Critical moments analysis
  playerPerformances: text("playerPerformances"), // Individual player analysis
  recommendations: text("recommendations"), // Future recommendations
  
  // Metadata
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy").references(() => users.id),
  reportType: mysqlEnum("reportType", ["auto", "manual", "hybrid"]).default("auto"),
  status: mysqlEnum("status", ["draft", "final", "archived"]).default("final"),
  
  // Export tracking
  exportedToPdf: boolean("exportedToPdf").default(false),
  emailedTo: text("emailedTo"), // JSON array of email addresses
  lastExportedAt: timestamp("lastExportedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostMatchReport = typeof postMatchReports.$inferSelect;
export type InsertPostMatchReport = typeof postMatchReports.$inferInsert;

// ==================== TESTIMONIALS ====================

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }), // e.g., "Parent", "Player", "Coach"
  avatarUrl: text("avatarUrl"),
  rating: int("rating").notNull(), // 1-5 stars
  testimonial: text("testimonial").notNull(),
  isApproved: boolean("isApproved").default(false),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;



// ==================== PROGRESS REPORT HISTORY ====================

export const progressReportHistory = mysqlTable("progress_report_history", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  reportDate: date("reportDate").notNull(),
  reportType: mysqlEnum("reportType", ["weekly", "monthly", "quarterly", "annual", "custom"]).notNull(),
  reportPeriodStart: date("reportPeriodStart").notNull(),
  reportPeriodEnd: date("reportPeriodEnd").notNull(),
  
  // Performance Summary
  overallRating: int("overallRating").default(0), // 0-100
  technicalRating: int("technicalRating").default(0),
  physicalRating: int("physicalRating").default(0),
  tacticalRating: int("tacticalRating").default(0),
  mentalRating: int("mentalRating").default(0),
  
  // Statistics
  matchesPlayed: int("matchesPlayed").default(0),
  trainingAttendance: int("trainingAttendance").default(0), // percentage
  goalsScored: int("goalsScored").default(0),
  assists: int("assists").default(0),
  
  // Coach Comments
  coachComments: text("coachComments"),
  strengths: text("strengths"),
  areasForImprovement: text("areasForImprovement"),
  recommendations: text("recommendations"),
  
  // Report Files
  pdfUrl: text("pdfUrl"),
  generatedBy: int("generatedBy").references(() => users.id),
  emailSent: boolean("emailSent").default(false),
  emailSentAt: timestamp("emailSentAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProgressReportHistory = typeof progressReportHistory.$inferSelect;
export type InsertProgressReportHistory = typeof progressReportHistory.$inferInsert;

// ==================== PARENT-COACH CONVERSATIONS ====================

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  parentUserId: int("parentUserId").references(() => users.id).notNull(),
  coachUserId: int("coachUserId").references(() => users.id).notNull(),
  playerId: int("playerId").references(() => players.id), // Optional: conversation about specific player
  subject: varchar("subject", { length: 255 }),
  status: mysqlEnum("status", ["active", "archived", "closed"]).default("active"),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ==================== MESSAGES ====================

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").references(() => conversations.id).notNull(),
  senderUserId: int("senderUserId").references(() => users.id).notNull(),
  messageText: text("messageText").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentType: mysqlEnum("attachmentType", ["image", "pdf", "video", "document"]),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ==================== NOTIFICATION PREFERENCES ====================

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull().unique(),
  
  // Email Notifications
  emailEnabled: boolean("emailEnabled").default(true),
  emailReports: boolean("emailReports").default(true),
  emailMessages: boolean("emailMessages").default(true),
  emailBookings: boolean("emailBookings").default(true),
  emailAnnouncements: boolean("emailAnnouncements").default(true),
  
  // Push/In-App Notifications
  pushEnabled: boolean("pushEnabled").default(true),
  pushMessages: boolean("pushMessages").default(true),
  pushBookings: boolean("pushBookings").default(true),
  pushReports: boolean("pushReports").default(true),
  
  // WhatsApp Notifications
  whatsappEnabled: boolean("whatsappEnabled").default(false),
  whatsappMessages: boolean("whatsappMessages").default(false),
  whatsappBookings: boolean("whatsappBookings").default(false),
  
  // Sound & Visual
  soundEnabled: boolean("soundEnabled").default(true),
  desktopNotifications: boolean("desktopNotifications").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// ==================== BLOG POSTS ====================

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: int("authorId").references(() => users.id).notNull(),
  category: mysqlEnum("category", ["news", "training", "events", "achievements", "general"]).default("general"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft"),
  publishedAt: timestamp("publishedAt"),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ==================== ACADEMY ENROLLMENT SUBMISSIONS ====================

export const enrollmentSubmissions = mysqlTable("enrollment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Student Information
  studentFirstName: varchar("studentFirstName", { length: 100 }).notNull(),
  studentLastName: varchar("studentLastName", { length: 100 }).notNull(),
  dateOfBirth: date("dateOfBirth").notNull(),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  
  // Parent/Guardian Information
  parentFirstName: varchar("parentFirstName", { length: 100 }).notNull(),
  parentLastName: varchar("parentLastName", { length: 100 }).notNull(),
  parentEmail: varchar("parentEmail", { length: 255 }).notNull(),
  parentPhone: varchar("parentPhone", { length: 50 }).notNull(),
  
  // Program Selection
  program: mysqlEnum("program", ["beginner", "intermediate", "advanced", "elite"]).notNull(),
  ageGroup: varchar("ageGroup", { length: 50 }).notNull(),
  preferredPosition: mysqlEnum("preferredPosition", ["goalkeeper", "defender", "midfielder", "forward", "any"]).default("any"),
  
  // Additional Information
  previousExperience: text("previousExperience"),
  medicalConditions: text("medicalConditions"),
  emergencyContact: varchar("emergencyContact", { length: 50 }),
  
  // Documents
  birthCertificateUrl: varchar("birthCertificateUrl", { length: 500 }),
  medicalCertificateUrl: varchar("medicalCertificateUrl", { length: 500 }),
  photoIdUrl: varchar("photoIdUrl", { length: 500 }),
  
  // Team Assignment
  teamId: int("teamId").references(() => teams.id),

  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected", "contacted"]).default("pending"),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnrollmentSubmission = typeof enrollmentSubmissions.$inferSelect;
export type InsertEnrollmentSubmission = typeof enrollmentSubmissions.$inferInsert;

// ==================== NEW FEATURES (Phase 100) ====================

// ==================== QR CODE CHECK-IN SYSTEM ====================

export const qrCheckIns = mysqlTable("qr_check_ins", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  sessionId: int("sessionId"), // references training_sessions
  checkInTime: timestamp("checkInTime").defaultNow().notNull(),
  checkOutTime: timestamp("checkOutTime"),
  qrCode: varchar("qrCode", { length: 255 }).notNull(), // unique QR code for session
  location: varchar("location", { length: 255 }), // training location
  status: mysqlEnum("status", ["checked_in", "checked_out", "absent"]).default("checked_in"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QRCheckIn = typeof qrCheckIns.$inferSelect;
export type InsertQRCheckIn = typeof qrCheckIns.$inferInsert;

// ==================== SOCIAL MEDIA AUTO-POSTING ====================

export const socialMediaPosts = mysqlTable("social_media_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(), // who created the post
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mediaUrls: json("mediaUrls").$type<string[]>(), // array of image/video URLs
  platforms: json("platforms").$type<string[]>(), // ["instagram", "facebook", "twitter"]
  scheduledAt: timestamp("scheduledAt"), // when to post (null = immediate)
  postedAt: timestamp("postedAt"), // when actually posted
  status: mysqlEnum("status", ["draft", "scheduled", "posted", "failed"]).default("draft"),
  platformPostIds: json("platformPostIds").$type<Record<string, string>>(), // {instagram: "id", facebook: "id"}
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = typeof socialMediaPosts.$inferInsert;

export const socialMediaAccounts = mysqlTable("social_media_accounts", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["instagram", "facebook", "twitter", "linkedin"]).notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accessToken: text("accessToken").notNull(), // encrypted
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== EMAIL DRIP CAMPAIGNS ====================

export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAudience: mysqlEnum("targetAudience", ["new_players", "new_parents", "all_players", "all_parents", "coaches", "custom"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft"),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").references(() => emailCampaigns.id).notNull(),
  sequenceNumber: int("sequenceNumber").notNull(), // order in drip sequence
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  plainTextContent: text("plainTextContent"),
  delayDays: int("delayDays").default(0), // days after previous email or trigger
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export const emailSends = mysqlTable("email_sends", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").references(() => emailTemplates.id).notNull(),
  recipientUserId: int("recipientUserId").references(() => users.id).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  status: mysqlEnum("status", ["scheduled", "sent", "delivered", "opened", "clicked", "bounced", "failed"]).default("scheduled"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailSend = typeof emailSends.$inferSelect;
export type InsertEmailSend = typeof emailSends.$inferInsert;

// ==================== REFERRAL PROGRAM ====================

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerUserId: int("referrerUserId").references(() => users.id).notNull(), // who referred
  referredUserId: int("referredUserId").references(() => users.id), // who was referred (null until they sign up)
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  referredEmail: varchar("referredEmail", { length: 320 }), // email used for referral
  referredName: varchar("referredName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "signed_up", "completed", "rewarded"]).default("pending"),
  rewardType: mysqlEnum("rewardType", ["discount", "free_session", "points", "cash"]),
  rewardValue: varchar("rewardValue", { length: 100 }), // "20%", "1 session", "100 points", "$50"
  rewardClaimed: boolean("rewardClaimed").default(false),
  rewardClaimedAt: timestamp("rewardClaimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

export const referralRewards = mysqlTable("referral_rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  referralId: int("referralId").references(() => referrals.id).notNull(),
  rewardType: mysqlEnum("rewardType", ["discount", "free_session", "points", "cash"]).notNull(),
  rewardValue: varchar("rewardValue", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "claimed", "expired"]).default("pending"),
  expiresAt: timestamp("expiresAt"),
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;

// ==================== AI SCOUT NETWORK ====================

export const scoutReports = mysqlTable("scout_reports", {
  id: int("id").autoincrement().primaryKey(),
  scoutUserId: int("scoutUserId").references(() => users.id).notNull(), // scout who created report
  playerName: varchar("playerName", { length: 255 }).notNull(),
  playerAge: int("playerAge"),
  playerPosition: varchar("playerPosition", { length: 50 }),
  currentClub: varchar("currentClub", { length: 255 }),
  location: varchar("location", { length: 255 }), // city, country
  videoUrl: text("videoUrl"), // uploaded video for AI analysis
  // AI-generated scores (0-100)
  technicalScore: int("technicalScore"),
  physicalScore: int("physicalScore"),
  tacticalScore: int("tacticalScore"),
  mentalScore: int("mentalScore"),
  overallScore: int("overallScore"),
  // Detailed metrics (20 categories)
  ballControl: int("ballControl"),
  passing: int("passing"),
  shooting: int("shooting"),
  dribbling: int("dribbling"),
  firstTouch: int("firstTouch"),
  speed: int("speed"),
  acceleration: int("acceleration"),
  agility: int("agility"),
  stamina: int("stamina"),
  strength: int("strength"),
  positioning: int("positioning"),
  vision: int("vision"),
  decisionMaking: int("decisionMaking"),
  workRate: int("workRate"),
  teamwork: int("teamwork"),
  leadership: int("leadership"),
  composure: int("composure"),
  determination: int("determination"),
  creativity: int("creativity"),
  defensiveAbility: int("defensiveAbility"),
  // AI analysis
  aiAnalysis: text("aiAnalysis"), // detailed AI commentary
  strengths: json("strengths").$type<string[]>(),
  weaknesses: json("weaknesses").$type<string[]>(),
  recommendations: text("recommendations"),
  potentialLevel: mysqlEnum("potentialLevel", ["elite", "high", "medium", "low"]),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "approved", "rejected"]).default("draft"),
  visibility: mysqlEnum("visibility", ["private", "network", "public"]).default("private"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoutReport = typeof scoutReports.$inferSelect;
export type InsertScoutReport = typeof scoutReports.$inferInsert;

// ==================== NUTRITION AI ====================

export const mealLogs = mysqlTable("meal_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  playerId: int("playerId").references(() => players.id),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"]).notNull(),
  mealDate: date("mealDate").notNull(),
  mealTime: timestamp("mealTime").notNull(),
  photoUrl: text("photoUrl"), // uploaded meal photo
  // AI-recognized food items
  recognizedFoods: json("recognizedFoods").$type<Array<{
    name: string;
    confidence: number;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>>(),
  // Totals
  totalCalories: int("totalCalories"),
  totalProtein: int("totalProtein"), // grams
  totalCarbs: int("totalCarbs"), // grams
  totalFat: int("totalFat"), // grams
  // AI analysis
  aiAnalysis: text("aiAnalysis"),
  nutritionScore: int("nutritionScore"), // 0-100
  recommendations: text("recommendations"),
  alignsWithPlan: boolean("alignsWithPlan"), // matches their nutrition plan?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

// ==================== INJURY PREVENTION AI ====================

export const injuryRiskAssessments = mysqlTable("injury_risk_assessments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  assessmentDate: date("assessmentDate").notNull(),
  // Training load data (last 7-28 days)
  acuteWorkload: int("acuteWorkload"), // last 7 days total minutes
  chronicWorkload: int("chronicWorkload"), // last 28 days average
  acuteChronicRatio: int("acuteChronicRatio"), // * 100 for decimal (e.g., 1.25 = 125)
  // Recent performance data
  recentTrainingSessions: int("recentTrainingSessions"),
  recentMatchMinutes: int("recentMatchMinutes"),
  recentHighIntensityMinutes: int("recentHighIntensityMinutes"),
  // Recovery metrics
  daysSinceLastMatch: int("daysSinceLastMatch"),
  daysSinceLastTraining: int("daysSinceLastTraining"),
  sleepQualityScore: int("sleepQualityScore"), // 0-100
  fatigueLevel: int("fatigueLevel"), // 0-100
  musclesSoreness: int("musclesSoreness"), // 0-100
  // AI predictions
  overallRiskScore: int("overallRiskScore"), // 0-100 (higher = more risk)
  riskLevel: mysqlEnum("riskLevel", ["low", "moderate", "high", "critical"]),
  predictedInjuryTypes: json("predictedInjuryTypes").$type<Array<{
    type: string;
    probability: number;
    bodyPart: string;
  }>>(),
  // Recommendations
  recommendedRestDays: int("recommendedRestDays"),
  recommendedTrainingLoad: int("recommendedTrainingLoad"), // percentage of normal
  specificRecommendations: json("specificRecommendations").$type<string[]>(),
  aiAnalysis: text("aiAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InjuryRiskAssessment = typeof injuryRiskAssessments.$inferSelect;
export type InsertInjuryRiskAssessment = typeof injuryRiskAssessments.$inferInsert;

// ==================== PARENT EDUCATION ACADEMY ====================

export const educationCourses = mysqlTable("education_courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["sports_psychology", "nutrition", "injury_prevention", "youth_development", "parenting", "general"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  duration: int("duration"), // minutes
  thumbnailUrl: text("thumbnailUrl"),
  instructorName: varchar("instructorName", { length: 255 }),
  instructorBio: text("instructorBio"),
  isPublished: boolean("isPublished").default(false),
  enrollmentCount: int("enrollmentCount").default(0),
  rating: int("rating").default(0), // * 10 for decimal (e.g., 4.5 = 45)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EducationCourse = typeof educationCourses.$inferSelect;
export type InsertEducationCourse = typeof educationCourses.$inferInsert;

export const courseLessons = mysqlTable("course_lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").references(() => educationCourses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sequenceNumber: int("sequenceNumber").notNull(),
  contentType: mysqlEnum("contentType", ["video", "article", "quiz", "assignment"]).notNull(),
  videoUrl: text("videoUrl"),
  articleContent: text("articleContent"),
  duration: int("duration"), // minutes
  isPreview: boolean("isPreview").default(false), // can be viewed without enrollment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;

export const parentEducationEnrollments = mysqlTable("parent_education_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  courseId: int("courseId").references(() => educationCourses.id).notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  progress: int("progress").default(0), // percentage
  certificateUrl: text("certificateUrl"),
  lastAccessedAt: timestamp("lastAccessedAt"),
});

export type ParentEducationEnrollment = typeof parentEducationEnrollments.$inferSelect;
export type InsertParentEducationEnrollment = typeof parentEducationEnrollments.$inferInsert;

export const parentLessonProgress = mysqlTable("parent_lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").references(() => parentEducationEnrollments.id).notNull(),
  lessonId: int("lessonId").references(() => courseLessons.id).notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completedAt"),
  timeSpent: int("timeSpent"), // seconds
  lastPosition: int("lastPosition"), // for video playback resume
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentLessonProgress = typeof parentLessonProgress.$inferSelect;
export type InsertParentLessonProgress = typeof parentLessonProgress.$inferInsert;

// ==================== VR TRAINING MODULES ====================

export const vrScenarios = mysqlTable("vr_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  scenarioType: mysqlEnum("scenarioType", ["1v1", "2v2", "3v3", "tactical_positioning", "set_piece", "decision_making", "skill_drill"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "expert"]).default("beginner"),
  duration: int("duration"), // minutes
  thumbnailUrl: text("thumbnailUrl"),
  vrFileUrl: text("vrFileUrl"), // URL to VR scenario file
  requiredEquipment: json("requiredEquipment").$type<string[]>(), // ["Meta Quest 3", "controllers"]
  objectives: json("objectives").$type<string[]>(),
  metrics: json("metrics").$type<string[]>(), // what gets measured
  isPublished: boolean("isPublished").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VRScenario = typeof vrScenarios.$inferSelect;
export type InsertVRScenario = typeof vrScenarios.$inferInsert;

export const vrSessions = mysqlTable("vr_sessions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  scenarioId: int("scenarioId").references(() => vrScenarios.id).notNull(),
  sessionDate: timestamp("sessionDate").defaultNow().notNull(),
  duration: int("duration"), // seconds
  // Performance metrics
  score: int("score"), // 0-100
  accuracy: int("accuracy"), // percentage
  reactionTime: int("reactionTime"), // milliseconds average
  decisionsCorrect: int("decisionsCorrect"),
  decisionsTotal: int("decisionsTotal"),
  // Detailed metrics (JSON)
  detailedMetrics: json("detailedMetrics").$type<Record<string, any>>(),
  // AI analysis
  aiAnalysis: text("aiAnalysis"),
  strengths: json("strengths").$type<string[]>(),
  areasForImprovement: json("areasForImprovement").$type<string[]>(),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VRSession = typeof vrSessions.$inferSelect;
export type InsertVRSession = typeof vrSessions.$inferInsert;


// ==================== CAREER APPLICATIONS ====================

export const careerApplications = mysqlTable("career_applications", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  position: mysqlEnum("position", ["football_coach", "fitness_coach", "goalkeeper_coach", "sports_psychologist", "analyst", "physiotherapist", "other"]).notNull(),
  yearsExperience: int("yearsExperience").notNull(),
  qualifications: text("qualifications").notNull(),
  previousClubs: text("previousClubs"),
  cvUrl: text("cvUrl"),
  coverLetter: text("coverLetter"),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  status: mysqlEnum("status", ["pending", "reviewing", "shortlisted", "interviewed", "accepted", "rejected"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CareerApplication = typeof careerApplications.$inferSelect;
export type InsertCareerApplication = typeof careerApplications.$inferInsert;

// ==================== COACH EVALUATIONS ====================
export const coachEvaluations = mysqlTable("coach_evaluations", {
  id: int("id").primaryKey().autoincrement(),
  coachUserId: int("coachUserId").notNull().references(() => users.id),
  evaluatedBy: int("evaluatedBy").notNull().references(() => users.id),
  sessionQuality: int("sessionQuality").notNull(),
  playerEngagement: int("playerEngagement").notNull(),
  technicalKnowledge: int("technicalKnowledge").notNull(),
  communication: int("communication").notNull(),
  punctuality: int("punctuality").notNull(),
  overallScore: int("overallScore").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CoachEvaluation = typeof coachEvaluations.$inferSelect;
export type InsertCoachEvaluation = typeof coachEvaluations.$inferInsert;

// ==================== PLAYER MEDICAL DATA ====================
export const playerMedicalData = mysqlTable("player_medical_data", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("playerId").notNull().references(() => players.id),
  height: varchar("height", { length: 10 }),
  weight: varchar("weight", { length: 10 }),
  bmi: varchar("bmi", { length: 10 }),
  bodyFatPercent: varchar("bodyFatPercent", { length: 10 }),
  muscleMassKg: varchar("muscleMassKg", { length: 10 }),
  restingHR: int("restingHR"),
  bloodPressure: varchar("bloodPressure", { length: 20 }),
  injuryRiskScore: int("injuryRiskScore"),
  dominantFoot: mysqlEnum("dominantFoot", ["right", "left", "both"]).default("right"),
  bloodType: varchar("bloodType", { length: 5 }),
  allergies: text("allergies"),
  chronicConditions: text("chronicConditions"),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerMedicalData = typeof playerMedicalData.$inferSelect;
export type InsertPlayerMedicalData = typeof playerMedicalData.$inferInsert;

// ==================== PLAYER PHYSICAL TESTS ====================
export const playerPhysicalTests = mysqlTable("player_physical_tests", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("playerId").notNull().references(() => players.id),
  testDate: timestamp("testDate").defaultNow().notNull(),
  sprint10m: varchar("sprint10m", { length: 10 }),
  sprint30m: varchar("sprint30m", { length: 10 }),
  sprintMax: varchar("sprintMax", { length: 10 }),
  verticalJump: varchar("verticalJump", { length: 10 }),
  broadJump: varchar("broadJump", { length: 10 }),
  benchPress: varchar("benchPress", { length: 10 }),
  squat: varchar("squat", { length: 10 }),
  vo2Max: varchar("vo2Max", { length: 10 }),
  beepTestLevel: varchar("beepTestLevel", { length: 10 }),
  sitAndReach: varchar("sitAndReach", { length: 10 }),
  shoulderFlexibility: varchar("shoulderFlexibility", { length: 10 }),
  agilityT: varchar("agilityT", { length: 10 }),
  illinois: varchar("illinois", { length: 10 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlayerPhysicalTest = typeof playerPhysicalTests.$inferSelect;
export type InsertPlayerPhysicalTest = typeof playerPhysicalTests.$inferInsert;

// ==================== PLAYER MUSCLE MEASUREMENTS ====================
export const playerMuscleMeasurements = mysqlTable("player_muscle_measurements", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("playerId").notNull().references(() => players.id),
  measurementDate: timestamp("measurementDate").defaultNow().notNull(),
  leftQuad: varchar("leftQuad", { length: 10 }),
  rightQuad: varchar("rightQuad", { length: 10 }),
  leftHamstring: varchar("leftHamstring", { length: 10 }),
  rightHamstring: varchar("rightHamstring", { length: 10 }),
  leftCalf: varchar("leftCalf", { length: 10 }),
  rightCalf: varchar("rightCalf", { length: 10 }),
  leftBicep: varchar("leftBicep", { length: 10 }),
  rightBicep: varchar("rightBicep", { length: 10 }),
  chest: varchar("chest", { length: 10 }),
  waist: varchar("waist", { length: 10 }),
  hip: varchar("hip", { length: 10 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlayerMuscleMeasurement = typeof playerMuscleMeasurements.$inferSelect;
export type InsertPlayerMuscleMeasurement = typeof playerMuscleMeasurements.$inferInsert;

// ==================== PLAYER BLOOD MARKERS ====================
export const playerBloodMarkers = mysqlTable("player_blood_markers", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("playerId").notNull().references(() => players.id),
  testDate: timestamp("testDate").defaultNow().notNull(),
  ferritin: varchar("ferritin", { length: 10 }),
  hemoglobin: varchar("hemoglobin", { length: 10 }),
  creatineKinase: varchar("creatineKinase", { length: 10 }),
  testosterone: varchar("testosterone", { length: 10 }),
  cortisol: varchar("cortisol", { length: 10 }),
  vitaminD: varchar("vitaminD", { length: 10 }),
  vitaminB12: varchar("vitaminB12", { length: 10 }),
  magnesium: varchar("magnesium", { length: 10 }),
  sodium: varchar("sodium", { length: 10 }),
  potassium: varchar("potassium", { length: 10 }),
  glucose: varchar("glucose", { length: 10 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlayerBloodMarker = typeof playerBloodMarkers.$inferSelect;
export type InsertPlayerBloodMarker = typeof playerBloodMarkers.$inferInsert;

// ==================== PLAYER TRAINING LOAD ====================
export const playerTrainingLoad = mysqlTable("player_training_load", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("playerId").notNull().references(() => players.id),
  weekStart: timestamp("weekStart").notNull(),
  acuteLoad: int("acuteLoad"),
  chronicLoad: int("chronicLoad"),
  acRatio: varchar("acRatio", { length: 10 }),
  riskLevel: mysqlEnum("riskLevel", ["low", "moderate", "high", "very_high"]).default("low"),
  sessionsCount: int("sessionsCount"),
  totalMinutes: int("totalMinutes"),
  rpe: int("rpe"),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlayerTrainingLoad = typeof playerTrainingLoad.$inferSelect;
export type InsertPlayerTrainingLoad = typeof playerTrainingLoad.$inferInsert;

// ==================== TRAINING SESSION PERFORMANCE ====================
export const trainingSessionPerformance = mysqlTable("training_session_performance", {
  id: int("id").primaryKey().autoincrement(),
  playerId: int("playerId").notNull().references(() => players.id),
  teamId: int("teamId").references(() => teams.id),
  sessionDate: timestamp("sessionDate").defaultNow().notNull(),
  sessionName: varchar("sessionName", { length: 255 }),
  recordedBy: int("recordedBy").references(() => users.id),
  physicalScore: int("physicalScore"),
  speed: int("speed"),
  endurance: int("endurance"),
  strength: int("strength"),
  agility: int("agility"),
  technicalScore: int("technicalScore"),
  passing: int("passing"),
  shooting: int("shooting"),
  dribbling: int("dribbling"),
  defending: int("defending"),
  mentalScore: int("mentalScore"),
  focus: int("focus"),
  attitude: int("attitude"),
  leadership: int("leadership"),
  resilience: int("resilience"),
  medicalScore: int("medicalScore"),
  fatigue: int("fatigue"),
  soreness: int("soreness"),
  injuryRisk: int("injuryRisk"),
  rpe: int("rpe"),
  notes: text("notes"),
  aiAnalysis: text("aiAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TrainingSessionPerformance = typeof trainingSessionPerformance.$inferSelect;
export type InsertTrainingSessionPerformance = typeof trainingSessionPerformance.$inferInsert;

// ==================== DRILL VIDEO LIBRARY ====================
export const drillVideos = mysqlTable("drill_videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  skillArea: varchar("skillArea", { length: 100 }).notNull(),
  ageGroup: varchar("ageGroup", { length: 50 }),
  difficulty: varchar("difficulty", { length: 50 }),
  duration: int("duration"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  tags: text("tags"),
  uploadedBy: int("uploadedBy").references(() => users.id),
  isActive: boolean("isActive").default(true),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type DrillVideo = typeof drillVideos.$inferSelect;
export type InsertDrillVideo = typeof drillVideos.$inferInsert;

// System Configuration Table
export const systemConfig = mysqlTable("system_config", {
  id: int("id").primaryKey().autoincrement(),
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  configValue: text("configValue"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SystemConfig = typeof systemConfig.$inferSelect;

// ==================== STAFF ATTENDANCE ====================
export const staffAttendance = mysqlTable("staff_attendance", {
  id: int("id").autoincrement().primaryKey(),
  staffUserId: int("staffUserId").notNull().references(() => users.id),
  teamId: int("teamId").references(() => teams.id),
  sessionType: mysqlEnum("sessionType", ["match", "training", "meeting", "medical", "other"]).notNull().default("training"),
  sessionDate: date("sessionDate").notNull(),
  sessionLabel: varchar("sessionLabel", { length: 255 }),
  matchId: int("matchId").references(() => matches.id),
  trainingSessionId: int("trainingSessionId").references(() => trainingSessions.id),
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).notNull().default("present"),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StaffAttendance = typeof staffAttendance.$inferSelect;
export type InsertStaffAttendance = typeof staffAttendance.$inferInsert;

// ==================== ROLE NAVIGATION PERMISSIONS ====================
// Stores which nav modules and items are visible for each built-in role
export const roleNavPermissions = mysqlTable("role_nav_permissions", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["admin", "coach", "assistant_coach", "nutritionist", "mental_coach", "physical_trainer", "doctor", "parent", "player"]).notNull().unique(),
  // JSON: { modules: { [moduleId]: boolean }, items: { [path]: boolean } }
  config: json("config").notNull(),
  updatedBy: int("updatedBy").references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RoleNavPermission = typeof roleNavPermissions.$inferSelect;
export type InsertRoleNavPermission = typeof roleNavPermissions.$inferInsert;

// ==================== SET PIECE SCENARIOS ====================
export const setPieceScenarios = mysqlTable("set_piece_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  type: mysqlEnum("type", ["corner", "penalty", "freekick"]).notNull().default("corner"),
  teamSize: int("teamSize").notNull().default(11),
  ourFormation: varchar("ourFormation", { length: 20 }),
  opponentFormation: varchar("opponentFormation", { length: 20 }),
  scenarioData: json("scenarioData"),
  notes: text("notes"),
  tags: text("tags"), // JSON array of tag strings e.g. '["deep block","late game"]'
  createdBy: int("createdBy").references(() => users.id).notNull(),
  teamId: int("teamId").references(() => teams.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SetPieceScenario = typeof setPieceScenarios.$inferSelect;
export type InsertSetPieceScenario = typeof setPieceScenarios.$inferInsert;

// ==================== FINANCE MODULE ====================

export const playerFees = mysqlTable("player_fees", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  season: varchar("season", { length: 20 }).notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  amount: int("amount").notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "waived", "partial"]).default("pending").notNull(),
  paidAmount: int("paidAmount").default(0),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerFee = typeof playerFees.$inferSelect;
export type InsertPlayerFee = typeof playerFees.$inferInsert;

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  playerId: int("playerId").references(() => players.id),
  parentId: int("parentId").references(() => users.id),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate").notNull(),
  totalAmount: int("totalAmount").notNull(),
  paidAmount: int("paidAmount").default(0),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  items: json("items"),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["equipment", "facilities", "salaries", "transport", "medical", "training", "marketing", "utilities", "other"]).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(),
  expenseDate: date("expenseDate").notNull(),
  vendor: varchar("vendor", { length: 150 }),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  approvedBy: int("approvedBy").references(() => users.id),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const payments = mysqlTable("academy_payments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id),
  invoiceId: int("invoiceId").references(() => invoices.id),
  feeId: int("feeId").references(() => playerFees.id),
  amount: int("amount").notNull(),
  paymentDate: date("paymentDate").notNull(),
  method: mysqlEnum("method", ["cash", "bank_transfer", "instapay", "vodafone_cash", "check", "other"]).default("cash").notNull(),
  reference: varchar("reference", { length: 100 }),
  receivedBy: int("receivedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const aiToolUsage = mysqlTable("ai_tool_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id).notNull(),
  toolPath: varchar("tool_path", { length: 255 }).notNull(),
  toolLabel: varchar("tool_label", { length: 255 }).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});
export type AiToolUsage = typeof aiToolUsage.$inferSelect;
export type InsertAiToolUsage = typeof aiToolUsage.$inferInsert;

// ── Player Development Goals (direct player-linked goals for PlayerDevelopmentPlan page) ──
export const playerDevelopmentGoals = mysqlTable("player_development_goals", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  category: mysqlEnum("category", ["technical", "physical", "tactical", "mental"]).notNull().default("technical"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  targetDate: date("targetDate"),
  progress: int("progress").default(0).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  completed: boolean("completed").default(false).notNull(),
  drills: text("drills"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerDevelopmentGoal = typeof playerDevelopmentGoals.$inferSelect;
export type InsertPlayerDevelopmentGoal = typeof playerDevelopmentGoals.$inferInsert;

// ── Group Development Plans (coach-created group plans for multiple players) ──
export const groupDevelopmentPlans = mysqlTable("group_development_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name_gdp", { length: 200 }).notNull(),
  createdByUserId: int("createdByUserId_gdp").references(() => users.id),
  playerIds: text("playerIds_gdp").notNull(),
  notes: text("notes_gdp"),
  createdAt: timestamp("createdAt_gdp").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_gdp").defaultNow().onUpdateNow().notNull(),
});
export type GroupDevelopmentPlan = typeof groupDevelopmentPlans.$inferSelect;
export type InsertGroupDevelopmentPlan = typeof groupDevelopmentPlans.$inferInsert;

export const groupDevelopmentGoals = mysqlTable("group_development_goals", {
  id: int("id").autoincrement().primaryKey(),
  groupPlanId: int("groupPlanId_gdg").references(() => groupDevelopmentPlans.id).notNull(),
  category: mysqlEnum("category_gdg", ["technical", "physical", "tactical", "mental"]).notNull().default("physical"),
  title: varchar("title_gdg", { length: 200 }).notNull(),
  description: text("description_gdg"),
  targetDate: date("targetDate_gdg"),
  progress: int("progress_gdg").default(0).notNull(),
  priority: mysqlEnum("priority_gdg", ["low", "medium", "high"]).default("medium").notNull(),
  completed: boolean("completed_gdg").default(false).notNull(),
  createdAt: timestamp("createdAt_gdg").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_gdg").defaultNow().onUpdateNow().notNull(),
});
export type GroupDevelopmentGoal = typeof groupDevelopmentGoals.$inferSelect;
export type InsertGroupDevelopmentGoal = typeof groupDevelopmentGoals.$inferInsert;

// ── Scholarships ─────────────────────────────────────────────────────────────
export const scholarships = mysqlTable("scholarships", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId_sch").references(() => players.id).notNull(),
  type: mysqlEnum("type_sch", ["full", "partial", "merit", "need_based", "trial"]).notNull().default("partial"),
  discountPercent: int("discountPercent_sch").notNull().default(0),
  discountAmount: int("discountAmount_sch").default(0),
  reason: text("reason_sch"),
  startDate: date("startDate_sch").notNull(),
  endDate: date("endDate_sch"),
  status: mysqlEnum("status_sch", ["pending", "active", "expired", "revoked"]).notNull().default("pending"),
  approvedBy: int("approvedBy_sch").references(() => users.id),
  notes: text("notes_sch"),
  createdAt: timestamp("createdAt_sch").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_sch").defaultNow().onUpdateNow().notNull(),
});
export type Scholarship = typeof scholarships.$inferSelect;
export type InsertScholarship = typeof scholarships.$inferInsert;

// ── Staff Costs ───────────────────────────────────────────────────────────────
export const staffCosts = mysqlTable("staff_costs", {
  id: int("id").autoincrement().primaryKey(),
  staffUserId: int("staffUserId_sc").references(() => users.id),
  staffName: varchar("staffName_sc", { length: 200 }).notNull(),
  role: varchar("role_sc", { length: 100 }).notNull(),
  salaryAmount: int("salaryAmount_sc").notNull(),
  month: int("month_sc").notNull(),
  year: int("year_sc").notNull(),
  paymentStatus: mysqlEnum("paymentStatus_sc", ["pending", "paid", "partial"]).notNull().default("pending"),
  paidAmount: int("paidAmount_sc").default(0),
  paidDate: timestamp("paidDate_sc"),
  notes: text("notes_sc"),
  createdAt: timestamp("createdAt_sc").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_sc").defaultNow().onUpdateNow().notNull(),
});
export type StaffCost = typeof staffCosts.$inferSelect;
export type InsertStaffCost = typeof staffCosts.$inferInsert;

// ── Session Executions (Session Planning → Execution → Review Loop) ──────────
export const sessionExecutions = mysqlTable("session_executions", {
  id: int("id").autoincrement().primaryKey(),
  trainingSessionId: int("trainingSessionId_se").references(() => trainingSessions.id).notNull(),
  teamId: int("teamId_se"),
  coachId: int("coachId_se").references(() => users.id),
  executionDate: date("executionDate_se").notNull(),
  status: mysqlEnum("status_se", ["planned", "in_progress", "completed", "cancelled"]).notNull().default("planned"),
  actualDuration: int("actualDuration_se"),
  weatherConditions: varchar("weatherConditions_se", { length: 100 }),
  pitchCondition: mysqlEnum("pitchCondition_se", ["excellent", "good", "fair", "poor"]).default("good"),
  coachNotes: text("coachNotes_se"),
  overallRating: int("overallRating_se"),
  energyLevel: int("energyLevel_se"),
  focusLevel: int("focusLevel_se"),
  drillsCompleted: json("drillsCompleted_se"),
  goalsUpdated: json("goalsUpdated_se"),
  createdAt: timestamp("createdAt_se").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_se").defaultNow().onUpdateNow().notNull(),
});
export type SessionExecution = typeof sessionExecutions.$inferSelect;
export type InsertSessionExecution = typeof sessionExecutions.$inferInsert;

// ── Session Attendance (per-player attendance for each session execution) ─────
export const sessionAttendance = mysqlTable("session_attendance", {
  id: int("id").autoincrement().primaryKey(),
  sessionExecutionId: int("sessionExecutionId_sa").references(() => sessionExecutions.id).notNull(),
  playerId: int("playerId_sa").references(() => players.id).notNull(),
  status: mysqlEnum("status_sa", ["present", "absent", "late", "injured", "excused"]).notNull().default("present"),
  minutesPlayed: int("minutesPlayed_sa"),
  performanceRating: int("performanceRating_sa"),
  notes: text("notes_sa"),
  createdAt: timestamp("createdAt_sa").defaultNow().notNull(),
});
export type SessionAttendanceRecord = typeof sessionAttendance.$inferSelect;
export type InsertSessionAttendanceRecord = typeof sessionAttendance.$inferInsert;

// ── Contact Submissions ───────────────────────────────────────────────────────
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name_cs", { length: 255 }).notNull(),
  email: varchar("email_cs", { length: 255 }).notNull(),
  phone: varchar("phone_cs", { length: 50 }),
  subject: varchar("subject_cs", { length: 255 }),
  message: text("message_cs").notNull(),
  status: mysqlEnum("status_cs", ["new", "read", "replied", "archived"]).notNull().default("new"),
  createdAt: timestamp("createdAt_cs").defaultNow().notNull(),
});
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

// ==================== COACH PRIVATE TEAMS ====================
export const coachPrivateTeams = mysqlTable("coach_private_teams", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId_cpt").references(() => users.id).notNull(),
  name: varchar("name_cpt", { length: 150 }).notNull(),
  description: text("description_cpt"),
  ageGroup: varchar("ageGroup_cpt", { length: 20 }),
  logoUrl: text("logoUrl_cpt"),
  isActive: boolean("isActive_cpt").default(true).notNull(),
  createdAt: timestamp("createdAt_cpt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_cpt").defaultNow().onUpdateNow().notNull(),
});
export type CoachPrivateTeam = typeof coachPrivateTeams.$inferSelect;
export type InsertCoachPrivateTeam = typeof coachPrivateTeams.$inferInsert;

// ==================== COACH PRIVATE TEAM MEMBERS ====================
export const coachPrivateTeamMembers = mysqlTable("coach_private_team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId_cptm").references(() => coachPrivateTeams.id).notNull(),
  playerId: int("playerId_cptm").references(() => players.id).notNull(),
  position: varchar("position_cptm", { length: 50 }),
  jerseyNumber: int("jerseyNumber_cptm"),
  notes: text("notes_cptm"),
  addedAt: timestamp("addedAt_cptm").defaultNow().notNull(),
});
export type CoachPrivateTeamMember = typeof coachPrivateTeamMembers.$inferSelect;
export type InsertCoachPrivateTeamMember = typeof coachPrivateTeamMembers.$inferInsert;

// ==================== COACH PRIVATE SESSIONS ====================
export const coachPrivateSessions = mysqlTable("coach_private_sessions", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId_cps").references(() => users.id).notNull(),
  teamId: int("teamId_cps").references(() => coachPrivateTeams.id),
  title: varchar("title_cps", { length: 200 }).notNull(),
  description: text("description_cps"),
  sessionDate: date("sessionDate_cps").notNull(),
  startTime: varchar("startTime_cps", { length: 10 }),
  endTime: varchar("endTime_cps", { length: 10 }),
  location: varchar("location_cps", { length: 200 }),
  sessionType: mysqlEnum("sessionType_cps", ["technical", "tactical", "physical", "match", "recovery", "mixed"]).default("technical").notNull(),
  objectives: text("objectives_cps"),
  notes: text("notes_cps"),
  status: mysqlEnum("status_cps", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt_cps").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_cps").defaultNow().onUpdateNow().notNull(),
});
export type CoachPrivateSession = typeof coachPrivateSessions.$inferSelect;
export type InsertCoachPrivateSession = typeof coachPrivateSessions.$inferInsert;

// ==================== COACH PRIVATE SESSION PLAYERS ====================
export const coachPrivateSessionPlayers = mysqlTable("coach_private_session_players", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId_cpsp").references(() => coachPrivateSessions.id).notNull(),
  playerId: int("playerId_cpsp").references(() => players.id).notNull(),
  attendance: mysqlEnum("attendance_cpsp", ["present", "absent", "late", "excused"]).default("present"),
  performanceRating: int("performanceRating_cpsp"), // 1-10
  coachNotes: text("coachNotes_cpsp"),
  addedAt: timestamp("addedAt_cpsp").defaultNow().notNull(),
});
export type CoachPrivateSessionPlayer = typeof coachPrivateSessionPlayers.$inferSelect;
export type InsertCoachPrivateSessionPlayer = typeof coachPrivateSessionPlayers.$inferInsert;

// ==================== PLAYER SUSPENSIONS ====================
export const playerSuspensions = mysqlTable("player_suspensions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  teamId: int("teamId").references(() => teams.id),
  suspensionType: mysqlEnum("suspensionType", [
    "yellow_accumulation",
    "red_card",
    "double_yellow",
    "manual"
  ]).notNull(),
  reason: varchar("reason", { length: 500 }),
  banMatchesTotal: int("banMatchesTotal").notNull().default(1),
  banMatchesRemaining: int("banMatchesRemaining").notNull().default(1),
  triggeredByMatchId: int("triggeredByMatchId"),
  triggeredByEventId: int("triggeredByEventId"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status_ps", ["active", "served", "appealed", "cancelled"]).notNull().default("active"),
  createdBy: int("createdBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerSuspension = typeof playerSuspensions.$inferSelect;
export type InsertPlayerSuspension = typeof playerSuspensions.$inferInsert;

// ==================== SMART SHOE DEVICE INTEGRATION ====================
export const deviceSessions = mysqlTable("device_sessions", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  sessionType: varchar("sessionType", { length: 64 }).notNull().default("training"),
  sessionDate: timestamp("sessionDate").defaultNow().notNull(),
  durationMinutes: int("durationMinutes"),
  totalTouches: int("totalTouches").default(0),
  totalStrikes: int("totalStrikes").default(0),
  totalPasses: int("totalPasses").default(0),
  totalPossessions: int("totalPossessions").default(0),
  totalPossessionTimeMin: decimal("totalPossessionTimeMin", { precision: 8, scale: 2 }).default("0"),
  avgPossessionDurationS: decimal("avgPossessionDurationS", { precision: 8, scale: 2 }).default("0"),
  totalSprints: int("totalSprints").default(0),
  totalTurns: int("totalTurns").default(0),
  turnsWithBall: int("turnsWithBall").default(0),
  avgTurnEntrySpeedMs: decimal("avgTurnEntrySpeedMs", { precision: 8, scale: 2 }).default("0"),
  maxTurnEntrySpeedMs: decimal("maxTurnEntrySpeedMs", { precision: 8, scale: 2 }).default("0"),
  avgTurnExitSpeedMs: decimal("avgTurnExitSpeedMs", { precision: 8, scale: 2 }).default("0"),
  leftTurns: int("leftTurns").default(0),
  rightTurns: int("rightTurns").default(0),
  backTurns: int("backTurns").default(0),
  intenseTurns: int("intenseTurns").default(0),
  firstStepAccelerations: int("firstStepAccelerations").default(0),
  intenseAccelerations: int("intenseAccelerations").default(0),
  totalAccelerations: int("totalAccelerations").default(0),
  totalDecelerations: int("totalDecelerations").default(0),
  totalDistanceM: decimal("totalDistanceM", { precision: 10, scale: 2 }).default("0"),
  sprintDistanceM: decimal("sprintDistanceM", { precision: 10, scale: 2 }).default("0"),
  topSpeedKph: decimal("topSpeedKph", { precision: 6, scale: 2 }).default("0"),
  kickingPowerKph: decimal("kickingPowerKph", { precision: 6, scale: 2 }).default("0"),
  validSteps: int("validSteps").default(0),
  jumps: int("jumps").default(0),
  workCaloriesKcal: decimal("workCaloriesKcal", { precision: 8, scale: 2 }).default("0"),
  activeTimePercent: decimal("activeTimePercent", { precision: 5, scale: 2 }).default("0"),
  workRatePerMin: decimal("workRatePerMin", { precision: 8, scale: 2 }).default("0"),
  sprintWithBallCount: int("sprintWithBallCount").default(0),
  sprintWithoutBallCount: int("sprintWithoutBallCount").default(0),
  leftFootTouches: int("leftFootTouches").default(0),
  rightFootTouches: int("rightFootTouches").default(0),
  leftFootReleases: int("leftFootReleases").default(0),
  rightFootReleases: int("rightFootReleases").default(0),
  leftFootKickingPower: decimal("leftFootKickingPower", { precision: 6, scale: 2 }).default("0"),
  rightFootKickingPower: decimal("rightFootKickingPower", { precision: 6, scale: 2 }).default("0"),
  lacesReleases: int("lacesReleases").default(0),
  insideReleases: int("insideReleases").default(0),
  otherReleases: int("otherReleases").default(0),
  oneTouchPossessions: int("oneTouchPossessions").default(0),
  multiTouchPossessions: int("multiTouchPossessions").default(0),
  multiTouchDurationS: decimal("multiTouchDurationS", { precision: 8, scale: 2 }).default("0"),
  rawInsights: json("rawInsights"),
  timelineEvents: json("timelineEvents"),
  ballControlScore: int("ballControlScore"),
  agilityScore: int("agilityScore"),
  workloadScore: int("workloadScore"),
  overallScore: int("overallScore"),
  deviceId: varchar("deviceId", { length: 128 }),
  firmwareVersion: varchar("firmwareVersion", { length: 32 }),
  notes: text("notes"),
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type InsertDeviceSession = typeof deviceSessions.$inferInsert;

// ==================== SKILL ASSESSMENTS (Manual + Device) ====================
export const skillAssessments = mysqlTable("skill_assessments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  assessmentType: mysqlEnum("assessmentType", ["manual", "device", "combined"]).notNull().default("manual"),
  deviceSessionId: int("deviceSessionId").references(() => deviceSessions.id),
  dribbling: int("dribbling"),
  passing: int("passing"),
  shooting: int("shooting"),
  firstTouch: int("firstTouch"),
  heading: int("heading"),
  defending: int("defending"),
  speed: int("speed"),
  agility: int("agility"),
  stamina: int("stamina"),
  positioning: int("positioning"),
  deviceBallControl: int("deviceBallControl"),
  deviceAgility: int("deviceAgility"),
  deviceWorkload: int("deviceWorkload"),
  overallRating: int("overallRating"),
  assessorId: int("assessorId").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = typeof skillAssessments.$inferInsert;

// ==================== PUNISHMENTS ====================
export const punishments = mysqlTable("punishments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  issuedBy: int("issuedBy").references(() => users.id).notNull(),
  type: mysqlEnum("type", ["yellow_card", "red_card", "suspension", "fine", "extra_training", "warning", "other"]).notNull(),
  matchOrSession: varchar("matchOrSession", { length: 255 }),
  opponent: varchar("opponent", { length: 128 }),
  reason: text("reason").notNull(),
  description: text("description"),
  suspensionGames: int("suspensionGames").default(0),
  fineAmount: decimal("fineAmount", { precision: 8, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedNote: text("resolvedNote"),
  incidentDate: timestamp("incidentDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Punishment = typeof punishments.$inferSelect;
export type InsertPunishment = typeof punishments.$inferInsert;

// ─── Digital Locker Room ───────────────────────────────────────────────────
export const lockerRoomMessages = mysqlTable("locker_room_messages", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  fromUserId: int("fromUserId").references(() => users.id).notNull(),
  clipId: int("clipId"),
  videoSessionId: int("videoSessionId"),
  messageType: mysqlEnum("messageType", ["feedback", "praise", "correction", "tactical", "motivation", "challenge"]).notNull().default("feedback"),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  videoTimestamp: int("videoTimestamp"),
  isRead: boolean("isRead").notNull().default(false),
  playerResponse: text("playerResponse"),
  playerRespondedAt: timestamp("playerRespondedAt"),
  priority: mysqlEnum("priority", ["low", "normal", "high"]).notNull().default("normal"),
  attachedVideoId: varchar("attachedVideoId", { length: 50 }),
  attachedVideoTitle: varchar("attachedVideoTitle", { length: 255 }),
  attachedVideoCategory: varchar("attachedVideoCategory", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LockerRoomMessage = typeof lockerRoomMessages.$inferSelect;
export type InsertLockerRoomMessage = typeof lockerRoomMessages.$inferInsert;

// ─── Transfer Market & Player Valuation ───────────────────────────────────────
export const transferListings = mysqlTable("transfer_listings", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  listingType: mysqlEnum("listingType", ["sale", "loan", "free_agent", "swap"]).notNull().default("sale"),
  askingPrice: decimal("askingPrice", { precision: 12, scale: 2 }),
  loanFee: decimal("loanFee", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  status: mysqlEnum("status", ["active", "under_offer", "sold", "withdrawn", "expired"]).notNull().default("active"),
  description: text("description"),
  contractExpiryDate: date("contractExpiryDate"),
  currentSalary: decimal("currentSalary", { precision: 10, scale: 2 }),
  agentName: varchar("agentName", { length: 100 }),
  agentContact: varchar("agentContact", { length: 100 }),
  interestedClubs: text("interestedClubs"),
  aiValuation: decimal("aiValuation", { precision: 12, scale: 2 }),
  valuationBreakdown: text("valuationBreakdown"),
  listedByUserId: int("listedByUserId").references(() => users.id),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransferListing = typeof transferListings.$inferSelect;
export type InsertTransferListing = typeof transferListings.$inferInsert;

export const transferOffers = mysqlTable("transfer_offers", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").references(() => transferListings.id).notNull(),
  playerId: int("playerId").references(() => players.id).notNull(),
  offerAmount: decimal("offerAmount", { precision: 12, scale: 2 }).notNull(),
  offerType: mysqlEnum("offerType", ["purchase", "loan", "swap"]).notNull().default("purchase"),
  offeringClub: varchar("offeringClub", { length: 150 }).notNull(),
  offeringContact: varchar("offeringContact", { length: 150 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "countered", "withdrawn"]).notNull().default("pending"),
  counterOffer: decimal("counterOffer", { precision: 12, scale: 2 }),
  offeredByUserId: int("offeredByUserId").references(() => users.id),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransferOffer = typeof transferOffers.$inferSelect;
export type InsertTransferOffer = typeof transferOffers.$inferInsert;

export const playerValuations = mysqlTable("player_valuations", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  valuationDate: timestamp("valuationDate").defaultNow().notNull(),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  technicalScore: int("technicalScore").default(50),
  physicalScore: int("physicalScore").default(50),
  mentalScore: int("mentalScore").default(50),
  performanceScore: int("performanceScore").default(50),
  potentialScore: int("potentialScore").default(50),
  marketDemandScore: int("marketDemandScore").default(50),
  injuryRiskScore: int("injuryRiskScore").default(50),
  contractScore: int("contractScore").default(50),
  overallRating: int("overallRating").default(50),
  trend: mysqlEnum("trend", ["rising", "stable", "declining"]).default("stable"),
  comparablePlayer: varchar("comparablePlayer", { length: 100 }),
  aiNarrative: text("aiNarrative"),
  valuedByUserId: int("valuedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlayerValuation = typeof playerValuations.$inferSelect;
export type InsertPlayerValuation = typeof playerValuations.$inferInsert;

export const scoutingWatchlist = mysqlTable("scouting_watchlist", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").references(() => players.id).notNull(),
  addedByUserId: int("addedByUserId").references(() => users.id).notNull(),
  priority: mysqlEnum("priority", ["hot", "warm", "cold"]).default("warm"),
  notes: text("notes"),
  targetPosition: varchar("targetPosition", { length: 50 }),
  budgetRange: varchar("budgetRange", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ScoutingWatchlist = typeof scoutingWatchlist.$inferSelect;
export type InsertScoutingWatchlist = typeof scoutingWatchlist.$inferInsert;

// ==================== VOICE COACH SESSIONS ====================
export const voiceCoachSessions = mysqlTable("voice_coach_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  messages: text("messages").notNull(),
  messageCount: int("message_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type VoiceCoachSession = typeof voiceCoachSessions.$inferSelect;
export type InsertVoiceCoachSession = typeof voiceCoachSessions.$inferInsert;


// ==================== COACH TRAINING PLANS ====================
export const coachTrainingPlans = mysqlTable("coach_training_plans", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").references(() => users.id).notNull(),
  teamId: int("teamId").references(() => teams.id),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  ageGroup: varchar("ageGroup", { length: 50 }),
  totalWeeks: int("totalWeeks").notNull().default(4),
  sessionsPerWeek: int("sessionsPerWeek").notNull().default(3),
  sessionDurationMins: int("sessionDurationMins").notNull().default(90),
  objective: text("objective"),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("intermediate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("draft"),
  sessions: json("sessions").notNull(), // Array of session objects
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CoachTrainingPlan = typeof coachTrainingPlans.$inferSelect;
export type InsertCoachTrainingPlan = typeof coachTrainingPlans.$inferInsert;

// ==================== COACH PRIVATE SUBSCRIPTIONS ====================
export const coachPrivateSubscriptions = mysqlTable("coach_private_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId_cpsub").references(() => users.id).notNull(),
  playerId: int("playerId_cpsub").references(() => players.id).notNull(),
  teamId: int("teamId_cpsub").references(() => coachPrivateTeams.id),
  planName: varchar("planName_cpsub", { length: 100 }).notNull(),
  monthlyFee: int("monthlyFee_cpsub").notNull(), // in smallest currency unit (e.g. piastres)
  currency: varchar("currency_cpsub", { length: 10 }).default("EGP"),
  startDate: date("startDate_cpsub").notNull(),
  endDate: date("endDate_cpsub"),
  status: mysqlEnum("status_cpsub", ["active", "paused", "cancelled", "expired"]).default("active").notNull(),
  notes: text("notes_cpsub"),
  createdAt: timestamp("createdAt_cpsub").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_cpsub").defaultNow().onUpdateNow().notNull(),
});
export type CoachPrivateSubscription = typeof coachPrivateSubscriptions.$inferSelect;
export type InsertCoachPrivateSubscription = typeof coachPrivateSubscriptions.$inferInsert;

export const coachPrivatePayments = mysqlTable("coach_private_payments", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId_cpp").references(() => coachPrivateSubscriptions.id).notNull(),
  coachId: int("coachId_cpp").references(() => users.id).notNull(),
  playerId: int("playerId_cpp").references(() => players.id).notNull(),
  amount: int("amount_cpp").notNull(),
  currency: varchar("currency_cpp", { length: 10 }).default("EGP"),
  paymentDate: date("paymentDate_cpp").notNull(),
  month: int("month_cpp").notNull(),
  year: int("year_cpp").notNull(),
  status: mysqlEnum("status_cpp", ["paid", "pending", "overdue", "waived"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod_cpp", { length: 50 }),
  notes: text("notes_cpp"),
  createdAt: timestamp("createdAt_cpp").defaultNow().notNull(),
});
export type CoachPrivatePayment = typeof coachPrivatePayments.$inferSelect;
export type InsertCoachPrivatePayment = typeof coachPrivatePayments.$inferInsert;

// ==================== AI PREDICTION FEEDBACK ====================
export const aiPredictionFeedback = mysqlTable("ai_prediction_feedback", {
  id: int("id").autoincrement().primaryKey(),
  predictionType: varchar("predictionType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  entityType: mysqlEnum("entityType", ["player", "team"]).notNull(),
  predictionDate: timestamp("predictionDate").defaultNow().notNull(),
  predictedOutcome: text("predictedOutcome").notNull(),
  predictedScore: decimal("predictedScore", { precision: 5, scale: 2 }),
  actualOutcome: text("actualOutcome"),
  actualScore: decimal("actualScore", { precision: 5, scale: 2 }),
  accuracyRating: int("accuracyRating"),
  wasAccurate: boolean("wasAccurate"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AIPredictionFeedback = typeof aiPredictionFeedback.$inferSelect;
export type InsertAIPredictionFeedback = typeof aiPredictionFeedback.$inferInsert;

// ==================== CHATBOT Q&A POOL ====================
export const chatbotQA = mysqlTable("chatbot_qa", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords"),
  category: varchar("category", { length: 50 }).default("general"),
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ChatbotQA = typeof chatbotQA.$inferSelect;
export type InsertChatbotQA = typeof chatbotQA.$inferInsert;

// ==================== ADVANCED TACTICAL BOARD ====================
// A tactical session = one saved board state (can have multiple phases)
export const tacticalSessions = mysqlTable("tactical_sessions", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sessionType: mysqlEnum("sessionType_tac", ["training", "match_prep", "post_match", "set_piece", "free"]).default("free").notNull(),
  homeFormation: varchar("homeFormation", { length: 20 }).default("4-3-3").notNull(),
  awayFormation: varchar("awayFormation", { length: 20 }).default("4-4-2").notNull(),
  homeTeamName: varchar("homeTeamName", { length: 100 }).default("Home").notNull(),
  awayTeamName: varchar("awayTeamName", { length: 100 }).default("Away").notNull(),
  homePlayers: json("homePlayers"),
  awayPlayers: json("awayPlayers"),
  layers: json("layers"),
  tags: json("tags"),
  matchDate: date("matchDate"),
  opponent: varchar("opponent", { length: 100 }),
  isTemplate: boolean("isTemplate").default(false).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  thumbnailData: text("thumbnailData"),
  createdAt: timestamp("createdAt_ts").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_ts").defaultNow().onUpdateNow().notNull(),
});
export type TacticalSession = typeof tacticalSessions.$inferSelect;
export type InsertTacticalSession = typeof tacticalSessions.$inferInsert;

export const tacticalPhases = mysqlTable("tactical_phases", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => tacticalSessions.id).notNull(),
  phaseNumber: int("phaseNumber").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  homePlayers: json("homePlayers"),
  awayPlayers: json("awayPlayers"),
  layers: json("layers"),
  durationSeconds: int("durationSeconds").default(0),
  createdAt: timestamp("createdAt_tp").defaultNow().notNull(),
});
export type TacticalPhase = typeof tacticalPhases.$inferSelect;
export type InsertTacticalPhase = typeof tacticalPhases.$inferInsert;

export const tacticalAnalysisNotes = mysqlTable("tactical_analysis_notes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => tacticalSessions.id).notNull(),
  createdBy: int("createdBy").references(() => users.id).notNull(),
  category: mysqlEnum("category_tan", ["strength", "weakness", "opportunity", "threat", "general", "set_piece", "pressing", "transition"]).default("general").notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("priority_tan", ["low", "medium", "high"]).default("medium").notNull(),
  relatedPhaseId: int("relatedPhaseId"),
  createdAt: timestamp("createdAt_tan").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_tan").defaultNow().onUpdateNow().notNull(),
});
export type TacticalAnalysisNote = typeof tacticalAnalysisNotes.$inferSelect;
export type InsertTacticalAnalysisNote = typeof tacticalAnalysisNotes.$inferInsert;

export const tacticalTemplates = mysqlTable("tactical_templates", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category_tt", ["attack", "defense", "set_piece", "pressing", "transition", "custom"]).default("custom").notNull(),
  homeFormation: varchar("homeFormation", { length: 20 }).notNull(),
  awayFormation: varchar("awayFormation", { length: 20 }),
  homePlayers: json("homePlayers"),
  awayPlayers: json("awayPlayers"),
  layers: json("layers"),
  description: text("description"),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt_tt").defaultNow().notNull(),
});
export type TacticalTemplate = typeof tacticalTemplates.$inferSelect;
export type InsertTacticalTemplate = typeof tacticalTemplates.$inferInsert;
