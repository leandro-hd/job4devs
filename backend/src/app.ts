import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './api/routes/auth.routes';
import { errorHandler } from './api/middlewares/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);

  app.use(errorHandler);

  return app;
}
