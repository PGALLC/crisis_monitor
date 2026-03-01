import { fetchFredSeries } from './fredApiClient';
import { YIELD_CURVE_INDICATORS } from './config';
import type { IndicatorObservation, IndicatorConfig } from './types';

function normalizeObservations(
  rawObservations: { date: string; value: string }[],
  indicatorType: string,
): IndicatorObservation[] {
  return rawObservations
    .filter(obs => obs.value.trim() !== '.')
    .map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value),
      indicatorType,
    }));
}

export async function fetchYieldCurveData(
  indicators: IndicatorConfig[] = YIELD_CURVE_INDICATORS,
): Promise<IndicatorObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED_API_KEY environment variable is not set');
  }

  const results = await Promise.all(
    indicators.map(async ({ seriesId, indicatorType }) => {
      const response = await fetchFredSeries(seriesId, apiKey);
      return normalizeObservations(response.observations, indicatorType);
    }),
  );

  return results.flat();
}
