-- Advanced Tactical Board Tables
CREATE TABLE IF NOT EXISTS `tactical_sessions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `createdBy` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `sessionType_tac` enum('training','match_prep','post_match','set_piece','free') NOT NULL DEFAULT 'free',
  `homeFormation` varchar(20) NOT NULL DEFAULT '4-3-3',
  `awayFormation` varchar(20) NOT NULL DEFAULT '4-4-2',
  `homeTeamName` varchar(100) NOT NULL DEFAULT 'Home',
  `awayTeamName` varchar(100) NOT NULL DEFAULT 'Away',
  `homePlayers` json,
  `awayPlayers` json,
  `layers` json,
  `tags` json,
  `matchDate` date,
  `opponent` varchar(100),
  `isTemplate` boolean NOT NULL DEFAULT false,
  `isPublic` boolean NOT NULL DEFAULT false,
  `thumbnailData` text,
  `createdAt_ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt_ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `tactical_phases` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` int NOT NULL,
  `phaseNumber` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `homePlayers` json,
  `awayPlayers` json,
  `layers` json,
  `durationSeconds` int DEFAULT 0,
  `createdAt_tp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sessionId`) REFERENCES `tactical_sessions`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `tactical_analysis_notes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` int NOT NULL,
  `createdBy` int NOT NULL,
  `category_tan` enum('strength','weakness','opportunity','threat','general','set_piece','pressing','transition') NOT NULL DEFAULT 'general',
  `content` text NOT NULL,
  `priority_tan` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `relatedPhaseId` int,
  `createdAt_tan` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt_tan` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sessionId`) REFERENCES `tactical_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `tactical_templates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `createdBy` int,
  `name` varchar(100) NOT NULL,
  `category_tt` enum('attack','defense','set_piece','pressing','transition','custom') NOT NULL DEFAULT 'custom',
  `homeFormation` varchar(20) NOT NULL,
  `awayFormation` varchar(20),
  `homePlayers` json,
  `awayPlayers` json,
  `layers` json,
  `description` text,
  `isSystem` boolean NOT NULL DEFAULT false,
  `createdAt_tt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)
);
