/*
  Warnings:

  - You are about to drop the column `type` on the `Device` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "property" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "polling" INTEGER,
    "lastConnected" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("createdAt", "description", "enabled", "id", "lastConnected", "name", "polling", "projectId", "property", "updatedAt") SELECT "createdAt", "description", "enabled", "id", "lastConnected", "name", "polling", "projectId", "property", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE UNIQUE INDEX "Device_name_key" ON "Device"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
