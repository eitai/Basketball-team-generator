import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env['DATABASE_URL'] ?? 'file:./dev.db';

// Ensure the directory exists (important when DATABASE_URL points to a mounted volume)
const dbPath = url.replace(/^file:/, '');
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const adapter = new PrismaBetterSqlite3({ url });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;
