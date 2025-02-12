/*
  Warnings:

  - You are about to drop the column `actions` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `max` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `min` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `timeInMinMaxRange` on the `Alarm` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alarm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT,
    "name" TEXT,
    "type" TEXT,
    "tagId" TEXT NOT NULL,
    "subproperty" TEXT,
    "onTime" DATETIME,
    "offTime" DATETIME,
    "ackTime" DATETIME,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alarm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alarm" ("createdAt", "id", "isEnabled", "name", "projectId", "status", "tagId", "type", "updatedAt") SELECT "createdAt", "id", "isEnabled", "name", "projectId", "status", "tagId", "type", "updatedAt" FROM "Alarm";
DROP TABLE "Alarm";
ALTER TABLE "new_Alarm" RENAME TO "Alarm";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
