import { createApp } from './src/app';
import { config } from './src/config';
import { startScheduler } from './src/worker/scheduler';
import { logger } from './src/lib/logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server listening');
});

startScheduler();
