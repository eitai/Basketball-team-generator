-- CreateTable
CREATE TABLE "AllowedPhone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GameSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" DATETIME,
    "maxPlayers" INTEGER NOT NULL DEFAULT 18,
    "gameLabel" TEXT NOT NULL DEFAULT ''
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedPhone_phone_key" ON "AllowedPhone"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_phone_key" ON "Registration"("phone");
