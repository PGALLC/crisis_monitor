# STORY-001e: Connector - FRED Endpoint Smoke Test

**Description:** As a system administrator, I need an API endpoint to verify that the FRED data connectors (developed in 001a-001d) are successfully fetching and normalizing data in the live environments.
**Requirements:**
- Expose a simple HTTP GET endpoint (e.g., `/api/debug/fred` or `/api/health/fred`).
- The endpoint should invoke the connectors to fetch a small, recent sample of the macroeconomic data (Yield Curve, Credit Spreads, Unemployment, PMI).
- Return the fetched data as a structured JSON response.
**Acceptance Criteria:**
- The endpoint successfully returns 200 OK with the JSON payload containing the normalized indicator data.
- Functional tests are updated to hit this endpoint and verify the JSON structure.
- This endpoint serves as a verifiable sanity check/smoke test after deployment to Test and Production environments.
