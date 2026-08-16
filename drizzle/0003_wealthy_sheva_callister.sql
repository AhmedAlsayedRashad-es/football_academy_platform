CREATE TABLE `ai_training_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`generatedDate` date NOT NULL,
	`strengthsIdentified` text,
	`weaknessesIdentified` text,
	`recommendedDrills` text,
	`focusAreas` text,
	`weeklyPlan` text,
	`priorityMetric1` varchar(100),
	`priorityMetric2` varchar(100),
	`priorityMetric3` varchar(100),
	`dominantFootTraining` text,
	`weakFootTraining` text,
	`positionSpecificDrills` text,
	`isActive` boolean DEFAULT true,
	`isAccepted` boolean DEFAULT false,
	`acceptedAt` timestamp,
	`completionProgress` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_training_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int,
	`matchDate` date NOT NULL,
	`matchType` enum('friendly','league','cup','tournament','training_match') NOT NULL,
	`opponent` varchar(200),
	`venue` varchar(200),
	`isHome` boolean DEFAULT true,
	`teamScore` int DEFAULT 0,
	`opponentScore` int DEFAULT 0,
	`result` enum('win','draw','loss'),
	`halfTimeScore` varchar(10),
	`notes` text,
	`videoUrl` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_match_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int NOT NULL,
	`minutesPlayed` int DEFAULT 0,
	`started` boolean DEFAULT false,
	`substitutedIn` int,
	`substitutedOut` int,
	`position` varchar(50),
	`goals` int DEFAULT 0,
	`assists` int DEFAULT 0,
	`touches` int DEFAULT 0,
	`passes` int DEFAULT 0,
	`passAccuracy` int DEFAULT 0,
	`shots` int DEFAULT 0,
	`shotsOnTarget` int DEFAULT 0,
	`dribbles` int DEFAULT 0,
	`successfulDribbles` int DEFAULT 0,
	`crosses` int DEFAULT 0,
	`tackles` int DEFAULT 0,
	`interceptions` int DEFAULT 0,
	`clearances` int DEFAULT 0,
	`blocks` int DEFAULT 0,
	`distanceCovered` int DEFAULT 0,
	`topSpeed` int DEFAULT 0,
	`sprints` int DEFAULT 0,
	`yellowCards` int DEFAULT 0,
	`redCards` int DEFAULT 0,
	`foulsCommitted` int DEFAULT 0,
	`foulsSuffered` int DEFAULT 0,
	`coachRating` int,
	`performanceScore` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_match_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_skill_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`assessmentDate` date NOT NULL,
	`ballControl` int DEFAULT 50,
	`firstTouch` int DEFAULT 50,
	`dribbling` int DEFAULT 50,
	`passing` int DEFAULT 50,
	`shooting` int DEFAULT 50,
	`crossing` int DEFAULT 50,
	`heading` int DEFAULT 50,
	`leftFootScore` int DEFAULT 50,
	`rightFootScore` int DEFAULT 50,
	`twoFootedScore` int DEFAULT 50,
	`weakFootUsage` int DEFAULT 0,
	`speed` int DEFAULT 50,
	`acceleration` int DEFAULT 50,
	`agility` int DEFAULT 50,
	`stamina` int DEFAULT 50,
	`strength` int DEFAULT 50,
	`jumping` int DEFAULT 50,
	`positioning` int DEFAULT 50,
	`vision` int DEFAULT 50,
	`composure` int DEFAULT 50,
	`decisionMaking` int DEFAULT 50,
	`workRate` int DEFAULT 50,
	`marking` int DEFAULT 50,
	`tackling` int DEFAULT 50,
	`interceptions` int DEFAULT 50,
	`technicalOverall` int DEFAULT 50,
	`physicalOverall` int DEFAULT 50,
	`mentalOverall` int DEFAULT 50,
	`defensiveOverall` int DEFAULT 50,
	`overallRating` int DEFAULT 50,
	`potentialRating` int DEFAULT 60,
	`assessedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_skill_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int,
	`matchId` int,
	`sessionId` int,
	`title` varchar(200) NOT NULL,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`duration` int,
	`videoType` enum('match_highlight','training_clip','skill_demo','analysis','full_match') NOT NULL,
	`tags` text,
	`annotations` text,
	`aiAnalysis` text,
	`isPublic` boolean DEFAULT false,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_training_recommendations` ADD CONSTRAINT `ai_training_recommendations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_match_stats` ADD CONSTRAINT `player_match_stats_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_match_stats` ADD CONSTRAINT `player_match_stats_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_skill_scores` ADD CONSTRAINT `player_skill_scores_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_skill_scores` ADD CONSTRAINT `player_skill_scores_assessedBy_users_id_fk` FOREIGN KEY (`assessedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD CONSTRAINT `video_analysis_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD CONSTRAINT `video_analysis_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD CONSTRAINT `video_analysis_sessionId_training_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD CONSTRAINT `video_analysis_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;