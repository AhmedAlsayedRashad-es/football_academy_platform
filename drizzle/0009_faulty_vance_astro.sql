ALTER TABLE `video_analysis` ADD `fileSizeMb` int;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `playerName` varchar(200);--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `teamColor` varchar(50);--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `overallScore` int;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `movementAnalysis` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `technicalAnalysis` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `tacticalAnalysis` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `strengths` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `improvements` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `drillRecommendations` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `coachNotes` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `heatmapZones` text;--> statement-breakpoint
ALTER TABLE `video_analysis` ADD `analysisStatus` enum('pending','processing','completed','failed') DEFAULT 'pending';