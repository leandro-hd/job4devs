import { Response } from 'express';
import * as settingsRepository from '../../db/repositories/settings.repository';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const ALLOWED_KEYS = ['keywords', 'min_budget', 'notification_email'] as const;

export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const settings = await settingsRepository.getByUserId(req.userId);
  res.json({ settings: Object.fromEntries(settings) });
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const updates: Array<[string, string]> = [];

  for (const key of ALLOWED_KEYS) {
    const value = body[key];
    if (value !== undefined) {
      updates.push([key, String(value)]);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid settings provided' });
    return;
  }

  for (const [key, value] of updates) {
    await settingsRepository.upsert(req.userId, key, value);
  }

  const settings = await settingsRepository.getByUserId(req.userId);
  res.json({ settings: Object.fromEntries(settings) });
}
