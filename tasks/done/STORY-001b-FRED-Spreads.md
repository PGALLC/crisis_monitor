# STORY-001b: Connector - FRED Credit Spreads Data

**Description:** As a system, I need the FRED data connector to fetch High Yield Credit Spread data.
**Requirements:**
- Utilize the generic FRED connector built in STORY-001a.
- Fetch the ICE BofA US High Yield Index Option-Adjusted Spread (BAMLH0A0HYM2).
- Normalize the data into the standard internal format.
**Acceptance Criteria:**
- Unit tests verify the new configuration parses correctly.
- The system correctly handles null or missing data days (e.g., weekends/holidays).
