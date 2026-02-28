# Crisis Monitor - Developer Agent Instructions

You are tasked with building the "Crisis Monitor" application. Before starting any work, you MUST read the `PRD.md` file in this directory to understand the full scope, architecture, and feature requirements.

## Tech Stack
*   **Backend:** Node.js, TypeScript
*   **Frontend:** React / Next.js
*   **Database:** PostgreSQL (using an ORM like Prisma or Drizzle)
*   **APIs:** FRED API (for macro data), LLM API (for synthesis), Email/SMS provider (Resend/SendGrid/Twilio)

## Operating Guidelines
1. **TypeScript First:** Ensure all code is strongly typed. Avoid `any`.
2. **Modular Architecture:** Separate the data ingestion engine, the LLM synthesis logic, and the user subscription/management system.
3. **Environment Variables:** Never hardcode API keys. Use a `.env` file for FRED API keys, LLM keys, and database connection strings.
4. **Resilience:** External API calls (FRED, News, LLM) will fail. Implement robust error handling, retries, and logging.
5. **Security:** Ensure the unsubscribe links are tokenized and secure. Handle user emails/phone numbers with care.

## Getting Started
1. Review `PRD.md`.
2. Initialize the project repository (e.g., Next.js full-stack setup or separate Express/React repos).
3. Propose a database schema for User Subscriptions and Preferences before implementing it.
4. Start with Phase 1: The Core Engine & Data Pipeline.

## C3P Deployment & Git Strategy
This project strictly follows the Continuous Compliance Control Protocol (C3P).
1. **Immutable History:** Never force push or rewrite history on the `main` branch.
2. **Traceability:** Every commit MUST reference a story ID from `tasks/backlog/` (e.g., `git commit -m "STORY-001: Implement FRED API client"`).
3. **Separation of Duties:** 
   - **Coder:** Writes code on feature branches (`feature/STORY-001`).
   - **Reviewer:** Reviews Pull Requests. The coder cannot merge their own code.
   - **Deployer:** A completely automated CI/CD pipeline (e.g., GitHub Actions). Humans do not have deployment access.
4. **Testing:** Unit tests (`npm run test:unit`) must be separate from functional/regression tests (`npm run test:functional`).
5. **Deployment:** Must use the `/scripts/deploy_test.sh` and `/scripts/deploy_prod.sh` scripts running strictly within the automated pipeline.
