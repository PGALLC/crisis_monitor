# Product Requirements Document (PRD): Crisis Monitor

## 1. Overview
The **Crisis Monitor** is an automated intelligence web application designed to track macroeconomic indicators, analyze news sentiment, and synthesize actionable financial intelligence. It provides users with a clear, data-driven view of current economic stability, identifies potential crisis conditions, and suggests relevant asset classes. The platform includes a subscription engine to build an audience, allowing users to receive automated, personalized reports and alerts based on their preferences.

## 2. Objectives
- **Web Platform:** Build a modern, responsive web application using Node.js and TypeScript.
- **Automated Data Collection & Analysis:** Ingest macroeconomic data daily, evaluate signals against historical thresholds, and use an LLM agent to synthesize the data into readable reports.
- **Audience Building:** Implement a robust subscription system capturing verified emails and/or phone numbers.
- **Customizable Delivery:** Allow users to tailor their reporting frequency (daily/weekly), opt-in for urgent alerts, and subscribe to a separate track for "events & investment ideas."
- **Actionable Reporting:** Generate comprehensive reports intended for review alongside a qualified financial advisor.

## 3. Core Features

### 3.1. Economic Indicator Tracking Engine
The system will pull and track macroeconomic indicators on a daily basis. To ensure maintainability and future reuse, data fetching will be implemented using **Isolated Data Connectors**. Each connector will be responsible for authenticating with a specific data source, fetching the raw data, and normalizing it into a standard internal format. The specific data points fetched by each connector should be configurable.

The core indicators to track initially are:
*   **Yield Curve (10Y minus 2Y Treasury):** Track inversion depth and normalization speed. (Primary Source: FRED API)
*   **Credit Spreads (High Yield ICE BofA vs. Treasuries):** Monitor for spikes (e.g., sudden 50+ bps widening). (Primary Source: FRED API)
*   **Unemployment (U-3 & Sahm Rule):** Track cycle lows and upward momentum. (Primary Source: FRED API)
*   **PMI (Purchasing Managers' Index):** Track manufacturing vs. services contraction. (Primary Source: ISM / FRED API)
*   **Output Metrics:** Calculate current value, distance from threshold/danger zone, and velocity/trend.
### 3.2. Crisis Type Classifier
Apply a rules engine to classify the current environment into states:
*   **Healthy / Expansion, Late Cycle / Vulnerable, Deflationary Recession, Stagflation, Credit Crisis/Panic.**

### 3.3. News Sentiment & AI Research Agent
*   **Sentiment:** Ingest daily financial headlines and score for "Panic," "Euphoria," or "Uncertainty."
*   **AI Synthesis:** An LLM agent acts as an economic researcher, taking the day's data and sentiment to write a short thesis on the current situation and suggest 3-4 historically appropriate asset classes (e.g., Long-Term Treasuries, Farmland, Mining Stocks).

### 3.4. Subscription & User Management Engine
*   **Registration & Verification:** Users can sign up via Email or Phone number. The system must include a verification loop (OTP or verification link) to ensure valid contact details.
*   **Preference Center:** 
    *   **Frequency:** Users can select delivery frequency for the core report (Daily or Weekly).
    *   **Urgent Developments:** A toggle to receive out-of-band alerts when the system detects a rapid shift (e.g., sudden credit spread blowout, major bank failure).
    *   **Events & Ideas:** A separate opt-in for marketing/community content (upcoming webinars, specific investment ideas).
*   **Unsubscribe/Manage:** Every communication must include a secure, tokenized link allowing users to easily unsubscribe or adjust their preferences without needing a password login.

### 3.5. Web Interface & Dashboard
*   **Landing Page:** Value proposition, sample report, and the lead-capture subscription form.
*   **Public Dashboard:** A visual representation of the current "Macro Traffic Lights" (Yield Curve, Spreads, Unemployment) to drive engagement and encourage sign-ups.

## 4. Technical Architecture Requirements
*   **Tech Stack:** Node.js backend, TypeScript, React/Next.js frontend (or similar modern web framework).
*   **Database:** PostgreSQL (via an ORM like Prisma or Drizzle) to store user preferences, verified contacts, and historical indicator data.
*   **External APIs:**
    *   *Macro/Market Data:* FRED API, yfinance, or Alpha Vantage.
    *   *AI Integration:* OpenClaw MCP, LangChain, or direct LLM API (OpenAI/Anthropic).
    *   *Comms:* SendGrid/Resend for Emails; Twilio for SMS (if phone support is implemented).
*   **Cron/Worker System:** A reliable background task runner (e.g., BullMQ or standard cron) to fetch data, run the LLM synthesis, and batch-send notifications based on user preferences.

## 5. Implementation Phases
*   **Phase 1: Core Engine & Data Pipeline:** Set up Node/TS backend, integrate FRED API, and build the macro classifier and AI synthesis logic.
*   **Phase 2: Subscription & Verification:** Build the database schema for users, implement the email/phone verification loop, and the preference center logic.
*   **Phase 3: Web Application:** Develop the frontend landing page and public dashboard to capture leads.
*   **Phase 4: Notification System:** Implement the cron jobs for Daily/Weekly distributions, logic for "Urgent Alerts," and the secure unsubscribe flow.
