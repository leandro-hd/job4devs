import * as sourcesRepository from '../../db/repositories/sources.repository';
import * as jobsRepository from '../../db/repositories/jobs.repository';
import * as freelas99Scraper from './sources/freelas99.scraper';

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
      }
      break;
    }

    jobsFound += jobs.length;
    const inserted = await jobsRepository.insertMany(
      jobs.map((job) => ({ ...job, sourceId: source.id }))
    );
    jobsNew += inserted;

    if (inserted === 0) {
      break;
    }

    if (page < MAX_PAGES) {
      await delay(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
    }
  }

  return { jobsFound, jobsNew, partial };
}
