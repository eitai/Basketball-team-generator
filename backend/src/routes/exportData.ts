import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.get('/', adminAuth, async (_req, res) => {
  const [players, allowedPhones, registrations, gameSettings] = await Promise.all([
    prisma.player.findMany(),
    prisma.allowedPhone.findMany(),
    prisma.registration.findMany(),
    prisma.gameSettings.findMany(),
  ]);
  res.json({ players, allowedPhones, registrations, gameSettings });
});

export default router;
