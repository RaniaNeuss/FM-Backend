/*
  Warnings:

  - You are about to drop the column `tagId` on the `Variable` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Variable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Variable" ("createdAt", "id", "name", "type", "updatedAt", "value") SELECT "createdAt", "id", "name", "type", "updatedAt", "value" FROM "Variable";
DROP TABLE "Variable";
ALTER TABLE "new_Variable" RENAME TO "Variable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
