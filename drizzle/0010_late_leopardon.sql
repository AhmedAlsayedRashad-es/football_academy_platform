CREATE TABLE `drill_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`drillId` int NOT NULL,
	`videoAnalysisId` int,
	`reason` text,
	`reasonAr` text,
	`priority` enum('high','medium','low') DEFAULT 'medium',
	`improvementArea` varchar(100),
	`isCompleted` boolean DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drill_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_drills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleAr` varchar(200),
	`description` text,
	`descriptionAr` text,
	`category` enum('ball_control','passing','shooting','dribbling','speed_agility','positioning','heading','goalkeeper','fitness','tactical') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced','elite') DEFAULT 'intermediate',
	`duration` int DEFAULT 15,
	`videoUrl` text,
	`thumbnailUrl` text,
	`targetsBallControl` boolean DEFAULT false,
	`targetsPassing` boolean DEFAULT false,
	`targetsShooting` boolean DEFAULT false,
	`targetsDribbling` boolean DEFAULT false,
	`targetsSpeed` boolean DEFAULT false,
	`targetsPositioning` boolean DEFAULT false,
	`targetsFirstTouch` boolean DEFAULT false,
	`targetsHeading` boolean DEFAULT false,
	`forPosition` enum('goalkeeper','defender','midfielder','forward','all') DEFAULT 'all',
	`pointsReward` int DEFAULT 10,
	`equipmentNeeded` text,
	`equipmentNeededAr` text,
	`coachTips` text,
	`coachTipsAr` text,
	`viewCount` int DEFAULT 0,
	`completionCount` int DEFAULT 0,
	`avgRating` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_drills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_drill_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerId` int,
	`drillId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
	`completedAt` timestamp,
	`watchTimeSeconds` int DEFAULT 0,
	`rating` int,
	`notes` text,
	`pointsEarned` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_drill_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drill_recommendations` ADD CONSTRAINT `drill_recommendations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drill_recommendations` ADD CONSTRAINT `drill_recommendations_drillId_training_drills_id_fk` FOREIGN KEY (`drillId`) REFERENCES `training_drills`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_drill_progress` ADD CONSTRAINT `user_drill_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_drill_progress` ADD CONSTRAINT `user_drill_progress_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_drill_progress` ADD CONSTRAINT `user_drill_progress_drillId_training_drills_id_fk` FOREIGN KEY (`drillId`) REFERENCES `training_drills`(`id`) ON DELETE no action ON UPDATE no action;