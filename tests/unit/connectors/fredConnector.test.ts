import {
  fetchYieldCurveData,
  fetchCreditSpreadsData,
  fetchUnemploymentData,
  fetchPMIData,
} from '../../../src/connectors/fred/fredConnector';
import { fetchFredSeries } from '../../../src/connectors/fred/fredApiClient';

jest.mock('../../../src/connectors/fred/fredApiClient');

const mockFetchFredSeries = fetchFredSeries as jest.MockedFunction<typeof fetchFredSeries>;

beforeEach(() => {
  process.env.FRED_API_KEY = 'test-api-key';
});

afterEach(() => {
  delete process.env.FRED_API_KEY;
  jest.clearAllMocks();
});

describe('fetchYieldCurveData()', () => {
  it('fetches both DGS10 and DGS2 by default', async () => {
    mockFetchFredSeries.mockResolvedValue({ observations: [] });

    await fetchYieldCurveData();

    expect(mockFetchFredSeries).toHaveBeenCalledTimes(2);
    expect(mockFetchFredSeries).toHaveBeenCalledWith('DGS10', 'test-api-key');
    expect(mockFetchFredSeries).toHaveBeenCalledWith('DGS2', 'test-api-key');
  });

  it('normalizes raw observations into the standard internal format', async () => {
    mockFetchFredSeries.mockResolvedValue({
      observations: [
        { realtime_start: '', realtime_end: '', date: '2024-01-01', value: '4.50' },
        { realtime_start: '', realtime_end: '', date: '2024-01-02', value: '4.55' },
      ],
    });

    const result = await fetchYieldCurveData([{ seriesId: 'DGS10', indicatorType: 'YIELD_10Y' }]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2024-01-01', value: 4.5, indicatorType: 'YIELD_10Y' });
    expect(result[1]).toEqual({ date: '2024-01-02', value: 4.55, indicatorType: 'YIELD_10Y' });
  });

  it('filters out missing FRED observations (value = ".")', async () => {
    mockFetchFredSeries.mockResolvedValue({
      observations: [
        { realtime_start: '', realtime_end: '', date: '2024-01-01', value: '4.50' },
        { realtime_start: '', realtime_end: '', date: '2024-01-02', value: '.' },
        { realtime_start: '', realtime_end: '', date: '2024-01-03', value: '4.60' },
      ],
    });

    const result = await fetchYieldCurveData([{ seriesId: 'DGS10', indicatorType: 'YIELD_10Y' }]);

    expect(result).toHaveLength(2);
    expect(result.every(obs => obs.value !== null)).toBe(true);
  });

  it('accepts a custom indicator config without code changes to the connector', async () => {
    mockFetchFredSeries.mockResolvedValue({
      observations: [{ realtime_start: '', realtime_end: '', date: '2024-01-01', value: '1.23' }],
    });

    const customConfig = [{ seriesId: 'CUSTOM_SERIES', indicatorType: 'CUSTOM_TYPE' }];
    const result = await fetchYieldCurveData(customConfig);

    expect(mockFetchFredSeries).toHaveBeenCalledWith('CUSTOM_SERIES', 'test-api-key');
    expect(result[0].indicatorType).toBe('CUSTOM_TYPE');
  });

  it('combines observations from multiple series into a flat array', async () => {
    mockFetchFredSeries
      .mockResolvedValueOnce({
        observations: [{ realtime_start: '', realtime_end: '', date: '2024-01-01', value: '4.50' }],
      })
      .mockResolvedValueOnce({
        observations: [{ realtime_start: '', realtime_end: '', date: '2024-01-01', value: '4.80' }],
      });

    const result = await fetchYieldCurveData();

    expect(result).toHaveLength(2);
    expect(result[0].indicatorType).toBe('YIELD_10Y');
    expect(result[1].indicatorType).toBe('YIELD_2Y');
  });

  it('throws if FRED_API_KEY environment variable is not set', async () => {
    delete process.env.FRED_API_KEY;

    await expect(fetchYieldCurveData()).rejects.toThrow('FRED_API_KEY environment variable is not set');
    expect(mockFetchFredSeries).not.toHaveBeenCalled();
  });

  it('trims whitespace from FRED_API_KEY before use (guards against K8s secret trailing newline)', async () => {
    process.env.FRED_API_KEY = '  test-api-key\n';
    mockFetchFredSeries.mockResolvedValue({ observations: [] });

    await fetchYieldCurveData();

    expect(mockFetchFredSeries).toHaveBeenCalledWith('DGS10', 'test-api-key');
    expect(mockFetchFredSeries).toHaveBeenCalledWith('DGS2', 'test-api-key');
  });
});

// STORY-001b
describe('fetchCreditSpreadsData()', () => {
  it('fetches BAMLH0A0HYM2 as HY_CREDIT_SPREAD by default', async () => {
    mockFetchFredSeries.mockResolvedValue({ observations: [] });
    await fetchCreditSpreadsData();
    expect(mockFetchFredSeries).toHaveBeenCalledWith('BAMLH0A0HYM2', 'test-api-key');
  });

  it('filters missing data days (weekends/holidays reported as ".")', async () => {
    mockFetchFredSeries.mockResolvedValue({
      observations: [
        { realtime_start: '', realtime_end: '', date: '2024-01-05', value: '3.25' },
        { realtime_start: '', realtime_end: '', date: '2024-01-06', value: '.' }, // weekend
        { realtime_start: '', realtime_end: '', date: '2024-01-07', value: '.' }, // weekend
        { realtime_start: '', realtime_end: '', date: '2024-01-08', value: '3.28' },
      ],
    });

    const result = await fetchCreditSpreadsData();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2024-01-05', value: 3.25, indicatorType: 'HY_CREDIT_SPREAD' });
  });
});

// STORY-001c
describe('fetchUnemploymentData()', () => {
  it('fetches UNRATE as UNEMPLOYMENT_U3 by default', async () => {
    mockFetchFredSeries.mockResolvedValue({ observations: [] });
    await fetchUnemploymentData();
    expect(mockFetchFredSeries).toHaveBeenCalledWith('UNRATE', 'test-api-key');
  });

  it('normalizes monthly data points to the standard format', async () => {
    mockFetchFredSeries.mockResolvedValue({
      observations: [
        { realtime_start: '', realtime_end: '', date: '2024-01-01', value: '3.7' },
        { realtime_start: '', realtime_end: '', date: '2024-02-01', value: '3.9' },
      ],
    });

    const result = await fetchUnemploymentData();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2024-01-01', value: 3.7, indicatorType: 'UNEMPLOYMENT_U3' });
    expect(result[1]).toEqual({ date: '2024-02-01', value: 3.9, indicatorType: 'UNEMPLOYMENT_U3' });
  });
});

// STORY-001d
describe('fetchPMIData()', () => {
  it('fetches NAPM as PMI_MANUFACTURING by default', async () => {
    mockFetchFredSeries.mockResolvedValue({ observations: [] });
    await fetchPMIData();
    expect(mockFetchFredSeries).toHaveBeenCalledWith('NAPM', 'test-api-key');
  });

  it('normalizes monthly PMI data comparable against the 50.0 threshold', async () => {
    mockFetchFredSeries.mockResolvedValue({
      observations: [
        { realtime_start: '', realtime_end: '', date: '2024-01-01', value: '49.1' }, // contraction
        { realtime_start: '', realtime_end: '', date: '2024-02-01', value: '52.3' }, // expansion
      ],
    });

    const result = await fetchPMIData();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2024-01-01', value: 49.1, indicatorType: 'PMI_MANUFACTURING' });
    expect(result.find(r => r.value < 50.0)).toBeDefined(); // contraction reading present
    expect(result.find(r => r.value > 50.0)).toBeDefined(); // expansion reading present
  });
});
