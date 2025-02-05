/*
  Warnings:

  - Added the required column `value` to the `Daq` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variableId` to the `Daq` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "address" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Daq" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" TEXT NOT NULL,
    "interval" INTEGER NOT NULL,
    "changed" BOOLEAN NOT NULL,
    "restored" BOOLEAN NOT NULL,
    "variableId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "Daq_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "Variable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Daq_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Daq" ("changed", "enabled", "id", "interval", "restored", "tagId") SELECT "changed", "enabled", "id", "interval", "restored", "tagId" FROM "Daq";
DROP TABLE "Daq";
ALTER TABLE "new_Daq" RENAME TO "Daq";
CREATE UNIQUE INDEX "Daq_tagId_key" ON "Daq"("tagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
