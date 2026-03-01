# STORY-000: Hello World & C3P Pipeline Validation

**Description:** As a platform engineer, I need to validate the C3P deployment pipeline end-to-end using a simple "Hello World" application before writing complex business logic.

**Requirements:**
- Initialize a basic Node.js / TypeScript web server (e.g., Express or Next.js) that returns "Hello World".
- Create a basic unit test (testing a dummy function).
- Create a basic functional test (testing the / endpoint response).
- Create a basic smoke test.
- Configure the GitHub Actions workflow to run the C3P pipeline (Build -> Test -> Deploy to Test -> Functional Test -> Deploy to Prod -> Smoke Test).

**Acceptance Criteria:**
- The developer opens a PR for the Hello World app linked to STORY-000.
- The CI pipeline runs unit tests on the PR.
- The PR is reviewed and merged into `main`.
- The CI pipeline successfully deploys the app to the Test environment and passes functional tests.
- The CI pipeline successfully deploys the app to the Production environment and passes smoke tests.
- A final C3P Evidence Pack (or equivalent pipeline log) is visible in GitHub Actions.
