CREATE TABLE `training_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleAr` varchar(200),
	`description` text,
	`descriptionAr` text,
	`videoUrl` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`duration` int,
	`category` varchar(100) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`ageGroup` varchar(50),
	`tags` text,
	`uploadedBy` int NOT NULL,
	`isPublished` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `training_videos` ADD CONSTRAINT `training_videos_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;