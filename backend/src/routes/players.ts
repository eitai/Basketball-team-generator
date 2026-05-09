import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.player.deleteMany({ where: { isGuest: true, createdAt: { lt: cutoff } } });
  const players = await prisma.player.findMany({ orderBy: { id: 'asc' } });
  res.json(players);
});

router.post('/', async (req, res) => {
  const player = await prisma.player.create({ data: req.body });
  res.status(201).json(player);
});

router.put('/:id', async (req, res) => {
  const player = await prisma.player.update({ where: { id: req.params.id }, data: req.body });
  res.json(player);
});

router.delete('/:id', async (req, res) => {
  await prisma.player.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.delete('/', async (_req, res) => {
  await prisma.player.deleteMany();
  res.status(204).end();
});

export default router;
