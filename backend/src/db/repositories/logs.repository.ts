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
