import type { IndicatorConfig } from './types';

// Add new series IDs here without touching the connector logic.
export const YIELD_CURVE_INDICATORS: IndicatorConfig[] = [
  { seriesId: 'DGS10', indicatorType: 'YIELD_10Y' },
  { seriesId: 'DGS2',  indicatorType: 'YIELD_2Y'  },
];
