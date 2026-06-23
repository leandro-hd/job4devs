import axios from 'axios';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`);
  }
  return config;
});
