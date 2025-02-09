/*
  Warnings:

  - You are about to drop the column `label` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `rotation` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `scale` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `stroke` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Item` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewId" TEXT NOT NULL,
    "type" TEXT,
    "name" TEXT,
    "property" TEXT,
    "address" TEXT,
    "svgGuid" TEXT,
    "events" TEXT,
    "actions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagId" TEXT,
    CONSTRAINT "Item_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("actions", "createdAt", "events", "id", "name", "property", "tagId", "type", "updatedAt", "viewId") SELECT "actions", "createdAt", "events", "id", "name", "property", "tagId", "type", "updatedAt", "viewId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_Variable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "type" TEXT,
    "value" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "itemId" TEXT,
    "tagId" TEXT,
    CONSTRAINT "Variable_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Variable_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Variable" ("createdAt", "id", "name", "type", "updatedAt", "value") SELECT "createdAt", "id", "name", "type", "updatedAt", "value" FROM "Variable";
DROP TABLE "Variable";
ALTER TABLE "new_Variable" RENAME TO "Variable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
