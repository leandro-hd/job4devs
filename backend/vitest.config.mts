import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/job4devs_test',
      JWT_SECRET: 'test-jwt-secret-for-testing-only-32chars!!',
      JWT_EXPIRES_IN: '1h',
      RESEND_API_KEY: 're_test_placeholder',
      EMAIL_FROM: 'test <test@example.com>',
      EMAIL_TRANSACTIONAL_FROM: 'noreply <noreply@example.com>',
      FRONTEND_URL: 'http://localhost:5173',
      API_URL: 'http://localhost:3000',
    },
  },
});
