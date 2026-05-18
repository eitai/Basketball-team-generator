import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';

const url = process.env['DATABASE_URL'] ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [players, allowedPhones, registrations, gameSettings] = await Promise.all([
    prisma.player.findMany(),
    prisma.allowedPhone.findMany(),
    prisma.registration.findMany(),
    prisma.gameSettings.findMany(),
  ]);

  const data = { players, allowedPhones, registrations, gameSettings };
  process.stdout.write(JSON.stringify(data, null, 2));
  console.error(`\nExported: ${players.length} players, ${allowedPhones.length} phones, ${registrations.length} registrations`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
