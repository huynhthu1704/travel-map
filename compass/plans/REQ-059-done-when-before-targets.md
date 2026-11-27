# Plan: REQ-059 — every intent has a "Done when"; targets only for bets

Requirements: REQ-059 · Test cases: TC-070 · Intent: intent/2026-11-27-done-when-before-targets.md
Design: none: process text and a spec check, no UI · Issue #142 · Decision: ADR-021

## Files
- `compass/intent/README.md` — the business-intent rule and the template: `## Done when` (required), the three kinds
  of change (small feature → optional signal to watch, no target; process → Done when only; bet → one metric with
  its current value, target set after real data)
- `AGENTS.md`, `.claude/skills/deliver-change/SKILL.md` — the same rule in one line each
- `compass/build-views.mjs` — `needProblems` also requires `## Done when` in intents of REQ-059 on
- `tests/intent.test.mjs` — TC-070
- `compass/intent/2026-11-27-done-when-before-targets.md`, `compass/spec.json` (REQ-059, TC-070, ADR-021) and the
  generated views (requirements.md, tests.md, decisions.md, handover.md)

## Steps
1. Plan (this file), then the template, AGENTS.md and the skill.
2. `DONE_WHEN_REQUIRED_FROM = 59` in `needProblems`; TC-070 covers the check and that the three texts agree.
3. Spec, ADR-021, `node compass/build-views.mjs`.

## Risks
- Older approved intents have no "Done when": the check only applies from REQ-059, so nothing old fails.
- `compass/agent-knowledge.md` still says "measurable business intent": updated in a small follow-up PR to keep this
  PR within 12 files.

## Proof
- `npm test` (TC-070 and the existing intent tests), `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main`, `node compass/plan-file.mjs origin/main`.
