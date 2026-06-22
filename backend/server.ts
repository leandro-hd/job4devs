import { createApp } from './src/app';
import { config } from './src/config';

const app = createApp();

app.listen(config.port, () => {
  console.log(`[server] Listening on port ${config.port}`);
});
