CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` enum('technical','physical','mental','nutritional','milestone','award') NOT NULL,
	`achievedDate` date NOT NULL,
	`iconType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`coachId` int NOT NULL,
	`sessionId` int,
	`feedbackDate` date NOT NULL,
	`category` enum('technical','physical','mental','tactical','general') NOT NULL,
	`rating` int,
	`strengths` text,
	`areasToImprove` text,
	`recommendations` text,
	`isVisibleToParent` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `development_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`category` enum('technical','physical','mental','nutritional','tactical') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`targetValue` int,
	`currentValue` int DEFAULT 0,
	`unit` varchar(50),
	`deadline` date,
	`status` enum('not_started','in_progress','completed','overdue') DEFAULT 'not_started',
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `development_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `development_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`status` enum('active','completed','paused') DEFAULT 'active',
	`overallProgress` int DEFAULT 0,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `development_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `injuries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`injuryType` varchar(100) NOT NULL,
	`bodyPart` varchar(100) NOT NULL,
	`severity` enum('minor','moderate','severe') NOT NULL,
	`injuryDate` date NOT NULL,
	`expectedRecoveryDate` date,
	`actualRecoveryDate` date,
	`status` enum('active','recovering','recovered','chronic') DEFAULT 'active',
	`treatment` text,
	`notes` text,
	`returnToPlayCleared` boolean DEFAULT false,
	`clearedBy` int,
	`clearedAt` timestamp,
	`reportedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `injuries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`planDate` date NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack','pre_training','post_training') NOT NULL,
	`foods` text,
	`calories` int DEFAULT 0,
	`protein` int DEFAULT 0,
	`carbs` int DEFAULT 0,
	`fats` int DEFAULT 0,
	`hydrationMl` int DEFAULT 0,
	`notes` text,
	`isConsumed` boolean DEFAULT false,
	`consumedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mental_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`assessmentDate` date NOT NULL,
	`confidenceLevel` int DEFAULT 5,
	`anxietyLevel` int DEFAULT 5,
	`motivationLevel` int DEFAULT 5,
	`focusLevel` int DEFAULT 5,
	`resilienceScore` int DEFAULT 5,
	`teamworkScore` int DEFAULT 5,
	`leadershipScore` int DEFAULT 5,
	`stressLevel` int DEFAULT 5,
	`overallMentalScore` int DEFAULT 50,
	`notes` text,
	`recommendations` text,
	`assessedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mental_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','success','warning','alert') DEFAULT 'info',
	`category` enum('performance','training','nutrition','mental','injury','achievement','general') DEFAULT 'general',
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nutrition_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`logDate` date NOT NULL,
	`totalCalories` int DEFAULT 0,
	`totalProtein` int DEFAULT 0,
	`totalCarbs` int DEFAULT 0,
	`totalFats` int DEFAULT 0,
	`hydrationMl` int DEFAULT 0,
	`mealsLogged` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nutrition_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_player_relations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`playerId` int NOT NULL,
	`relationship` enum('father','mother','guardian','other') DEFAULT 'guardian',
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parent_player_relations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`sessionDate` date NOT NULL,
	`sessionType` enum('training','match','assessment') NOT NULL,
	`touches` int DEFAULT 0,
	`passes` int DEFAULT 0,
	`passAccuracy` int DEFAULT 0,
	`shots` int DEFAULT 0,
	`shotsOnTarget` int DEFAULT 0,
	`dribbles` int DEFAULT 0,
	`successfulDribbles` int DEFAULT 0,
	`distanceCovered` int DEFAULT 0,
	`topSpeed` int DEFAULT 0,
	`sprints` int DEFAULT 0,
	`accelerations` int DEFAULT 0,
	`decelerations` int DEFAULT 0,
	`possessionWon` int DEFAULT 0,
	`possessionLost` int DEFAULT 0,
	`interceptions` int DEFAULT 0,
	`tackles` int DEFAULT 0,
	`technicalScore` int DEFAULT 0,
	`physicalScore` int DEFAULT 0,
	`tacticalScore` int DEFAULT 0,
	`overallScore` int DEFAULT 0,
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` date NOT NULL,
	`position` enum('goalkeeper','defender','midfielder','forward') NOT NULL,
	`preferredFoot` enum('left','right','both') DEFAULT 'right',
	`height` int,
	`weight` int,
	`jerseyNumber` int,
	`ageGroup` varchar(10),
	`teamId` int,
	`status` enum('active','injured','inactive','trial') DEFAULT 'active',
	`joinDate` date,
	`photoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`ageGroup` varchar(10) NOT NULL,
	`headCoachId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`sessionDate` date NOT NULL,
	`startTime` varchar(10),
	`endTime` varchar(10),
	`location` varchar(200),
	`sessionType` enum('technical','tactical','physical','match','recovery','mixed') NOT NULL,
	`objectives` text,
	`drills` text,
	`status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`attendanceCount` int DEFAULT 0,
	`coachId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int,
	`teamId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` enum('strength','endurance','agility','flexibility','recovery','match_prep') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate',
	`durationMinutes` int DEFAULT 60,
	`exercises` text,
	`scheduledDate` date,
	`isCompleted` boolean DEFAULT false,
	`completedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','coach','nutritionist','mental_coach','physical_trainer','parent','player') NOT NULL DEFAULT 'player';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_feedback` ADD CONSTRAINT `coach_feedback_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_feedback` ADD CONSTRAINT `coach_feedback_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_feedback` ADD CONSTRAINT `coach_feedback_sessionId_training_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `development_goals` ADD CONSTRAINT `development_goals_planId_development_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `development_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `development_plans` ADD CONSTRAINT `development_plans_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `development_plans` ADD CONSTRAINT `development_plans_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `injuries` ADD CONSTRAINT `injuries_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `injuries` ADD CONSTRAINT `injuries_clearedBy_users_id_fk` FOREIGN KEY (`clearedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `injuries` ADD CONSTRAINT `injuries_reportedBy_users_id_fk` FOREIGN KEY (`reportedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_plans` ADD CONSTRAINT `meal_plans_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_plans` ADD CONSTRAINT `meal_plans_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mental_assessments` ADD CONSTRAINT `mental_assessments_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mental_assessments` ADD CONSTRAINT `mental_assessments_assessedBy_users_id_fk` FOREIGN KEY (`assessedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nutrition_logs` ADD CONSTRAINT `nutrition_logs_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_player_relations` ADD CONSTRAINT `parent_player_relations_parentUserId_users_id_fk` FOREIGN KEY (`parentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_player_relations` ADD CONSTRAINT `parent_player_relations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_metrics` ADD CONSTRAINT `performance_metrics_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_metrics` ADD CONSTRAINT `performance_metrics_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_headCoachId_users_id_fk` FOREIGN KEY (`headCoachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_sessions` ADD CONSTRAINT `training_sessions_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_sessions` ADD CONSTRAINT `training_sessions_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_plans` ADD CONSTRAINT `workout_plans_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_plans` ADD CONSTRAINT `workout_plans_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_plans` ADD CONSTRAINT `workout_plans_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;