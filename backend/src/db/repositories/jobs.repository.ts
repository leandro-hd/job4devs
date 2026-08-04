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

export interface Job {
  id: number;
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
  proposalCount: number | null;
  interestedCount: number | null;
  avgProposalValue: number | null;
  avgDurationDays: number | null;
}

interface JobRow {
  id: number;
  source_id: number;
  external_id: string;
  title: string;
  url: string;
  description: string | null;
  budget_min: string | null;
  budget_max: string | null;
  budget_type: string;
  client_rating: string | null;
  client_reviews: number | null;
  location: string | null;
  raw_tags: string[] | null;
  published_at: Date | null;
  proposal_count: number | null;
  interested_count: number | null;
  avg_proposal_value: string | null;
  avg_duration_days: number | null;
}

function mapRow(row: JobRow): Job {
  return {
    id: row.id,
    sourceId: row.source_id,
    externalId: row.external_id,
    title: row.title,
    url: row.url,
    description: row.description,
    budgetMin: row.budget_min !== null ? Number(row.budget_min) : null,
    budgetMax: row.budget_max !== null ? Number(row.budget_max) : null,
    budgetType: row.budget_type,
    clientRating: row.client_rating !== null ? Number(row.client_rating) : null,
    clientReviews: row.client_reviews,
    location: row.location,
    rawTags: row.raw_tags ?? [],
    publishedAt: row.published_at,
    proposalCount: row.proposal_count,
    interestedCount: row.interested_count,
    avgProposalValue: row.avg_proposal_value !== null ? Number(row.avg_proposal_value) : null,
    avgDurationDays: row.avg_duration_days,
  };
}

export interface InsertedJob {
  id: number;
  url: string;
}

export async function insertMany(jobs: NewJob[]): Promise<InsertedJob[]> {
  if (jobs.length === 0) {
    return [];
  }

  const client = await pool.connect();
  const inserted: InsertedJob[] = [];
  try {
    await client.query('BEGIN');
    for (const job of jobs) {
      const result = await client.query<{ id: number; url: string }>(
        `INSERT INTO jobs (
           source_id, external_id, title, url, description,
           budget_min, budget_max, budget_type,
           client_rating, client_reviews, location, raw_tags, published_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (source_id, external_id) DO NOTHING
         RETURNING id, url`,
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
      if (result.rows[0]) {
        inserted.push(result.rows[0]);
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return inserted;
}

export async function updateJobDetail(
  id: number,
  detail: {
    proposalCount: number | null;
    interestedCount: number | null;
    avgProposalValue: number | null;
    avgDurationDays: number | null;
  }
): Promise<void> {
  await pool.query(
    `UPDATE jobs
     SET proposal_count = $2, interested_count = $3,
         avg_proposal_value = $4, avg_duration_days = $5
     WHERE id = $1`,
    [id, detail.proposalCount, detail.interestedCount, detail.avgProposalValue, detail.avgDurationDays]
  );
}

export async function countAll(): Promise<number> {
  const result = await pool.query<{ count: string }>(`SELECT count(*) FROM jobs`);
  return Number(result.rows[0]?.count ?? 0);
}

export interface JobWithSource extends Job {
  sourceName: string;
}

interface JobWithSourceRow extends JobRow {
  source_name: string;
}

function mapRowWithSource(row: JobWithSourceRow): JobWithSource {
  return {
    ...mapRow(row),
    sourceName: row.source_name,
  };
}

export async function findPaginated(
  page: number,
  limit: number
): Promise<{ jobs: JobWithSource[]; total: number }> {
  const offset = (page - 1) * limit;

  const [jobsResult, countResult] = await Promise.all([
    pool.query<JobWithSourceRow>(
      `SELECT j.id, j.source_id, j.external_id, j.title, j.url, j.description,
              j.budget_min, j.budget_max, j.budget_type,
              j.client_rating, j.client_reviews, j.location, j.raw_tags, j.published_at,
              j.proposal_count, j.interested_count,
              j.avg_proposal_value, j.avg_duration_days,
              s.name AS source_name
       FROM jobs j
       JOIN sources s ON s.id = j.source_id
       ORDER BY j.published_at DESC NULLS LAST
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query<{ count: string }>(`SELECT count(*) FROM jobs`),
  ]);

  return {
    jobs: jobsResult.rows.map(mapRowWithSource),
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function findUnnotifiedForUser(userId: number): Promise<Job[]> {
  const result = await pool.query<JobRow>(
    `SELECT j.id, j.source_id, j.external_id, j.title, j.url, j.description,
            j.budget_min, j.budget_max, j.budget_type,
            j.client_rating, j.client_reviews, j.location, j.raw_tags, j.published_at,
            j.proposal_count, j.interested_count,
            j.avg_proposal_value, j.avg_duration_days
     FROM jobs j
     WHERE j.scraped_at > NOW() - INTERVAL '1 hour'
       AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.job_id = j.id
             AND n.user_id = $1
       )`,
    [userId]
  );
  return result.rows.map(mapRow);
}
