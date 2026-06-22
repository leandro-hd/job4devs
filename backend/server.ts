import { createApp } from './src/app';
import { config } from './src/config';
import { startScheduler } from './src/worker/scheduler';

const app = createApp();

app.listen(config.port, () => {
  console.log(`[server] Listening on port ${config.port}`);
});

startScheduler();
