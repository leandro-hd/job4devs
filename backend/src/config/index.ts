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
  frontendUrl: string;
  apiUrl: string;
  defaultCronIntervalMinutes: number;
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
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  resendApiKey: required('RESEND_API_KEY'),
  emailFrom: process.env.EMAIL_FROM ?? 'job4devs <alerts@job4devs.dev>',
  frontendUrl: process.env.FRONTEND_URL ?? '',
  apiUrl: process.env.API_URL ?? '',
  defaultCronIntervalMinutes: Number(process.env.DEFAULT_CRON_INTERVAL_MINUTES ?? 5),
};
