# Plan: REQ-044 — weekly security scan of the code and libraries

Requirements: REQ-044 · Test cases: TC-117, TC-118 · Intent: intent/2026-11-25-ai-native-sdlc.md
Design: none: scheduled CI job, no UI · Issue #68 · Protected path approved by the Product Owner (2026-11-26):
a new workflow with npm audit + CodeQL; dismissal = close as "not planned" with a `Dismissed:` comment.

## Files
- `.github/workflows/compass-security.yml` (new, protected) — every Monday 08:00 VN time and on demand: CodeQL
  (javascript-typescript, security-extended) uploads to code scanning; then the report job runs the script.
- `compass/security-scan.mjs` (new) — runs `npm audit --json`, reads open CodeQL alerts, and syncs GitHub issues
  (labels `bug`, `security`, `severity:<level>`), one per finding, matched by a hidden `security-finding` marker.
- `tests/security-scan.test.mjs` (new) — TC-117 (findings → issues, severity, close when gone), TC-118 (dismissal
  needs a reason; workflow schedule and permissions).
- `compass/intent/2026-11-25-ai-native-sdlc.md` — #68 taken off hold
- `compass/spec.json` (REQ-044, TC-117, TC-118, ADR-019) and the generated views; `compass/agent-knowledge.md`

## Steps
1. Pure functions `npmFindings`, `codeqlFindings`, `planActions` + a thin GitHub API runner (dry-run supported).
2. Workflow with least-privilege permissions per job; the report runs even if CodeQL fails (npm part still works,
   CodeQL issues are then left untouched).
3. Tests, spec, ADR-019, build-views; label `human-approved` on the PR.

## Risks
- First run opens issues for the known #56 findings (firebase → @grpc/grpc-js, Vite 5). Expected; Christine can
  dismiss them with a reason.
- If GitHub's CodeQL "default setup" is turned on, the advanced upload is refused → the CodeQL job fails, the npm part
  still reports. Fix: turn default setup off (Settings → Code security).
- A failed source (audit or alerts API) never closes that source's issues (no false "fixed").

## Proof
- `npm test` (TC-117, TC-118), `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`,
  `DRY_RUN=1 node compass/security-scan.mjs` locally; after merge: run the workflow once by hand.
