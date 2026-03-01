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

// STORY-001d: PMI — ISM Manufacturing index (monthly, expansion threshold: 50.0)
export const PMI_INDICATORS: IndicatorConfig[] = [
  { seriesId: 'NAPM', indicatorType: 'PMI_MANUFACTURING' },
];
