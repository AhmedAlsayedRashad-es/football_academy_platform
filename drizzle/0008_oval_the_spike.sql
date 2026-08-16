CREATE TABLE `ai_video_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`title` varchar(200),
	`analysisType` enum('match','training','skills','movement') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`aiSummary` text,
	`strengths` text,
	`improvements` text,
	`technicalScore` int,
	`tacticalScore` int,
	`physicalScore` int,
	`recommendations` text,
	`analyzedAt` timestamp,
	`analyzedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_video_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`sessionId` int,
	`sessionType` enum('training','match','trial','assessment') NOT NULL,
	`sessionDate` date NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`checkInTime` timestamp,
	`checkOutTime` timestamp,
	`durationMinutes` int,
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masterclass_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleAr` varchar(200),
	`description` text,
	`descriptionAr` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`category` enum('getting_started','recommended','position_specific','skills','tactics') NOT NULL,
	`position` enum('goalkeeper','defender','midfielder','forward','all') DEFAULT 'all',
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`durationMinutes` int,
	`instructor` varchar(100),
	`partNumber` int,
	`seriesName` varchar(100),
	`isPublished` boolean DEFAULT true,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `masterclass_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`activityType` enum('training','match','assessment','trial') NOT NULL,
	`activityDate` timestamp NOT NULL,
	`durationMinutes` int NOT NULL,
	`opponent` varchar(100),
	`score` varchar(20),
	`result` enum('win','draw','loss'),
	`goals` int DEFAULT 0,
	`assists` int DEFAULT 0,
	`possessions` int,
	`workRate` int,
	`ballTouches` int,
	`speedActions` int,
	`releases` int,
	`leftFootPercent` int,
	`rightFootPercent` int,
	`position` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalRedeemed` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `points_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('attendance','performance','improvement','bonus','achievement','redemption') NOT NULL,
	`description` varchar(255),
	`referenceId` int,
	`referenceType` varchar(50),
	`awardedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`rewardId` int NOT NULL,
	`pointsSpent` int NOT NULL,
	`status` enum('pending','approved','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`redeemedAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`notes` text,
	CONSTRAINT `reward_redemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`description` text,
	`descriptionAr` text,
	`pointsCost` int NOT NULL,
	`category` enum('merchandise','training','experience','gift') NOT NULL,
	`imageUrl` text,
	`stock` int DEFAULT -1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`weekStartDate` date NOT NULL,
	`targetType` enum('speed_actions','ball_touches','training_hours','goals','assists') NOT NULL,
	`targetValue` int NOT NULL,
	`currentValue` int DEFAULT 0,
	`isCompleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_video_analysis` ADD CONSTRAINT `ai_video_analysis_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_video_analysis` ADD CONSTRAINT `ai_video_analysis_analyzedBy_users_id_fk` FOREIGN KEY (`analyzedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_activities` ADD CONSTRAINT `player_activities_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_points` ADD CONSTRAINT `player_points_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `points_transactions` ADD CONSTRAINT `points_transactions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `points_transactions` ADD CONSTRAINT `points_transactions_awardedBy_users_id_fk` FOREIGN KEY (`awardedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reward_redemptions` ADD CONSTRAINT `reward_redemptions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reward_redemptions` ADD CONSTRAINT `reward_redemptions_rewardId_rewards_id_fk` FOREIGN KEY (`rewardId`) REFERENCES `rewards`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekly_targets` ADD CONSTRAINT `weekly_targets_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;