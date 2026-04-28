# Security Incident Record: DEVOPS.md Purge

**Date:** 2026-04-27  
**Actor:** Platform Engineer  

## Summary

`DEVOPS.md` contained sensitive infrastructure details (server IPs, hostnames, service URLs, account mappings) that were inadvertently committed to the public repository.

## Action Taken

1. Rewrote git history using `git-filter-repo --path DEVOPS.md --invert-paths --force` to strip the file from all 93 commits.
2. Force-pushed the rewritten history to `origin/main`.
3. Deleted orphaned remote branch `feature/STORY-002-rules-engine` whose ancestry referenced the pre-rewrite history.

## Why Branch Protection Was Bypassed

The `main` branch protection rules (no force-push, PR-required, status-check-required) had to be temporarily bypassed by the organization owner. This was necessary because:

- History rewrites produce entirely new commit SHAs, making a normal PR impossible.
- The force-push is the only valid way to replace the compromised history.

This bypass was performed **solely for security remediation** — removing leaked infrastructure details from public visibility. Normal C3P branch protection rules have been restored.

## Verification

- `git log --all --oneline -- DEVOPS.md` → 0 results
- `git rev-list --objects --all | grep DEVOPS.md` → 0 results
- Old objects will be garbage-collected by GitHub within ~24 hours.

## Remaining Risk

Until GitHub completes garbage collection (~24h), anyone holding a pre-rewrite clone can still access the old objects. All collaborators should re-clone immediately.
