import { createHash } from 'crypto';
import { pool } from '../index';

const TTL_DAYS = 30;

function hash(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function create(userId: number, rawToken: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hash(rawToken), expiresAt]
  );
}

export async function findValidByToken(rawToken: string): Promise<{ userId: number } | null> {
  const result = await pool.query<{ user_id: number }>(
    `SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
    [hash(rawToken)]
  );
  const row = result.rows[0];
  return row ? { userId: row.user_id } : null;
}

export async function deleteByToken(rawToken: string): Promise<void> {
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [hash(rawToken)]);
}

export async function deleteAllForUser(userId: number): Promise<void> {
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
}
