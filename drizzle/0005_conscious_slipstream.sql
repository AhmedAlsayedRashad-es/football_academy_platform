CREATE TABLE `contact_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','read','replied','closed') DEFAULT 'new',
	`repliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gps_tracker_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`sessionId` int,
	`matchId` int,
	`deviceType` varchar(50),
	`deviceId` varchar(100),
	`recordedAt` timestamp NOT NULL,
	`totalDistance` int,
	`highSpeedDistance` int,
	`sprintDistance` int,
	`maxSpeed` int,
	`avgSpeed` int,
	`accelerations` int,
	`decelerations` int,
	`avgHeartRate` int,
	`maxHeartRate` int,
	`heartRateZones` text,
	`playerLoad` int,
	`metabolicPower` int,
	`rawData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gps_tracker_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registration_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentName` varchar(200) NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`parentPhone` varchar(20) NOT NULL,
	`childName` varchar(200) NOT NULL,
	`childDateOfBirth` date NOT NULL,
	`childAge` int,
	`preferredPosition` varchar(50),
	`currentClub` varchar(200),
	`experience` text,
	`medicalConditions` text,
	`howHeard` varchar(100),
	`message` text,
	`status` enum('pending','contacted','trial_scheduled','accepted','rejected') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registration_requests_id` PRIMARY KEY(`id`)
);
