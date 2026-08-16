ALTER TABLE `development_plans` MODIFY COLUMN `status` enum('active','completed','archived') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `development_goals` ADD `targetDate` date;--> statement-breakpoint
ALTER TABLE `development_goals` ADD `completedDate` date;--> statement-breakpoint
ALTER TABLE `development_goals` ADD `isCompleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `shortTermGoals` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `longTermGoals` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `technicalObjectives` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `physicalObjectives` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `mentalObjectives` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `nutritionObjectives` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `strengthsAnalysis` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `areasForImprovement` text;--> statement-breakpoint
ALTER TABLE `development_plans` ADD `actionPlan` text;--> statement-breakpoint
ALTER TABLE `development_goals` DROP COLUMN `deadline`;