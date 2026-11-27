# Plan: REQ-059 — every intent has a "Done when"; targets only for bets

Requirements: REQ-059 · Test cases: TC-070 · Intent: intent/2026-11-27-done-when-before-targets.md
Design: none: process text and a spec check, no UI · Issue #142 · Decision: ADR-021

## Files
- `compass/intent/README.md` — the business-intent rule and the template: `## Done when` (required), the three kinds
  of change (small feature → optional signal to watch, no target; process → Done when only; bet → one metric with
  its current value, target set after real data)
- `AGENTS.md`, `.claude/skills/deliver-change/SKILL.md` — the same rule in one line each
- `tests/intent.test.mjs` — TC-070; TC-063 now expects `## Done when` instead of `## Success measure`
- `compass/intent/2026-11-27-done-when-before-targets.md`, `compass/spec.json` (REQ-059, TC-070, ADR-021) and the
  generated views (requirements.md, tests.md, decisions.md, handover.md)

## Steps
1. Plan (this file), then the template, AGENTS.md and the skill.
2. TC-070: the three texts agree and the template asks for no baseline → target.
3. Spec, ADR-021, `node compass/build-views.mjs`.

## Risks
- Older approved intents have no "Done when": nothing in this PR checks them; the PR 2/2 check applies only from
  REQ-059, so nothing old will fail.
- REQ-054 (Done) asked the template for "baseline → target": its story and AC 2 are amended to point to REQ-059 /
  ADR-021, matching the weakened TC-111 check.
- Split to stay within 12 files: this PR delivers AC 1–3 (the rule text). A follow-up PR delivers AC 4 (`check-spec`
  requires `## Done when` from REQ-059, with the EV-038 control eval updated) and `compass/agent-knowledge.md`.
  REQ-059 stays In build until then.

## Proof
- `npm test` (TC-070 and the existing intent tests), `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main`, `node compass/plan-file.mjs origin/main`.
