# DEVOPS.md: Continuous Compliance Control Protocol (C3P) Setup

This document outlines the C3P (Continuous Compliance Control Protocol) methodology used for the Crisis Monitor project and provides step-by-step instructions for configuring the repository and deployment environments.

## 1. The C3P Philosophy
C3P ensures an audit-grade system of record by embedding compliance directly into the CI/CD pipeline. 
*   **Immutable History:** The requirements (Stories) and code history (Git) are completely immutable.
*   **Separation of Duties (4-Actor Model):** 
    *   **Coder:** Writes application code on feature branches. Cannot merge, cannot deploy, and *cannot alter CI/CD workflows*.
    *   **Reviewer:** Reviews and approves Pull Requests. Cannot deploy.
    *   **Platform Engineer:** The only role authorized to create or modify the automated CI/CD pipelines (`.github/workflows/*.yml`).
    *   **SRE (Site Reliability Engineer):** Acts as the final gatekeeper for Production deployments.
*   **Deployer (Automation):** A heavily restricted, automated CI/CD pipeline that handles artifact storage, testing, and deployment.
*   **Evidence Pack:** Every release automatically generates proof of the Story ID, PR approval, code review, test results, and deployment approval.

## 2. Order of Operations: Setup Checklist (Watertight Method)
To ensure the chain of custody is cryptographically secure from **Commit Zero**, we must initialize the repository on GitHub first, lock it down, and force even the initial files through the C3P Pull Request process.

### Phase 1: Initial C3P Framework Setup
This phase establishes the repository, locks it down, and merges the initial documentation via a strict Pull Request to prove the C3P firewall works.

- [x] **Step 1: Create the GitHub Repository (With Initialization)**
  - From your Organization Owner account, create a new, private repository named `crisis_monitor` within your GitHub Team/Organization.
  - **CRITICAL:** Check the box that says **"Add a README file"**. This instantly creates the `main` branch so we can protect it immediately.
- [x] **Step 2: Lock Down the Branch (C3P Branch Protection)**
  - Logged in as the Organization Owner, go to Repo Settings > Branches. Add a rule for `main`.
  - Enable "Require a pull request before merging" (Require approvals: 1).
  - Enable "Do not allow bypassing the above settings" (Crucial).
  - Enable "Restrict deletions" and "Block force pushes".
  - *Result: The repo is now 100% locked. No one, not even you, can push directly to main.*
- [x] **Step 3: Create the Identity Accounts (Coder & SRE)**
  - Create a completely separate GitHub account named `C3P-Coder`.
  - Create a completely separate GitHub account named `C3P-SRE` (or assign a dedicated human team member).
  - From your Organization Owner account, invite `C3P-Coder` as a Collaborator with "Write" access to the repository.
  - Invite `C3P-SRE` as a Collaborator with "Read" access (they only need to approve deployments, not push code).
  - Log in to both accounts and accept the invitations.
- [x] **Step 4: Generate Personal Access Tokens (PATs)**
  - **Token 1 (The Coder):** Logged in as `C3P-Coder`, go to Developer Settings > Personal access tokens > Tokens (classic). Create a **Classic PAT**. Check the `repo` and `read:org` scopes. Give this to Marvin.
    - *Why a Classic PAT?* Fine-Grained PATs cannot access repositories owned by a different personal/org account. Because `C3P-Coder` is a dedicated dummy account with no other access, a Classic PAT is perfectly secure here.
    - *Why a PAT and not an SSH key?* An SSH key can only push code. The Coder agent must be able to interact with the GitHub API (via `gh` CLI) to programmatically open Pull Requests. The PAT serves as both the Git HTTPS password and the API token.
    - **CRITICAL SECURITY NOTE:** Ensure this token does **NOT** have the `workflow` scope. Coders must be physically blocked from tampering with the CI/CD machinery.
  - **Token 2 (The Reviewer):** Logged in as your Organization Owner account, generate a **Fine-Grained PAT**. 
    - *Organization Requirement:* In the top right corner of the Fine-Grained PAT creation screen, ensure the **"Resource owner"** dropdown is set to your Organization name (not your personal username).
    - If your Organization name is missing or disabled, go to your Organization Settings > Third-party Access > Personal access tokens > Settings, and check "Allow access via fine-grained personal access tokens".
    - Grant Read/Write to "Contents", "Pull requests", and "Workflows" on the `crisis_monitor` repo.
  - **Token 3 (The SRE):** Logged in as `C3P-SRE`, generate a token targeting the repository. This account just needs access to the web interface to click "Approve", so a token is only strictly necessary if the SRE is also an automated agent.
