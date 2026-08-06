import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, generateUnsubscribeToken, verifyUnsubscribeToken } from '../services/auth.service';

describe('signToken / verifyToken', () => {
  it('produces a token that verifies and returns the payload', () => {
    const token = signToken({ userId: 42 });
    const payload = verifyToken(token);
    expect(payload.userId).toBe(42);
  });

  it('throws on a tampered token', () => {
    const token = signToken({ userId: 1 });
    expect(() => verifyToken(token + 'x')).toThrow();
  });

  it('throws on a token signed with a different secret', () => {
    const fakeToken = require('jsonwebtoken').sign({ userId: 1 }, 'wrong-secret');
    expect(() => verifyToken(fakeToken)).toThrow();
  });
});

describe('generateUnsubscribeToken / verifyUnsubscribeToken', () => {
  it('round-trips the userId', () => {
    const token = generateUnsubscribeToken(7);
    expect(verifyUnsubscribeToken(token)).toBe(7);
  });

  it('returns null for a tampered token', () => {
    const token = generateUnsubscribeToken(1);
    expect(verifyUnsubscribeToken(token + 'x')).toBeNull();
  });

  it('returns null when a regular access token is used as unsubscribe token', () => {
    const accessToken = signToken({ userId: 1 });
    expect(verifyUnsubscribeToken(accessToken)).toBeNull();
  });
});
