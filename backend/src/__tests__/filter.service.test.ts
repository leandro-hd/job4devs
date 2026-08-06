import { describe, it, expect } from 'vitest';
import { parseKeywords, matchesKeywords } from '../services/filter.service';
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
