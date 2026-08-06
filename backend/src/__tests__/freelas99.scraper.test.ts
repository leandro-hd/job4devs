import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import * as cheerio from 'cheerio';
import {
  parseTableCount,
  parseAvgProposalValue,
  parseAvgDurationDays,
} from '../services/scraper/sources/freelas99.scraper';

const fixturesDir = resolve(process.cwd(), 'src/__tests__/fixtures');
const detailHtml = readFileSync(join(fixturesDir, 'freelas99-detail.html'), 'utf-8');
const bidHtml = readFileSync(join(fixturesDir, 'freelas99-bid.html'), 'utf-8');

describe('parseTableCount', () => {
  it('returns proposal count from detail page HTML', () => {
    const $ = cheerio.load(detailHtml);
    expect(parseTableCount($, 'Propostas')).toBe(3);
  });

  it('returns interested count from detail page HTML', () => {
    const $ = cheerio.load(detailHtml);
    expect(parseTableCount($, 'Interessados')).toBe(15);
  });

  it('returns null when label is not found', () => {
    const $ = cheerio.load('<html><body></body></html>');
    expect(parseTableCount($, 'Propostas')).toBeNull();
  });
});

describe('parseAvgProposalValue', () => {
  it('parses Brazilian currency format (R$ 1.500,00) to 1500', () => {
    const text = cheerio.load(bidHtml)('div.generic.information').text();
    expect(parseAvgProposalValue(text)).toBe(1500);
  });

  it('returns null when pattern is absent', () => {
    expect(parseAvgProposalValue('nenhum conteúdo relevante')).toBeNull();
  });

  it('handles values without thousands separator', () => {
    expect(parseAvgProposalValue('Valor médio das propostas: R$ 500,00')).toBe(500);
  });
});

describe('parseAvgDurationDays', () => {
  it('parses duration days from bid page HTML', () => {
    const text = cheerio.load(bidHtml)('div.generic.information').text();
    expect(parseAvgDurationDays(text)).toBe(30);
  });

  it('returns null when pattern is absent', () => {
    expect(parseAvgDurationDays('nenhum conteúdo relevante')).toBeNull();
  });
});
