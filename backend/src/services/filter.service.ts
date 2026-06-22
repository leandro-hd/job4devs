import type { Job } from '../db/repositories/jobs.repository';

export function parseKeywords(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter((keyword) => keyword.length > 0);
}

export function matchesKeywords(job: Job, keywords: string[]): boolean {
  if (keywords.length === 0) {
    return false;
  }

  const haystack = [job.title, job.description ?? '', ...job.rawTags].join(' ').toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}
