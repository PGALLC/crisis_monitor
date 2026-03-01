import request from 'supertest';
import { createApp } from '../../src/app';
import * as fredConnector from '../../src/connectors/fred/fredConnector';

jest.mock('../../src/connectors/fred/fredConnector');

const mockYieldCurve = [{ date: '2024-01-01', value: 4.50, indicatorType: 'YIELD_10Y' }];
const mockSpreads   = [{ date: '2024-01-01', value: 3.25, indicatorType: 'HY_CREDIT_SPREAD' }];
const mockUnemp     = [{ date: '2024-01-01', value: 3.7,  indicatorType: 'UNEMPLOYMENT_U3' }];
const mockPmi       = [{ date: '2024-01-01', value: 49.1, indicatorType: 'PMI_MANUFACTURING' }];

beforeEach(() => {
  (fredConnector.fetchYieldCurveData  as jest.Mock).mockResolvedValue(mockYieldCurve);
  (fredConnector.fetchCreditSpreadsData as jest.Mock).mockResolvedValue(mockSpreads);
  (fredConnector.fetchUnemploymentData as jest.Mock).mockResolvedValue(mockUnemp);
  (fredConnector.fetchPMIData          as jest.Mock).mockResolvedValue(mockPmi);
});

afterEach(() => jest.clearAllMocks());

describe('GET /api/health/fred', () => {
  it('returns 200 with normalized indicator data from all four connectors', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health/fred');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.indicators.yieldCurve).toEqual(mockYieldCurve);
    expect(response.body.indicators.creditSpreads).toEqual(mockSpreads);
    expect(response.body.indicators.unemployment).toEqual(mockUnemp);
    expect(response.body.indicators.pmi).toEqual(mockPmi);
  });

  it('returns 503 with an error message when a connector fails', async () => {
    (fredConnector.fetchYieldCurveData as jest.Mock).mockRejectedValue(
      new Error('FRED_API_KEY environment variable is not set'),
    );

    const app = createApp();
    const response = await request(app).get('/api/health/fred');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch('FRED_API_KEY');
  });
});
