import { api } from './api';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  active: boolean;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function register(params: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', params);
  return data;
}

export async function login(params: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', params);
  return data;
}

export async function me(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>('/api/auth/me');
  return data.user;
}

export async function reactivate(): Promise<AuthUser> {
  const { data } = await api.post<{ user: AuthUser }>('/api/auth/reactivate');
  return data.user;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/api/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/api/auth/verify-email', { token });
}

export async function resendVerification(): Promise<void> {
  await api.post('/api/auth/resend-verification');
}

export async function refresh(): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post<{ token: string; user: AuthUser }>('/api/auth/refresh');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}
