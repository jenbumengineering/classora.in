-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "classId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "noteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_assignments" ("category", "classId", "createdAt", "description", "dueDate", "fileUrl", "id", "professorId", "status", "title", "updatedAt") SELECT "category", "classId", "createdAt", "description", "dueDate", "fileUrl", "id", "professorId", "status", "title", "updatedAt" FROM "assignments";
DROP TABLE "assignments";
ALTER TABLE "new_assignments" RENAME TO "assignments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
