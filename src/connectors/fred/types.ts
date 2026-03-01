// The normalized internal format used across all connectors
export interface IndicatorObservation {
  date: string;          // YYYY-MM-DD
  value: number;
  indicatorType: string; // e.g. "YIELD_10Y"
}

// Raw shapes returned by the FRED API
export interface FredRawObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string; // FRED uses "." to indicate missing data
}

export interface FredSeriesResponse {
  observations: FredRawObservation[];
}

// Configures which FRED series to fetch and how to label them internally
export interface IndicatorConfig {
  seriesId: string;
  indicatorType: string;
}

export interface FetchOptions {
  observationStart?: string;
  limit?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
}
