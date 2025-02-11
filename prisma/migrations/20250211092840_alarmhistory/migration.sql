/*
  Warnings:

  - You are about to drop the column `acktime` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `lastCheck` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `offtime` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `ontime` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `subproperty` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `userAck` on the `Alarm` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_AlarmHistoryAcknowledgements" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AlarmHistoryAcknowledgements_A_fkey" FOREIGN KEY ("A") REFERENCES "AlarmHistory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AlarmHistoryAcknowledgements_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alarm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT,
    "name" TEXT,
    "text" TEXT,
    "type" TEXT,
    "tagId" TEXT NOT NULL,
    "min" REAL,
    "max" REAL,
    "interval" INTEGER,
    "timeInMinMaxRange" INTEGER,
    "actions" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alarm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alarm" ("actions", "createdAt", "id", "interval", "isEnabled", "max", "min", "name", "projectId", "status", "tagId", "text", "timeInMinMaxRange", "type", "updatedAt") SELECT "actions", "createdAt", "id", "interval", "isEnabled", "max", "min", "name", "projectId", "status", "tagId", "text", "timeInMinMaxRange", "type", "updatedAt" FROM "Alarm";
DROP TABLE "Alarm";
ALTER TABLE "new_Alarm" RENAME TO "Alarm";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_AlarmHistoryAcknowledgements_AB_unique" ON "_AlarmHistoryAcknowledgements"("A", "B");

-- CreateIndex
CREATE INDEX "_AlarmHistoryAcknowledgements_B_index" ON "_AlarmHistoryAcknowledgements"("B");
