# STORY-001c: Connector - FRED Unemployment Data

**Description:** As a system, I need the FRED data connector to fetch Unemployment data.
**Requirements:**
- Utilize the generic FRED connector.
- Fetch the U-3 Unemployment Rate (UNRATE).
- Normalize the data into the standard internal format.
**Acceptance Criteria:**
- Unit tests verify correct ingestion of monthly data points.
- The data structure is consistent with the daily data fetched in 001a and 001b.
