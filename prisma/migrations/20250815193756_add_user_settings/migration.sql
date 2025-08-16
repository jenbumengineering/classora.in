-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notifications" TEXT NOT NULL DEFAULT '{"email":true,"push":true,"assignments":true,"quizzes":true,"announcements":true}',
    "privacy" TEXT NOT NULL DEFAULT '{"profileVisibility":"classmates","showEmail":false,"showPhone":false}',
    "appearance" TEXT NOT NULL DEFAULT '{"theme":"light","fontSize":"medium"}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");
