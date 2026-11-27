# Plan: REQ-034 — the deploy rollback finds the last good version after many skipped deploys (bug #110)

Requirements: REQ-034 · Test cases: TC-124 · Decision: ADR-024 · Issue #110 (bug) · Design: none: CI workflow, no UI
Protected path `.github/workflows/compass-deploy.yml`: approved by the Product Owner in chat on 2026-11-27; the PR
carries the `human-approved` label. Replaces PRs #147 and #148, whose TC/ADR ids clashed with ids main took in the meantime.

## Files
- `tests/deployRollback.test.mjs` — TC-124 (commit 1, the failing test): runs the real rollback script from the
  workflow against a fake `gh` (paged runs, jobs per run, real jq) with 30 and 130 skipped deploys (REQ-058) before
  the last good one.
- `.github/workflows/compass-deploy.yml` (protected) — the rollback job pages through the successful Compass Deploy
  runs, 100 per page and up to 5 pages, instead of looking at only the 20 newest; it reads the commit from the list
  itself and skips the failed commit before asking for a run's jobs.
- `compass/spec.json` (TC-124, ADR-024) and the generated views.

## Steps
1. Commit the failing test (TC-124) on its own.
2. Change the rollback loop: `for page in 1..5`, `per_page=100&page=$page`, stop when a page is empty; for each run
   (newest first) skip the failed commit, then take the first one whose `smoke-test` job succeeded (`break 2`).
3. TC-124 and ADR-024 in spec.json, `node compass/build-views.mjs`; labels `bug` and `human-approved` on the PR.

## Risks
- More API calls in a rollback (one jobs call per skipped run passed). The cap of 5 pages keeps the worst case at
  about 505 calls, under the workflow token's 1,000 requests per hour, so the step can still open the bug issue.
  The loop stops at the first good run, normally a few runs back.
- A GitHub API error still fails the step (bash -e), as before: nothing is redeployed and the run shows red.
- Manual runs keep their rule: they never roll back by themselves (no loops).

## Proof
- TC-124 fails on main (no redeploy after 30 or 130 skipped runs) and passes with the fix; the 130-run case reads
  exactly 2 pages; TC-055/TC-115 still pass.
- `npm test`, `node compass/test-first.mjs origin/main --bug`, `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main` (with the `human-approved` label in CI). The workflow YAML parses.
