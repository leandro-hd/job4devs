import axios from 'axios';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const isRefreshEndpoint = (error.config?.url ?? '').includes('/api/auth/refresh');
    const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const isRetry = config?._retry === true;

    if (error.response?.status === 401 && !isRetry && !isRefreshEndpoint) {
      if (config) config._retry = true;
      try {
        const { data } = await api.post<{ token: string }>('/api/auth/refresh');
        setAuthToken(data.token);
        if (error.config) {
          error.config.headers['Authorization'] = `Bearer ${data.token}`;
          return api(error.config);
        }
      } catch {
        setAuthToken(null);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
