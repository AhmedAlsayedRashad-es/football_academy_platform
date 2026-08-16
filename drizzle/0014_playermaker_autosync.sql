-- Add auto-sync columns to playermaker_settings
ALTER TABLE `playermaker_settings` ADD COLUMN IF NOT EXISTS `autoSyncEnabled` boolean DEFAULT false;
ALTER TABLE `playermaker_settings` ADD COLUMN IF NOT EXISTS `autoSyncFrequency` enum('hourly','daily','weekly') DEFAULT 'daily';
ALTER TABLE `playermaker_settings` ADD COLUMN IF NOT EXISTS `nextScheduledSync` timestamp NULL;

-- Create playermaker_sync_history table
CREATE TABLE IF NOT EXISTS `playermaker_sync_history` (
  `id` int AUTO_INCREMENT NOT NULL,
  `syncedAt` timestamp NOT NULL DEFAULT (now()),
  `syncType` enum('manual','auto') DEFAULT 'manual',
  `sessionType` enum('training','match','all') DEFAULT 'all',
  `startDate` date,
  `endDate` date,
  `sessionsCount` int DEFAULT 0,
  `metricsCount` int DEFAULT 0,
  `success` boolean DEFAULT true,
  `errorMessage` text,
  `duration` int,
  CONSTRAINT `playermaker_sync_history_id` PRIMARY KEY(`id`)
);
