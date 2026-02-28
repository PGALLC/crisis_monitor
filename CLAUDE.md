# Crisis Monitor - Claude Code Instructions

You are building the "Crisis Monitor" web application.

## Core Context
Read `PRD.md` in this directory for the complete Product Requirements Document. The goal is to build an automated macro-economic tracking system with a robust user subscription and notification engine.

## Stack & Conventions
- **Language:** TypeScript (Strict mode enabled).
- **Environment:** Node.js backend, modern React frontend (Next.js preferred for full-stack simplicity).
- **Database:** PostgreSQL (Prisma or Drizzle ORM).
- **Tasks:**
  - Data pipelines (FRED API, Financial APIs).
  - Background workers (Cron/BullMQ) for daily reporting.
  - User auth & verification loops (Email/Phone).

## Instructions for Claude
1. Start by initializing the project framework and configuring TypeScript.
2. Outline your proposed database schema to the user before applying migrations.
3. Keep your commits atomic and descriptive.
4. When integrating the AI Research Agent component, ensure prompts are cleanly separated from application logic.
5. Prioritize the backend data engine and the user subscription/verification flow as the foundational pieces.

## C3P Deployment & Git Strategy
This project strictly follows the Continuous Compliance Control Protocol (C3P).
1. **Traceability:** Every code change must be linked to a story from `tasks/backlog/`. Include the story ID in your branch names and commit messages.
2. **Separation of Duties:** You act as the **Coder**. Do not attempt to deploy to production or merge into `main` directly. Open PRs for a **Reviewer**.
3. **Testing:** Clearly separate unit tests from regression/functional tests in the directory structure.
4. **Automation:** The **Deployer** is the automated pipeline using `scripts/deploy_test.sh` and `scripts/deploy_prod.sh`.
