import { pool } from '../index';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  active: boolean;
  createdAt: Date;
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  active: boolean;
  created_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<User> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash, name, active, created_at`,
    [params.email, params.passwordHash, params.name]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create user');
  }
  return mapRow(row);
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, active, created_at FROM users WHERE email = $1`,
    [email]
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function findById(id: number): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, active, created_at FROM users WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function findAllActive(): Promise<User[]> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, active, created_at FROM users WHERE active = true`
  );
  return result.rows.map(mapRow);
}

export async function deactivateUser(userId: number): Promise<void> {
  await pool.query(`UPDATE users SET active = false WHERE id = $1`, [userId]);
}

export async function saveResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  await pool.query(
    `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3`,
    [token, expiresAt, userId]
  );
}

export async function findByResetToken(token: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, name, active, created_at
     FROM users
     WHERE reset_token = $1 AND reset_token_expires_at > NOW()`,
    [token]
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function updatePassword(userId: number, passwordHash: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL
     WHERE id = $2`,
    [passwordHash, userId]
  );
}
