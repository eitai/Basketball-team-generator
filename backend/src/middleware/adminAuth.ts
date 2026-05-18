import { Request, Response, NextFunction } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const password =
    (req.headers['x-admin-password'] as string | undefined) ||
    (req.body as { adminPassword?: string } | undefined)?.adminPassword;
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!adminPassword || password !== adminPassword) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
