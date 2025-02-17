/*
  Warnings:

  - You are about to drop the column `ackTime` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `offTime` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `onTime` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `ackTime` on the `AlarmHistory` table. All the data in the column will be lost.
  - You are about to drop the column `offTime` on the `AlarmHistory` table. All the data in the column will be lost.
  - You are about to drop the column `onTime` on the `AlarmHistory` table. All the data in the column will be lost.
  - You are about to drop the column `userAck` on the `AlarmHistory` table. All the data in the column will be lost.

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
    "ontime" DATETIME,
    "offtime" DATETIME,
    "acktime" DATETIME,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alarm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alarm" ("createdAt", "id", "isEnabled", "name", "projectId", "status", "subproperty", "tagId", "type", "updatedAt") SELECT "createdAt", "id", "isEnabled", "name", "projectId", "status", "subproperty", "tagId", "type", "updatedAt" FROM "Alarm";
DROP TABLE "Alarm";
ALTER TABLE "new_Alarm" RENAME TO "Alarm";
CREATE TABLE "new_AlarmHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alarmId" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT,
    "message" TEXT,
    "group" TEXT,
    "text" TEXT,
    "ontime" DATETIME,
    "offtime" DATETIME,
    "acktime" DATETIME,
    "userack" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlarmHistory_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AlarmHistory" ("alarmId", "createdAt", "group", "id", "message", "status", "text", "type", "updatedAt") SELECT "alarmId", "createdAt", "group", "id", "message", "status", "text", "type", "updatedAt" FROM "AlarmHistory";
DROP TABLE "AlarmHistory";
ALTER TABLE "new_AlarmHistory" RENAME TO "AlarmHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
