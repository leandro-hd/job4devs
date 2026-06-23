import { scrapeAndStore } from '../../services/scraper/scraper.service';
import * as sourcesRepository from '../../db/repositories/sources.repository';
import * as usersRepository from '../../db/repositories/users.repository';
import * as settingsRepository from '../../db/repositories/settings.repository';
import * as jobsRepository from '../../db/repositories/jobs.repository';
import * as notificationsRepository from '../../db/repositories/notifications.repository';
import * as logsRepository from '../../db/repositories/logs.repository';
import * as filterService from '../../services/filter.service';
import * as notificationService from '../../services/notification.service';
import { logger } from '../../lib/logger';

const SOURCE_NAME = '99freelas';

let isRunning = false;

export async function runScrapeJob(): Promise<void> {
  if (isRunning) {
    logger.warn('Previous cycle still running — skipping');
    return;
  }
  isRunning = true;
  const startedAt = Date.now();

  try {
    const source = await sourcesRepository.findByName(SOURCE_NAME);
    if (!source) {
      throw new Error(`Source '${SOURCE_NAME}' not found — did you run the migrations/seed?`);
    }

    let scrapeResult;
    try {
      scrapeResult = await scrapeAndStore();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err }, 'Scrape failed — worker cycle aborted');
      await logsRepository.insert({
        sourceId: source.id,
        jobsFound: 0,
        jobsNew: 0,
        jobsNotified: 0,
        status: 'failed',
        errorMessage: message,
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    let jobsNotified = 0;
    const activeUsers = await usersRepository.findAllActive();

    for (const user of activeUsers) {
      try {
        const settings = await settingsRepository.getByUserId(user.id);
        const keywords = filterService.parseKeywords(settings.get('keywords'));

        if (keywords.length > 0) {
          const unseenJobs = await jobsRepository.findUnnotifiedForUser(user.id);
          const matched = unseenJobs.filter((job) => filterService.matchesKeywords(job, keywords));

          if (matched.length > 0) {
            const recipient = settings.get('notification_email') ?? user.email;
            await notificationsRepository.insertPendingMany(
              matched.map((job) => ({ userId: user.id, jobId: job.id, recipient }))
            );
          }
        }

        const pending = await notificationsRepository.findPendingForUser(user.id);
        const [first] = pending;
        if (!first) {
          continue;
        }

        try {
          await notificationService.sendAlert(first.recipient, pending);
          await notificationsRepository.markSent(pending.map((p) => p.id));
          jobsNotified += pending.length;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await notificationsRepository.markFailed(pending.map((p) => p.id), message);
        }
      } catch (err) {
        logger.warn({ err, userId: user.id }, 'Failed processing user — continuing with the rest of the cycle');
      }
    }

    await logsRepository.insert({
      sourceId: source.id,
      jobsFound: scrapeResult.jobsFound,
      jobsNew: scrapeResult.jobsNew,
      jobsNotified,
      status: scrapeResult.partial ? 'partial' : 'success',
      durationMs: Date.now() - startedAt,
    });

    logger.info(
      {
        jobsFound: scrapeResult.jobsFound,
        jobsNew: scrapeResult.jobsNew,
        jobsNotified,
        status: scrapeResult.partial ? 'partial' : 'success',
        durationMs: Date.now() - startedAt,
      },
      'Worker cycle finished'
    );
  } catch (err) {
    logger.error({ err }, 'Unexpected error during scrape cycle');
  } finally {
    isRunning = false;
  }
}
