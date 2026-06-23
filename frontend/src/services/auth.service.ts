import { api } from './api';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
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
