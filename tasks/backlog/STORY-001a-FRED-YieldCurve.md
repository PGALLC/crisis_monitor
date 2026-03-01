# STORY-001a: Connector - FRED Yield Curve Data

**Description:** As a system, I need a robust, isolated data connector to fetch Yield Curve data from the Federal Reserve Economic Data (FRED) API.
**Requirements:**
- Build a generic FRED API connector capable of fetching series data.
- Ensure the requested series IDs are configurable.
- Fetch 10-Year (DGS10) and 2-Year (DGS2) Treasury Constant Maturity Rates.
- Normalize the data into a standard internal format (Date, Value, IndicatorType).
**Acceptance Criteria:**
- Unit tests mock the FRED API and verify correct normalization.
- The connector handles rate limits and API failures gracefully.
- The indicator configuration can easily accept new series IDs without code changes to the base connector.
