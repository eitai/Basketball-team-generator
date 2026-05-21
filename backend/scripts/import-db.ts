import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const exportPath = path.resolve(__dirname, '../../prod-export.json');
  const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  // Clear existing data in safe order
  await prisma.allowedPhone.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.player.deleteMany();
  await prisma.gameSettings.deleteMany();

  // Import players
  for (const p of data.players) {
    await prisma.player.create({ data: p });
  }
  console.log(`Imported ${data.players.length} players`);

  // Import game settings
  for (const s of data.gameSettings) {
    await prisma.gameSettings.create({ data: s });
  }

  // Import allowed phones (skip playerId links for now — re-link after)
  for (const p of data.allowedPhones) {
    await prisma.allowedPhone.create({ data: { ...p, playerId: null } });
  }
  console.log(`Imported ${data.allowedPhones.length} allowed phones`);

  // Re-apply playerId links
  for (const p of data.allowedPhones) {
    if (p.playerId) {
      await prisma.allowedPhone.update({ where: { id: p.id }, data: { playerId: p.playerId } });
    }
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
