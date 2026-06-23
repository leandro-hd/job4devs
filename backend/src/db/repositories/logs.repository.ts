import { pool } from '../index';

export interface NewAlertLog {
  sourceId: number;
  jobsFound: number;
  jobsNew: number;
  jobsNotified: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string | null;
  durationMs?: number | null;
}

export async function insert(log: NewAlertLog): Promise<void> {
  await pool.query(
    `INSERT INTO alert_logs (source_id, jobs_found, jobs_new, jobs_notified, status, error_message, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      log.sourceId,
      log.jobsFound,
      log.jobsNew,
      log.jobsNotified,
      log.status,
      log.errorMessage ?? null,
      log.durationMs ?? null,
    ]
  );
}

export interface AlertLog {
  id: number;
  sourceId: number | null;
  executedAt: Date;
  jobsFound: number;
  jobsNew: number;
  jobsNotified: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage: string | null;
  durationMs: number | null;
}

interface AlertLogRow {
  id: number;
  source_id: number | null;
  executed_at: Date;
  jobs_found: number;
  jobs_new: number;
  jobs_notified: number;
  status: 'success' | 'partial' | 'failed';
  error_message: string | null;
  duration_ms: number | null;
}

export async function findLatest(): Promise<AlertLog | null> {
  const result = await pool.query<AlertLogRow>(
    `SELECT id, source_id, executed_at, jobs_found, jobs_new, jobs_notified, status, error_message, duration_ms
     FROM alert_logs
     ORDER BY executed_at DESC
     LIMIT 1`
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    sourceId: row.source_id,
    executedAt: row.executed_at,
    jobsFound: row.jobs_found,
    jobsNew: row.jobs_new,
    jobsNotified: row.jobs_notified,
    status: row.status,
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
  };
}
