import { Response } from 'express';
import * as logsRepository from '../../db/repositories/logs.repository';
import * as jobsRepository from '../../db/repositories/jobs.repository';
import * as notificationsRepository from '../../db/repositories/notifications.repository';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export async function getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const [lastCycle, totalJobs, totalNotificationsSent] = await Promise.all([
    logsRepository.findLatest(),
    jobsRepository.countAll(),
    notificationsRepository.countSentForUser(req.userId),
  ]);

  res.json({ lastCycle, totalJobs, totalNotificationsSent });
}
