import { Request, Response, CookieOptions } from 'express';
import * as authService from '../../services/auth.service';
import * as usersRepository from '../../db/repositories/users.repository';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { logger } from '../../lib/logger';
import { config } from '../../config';

const REFRESH_COOKIE = 'refresh_token';

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  const result = await authService.registerUser({ email, password, name });
  if (!result) {
    logger.warn({ email }, 'Registration attempt with email already in use');
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  logger.info({ userId: result.user.id, email }, 'User registered');
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const result = await authService.loginUser({ email, password });
  if (!result) {
    logger.warn({ email }, 'Failed login attempt');
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const refreshToken = await authService.createRefreshToken(result.user.id);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  logger.info({ userId: result.user.id, email }, 'User logged in');
  res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawToken = (req.cookies as Record<string, string>)[REFRESH_COOKIE];
  if (!rawToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const result = await authService.refreshAccessToken(rawToken);
  if (!result) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  res.cookie(REFRESH_COOKIE, result.newRefreshToken, refreshCookieOptions());
  res.json({ token: result.accessToken, user: result.user });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawToken = (req.cookies as Record<string, string>)[REFRESH_COOKIE];
  if (rawToken) {
    await authService.revokeRefreshToken(rawToken);
  }
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  res.json({ message: 'Logged out' });
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await authService.getUserById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
}

export async function reactivate(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await authService.reactivateUser(req.userId);
  const user = await authService.getUserById(req.userId);
  res.json({ user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  await authService.requestPasswordReset(email);
  // Always 200 — don't reveal whether the email is registered.
  res.json({ message: 'If this email is registered, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string };
  const ok = await authService.resetPassword(token, password);
  if (!ok) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }
  res.json({ message: 'Password updated successfully' });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  const ok = await authService.verifyEmailToken(token);
  if (!ok) {
    res.status(400).json({ error: 'Invalid or already used verification token' });
    return;
  }
  res.json({ message: 'Email verified successfully' });
}

export async function resendVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await authService.getUserById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.emailVerified) {
    res.status(400).json({ error: 'Email is already verified' });
    return;
  }
  await authService.sendVerificationEmail(user.id, user.email);
  res.json({ message: 'Verification email sent' });
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const token = req.query['token'];
  const userId = typeof token === 'string' ? authService.verifyUnsubscribeToken(token) : null;

  const page = (title: string, body: string) => `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${title} — job4devs</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f4f7}
.card{background:#fff;border-radius:12px;padding:40px;max-width:400px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,.08)}</style></head>
<body><div class="card">${body}</div></body></html>`;

  if (!userId) {
    res.status(400).send(page('Link inválido', '<h2>Link inválido</h2><p>Este link de cancelamento é inválido ou foi adulterado.</p>'));
    return;
  }

  await usersRepository.deactivateUser(userId);
  res.send(page('Cancelado', '<h2>Cancelamento confirmado</h2><p>Você não receberá mais alertas de vagas. Para reativar, acesse as configurações da sua conta.</p>'));
}
