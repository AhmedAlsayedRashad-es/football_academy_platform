CREATE TABLE `coach_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`bookingId` int,
	`rating` int NOT NULL,
	`comment` text,
	`isApproved` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_schedule_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`locationId` int,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isRecurring` boolean DEFAULT true,
	`specificDate` date,
	`isAvailable` boolean DEFAULT true,
	`pricePerSession` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_schedule_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_training_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`playerId` int NOT NULL,
	`bookedBy` int NOT NULL,
	`locationId` int,
	`slotId` int,
	`sessionDate` date NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
	`price` int,
	`notes` text,
	`coachNotes` text,
	`cancelledAt` timestamp,
	`cancelReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `private_training_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`description` text,
	`descriptionAr` text,
	`address` varchar(255),
	`capacity` int DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coach_reviews` ADD CONSTRAINT `coach_reviews_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_reviews` ADD CONSTRAINT `coach_reviews_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_schedule_slots` ADD CONSTRAINT `coach_schedule_slots_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_schedule_slots` ADD CONSTRAINT `coach_schedule_slots_locationId_training_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `training_locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD CONSTRAINT `private_training_bookings_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD CONSTRAINT `private_training_bookings_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD CONSTRAINT `private_training_bookings_bookedBy_users_id_fk` FOREIGN KEY (`bookedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD CONSTRAINT `private_training_bookings_locationId_training_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `training_locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD CONSTRAINT `private_training_bookings_slotId_coach_schedule_slots_id_fk` FOREIGN KEY (`slotId`) REFERENCES `coach_schedule_slots`(`id`) ON DELETE no action ON UPDATE no action;