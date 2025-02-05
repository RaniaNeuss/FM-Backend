/*
  Warnings:

  - You are about to drop the column `align` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `margin` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `variables` on the `View` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "width" INTEGER,
    "property" TEXT,
    "height" INTEGER,
    "backgroundColor" TEXT,
    "gridType" TEXT,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "View_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_View" ("backgroundColor", "createdAt", "gridType", "height", "id", "name", "projectId", "type", "updatedAt", "width") SELECT "backgroundColor", "createdAt", "gridType", "height", "id", "name", "projectId", "type", "updatedAt", "width" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE UNIQUE INDEX "View_name_key" ON "View"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
