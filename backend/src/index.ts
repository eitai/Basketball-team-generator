import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import playerRoutes from './routes/players';
import authRoutes from './routes/auth';
import registrationRoutes from './routes/registration';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;
const isProd = process.env['NODE_ENV'] === 'production';

app.use(cors({ origin: isProd ? false : true }));

app.use(express.json());
app.use('/api/players', playerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);

if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
}

const SEED_PLAYERS = [
  { name: 'איתי מאיר', position: 'center', defense: 9, offense: 7, shooting: 9, passing: 8, rebounding: 7, fitness: 3, ballHandler: false },
  { name: 'אביב סמון', position: 'guard', defense: 6, offense: 9, shooting: 10, passing: 8, rebounding: 4, fitness: 9, ballHandler: true },
  { name: 'אורון סמון', position: 'forward', defense: 3, offense: 8, shooting: 9, passing: 9, rebounding: 4, fitness: 3, ballHandler: false },
  { name: 'דני', position: 'forward', defense: 9, offense: 4, shooting: 4, passing: 7, rebounding: 7, fitness: 7, ballHandler: false },
  { name: 'כפיר סמון', position: 'forward', defense: 2, offense: 8, shooting: 9, passing: 9, rebounding: 3, fitness: 3, ballHandler: false },
  { name: 'אביב קזז', position: 'forward', defense: 8, offense: 8, shooting: 5, passing: 6, rebounding: 3, fitness: 10, ballHandler: true },
  { name: 'עמית', position: 'guard', defense: 9, offense: 1, shooting: 1, passing: 4, rebounding: 6, fitness: 10, ballHandler: false },
  { name: 'שלומי מזרחי', position: 'center', defense: 10, offense: 8, shooting: 7, passing: 9, rebounding: 10, fitness: 8, ballHandler: false },
  { name: 'נועם', position: 'guard', defense: 6, offense: 9, shooting: 9, passing: 6, rebounding: 1, fitness: 10, ballHandler: true },
  { name: 'זאב', position: 'guard', defense: 6, offense: 7, shooting: 8, passing: 9, rebounding: 2, fitness: 9, ballHandler: true },
  { name: 'יהב ביטון', position: 'forward', defense: 8, offense: 8, shooting: 10, passing: 4, rebounding: 3, fitness: 8, ballHandler: false },
  { name: 'יוסי ממן', position: 'guard', defense: 4, offense: 4, shooting: 8, passing: 2, rebounding: 3, fitness: 4, ballHandler: false },
  { name: 'איגור', position: 'center', defense: 9, offense: 8, shooting: 2, passing: 7, rebounding: 8, fitness: 5, ballHandler: false },
  { name: 'אבירם', position: 'forward', defense: 7, offense: 2, shooting: 2, passing: 2, rebounding: 2, fitness: 2, ballHandler: false },
  { name: 'דוד בל', position: 'guard', defense: 5, offense: 5, shooting: 5, passing: 5, rebounding: 5, fitness: 5, ballHandler: false },
  { name: 'שלומי ויזל', position: 'guard', defense: 1, offense: 3, shooting: 3, passing: 3, rebounding: 3, fitness: 6, ballHandler: false },
  { name: 'שלומי אלבז', position: 'center', defense: 9, offense: 3, shooting: 1, passing: 5, rebounding: 8, fitness: 4, ballHandler: false },
  { name: 'יהב סמון', position: 'guard', defense: 7, offense: 7, shooting: 9, passing: 2, rebounding: 1, fitness: 10, ballHandler: false },
  { name: 'עידן', position: 'guard', defense: 10, offense: 5, shooting: 1, passing: 2, rebounding: 5, fitness: 10, ballHandler: false },
  { name: 'יהונתן עדרי', position: 'forward', defense: 9, offense: 7, shooting: 7, passing: 7, rebounding: 5, fitness: 9, ballHandler: false },
  { name: 'אוריה עדרי', position: 'forward', defense: 7, offense: 7, shooting: 7, passing: 5, rebounding: 5, fitness: 10, ballHandler: false },
  { name: 'אורן', position: 'guard', defense: 7, offense: 8, shooting: 9, passing: 7, rebounding: 2, fitness: 8, ballHandler: true },
  { name: 'אמיר', position: 'forward', defense: 7, offense: 4, shooting: 9, passing: 5, rebounding: 9, fitness: 6, ballHandler: false },
];

async function seedIfEmpty() {
  const count = await prisma.player.count();
  if (count === 0) {
    await prisma.player.createMany({ data: SEED_PLAYERS });
    console.log(`Seeded ${SEED_PLAYERS.length} players`);
  }
}

async function main() {
  await prisma.$connect();
  console.log('Connected to PostgreSQL');
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
