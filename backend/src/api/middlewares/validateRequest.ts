import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }
  next();
}