- [x] **Step 5: Clone and Authenticate Locally**
  - On Marvin, configure GitHub CLI authentication: `gh auth login`
  - Choose HTTPS and paste the **Coder PAT** when prompted (this configures git automatically).
  - Clone the repo: `git clone https://github.com/your-org-name/crisis_monitor.git`
  - Move your existing local files (PRD, DEVOPS, backlog, scripts) into this cloned folder.
- [x] **Step 6: The First C3P Pull Request**
  - Create a branch: `git checkout -b feature/STORY-000-init`
  - Commit the files: `git add . && git commit -m "STORY-000: Initial C3P framework and PRD"`
  - Push the branch: `git push -u origin feature/STORY-000-init`
  - Create the PR: `gh pr create --title "STORY-000: Initial C3P framework and PRD" --body "Setting up initial C3P methodology."`
  - Log in as the Organization Owner (or use your Reviewer LLM) to approve and merge this very first PR.

### Phase 2: Hello World App & Pipeline Validation
Once the initial PR is merged and the repository structure is locked, we validate the automated CI/CD deployment pipeline.

- [ ] **Step 7: Provision Environments**
  - Set up Test and Prod servers/services.
  - Add deployment secrets to GitHub Settings > Secrets and variables > Actions.
  - Configure GitHub Environments (Test, Production). 
  - **CRITICAL SRE GATE:** On the `Production` environment settings, add the `C3P-SRE` account as a Required Reviewer.
- [ ] **Step 8: Execute STORY-000-Hello-World**
  - The Coder agent creates a new branch `feature/STORY-000-Hello-World`.
  - The Coder agent generates the Hello World app and unit tests.
  - The Platform Engineer (Admin) commits the `.github/workflows/ci-cd.yml` file to the branch (as the Coder PAT lacks the `workflow` scope).
  - The Coder agent commits the app code, pushes, and creates a PR.
  - The Reviewer approves the PR.
  - The CI/CD pipeline automatically builds, tests, and deploys to Test.
  - The CI/CD pipeline pauses. The SRE logs in, reviews the Test environment/logs, and approves the Production deployment.
  - The CI/CD pipeline resumes and deploys to Prod.

## 3. GitHub Repository Configuration Reference

### A. Branch Protection Rules
1. Go to **Settings > Branches** and add a branch protection rule for `main`.
2. **Require a pull request before merging:** Enable this.
    *   Check "Require approvals" (Minimum: 1).
    *   Check "Dismiss stale pull request approvals when new commits are pushed".
3. **Require status checks to pass before merging:** Enable this.
    *   Require branches to be up to date before merging.
    *   Add your CI test jobs (e.g., `test-unit`, `test-functional`) as required status checks.
4. **Do not allow bypassing the above settings:** Ensure even administrators must follow the rules.
5. **Lock Branch History:** 
    *   Check "Restrict deletions".
    *   Check "Block force pushes".

### B. Environments & Secrets
1. Go to **Settings > Environments**.
2. Create two environments: `Test` and `Production`.
3. For the `Production` environment:
    *   Enable **Required reviewers** and add the `C3P-SRE` account.
4. Go to **Settings > Secrets and variables > Actions**.
    *   Add deployment secrets (e.g., `PROD_SSH_KEY`, `DOCKER_REGISTRY_TOKEN`, etc.) mapped specifically to their respective environments.

## 4. Production Environment Setup

The target environments (Test and Production) must be completely isolated from the Coder and Reviewer.

1. **Provision Infrastructure:** Provision separate servers/clusters for Test and Production (e.g., AWS EC2, DigitalOcean, or Vercel/Render for Next.js).
2. **Create Deployment Service Accounts:** Create a dedicated IAM role or service account for GitHub Actions. This account should only have the exact permissions needed to pull the built artifact and restart the service.
3. **Revoke Human Access:** Once the CI/CD pipeline is confirmed working, revoke your personal SSH/write access to the Production environment. All changes must flow through Git and the pipeline.

