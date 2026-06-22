import { pool } from '../index';

export interface NewJob {
  sourceId: number;
  externalId: string;
  title: string;
  url: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType: string;
  clientRating: number | null;
  clientReviews: number | null;
  location: string | null;
  rawTags: string[];
  publishedAt: Date | null;
}

export async function insertMany(jobs: NewJob[]): Promise<number> {
  if (jobs.length === 0) {
    return 0;
  }

  const client = await pool.connect();
  let insertedCount = 0;
  try {
    await client.query('BEGIN');
    for (const job of jobs) {
      const result = await client.query(
        `INSERT INTO jobs (
           source_id, external_id, title, url, description,
           budget_min, budget_max, budget_type,
           client_rating, client_reviews, location, raw_tags, published_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (source_id, external_id) DO NOTHING`,
        [
          job.sourceId,
          job.externalId,
          job.title,
          job.url,
          job.description,
          job.budgetMin,
          job.budgetMax,
          job.budgetType,
          job.clientRating,
          job.clientReviews,
          job.location,
          job.rawTags,
          job.publishedAt,
        ]
      );
      insertedCount += result.rowCount ?? 0;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return insertedCount;
}
