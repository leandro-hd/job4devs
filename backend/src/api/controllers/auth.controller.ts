import { Request, Response } from 'express';
import * as authService from '../../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  const result = await authService.registerUser({ email, password, name });
  if (!result) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const result = await authService.loginUser({ email, password });
  if (!result) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

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
