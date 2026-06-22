import { pool } from '../index';

export interface NewNotification {
  userId: number;
  jobId: number;
  recipient: string;
}

export async function insertPendingMany(notifications: NewNotification[]): Promise<number> {
  if (notifications.length === 0) {
    return 0;
  }

  const client = await pool.connect();
  let insertedCount = 0;
  try {
    await client.query('BEGIN');
    for (const notification of notifications) {
      const result = await client.query(
        `INSERT INTO notifications (user_id, job_id, channel, recipient)
         VALUES ($1, $2, 'email', $3)
         ON CONFLICT (user_id, job_id) DO NOTHING`,
        [notification.userId, notification.jobId, notification.recipient]
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

export interface PendingNotification {
  id: number;
  recipient: string;
  jobTitle: string;
  jobUrl: string;
  publishedAt: Date | null;
}

interface PendingNotificationRow {
  id: number;
  recipient: string;
  title: string;
  url: string;
  published_at: Date | null;
}

export async function findPendingForUser(userId: number): Promise<PendingNotification[]> {
  const result = await pool.query<PendingNotificationRow>(
    `SELECT n.id, n.recipient, j.title, j.url, j.published_at
     FROM notifications n
     JOIN jobs j ON j.id = n.job_id
     WHERE n.user_id = $1
       AND n.status = 'pending'`,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    recipient: row.recipient,
    jobTitle: row.title,
    jobUrl: row.url,
    publishedAt: row.published_at,
  }));
}

export async function markSent(ids: number[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  await pool.query(`UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = ANY($1)`, [ids]);
}

export async function markFailed(ids: number[], errorMessage: string): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  await pool.query(
    `UPDATE notifications SET status = 'failed', error_message = $2 WHERE id = ANY($1)`,
    [ids, errorMessage]
  );
}
