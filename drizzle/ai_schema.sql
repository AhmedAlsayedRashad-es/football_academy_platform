-- AI System Database Schema Extensions
-- This file contains all new tables for the AI enhancement system

-- ============================================
-- PUBLIC DATA TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public_competitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  externalId INT UNIQUE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10),
  areaName VARCHAR(100),
  type VARCHAR(50),
  currentSeason INT,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  externalId INT UNIQUE,
  name VARCHAR(255) NOT NULL,
  shortName VARCHAR(100),
  tla VARCHAR(3),
  crest LONGTEXT,
  areaName VARCHAR(100),
  founded INT,
  venue VARCHAR(255),
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  externalId INT UNIQUE,
  competitionId INT,
  homeTeamId INT,
  awayTeamId INT,
  matchDate DATETIME,
  status VARCHAR(50),
  homeTeamScore INT,
  awayTeamScore INT,
  halfTimeHomeScore INT,
  halfTimeAwayScore INT,
  venue VARCHAR(255),
  referee VARCHAR(255),
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competitionId) REFERENCES public_competitions(id),
  FOREIGN KEY (homeTeamId) REFERENCES public_teams(id),
  FOREIGN KEY (awayTeamId) REFERENCES public_teams(id),
  INDEX idx_status (status),
  INDEX idx_matchDate (matchDate)
);

CREATE TABLE IF NOT EXISTS public_player_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  externalPlayerId INT UNIQUE,
  playerName VARCHAR(255) NOT NULL,
  position VARCHAR(50),
  teamId INT,
  competitionId INT,
  season INT,
  appearances INT DEFAULT 0,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  yellowCards INT DEFAULT 0,
  redCards INT DEFAULT 0,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES public_teams(id),
  FOREIGN KEY (competitionId) REFERENCES public_competitions(id),
  INDEX idx_playerName (playerName),
  INDEX idx_position (position)
);

-- ============================================
-- TACTICAL ANALYSIS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS tactical_patterns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patternName VARCHAR(255) NOT NULL,
  formation VARCHAR(50),
  description LONGTEXT,
  keyCharacteristics JSON,
  effectiveness DECIMAL(5, 2),
  frequency DECIMAL(5, 2),
  competitionId INT,
  sourceTeams JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competitionId) REFERENCES public_competitions(id),
  INDEX idx_formation (formation)
);

CREATE TABLE IF NOT EXISTS team_tactical_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teamId INT NOT NULL,
  preferredFormation VARCHAR(50),
  alternateFormations JSON,
  attackingStyle VARCHAR(100),
  defensiveStyle VARCHAR(100),
  passingStyle VARCHAR(100),
  setPlayStrength INT DEFAULT 5,
  counterAttackTendency INT DEFAULT 5,
  lastAnalyzed TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES public_teams(id),
  UNIQUE KEY unique_team (teamId)
);

CREATE TABLE IF NOT EXISTS tactical_recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  academyId INT,
  opponentTeamId INT,
  recommendedFormation VARCHAR(50),
  keyTactics JSON,
  strengthsToExploit JSON,
  threatsToMitigate JSON,
  setPlayRecommendations JSON,
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confidence INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opponentTeamId) REFERENCES public_teams(id)
);

-- ============================================
-- MATCH ANALYSIS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS match_analysis_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  matchId INT,
  analysisType VARCHAR(50),
  homeTeamAnalysis JSON,
  awayTeamAnalysis JSON,
  keyMoments JSON,
  turningPoints JSON,
  tacticalInsights JSON,
  performanceMetrics JSON,
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_matchId (matchId),
  INDEX idx_analysisType (analysisType)
);

CREATE TABLE IF NOT EXISTS player_performance_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId INT,
  matchId INT,
  position VARCHAR(50),
  rating DECIMAL(3, 1),
  keyStats JSON,
  strengths JSON,
  weaknesses JSON,
  keyMoments JSON,
  comparisonToTeamAverage JSON,
  analysisDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_playerId (playerId),
  INDEX idx_matchId (matchId)
);

