-- Classora.in Database Setup for MySQL
-- Run this in phpMyAdmin or MySQL client

-- Create tables for Classora.in application

-- Users table
CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'STUDENT',
  `avatar` varchar(191) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `resetToken` varchar(191) DEFAULT NULL,
  `resetTokenExpiry` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher profiles table
CREATE TABLE `teacher_profiles` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `university` varchar(191) DEFAULT NULL,
  `college` varchar(191) DEFAULT NULL,
  `department` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `linkedin` varchar(191) DEFAULT NULL,
  `researchInterests` text DEFAULT NULL,
  `qualifications` text DEFAULT NULL,
  `experience` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_profiles_userId_key` (`userId`),
  KEY `teacher_profiles_userId_fkey` (`userId`),
  CONSTRAINT `teacher_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student profiles table
CREATE TABLE `student_profiles` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `university` varchar(191) DEFAULT NULL,
  `college` varchar(191) DEFAULT NULL,
  `department` varchar(191) DEFAULT NULL,
  `semester` varchar(191) DEFAULT NULL,
  `class` varchar(191) DEFAULT NULL,
  `registrationNo` varchar(191) DEFAULT NULL,
  `rollNo` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_profiles_userId_key` (`userId`),
  KEY `student_profiles_userId_fkey` (`userId`),
  CONSTRAINT `student_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classes table
CREATE TABLE `classes` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `code` varchar(191) NOT NULL,
  `isPublic` boolean NOT NULL DEFAULT false,
  `gradientColor` varchar(191) DEFAULT 'from-blue-500 to-purple-600',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `classes_code_key` (`code`),
  KEY `classes_creatorId_fkey` (`creatorId`),
  CONSTRAINT `classes_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enrollments table
CREATE TABLE `enrollments` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  `enrolledAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollments_userId_classId_key` (`userId`, `classId`),
  KEY `enrollments_userId_fkey` (`userId`),
  KEY `enrollments_classId_fkey` (`classId`),
  CONSTRAINT `enrollments_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `enrollments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes table
CREATE TABLE `notes` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notes_classId_fkey` (`classId`),
  KEY `notes_creatorId_fkey` (`creatorId`),
  CONSTRAINT `notes_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notes_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quizzes table
CREATE TABLE `quizzes` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `timeLimit` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quizzes_classId_fkey` (`classId`),
  KEY `quizzes_creatorId_fkey` (`creatorId`),
  CONSTRAINT `quizzes_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `quizzes_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz questions table
CREATE TABLE `quiz_questions` (
  `id` varchar(191) NOT NULL,
  `question` text NOT NULL,
  `type` varchar(191) NOT NULL,
  `options` text DEFAULT NULL,
  `correctAnswer` text NOT NULL,
  `points` int NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `quizId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quiz_questions_quizId_fkey` (`quizId`),
  CONSTRAINT `quiz_questions_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz attempts table
CREATE TABLE `quiz_attempts` (
  `id` varchar(191) NOT NULL,
  `score` float NOT NULL,
  `answers` text NOT NULL,
  `startedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) DEFAULT NULL,
  `timeTaken` int DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `quizId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quiz_attempts_quizId_fkey` (`quizId`),
  KEY `quiz_attempts_userId_fkey` (`userId`),
  CONSTRAINT `quiz_attempts_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `quiz_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assignments table
CREATE TABLE `assignments` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `points` int NOT NULL DEFAULT 100,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `assignments_classId_fkey` (`classId`),
  KEY `assignments_creatorId_fkey` (`creatorId`),
  CONSTRAINT `assignments_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignments_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assignment submissions table
CREATE TABLE `assignment_submissions` (
  `id` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `submittedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `grade` float DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `gradedAt` datetime(3) DEFAULT NULL,
  `gradedBy` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `assignmentId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_submissions_assignmentId_fkey` (`assignmentId`),
  KEY `assignment_submissions_userId_fkey` (`userId`),
  CONSTRAINT `assignment_submissions_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignment_submissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Practice questions table
CREATE TABLE `practice_questions` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `explanation` text DEFAULT NULL,
  `difficulty` varchar(191) NOT NULL DEFAULT 'MEDIUM',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `practice_questions_classId_fkey` (`classId`),
  KEY `practice_questions_creatorId_fkey` (`creatorId`),
  CONSTRAINT `practice_questions_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `practice_questions_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Practice question attempts table
CREATE TABLE `practice_question_attempts` (
  `id` varchar(191) NOT NULL,
  `answer` text NOT NULL,
  `isCorrect` boolean NOT NULL,
  `attemptedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId` varchar(191) NOT NULL,
  `questionId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `practice_question_attempts_questionId_fkey` (`questionId`),
  KEY `practice_question_attempts_userId_fkey` (`userId`),
  CONSTRAINT `practice_question_attempts_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `practice_questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `practice_question_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Practice files table
CREATE TABLE `practice_files` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileType` varchar(191) NOT NULL,
  `fileSize` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `practice_files_classId_fkey` (`classId`),
  KEY `practice_files_creatorId_fkey` (`creatorId`),
  CONSTRAINT `practice_files_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `practice_files_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar events table
