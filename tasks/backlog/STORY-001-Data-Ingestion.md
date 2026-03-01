# STORY-001: Data Ingestion Pipeline (FRED & Market Data)

**Description:** As a system, I need to ingest macroeconomic data daily so that I have fresh inputs for the crisis rules engine.
**Requirements:**
- Fetch 10Y and 2Y Treasury yields.
- Fetch High Yield ICE BofA spreads.
- Fetch U-3 Unemployment rate.
- Fetch PMI data.
**Acceptance Criteria:**
- Unit tests cover API mocking and error handling.
- Functional tests verify data is correctly parsed and stored in the database.
- Runs successfully on a scheduled cron/worker.
