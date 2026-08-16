-- Tables required by coachCandidatesRouter and matchIntelligenceRouter, plus the
-- two columns injuryPrevention reads and writes. All four tables were queried by
-- raw SQL that never had a matching schema, so /coach-database and
-- /match-intelligence returned 500 on every load.
--
-- Column names and types are derived from the INSERT/UPDATE/SELECT statements in
-- server/routers_new_features.ts and server/matchIntelligenceRouter.ts.
--
-- Applied by hand rather than via drizzle-kit: a generated migration would also
-- DROP injury_risk_assessments.notes and .recordedBy, which exist in the database
-- but not in drizzle/schema.ts. This file is purely additive.

-- ── Coach candidate database (/coach-database) ──────────────────────────────
CREATE TABLE IF NOT EXISTS `coach_candidates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `nationality` varchar(100),
  `age` int,
  `email` varchar(255),
  `phone` varchar(50),
  `photo_url` varchar(1024),
  `title` varchar(255),
  `years_experience` int NOT NULL DEFAULT 0,
  `preferred_formation` varchar(50),
  -- getAll JSON.parse()s each of these, defaulting to "[]" when null
  `playing_styles` json,
  `coaching_strengths` json,
  `required_player_skills` json,
  `certifications` json,
  `languages` json,
  `bio` text,
  `achievements` json,
  `availability` enum('available','unavailable','negotiating') NOT NULL DEFAULT 'available',
  `contract_status` enum('free','contracted','notice_period') NOT NULL DEFAULT 'free',
  `expected_salary` varchar(100),
  `linkedin_url` varchar(1024),
  `rating` decimal(3,1) NOT NULL DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- matches: WHERE is_active = TRUE ORDER BY rating DESC, years_experience DESC
  INDEX `idx_coach_candidates_active` (`is_active`, `rating`, `years_experience`)
);

-- ── Match intelligence: opponent scouting profiles ──────────────────────────
CREATE TABLE IF NOT EXISTS `match_opponent_profiles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `created_by` int NOT NULL,
  `team_name` varchar(255) NOT NULL,
  `country` varchar(100),
  `league` varchar(255),
  `typical_formation` varchar(50),
  `playing_style` text,
  `strengths` text,
  `weaknesses` text,
  `set_piece_strengths` text,
  `set_piece_weaknesses` text,
  `key_players` text,
  `avg_goals_scored` decimal(5,2) NOT NULL DEFAULT 0,
  `avg_goals_conceded` decimal(5,2) NOT NULL DEFAULT 0,
  `matches_played` int NOT NULL DEFAULT 0,
  `wins` int NOT NULL DEFAULT 0,
  `draws` int NOT NULL DEFAULT 0,
  `losses` int NOT NULL DEFAULT 0,
  `pressing_intensity` varchar(100),
  `defensive_line` varchar(100),
  `buildup_style` varchar(100),
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mop_created_by` (`created_by`, `team_name`)
);

-- ── Match intelligence: opposition coach profiles ───────────────────────────
CREATE TABLE IF NOT EXISTS `match_coach_profiles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `created_by` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `nationality` varchar(100),
  `age` int,
  `team_name` varchar(255),
  `years_experience` int,
  `preferred_formation` varchar(50),
  `tactical_philosophy` text,
  `pressing_style` text,
  `defensive_approach` text,
  `attacking_approach` text,
  `substitution_patterns` text,
  `big_match_record` text,
  `set_piece_approach` text,
  `known_weaknesses` text,
  `career_highlights` text,
  `win_rate` decimal(5,2),
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mcp_created_by` (`created_by`, `name`)
);

-- ── Match intelligence: saved match analyses ────────────────────────────────
CREATE TABLE IF NOT EXISTS `match_analyses` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `created_by` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `our_team` varchar(255) NOT NULL,
  `opponent_team` varchar(255) NOT NULL,
  `opponent_profile_id` int,
  `coach_profile_id` int,
  `match_date` date,
  `competition` varchar(255),
  `venue` varchar(255),
  `our_formation` varchar(50),
  `opponent_formation` varchar(50),
  `our_lambda` decimal(6,3),
  `opponent_lambda` decimal(6,3),
  `our_raw_avg` decimal(6,3),
  `opponent_raw_avg` decimal(6,3),
  `win_probability` decimal(6,3),
  `draw_probability` decimal(6,3),
  `loss_probability` decimal(6,3),
  `win_probability_with_set_pieces` decimal(6,3),
  -- the router stores these as pre-serialised JSON strings
  `simulation_results` longtext,
  `pattern_analysis` longtext,
  `tactical_recommendations` longtext,
  `five_gates` longtext,
  `key_battles` longtext,
  `set_piece_plan` longtext,
  `substitution_strategy` longtext,
  `ai_full_report` longtext,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- matches: WHERE created_by = ? ORDER BY created_at DESC
  INDEX `idx_ma_created_by` (`created_by`, `created_at`)
);

-- ── injury_risk_assessments: columns the AI assessment reads and writes ─────
-- The table already exists with 22 columns; these two are declared in
-- drizzle/schema.ts and used by injuryPrevention.getMyAssessments (select) and
-- the assessment mutations (insert), but were never created.
ALTER TABLE `injury_risk_assessments`
  ADD COLUMN `specificRecommendations` json NULL,
  ADD COLUMN `aiAnalysis` text NULL;
