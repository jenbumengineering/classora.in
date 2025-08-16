-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_system_settings" (
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
    "companyName" TEXT NOT NULL DEFAULT 'Jenbum Engineering Pvt. Ltd.',
    "addressLine1" TEXT NOT NULL DEFAULT '123 Main Street',
    "addressLine2" TEXT NOT NULL DEFAULT 'Suite 100',
    "city" TEXT NOT NULL DEFAULT 'Mumbai',
    "state" TEXT NOT NULL DEFAULT 'Maharashtra',
    "postalCode" TEXT NOT NULL DEFAULT '400001',
    "country" TEXT NOT NULL DEFAULT 'India',
    "phone" TEXT NOT NULL DEFAULT '+91 1234567890',
    "website" TEXT NOT NULL DEFAULT 'https://classora.in',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_system_settings" ("allowedFileTypes", "backupRetention", "createdAt", "emailFromEmail", "emailFromName", "emailHost", "emailNotifications", "emailPort", "emailSecure", "id", "maintenanceMode", "maxFileSize", "registrationEnabled", "sessionTimeout", "siteDescription", "siteName", "updatedAt") SELECT "allowedFileTypes", "backupRetention", "createdAt", "emailFromEmail", "emailFromName", "emailHost", "emailNotifications", "emailPort", "emailSecure", "id", "maintenanceMode", "maxFileSize", "registrationEnabled", "sessionTimeout", "siteDescription", "siteName", "updatedAt" FROM "system_settings";
DROP TABLE "system_settings";
ALTER TABLE "new_system_settings" RENAME TO "system_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
