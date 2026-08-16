CREATE TABLE `academy_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`eventType` enum('training','tournament','trial','camp','workshop','match','meeting','other') NOT NULL,
	`location` varchar(200),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`ageGroups` text,
	`maxParticipants` int,
	`currentParticipants` int DEFAULT 0,
	`registrationDeadline` timestamp,
	`fee` int,
	`isPublic` boolean DEFAULT true,
	`status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
	`imageUrl` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(100),
	`specialization` enum('technical','tactical','fitness','goalkeeping','youth_development','mental','nutrition'),
	`qualifications` text,
	`experience` text,
	`yearsExperience` int,
	`bio` text,
	`achievements` text,
	`languages` text,
	`photoUrl` text,
	`linkedIn` varchar(200),
	`isPublic` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `academy_events` ADD CONSTRAINT `academy_events_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD CONSTRAINT `coach_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;