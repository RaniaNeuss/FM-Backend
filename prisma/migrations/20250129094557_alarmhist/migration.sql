/*
  Warnings:

  - Added the required column `updatedAt` to the `AlarmHistory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AlarmHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alarmId" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT,
    "message" TEXT,
    "group" TEXT,
    "text" TEXT,
    "onTime" DATETIME,
    "offTime" DATETIME,
    "ackTime" DATETIME,
    "userAck" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlarmHistory_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AlarmHistory" ("ackTime", "alarmId", "group", "id", "message", "offTime", "onTime", "status", "text", "type", "userAck") SELECT "ackTime", "alarmId", "group", "id", "message", "offTime", "onTime", "status", "text", "type", "userAck" FROM "AlarmHistory";
DROP TABLE "AlarmHistory";
ALTER TABLE "new_AlarmHistory" RENAME TO "AlarmHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
