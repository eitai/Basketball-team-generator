import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient() {
  const dbUrl = (process.env['DATABASE_URL'] ?? '')
    .replace('sslmode=require', 'sslmode=no-verify')
    .replace('sslmode=verify-full', 'sslmode=no-verify')
    .replace('sslmode=verify-ca', 'sslmode=no-verify');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('sslmode=no-verify') ? { rejectUnauthorized: false } : false,
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;
