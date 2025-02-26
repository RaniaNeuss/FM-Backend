/*
  Warnings:

  - Made the column `definitionId` on table `Alarm` required. This step will fail if there are existing NULL values in that column.

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
    "userack" TEXT,
    "definitionId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alarm_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "AlarmDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alarm" ("acktime", "createdAt", "definitionId", "id", "isEnabled", "name", "offtime", "ontime", "projectId", "status", "subproperty", "tagId", "type", "updatedAt", "userack") SELECT "acktime", "createdAt", "definitionId", "id", "isEnabled", "name", "offtime", "ontime", "projectId", "status", "subproperty", "tagId", "type", "updatedAt", "userack" FROM "Alarm";
DROP TABLE "Alarm";
ALTER TABLE "new_Alarm" RENAME TO "Alarm";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
