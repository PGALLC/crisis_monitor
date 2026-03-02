import type { IndicatorConfig } from './types';

// STORY-001a: Yield Curve
export const YIELD_CURVE_INDICATORS: IndicatorConfig[] = [
  { seriesId: 'DGS10', indicatorType: 'YIELD_10Y' },
  { seriesId: 'DGS2',  indicatorType: 'YIELD_2Y'  },
];

// STORY-001b: Credit Spreads — ICE BofA US High Yield Index OAS
export const CREDIT_SPREAD_INDICATORS: IndicatorConfig[] = [
  { seriesId: 'BAMLH0A0HYM2', indicatorType: 'HY_CREDIT_SPREAD' },
];

// STORY-001c: Unemployment — U-3 rate (monthly)
export const UNEMPLOYMENT_INDICATORS: IndicatorConfig[] = [
  { seriesId: 'UNRATE', indicatorType: 'UNEMPLOYMENT_U3' },
];

// STORY-001d: Manufacturing activity (monthly).
// NOTE: ISM Manufacturing PMI (NAPM) was removed from FRED in 2016 due to
// ISM licensing — fetching it returns HTTP 400. IPMAN (Industrial Production:
// Manufacturing, published by the Federal Reserve) is the closest available
// FRED proxy. The Rules Engine should use trend/momentum logic rather than
// the ISM 50.0 contraction threshold.
export const PMI_INDICATORS: IndicatorConfig[] = [
  { seriesId: 'IPMAN', indicatorType: 'MANUFACTURING_PRODUCTION' },
];
