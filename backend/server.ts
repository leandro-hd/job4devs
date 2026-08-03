import { createApp } from './src/app';
import { config } from './src/config';
import { startScheduler } from './src/worker/scheduler';
import { logger } from './src/lib/logger';
import { runMigrations } from './src/db/migrate';

async function start(): Promise<void> {
  await runMigrations();

  const app = createApp();
  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Server listening');
  });

  startScheduler();
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
