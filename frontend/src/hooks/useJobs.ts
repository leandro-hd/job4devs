import { useCallback, useEffect, useState } from 'react';
import * as jobsService from '../services/jobs.service';
import type { JobListItem } from '../services/jobs.service';

const PAGE_SIZE = 20;

export function useJobs() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsService.getJobs(targetPage, PAGE_SIZE);
      setJobs(response.jobs);
      setTotal(response.total);
      setPage(response.page);
    } catch {
      setError('Não foi possível carregar as vagas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  return {
    jobs,
    total,
    page,
    pageSize: PAGE_SIZE,
    loading,
    error,
    goToPage: fetchJobs,
  };
}
