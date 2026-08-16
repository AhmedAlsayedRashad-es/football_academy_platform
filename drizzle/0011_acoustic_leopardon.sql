CREATE TABLE `drill_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`drillId` varchar(100) NOT NULL,
	`drillName` varchar(200) NOT NULL,
	`drillNameAr` varchar(200),
	`category` varchar(100),
	`assignedBy` int NOT NULL,
	`videoAnalysisId` int,
	`improvementArea` varchar(100),
	`reason` text,
	`dueDate` date,
	`status` enum('pending','in_progress','completed','skipped') DEFAULT 'pending',
	`completedAt` timestamp,
	`playerNotes` text,
	`coachFeedback` text,
	`priority` enum('high','medium','low') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drill_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drill_assignments` ADD CONSTRAINT `drill_assignments_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drill_assignments` ADD CONSTRAINT `drill_assignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;