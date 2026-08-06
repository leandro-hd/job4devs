import { describe, it, expect } from 'vitest';
import { parseKeywords, matchesKeywords, passesMinBudget, passesMaxBudget, passesMinClientRating } from '../services/filter.service';
import type { Job } from '../db/repositories/jobs.repository';

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    sourceId: 1,
    externalId: 'ext-1',
    title: 'React Developer',
    url: 'https://example.com',
    description: 'Build React apps',
    budgetMin: null,
    budgetMax: null,
    budgetType: 'unspecified',
    clientRating: null,
    clientReviews: null,
    location: null,
    rawTags: [],
    publishedAt: null,
    proposalCount: null,
    interestedCount: null,
    avgProposalValue: null,
    avgDurationDays: null,
    ...overrides,
  };
}

describe('parseKeywords', () => {
  it('splits comma-separated keywords into lowercase trimmed strings', () => {
    expect(parseKeywords('React, TypeScript, Node.js')).toEqual(['react', 'typescript', 'node.js']);
  });

  it('returns empty array for undefined', () => {
    expect(parseKeywords(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseKeywords('')).toEqual([]);
  });

  it('filters empty strings from consecutive commas', () => {
    expect(parseKeywords('react,,node')).toEqual(['react', 'node']);
  });
});

describe('matchesKeywords', () => {
  it('returns true when title contains a keyword', () => {
    expect(matchesKeywords(makeJob({ title: 'Senior React Developer' }), ['react'])).toBe(true);
  });

  it('returns true when description contains a keyword', () => {
    expect(matchesKeywords(makeJob({ description: 'Build with TypeScript' }), ['typescript'])).toBe(true);
  });

  it('returns true when rawTags contain a keyword', () => {
    expect(matchesKeywords(makeJob({ rawTags: ['vue', 'nuxt'] }), ['nuxt'])).toBe(true);
  });

  it('returns false when no keyword matches', () => {
    const job = makeJob({ title: 'Python Developer', description: 'Django REST', rawTags: ['python'] });
    expect(matchesKeywords(job, ['react', 'node'])).toBe(false);
  });

  it('returns false with empty keywords list', () => {
    expect(matchesKeywords(makeJob(), [])).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(matchesKeywords(makeJob({ title: 'REACT DEVELOPER' }), ['react'])).toBe(true);
  });

  it('matches partial keyword within a word', () => {
    expect(matchesKeywords(makeJob({ title: 'JavaScript Developer' }), ['java'])).toBe(true);
  });
});

describe('passesMinBudget', () => {
  it('passes when no min_budget is set', () => {
    expect(passesMinBudget(makeJob({ budgetMin: 100 }), null)).toBe(true);
  });

  it('passes when job has no budget data', () => {
    expect(passesMinBudget(makeJob({ budgetMin: null }), 500)).toBe(true);
  });

  it('passes when budget meets the minimum', () => {
    expect(passesMinBudget(makeJob({ budgetMin: 500 }), 500)).toBe(true);
  });

  it('fails when budget is below the minimum', () => {
    expect(passesMinBudget(makeJob({ budgetMin: 200 }), 500)).toBe(false);
  });
});

describe('passesMaxBudget', () => {
  it('passes when no max_budget is set', () => {
    expect(passesMaxBudget(makeJob({ budgetMax: 5000 }), null)).toBe(true);
  });

  it('passes when job has no budget data', () => {
    expect(passesMaxBudget(makeJob({ budgetMax: null }), 1000)).toBe(true);
  });

  it('passes when budget is within the maximum', () => {
    expect(passesMaxBudget(makeJob({ budgetMax: 1000 }), 1000)).toBe(true);
  });

  it('fails when budget exceeds the maximum', () => {
    expect(passesMaxBudget(makeJob({ budgetMax: 2000 }), 1000)).toBe(false);
  });
});

describe('passesMinClientRating', () => {
  it('passes when no min rating is set', () => {
    expect(passesMinClientRating(makeJob({ clientRating: 3 }), null)).toBe(true);
  });

  it('passes when client has no rating', () => {
    expect(passesMinClientRating(makeJob({ clientRating: null }), 4)).toBe(true);
  });

  it('passes when rating meets the minimum', () => {
    expect(passesMinClientRating(makeJob({ clientRating: 4.5 }), 4)).toBe(true);
  });

  it('fails when rating is below the minimum', () => {
    expect(passesMinClientRating(makeJob({ clientRating: 3.5 }), 4)).toBe(false);
  });
});
