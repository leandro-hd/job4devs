import { Router } from 'express';
import { getStatus } from '../controllers/status.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getStatus);

export default router;
