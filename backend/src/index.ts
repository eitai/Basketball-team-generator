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


async function main() {
  await prisma.$connect();
  console.log('Connected to SQLite');
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
