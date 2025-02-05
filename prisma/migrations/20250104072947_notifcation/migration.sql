/*
  Warnings:

  - Added the required column `projectId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "delay" INTEGER DEFAULT 1,
    "interval" INTEGER DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "delay", "enabled", "id", "interval", "name", "receiver", "subscriptions", "type", "updatedAt") SELECT "createdAt", "delay", "enabled", "id", "interval", "name", "receiver", "subscriptions", "type", "updatedAt" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
