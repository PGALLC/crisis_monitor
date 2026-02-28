# STORY-002: Crisis Rules Engine & Classifier

**Description:** As a system, I need to classify the current economic state based on the ingested indicators.
**Requirements:**
- Implement thresholds for Inverted Yield Curve, Sahm Rule, Spread blowouts.
- Classify into states: Healthy, Late Cycle, Deflationary Recession, Stagflation, Credit Crisis.
**Acceptance Criteria:**
- Unit tests cover all threshold logic and edge cases.
- Regression tests verify classification against historical snapshot data.
