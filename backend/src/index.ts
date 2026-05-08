import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playerRoutes from './routes/players';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());
app.use('/api/players', playerRoutes);

async function main() {
  await prisma.$connect();
  console.log('Connected to PostgreSQL');
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
