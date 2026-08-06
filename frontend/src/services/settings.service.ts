import { api } from './api';

export interface Settings {
  keywords?: string;
  exclude_keywords?: string;
  min_budget?: string;
  max_budget?: string;
  min_client_rating?: string;
  notification_email?: string;
}

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get<{ settings: Settings }>('/api/settings');
  return data.settings;
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const { data } = await api.put<{ settings: Settings }>('/api/settings', settings);
  return data.settings;
}
