import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, reactivate, forgotPassword, resetPassword, unsubscribe, verifyEmail, resendVerification } from '../controllers/auth.controller';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateVerifyEmail } from '../middlewares/validateRequest';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
});

router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.get('/me', authMiddleware, me);
router.post('/reactivate', authMiddleware, reactivate);
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validateResetPassword, resetPassword);
router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, authMiddleware, resendVerification);
router.get('/unsubscribe', unsubscribe);

export default router;
