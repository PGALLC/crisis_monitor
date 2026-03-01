# STORY-000: Hello World & C3P Pipeline Validation

**Description:** As a platform engineer, I need to validate the C3P deployment pipeline end-to-end using a simple "Hello World" application before writing complex business logic. The target infrastructure is Google Cloud Platform (GCP) using Kubernetes (GKE), with GitHub Actions acting as the CI/CD orchestrator.

**Requirements:**
- Initialize a basic Node.js / TypeScript web server (e.g., Express or Next.js) that returns "Hello World".
- Create a basic unit test (testing a dummy function).
- Create a basic functional test (testing the / endpoint response).
- Create a basic smoke test.
- **CI/CD Pipeline (GitHub Actions):**
  - Build a Docker container image for the app.
  - Store the built image artifact securely (e.g., GitHub Container Registry - GHCR).
  - Deploy to a Test environment (GCP/Kubernetes) automatically.
  - Pause and require the SRE Approval Gate.
  - Deploy to the Production environment (GCP/Kubernetes).

**Acceptance Criteria:**
- The Coder agent opens a PR for the Hello World app linked to STORY-000.
- The CI pipeline runs unit tests on the PR.
- The PR is reviewed and merged into `main`.
- The CI pipeline successfully builds the Docker image and publishes it to GHCR.
- The CI pipeline successfully deploys the image to the GKE Test cluster and passes functional tests.
- The CI pipeline pauses for `C3P-SRE` approval via GitHub Environments.
- The CI pipeline successfully deploys the image to the GKE Production cluster and passes smoke tests.
- A final C3P Evidence Pack (or equivalent pipeline log) is visible in GitHub Actions.
