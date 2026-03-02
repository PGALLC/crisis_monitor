import {
  isYieldCurveInverted,
  isSahmRuleTriggered,
  isSpreadBlowout,
  isManufacturingContracting,
  classify,
  THRESHOLDS,
} from '../../../src/engine/rulesEngine';
import type { IndicatorObservation } from '../../../src/connectors/fred/types';

function obs(date: string, value: number, indicatorType: string): IndicatorObservation {
  return { date, value, indicatorType };
}

// ---------------------------------------------------------------------------
// isYieldCurveInverted
// ---------------------------------------------------------------------------
describe('isYieldCurveInverted()', () => {
  it('returns false when 10Y > 2Y (normal / steep curve)', () => {
    expect(isYieldCurveInverted([
      obs('2024-01-01', 4.5, 'YIELD_10Y'),
      obs('2024-01-01', 4.0, 'YIELD_2Y'),
    ])).toBe(false);
  });

  it('returns true when 10Y < 2Y (inverted curve)', () => {
    expect(isYieldCurveInverted([
      obs('2024-01-01', 3.8, 'YIELD_10Y'),
      obs('2024-01-01', 4.2, 'YIELD_2Y'),
    ])).toBe(true);
  });

  it('returns false when 10Y = 2Y (flat curve — at threshold, not strictly less)', () => {
    expect(isYieldCurveInverted([
      obs('2024-01-01', 4.0, 'YIELD_10Y'),
      obs('2024-01-01', 4.0, 'YIELD_2Y'),
    ])).toBe(false);
  });

  it('returns false when YIELD_10Y observation is missing', () => {
    expect(isYieldCurveInverted([obs('2024-01-01', 4.0, 'YIELD_2Y')])).toBe(false);
  });

  it('returns false when YIELD_2Y observation is missing', () => {
    expect(isYieldCurveInverted([obs('2024-01-01', 4.0, 'YIELD_10Y')])).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(isYieldCurveInverted([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSahmRuleTriggered
// ---------------------------------------------------------------------------
describe('isSahmRuleTriggered()', () => {
  it('returns false when unemployment has not risen 0.5pp from its lookback low', () => {
    expect(isSahmRuleTriggered([
      obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 3.6, 'UNEMPLOYMENT_U3'),
      obs('2024-03-01', 3.7, 'UNEMPLOYMENT_U3'), // 3.7 - 3.5 = 0.2 < 0.5
    ])).toBe(false);
  });

  it(`returns true when unemployment has risen exactly ${THRESHOLDS.SAHM_RULE_TRIGGER_PP}pp from its low`, () => {
    expect(isSahmRuleTriggered([
      obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-03-01', 4.0, 'UNEMPLOYMENT_U3'), // 4.0 - 3.5 = 0.5 == trigger
    ])).toBe(true);
  });

  it('returns true when unemployment has risen > 0.5pp from its low', () => {
    expect(isSahmRuleTriggered([
      obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 4.2, 'UNEMPLOYMENT_U3'), // 4.2 - 3.5 = 0.7 >= 0.5
    ])).toBe(true);
  });

  it('returns false with only one observation (insufficient data)', () => {
    expect(isSahmRuleTriggered([obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3')])).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(isSahmRuleTriggered([])).toBe(false);
  });

  it('returns false when unemployment is stable (current equals historical minimum)', () => {
    expect(isSahmRuleTriggered([
      obs('2024-01-01', 3.8, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 3.8, 'UNEMPLOYMENT_U3'),
      obs('2024-03-01', 3.8, 'UNEMPLOYMENT_U3'),
    ])).toBe(false);
  });

  it('uses the most recent observation as "current" regardless of input order', () => {
    // Provide data in reverse order; function must sort by date
    expect(isSahmRuleTriggered([
      obs('2024-03-01', 4.1, 'UNEMPLOYMENT_U3'), // most recent — provided first
      obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 3.6, 'UNEMPLOYMENT_U3'),
    ])).toBe(true); // 4.1 - 3.5 = 0.6 >= 0.5
  });
});

// ---------------------------------------------------------------------------
// isSpreadBlowout
// ---------------------------------------------------------------------------
describe('isSpreadBlowout()', () => {
  it('returns false when HY spread is well below the threshold', () => {
    expect(isSpreadBlowout([obs('2024-01-01', 3.5, 'HY_CREDIT_SPREAD')])).toBe(false);
  });

  it(`returns false when HY spread equals the ${THRESHOLDS.CREDIT_CRISIS_SPREAD} threshold (strict >)`, () => {
    expect(isSpreadBlowout([obs('2024-01-01', 8.0, 'HY_CREDIT_SPREAD')])).toBe(false);
  });

  it('returns true when HY spread exceeds 8.0% OAS (800 bps)', () => {
    expect(isSpreadBlowout([obs('2024-01-01', 9.5, 'HY_CREDIT_SPREAD')])).toBe(true);
  });

  it('returns false for an empty array', () => {
    expect(isSpreadBlowout([])).toBe(false);
  });

  it('evaluates the most recent observation when multiple are provided', () => {
    // Older data was at crisis level; most recent is normal
    expect(isSpreadBlowout([
      obs('2024-01-01', 9.5, 'HY_CREDIT_SPREAD'), // older, crisis-level
      obs('2024-03-01', 3.5, 'HY_CREDIT_SPREAD'), // most recent, normal
    ])).toBe(false);
  });

  it('detects blowout when latest observation is the high', () => {
    expect(isSpreadBlowout([
      obs('2024-01-01', 3.5, 'HY_CREDIT_SPREAD'), // older, normal
      obs('2024-03-01', 10.5, 'HY_CREDIT_SPREAD'), // most recent, blowout
    ])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isManufacturingContracting
// ---------------------------------------------------------------------------
describe('isManufacturingContracting()', () => {
  it('returns false with fewer than 3 observations (insufficient data for 3MMA)', () => {
    expect(isManufacturingContracting([
      obs('2024-01-01', 100.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 99.5,  'MANUFACTURING_PRODUCTION'),
    ])).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(isManufacturingContracting([])).toBe(false);
  });

  it('returns false when IPMAN is trending up (healthy expansion)', () => {
    // t0=104, t1=102, t2=100 → 3MMA=102; 104 > 102; MoM positive → not contracting
    expect(isManufacturingContracting([
      obs('2024-03-01', 104.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 102.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 100.0, 'MANUFACTURING_PRODUCTION'),
    ])).toBe(false);
  });

  it('returns false when IPMAN is flat', () => {
    expect(isManufacturingContracting([
      obs('2024-03-01', 100.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 100.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 100.0, 'MANUFACTURING_PRODUCTION'),
    ])).toBe(false);
  });

  it('Signal A — returns true when current dips below 3MMA (non-monotonic: dip after bounce)', () => {
    // t0=99, t1=101, t2=98 → 3MMA=(99+101+98)/3=99.33; 99 < 99.33 → contracting
    // MoM: t0(99) < t1(101) negative, t1(101) > t2(98) positive → NOT two consecutive negative
    // → Only signal A fires; confirms A is independently sufficient
    expect(isManufacturingContracting([
      obs('2024-03-01', 99.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 101.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 98.0,  'MANUFACTURING_PRODUCTION'),
    ])).toBe(true);
  });

  it('Signal A+B — returns true for monotonically declining IPMAN (both signals fire)', () => {
    // t0=97, t1=99, t2=101 → 3MMA=99; 97 < 99 (A) AND 97<99 AND 99<101 (B)
    expect(isManufacturingContracting([
      obs('2024-03-01', 97.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 99.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 101.0, 'MANUFACTURING_PRODUCTION'),
    ])).toBe(true);
  });

  it('returns false when only one month of decline is followed by a bounce (no signal)', () => {
    // t0=103, t1=100, t2=102 → 3MMA=(103+100+102)/3=101.67; 103 > 101.67 (no A)
    // MoM: t0(103) > t1(100) positive → not two consecutive negative (no B)
    expect(isManufacturingContracting([
      obs('2024-03-01', 103.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 100.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 102.0, 'MANUFACTURING_PRODUCTION'),
    ])).toBe(false);
  });

  it('sorts data by date before evaluating (handles any input order)', () => {
    // Same declining series as the A+B test, but input in ascending order
    expect(isManufacturingContracting([
      obs('2024-01-01', 101.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-03-01', 97.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 99.0,  'MANUFACTURING_PRODUCTION'),
    ])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// classify — helper input factory
// ---------------------------------------------------------------------------
function makeHealthyInput() {
  return {
    yieldCurve: [
      obs('2024-01-01', 4.5, 'YIELD_10Y'),
      obs('2024-01-01', 4.0, 'YIELD_2Y'),
    ],
    creditSpreads: [obs('2024-01-01', 3.5, 'HY_CREDIT_SPREAD')],
    unemployment: [
      obs('2024-01-01', 3.8, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 3.8, 'UNEMPLOYMENT_U3'),
    ],
    manufacturing: [
      obs('2024-03-01', 104.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 102.0, 'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 100.0, 'MANUFACTURING_PRODUCTION'),
    ],
  };
}

describe('classify()', () => {
  it('returns Healthy when no warning signals are active', () => {
    const result = classify(makeHealthyInput());
    expect(result.state).toBe('Healthy');
    expect(result.signals).toEqual({
      yieldCurveInverted:       false,
      sahmRuleTriggered:        false,
      spreadBlowout:            false,
      manufacturingContracting: false,
    });
  });

  it('returns Credit Crisis on spread blowout', () => {
    const input = makeHealthyInput();
    input.creditSpreads = [obs('2024-01-01', 10.5, 'HY_CREDIT_SPREAD')];
    const result = classify(input);
    expect(result.state).toBe('Credit Crisis');
    expect(result.signals.spreadBlowout).toBe(true);
  });

  it('Credit Crisis takes priority when all other signals are also active', () => {
    const result = classify({
      yieldCurve: [
        obs('2024-01-01', 3.8, 'YIELD_10Y'),
        obs('2024-01-01', 4.2, 'YIELD_2Y'),
      ],
      creditSpreads: [obs('2024-01-01', 11.0, 'HY_CREDIT_SPREAD')],
      unemployment: [
        obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
        obs('2024-02-01', 7.0, 'UNEMPLOYMENT_U3'),
      ],
      manufacturing: [
        obs('2024-03-01', 85.0, 'MANUFACTURING_PRODUCTION'),
        obs('2024-02-01', 88.0, 'MANUFACTURING_PRODUCTION'),
        obs('2024-01-01', 91.0, 'MANUFACTURING_PRODUCTION'),
      ],
    });
    expect(result.state).toBe('Credit Crisis');
  });

  it('returns Deflationary Recession when Sahm Rule and curve inversion both fire', () => {
    const input = makeHealthyInput();
    input.yieldCurve  = [obs('2024-01-01', 3.8, 'YIELD_10Y'), obs('2024-01-01', 4.2, 'YIELD_2Y')];
    input.unemployment = [
      obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 4.2, 'UNEMPLOYMENT_U3'),
    ];
    const result = classify(input);
    expect(result.state).toBe('Deflationary Recession');
    expect(result.signals.yieldCurveInverted).toBe(true);
    expect(result.signals.sahmRuleTriggered).toBe(true);
  });

  it('Deflationary Recession takes priority over Stagflation when all three warning signals are on', () => {
    const result = classify({
      yieldCurve: [obs('2024-01-01', 3.8, 'YIELD_10Y'), obs('2024-01-01', 4.2, 'YIELD_2Y')],
      creditSpreads: [obs('2024-01-01', 6.0, 'HY_CREDIT_SPREAD')],
      unemployment: [
        obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
        obs('2024-02-01', 4.2, 'UNEMPLOYMENT_U3'),
      ],
      manufacturing: [
        obs('2024-03-01', 90.0, 'MANUFACTURING_PRODUCTION'),
        obs('2024-02-01', 93.0, 'MANUFACTURING_PRODUCTION'),
        obs('2024-01-01', 96.0, 'MANUFACTURING_PRODUCTION'),
      ],
    });
    expect(result.state).toBe('Deflationary Recession');
  });

  it('returns Stagflation when Sahm fires + manufacturing contracting but curve is NOT inverted', () => {
    const input = makeHealthyInput();
    // Keep yield curve normal (10Y > 2Y)
    input.unemployment = [
      obs('2024-01-01', 4.0, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 4.7, 'UNEMPLOYMENT_U3'), // +0.7pp → Sahm triggered
    ];
    input.manufacturing = [
      obs('2024-03-01', 97.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 99.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 101.0, 'MANUFACTURING_PRODUCTION'),
    ];
    const result = classify(input);
    expect(result.state).toBe('Stagflation');
    expect(result.signals.sahmRuleTriggered).toBe(true);
    expect(result.signals.manufacturingContracting).toBe(true);
    expect(result.signals.yieldCurveInverted).toBe(false);
  });

  it('returns Late Cycle when only the yield curve is inverted', () => {
    const input = makeHealthyInput();
    input.yieldCurve = [obs('2024-01-01', 3.8, 'YIELD_10Y'), obs('2024-01-01', 4.2, 'YIELD_2Y')];
    const result = classify(input);
    expect(result.state).toBe('Late Cycle');
    expect(result.signals.yieldCurveInverted).toBe(true);
    expect(result.signals.sahmRuleTriggered).toBe(false);
    expect(result.signals.manufacturingContracting).toBe(false);
  });

  it('returns Late Cycle when only manufacturing is contracting', () => {
    const input = makeHealthyInput();
    input.manufacturing = [
      obs('2024-03-01', 97.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-02-01', 99.0,  'MANUFACTURING_PRODUCTION'),
      obs('2024-01-01', 101.0, 'MANUFACTURING_PRODUCTION'),
    ];
    const result = classify(input);
    expect(result.state).toBe('Late Cycle');
    expect(result.signals.manufacturingContracting).toBe(true);
    expect(result.signals.yieldCurveInverted).toBe(false);
    expect(result.signals.sahmRuleTriggered).toBe(false);
  });

  it('returns Late Cycle when only the Sahm Rule is triggered (unemployment rising, no other signals)', () => {
    const input = makeHealthyInput();
    input.unemployment = [
      obs('2024-01-01', 3.5, 'UNEMPLOYMENT_U3'),
      obs('2024-02-01', 4.1, 'UNEMPLOYMENT_U3'), // +0.6pp → Sahm triggered
    ];
    const result = classify(input);
    expect(result.state).toBe('Late Cycle');
    expect(result.signals.sahmRuleTriggered).toBe(true);
    expect(result.signals.yieldCurveInverted).toBe(false);
    expect(result.signals.manufacturingContracting).toBe(false);
  });

  it('result always includes an ISO 8601 timestamp', () => {
    const result = classify(makeHealthyInput());
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
