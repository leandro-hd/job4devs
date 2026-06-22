import axios from 'axios';
import * as cheerio from 'cheerio';

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

function parseClientReviews(text: string): number {
  const match = text.match(/(\d+)/);
  return match?.[1] ? Number(match[1]) : 0;
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
