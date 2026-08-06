import * as sourcesRepository from '../../db/repositories/sources.repository';
import * as jobsRepository from '../../db/repositories/jobs.repository';
import * as freelas99Scraper from './sources/freelas99.scraper';
import * as scraperState from './scraper-state';
import * as notificationService from '../notification.service';
import { config } from '../../config';
import { logger } from '../../lib/logger';

const SOURCE_NAME = '99freelas';
const MAX_PAGES = 10;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 2500;

export interface ScrapeSummary {
  jobsFound: number;
  jobsNew: number;
  partial: boolean;
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function scrapeAndStore(): Promise<ScrapeSummary> {
  const startedAt = Date.now();
  logger.info({ source: SOURCE_NAME }, 'Scrape cycle started');

  const source = await sourcesRepository.findByName(SOURCE_NAME);
  if (!source) {
    throw new Error(`Source '${SOURCE_NAME}' not found — did you run the migrations/seed?`);
  }

  let jobsFound = 0;
  let jobsNew = 0;
  let partial = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const jobs = await freelas99Scraper.fetchPage(page);

    if (jobs.length === 0) {
      if (page === 1) {
        partial = true;
        logger.warn(
          { source: SOURCE_NAME, page },
          'Selector returned 0 results on page 1 — possible layout change'
        );
      }
      break;
    }

    jobsFound += jobs.length;
    const insertedJobs = await jobsRepository.insertMany(
      jobs.map((job) => ({ ...job, sourceId: source.id }))
    );
    jobsNew += insertedJobs.length;

    for (const inserted of insertedJobs) {
      try {
        const detail = await freelas99Scraper.fetchJobDetail(inserted.url);
        await jobsRepository.updateJobDetail(inserted.id, detail);
      } catch (err) {
        if (err instanceof freelas99Scraper.Freelas99AuthExpiredError) {
          if (!scraperState.isFreelas99AuthExpired()) {
            scraperState.setFreelas99AuthExpired();
            logger.warn('99freelas auth cookies expired — avg proposal fields will be null until env vars are updated');
            if (config.adminEmail && !scraperState.isFreelas99AuthExpiredAlertSent()) {
              scraperState.markFreelas99AuthExpiredAlertSent();
              notificationService.sendAuthExpiredAlert(config.adminEmail).catch((alertErr) => {
                logger.error({ err: alertErr }, 'Failed to send auth expired alert email');
              });
            }
          }
        } else {
          logger.warn({ err, jobId: inserted.id }, 'Failed to fetch job detail — skipping');
        }
      }
      await delay(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
    }

    if (insertedJobs.length === 0) {
      break;
    }

    if (page < MAX_PAGES) {
      await delay(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
    }
  }

  logger.info(
    { source: SOURCE_NAME, jobsFound, jobsNew, partial, durationMs: Date.now() - startedAt },
    'Scrape cycle finished'
  );

  return { jobsFound, jobsNew, partial };
}
