import { mysqlTable, int, varchar, text, timestamp, date, decimal, mysqlEnum, boolean, json } from 'drizzle-orm/mysql-core';
import { players, users } from './schema';

// ==================== PLAYER SKILLS TRACKING ====================

export const playerSkills = mysqlTable("player_skills", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("player_id").references(() => players.id).notNull(),
  assessmentDate: date("assessment_date").notNull(),
  
  // Technical Skills (0-100)
  ballControl: int("ball_control").default(0),
  passing: int("passing").default(0),
  shooting: int("shooting").default(0),
  dribbling: int("dribbling").default(0),
  firstTouch: int("first_touch").default(0),
  crossing: int("crossing").default(0),
  finishing: int("finishing").default(0),
  heading: int("heading").default(0),
  
  // Physical Skills (0-100)
  speed: int("speed").default(0),
  stamina: int("stamina").default(0),
  strength: int("strength").default(0),
  agility: int("agility").default(0),
  balance: int("balance").default(0),
  jumping: int("jumping").default(0),
  
  // Tactical Skills (0-100)
  positioning: int("positioning").default(0),
  vision: int("vision").default(0),
  decisionMaking: int("decision_making").default(0),
  offTheBall: int("off_the_ball").default(0),
  marking: int("marking").default(0),
  tackling: int("tackling").default(0),
  
  // Mental Skills (0-100)
  composure: int("composure").default(0),
  concentration: int("concentration").default(0),
  determination: int("determination").default(0),
  workRate: int("work_rate").default(0),
  teamwork: int("teamwork").default(0),
  leadership: int("leadership").default(0),
  
  // Overall scores
  technicalAvg: int("technical_avg").default(0),
  physicalAvg: int("physical_avg").default(0),
  tacticalAvg: int("tactical_avg").default(0),
  mentalAvg: int("mental_avg").default(0),
  overallRating: int("overall_rating").default(0),
  
  notes: text("notes"),
  assessedBy: int("assessed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlayerSkill = typeof playerSkills.$inferSelect;
export type InsertPlayerSkill = typeof playerSkills.$inferInsert;

// ==================== PLAYER ACTIVITIES ====================

export const playerActivities = mysqlTable("player_activities", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("player_id").references(() => players.id).notNull(),
  activityType: mysqlEnum("activity_type", ["training", "match", "drill", "assessment", "recovery"]).notNull(),
  activityDate: date("activity_date").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  
  // Activity details
  duration: int("duration"), // in minutes
  intensity: mysqlEnum("intensity", ["low", "medium", "high", "very_high"]),
  attendance: mysqlEnum("attendance", ["present", "absent", "late", "excused"]).default("present"),
  
  // Performance in activity
  performanceRating: int("performance_rating"), // 0-100
  goalsScored: int("goals_scored").default(0),
  assists: int("assists").default(0),
  minutesPlayed: int("minutes_played"),
  
  // Match-specific
  opponent: varchar("opponent", { length: 100 }),
  result: mysqlEnum("result", ["win", "loss", "draw"]),
  
  notes: text("notes"),
  recordedBy: int("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PlayerActivity = typeof playerActivities.$inferSelect;
export type InsertPlayerActivity = typeof playerActivities.$inferInsert;

// ==================== FORMATIONS ====================

export const formations = mysqlTable("formations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  formationType: varchar("formation_type", { length: 20 }).notNull(), // e.g., "4-3-3", "4-4-2"
  description: text("description"),
  teamId: int("team_id"),
  createdBy: int("created_by").references(() => users.id).notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Formation = typeof formations.$inferSelect;
export type InsertFormation = typeof formations.$inferInsert;

// ==================== FORMATION POSITIONS ====================

export const formationPositions = mysqlTable("formation_positions", {
  id: int("id").autoincrement().primaryKey(),
  formationId: int("formation_id").references(() => formations.id).notNull(),
  playerId: int("player_id").references(() => players.id),
  positionName: varchar("position_name", { length: 50 }).notNull(), // e.g., "GK", "LB", "CB", "RW"
  positionX: decimal("position_x", { precision: 5, scale: 2 }).notNull(), // 0-100 (percentage of pitch width)
  positionY: decimal("position_y", { precision: 5, scale: 2 }).notNull(), // 0-100 (percentage of pitch height)
  role: varchar("role", { length: 100 }), // e.g., "Ball-playing defender", "Target man"
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FormationPosition = typeof formationPositions.$inferSelect;
export type InsertFormationPosition = typeof formationPositions.$inferInsert;

// ==================== SKILL IMPROVEMENT GOALS ====================

export const skillGoals = mysqlTable("skill_goals", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("player_id").references(() => players.id).notNull(),
  skillName: varchar("skill_name", { length: 100 }).notNull(),
  currentLevel: int("current_level").notNull(), // 0-100
  targetLevel: int("target_level").notNull(), // 0-100
  targetDate: date("target_date"),
  status: mysqlEnum("status", ["active", "achieved", "abandoned"]).default("active"),
  progress: int("progress").default(0), // 0-100
  notes: text("notes"),
  setBy: int("set_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SkillGoal = typeof skillGoals.$inferSelect;
export type InsertSkillGoal = typeof skillGoals.$inferInsert;
