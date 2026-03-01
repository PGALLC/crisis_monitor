import type { FredSeriesResponse, FetchOptions } from './types';

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

export class FredApiError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'FredApiError';
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  options: FetchOptions = {},
): Promise<FredSeriesResponse> {
  const {
    observationStart,
    limit = 10,
    maxRetries = 3,
    baseRetryDelayMs = 1000,
  } = options;

  const url = new URL(`${FRED_BASE_URL}/series/observations`);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', String(limit));
  if (observationStart) {
    url.searchParams.set('observation_start', observationStart);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url.toString());

    if (response.status === 429) {
      if (attempt < maxRetries) {
        await delay(baseRetryDelayMs * 2 ** attempt);
        continue;
      }
      throw new FredApiError('FRED API rate limit exceeded after retries', 429);
    }

    if (!response.ok) {
      throw new FredApiError(
        `FRED API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return response.json() as Promise<FredSeriesResponse>;
  }

  throw new FredApiError('FRED API request failed after maximum retries');
}
