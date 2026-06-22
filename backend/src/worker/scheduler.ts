import cron from 'node-cron';
import { runScrapeJob } from './jobs/scrape.job';
import { config } from '../config';

export function startScheduler(): void {
  const interval = config.defaultCronIntervalMinutes;
  const expression = `*/${interval} * * * *`;

  cron.schedule(expression, async () => {
    await runScrapeJob();
  });

  console.log(`[Scheduler] Worker running every ${interval} minutes`);
}
