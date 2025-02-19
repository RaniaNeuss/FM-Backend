-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AlarmHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alarmId" TEXT NOT NULL,
    "name" TEXT,
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
    CONSTRAINT "AlarmHistory_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AlarmHistory" ("acktime", "alarmId", "createdAt", "group", "id", "message", "name", "offtime", "ontime", "status", "text", "type", "updatedAt", "userack") SELECT "acktime", "alarmId", "createdAt", "group", "id", "message", "name", "offtime", "ontime", "status", "text", "type", "updatedAt", "userack" FROM "AlarmHistory";
DROP TABLE "AlarmHistory";
ALTER TABLE "new_AlarmHistory" RENAME TO "AlarmHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
