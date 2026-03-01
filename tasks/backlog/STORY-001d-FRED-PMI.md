# STORY-001d: Connector - FRED PMI Data

**Description:** As a system, I need the FRED data connector to fetch Purchasing Managers' Index (PMI) data.
**Requirements:**
- Utilize the generic FRED connector.
- Fetch the ISM Manufacturing PMI (or closest FRED equivalent, e.g., NAPM).
- Normalize the data into the standard internal format.
**Acceptance Criteria:**
- Unit tests verify correct ingestion of monthly PMI data points.
- The connector correctly normalizes the data to be easily comparable against the 50.0 contraction/expansion threshold.
