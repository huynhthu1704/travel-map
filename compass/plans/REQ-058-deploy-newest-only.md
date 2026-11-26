# Plan: REQ-058 — automatic deploys publish only the newest commit of main

Requirements: REQ-058 · Test cases: TC-115 · Intent: intent/2026-11-26-deploy-newest-only.md
Design: none: CI workflow, no UI · Issue #106 · Protected path approved by the Product Owner (2026-11-26)

## Files
- `.github/workflows/compass-deploy.yml` (protected) — the build job asks GitHub for the current head of `main`; an
  automatic (workflow_run) deploy of any other commit sets `skip=true`, writes a notice and skips build, deploy and
  smoke test. Manual runs are unchanged.
- `tests/cicd.test.mjs` — TC-115
- `compass/agent-knowledge.md` — section 6 describes the rule
- `compass/intent/2026-11-26-deploy-newest-only.md`, `compass/spec.json` (REQ-058, TC-115, ADR-018) and the
  generated views

## Steps
1. Add the head-of-main check to the "Pick the commit to deploy" step (gh api with the workflow token).
2. Guard the build steps and the deploy / smoke-test jobs with the skip output; rollback stays `failure()` only.
3. TC-115; spec, ADR-018, build-views; label `human-approved` on the PR.

## Risks
- A newer commit's CI fails → the older green commit is no longer deployed either. Accepted: the site keeps the last
  deployed version; nothing newer than main can go live anyway, and a manual deploy still works.
- The GitHub API call fails → the step fails and nothing is deployed (no silent wrong deploy); rerun the workflow.
- Every push to main runs Compass CI (push: branches [main]), so the head commit always gets its own deploy.

## Proof
- `npm test` (TC-115 and the existing TC-055/056 deploy checks), `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main`; after merge: the run for this PR's merge commit deploys normally.
