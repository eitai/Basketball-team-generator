import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playerRoutes from './routes/players';
import authRoutes from './routes/auth';
import registrationRoutes from './routes/registration';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;
const isProd = process.env['NODE_ENV'] === 'production';

const allowedOrigins = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: isProd ? allowedOrigins : true }));

app.use(express.json());
app.use('/api/players', playerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);


async function main() {
  await prisma.$connect();
  console.log('Connected to SQLite');
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