CREATE TABLE `calendar_events` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `calendar_events_classId_fkey` (`classId`),
  KEY `calendar_events_creatorId_fkey` (`creatorId`),
  CONSTRAINT `calendar_events_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `calendar_events_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User settings table
CREATE TABLE `user_settings` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `emailNotifications` boolean NOT NULL DEFAULT true,
  `pushNotifications` boolean NOT NULL DEFAULT true,
  `theme` varchar(191) NOT NULL DEFAULT 'light',
  `language` varchar(191) NOT NULL DEFAULT 'en',
  `timezone` varchar(191) NOT NULL DEFAULT 'UTC',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_settings_userId_key` (`userId`),
  KEY `user_settings_userId_fkey` (`userId`),
  CONSTRAINT `user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'INFO',
  `isRead` boolean NOT NULL DEFAULT false,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_userId_fkey` (`userId`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invitations table
CREATE TABLE `invitations` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'STUDENT',
  `isAccepted` boolean NOT NULL DEFAULT false,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentById` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitations_token_key` (`token`),
  KEY `invitations_sentById_fkey` (`sentById`),
  CONSTRAINT `invitations_sentById_fkey` FOREIGN KEY (`sentById`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student assignment views table
CREATE TABLE `student_assignment_views` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `assignmentId` varchar(191) NOT NULL,
  `viewedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_assignment_views_userId_assignmentId_key` (`userId`, `assignmentId`),
  KEY `student_assignment_views_assignmentId_fkey` (`assignmentId`),
  KEY `student_assignment_views_userId_fkey` (`userId`),
  CONSTRAINT `student_assignment_views_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_assignment_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student quiz views table
CREATE TABLE `student_quiz_views` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `quizId` varchar(191) NOT NULL,
  `viewedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_quiz_views_userId_quizId_key` (`userId`, `quizId`),
  KEY `student_quiz_views_quizId_fkey` (`quizId`),
  KEY `student_quiz_views_userId_fkey` (`userId`),
  CONSTRAINT `student_quiz_views_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_quiz_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student note views table
CREATE TABLE `student_note_views` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `noteId` varchar(191) NOT NULL,
  `viewedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_note_views_userId_noteId_key` (`userId`, `noteId`),
  KEY `student_note_views_noteId_fkey` (`noteId`),
  KEY `student_note_views_userId_fkey` (`userId`),
  CONSTRAINT `student_note_views_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_note_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact messages table
CREATE TABLE `contact_messages` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `isRead` boolean NOT NULL DEFAULT false,
  `reply` text DEFAULT NULL,
  `repliedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings table
CREATE TABLE `system_settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backups table
CREATE TABLE `backups` (
  `id` varchar(191) NOT NULL,
  `filename` varchar(191) NOT NULL,
  `size` int NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default admin user
INSERT INTO `users` (`id`, `email`, `name`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
('admin-user-id', 'admin@example.com', 'Admin User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', 'ADMIN', NOW(), NOW());

-- Create default system settings
INSERT INTO `system_settings` (`id`, `key`, `value`, `description`, `updatedAt`) VALUES
('site-name', 'site_name', 'Classora.in', 'Website name', NOW()),
('site-description', 'site_description', 'Educational platform for teachers and students', 'Website description', NOW()),
('maintenance-mode', 'maintenance_mode', 'false', 'Maintenance mode status', NOW());
