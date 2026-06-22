import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middlewares/validateRequest';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authMiddleware, me);

export default router;
