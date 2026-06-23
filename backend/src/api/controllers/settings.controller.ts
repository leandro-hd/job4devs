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
  const providedKeys = ALLOWED_KEYS.filter((key) => body[key] !== undefined);

  if (providedKeys.length === 0) {
    res.status(400).json({ error: 'No valid settings provided' });
    return;
  }

  for (const key of providedKeys) {
    const value = String(body[key]).trim();
    // An empty value means "clear this setting", not "store an empty string" —
    // otherwise downstream `?? fallback` reads never trigger (`''` isn't
    // null/undefined), e.g. notification_email staying blank forever.
    if (value === '') {
      await settingsRepository.remove(req.userId, key);
    } else {
      await settingsRepository.upsert(req.userId, key, value);
    }
  }

  const settings = await settingsRepository.getByUserId(req.userId);
  res.json({ settings: Object.fromEntries(settings) });
}
