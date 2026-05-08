import { Router, Request, Response } from 'express';
import Player from '../models/Player';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const players = await Player.find().sort({ createdAt: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const player = new Player(req.body);
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!player) return res.status(404).json({ error: 'Not found' });
    res.json(player);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/', async (_req: Request, res: Response) => {
  try {
    await Player.deleteMany({});
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
