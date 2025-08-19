# Classora.in - Technical Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [User Flow & Features](#user-flow--features)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication System](#authentication-system)
7. [File Structure](#file-structure)
8. [Deployment Architecture](#deployment-architecture)
9. [Development Setup](#development-setup)

---

## 🎯 Project Overview

**Classora.in** is a comprehensive educational platform that connects teachers and students in a digital learning environment. The platform provides tools for course management, assignments, quizzes, practice sessions, and real-time communication.

### Core Features
- **Multi-role Authentication**: Students, Teachers, and Administrators
- **Class Management**: Create, join, and manage educational classes
- **Assignment System**: Create, submit, and grade assignments
- **Quiz System**: Interactive quizzes with automatic grading
- **Practice Questions**: Self-paced learning with explanations
- **Calendar Events**: Schedule and manage educational events
- **Notification System**: Real-time updates and alerts
- **Admin Dashboard**: Comprehensive system management
- **File Management**: Upload and organize educational materials

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **State Management**: React Context + Hooks
- **Rich Text Editor**: SunEditor for content creation

### Backend
- **Runtime**: Node.js 18
- **Framework**: Next.js API Routes
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js
- **Email Service**: Nodemailer with SMTP
- **File Upload**: Multer for file handling

### Database
- **Primary**: MySQL 8.0
- **Development**: SQLite (optional)
- **Migrations**: Prisma Migrate
- **Seeding**: Custom seed scripts

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **CI/CD**: GitHub Actions
- **Hosting**: VPS with Docker deployment

---

## 🔄 User Flow & Features

### 1. Authentication Flow

#### Registration Process
```
1. User visits /auth/register
2. Fills registration form (email, name, password, role)
3. System validates input and checks email uniqueness
4. Password is hashed using bcrypt
5. User record is created in database
6. Welcome email is sent
7. User is redirected to login
```

#### Login Process
```
1. User visits /auth/login
2. Enters email and password
3. System validates credentials
4. NextAuth.js creates session
5. User is redirected to dashboard based on role
```

#### Password Reset Flow
```
1. User requests password reset
2. System generates reset token
3. Reset email is sent with token
4. User clicks link and enters new password
5. Token is validated and password updated
```

### 2. Role-Based Access Control

#### Student Flow
```
Dashboard → Classes → Join Class → View Content → Submit Assignments → Take Quizzes → Practice Questions
```

#### Teacher Flow
```
Dashboard → Create Class → Manage Students → Create Assignments → Create Quizzes → Grade Submissions → Analytics
```

#### Admin Flow
```
Admin Dashboard → User Management → System Settings → Backup Management → Performance Monitoring → Crash Reports
```

### 3. Core Feature Flows

#### Class Management
```
1. Teacher creates class with name, description, privacy settings
2. System generates unique invitation link
3. Students join via invitation link
4. Teacher manages class members and content
5. Students access class materials and assignments
```

#### Assignment System
```
1. Teacher creates assignment with title, description, due date, files
2. Assignment is published to class
3. Students receive notification
4. Students view assignment and submit work
5. Teacher reviews and grades submissions
6. Students receive grade notifications
```

#### Quiz System
```
1. Teacher creates quiz with questions and options
2. Quiz is published to class
3. Students take quiz with time limit
4. System automatically grades multiple choice questions
5. Teacher grades essay questions manually
6. Results are displayed to students
```

#### Practice Questions
```
1. Teacher uploads practice files (PDF, DOC, etc.)
2. Teacher creates questions with explanations
3. Students access practice questions
4. Students answer questions and view explanations
5. Progress is tracked and displayed
```

---

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL UNIQUE,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('STUDENT','TEACHER','ADMIN') NOT NULL DEFAULT 'STUDENT',
  `emailVerified` datetime(3) NULL,
  `image` varchar(191) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Classes Table
```sql
CREATE TABLE `classes` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text NULL,
  `teacherId` varchar(191) NOT NULL,
  `isPrivate` boolean NOT NULL DEFAULT false,
  `invitationCode` varchar(191) NULL UNIQUE,
  `gradientColor` varchar(191) NULL DEFAULT 'from-blue-500 to-purple-600',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `archivedAt` datetime(3) NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Enrollments Table
```sql
CREATE TABLE `enrollments` (
  `id` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `classId` varchar(191) NOT NULL,
  `enrolledAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollments_studentId_classId_key` (`studentId`, `classId`),
  FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Assignments Table
```sql
CREATE TABLE `assignments` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text NULL,
  `classId` varchar(191) NOT NULL,
  `teacherId` varchar(191) NOT NULL,
  `dueDate` datetime(3) NULL,
  `maxPoints` int NOT NULL DEFAULT 100,
  `noteId` varchar(191) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Assignment Submissions Table
```sql
CREATE TABLE `assignment_submissions` (
  `id` varchar(191) NOT NULL,
  `assignmentId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `content` text NULL,
  `fileUrl` varchar(191) NULL,
  `submittedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `gradedAt` datetime(3) NULL,
  `grade` int NULL,
  `feedback` text NULL,
  `gradedBy` varchar(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_submissions_assignmentId_studentId_key` (`assignmentId`, `studentId`),
  FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`gradedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Quizzes Table
```sql
CREATE TABLE `quizzes` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text NULL,
  `classId` varchar(191) NOT NULL,
  `teacherId` varchar(191) NOT NULL,
  `timeLimit` int NULL,
  `maxPoints` int NOT NULL DEFAULT 100,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Quiz Questions Table
```sql
CREATE TABLE `quiz_questions` (
  `id` varchar(191) NOT NULL,
  `quizId` varchar(191) NOT NULL,
  `question` text NOT NULL,
  `type` enum('MULTIPLE_CHOICE','ESSAY') NOT NULL,
  `options` json NULL,
  `correctAnswer` varchar(191) NULL,
  `points` int NOT NULL DEFAULT 1,
  `order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`quizId`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Quiz Attempts Table
```sql
CREATE TABLE `quiz_attempts` (
  `id` varchar(191) NOT NULL,
  `quizId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `startedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) NULL,
  `score` int NULL,
  `maxScore` int NOT NULL,
  `answers` json NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`quizId`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Practice Classes Table
```sql
CREATE TABLE `practice_classes` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text NULL,
  `teacherId` varchar(191) NOT NULL,
  `isPublic` boolean NOT NULL DEFAULT false,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Practice Files Table
```sql
CREATE TABLE `practice_files` (
  `id` varchar(191) NOT NULL,
  `practiceClassId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text NULL,
  `fileUrl` varchar(191) NOT NULL,
  `fileType` varchar(191) NOT NULL,
  `fileSize` int NOT NULL,
  `uploadedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`practiceClassId`) REFERENCES `practice_classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Practice Questions Table
```sql
CREATE TABLE `practice_questions` (
  `id` varchar(191) NOT NULL,
  `practiceFileId` varchar(191) NOT NULL,
  `question` text NOT NULL,
  `type` enum('MULTIPLE_CHOICE','TRUE_FALSE','ESSAY') NOT NULL,
  `options` json NULL,
  `correctAnswer` varchar(191) NULL,
  `explanation` text NULL,
  `order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`practiceFileId`) REFERENCES `practice_files`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Practice Attempts Table
```sql
CREATE TABLE `practice_attempts` (
  `id` varchar(191) NOT NULL,
  `practiceFileId` varchar(191) NOT NULL,
  `studentId` varchar(191) NOT NULL,
  `startedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) NULL,
  `score` int NULL,
  `maxScore` int NOT NULL,
  `answers` json NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`practiceFileId`) REFERENCES `practice_files`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Notes Table
```sql
CREATE TABLE `notes` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `classId` varchar(191) NOT NULL,
  `teacherId` varchar(191) NOT NULL,
  `isPublic` boolean NOT NULL DEFAULT true,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Calendar Events Table
```sql
CREATE TABLE `calendar_events` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `classId` varchar(191) NULL,
  `teacherId` varchar(191) NOT NULL,
  `isAllDay` boolean NOT NULL DEFAULT false,
  `color` varchar(191) NULL DEFAULT '#3B82F6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Notifications Table
```sql
CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` enum('ASSIGNMENT','QUIZ','GRADE','SYSTEM','CALENDAR') NOT NULL,
  `isRead` boolean NOT NULL DEFAULT false,
  `relatedId` varchar(191) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Contact Messages Table
```sql
CREATE TABLE `contact_messages` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `isRead` boolean NOT NULL DEFAULT false,
  `repliedAt` datetime(3) NULL,
  `replyMessage` text NULL,
  `replyAdminId` varchar(191) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`replyAdminId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Invitations Table
```sql
CREATE TABLE `invitations` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL UNIQUE,
  `role` enum('STUDENT','TEACHER') NOT NULL,
  `classId` varchar(191) NULL,
  `invitedBy` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `acceptedAt` datetime(3) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### User Settings Table
```sql
CREATE TABLE `user_settings` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL UNIQUE,
  `emailNotifications` boolean NOT NULL DEFAULT true,
  `pushNotifications` boolean NOT NULL DEFAULT true,
  `theme` enum('LIGHT','DARK','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  `language` varchar(191) NOT NULL DEFAULT 'en',
  `timezone` varchar(191) NOT NULL DEFAULT 'UTC',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### System Settings Table
```sql
CREATE TABLE `system_settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL UNIQUE,
  `value` text NOT NULL,
  `description` text NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Backups Table
```sql
CREATE TABLE `backups` (
  `id` varchar(191) NOT NULL,
  `filename` varchar(191) NOT NULL,
  `fileSize` bigint NOT NULL,
  `backupType` enum('MANUAL','AUTO') NOT NULL,
  `status` enum('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  `createdBy` varchar(191) NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` datetime(3) NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Database Relationships

#### One-to-Many Relationships
- **User → Classes** (Teacher creates multiple classes)
- **User → Assignments** (Teacher creates multiple assignments)
- **User → Quizzes** (Teacher creates multiple quizzes)
- **User → Notes** (Teacher creates multiple notes)
- **User → Notifications** (User receives multiple notifications)
- **Class → Assignments** (Class has multiple assignments)
- **Class → Quizzes** (Class has multiple quizzes)
- **Class → Notes** (Class has multiple notes)
- **Class → Enrollments** (Class has multiple enrolled students)
- **Assignment → Submissions** (Assignment has multiple student submissions)
- **Quiz → Questions** (Quiz has multiple questions)
- **Quiz → Attempts** (Quiz has multiple student attempts)
- **Practice Class → Files** (Practice class has multiple files)
- **Practice File → Questions** (Practice file has multiple questions)
- **Practice File → Attempts** (Practice file has multiple student attempts)

#### Many-to-Many Relationships
- **Users ↔ Classes** (Students enroll in multiple classes, Classes have multiple students)
- **Users ↔ Practice Classes** (Students access multiple practice classes, Practice classes have multiple students)

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET  /api/auth/me - Get current user
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password
POST /api/auth/profile - Update user profile
```

### Class Management Endpoints
```
GET    /api/classes - Get all classes (filtered by role)
POST   /api/classes - Create new class
GET    /api/classes/[id] - Get class details
PUT    /api/classes/[id] - Update class
DELETE /api/classes/[id] - Delete class
POST   /api/classes/[id]/archive - Archive class
POST   /api/classes/[id]/privacy - Update class privacy
GET    /api/classes/[id]/assignments - Get class assignments
GET    /api/classes/[id]/quizzes - Get class quizzes
```

### Assignment Endpoints
```
GET    /api/assignments - Get all assignments
POST   /api/assignments - Create assignment
GET    /api/assignments/[id] - Get assignment details
PUT    /api/assignments/[id] - Update assignment
DELETE /api/assignments/[id] - Delete assignment
GET    /api/assignments/[id]/view - View assignment (student)
POST   /api/assignments/submit - Submit assignment
GET    /api/assignments/[id]/submissions - Get submissions (teacher)
POST   /api/assignments/submissions/[id]/grade - Grade submission
```

### Quiz Endpoints
```
GET    /api/quizzes - Get all quizzes
POST   /api/quizzes - Create quiz
GET    /api/quizzes/[id] - Get quiz details
PUT    /api/quizzes/[id] - Update quiz
DELETE /api/quizzes/[id] - Delete quiz
GET    /api/quizzes/[id]/view - View quiz (student)
POST   /api/quizzes/submit - Submit quiz
GET    /api/quizzes/[id]/attempts - Get attempts (teacher)
GET    /api/quizzes/[id]/stats - Get quiz statistics
GET    /api/quizzes/questions - Get quiz questions
```

### Practice Endpoints
```
GET    /api/practice/classes - Get practice classes
GET    /api/practice/files - Get practice files
GET    /api/practice/questions - Get practice questions
GET    /api/practice/questions/[id] - Get specific question
POST   /api/practice/attempts - Submit practice attempt
```

### Notes Endpoints
```
GET    /api/notes - Get all notes
POST   /api/notes - Create note
GET    /api/notes/[id] - Get note details
PUT    /api/notes/[id] - Update note
DELETE /api/notes/[id] - Delete note
GET    /api/notes/[id]/view - View note
```

### Calendar Endpoints
```
GET    /api/calendar-events - Get calendar events
POST   /api/calendar-events - Create event
PUT    /api/calendar-events/[id] - Update event
DELETE /api/calendar-events/[id] - Delete event
```

### Notification Endpoints
```
GET    /api/notifications - Get user notifications
PUT    /api/notifications/[id] - Mark notification as read
```

### Dashboard Endpoints
```
GET /api/dashboard/analytics - Get analytics data
GET /api/dashboard/calendar - Get calendar data
GET /api/dashboard/professor/stats - Get professor statistics
GET /api/dashboard/student/stats - Get student statistics
GET /api/dashboard/student/unread-counts - Get unread counts
GET /api/dashboard/student/mark-all-viewed - Mark all as viewed
GET /api/dashboard/students - Get students list
GET /api/dashboard/students/[id] - Get student details
```

### Admin Endpoints
```
GET    /api/admin/users - Get all users
PUT    /api/admin/users/[id] - Update user
POST   /api/admin/users/[id]/status - Update user status
GET    /api/admin/messages - Get contact messages
PUT    /api/admin/messages/[id] - Mark message as read
POST   /api/admin/messages/[id]/reply - Reply to message
GET    /api/admin/backup - Get backups
POST   /api/admin/backup - Create backup
GET    /api/admin/backup/[id] - Get backup details
POST   /api/admin/backup/[id]/download - Download backup
POST   /api/admin/backup/restore - Restore backup
GET    /api/admin/crashes - Get crash reports
PUT    /api/admin/crashes/[id]/resolve - Resolve crash
GET    /api/admin/performance - Get performance metrics
GET    /api/admin/dashboard-stats - Get admin dashboard stats
POST   /api/admin/test-email - Test email configuration
```

### File Upload Endpoints
```
POST /api/upload-file - Upload file
POST /api/upload-image - Upload image
```

---

## 🔐 Authentication System

### NextAuth.js Configuration
```typescript
// Configuration in lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validate credentials against database
        // Return user object or null
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user role and ID to token
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login'
  }
};
```

### Role-Based Access Control
```typescript
// Middleware for protecting routes
export function withAuth(handler: NextApiHandler, allowedRoles?: UserRole[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    return handler(req, res);
  };
}
```

---

## 📁 File Structure

```
classora.in/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── classes/              # Class management
│   │   ├── assignments/          # Assignment system
│   │   ├── quizzes/              # Quiz system
│   │   ├── practice/             # Practice questions
│   │   ├── notes/                # Notes system
│   │   ├── calendar-events/      # Calendar system
│   │   ├── notifications/        # Notification system
│   │   ├── dashboard/            # Dashboard endpoints
│   │   ├── admin/                # Admin endpoints
│   │   ├── upload-file/          # File upload
│   │   └── upload-image/         # Image upload
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── dashboard/                # Main dashboard
│   │   ├── assignments/          # Assignment management
│   │   ├── quizzes/              # Quiz management
│   │   ├── practice/             # Practice questions
│   │   ├── notes/                # Notes management
│   │   ├── calendar/             # Calendar view
│   │   ├── students/             # Student management
│   │   ├── settings/             # User settings
│   │   └── profile/              # User profile
│   ├── admin/                    # Admin dashboard
│   │   ├── users/                # User management
│   │   ├── messages/             # Contact messages
│   │   ├── backup/               # Backup management
│   │   ├── crashes/              # Crash reports
│   │   ├── performance/          # Performance monitoring
│   │   └── settings/             # System settings
│   ├── classes/                  # Class pages
│   ├── teachers/                 # Teacher profiles
│   ├── contact/                  # Contact page
│   ├── help/                     # Help documentation
│   ├── privacy/                  # Privacy policy
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Logo.tsx
│   │   ├── RichTextEditor.tsx
│   │   └── RichTextRenderer.tsx
│   ├── dashboard/                # Dashboard components
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   ├── ProfessorDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   └── StudentSubmissionsSection.tsx
│   ├── admin/                    # Admin components
│   │   └── PerformanceCharts.tsx
│   ├── classes/                  # Class components
│   │   ├── BasicClassCard.tsx
│   │   └── CreateClassForm.tsx
│   ├── teachers/                 # Teacher components
│   │   └── TeacherProfileForm.tsx
│   ├── providers/                # Context providers
│   │   ├── AuthProvider.tsx
│   │   ├── NotificationProvider.tsx
│   │   ├── SettingsProvider.tsx
│   │   └── AdminDataProvider.tsx
│   └── MaintenanceMode.tsx       # Maintenance component
├── lib/                          # Utility libraries
│   ├── db.ts                     # Database connection
│   ├── email.ts                  # Email functionality
│   ├── notifications.ts          # Notification system
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
│   └── useUnreadContent.ts       # Unread content hook
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Database migrations
│   ├── seed.ts                   # Database seeding
│   └── cleanup.ts                # Cleanup scripts
├── public/                       # Static assets
│   ├── logo.png                  # Logo files
│   ├── favicon.ico               # Favicon
│   ├── site.webmanifest          # Web app manifest
│   └── uploads/                  # Uploaded files
├── nginx/                        # Nginx configuration
│   └── nginx.conf                # Nginx config
├── .github/                      # GitHub Actions
│   └── workflows/
│       └── deploy.yml            # Deployment workflow
├── Dockerfile                    # Docker configuration
├── docker-compose.yml            # Docker Compose setup
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment variables template
├── .dockerignore                 # Docker ignore file
├── create-project-copy.sh        # Project template script
├── PROJECT_TEMPLATE_GUIDE.md     # Template documentation
├── DOCKER_DEPLOYMENT_GUIDE.md    # Deployment guide
└── TECHNICAL_DOCUMENTATION.md    # This file
```

---

## 🚀 Deployment Architecture

### Docker Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  classora-app:
    build: .
    container_name: classora-app
    environment:
      - DATABASE_URL=mysql://classora_user:classora_password@mysql:3306/classora_db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - mysql
    networks:
      - classora-network

  mysql:
    image: mysql:8.0
    container_name: classora-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=classora_db
      - MYSQL_USER=classora_user
      - MYSQL_PASSWORD=classora_password
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - classora-network

  nginx:
    image: nginx:alpine
    container_name: classora-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - classora-app
    networks:
      - classora-network
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /vps-projects/classora
          git pull origin main
          docker-compose down
          docker-compose build --no-cache
          docker-compose up -d
```

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MySQL 8.0+
- Git

### Installation Steps
```bash
# 1. Clone repository
git clone https://github.com/yourusername/classora.in.git
cd classora.in

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env with your configuration

# 4. Set up database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 5. Start development server
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/classora_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@classora.in"
SMTP_PASS="your-email-password"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=10485760  # 10MB
```

### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## 📊 Performance Considerations

### Database Optimization
- Use indexes on frequently queried columns
- Implement pagination for large datasets
- Use database transactions for data integrity
- Optimize queries with Prisma's query optimization

### Frontend Optimization
- Implement lazy loading for components
- Use Next.js Image component for optimized images
- Implement proper caching strategies
- Use React.memo for expensive components

### API Optimization
- Implement rate limiting
- Use proper HTTP status codes
- Implement request validation
- Use compression for responses

---

## 🔒 Security Considerations

### Authentication Security
- Use strong password hashing (bcrypt)
- Implement rate limiting on auth endpoints
- Use secure session management
- Implement proper CORS policies

### Data Security
- Validate all user inputs
- Use parameterized queries (Prisma handles this)
- Implement proper file upload validation
- Use HTTPS in production

### API Security
- Implement proper authorization checks
- Use API rate limiting
- Validate request bodies
- Implement proper error handling

---

## 🧪 Testing Strategy

### Unit Tests
- Test individual components and functions
- Mock external dependencies
- Test edge cases and error conditions

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flows

### E2E Tests
- Test complete user workflows
- Test cross-browser compatibility
- Test responsive design

---

This documentation provides a comprehensive overview of the Classora.in educational platform. Developers can use this as a reference to understand the system architecture, implement similar features, or contribute to the project.