## 5. The CI/CD Pipeline (GitHub Actions)
The pipeline will execute the scripts located in `/scripts/`. 
*   **On PR creation:** Run `npm run test:unit`.
*   **On merge to main:** 
    1. Build the artifact.
    2. Execute `scripts/deploy_test.sh`.
    3. Run `npm run test:functional`.
    4. Upon success, pause for **SRE Environment Approval**.
    5. Execute `scripts/deploy_prod.sh`.
    6. Run `npm run test:smoke`.

## 6. Token Strategies for AI Agents (The 4-Actor Model)
To fully implement enterprise-grade Segregation of Duties (SoD), we use four cryptographically distinct identities.

### A. The "Coder" Token (Assigned to Marvin/Coding Agent via C3P-Coder account)
*   **Role:** Writes application code, pushes branches, opens Pull Requests.
*   **Permissions:** `repo` and `read:org` scopes on a Classic PAT. **Must exclude `workflow` scope.**
*   **Restriction:** Blocked by GitHub Branch Protection from pushing to or merging into `main`. Physically prevented from altering `.github/workflows/` files.

### B. The "Reviewer" Token (Assigned to the Reviewer LLM via Admin account)
*   **Role:** Reviews application code, approves PRs, and triggers the merge.
*   **Permissions:** Contents (Read/Write), Pull Requests (Read/Write).
*   **Restriction:** Prompted to *never* write code. Cannot approve its own PRs. Cannot push to Production (not listed as an SRE).

### C. The "Platform Engineer" Account (Assigned to Human Admin / DevOps)
*   **Role:** The architect of the automated CI/CD pipeline. The only entity legally allowed to create or edit `.github/workflows/*.yml` files.
*   **Permissions:** Full repository admin privileges (includes the `workflow` scope).
*   **Restriction:** Subject to the same Pull Request branch protection rules on `main`.

### D. The "SRE" Account (Assigned to a dedicated Ops human or SRE LLM)
*   **Role:** Reviews successful test deployments and manually approves the gate to Production.
*   **Permissions:** Needs only "Read" access to the repository to view logs and the Environments interface. 
*   **Restriction:** Cannot write code. Cannot merge PRs.

### E. The C3P Solution for Automated Agents (No Admin Access)
If you are using an automated coding agent (like Claude Code, OpenClaw, or Gemini CLI), **DO NOT grant it Admin access to the repository or install native integrations that demand Admin privileges.**
*   *Why?* Admin access allows an agent to alter branch protection rules or workflows, completely bypassing the C3P firewall and destroying the cryptographic proof of Segregation of Duties.
*   *The Solution:* Run the agent entirely within your local, restricted CLI environment (Step 5). By instructing the agent to run standard `git push` and `gh pr create` shell commands, it transparently inherits the heavily restricted `C3P-Coder` permissions.

## 7. Chain of Custody & Evidence Collection
To satisfy audit and immigration requirements regarding your C3P framework, we must systematically collect proof that this process was followed. 

### What constitutes a C3P Evidence Pack?
For every deployment, the following artifacts form an unbroken chain from Requirement -> Code -> Review -> Test -> Deployment:

1. **The Requirement:** The Story markdown file in `tasks/backlog/`.
2. **The Code:** The Git Commit Hash (SHA).
3. **The Review:** The GitHub PR approval record (showing the Coder identity and the distinct Reviewer identity).
4. **The Tests:** The CI/CD test execution logs (Unit, Functional, Smoke) marked as "Passed".
5. **The SRE Approval:** The GitHub Environment Approval log showing the distinct SRE identity unlocking the gate.
6. **The Deployment:** The CI/CD deployment execution logs indicating the specific Commit SHA was deployed to Production.

### How we will collect this evidence (Pending Decision)
*Note: We need to make an architectural decision on where to store these Evidence Packs so they are immutable and easily exportable for an auditor/lawyer.*

**Options to consider:**
1. **GitHub Actions Artifacts:** Have the CI pipeline bundle a JSON/PDF of the PR data and test logs and attach it as a build artifact to the workflow run. (Easiest, but expires after 90 days).
2. **Dedicated Evidence Repo / Branch:** Have the CI pipeline commit a signed `evidence-{SHA}.json` file into an isolated `evidence` branch or a completely separate GitHub repository. (Highly immutable, good for audits).
3. **External Log Store:** Push the evidence bundle to an external system like AWS S3 with Object Lock enabled, or a dedicated PostgreSQL evidence table.

*(Decision required: We will revisit this before closing STORY-005).*
