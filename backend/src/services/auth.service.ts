import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '../config';
import * as usersRepository from '../db/repositories/users.repository';
import * as refreshTokensRepository from '../db/repositories/refresh_tokens.repository';
import * as notificationService from './notification.service';

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  active: boolean;
  emailVerified: boolean;
}

export interface JwtPayload {
  userId: number;
}

function toPublicUser(user: usersRepository.User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, active: user.active, emailVerified: user.emailVerified };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ user: PublicUser; token: string } | null> {
  const existing = await usersRepository.findByEmail(params.email);
  if (existing) {
    return null;
  }

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const user = await usersRepository.createUser({
    email: params.email,
    passwordHash,
    name: params.name,
  });

  await sendVerificationEmail(user.id, user.email);

  return { user: toPublicUser(user), token: signToken({ userId: user.id }) };
}

export async function sendVerificationEmail(userId: number, email: string): Promise<void> {
  const token = randomBytes(32).toString('hex');
  await usersRepository.saveVerificationToken(userId, token);
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  await notificationService.sendVerificationEmail(email, verificationUrl);
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const user = await usersRepository.findByVerificationToken(token);
  if (!user) return false;
  await usersRepository.markEmailVerified(user.id);
  return true;
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string } | null> {
  const user = await usersRepository.findByEmail(params.email);
  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(params.password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  return { user: toPublicUser(user), token: signToken({ userId: user.id }) };
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const user = await usersRepository.findById(id);
  return user ? toPublicUser(user) : null;
}

export async function reactivateUser(userId: number): Promise<void> {
  await usersRepository.reactivateUser(userId);
}

export function generateUnsubscribeToken(userId: number): string {
  return jwt.sign({ userId, purpose: 'unsubscribe' }, config.jwtSecret);
}

export function verifyUnsubscribeToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: number; purpose: string };
    if (payload.purpose !== 'unsubscribe') return null;
    return payload.userId;
  } catch {
    return null;
  }
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await usersRepository.findByEmail(email);
  // Always resolve silently — don't reveal whether the email is registered.
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await usersRepository.saveResetToken(user.id, token, expiresAt);

  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  await notificationService.sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const user = await usersRepository.findByResetToken(token);
  if (!user) return false;

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await usersRepository.updatePassword(user.id, passwordHash);
  return true;
}

export async function createRefreshToken(userId: number): Promise<string> {
  const rawToken = randomBytes(64).toString('hex');
  await refreshTokensRepository.create(userId, rawToken);
  return rawToken;
}

export async function refreshAccessToken(rawToken: string): Promise<{
  accessToken: string;
  newRefreshToken: string;
  user: PublicUser;
} | null> {
  const record = await refreshTokensRepository.findValidByToken(rawToken);
  if (!record) return null;

  const user = await usersRepository.findById(record.userId);
  if (!user || !user.active) return null;

  await refreshTokensRepository.deleteByToken(rawToken);
  const newRefreshToken = await createRefreshToken(record.userId);
  const accessToken = signToken({ userId: record.userId });

  return { accessToken, newRefreshToken, user: toPublicUser(user) };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await refreshTokensRepository.deleteByToken(rawToken);
}
