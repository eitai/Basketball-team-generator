-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "playerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowedPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" TIMESTAMP(3),
    "maxPlayers" INTEGER NOT NULL DEFAULT 18,
    "gameLabel" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "GameSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedPhone_phone_key" ON "AllowedPhone"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "AllowedPhone_playerId_key" ON "AllowedPhone"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_phone_key" ON "Registration"("phone");

-- AddForeignKey
ALTER TABLE "AllowedPhone" ADD CONSTRAINT "AllowedPhone_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
