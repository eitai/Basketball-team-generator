import { Router } from 'express';

const router = Router();

router.post('/verify', (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!adminPassword) {
    res.status(503).json({ error: 'Admin not configured' });
    return;
  }
  if (password === adminPassword) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

export default router;
