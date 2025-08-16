/*
  Warnings:

  - You are about to drop the `code_executions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `practice_question_coding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `codeAnswer` on the `practice_question_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `executionTime` on the `practice_question_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsed` on the `practice_question_attempts` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `practice_questions` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `practice_questions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `practice_questions` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `practice_questions` table. All the data in the column will be lost.
  - Added the required column `content` to the `practice_questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "practice_question_coding_questionId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "code_executions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "practice_question_coding";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_practice_question_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "answer" TEXT,
    "selectedOptions" TEXT,
    "isCorrect" BOOLEAN,
    "score" REAL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "practice_question_attempts_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "practice_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "practice_question_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_practice_question_attempts" ("answer", "completedAt", "id", "isCorrect", "questionId", "score", "selectedOptions", "startedAt", "studentId") SELECT "answer", "completedAt", "id", "isCorrect", "questionId", "score", "selectedOptions", "startedAt", "studentId" FROM "practice_question_attempts";
DROP TABLE "practice_question_attempts";
ALTER TABLE "new_practice_question_attempts" RENAME TO "practice_question_attempts";
CREATE TABLE "new_practice_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "timeLimit" INTEGER,
    "professorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "practice_questions_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_practice_questions" ("createdAt", "difficulty", "id", "points", "subject", "title", "type", "updatedAt") SELECT "createdAt", "difficulty", "id", "points", "subject", "title", "type", "updatedAt" FROM "practice_questions";
DROP TABLE "practice_questions";
ALTER TABLE "new_practice_questions" RENAME TO "practice_questions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
