/**
 * Regression tests: verify the /api/classification route produces the correct
 * economic-state classification for representative historical snapshots.
 * All FRED connectors are mocked so the tests run without network access.
 */
import request from 'supertest';
import { createApp } from '../../src/app';
import {
  fetchYieldCurveData,
  fetchCreditSpreadsData,
  fetchUnemploymentData,
  fetchPMIData,
} from '../../src/connectors/fred/fredConnector';

jest.mock('../../src/connectors/fred/fredConnector');

const mockYieldCurve     = fetchYieldCurveData     as jest.MockedFunction<typeof fetchYieldCurveData>;
const mockCreditSpreads  = fetchCreditSpreadsData  as jest.MockedFunction<typeof fetchCreditSpreadsData>;
const mockUnemployment   = fetchUnemploymentData   as jest.MockedFunction<typeof fetchUnemploymentData>;
const mockManufacturing  = fetchPMIData            as jest.MockedFunction<typeof fetchPMIData>;

function obs(date: string, value: number, indicatorType: string) {
  return { date, value, indicatorType };
}

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------
describe('GET /api/classification — response shape', () => {
  beforeEach(() => {
    mockYieldCurve.mockResolvedValue([
      obs('2024-01-01', 4.5, 'YIELD_10Y'),
      obs('2024-01-01', 4.0, 'YIELD_2Y'),
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2024-01-01', 3.5, 'HY_CREDIT_SPREAD')]);
    mockUnemployment.mockResolvedValue([
      obs('2024-01-01', 3.8, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 3.8, 'UNEMPLOYMENT_U3'),
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2024-03-01', 104.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 102.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 100.0, 'MANUFACTURING_PRODUCTION'),
    ]);
  });

  it('returns 200 with state, signals, and ISO 8601 timestamp', async () => {
    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('state');
    expect(res.body).toHaveProperty('signals');
    expect(res.body.signals).toHaveProperty('yieldCurveInverted');
    expect(res.body.signals).toHaveProperty('sahmRuleTriggered');
    expect(res.body.signals).toHaveProperty('spreadBlowout');
    expect(res.body.signals).toHaveProperty('manufacturingContracting');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

// ---------------------------------------------------------------------------
// Regression Snapshot: 2017 steady expansion → Healthy
// ---------------------------------------------------------------------------
describe('Snapshot: 2017 steady expansion → Healthy', () => {
  it('classifies as Healthy with no signals active', async () => {
    // Steep curve; tight spreads; unemployment falling; manufacturing expanding
    mockYieldCurve.mockResolvedValue([
      obs('2017-06-01', 2.30, 'YIELD_10Y'),
      obs('2017-06-01', 1.35, 'YIELD_2Y'),   // spread +0.95pp → normal
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2017-06-01', 3.25, 'HY_CREDIT_SPREAD')]);
    mockUnemployment.mockResolvedValue([
      obs('2017-01-01', 4.7, 'UNEMPLOYMENT_U3'),
      obs('2017-06-01', 4.4, 'UNEMPLOYMENT_U3'), // falling → no Sahm
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2017-06-01', 103.5, 'MANUFACTURING_PRODUCTION'),
      obs('2017-05-01', 102.8, 'MANUFACTURING_PRODUCTION'),
      obs('2017-04-01', 101.9, 'MANUFACTURING_PRODUCTION'), // expanding
    ]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Healthy');
    expect(res.body.signals.yieldCurveInverted).toBe(false);
    expect(res.body.signals.sahmRuleTriggered).toBe(false);
    expect(res.body.signals.spreadBlowout).toBe(false);
    expect(res.body.signals.manufacturingContracting).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Regression Snapshot: Aug 2019 yield-curve inversion → Late Cycle
// ---------------------------------------------------------------------------
describe('Snapshot: 2019 yield-curve inversion → Late Cycle', () => {
  it('classifies as Late Cycle on curve inversion alone', async () => {
    // 10Y briefly dipped below 2Y; unemployment near cycle lows; spreads normal
    mockYieldCurve.mockResolvedValue([
      obs('2019-08-01', 1.63, 'YIELD_10Y'),
      obs('2019-08-01', 1.76, 'YIELD_2Y'),   // inverted by −0.13pp
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2019-08-01', 3.52, 'HY_CREDIT_SPREAD')]);
    mockUnemployment.mockResolvedValue([
      obs('2019-01-01', 4.0, 'UNEMPLOYMENT_U3'),
      obs('2019-08-01', 3.7, 'UNEMPLOYMENT_U3'), // declining → no Sahm
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2019-08-01', 101.2, 'MANUFACTURING_PRODUCTION'),
      obs('2019-07-01', 100.8, 'MANUFACTURING_PRODUCTION'),
      obs('2019-06-01', 101.5, 'MANUFACTURING_PRODUCTION'), // 3MMA=101.17; 101.2>101.17 → not contracting
    ]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Late Cycle');
    expect(res.body.signals.yieldCurveInverted).toBe(true);
    expect(res.body.signals.sahmRuleTriggered).toBe(false);
    expect(res.body.signals.spreadBlowout).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Regression Snapshot: COVID-19 March 2020 → Credit Crisis
// ---------------------------------------------------------------------------
describe('Snapshot: COVID-19 March 2020 → Credit Crisis', () => {
  it('classifies as Credit Crisis on HY spread blowout (> 800 bps)', async () => {
    // Fed cut short rates to near-zero (curve steep); HY OAS exploded to ~1,087 bps
    mockYieldCurve.mockResolvedValue([
      obs('2020-03-01', 0.87, 'YIELD_10Y'),
      obs('2020-03-01', 0.35, 'YIELD_2Y'),   // steep — not inverted
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2020-03-20', 10.87, 'HY_CREDIT_SPREAD')]); // >> 8.0
    mockUnemployment.mockResolvedValue([
      obs('2020-01-01', 3.6, 'UNEMPLOYMENT_U3'),
      obs('2020-02-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2020-03-01', 4.4, 'UNEMPLOYMENT_U3'), // Sahm also triggered, but Credit Crisis wins
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2020-03-01', 92.0,  'MANUFACTURING_PRODUCTION'),
      obs('2020-02-01', 99.0,  'MANUFACTURING_PRODUCTION'),
      obs('2020-01-01', 101.0, 'MANUFACTURING_PRODUCTION'),
    ]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Credit Crisis');
    expect(res.body.signals.spreadBlowout).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Regression Snapshot: late 2022 Fed tightening peak → Late Cycle
// ---------------------------------------------------------------------------
describe('Snapshot: 2022 Fed tightening cycle → Late Cycle', () => {
  it('classifies as Late Cycle from curve inversion + manufacturing weakness (no Sahm)', async () => {
    // 10Y-2Y deeply inverted; unemployment near lows; spreads elevated but not crisis
    mockYieldCurve.mockResolvedValue([
      obs('2022-10-01', 4.01, 'YIELD_10Y'),
      obs('2022-10-01', 4.48, 'YIELD_2Y'),   // inverted by −0.47pp
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2022-10-01', 5.52, 'HY_CREDIT_SPREAD')]); // < 8.0
    mockUnemployment.mockResolvedValue([
      obs('2022-01-01', 4.0, 'UNEMPLOYMENT_U3'),
      obs('2022-10-01', 3.7, 'UNEMPLOYMENT_U3'), // falling → no Sahm
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2022-10-01', 96.7, 'MANUFACTURING_PRODUCTION'),
      obs('2022-09-01', 97.2, 'MANUFACTURING_PRODUCTION'),
      obs('2022-08-01', 97.8, 'MANUFACTURING_PRODUCTION'), // 3MMA=97.23; 96.7 < 97.23 → contracting
    ]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Late Cycle');
    expect(res.body.signals.yieldCurveInverted).toBe(true);
    expect(res.body.signals.manufacturingContracting).toBe(true);
    expect(res.body.signals.sahmRuleTriggered).toBe(false);
    expect(res.body.signals.spreadBlowout).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Regression Snapshot: synthetic Deflationary Recession (2008-style)
// ---------------------------------------------------------------------------
describe('Snapshot: synthetic Deflationary Recession (Sahm + inverted curve)', () => {
  it('classifies as Deflationary Recession when unemployment surges and curve is inverted', async () => {
    // Curve already inverted; unemployment well above its prior low; spreads elevated not crisis
    mockYieldCurve.mockResolvedValue([
      obs('2009-01-01', 2.50, 'YIELD_10Y'),
      obs('2009-01-01', 2.80, 'YIELD_2Y'),   // inverted by −0.30pp
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2009-01-01', 7.50, 'HY_CREDIT_SPREAD')]); // < 8.0
    mockUnemployment.mockResolvedValue([
      obs('2008-01-01', 5.0, 'UNEMPLOYMENT_U3'),
      obs('2009-01-01', 7.6, 'UNEMPLOYMENT_U3'), // +2.6pp → Sahm triggered
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2009-01-01', 88.0, 'MANUFACTURING_PRODUCTION'),
      obs('2008-12-01', 91.0, 'MANUFACTURING_PRODUCTION'),
      obs('2008-11-01', 94.0, 'MANUFACTURING_PRODUCTION'),
    ]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Deflationary Recession');
    expect(res.body.signals.sahmRuleTriggered).toBe(true);
    expect(res.body.signals.yieldCurveInverted).toBe(true);
    expect(res.body.signals.spreadBlowout).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Regression Snapshot: synthetic Stagflation
// ---------------------------------------------------------------------------
describe('Snapshot: synthetic Stagflation (Sahm + IPMAN contraction, curve not inverted)', () => {
  it('classifies as Stagflation when unemployment rises and manufacturing contracts without a curve inversion', async () => {
    // Fed fighting inflation — short rates elevated, curve steep (not inverted)
    // Unemployment rising; IPMAN falling
    mockYieldCurve.mockResolvedValue([
      obs('2024-01-01', 5.0, 'YIELD_10Y'),
      obs('2024-01-01', 4.5, 'YIELD_2Y'),   // positive spread → not inverted
    ]);
    mockCreditSpreads.mockResolvedValue([obs('2024-01-01', 5.5, 'HY_CREDIT_SPREAD')]); // < 8.0
    mockUnemployment.mockResolvedValue([
      obs('2023-06-01', 4.0, 'UNEMPLOYMENT_U3'),
      obs('2024-01-01', 4.8, 'UNEMPLOYMENT_U3'), // +0.8pp → Sahm triggered
    ]);
    mockManufacturing.mockResolvedValue([
      obs('2024-01-01', 94.0, 'MANUFACTURING_PRODUCTION'),
      obs('2023-12-01', 96.0, 'MANUFACTURING_PRODUCTION'),
      obs('2023-11-01', 98.0, 'MANUFACTURING_PRODUCTION'), // 3MMA=96; 94 < 96 → contracting
    ]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Stagflation');
    expect(res.body.signals.sahmRuleTriggered).toBe(true);
    expect(res.body.signals.manufacturingContracting).toBe(true);
    expect(res.body.signals.yieldCurveInverted).toBe(false);
    expect(res.body.signals.spreadBlowout).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe('GET /api/classification — error handling', () => {
  it('returns 503 with error message when a connector throws', async () => {
    mockYieldCurve.mockRejectedValue(new Error('FRED_API_KEY environment variable is not set'));
    mockCreditSpreads.mockResolvedValue([]);
    mockUnemployment.mockResolvedValue([]);
    mockManufacturing.mockResolvedValue([]);

    const res = await request(createApp()).get('/api/classification');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch('FRED_API_KEY');
  });
});
