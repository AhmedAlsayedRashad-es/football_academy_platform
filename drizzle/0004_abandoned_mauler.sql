CREATE TABLE `league_standings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`season` varchar(20) NOT NULL,
	`leagueName` varchar(100) NOT NULL,
	`played` int DEFAULT 0,
	`won` int DEFAULT 0,
	`drawn` int DEFAULT 0,
	`lost` int DEFAULT 0,
	`goalsFor` int DEFAULT 0,
	`goalsAgainst` int DEFAULT 0,
	`goalDifference` int DEFAULT 0,
	`points` int DEFAULT 0,
	`position` int DEFAULT 0,
	`form` varchar(10),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `league_standings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `man_of_the_match` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int NOT NULL,
	`rating` int DEFAULT 0,
	`reason` text,
	`selectedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `man_of_the_match_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `league_standings` ADD CONSTRAINT `league_standings_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `man_of_the_match` ADD CONSTRAINT `man_of_the_match_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `man_of_the_match` ADD CONSTRAINT `man_of_the_match_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `man_of_the_match` ADD CONSTRAINT `man_of_the_match_selectedBy_users_id_fk` FOREIGN KEY (`selectedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;