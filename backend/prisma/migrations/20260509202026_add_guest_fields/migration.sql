-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "defense" INTEGER NOT NULL DEFAULT 5,
    "offense" INTEGER NOT NULL DEFAULT 5,
    "shooting" INTEGER NOT NULL DEFAULT 5,
    "passing" INTEGER NOT NULL DEFAULT 5,
    "rebounding" INTEGER NOT NULL DEFAULT 5,
    "fitness" INTEGER NOT NULL DEFAULT 5,
    "ballHandler" BOOLEAN NOT NULL DEFAULT false,
    "generalRating" INTEGER NOT NULL DEFAULT 5,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Player" ("ballHandler", "defense", "fitness", "generalRating", "id", "name", "offense", "passing", "position", "rebounding", "shooting") SELECT "ballHandler", "defense", "fitness", "generalRating", "id", "name", "offense", "passing", "position", "rebounding", "shooting" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
