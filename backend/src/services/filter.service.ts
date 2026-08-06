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

// For all numeric filters: if the job has no data for the field, the job passes (include it).
// This avoids silently discarding jobs whose data the scraper couldn't retrieve.

export function passesMinBudget(job: Job, minBudget: number | null): boolean {
  if (minBudget === null || job.budgetMin === null) return true;
  return job.budgetMin >= minBudget;
}

export function passesMaxBudget(job: Job, maxBudget: number | null): boolean {
  if (maxBudget === null || job.budgetMax === null) return true;
  return job.budgetMax <= maxBudget;
}

export function passesMinClientRating(job: Job, minRating: number | null): boolean {
  if (minRating === null || job.clientRating === null) return true;
  return job.clientRating >= minRating;
}
