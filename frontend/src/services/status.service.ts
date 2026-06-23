import { api } from './api';

export interface AlertLog {
  id: number;
  executedAt: string;
  jobsFound: number;
  jobsNew: number;
  jobsNotified: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage: string | null;
}

export interface SystemStatus {
  lastCycle: AlertLog | null;
  totalJobs: number;
  totalNotificationsSent: number;
}

export async function getStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>('/api/status');
  return data;
}
