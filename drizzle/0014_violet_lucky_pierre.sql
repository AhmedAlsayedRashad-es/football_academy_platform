CREATE TABLE `academy_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` enum('hero','gallery_drills','gallery_highlights','gallery_skills','training','other') NOT NULL,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`fileKey` varchar(500) NOT NULL,
	`duration` int,
	`fileSize` int,
	`uploadedBy` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_prediction_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predictionType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`entityType` enum('player','team') NOT NULL,
	`predictionDate` timestamp NOT NULL DEFAULT (now()),
	`predictedOutcome` text NOT NULL,
	`predictedScore` decimal(5,2),
	`actualOutcome` text,
	`actualScore` decimal(5,2),
	`accuracyRating` int,
	`wasAccurate` boolean,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_prediction_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_response_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cache_key` varchar(255) NOT NULL,
	`function_name` varchar(100) NOT NULL,
	`request_params` json,
	`response` text NOT NULL,
	`context_data` json,
	`user_id` int,
	`expires_at` timestamp NOT NULL,
	`hit_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_accessed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_response_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_response_cache_cache_key_unique` UNIQUE(`cache_key`)
);
--> statement-breakpoint
CREATE TABLE `ai_tool_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tool_path` varchar(255) NOT NULL,
	`tool_label` varchar(255) NOT NULL,
	`used_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_tool_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`category` enum('completion','excellence','mastery','milestone','education','performance') NOT NULL,
	`criteria` json NOT NULL,
	`display_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`coverImage` text,
	`authorId` int NOT NULL,
	`category` enum('news','training','events','achievements','general') DEFAULT 'general',
	`status` enum('draft','published','archived') DEFAULT 'draft',
	`publishedAt` timestamp,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `career_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`position` enum('football_coach','fitness_coach','goalkeeper_coach','sports_psychologist','analyst','physiotherapist','other') NOT NULL,
	`yearsExperience` int NOT NULL,
	`qualifications` text NOT NULL,
	`previousClubs` text,
	`cvUrl` text,
	`coverLetter` text,
	`linkedinUrl` varchar(500),
	`status` enum('pending','reviewing','shortlisted','interviewed','accepted','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `career_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`type` enum('quiz_streak','perfect_score','multiple_courses','high_average') NOT NULL,
	`criteria` json NOT NULL,
	`reward` json NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_qa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`keywords` text,
	`category` varchar(50) DEFAULT 'general',
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_qa_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`quizAttemptId` int NOT NULL,
	`certificateNumber` varchar(50) NOT NULL,
	`certificateUrl` varchar(500) NOT NULL,
	`level` enum('grassroots','c_license','b_license','a_license','pro_license') NOT NULL,
	`score` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`verificationCode` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `coach_certificates_certificateNumber_unique` UNIQUE(`certificateNumber`),
	CONSTRAINT `coach_certificates_verificationCode_unique` UNIQUE(`verificationCode`)
);
--> statement-breakpoint
CREATE TABLE `coach_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachUserId` int NOT NULL,
	`evaluatedBy` int NOT NULL,
	`sessionQuality` int NOT NULL,
	`playerEngagement` int NOT NULL,
	`technicalKnowledge` int NOT NULL,
	`communication` int NOT NULL,
	`punctuality` int NOT NULL,
	`overallScore` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_private_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId_cpp` int NOT NULL,
	`coachId_cpp` int NOT NULL,
	`playerId_cpp` int NOT NULL,
	`amount_cpp` int NOT NULL,
	`currency_cpp` varchar(10) DEFAULT 'EGP',
	`paymentDate_cpp` date NOT NULL,
	`month_cpp` int NOT NULL,
	`year_cpp` int NOT NULL,
	`status_cpp` enum('paid','pending','overdue','waived') NOT NULL DEFAULT 'pending',
	`paymentMethod_cpp` varchar(50),
	`notes_cpp` text,
	`createdAt_cpp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_private_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_private_session_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId_cpsp` int NOT NULL,
	`playerId_cpsp` int NOT NULL,
	`attendance_cpsp` enum('present','absent','late','excused') DEFAULT 'present',
	`performanceRating_cpsp` int,
	`coachNotes_cpsp` text,
	`addedAt_cpsp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_private_session_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_private_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId_cps` int NOT NULL,
	`teamId_cps` int,
	`title_cps` varchar(200) NOT NULL,
	`description_cps` text,
	`sessionDate_cps` date NOT NULL,
	`startTime_cps` varchar(10),
	`endTime_cps` varchar(10),
	`location_cps` varchar(200),
	`sessionType_cps` enum('technical','tactical','physical','match','recovery','mixed') NOT NULL DEFAULT 'technical',
	`objectives_cps` text,
	`notes_cps` text,
	`status_cps` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt_cps` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_cps` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_private_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_private_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId_cpsub` int NOT NULL,
	`playerId_cpsub` int NOT NULL,
	`teamId_cpsub` int,
	`planName_cpsub` varchar(100) NOT NULL,
	`monthlyFee_cpsub` int NOT NULL,
	`currency_cpsub` varchar(10) DEFAULT 'EGP',
	`startDate_cpsub` date NOT NULL,
	`endDate_cpsub` date,
	`status_cpsub` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
	`notes_cpsub` text,
	`createdAt_cpsub` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_cpsub` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_private_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_private_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId_cptm` int NOT NULL,
	`playerId_cptm` int NOT NULL,
	`position_cptm` varchar(50),
	`jerseyNumber_cptm` int,
	`notes_cptm` text,
	`addedAt_cptm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_private_team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_private_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId_cpt` int NOT NULL,
	`name_cpt` varchar(150) NOT NULL,
	`description_cpt` text,
	`ageGroup_cpt` varchar(20),
	`logoUrl_cpt` text,
	`isActive_cpt` boolean NOT NULL DEFAULT true,
	`createdAt_cpt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_cpt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_private_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_training_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`teamId` int,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`ageGroup` varchar(50),
	`totalWeeks` int NOT NULL DEFAULT 4,
	`sessionsPerWeek` int NOT NULL DEFAULT 3,
	`sessionDurationMins` int NOT NULL DEFAULT 90,
	`objective` text,
	`level` enum('beginner','intermediate','advanced') DEFAULT 'intermediate',
	`status` enum('draft','active','completed','archived') DEFAULT 'draft',
	`sessions` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_training_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text NOT NULL,
	`descriptionAr` text,
	`category` enum('fifa_license','laws_of_game','tactics','training','youth_development','psychology','nutrition','fitness') NOT NULL,
	`level` enum('grassroots','c_license','b_license','a_license','pro_license','beginner','intermediate','advanced') NOT NULL,
	`duration` int,
	`thumbnailUrl` varchar(500),
	`isPublished` boolean NOT NULL DEFAULT false,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_cs` varchar(255) NOT NULL,
	`email_cs` varchar(255) NOT NULL,
	`phone_cs` varchar(50),
	`subject_cs` varchar(255),
	`message_cs` text NOT NULL,
	`status_cs` enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
	`createdAt_cs` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`coachUserId` int NOT NULL,
	`playerId` int,
	`subject` varchar(255),
	`status` enum('active','archived','closed') DEFAULT 'active',
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`progress` int DEFAULT 0,
	`certificateUrl` varchar(500),
	CONSTRAINT `course_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sequenceNumber` int NOT NULL,
	`contentType` enum('video','article','quiz','assignment') NOT NULL,
	`videoUrl` text,
	`articleContent` text,
	`duration` int,
	`isPreview` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text,
	`descriptionAr` text,
	`videoUrl` varchar(500),
	`content` text,
	`contentAr` text,
	`duration` int,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(20) DEFAULT '#3b82f6',
	`isSystemRole` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `device_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`sessionType` varchar(64) NOT NULL DEFAULT 'training',
	`sessionDate` timestamp NOT NULL DEFAULT (now()),
	`durationMinutes` int,
	`totalTouches` int DEFAULT 0,
	`totalStrikes` int DEFAULT 0,
	`totalPasses` int DEFAULT 0,
	`totalPossessions` int DEFAULT 0,
	`totalPossessionTimeMin` decimal(8,2) DEFAULT '0',
	`avgPossessionDurationS` decimal(8,2) DEFAULT '0',
	`totalSprints` int DEFAULT 0,
	`totalTurns` int DEFAULT 0,
	`turnsWithBall` int DEFAULT 0,
	`avgTurnEntrySpeedMs` decimal(8,2) DEFAULT '0',
	`maxTurnEntrySpeedMs` decimal(8,2) DEFAULT '0',
	`avgTurnExitSpeedMs` decimal(8,2) DEFAULT '0',
	`leftTurns` int DEFAULT 0,
	`rightTurns` int DEFAULT 0,
	`backTurns` int DEFAULT 0,
	`intenseTurns` int DEFAULT 0,
	`firstStepAccelerations` int DEFAULT 0,
	`intenseAccelerations` int DEFAULT 0,
	`totalAccelerations` int DEFAULT 0,
	`totalDecelerations` int DEFAULT 0,
	`totalDistanceM` decimal(10,2) DEFAULT '0',
	`sprintDistanceM` decimal(10,2) DEFAULT '0',
	`topSpeedKph` decimal(6,2) DEFAULT '0',
	`kickingPowerKph` decimal(6,2) DEFAULT '0',
	`validSteps` int DEFAULT 0,
	`jumps` int DEFAULT 0,
	`workCaloriesKcal` decimal(8,2) DEFAULT '0',
	`activeTimePercent` decimal(5,2) DEFAULT '0',
	`workRatePerMin` decimal(8,2) DEFAULT '0',
	`sprintWithBallCount` int DEFAULT 0,
	`sprintWithoutBallCount` int DEFAULT 0,
	`leftFootTouches` int DEFAULT 0,
	`rightFootTouches` int DEFAULT 0,
	`leftFootReleases` int DEFAULT 0,
	`rightFootReleases` int DEFAULT 0,
	`leftFootKickingPower` decimal(6,2) DEFAULT '0',
	`rightFootKickingPower` decimal(6,2) DEFAULT '0',
	`lacesReleases` int DEFAULT 0,
	`insideReleases` int DEFAULT 0,
	`otherReleases` int DEFAULT 0,
	`oneTouchPossessions` int DEFAULT 0,
	`multiTouchPossessions` int DEFAULT 0,
	`multiTouchDurationS` decimal(8,2) DEFAULT '0',
	`rawInsights` json,
	`timelineEvents` json,
	`ballControlScore` int,
	`agilityScore` int,
	`workloadScore` int,
	`overallScore` int,
	`deviceId` varchar(128),
	`firmwareVersion` varchar(32),
	`notes` text,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `device_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drill_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text,
	`descriptionAr` text,
	`skillArea` varchar(100) NOT NULL,
	`ageGroup` varchar(50),
	`difficulty` varchar(50),
	`duration` int,
	`videoUrl` text,
	`thumbnailUrl` text,
	`tags` text,
	`uploadedBy` int,
	`isActive` boolean DEFAULT true,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drill_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `education_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('sports_psychology','nutrition','injury_prevention','youth_development','parenting','general') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`duration` int,
	`thumbnailUrl` text,
	`instructorName` varchar(255),
	`instructorBio` text,
	`isPublished` boolean DEFAULT false,
	`enrollmentCount` int DEFAULT 0,
	`rating` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `education_courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetAudience` enum('new_players','new_parents','all_players','all_parents','coaches','custom') NOT NULL,
	`status` enum('draft','active','paused','completed') DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`status` enum('scheduled','sent','delivered','opened','clicked','bounced','failed') DEFAULT 'scheduled',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`sequenceNumber` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlContent` text NOT NULL,
	`plainTextContent` text,
	`delayDays` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentFirstName` varchar(100) NOT NULL,
	`studentLastName` varchar(100) NOT NULL,
	`dateOfBirth` date NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`parentFirstName` varchar(100) NOT NULL,
	`parentLastName` varchar(100) NOT NULL,
	`parentEmail` varchar(255) NOT NULL,
	`parentPhone` varchar(50) NOT NULL,
	`program` enum('beginner','intermediate','advanced','elite') NOT NULL,
	`ageGroup` varchar(50) NOT NULL,
	`preferredPosition` enum('goalkeeper','defender','midfielder','forward','any') DEFAULT 'any',
	`previousExperience` text,
	`medicalConditions` text,
	`emergencyContact` varchar(50),
	`birthCertificateUrl` varchar(500),
	`medicalCertificateUrl` varchar(500),
	`photoIdUrl` varchar(500),
	`teamId` int,
	`status` enum('pending','approved','rejected','contacted') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollment_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`exercise_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `exercise_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('equipment','facilities','salaries','transport','medical','training','marketing','utilities','other') NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`expenseDate` date NOT NULL,
	`vendor` varchar(150),
	`receiptUrl` varchar(500),
	`approvedBy` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `football_laws` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`contentAr` text NOT NULL,
	`summary` text,
	`summaryAr` text,
	`diagramUrl` varchar(500),
	`videoUrl` varchar(500),
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `football_laws_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`templateName` varchar(20),
	`description` text,
	`positions` text NOT NULL,
	`teamId` int,
	`createdBy` int NOT NULL,
	`isTemplate` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`post_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `forum_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`author_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`post_type` enum('question','discussion','tip','success_story') DEFAULT 'discussion',
	`tags` json,
	`upvotes` int DEFAULT 0,
	`downvotes` int DEFAULT 0,
	`reply_count` int DEFAULT 0,
	`view_count` int DEFAULT 0,
	`has_accepted_answer` boolean DEFAULT false,
	`is_pinned` boolean DEFAULT false,
	`is_locked` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`author_id` int NOT NULL,
	`content` text NOT NULL,
	`upvotes` int DEFAULT 0,
	`downvotes` int DEFAULT 0,
	`is_best_answer` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`target_type` enum('post','reply') NOT NULL,
	`target_id` int NOT NULL,
	`vote_type` enum('upvote','downvote') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `forum_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gps_live_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`liveMatchId` int NOT NULL,
	`playerId` int NOT NULL,
	`deviceId` varchar(100),
	`lastSyncTime` timestamp NOT NULL,
	`syncStatus` enum('active','paused','stopped','error') DEFAULT 'active',
	`dataPoints` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gps_live_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_development_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupPlanId_gdg` int NOT NULL,
	`category_gdg` enum('technical','physical','tactical','mental') NOT NULL DEFAULT 'physical',
	`title_gdg` varchar(200) NOT NULL,
	`description_gdg` text,
	`targetDate_gdg` date,
	`progress_gdg` int NOT NULL DEFAULT 0,
	`priority_gdg` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`completed_gdg` boolean NOT NULL DEFAULT false,
	`createdAt_gdg` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_gdg` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `group_development_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_development_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_gdp` varchar(200) NOT NULL,
	`createdByUserId_gdp` int,
	`playerIds_gdp` text NOT NULL,
	`notes_gdp` text,
	`createdAt_gdp` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_gdp` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `group_development_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `home_page_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section_type` enum('hero','features','gallery','video','testimonials','stats','pricing','team','events','training') NOT NULL,
	`title` varchar(255),
	`subtitle` text,
	`content` text,
	`cta_text` varchar(100),
	`cta_link` varchar(255),
	`image_url` text,
	`video_url` text,
	`display_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `home_page_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `injury_risk_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`assessmentDate` date NOT NULL,
	`acuteWorkload` int,
	`chronicWorkload` int,
	`acuteChronicRatio` int,
	`recentTrainingSessions` int,
	`recentMatchMinutes` int,
	`recentHighIntensityMinutes` int,
	`daysSinceLastMatch` int,
	`daysSinceLastTraining` int,
	`sleepQualityScore` int,
	`fatigueLevel` int,
	`musclesSoreness` int,
	`overallRiskScore` int,
	`riskLevel` enum('low','moderate','high','critical'),
	`predictedInjuryTypes` json,
	`recommendedRestDays` int,
	`recommendedTrainingLoad` int,
	`specificRecommendations` json,
	`aiAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `injury_risk_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`playerId` int,
	`parentId` int,
	`issueDate` date NOT NULL,
	`dueDate` date NOT NULL,
	`totalAmount` int NOT NULL,
	`paidAmount` int DEFAULT 0,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`items` json,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `live_match_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`minute` int NOT NULL,
	`noteType` enum('tactical','substitution','injury','goal','card','observation','instruction') NOT NULL,
	`content` text NOT NULL,
	`playerId` int,
	`importance` enum('low','medium','high') DEFAULT 'medium',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_match_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int,
	`teamId` int NOT NULL,
	`opponent` varchar(200) NOT NULL,
	`opponentFormation` varchar(20),
	`currentFormation` varchar(20) NOT NULL,
	`currentMinute` int DEFAULT 0,
	`homeScore` int DEFAULT 0,
	`awayScore` int DEFAULT 0,
	`isHome` boolean DEFAULT true,
	`status` enum('not_started','first_half','half_time','second_half','extra_time','finished') DEFAULT 'not_started',
	`startedAt` timestamp,
	`pausedAt` timestamp,
	`finishedAt` timestamp,
	`possession` int DEFAULT 50,
	`shots` int DEFAULT 0,
	`shotsOnTarget` int DEFAULT 0,
	`corners` int DEFAULT 0,
	`fouls` int DEFAULT 0,
	`offsides` int DEFAULT 0,
	`yellowCards` int DEFAULT 0,
	`redCards` int DEFAULT 0,
	`opponentShots` int DEFAULT 0,
	`opponentShotsOnTarget` int DEFAULT 0,
	`opponentCorners` int DEFAULT 0,
	`opponentFouls` int DEFAULT 0,
	`substitutionsUsed` int DEFAULT 0,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locker_room_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`fromUserId` int NOT NULL,
	`clipId` int,
	`videoSessionId` int,
	`messageType` enum('feedback','praise','correction','tactical','motivation','challenge') NOT NULL DEFAULT 'feedback',
	`subject` varchar(255),
	`content` text NOT NULL,
	`videoTimestamp` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`playerResponse` text,
	`playerRespondedAt` timestamp,
	`priority` enum('low','normal','high') NOT NULL DEFAULT 'normal',
	`attachedVideoId` varchar(50),
	`attachedVideoTitle` varchar(255),
	`attachedVideoCategory` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `locker_room_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_briefings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int,
	`title` varchar(200) NOT NULL,
	`oppositionId` int,
	`formationId` int,
	`objectives` text,
	`keyTactics` text,
	`playerInstructions` text,
	`setPieceIds` text,
	`notes` text,
	`createdBy` int NOT NULL,
	`teamId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `match_briefings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_defensive_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int,
	`playerName` varchar(200) NOT NULL,
	`teamId` int NOT NULL,
	`minute` int NOT NULL,
	`positionX` int NOT NULL,
	`positionY` int NOT NULL,
	`actionType` enum('tackle','interception','block','clearance','aerial_duel') NOT NULL,
	`isSuccessful` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_defensive_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_event_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionName` varchar(255) NOT NULL,
	`matchId` int,
	`homeTeam` varchar(100),
	`awayTeam` varchar(100),
	`matchDate` timestamp,
	`eventsData` text NOT NULL,
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastAutoSave` timestamp,
	CONSTRAINT `match_event_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`liveMatchId` int NOT NULL,
	`eventType` enum('goal','yellow_card','red_card','substitution','injury','penalty','own_goal','var_decision') NOT NULL,
	`minute` int NOT NULL,
	`playerId` int,
	`playerName` varchar(200),
	`assistPlayerId` int,
	`assistPlayerName` varchar(200),
	`substitutedPlayerId` int,
	`substitutedPlayerName` varchar(200),
	`isOurTeam` boolean DEFAULT true,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_passes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`fromPlayerId` int,
	`fromPlayerName` varchar(200) NOT NULL,
	`toPlayerId` int,
	`toPlayerName` varchar(200) NOT NULL,
	`teamId` int NOT NULL,
	`minute` int NOT NULL,
	`fromX` int NOT NULL,
	`fromY` int NOT NULL,
	`toX` int NOT NULL,
	`toY` int NOT NULL,
	`xAValue` decimal(5,3) NOT NULL,
	`isSuccessful` boolean NOT NULL DEFAULT true,
	`isKeyPass` boolean DEFAULT false,
	`isAssist` boolean DEFAULT false,
	`passType` enum('short','long','through_ball','cross','corner','free_kick'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_passes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_shots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int,
	`playerName` varchar(200) NOT NULL,
	`teamId` int NOT NULL,
	`minute` int NOT NULL,
	`positionX` int NOT NULL,
	`positionY` int NOT NULL,
	`xGValue` decimal(5,3) NOT NULL,
	`isGoal` boolean NOT NULL DEFAULT false,
	`isOnTarget` boolean DEFAULT false,
	`shotType` enum('right_foot','left_foot','header','other'),
	`bodyPart` varchar(50),
	`situation` enum('open_play','corner','free_kick','penalty','counter_attack'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_shots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opponentId` int NOT NULL,
	`matchDate` date NOT NULL,
	`ourFormation` varchar(50) NOT NULL,
	`tacticalApproach` text NOT NULL,
	`keyFocusAreas` text NOT NULL,
	`playerInstructions` text,
	`setPieceStrategy` text,
	`substitutionPlan` text,
	`predictedOutcome` varchar(100),
	`confidence` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `match_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerId` int,
	`mealType` enum('breakfast','lunch','dinner','snack','pre_workout','post_workout') NOT NULL,
	`mealDate` date NOT NULL,
	`mealTime` timestamp NOT NULL,
	`photoUrl` text,
	`recognizedFoods` json,
	`totalCalories` int,
	`totalProtein` int,
	`totalCarbs` int,
	`totalFat` int,
	`aiAnalysis` text,
	`nutritionScore` int,
	`recommendations` text,
	`alignsWithPlan` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meal_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`messageText` text NOT NULL,
	`attachmentUrl` text,
	`attachmentType` enum('image','pdf','video','document'),
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `module_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`watchTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `module_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailEnabled` boolean DEFAULT true,
	`emailReports` boolean DEFAULT true,
	`emailMessages` boolean DEFAULT true,
	`emailBookings` boolean DEFAULT true,
	`emailAnnouncements` boolean DEFAULT true,
	`pushEnabled` boolean DEFAULT true,
	`pushMessages` boolean DEFAULT true,
	`pushBookings` boolean DEFAULT true,
	`pushReports` boolean DEFAULT true,
	`whatsappEnabled` boolean DEFAULT false,
	`whatsappMessages` boolean DEFAULT false,
	`whatsappBookings` boolean DEFAULT false,
	`soundEnabled` boolean DEFAULT true,
	`desktopNotifications` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `opponent_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opponentId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`videoUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`matchDate` date,
	`competition` varchar(100),
	`result` varchar(50),
	`analysisNotes` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opponent_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opponents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`logo` text,
	`league` varchar(100),
	`ageGroup` varchar(50),
	`coachName` varchar(100),
	`typicalFormation` varchar(50),
	`playingStyle` text,
	`strengths` text,
	`weaknesses` text,
	`keyPlayers` text,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opponents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opposition_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opponentName` varchar(200) NOT NULL,
	`matchId` int,
	`formation` varchar(20),
	`playStyle` enum('attacking','defensive','possession','counter','balanced'),
	`strengths` text,
	`weaknesses` text,
	`keyPlayers` text,
	`patterns` text,
	`setPlays` text,
	`notes` text,
	`videoClipIds` text,
	`createdBy` int NOT NULL,
	`teamId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opposition_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_education_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`progress` int DEFAULT 0,
	`certificateUrl` text,
	`lastAccessedAt` timestamp,
	CONSTRAINT `parent_education_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`lessonId` int NOT NULL,
	`completed` boolean DEFAULT false,
	`completedAt` timestamp,
	`timeSpent` int,
	`lastPosition` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_lesson_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int,
	`invoiceId` int,
	`feeId` int,
	`amount` int NOT NULL,
	`paymentDate` date NOT NULL,
	`method` enum('cash','bank_transfer','instapay','vodafone_cash','check','other') NOT NULL DEFAULT 'cash',
	`reference` varchar(100),
	`receivedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permission_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('role_created','role_updated','role_deleted','permission_granted','permission_revoked','tab_assigned','tab_removed','user_role_assigned','user_role_removed') NOT NULL,
	`performedBy` int NOT NULL,
	`targetUserId` int,
	`targetRoleId` int,
	`targetPermissionId` int,
	`targetTabId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permission_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`resource` varchar(50) NOT NULL,
	`action` enum('view','create','edit','delete','export','assign','approve','manage') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `player_blood_markers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`testDate` timestamp NOT NULL DEFAULT (now()),
	`ferritin` varchar(10),
	`hemoglobin` varchar(10),
	`creatineKinase` varchar(10),
	`testosterone` varchar(10),
	`cortisol` varchar(10),
	`vitaminD` varchar(10),
	`vitaminB12` varchar(10),
	`magnesium` varchar(10),
	`sodium` varchar(10),
	`potassium` varchar(10),
	`glucose` varchar(10),
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_blood_markers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_development_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`createdByUserId` int,
	`category` enum('technical','physical','tactical','mental') NOT NULL DEFAULT 'technical',
	`title` varchar(200) NOT NULL,
	`description` text,
	`targetDate` date,
	`progress` int NOT NULL DEFAULT 0,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`completed` boolean NOT NULL DEFAULT false,
	`drills` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_development_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`season` varchar(20) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`amount` int NOT NULL,
	`dueDate` date NOT NULL,
	`paidDate` date,
	`status` enum('pending','paid','overdue','waived','partial') NOT NULL DEFAULT 'pending',
	`paidAmount` int DEFAULT 0,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_fees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_heatmaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`matchId` int,
	`clipId` int,
	`heatmapData` text NOT NULL,
	`averagePosition` varchar(50),
	`distanceCovered` int,
	`topSpeed` int,
	`sprintCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_heatmaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_instructions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`matchId` int,
	`briefingId` int,
	`role` varchar(100),
	`position` varchar(50),
	`instructions` text NOT NULL,
	`markingAssignment` varchar(100),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_instructions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_medical_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`height` varchar(10),
	`weight` varchar(10),
	`bmi` varchar(10),
	`bodyFatPercent` varchar(10),
	`muscleMassKg` varchar(10),
	`restingHR` int,
	`bloodPressure` varchar(20),
	`injuryRiskScore` int,
	`dominantFoot` enum('right','left','both') DEFAULT 'right',
	`bloodType` varchar(5),
	`allergies` text,
	`chronicConditions` text,
	`emergencyContact` varchar(255),
	`notes` text,
	`recordedBy` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_medical_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_muscle_measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`measurementDate` timestamp NOT NULL DEFAULT (now()),
	`leftQuad` varchar(10),
	`rightQuad` varchar(10),
	`leftHamstring` varchar(10),
	`rightHamstring` varchar(10),
	`leftCalf` varchar(10),
	`rightCalf` varchar(10),
	`leftBicep` varchar(10),
	`rightBicep` varchar(10),
	`chest` varchar(10),
	`waist` varchar(10),
	`hip` varchar(10),
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_muscle_measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_physical_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`testDate` timestamp NOT NULL DEFAULT (now()),
	`sprint10m` varchar(10),
	`sprint30m` varchar(10),
	`sprintMax` varchar(10),
	`verticalJump` varchar(10),
	`broadJump` varchar(10),
	`benchPress` varchar(10),
	`squat` varchar(10),
	`vo2Max` varchar(10),
	`beepTestLevel` varchar(10),
	`sitAndReach` varchar(10),
	`shoulderFlexibility` varchar(10),
	`agilityT` varchar(10),
	`illinois` varchar(10),
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_physical_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`liveMatchId` int NOT NULL,
	`playerId` int NOT NULL,
	`minute` int NOT NULL,
	`xPosition` int NOT NULL,
	`yPosition` int NOT NULL,
	`speed` int DEFAULT 0,
	`heartRate` int,
	`source` enum('manual','gps','video_analysis') DEFAULT 'manual',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_suspensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`teamId` int,
	`suspensionType` enum('yellow_accumulation','red_card','double_yellow','manual') NOT NULL,
	`reason` varchar(500),
	`banMatchesTotal` int NOT NULL DEFAULT 1,
	`banMatchesRemaining` int NOT NULL DEFAULT 1,
	`triggeredByMatchId` int,
	`triggeredByEventId` int,
	`startDate` date,
	`endDate` date,
	`status_ps` enum('active','served','appealed','cancelled') NOT NULL DEFAULT 'active',
	`createdBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_suspensions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_training_load` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`weekStart` timestamp NOT NULL,
	`acuteLoad` int,
	`chronicLoad` int,
	`acRatio` varchar(10),
	`riskLevel` enum('low','moderate','high','very_high') DEFAULT 'low',
	`sessionsCount` int,
	`totalMinutes` int,
	`rpe` int,
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_training_load_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`valuationDate` timestamp NOT NULL DEFAULT (now()),
	`estimatedValue` decimal(12,2) NOT NULL,
	`currency` varchar(10) DEFAULT 'USD',
	`technicalScore` int DEFAULT 50,
	`physicalScore` int DEFAULT 50,
	`mentalScore` int DEFAULT 50,
	`performanceScore` int DEFAULT 50,
	`potentialScore` int DEFAULT 50,
	`marketDemandScore` int DEFAULT 50,
	`injuryRiskScore` int DEFAULT 50,
	`contractScore` int DEFAULT 50,
	`overallRating` int DEFAULT 50,
	`trend` enum('rising','stable','declining') DEFAULT 'stable',
	`comparablePlayer` varchar(100),
	`aiNarrative` text,
	`valuedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `player_valuations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playermaker_coach_annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`coachId` int NOT NULL,
	`coachName` varchar(255) NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playermaker_coach_annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playermaker_player_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`playerId` int,
	`playermakerPlayerId` varchar(100),
	`playerName` varchar(255),
	`ageGroup` varchar(50),
	`participationTime` decimal(10,2),
	`totalTouches` int,
	`leftLegTouches` int,
	`rightLegTouches` int,
	`touchesPerMin` decimal(10,2),
	`releases` int,
	`releasesLeft` int,
	`releasesRight` int,
	`releasesPerMin` decimal(10,2),
	`totalPossessions` int,
	`oneTouch` int,
	`oneTouchLeft` int,
	`oneTouchRight` int,
	`shortPossessions` int,
	`avgTimeOnBallShort` decimal(10,2),
	`longPossessions` int,
	`avgTimeOnBallLong` decimal(10,2),
	`totalTimeOnBall` decimal(10,2),
	`successfulPasses` int,
	`lostPossessions` int,
	`regains` int,
	`topSpeed` decimal(10,2),
	`distanceCovered` decimal(10,2),
	`workRate` decimal(10,2),
	`hidCovered` decimal(10,2),
	`hidPerMin` decimal(10,2),
	`sprintDistance` decimal(10,2),
	`sprintDistancePerMin` decimal(10,2),
	`sprintCount` int,
	`speedZone1` decimal(10,2),
	`speedZone2` decimal(10,2),
	`speedZone3` decimal(10,2),
	`speedZone4` decimal(10,2),
	`speedZone5` decimal(10,2),
	`speedZone6` decimal(10,2),
	`speedZone7` decimal(10,2),
	`intenseSpeedChanges` int,
	`intenseSpeedChangesPerMin` decimal(10,2),
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playermaker_player_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playermaker_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`season` varchar(50),
	`date` date,
	`day` varchar(20),
	`sessionType` enum('training','match','all'),
	`isValidated` boolean,
	`phaseId` varchar(100),
	`phaseType` varchar(100),
	`tag` varchar(255),
	`phaseStartTime` varchar(50),
	`phaseDuration` decimal(10,2),
	`matchOpponent` varchar(255),
	`matchCompetition` varchar(255),
	`matchVenue` varchar(255),
	`participatedPlayers` int,
	`format` varchar(100),
	`intensity` varchar(50),
	`fieldSize` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playermaker_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `playermaker_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `playermaker_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientKey` varchar(255) NOT NULL,
	`clientSecret` varchar(255) NOT NULL,
	`clientTeamId` varchar(100) NOT NULL,
	`teamCode` varchar(50),
	`token` text,
	`tokenExpiresOn` bigint,
	`clubName` varchar(255),
	`lastSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`autoSyncEnabled` boolean DEFAULT false,
	`autoSyncFrequency` enum('hourly','daily','weekly') DEFAULT 'daily',
	`nextScheduledSync` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playermaker_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playermaker_sync_history` (
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
--> statement-breakpoint
CREATE TABLE `post_match_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`liveMatchId` int NOT NULL,
	`matchId` int,
	`matchSummary` text,
	`tacticalAnalysis` text,
	`keyMoments` text,
	`playerPerformances` text,
	`recommendations` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`generatedBy` int,
	`reportType` enum('auto','manual','hybrid') DEFAULT 'auto',
	`status` enum('draft','final','archived') DEFAULT 'final',
	`exportedToPdf` boolean DEFAULT false,
	`emailedTo` text,
	`lastExportedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_match_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_report_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`reportDate` date NOT NULL,
	`reportType` enum('weekly','monthly','quarterly','annual','custom') NOT NULL,
	`reportPeriodStart` date NOT NULL,
	`reportPeriodEnd` date NOT NULL,
	`overallRating` int DEFAULT 0,
	`technicalRating` int DEFAULT 0,
	`physicalRating` int DEFAULT 0,
	`tacticalRating` int DEFAULT 0,
	`mentalRating` int DEFAULT 0,
	`matchesPlayed` int DEFAULT 0,
	`trainingAttendance` int DEFAULT 0,
	`goalsScored` int DEFAULT 0,
	`assists` int DEFAULT 0,
	`coachComments` text,
	`strengths` text,
	`areasForImprovement` text,
	`recommendations` text,
	`pdfUrl` text,
	`generatedBy` int,
	`emailSent` boolean DEFAULT false,
	`emailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progress_report_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `punishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`issuedBy` int NOT NULL,
	`type` enum('yellow_card','red_card','suspension','fine','extra_training','warning','other') NOT NULL,
	`matchOrSession` varchar(255),
	`opponent` varchar(128),
	`reason` text NOT NULL,
	`description` text,
	`suspensionGames` int DEFAULT 0,
	`fineAmount` decimal(8,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`resolvedAt` timestamp,
	`resolvedNote` text,
	`incidentDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `punishments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qr_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`sessionId` int,
	`checkInTime` timestamp NOT NULL DEFAULT (now()),
	`checkOutTime` timestamp,
	`qrCode` varchar(255) NOT NULL,
	`location` varchar(255),
	`status` enum('checked_in','checked_out','absent') DEFAULT 'checked_in',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qr_check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int,
	`moduleId` int,
	`score` int NOT NULL,
	`answers` json NOT NULL,
	`passed` boolean NOT NULL DEFAULT false,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int,
	`moduleId` int,
	`question` text NOT NULL,
	`questionAr` text,
	`optionA` varchar(500),
	`optionB` varchar(500),
	`optionC` varchar(500),
	`optionD` varchar(500),
	`options` json,
	`optionsAr` json,
	`correctAnswer` varchar(1) NOT NULL DEFAULT 'A',
	`explanation` text,
	`explanationAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralId` int NOT NULL,
	`rewardType` enum('discount','free_session','points','cash') NOT NULL,
	`rewardValue` varchar(100) NOT NULL,
	`status` enum('pending','approved','claimed','expired') DEFAULT 'pending',
	`expiresAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerUserId` int NOT NULL,
	`referredUserId` int,
	`referralCode` varchar(50) NOT NULL,
	`referredEmail` varchar(320),
	`referredName` varchar(255),
	`status` enum('pending','signed_up','completed','rewarded') DEFAULT 'pending',
	`rewardType` enum('discount','free_session','points','cash'),
	`rewardValue` varchar(100),
	`rewardClaimed` boolean DEFAULT false,
	`rewardClaimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `role_nav_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('admin','coach','assistant_coach','nutritionist','mental_coach','physical_trainer','doctor','parent','player') NOT NULL,
	`config` json NOT NULL,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_nav_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_nav_permissions_role_unique` UNIQUE(`role`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`permissionId` int NOT NULL,
	`grantedBy` int,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_tabs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`tabId` int NOT NULL,
	`displayOrder` int DEFAULT 0,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_tabs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scholarships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId_sch` int NOT NULL,
	`type_sch` enum('full','partial','merit','need_based','trial') NOT NULL DEFAULT 'partial',
	`discountPercent_sch` int NOT NULL DEFAULT 0,
	`discountAmount_sch` int DEFAULT 0,
	`reason_sch` text,
	`startDate_sch` date NOT NULL,
	`endDate_sch` date,
	`status_sch` enum('pending','active','expired','revoked') NOT NULL DEFAULT 'pending',
	`approvedBy_sch` int,
	`notes_sch` text,
	`createdAt_sch` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_sch` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scholarships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scout_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scoutUserId` int NOT NULL,
	`playerName` varchar(255) NOT NULL,
	`playerAge` int,
	`playerPosition` varchar(50),
	`currentClub` varchar(255),
	`location` varchar(255),
	`videoUrl` text,
	`technicalScore` int,
	`physicalScore` int,
	`tacticalScore` int,
	`mentalScore` int,
	`overallScore` int,
	`ballControl` int,
	`passing` int,
	`shooting` int,
	`dribbling` int,
	`firstTouch` int,
	`speed` int,
	`acceleration` int,
	`agility` int,
	`stamina` int,
	`strength` int,
	`positioning` int,
	`vision` int,
	`decisionMaking` int,
	`workRate` int,
	`teamwork` int,
	`leadership` int,
	`composure` int,
	`determination` int,
	`creativity` int,
	`defensiveAbility` int,
	`aiAnalysis` text,
	`strengths` json,
	`weaknesses` json,
	`recommendations` text,
	`potentialLevel` enum('elite','high','medium','low'),
	`status` enum('draft','submitted','reviewed','approved','rejected') DEFAULT 'draft',
	`visibility` enum('private','network','public') DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scout_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scouting_watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`addedByUserId` int NOT NULL,
	`priority` enum('hot','warm','cold') DEFAULT 'warm',
	`notes` text,
	`targetPosition` varchar(50),
	`budgetRange` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scouting_watchlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionExecutionId_sa` int NOT NULL,
	`playerId_sa` int NOT NULL,
	`status_sa` enum('present','absent','late','injured','excused') NOT NULL DEFAULT 'present',
	`minutesPlayed_sa` int,
	`performanceRating_sa` int,
	`notes_sa` text,
	`createdAt_sa` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingSessionId_se` int NOT NULL,
	`teamId_se` int,
	`coachId_se` int,
	`executionDate_se` date NOT NULL,
	`status_se` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`actualDuration_se` int,
	`weatherConditions_se` varchar(100),
	`pitchCondition_se` enum('excellent','good','fair','poor') DEFAULT 'good',
	`coachNotes_se` text,
	`overallRating_se` int,
	`energyLevel_se` int,
	`focusLevel_se` int,
	`drillsCompleted_se` json,
	`goalsUpdated_se` json,
	`createdAt_se` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_se` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `set_piece_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`type` enum('corner','penalty','freekick') NOT NULL DEFAULT 'corner',
	`teamSize` int NOT NULL DEFAULT 11,
	`ourFormation` varchar(20),
	`opponentFormation` varchar(20),
	`scenarioData` json,
	`notes` text,
	`tags` text,
	`createdBy` int NOT NULL,
	`teamId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `set_piece_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `set_pieces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('corner_kick','free_kick','throw_in','penalty','goal_kick','kickoff') NOT NULL,
	`side` enum('left','right','center'),
	`description` text,
	`movements` text NOT NULL,
	`teamId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `set_pieces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`assessmentDate` timestamp NOT NULL DEFAULT (now()),
	`assessmentType` enum('manual','device','combined') NOT NULL DEFAULT 'manual',
	`deviceSessionId` int,
	`dribbling` int,
	`passing` int,
	`shooting` int,
	`firstTouch` int,
	`heading` int,
	`defending` int,
	`speed` int,
	`agility` int,
	`stamina` int,
	`positioning` int,
	`deviceBallControl` int,
	`deviceAgility` int,
	`deviceWorkload` int,
	`overallRating` int,
	`assessorId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','facebook','twitter','linkedin') NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_media_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`mediaUrls` json,
	`platforms` json,
	`scheduledAt` timestamp,
	`postedAt` timestamp,
	`status` enum('draft','scheduled','posted','failed') DEFAULT 'draft',
	`platformPostIds` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_media_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`teamId` int,
	`sessionType` enum('match','training','meeting','medical','other') NOT NULL DEFAULT 'training',
	`sessionDate` date NOT NULL,
	`sessionLabel` varchar(255),
	`matchId` int,
	`trainingSessionId` int,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId_sc` int,
	`staffName_sc` varchar(200) NOT NULL,
	`role_sc` varchar(100) NOT NULL,
	`salaryAmount_sc` int NOT NULL,
	`month_sc` int NOT NULL,
	`year_sc` int NOT NULL,
	`paymentStatus_sc` enum('pending','paid','partial') NOT NULL DEFAULT 'pending',
	`paidAmount_sc` int DEFAULT 0,
	`paidDate_sc` timestamp,
	`notes_sc` text,
	`createdAt_sc` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_sc` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streak_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streak_days` int NOT NULL,
	`reward_type` enum('badge','points','certificate') NOT NULL,
	`reward_value` varchar(255) NOT NULL,
	`badge_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `streak_rewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `streak_rewards_streak_days_unique` UNIQUE(`streak_days`)
);
--> statement-breakpoint
CREATE TABLE `system_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `tabs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`path` varchar(200) NOT NULL,
	`category` varchar(50),
	`displayOrder` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tabs_id` PRIMARY KEY(`id`),
	CONSTRAINT `tabs_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tactical_analysis_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`createdBy` int NOT NULL,
	`category_tan` enum('strength','weakness','opportunity','threat','general','set_piece','pressing','transition') NOT NULL DEFAULT 'general',
	`content` text NOT NULL,
	`priority_tan` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`relatedPhaseId` int,
	`createdAt_tan` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_tan` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tactical_analysis_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tactical_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`liveMatchId` int NOT NULL,
	`minute` int NOT NULL,
	`changeType` enum('formation','instruction','player_role','pressing_intensity','defensive_line') NOT NULL,
	`fromValue` varchar(100),
	`toValue` varchar(100) NOT NULL,
	`reason` text,
	`aiSuggested` boolean DEFAULT false,
	`effectivenessRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tactical_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tactical_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`phaseNumber` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`homePlayers` json,
	`awayPlayers` json,
	`layers` json,
	`durationSeconds` int DEFAULT 0,
	`createdAt_tp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tactical_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tactical_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`formation` varchar(20) NOT NULL,
	`attackPattern` varchar(50),
	`playerPositions` json NOT NULL,
	`playerPaths` json,
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`teamFormation` varchar(20),
	`teamPlayStyle` varchar(50),
	`teamStrengths` json,
	`teamKeyPlayers` text,
	`opponentName` varchar(200),
	`opponentFormation` varchar(20),
	`opponentPlayStyle` varchar(50),
	`opponentWeaknesses` json,
	`opponentKeyPlayers` text,
	`tacticalOptions` json,
	`selectedTacticId` int,
	`matchId` int,
	`matchDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tactical_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tactical_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sessionType_tac` enum('training','match_prep','post_match','set_piece','free') NOT NULL DEFAULT 'free',
	`homeFormation` varchar(20) NOT NULL DEFAULT '4-3-3',
	`awayFormation` varchar(20) NOT NULL DEFAULT '4-4-2',
	`homeTeamName` varchar(100) NOT NULL DEFAULT 'Home',
	`awayTeamName` varchar(100) NOT NULL DEFAULT 'Away',
	`homePlayers` json,
	`awayPlayers` json,
	`layers` json,
	`tags` json,
	`matchDate` date,
	`opponent` varchar(100),
	`isTemplate` boolean NOT NULL DEFAULT false,
	`isPublic` boolean NOT NULL DEFAULT false,
	`thumbnailData` text,
	`createdAt_ts` timestamp NOT NULL DEFAULT (now()),
	`updatedAt_ts` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tactical_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tactical_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int,
	`name` varchar(100) NOT NULL,
	`category_tt` enum('attack','defense','set_piece','pressing','transition','custom') NOT NULL DEFAULT 'custom',
	`homeFormation` varchar(20) NOT NULL,
	`awayFormation` varchar(20),
	`homePlayers` json,
	`awayPlayers` json,
	`layers` json,
	`description` text,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt_tt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tactical_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_coaches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`coachUserId` int NOT NULL,
	`role` enum('head_coach','assistant_coach','goalkeeper_coach','fitness_coach','load_trainer','analyst','video_analyst','team_doctor','physiotherapist','nutritionist','psychologist','medical','technical','technical_director','sporting_director','team_manager','kit_manager','admin','custom') DEFAULT 'assistant_coach',
	`customRole` varchar(100),
	`notes` varchar(500),
	`isPrimary` boolean DEFAULT false,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_coaches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(100) NOT NULL,
	`role` varchar(50),
	`avatarUrl` text,
	`rating` int NOT NULL,
	`testimonial` text NOT NULL,
	`isApproved` boolean DEFAULT false,
	`isFeatured` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('warm-up','technical','tactical','physical','cool-down') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`duration` int NOT NULL,
	`video_url` varchar(500),
	`equipment` json,
	`objectives` json,
	`instructions` text,
	`variations` text,
	`coaching_points` json,
	`age_group` varchar(50),
	`player_count` varchar(50),
	`space_required` varchar(100),
	`created_by` int,
	`is_public` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`level` enum('beginner','intermediate','advanced') NOT NULL,
	`duration` int NOT NULL,
	`focus` varchar(100),
	`exercises` json NOT NULL,
	`created_by` int,
	`is_public` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_session_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`teamId` int,
	`sessionDate` timestamp NOT NULL DEFAULT (now()),
	`sessionName` varchar(255),
	`recordedBy` int,
	`physicalScore` int,
	`speed` int,
	`endurance` int,
	`strength` int,
	`agility` int,
	`technicalScore` int,
	`passing` int,
	`shooting` int,
	`dribbling` int,
	`defending` int,
	`mentalScore` int,
	`focus` int,
	`attitude` int,
	`leadership` int,
	`resilience` int,
	`medicalScore` int,
	`fatigue` int,
	`soreness` int,
	`injuryRisk` int,
	`rpe` int,
	`notes` text,
	`aiAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_session_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transfer_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`listingType` enum('sale','loan','free_agent','swap') NOT NULL DEFAULT 'sale',
	`askingPrice` decimal(12,2),
	`loanFee` decimal(10,2),
	`currency` varchar(10) DEFAULT 'USD',
	`status` enum('active','under_offer','sold','withdrawn','expired') NOT NULL DEFAULT 'active',
	`description` text,
	`contractExpiryDate` date,
	`currentSalary` decimal(10,2),
	`agentName` varchar(100),
	`agentContact` varchar(100),
	`interestedClubs` text,
	`aiValuation` decimal(12,2),
	`valuationBreakdown` text,
	`listedByUserId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transfer_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transfer_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`playerId` int NOT NULL,
	`offerAmount` decimal(12,2) NOT NULL,
	`offerType` enum('purchase','loan','swap') NOT NULL DEFAULT 'purchase',
	`offeringClub` varchar(150) NOT NULL,
	`offeringContact` varchar(150),
	`message` text,
	`status` enum('pending','accepted','rejected','countered','withdrawn') NOT NULL DEFAULT 'pending',
	`counterOffer` decimal(12,2),
	`offeredByUserId` int,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transfer_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`badge_id` int NOT NULL,
	`earned_at` timestamp NOT NULL DEFAULT (now()),
	`progress` int DEFAULT 0,
	`metadata` json,
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`challenge_id` int NOT NULL,
	`progress` int DEFAULT 0,
	`completed` boolean DEFAULT false,
	`completed_at` timestamp,
	`reward_claimed` boolean DEFAULT false,
	`claimed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_reputation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`reputation` int DEFAULT 0,
	`posts_count` int DEFAULT 0,
	`replies_count` int DEFAULT 0,
	`best_answers_count` int DEFAULT 0,
	`upvotes_received` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_reputation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`isPrimary` boolean DEFAULT false,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`last_login_date` date NOT NULL,
	`total_logins` int NOT NULL DEFAULT 0,
	`freezes_used` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_streaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoName` varchar(255) NOT NULL,
	`videoUrl` varchar(500),
	`thumbnailUrl` varchar(500),
	`teamColor` varchar(50),
	`playerName` varchar(100),
	`analysisData` text NOT NULL,
	`isRealAnalysis` boolean DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clipId` int NOT NULL,
	`timestamp` int NOT NULL,
	`annotationType` enum('arrow','circle','rectangle','line','text','freehand') NOT NULL,
	`data` text NOT NULL,
	`color` varchar(20) DEFAULT '#ff0000',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int,
	`matchId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`duration` int,
	`startTime` int DEFAULT 0,
	`endTime` int,
	`createdBy` int NOT NULL,
	`teamId` int,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_clips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`playerId` int,
	`eventType` enum('goal','assist','key_pass','tackle','interception','save','shot','dribble','pass','cross','foul','card_yellow','card_red','substitution','corner','freekick','other') NOT NULL,
	`timestamp` int NOT NULL,
	`duration` int DEFAULT 5,
	`title` varchar(200),
	`description` text,
	`tags` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clipId` int NOT NULL,
	`playerId` int,
	`tagType` enum('goal','assist','shot','pass','dribble','tackle','interception','save','error','foul','set_piece','highlight','custom') NOT NULL,
	`timestamp` int NOT NULL,
	`endTimestamp` int,
	`description` text,
	`rating` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_coach_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`messages` text NOT NULL,
	`message_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_coach_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vr_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`scenarioType` enum('1v1','2v2','3v3','tactical_positioning','set_piece','decision_making','skill_drill') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced','expert') DEFAULT 'beginner',
	`duration` int,
	`thumbnailUrl` text,
	`vrFileUrl` text,
	`requiredEquipment` json,
	`objectives` json,
	`metrics` json,
	`isPublished` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vr_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vr_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`sessionDate` timestamp NOT NULL DEFAULT (now()),
	`duration` int,
	`score` int,
	`accuracy` int,
	`reactionTime` int,
	`decisionsCorrect` int,
	`decisionsTotal` int,
	`detailedMetrics` json,
	`aiAnalysis` text,
	`strengths` json,
	`areasForImprovement` json,
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vr_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coach_feedback` ADD `recommendedDrills` text;--> statement-breakpoint
ALTER TABLE `coach_feedback` ADD `videoLinks` text;--> statement-breakpoint
ALTER TABLE `matches` ADD `competition_name` varchar(200);--> statement-breakpoint
ALTER TABLE `players` ADD `nationality` varchar(100);--> statement-breakpoint
ALTER TABLE `players` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `players` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `players` ADD `academyCode` varchar(20);--> statement-breakpoint
ALTER TABLE `players` ADD `teamType` enum('main','academy') DEFAULT 'academy';--> statement-breakpoint
ALTER TABLE `players` ADD `isPublicProfile` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `totalPrice` int;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `hasReview` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `isRecurring` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `recurringGroupId` varchar(36);--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `recurringWeeks` int;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `recurringIndex` int;--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `paymentStatus` enum('pending','paid','refunded','failed') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `paymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `private_training_bookings` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `teams` ADD `teamType` enum('main','academy') DEFAULT 'academy';--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `requestedRole` enum('admin','coach','nutritionist','mental_coach','physical_trainer','parent','player');--> statement-breakpoint
ALTER TABLE `users` ADD `coverPhotoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `nationality` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappNotifications` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_academyCode_unique` UNIQUE(`academyCode`);--> statement-breakpoint
ALTER TABLE `academy_videos` ADD CONSTRAINT `academy_videos_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_prediction_feedback` ADD CONSTRAINT `ai_prediction_feedback_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_response_cache` ADD CONSTRAINT `ai_response_cache_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_tool_usage` ADD CONSTRAINT `ai_tool_usage_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_applications` ADD CONSTRAINT `career_applications_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatbot_qa` ADD CONSTRAINT `chatbot_qa_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_certificates` ADD CONSTRAINT `coach_certificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_certificates` ADD CONSTRAINT `coach_certificates_courseId_coaching_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `coaching_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_certificates` ADD CONSTRAINT `coach_certificates_quizAttemptId_quiz_attempts_id_fk` FOREIGN KEY (`quizAttemptId`) REFERENCES `quiz_attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_evaluations` ADD CONSTRAINT `coach_evaluations_coachUserId_users_id_fk` FOREIGN KEY (`coachUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_evaluations` ADD CONSTRAINT `coach_evaluations_evaluatedBy_users_id_fk` FOREIGN KEY (`evaluatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_payments` ADD CONSTRAINT `coach_private_payments_subscriptionId_cpp_coach_private_subscriptions_id_fk` FOREIGN KEY (`subscriptionId_cpp`) REFERENCES `coach_private_subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_payments` ADD CONSTRAINT `coach_private_payments_coachId_cpp_users_id_fk` FOREIGN KEY (`coachId_cpp`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_payments` ADD CONSTRAINT `coach_private_payments_playerId_cpp_players_id_fk` FOREIGN KEY (`playerId_cpp`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_session_players` ADD CONSTRAINT `coach_private_session_players_sessionId_cpsp_coach_private_sessions_id_fk` FOREIGN KEY (`sessionId_cpsp`) REFERENCES `coach_private_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_session_players` ADD CONSTRAINT `coach_private_session_players_playerId_cpsp_players_id_fk` FOREIGN KEY (`playerId_cpsp`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_sessions` ADD CONSTRAINT `coach_private_sessions_coachId_cps_users_id_fk` FOREIGN KEY (`coachId_cps`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_sessions` ADD CONSTRAINT `coach_private_sessions_teamId_cps_coach_private_teams_id_fk` FOREIGN KEY (`teamId_cps`) REFERENCES `coach_private_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_subscriptions` ADD CONSTRAINT `coach_private_subscriptions_coachId_cpsub_users_id_fk` FOREIGN KEY (`coachId_cpsub`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_subscriptions` ADD CONSTRAINT `coach_private_subscriptions_playerId_cpsub_players_id_fk` FOREIGN KEY (`playerId_cpsub`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_subscriptions` ADD CONSTRAINT `coach_private_subscriptions_teamId_cpsub_coach_private_teams_id_fk` FOREIGN KEY (`teamId_cpsub`) REFERENCES `coach_private_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_team_members` ADD CONSTRAINT `coach_private_team_members_teamId_cptm_coach_private_teams_id_fk` FOREIGN KEY (`teamId_cptm`) REFERENCES `coach_private_teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_team_members` ADD CONSTRAINT `coach_private_team_members_playerId_cptm_players_id_fk` FOREIGN KEY (`playerId_cptm`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_private_teams` ADD CONSTRAINT `coach_private_teams_coachId_cpt_users_id_fk` FOREIGN KEY (`coachId_cpt`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_training_plans` ADD CONSTRAINT `coach_training_plans_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_training_plans` ADD CONSTRAINT `coach_training_plans_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_parentUserId_users_id_fk` FOREIGN KEY (`parentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_coachUserId_users_id_fk` FOREIGN KEY (`coachUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_courseId_coaching_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `coaching_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD CONSTRAINT `course_lessons_courseId_education_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `education_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_modules` ADD CONSTRAINT `course_modules_courseId_coaching_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `coaching_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_roles` ADD CONSTRAINT `custom_roles_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_sessions` ADD CONSTRAINT `device_sessions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_sessions` ADD CONSTRAINT `device_sessions_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drill_videos` ADD CONSTRAINT `drill_videos_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_campaigns` ADD CONSTRAINT `email_campaigns_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_sends` ADD CONSTRAINT `email_sends_templateId_email_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `email_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_sends` ADD CONSTRAINT `email_sends_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_templates` ADD CONSTRAINT `email_templates_campaignId_email_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `email_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollment_submissions` ADD CONSTRAINT `enrollment_submissions_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercise_favorites` ADD CONSTRAINT `exercise_favorites_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercise_favorites` ADD CONSTRAINT `exercise_favorites_exercise_id_training_exercises_id_fk` FOREIGN KEY (`exercise_id`) REFERENCES `training_exercises`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `formations` ADD CONSTRAINT `formations_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `formations` ADD CONSTRAINT `formations_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_category_id_forum_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `forum_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_replies` ADD CONSTRAINT `forum_replies_post_id_forum_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_replies` ADD CONSTRAINT `forum_replies_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_votes` ADD CONSTRAINT `forum_votes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gps_live_sync` ADD CONSTRAINT `gps_live_sync_liveMatchId_live_matches_id_fk` FOREIGN KEY (`liveMatchId`) REFERENCES `live_matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gps_live_sync` ADD CONSTRAINT `gps_live_sync_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_development_goals` ADD CONSTRAINT `group_development_goals_groupPlanId_gdg_group_development_plans_id_fk` FOREIGN KEY (`groupPlanId_gdg`) REFERENCES `group_development_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_development_plans` ADD CONSTRAINT `group_development_plans_createdByUserId_gdp_users_id_fk` FOREIGN KEY (`createdByUserId_gdp`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `injury_risk_assessments` ADD CONSTRAINT `injury_risk_assessments_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_parentId_users_id_fk` FOREIGN KEY (`parentId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_match_notes` ADD CONSTRAINT `live_match_notes_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_match_notes` ADD CONSTRAINT `live_match_notes_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_match_notes` ADD CONSTRAINT `live_match_notes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_matches` ADD CONSTRAINT `live_matches_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_matches` ADD CONSTRAINT `live_matches_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_matches` ADD CONSTRAINT `live_matches_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `locker_room_messages` ADD CONSTRAINT `locker_room_messages_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `locker_room_messages` ADD CONSTRAINT `locker_room_messages_fromUserId_users_id_fk` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_briefings` ADD CONSTRAINT `match_briefings_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_briefings` ADD CONSTRAINT `match_briefings_oppositionId_opposition_analysis_id_fk` FOREIGN KEY (`oppositionId`) REFERENCES `opposition_analysis`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_briefings` ADD CONSTRAINT `match_briefings_formationId_formations_id_fk` FOREIGN KEY (`formationId`) REFERENCES `formations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_briefings` ADD CONSTRAINT `match_briefings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_briefings` ADD CONSTRAINT `match_briefings_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_defensive_actions` ADD CONSTRAINT `match_defensive_actions_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_defensive_actions` ADD CONSTRAINT `match_defensive_actions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_defensive_actions` ADD CONSTRAINT `match_defensive_actions_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_event_sessions` ADD CONSTRAINT `match_event_sessions_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_event_sessions` ADD CONSTRAINT `match_event_sessions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_liveMatchId_live_matches_id_fk` FOREIGN KEY (`liveMatchId`) REFERENCES `live_matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_assistPlayerId_players_id_fk` FOREIGN KEY (`assistPlayerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_substitutedPlayerId_players_id_fk` FOREIGN KEY (`substitutedPlayerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_passes` ADD CONSTRAINT `match_passes_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_passes` ADD CONSTRAINT `match_passes_fromPlayerId_players_id_fk` FOREIGN KEY (`fromPlayerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_passes` ADD CONSTRAINT `match_passes_toPlayerId_players_id_fk` FOREIGN KEY (`toPlayerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_passes` ADD CONSTRAINT `match_passes_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_shots` ADD CONSTRAINT `match_shots_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_shots` ADD CONSTRAINT `match_shots_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_shots` ADD CONSTRAINT `match_shots_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_strategies` ADD CONSTRAINT `match_strategies_opponentId_opponents_id_fk` FOREIGN KEY (`opponentId`) REFERENCES `opponents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_strategies` ADD CONSTRAINT `match_strategies_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_logs` ADD CONSTRAINT `meal_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_logs` ADD CONSTRAINT `meal_logs_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderUserId_users_id_fk` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `module_progress` ADD CONSTRAINT `module_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `module_progress` ADD CONSTRAINT `module_progress_moduleId_course_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opponent_videos` ADD CONSTRAINT `opponent_videos_opponentId_opponents_id_fk` FOREIGN KEY (`opponentId`) REFERENCES `opponents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opponent_videos` ADD CONSTRAINT `opponent_videos_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opponents` ADD CONSTRAINT `opponents_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opposition_analysis` ADD CONSTRAINT `opposition_analysis_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opposition_analysis` ADD CONSTRAINT `opposition_analysis_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opposition_analysis` ADD CONSTRAINT `opposition_analysis_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_education_enrollments` ADD CONSTRAINT `parent_education_enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_education_enrollments` ADD CONSTRAINT `parent_education_enrollments_courseId_education_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `education_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_lesson_progress` ADD CONSTRAINT `parent_lesson_progress_enrollmentId_parent_education_enrollments_id_fk` FOREIGN KEY (`enrollmentId`) REFERENCES `parent_education_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_lesson_progress` ADD CONSTRAINT `parent_lesson_progress_lessonId_course_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `course_lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_payments` ADD CONSTRAINT `academy_payments_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_payments` ADD CONSTRAINT `academy_payments_invoiceId_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_payments` ADD CONSTRAINT `academy_payments_feeId_player_fees_id_fk` FOREIGN KEY (`feeId`) REFERENCES `player_fees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_payments` ADD CONSTRAINT `academy_payments_receivedBy_users_id_fk` FOREIGN KEY (`receivedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_audit_log` ADD CONSTRAINT `permission_audit_log_performedBy_users_id_fk` FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_audit_log` ADD CONSTRAINT `permission_audit_log_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_audit_log` ADD CONSTRAINT `permission_audit_log_targetRoleId_custom_roles_id_fk` FOREIGN KEY (`targetRoleId`) REFERENCES `custom_roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_audit_log` ADD CONSTRAINT `permission_audit_log_targetPermissionId_permissions_id_fk` FOREIGN KEY (`targetPermissionId`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_audit_log` ADD CONSTRAINT `permission_audit_log_targetTabId_tabs_id_fk` FOREIGN KEY (`targetTabId`) REFERENCES `tabs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_blood_markers` ADD CONSTRAINT `player_blood_markers_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_blood_markers` ADD CONSTRAINT `player_blood_markers_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_development_goals` ADD CONSTRAINT `player_development_goals_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_development_goals` ADD CONSTRAINT `player_development_goals_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_fees` ADD CONSTRAINT `player_fees_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_fees` ADD CONSTRAINT `player_fees_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_heatmaps` ADD CONSTRAINT `player_heatmaps_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_heatmaps` ADD CONSTRAINT `player_heatmaps_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_heatmaps` ADD CONSTRAINT `player_heatmaps_clipId_video_clips_id_fk` FOREIGN KEY (`clipId`) REFERENCES `video_clips`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_instructions` ADD CONSTRAINT `player_instructions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_instructions` ADD CONSTRAINT `player_instructions_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_instructions` ADD CONSTRAINT `player_instructions_briefingId_match_briefings_id_fk` FOREIGN KEY (`briefingId`) REFERENCES `match_briefings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_instructions` ADD CONSTRAINT `player_instructions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_medical_data` ADD CONSTRAINT `player_medical_data_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_medical_data` ADD CONSTRAINT `player_medical_data_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_muscle_measurements` ADD CONSTRAINT `player_muscle_measurements_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_muscle_measurements` ADD CONSTRAINT `player_muscle_measurements_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_physical_tests` ADD CONSTRAINT `player_physical_tests_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_physical_tests` ADD CONSTRAINT `player_physical_tests_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_positions` ADD CONSTRAINT `player_positions_liveMatchId_live_matches_id_fk` FOREIGN KEY (`liveMatchId`) REFERENCES `live_matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_positions` ADD CONSTRAINT `player_positions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_suspensions` ADD CONSTRAINT `player_suspensions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_suspensions` ADD CONSTRAINT `player_suspensions_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_suspensions` ADD CONSTRAINT `player_suspensions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_training_load` ADD CONSTRAINT `player_training_load_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_training_load` ADD CONSTRAINT `player_training_load_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_valuations` ADD CONSTRAINT `player_valuations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_valuations` ADD CONSTRAINT `player_valuations_valuedByUserId_users_id_fk` FOREIGN KEY (`valuedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playermaker_coach_annotations` ADD CONSTRAINT `playermaker_coach_annotations_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playermaker_coach_annotations` ADD CONSTRAINT `playermaker_coach_annotations_coachId_users_id_fk` FOREIGN KEY (`coachId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playermaker_player_metrics` ADD CONSTRAINT `playermaker_player_metrics_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_match_reports` ADD CONSTRAINT `post_match_reports_liveMatchId_live_matches_id_fk` FOREIGN KEY (`liveMatchId`) REFERENCES `live_matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_match_reports` ADD CONSTRAINT `post_match_reports_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_match_reports` ADD CONSTRAINT `post_match_reports_generatedBy_users_id_fk` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_report_history` ADD CONSTRAINT `progress_report_history_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_report_history` ADD CONSTRAINT `progress_report_history_generatedBy_users_id_fk` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `punishments` ADD CONSTRAINT `punishments_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `punishments` ADD CONSTRAINT `punishments_issuedBy_users_id_fk` FOREIGN KEY (`issuedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_check_ins` ADD CONSTRAINT `qr_check_ins_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_courseId_coaching_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `coaching_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_moduleId_course_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD CONSTRAINT `quiz_questions_courseId_coaching_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `coaching_courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD CONSTRAINT `quiz_questions_moduleId_course_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_rewards` ADD CONSTRAINT `referral_rewards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_rewards` ADD CONSTRAINT `referral_rewards_referralId_referrals_id_fk` FOREIGN KEY (`referralId`) REFERENCES `referrals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerUserId_users_id_fk` FOREIGN KEY (`referrerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredUserId_users_id_fk` FOREIGN KEY (`referredUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_nav_permissions` ADD CONSTRAINT `role_nav_permissions_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_custom_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `custom_roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_grantedBy_users_id_fk` FOREIGN KEY (`grantedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_tabs` ADD CONSTRAINT `role_tabs_roleId_custom_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `custom_roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_tabs` ADD CONSTRAINT `role_tabs_tabId_tabs_id_fk` FOREIGN KEY (`tabId`) REFERENCES `tabs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_tabs` ADD CONSTRAINT `role_tabs_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_playerId_sch_players_id_fk` FOREIGN KEY (`playerId_sch`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_approvedBy_sch_users_id_fk` FOREIGN KEY (`approvedBy_sch`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scout_reports` ADD CONSTRAINT `scout_reports_scoutUserId_users_id_fk` FOREIGN KEY (`scoutUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scouting_watchlist` ADD CONSTRAINT `scouting_watchlist_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scouting_watchlist` ADD CONSTRAINT `scouting_watchlist_addedByUserId_users_id_fk` FOREIGN KEY (`addedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_attendance` ADD CONSTRAINT `session_attendance_sessionExecutionId_sa_session_executions_id_fk` FOREIGN KEY (`sessionExecutionId_sa`) REFERENCES `session_executions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_attendance` ADD CONSTRAINT `session_attendance_playerId_sa_players_id_fk` FOREIGN KEY (`playerId_sa`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_executions` ADD CONSTRAINT `session_executions_trainingSessionId_se_training_sessions_id_fk` FOREIGN KEY (`trainingSessionId_se`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_executions` ADD CONSTRAINT `session_executions_coachId_se_users_id_fk` FOREIGN KEY (`coachId_se`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `set_piece_scenarios` ADD CONSTRAINT `set_piece_scenarios_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `set_piece_scenarios` ADD CONSTRAINT `set_piece_scenarios_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `set_pieces` ADD CONSTRAINT `set_pieces_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `set_pieces` ADD CONSTRAINT `set_pieces_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_assessments` ADD CONSTRAINT `skill_assessments_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_assessments` ADD CONSTRAINT `skill_assessments_deviceSessionId_device_sessions_id_fk` FOREIGN KEY (`deviceSessionId`) REFERENCES `device_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_assessments` ADD CONSTRAINT `skill_assessments_assessorId_users_id_fk` FOREIGN KEY (`assessorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_media_posts` ADD CONSTRAINT `social_media_posts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staffUserId_users_id_fk` FOREIGN KEY (`staffUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_trainingSessionId_training_sessions_id_fk` FOREIGN KEY (`trainingSessionId`) REFERENCES `training_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_costs` ADD CONSTRAINT `staff_costs_staffUserId_sc_users_id_fk` FOREIGN KEY (`staffUserId_sc`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `streak_rewards` ADD CONSTRAINT `streak_rewards_badge_id_badges_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_analysis_notes` ADD CONSTRAINT `tactical_analysis_notes_sessionId_tactical_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `tactical_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_analysis_notes` ADD CONSTRAINT `tactical_analysis_notes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_changes` ADD CONSTRAINT `tactical_changes_liveMatchId_live_matches_id_fk` FOREIGN KEY (`liveMatchId`) REFERENCES `live_matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_phases` ADD CONSTRAINT `tactical_phases_sessionId_tactical_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `tactical_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_plans` ADD CONSTRAINT `tactical_plans_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_plans` ADD CONSTRAINT `tactical_plans_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_sessions` ADD CONSTRAINT `tactical_sessions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_templates` ADD CONSTRAINT `tactical_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_coaches` ADD CONSTRAINT `team_coaches_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_coaches` ADD CONSTRAINT `team_coaches_coachUserId_users_id_fk` FOREIGN KEY (`coachUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_coaches` ADD CONSTRAINT `team_coaches_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_exercises` ADD CONSTRAINT `training_exercises_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_plans` ADD CONSTRAINT `training_plans_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_session_performance` ADD CONSTRAINT `training_session_performance_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_session_performance` ADD CONSTRAINT `training_session_performance_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_session_performance` ADD CONSTRAINT `training_session_performance_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_listings` ADD CONSTRAINT `transfer_listings_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_listings` ADD CONSTRAINT `transfer_listings_listedByUserId_users_id_fk` FOREIGN KEY (`listedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_offers` ADD CONSTRAINT `transfer_offers_listingId_transfer_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `transfer_listings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_offers` ADD CONSTRAINT `transfer_offers_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_offers` ADD CONSTRAINT `transfer_offers_offeredByUserId_users_id_fk` FOREIGN KEY (`offeredByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_badge_id_badges_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_challenges` ADD CONSTRAINT `user_challenges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_challenges` ADD CONSTRAINT `user_challenges_challenge_id_challenges_id_fk` FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_reputation` ADD CONSTRAINT `user_reputation_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_custom_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `custom_roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_streaks` ADD CONSTRAINT `user_streaks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_analyses` ADD CONSTRAINT `video_analyses_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_annotations` ADD CONSTRAINT `video_annotations_clipId_video_clips_id_fk` FOREIGN KEY (`clipId`) REFERENCES `video_clips`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_annotations` ADD CONSTRAINT `video_annotations_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_clips` ADD CONSTRAINT `video_clips_videoId_training_videos_id_fk` FOREIGN KEY (`videoId`) REFERENCES `training_videos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_clips` ADD CONSTRAINT `video_clips_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_clips` ADD CONSTRAINT `video_clips_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_clips` ADD CONSTRAINT `video_clips_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_events` ADD CONSTRAINT `video_events_videoId_training_videos_id_fk` FOREIGN KEY (`videoId`) REFERENCES `training_videos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_events` ADD CONSTRAINT `video_events_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_events` ADD CONSTRAINT `video_events_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_tags` ADD CONSTRAINT `video_tags_clipId_video_clips_id_fk` FOREIGN KEY (`clipId`) REFERENCES `video_clips`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_tags` ADD CONSTRAINT `video_tags_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_tags` ADD CONSTRAINT `video_tags_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voice_coach_sessions` ADD CONSTRAINT `voice_coach_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vr_sessions` ADD CONSTRAINT `vr_sessions_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vr_sessions` ADD CONSTRAINT `vr_sessions_scenarioId_vr_scenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `vr_scenarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_training_bookings` DROP COLUMN `price`;