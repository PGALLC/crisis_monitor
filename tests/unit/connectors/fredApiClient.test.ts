import { fetchFredSeries, FredApiError } from '../../../src/connectors/fred/fredApiClient';

const MOCK_RESPONSE = {
  observations: [
    { realtime_start: '2024-01-01', realtime_end: '2024-01-01', date: '2024-01-01', value: '4.50' },
    { realtime_start: '2024-01-02', realtime_end: '2024-01-02', date: '2024-01-02', value: '4.55' },
  ],
};

function mockFetch(response: object, status = 200): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 429 ? 'Too Many Requests' : 'OK',
    json: () => Promise.resolve(response),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchFredSeries()', () => {
  it('fetches and returns series observations on success', async () => {
    mockFetch(MOCK_RESPONSE);
    const result = await fetchFredSeries('DGS10', 'test-key');
    expect(result.observations).toHaveLength(2);
    expect(result.observations[0].value).toBe('4.50');
  });

  it('constructs the request URL with correct query params', async () => {
    mockFetch(MOCK_RESPONSE);
    await fetchFredSeries('DGS10', 'test-key', { limit: 5 });

    const calledUrl = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('series_id')).toBe('DGS10');
    expect(calledUrl.searchParams.get('api_key')).toBe('test-key');
    expect(calledUrl.searchParams.get('file_type')).toBe('json');
    expect(calledUrl.searchParams.get('limit')).toBe('5');
  });

  it('includes observation_start when provided', async () => {
    mockFetch(MOCK_RESPONSE);
    await fetchFredSeries('DGS10', 'test-key', { observationStart: '2024-01-01' });

    const calledUrl = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('observation_start')).toBe('2024-01-01');
  });

  it('throws FredApiError on non-retryable HTTP errors', async () => {
    mockFetch({}, 401);
    await expect(fetchFredSeries('DGS10', 'test-key')).rejects.toThrow(FredApiError);
    await expect(fetchFredSeries('DGS10', 'test-key')).rejects.toThrow('401');
  });

  it('retries on 429 and throws FredApiError after exhausting retries', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(
      fetchFredSeries('DGS10', 'test-key', { maxRetries: 2, baseRetryDelayMs: 0 }),
    ).rejects.toThrow('rate limit exceeded after retries');

    // Called on first attempt + 2 retries = 3 total
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
