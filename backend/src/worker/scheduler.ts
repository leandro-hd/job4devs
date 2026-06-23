import cron from 'node-cron';
import { runScrapeJob } from './jobs/scrape.job';
import { config } from '../config';
import { logger } from '../lib/logger';

export function startScheduler(): void {
  const interval = config.defaultCronIntervalMinutes;
  const expression = `*/${interval} * * * *`;

  cron.schedule(expression, async () => {
    await runScrapeJob();
  });

  logger.info({ intervalMinutes: interval }, 'Scheduler started');
}
