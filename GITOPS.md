# GITOPS.md: The C3P Developer Workflow

This document outlines the strict, canonical Git and GitHub CLI (`gh`) workflow required for all developers (human or AI) contributing to this repository. 

To maintain the Continuous Compliance Control Protocol (C3P), **no code is ever pushed directly to `main`**. All work must happen on feature branches, be tied to a Story ID, and pass through the Pull Request review firewall.

---

## Phase 1: The Coder (Creating & Proposing)

As a Developer, your job is to branch from `main`, write the code, and propose it via a Pull Request.

**1. Start fresh from main**
Always ensure your local repository is up to date before starting new work.
```bash
git checkout main
git pull origin main
```

**2. Create the feature branch**
Your branch name **must** include the Story ID for traceability.
```bash
git checkout -b feature/STORY-000-short-description
```

**3. Work, add, and commit**
Write your code and tests. When committing, reference the Story ID in the commit message.
```bash
git add .
git commit -m "STORY-000: Implement new feature X"
```

**4. Push the branch to GitHub**
```bash
git push -u origin feature/STORY-000-short-description
```

**5. Create the Pull Request**
Use the GitHub CLI to open the PR. Ensure the title includes the Story ID.
```bash
gh pr create --title "STORY-000: Short description of feature" --body "Detailed explanation of what was built and how it meets the acceptance criteria."
```
*(Your job as the Coder is now paused. You must wait for the Reviewer.)*

---

## Phase 2: The Reviewer (Approving & Merging)

As the Reviewer (acting via a separate, privileged identity), your job is to enforce quality and security, then merge the code.

**1. Find and review the PR**
List open PRs and view the diff of the specific PR (e.g., PR #2) directly from the terminal or the web UI.
```bash
gh pr list
gh pr diff 2
```

**2. Approve the PR**
If the code meets the C3P standards, officially approve it. This satisfies the branch protection rule and writes your identity into the audit log.
```bash
gh pr review 2 --approve --body "LGTM. Tests pass, C3P standards met."
```

**3. Merge and Clean Up**
Merge the PR into `main` on the server, and automatically delete the feature branch on GitHub to keep the repository clean.
```bash
gh pr merge 2 --merge --delete-branch
```

---

## Phase 3: The Coder (Local Cleanup)

Once the Reviewer has merged the PR, the Coder must clean up their local environment before starting the next story.

**1. Switch to main and pull the merged code**
```bash
git checkout main
git pull origin main
```

**2. Delete the stale local branch**
Because the Reviewer deleted the remote branch during the merge, you should delete your local copy so your workspace doesn't get cluttered.
```bash
git branch -d feature/STORY-000-short-description
```

You are now ready to start Phase 1 again for the next Story!

## Global Issue Management Rules
To preserve the immutable requirement history and audit trails:
1. **NEVER edit the original body description of a GitHub Issue.**
2. If you need to add findings, correct assumptions, or communicate with other roles, you must add a **comment** to the issue using `gh issue comment <number> -b "Your comment here"`.
