import { Router } from 'express';
import { listJobs } from '../controllers/jobs.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listJobs);

export default router;
