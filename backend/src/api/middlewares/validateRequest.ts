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

export function validateForgotPassword(req: Request, res: Response, next: NextFunction): void {
  const { email } = req.body as { email?: string };
  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  next();
}

export function validateResetPassword(req: Request, res: Response, next: NextFunction): void {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token) {
    res.status(400).json({ error: 'Reset token is required' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  next();
}

export function validateVerifyEmail(req: Request, res: Response, next: NextFunction): void {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: 'Verification token is required' });
    return;
  }
  next();
}
