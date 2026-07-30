import { Request, Response } from 'express';
import * as authService from '../../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { logger } from '../../lib/logger';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  const result = await authService.registerUser({ email, password, name });
  if (!result) {
    logger.warn({ email }, 'Registration attempt with email already in use');
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  logger.info({ userId: result.user.id, email }, 'User registered');
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const result = await authService.loginUser({ email, password });
  if (!result) {
    logger.warn({ email }, 'Failed login attempt');
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  logger.info({ userId: result.user.id, email }, 'User logged in');
  res.json(result);
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await authService.getUserById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  await authService.requestPasswordReset(email);
  // Always 200 — don't reveal whether the email is registered.
  res.json({ message: 'If this email is registered, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string };
  const ok = await authService.resetPassword(token, password);
  if (!ok) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }
  res.json({ message: 'Password updated successfully' });
}
