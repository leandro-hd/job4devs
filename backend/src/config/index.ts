import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
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
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
  frontendUrl: process.env.FRONTEND_URL ?? '',
  apiUrl: process.env.API_URL ?? '',
  defaultCronIntervalMinutes: Number(process.env.DEFAULT_CRON_INTERVAL_MINUTES ?? 5),
};