-- ============================================
-- AI COACH TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS ai_coach_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  coachName VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  experienceLevel INT DEFAULT 5,
  knowledgeBase JSON,
  teachingStyle VARCHAR(100),
  successRate DECIMAL(5, 2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_coaching_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId INT NOT NULL,
  coachId INT NOT NULL,
  sessionType VARCHAR(50),
  topic VARCHAR(255),
  feedback JSON,
  recommendations JSON,
  exercises JSON,
  sessionDate TIMESTAMP,
  playerFeedback INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coachId) REFERENCES ai_coach_profiles(id),
  INDEX idx_playerId (playerId),
  INDEX idx_sessionDate (sessionDate)
);

CREATE TABLE IF NOT EXISTS personalized_training_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId INT NOT NULL,
  planName VARCHAR(255),
  objective VARCHAR(255),
  duration INT,
  weeklySchedule JSON,
  exercises JSON,
  progressMetrics JSON,
  difficulty INT DEFAULT 5,
  startDate DATE,
  endDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_playerId (playerId),
  INDEX idx_startDate (startDate)
);

-- ============================================
-- PERFORMANCE BENCHMARKING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  benchmarkType VARCHAR(50),
  category VARCHAR(100),
  metric VARCHAR(100),
  value DECIMAL(10, 2),
  percentile INT,
  sampleSize INT,
  season INT,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_benchmarkType (benchmarkType),
  INDEX idx_category (category)
);

CREATE TABLE IF NOT EXISTS player_benchmark_comparison (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId INT NOT NULL,
  benchmarkId INT NOT NULL,
  playerValue DECIMAL(10, 2),
  benchmarkValue DECIMAL(10, 2),
  percentile INT,
  variance DECIMAL(10, 2),
  comparisonDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (benchmarkId) REFERENCES performance_benchmarks(id),
  INDEX idx_playerId (playerId),
  INDEX idx_comparisonDate (comparisonDate)
);

CREATE TABLE IF NOT EXISTS talent_identification_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId INT NOT NULL,
  talentScore INT,
  technicalScore INT,
  physicalScore INT,
  mentalScore INT,
  tacticalScore INT,
  potentialRating INT,
  recommendedPosition VARCHAR(50),
  developmentAreas JSON,
  strengths JSON,
  assessmentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player (playerId),
  INDEX idx_talentScore (talentScore),
  INDEX idx_potentialRating (potentialRating)
);

-- ============================================
-- DATA SYNCHRONIZATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS api_sync_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(100),
  dataType VARCHAR(100),
  recordsProcessed INT,
  recordsAdded INT,
  recordsUpdated INT,
  status VARCHAR(50),
  errorMessage LONGTEXT,
  syncStartTime TIMESTAMP,
  syncEndTime TIMESTAMP,
  nextSyncScheduled TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source (source),
  INDEX idx_status (status),
  INDEX idx_syncStartTime (syncStartTime)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_public_competitions_code ON public_competitions(code);
CREATE INDEX idx_public_teams_name ON public_teams(name);
CREATE INDEX idx_public_matches_homeTeam ON public_matches(homeTeamId);
CREATE INDEX idx_public_matches_awayTeam ON public_matches(awayTeamId);
CREATE INDEX idx_public_player_stats_team ON public_player_stats(teamId);
CREATE INDEX idx_tactical_patterns_formation ON tactical_patterns(formation);
CREATE INDEX idx_team_tactical_profiles_team ON team_tactical_profiles(teamId);
CREATE INDEX idx_match_analysis_results_match ON match_analysis_results(matchId);
CREATE INDEX idx_player_performance_analysis_player ON player_performance_analysis(playerId);
CREATE INDEX idx_ai_coaching_sessions_coach ON ai_coaching_sessions(coachId);
CREATE INDEX idx_personalized_training_plans_player ON personalized_training_plans(playerId);
CREATE INDEX idx_player_benchmark_comparison_player ON player_benchmark_comparison(playerId);
CREATE INDEX idx_talent_identification_scores_player ON talent_identification_scores(playerId);
