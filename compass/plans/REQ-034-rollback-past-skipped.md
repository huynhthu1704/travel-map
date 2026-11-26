# Plan: REQ-034 — the deploy rollback finds the last good version after many skipped deploys (bug #110)

Requirements: REQ-034 · Test cases: TC-116 · Issue #110 (bug) · Design: none: CI workflow, no UI
Protected path `.github/workflows/compass-deploy.yml`: needs the Product Owner's approval in chat and the
`human-approved` label.

## Files
- `tests/deployRollback.test.mjs` — TC-116 (commit 1, the failing test): runs the real rollback script from the
  workflow against a fake `gh` with 30 skipped deploys (REQ-058) before the last good one.
- `.github/workflows/compass-deploy.yml` (protected) — the rollback job pages through the successful Compass Deploy
  runs, 100 per page and up to 10 pages, instead of looking at only the 20 newest; it reads the commit from the
  list itself and skips the failed commit before asking for a run's jobs.
- `compass/spec.json` (TC-116, ADR-019) and the generated views.

## Steps
1. Commit the failing test (TC-116) on its own.
2. Change the rollback loop: `for page in 1..10`, `per_page=100&page=$page`, stop when a page is empty; for each run
   (newest first) skip the failed commit, then take the first one whose `smoke-test` job succeeded (`break 2`).
3. TC-116 and ADR-019 in spec.json, `node compass/build-views.mjs`; label `bug` and `human-approved` on the PR.

## Risks
- More API calls in a rollback (one jobs call per skipped run). At most 1,000 runs are read; the workflow token
  allows 1,000 requests per hour per repository, and the loop stops at the first good run, which is normally a
  few runs back. Only runs after a failed smoke test, which is rare.
- A GitHub API error still fails the step (bash -e), as before: nothing is redeployed and the run shows red.
- Manual runs keep their rule: they never roll back by themselves (no loops).

## Proof
- TC-116 fails on main (no redeploy after 30 skipped runs) and passes with the fix; TC-055/TC-115 still pass.
- `npm test`, `node compass/test-first.mjs origin/main --bug`, `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main` (with the `human-approved` label in CI). The workflow YAML parses.
