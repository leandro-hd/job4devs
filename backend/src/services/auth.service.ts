import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import * as usersRepository from '../db/repositories/users.repository';

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: number;
  email: string;
  name: string;
}

export interface JwtPayload {
  userId: number;
}

function toPublicUser(user: usersRepository.User): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
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

  return { user: toPublicUser(user), token: signToken({ userId: user.id }) };
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
