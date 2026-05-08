-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "defense" INTEGER NOT NULL DEFAULT 5,
    "offense" INTEGER NOT NULL DEFAULT 5,
    "shooting" INTEGER NOT NULL DEFAULT 5,
    "passing" INTEGER NOT NULL DEFAULT 5,
    "rebounding" INTEGER NOT NULL DEFAULT 5,
    "fitness" INTEGER NOT NULL DEFAULT 5,
    "ballHandler" BOOLEAN NOT NULL DEFAULT false
);
