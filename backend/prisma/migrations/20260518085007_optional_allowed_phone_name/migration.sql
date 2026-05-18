-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AllowedPhone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AllowedPhone" ("createdAt", "id", "name", "phone") SELECT "createdAt", "id", "name", "phone" FROM "AllowedPhone";
DROP TABLE "AllowedPhone";
ALTER TABLE "new_AllowedPhone" RENAME TO "AllowedPhone";
CREATE UNIQUE INDEX "AllowedPhone_phone_key" ON "AllowedPhone"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
