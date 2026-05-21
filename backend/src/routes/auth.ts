import { Router } from 'express';
import bcrypt from 'bcryptjs';

const router = Router();

function checkPassword(input: string): boolean {
  const hash = process.env['ADMIN_PASSWORD_HASH'];
  const plain = process.env['ADMIN_PASSWORD'];
  if (hash) return bcrypt.compareSync(input, hash);
  if (plain) return input === plain;
  return false;
}

router.post('/verify', (req, res) => {
  const { password } = req.body as { password?: string };
  const hasConfig = !!(process.env['ADMIN_PASSWORD_HASH'] || process.env['ADMIN_PASSWORD']);
  if (!hasConfig) {
    res.status(503).json({ error: 'Admin not configured' });
    return;
  }
  if (password && checkPassword(password)) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

export default router;
