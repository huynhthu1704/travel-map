# Plan: REQ-059 (2/2) — check-spec requires "## Done when" in intents of REQ-059 on

Requirements: REQ-059 (AC 4) · Test cases: TC-070 · Intent: intent/2026-11-27-done-when-before-targets.md
Design: none: process text and a spec check, no UI · Issue #142 · Decision: ADR-021 · Part 1/2: PR #143

## Files
- `compass/build-views.mjs` — `DONE_WHEN_REQUIRED_FROM = 59`; `needProblems` reports a missing `## Done when` (one
  message per intent, together with a missing `## Business need`)
- `tests/intent.test.mjs` — TC-070 for AC 4; the AC 1–3 test also checks what each row of the README table says
  (review nit on #143)
- `compass/evals/cases.json` — new case EV-039 (an intent without Done when is blocked); the three spec fixtures that
  stand for a valid intent get a `## Done when` so they keep testing what they were written for
- `compass/intent/README.md` — the check line names the REQ-059 rule
- `compass/agent-knowledge.md` — section 4 describes Done when and "never invent a baseline or target"
- `compass/spec.json` (REQ-059 Done, TC-070 title, ADR-021 consequences) and the generated views

## Steps
1. Plan (this file).
2. The check, TC-070, EV-039 and the fixtures; README and agent-knowledge.
3. Spec, `node compass/build-views.mjs`.

## Risks
- Older intents have no Done when: the rule starts at REQ-059 and skips the REQ-101…153 baseline, so nothing on main
  fails (`check-spec` passes on this branch).
- Eval fixtures changed: only `## Done when` is added to fixtures of valid intents; no case is deleted or retired, and
  their expected results are unchanged.

## Proof
- `npm test` (TC-070, TC-111, TC-120 evals incl. EV-039), `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main`, `node compass/plan-file.mjs origin/main`.
