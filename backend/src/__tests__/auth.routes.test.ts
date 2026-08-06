import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../app';
import { pool } from '../db/index';
import { runMigrations } from '../db/migrate';

vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null });
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
    },
  };
});

const hasTestDb = !!process.env.TEST_DATABASE_URL;
const request = supertest(createApp());

async function insertVerifiedUser(email: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, true)`,
    [email, hash, 'Test User'],
  );
}

describe.skipIf(!hasTestDb)('Auth routes (integration)', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterEach(async () => {
    await pool.query('TRUNCATE users CASCADE');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 and the new user', async () => {
      const res = await request.post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('new@example.com');
      expect(res.body.token).toBeTruthy();
    });

    it('returns 409 for a duplicate email', async () => {
      const body = { email: 'dup@example.com', password: 'password123', name: 'Dup' };
      await request.post('/api/auth/register').send(body);
      const res = await request.post('/api/auth/register').send(body);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200, an access token, and sets the refresh cookie', async () => {
      await insertVerifiedUser('login@example.com', 'password123');
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe('login@example.com');
      const cookies = res.headers['set-cookie'] as string[] | string;
      const cookieList = Array.isArray(cookies) ? cookies : [cookies];
      expect(cookieList.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('returns 401 for wrong password', async () => {
      await insertVerifiedUser('wrong@example.com', 'correct-pass');
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong-pass' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 401 when no refresh cookie is provided', async () => {
      const res = await request.post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('returns 200 with a new access token when cookie is valid', async () => {
      await insertVerifiedUser('refresh@example.com', 'password123');
      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: 'refresh@example.com', password: 'password123' });

      const cookies = loginRes.headers['set-cookie'] as string[] | string;
      const cookieList = Array.isArray(cookies) ? cookies : [cookies];

      const res = await request
        .post('/api/auth/refresh')
        .set('Cookie', cookieList);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe('refresh@example.com');
    });
  });
});
