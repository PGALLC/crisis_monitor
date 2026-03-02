import request from 'supertest';
import { createApp } from '../../src/app';
import { fetchFredSeries } from '../../src/connectors/fred/fredApiClient';

jest.mock('../../src/connectors/fred/fredApiClient');

const mockFetchFredSeries = fetchFredSeries as jest.MockedFunction<typeof fetchFredSeries>;

const mockObservations = [
  { realtime_start: '', realtime_end: '', date: '2026-02-26', value: '4.02' },
  { realtime_start: '', realtime_end: '', date: '2026-02-25', value: '4.05' },
  { realtime_start: '', realtime_end: '', date: '2026-02-24', value: '4.04' },
];

beforeEach(() => {
  process.env.FRED_API_KEY = 'test-api-key';
  mockFetchFredSeries.mockResolvedValue({ observations: mockObservations });
});

afterEach(() => {
  delete process.env.FRED_API_KEY;
  jest.clearAllMocks();
});

describe('GET /api/health/fred', () => {
  it('returns 200 with version and DGS10 connectivity sample', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health/fred');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(response.body.fred.status).toBe('ok');
    expect(response.body.fred.sample.series).toBe('DGS10');
    expect(response.body.fred.sample.observations).toHaveLength(3);
    expect(response.body.fred.sample.observations[0]).toEqual({ date: '2026-02-26', value: 4.02 });
    expect(mockFetchFredSeries).toHaveBeenCalledWith('DGS10', 'test-api-key', { limit: 3 });
  });

  it('returns 503 with version when FRED_API_KEY is not set', async () => {
    delete process.env.FRED_API_KEY;
    const app = createApp();
    const response = await request(app).get('/api/health/fred');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(response.body.message).toMatch('FRED_API_KEY');
    expect(mockFetchFredSeries).not.toHaveBeenCalled();
  });

  it('returns 503 with version when the FRED API call fails', async () => {
    mockFetchFredSeries.mockRejectedValue(new Error('FRED API error: 400 Bad Request'));
    const app = createApp();
    const response = await request(app).get('/api/health/fred');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(response.body.message).toMatch('FRED API error');
  });
});
