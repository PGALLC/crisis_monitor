import { fetchYieldCurveData } from '../../../src/connectors/fred/fredConnector';
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
});
