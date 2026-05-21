import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

function checkPassword(input: string): boolean {
  const hash = process.env['ADMIN_PASSWORD_HASH'];
  const plain = process.env['ADMIN_PASSWORD'];
  if (hash) return bcrypt.compareSync(input, hash);
  if (plain) return input === plain;
  return false;
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const password =
    (req.headers['x-admin-password'] as string | undefined) ||
    (req.body as { adminPassword?: string } | undefined)?.adminPassword;
  if (!password || !checkPassword(password)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
