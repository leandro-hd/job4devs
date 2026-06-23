import { pool } from '../index';

export async function getByUserId(userId: number): Promise<Map<string, string>> {
  const result = await pool.query<{ key: string; value: string }>(
    `SELECT key, value FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  return new Map(result.rows.map((row) => [row.key, row.value]));
}

export async function upsert(userId: number, key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_settings (user_id, key, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [userId, key, value]
  );
}

export async function remove(userId: number, key: string): Promise<void> {
  await pool.query(`DELETE FROM user_settings WHERE user_id = $1 AND key = $2`, [userId, key]);
}
