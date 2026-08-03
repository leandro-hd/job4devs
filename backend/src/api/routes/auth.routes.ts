import { Router } from 'express';
import { register, login, me, reactivate, forgotPassword, resetPassword, unsubscribe } from '../controllers/auth.controller';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } from '../middlewares/validateRequest';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authMiddleware, me);
router.post('/reactivate', authMiddleware, reactivate);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/unsubscribe', unsubscribe);

export default router;
