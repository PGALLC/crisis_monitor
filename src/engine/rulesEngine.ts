import type { IndicatorObservation } from '../connectors/fred/types';

export type EconomicState =
  | 'Healthy'
  | 'Late Cycle'
  | 'Deflationary Recession'
  | 'Stagflation'
  | 'Credit Crisis';

export interface ClassificationInput {
  yieldCurve: IndicatorObservation[];    // YIELD_10Y and YIELD_2Y
  creditSpreads: IndicatorObservation[]; // HY_CREDIT_SPREAD
  unemployment: IndicatorObservation[];  // UNEMPLOYMENT_U3 (chronological)
  manufacturing: IndicatorObservation[]; // MANUFACTURING_PRODUCTION (IPMAN)
}

export interface SignalSummary {
  yieldCurveInverted: boolean;
  sahmRuleTriggered: boolean;
  spreadBlowout: boolean;
  manufacturingContracting: boolean;
}

export interface ClassificationResult {
  state: EconomicState;
  signals: SignalSummary;
  timestamp: string;
}

// Thresholds — exported for test documentation
export const THRESHOLDS = {
  // DGS10 − DGS2 < 0 → yield curve inverted
  YIELD_CURVE_INVERSION_SPREAD: 0,
  // Unemployment risen >= 0.5pp above lookback minimum → Sahm Rule
  SAHM_RULE_TRIGGER_PP: 0.5,
  // HY OAS spread > 8.0 (800 bps in FRED percentage-point units) → Credit Crisis
  CREDIT_CRISIS_SPREAD: 8.0,
  // Number of months used in the IPMAN moving average
  IPMAN_3MMA_WINDOW: 3,
} as const;

/**
 * Returns true when DGS10 − DGS2 < 0 (10-year yield below 2-year yield).
 * Requires at least one observation for each maturity.
 */
export function isYieldCurveInverted(yieldCurve: IndicatorObservation[]): boolean {
  const dgs10 = yieldCurve.find(o => o.indicatorType === 'YIELD_10Y');
  const dgs2  = yieldCurve.find(o => o.indicatorType === 'YIELD_2Y');
  if (!dgs10 || !dgs2) return false;
  return dgs10.value - dgs2.value < THRESHOLDS.YIELD_CURVE_INVERSION_SPREAD;
}

/**
 * Sahm Rule approximation: returns true when the most recent unemployment rate
 * has risen >= 0.5pp above its minimum across all available observations.
 * Requires at least 2 observations.
 */
export function isSahmRuleTriggered(unemployment: IndicatorObservation[]): boolean {
  if (unemployment.length < 2) return false;
  const sorted     = [...unemployment].sort((a, b) => a.date.localeCompare(b.date));
  const current    = sorted[sorted.length - 1].value;
  const lookbackMin = Math.min(...sorted.map(o => o.value));
  return current - lookbackMin >= THRESHOLDS.SAHM_RULE_TRIGGER_PP;
}

/**
 * Returns true when the most recent HY credit spread exceeds 8.0% OAS (800 bps).
 * FRED series BAMLH0A0HYM2 is expressed in percentage points (e.g. 3.5 = 350 bps).
 */
export function isSpreadBlowout(creditSpreads: IndicatorObservation[]): boolean {
  if (creditSpreads.length === 0) return false;
  const sorted = [...creditSpreads].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0].value > THRESHOLDS.CREDIT_CRISIS_SPREAD;
}

/**
 * Returns true when IPMAN shows a contraction signal via either:
 *   A) 3-month moving average: current value < average of the last 3 months, OR
 *   B) Momentum: month-over-month change is negative for two consecutive months.
 * Requires at least 3 observations; always sorts by date before evaluating.
 */
export function isManufacturingContracting(manufacturing: IndicatorObservation[]): boolean {
  const sorted = [...manufacturing].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length < THRESHOLDS.IPMAN_3MMA_WINDOW) return false;

  const [t0, t1, t2] = sorted;
  const threeMMA = (t0.value + t1.value + t2.value) / THRESHOLDS.IPMAN_3MMA_WINDOW;

  // Signal A: current value below the 3-month moving average
  if (t0.value < threeMMA) return true;

  // Signal B: two consecutive months of negative month-over-month change
  if (t0.value < t1.value && t1.value < t2.value) return true;

  return false;
}

/**
 * Classifies the current economic state from the four indicator signals.
 *
 * Priority (highest → lowest):
 *   Credit Crisis          — HY spread blowout (systemic liquidity risk)
 *   Deflationary Recession — Sahm Rule + inverted yield curve
 *   Stagflation            — Sahm Rule + manufacturing contraction, curve not inverted
 *   Late Cycle             — any single leading warning signal (pre-recession)
 *   Healthy                — no signals active
 */
export function classify(input: ClassificationInput): ClassificationResult {
  const signals: SignalSummary = {
    yieldCurveInverted:      isYieldCurveInverted(input.yieldCurve),
    sahmRuleTriggered:       isSahmRuleTriggered(input.unemployment),
    spreadBlowout:           isSpreadBlowout(input.creditSpreads),
    manufacturingContracting: isManufacturingContracting(input.manufacturing),
  };

  let state: EconomicState;

  if (signals.spreadBlowout) {
    state = 'Credit Crisis';
  } else if (signals.sahmRuleTriggered && signals.yieldCurveInverted) {
    state = 'Deflationary Recession';
  } else if (signals.sahmRuleTriggered && signals.manufacturingContracting) {
    state = 'Stagflation';
  } else if (signals.yieldCurveInverted || signals.manufacturingContracting || signals.sahmRuleTriggered) {
    state = 'Late Cycle';
  } else {
    state = 'Healthy';
  }

  return { state, signals, timestamp: new Date().toISOString() };
}
