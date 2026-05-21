import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL']!, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const exportPath = path.resolve(__dirname, '../../prod-export.json');
  const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  await prisma.$transaction(async (tx) => {
    await tx.allowedPhone.deleteMany();
    await tx.registration.deleteMany();
    await tx.player.deleteMany();
    await tx.gameSettings.deleteMany();

    for (const p of data.players) {
      await tx.player.create({ data: p });
    }
    for (const s of data.gameSettings) {
      await tx.gameSettings.create({ data: s });
    }
    for (const p of data.allowedPhones) {
      await tx.allowedPhone.create({ data: { ...p, playerId: null } });
    }
    for (const p of data.allowedPhones) {
      if (p.playerId) {
        await tx.allowedPhone.update({ where: { id: p.id }, data: { playerId: p.playerId } });
      }
    }
  });

  console.log(`Imported ${data.players.length} players, ${data.allowedPhones.length} phones`);
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
