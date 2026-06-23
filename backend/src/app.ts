import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './api/routes/auth.routes';
import settingsRoutes from './api/routes/settings.routes';
import jobsRoutes from './api/routes/jobs.routes';
import statusRoutes from './api/routes/status.routes';
import { errorHandler } from './api/middlewares/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/status', statusRoutes);

  app.use(errorHandler);

  return app;
}
