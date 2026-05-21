import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL']!, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

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
