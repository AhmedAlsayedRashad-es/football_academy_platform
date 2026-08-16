CREATE TABLE `coach_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`isAvailable` boolean DEFAULT true,
	`sessionType` enum('group','private','consultation','all') DEFAULT 'all',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`playerId` int,
	`playerName` varchar(200),
	`playerAge` int,
	`parentName` varchar(200),
	`parentEmail` varchar(320),
	`parentPhone` varchar(20),
	`status` enum('pending','confirmed','cancelled','waitlist') DEFAULT 'pending',
	`paymentStatus` enum('unpaid','paid','refunded') DEFAULT 'unpaid',
	`notes` text,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	`cancelledAt` timestamp,
	CONSTRAINT `event_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`durationMonths` int NOT NULL,
	`price` int NOT NULL,
	`originalPrice` int,
	`features` text,
	`isPopular` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coach_availability` ADD CONSTRAINT `coach_availability_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_eventId_academy_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `academy_events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;