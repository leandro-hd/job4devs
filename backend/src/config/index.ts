import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  resendApiKey: string;
  emailFrom: string;
  emailTransactionalFrom: string;
  frontendUrl: string;
  apiUrl: string;
  defaultCronIntervalMinutes: number;
  freelas99AuthId: string | null;
  freelas99AuthToken: string | null;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  resendApiKey: required('RESEND_API_KEY'),
  emailFrom: process.env.EMAIL_FROM ?? 'job4devs <alerts@job4devs.dev>',
  emailTransactionalFrom: process.env.EMAIL_TRANSACTIONAL_FROM ?? 'job4devs <noreply@job4devs.dev>',
  frontendUrl: process.env.FRONTEND_URL ?? '',
  apiUrl: process.env.API_URL ?? '',
  defaultCronIntervalMinutes: Number(process.env.DEFAULT_CRON_INTERVAL_MINUTES ?? 5),
  freelas99AuthId: process.env.FREELAS99_AUTH_ID ?? null,
  freelas99AuthToken: process.env.FREELAS99_AUTH_TOKEN ?? null,
};
