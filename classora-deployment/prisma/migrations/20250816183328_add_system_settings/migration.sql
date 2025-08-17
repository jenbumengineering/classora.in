-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteName" TEXT NOT NULL DEFAULT 'Classora.in',
    "siteDescription" TEXT NOT NULL DEFAULT 'Educational Platform for Professors and Students',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "maxFileSize" INTEGER NOT NULL DEFAULT 10,
    "allowedFileTypes" TEXT NOT NULL DEFAULT 'pdf,doc,docx,txt,jpg,jpeg,png',
    "sessionTimeout" INTEGER NOT NULL DEFAULT 24,
    "backupRetention" INTEGER NOT NULL DEFAULT 30,
    "emailHost" TEXT NOT NULL DEFAULT 'mail.classora.in',
    "emailPort" INTEGER NOT NULL DEFAULT 587,
    "emailSecure" BOOLEAN NOT NULL DEFAULT false,
    "emailFromEmail" TEXT NOT NULL DEFAULT 'support@classora.in',
    "emailFromName" TEXT NOT NULL DEFAULT 'Classora',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "classes_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_classes" ("code", "createdAt", "description", "id", "name", "professorId", "updatedAt") SELECT "code", "createdAt", "description", "id", "name", "professorId", "updatedAt" FROM "classes";
DROP TABLE "classes";
ALTER TABLE "new_classes" RENAME TO "classes";
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
