import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../../../config';

export class Freelas99AuthExpiredError extends Error {
  constructor() {
    super('99freelas auth cookies expired — update FREELAS99_AUTH_ID and FREELAS99_AUTH_TOKEN in Railway');
    this.name = 'Freelas99AuthExpiredError';
  }
}

const BASE_URL = 'https://www.99freelas.com.br';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: 'https://www.99freelas.com.br',
};

export interface ScrapedJob {
  externalId: string;
  title: string;
  url: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType: string;
  clientRating: number | null;
  clientReviews: number | null;
  location: string | null;
  rawTags: string[];
  publishedAt: Date | null;
}

export interface JobDetail {
  proposalCount: number | null;
  interestedCount: number | null;
  avgProposalValue: number | null;
  avgDurationDays: number | null;
}

function parseClientReviews(text: string): number {
  const match = text.match(/(\d+)/);
  return match?.[1] ? Number(match[1]) : 0;
}

function parseTableCount($: cheerio.CheerioAPI, label: string): number | null {
  const th = $('th').filter((_, el) => $(el).text().trim().startsWith(label));
  const value = th.next('td').text().trim();
  return value ? Number(value) : null;
}

function parseAvgProposalValue(text: string): number | null {
  const match = text.match(/Valor\s+m[eé]dio\s+das\s+propostas:\s*R\$[\s ]*([\d.,]+)/i);
  if (!match?.[1]) return null;
  return Number(match[1].replace(/\./g, '').replace(',', '.'));
}

function parseAvgDurationDays(text: string): number | null {
  const match = text.match(/Dura[cç][aã]o\s+m[eé]dia\s+estimada:\s*(\d+)/i);
  return match?.[1] ? Number(match[1]) : null;
}

export async function fetchPage(page: number): Promise<ScrapedJob[]> {
  const response = await axios.get<string>(`${BASE_URL}/projects`, {
    params: { page },
    headers: HEADERS,
    timeout: 10000,
  });

  const $ = cheerio.load(response.data);
  const jobs: ScrapedJob[] = [];

  $('ul.result-list li.result-item').each((_, element) => {
    const card = $(element);

    const externalId = card.attr('data-id');
    if (!externalId) {
      return;
    }

    const titleLink = card.find('h1.title a').first();
    const title = titleLink.text().trim();
    const href = titleLink.attr('href') ?? '';
    const path = href.split('?')[0] ?? '';
    const url = path ? new URL(path, BASE_URL).toString() : '';

    const descriptionRaw = card.find('div.description').attr('data-content') ?? null;
    const description = descriptionRaw ? descriptionRaw.replace(/<br\s*\/?>/gi, '\n').trim() : null;

    const rawTags = card
      .find('p.habilidades a.habilidade')
      .map((_i, tag) => $(tag).text().trim())
      .get();

    const datetimeAttr = card.find('b.datetime').attr('cp-datetime');
    const publishedAt = datetimeAttr ? new Date(Number(datetimeAttr)) : null;

    const ratingAttr = card.find('span.avaliacoes-star').attr('data-score');
    const clientRating = ratingAttr ? Number(ratingAttr) : null;

    const clientReviews = parseClientReviews(card.find('span.avaliacoes-text').text());

    jobs.push({
      externalId,
      title,
      url,
      description,
      budgetMin: null,
      budgetMax: null,
      budgetType: 'unspecified',
      clientRating,
      clientReviews,
      location: null,
      rawTags,
      publishedAt,
    });
  });

  return jobs;
}

export async function fetchJobDetail(jobUrl: string): Promise<JobDetail> {
  // Public detail page — proposal and interested counts (no auth required)
  const detailResponse = await axios.get<string>(jobUrl, { headers: HEADERS, timeout: 10000 });
  const $detail = cheerio.load(detailResponse.data);
  const proposalCount = parseTableCount($detail, 'Propostas');
  const interestedCount = parseTableCount($detail, 'Interessados');

  // Bid page — avg proposal value and duration (auth required)
  let avgProposalValue: number | null = null;
  let avgDurationDays: number | null = null;

  if (config.freelas99AuthId && config.freelas99AuthToken) {
    try {
      const bidUrl = jobUrl.replace('/project/', '/project/bid/');
      const cookieHeader = `kmlicin=${config.freelas99AuthId}; kmlicn=${config.freelas99AuthToken}`;
      const bidResponse = await axios.get<string>(bidUrl, {
        headers: { ...HEADERS, Cookie: cookieHeader },
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: (status) => status === 200,
      });
      const $bid = cheerio.load(bidResponse.data);
      const text = $bid('div.generic.information').text();
      avgProposalValue = parseAvgProposalValue(text);
      avgDurationDays = parseAvgDurationDays(text);
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 301 || err.response?.status === 302)) {
        throw new Freelas99AuthExpiredError();
      }
      // other errors (network, timeout) — avg fields stay null, continue
    }
  }

  return { proposalCount, interestedCount, avgProposalValue, avgDurationDays };
}
