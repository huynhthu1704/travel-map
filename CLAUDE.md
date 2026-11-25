# CLAUDE.md

Follow **AGENTS.md** — it is the contract for every agent working in this repo. Every PR also gets an
independent review per **REVIEW.md**. Key files: `compass/spec.json`, `compass/guardrails.json`, `compass/decisions.md`.

## Commands (each exits non-zero on failure)
- `npm test` — unit tests · `npm run test:e2e` — Playwright UI tests (locally: `PW_CHROME=/usr/bin/google-chrome npx playwright test`)
- `node compass/check-spec.mjs` — traceability, ADRs, stale handover · `node compass/build-views.mjs` — regenerate the compass/*.md views
- `node compass/check-guardrails.mjs origin/main` — the CI guardrails check, run locally before pushing

## Lessons learned (REQ-045)
When the same mistake happens twice, add one line here in the PR that fixes it. Keep this file under one page.
- **Piped checks hide failures:** `npm test | grep …` exits with grep's status. Use `set -o pipefail` or run the check on its own before `git commit`/`git push`.
- **Never force push** (it is blocked); push to a new branch name such as `-v2` and open a new PR.
- **Never commit build output** (`dist/`, `dist-e2e/`, `playwright-report/`, `test-results/`); check `git status` before committing.
- **The Compass portal overwrites `compass/spec.json` on main:** merge by requirement/test id, never take one side; then run `build-views`.
- **Branch every PR from fresh `main`.** Chained branches conflict after squash-merges (spec.json, tests.md, app.css).
- **Scripted text edits must assert the anchor exists** (a silent `str.replace` miss once dropped the `checkDue` flag).
- **`gh api … -F body=@file`** (capital F) sends the file content; `-f body=@file` sends the literal text.
- **E2E:** a second `openApp` in the same test does not reseed data (split the test); native dialogs are auto-accepted; external calls (Nominatim) are mocked.
- **A flaky UI test is a bug until proven otherwise** (bug #54 was a real race). Investigate before re-running; log the cause on the issue.
- **Excel formulas need cached values**, or amounts show blank in Protected View (`addFormulaValues`).
- **Paths in Node scripts:** use `fileURLToPath`/`realpath`, never `URL.pathname` (spaces, symlinks, Windows).

## Working knowledge (loaded automatically)

@compass/agent-knowledge.md
