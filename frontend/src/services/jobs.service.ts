import { api } from './api';

export interface JobListItem {
  id: number;
  title: string;
  url: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType: string;
  publishedAt: string | null;
  sourceName: string;
}

export interface JobsResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getJobs(page: number, limit: number): Promise<JobsResponse> {
  const { data } = await api.get<JobsResponse>('/api/jobs', { params: { page, limit } });
  return data;
}
