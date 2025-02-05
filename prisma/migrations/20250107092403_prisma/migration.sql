-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewId" TEXT NOT NULL,
    "type" TEXT,
    "name" TEXT,
    "property" TEXT,
    "events" TEXT,
    "actions" TEXT,
    "label" TEXT,
    "stroke" TEXT,
    "x" REAL,
    "y" REAL,
    "scale" REAL DEFAULT 1.0,
    "rotation" REAL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagId" TEXT,
    CONSTRAINT "Item_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("actions", "createdAt", "events", "id", "label", "name", "property", "rotation", "scale", "stroke", "tagId", "type", "updatedAt", "viewId", "x", "y") SELECT "actions", "createdAt", "events", "id", "label", "name", "property", "rotation", "scale", "stroke", "tagId", "type", "updatedAt", "viewId", "x", "y" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "delay" INTEGER DEFAULT 1,
    "interval" INTEGER DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "delay", "enabled", "id", "interval", "name", "projectId", "receiver", "subscriptions", "type", "updatedAt") SELECT "createdAt", "delay", "enabled", "id", "interval", "name", "projectId", "receiver", "subscriptions", "type", "updatedAt" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "scheduling" TEXT NOT NULL,
    "docproperty" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("content", "createdAt", "docproperty", "id", "name", "projectId", "receiver", "scheduling", "updatedAt") SELECT "content", "createdAt", "docproperty", "id", "name", "projectId", "receiver", "scheduling", "updatedAt" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE TABLE "new_Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "parameters" TEXT,
    "mode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "permission" INTEGER NOT NULL,
    "scheduling" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Script_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Script" ("code", "createdAt", "id", "mode", "name", "parameters", "permission", "projectId", "scheduling", "sync", "updatedAt") SELECT "code", "createdAt", "id", "mode", "name", "parameters", "permission", "projectId", "scheduling", "sync", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
