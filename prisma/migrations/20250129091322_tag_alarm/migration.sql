/*
  Warnings:

  - You are about to drop the column `tagProperty` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `variableId` on the `Alarm` table. All the data in the column will be lost.
  - Added the required column `tagId` to the `Alarm` table without a default value. This is not possible if the table is not empty.

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
    "subproperty" TEXT,
    "tagId" TEXT NOT NULL,
    "min" REAL,
    "max" REAL,
    "interval" INTEGER,
    "actions" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ontime" DATETIME,
    "offtime" DATETIME,
    "acktime" DATETIME,
    "userAck" TEXT,
    "lastCheck" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alarm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alarm" ("acktime", "actions", "createdAt", "id", "isEnabled", "lastCheck", "name", "offtime", "ontime", "projectId", "status", "subproperty", "type", "updatedAt", "userAck") SELECT "acktime", "actions", "createdAt", "id", "isEnabled", "lastCheck", "name", "offtime", "ontime", "projectId", "status", "subproperty", "type", "updatedAt", "userAck" FROM "Alarm";
DROP TABLE "Alarm";
ALTER TABLE "new_Alarm" RENAME TO "Alarm";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
