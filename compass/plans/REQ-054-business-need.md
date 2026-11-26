# Plan: REQ-054 — revise the business need into a business intent

Requirements: REQ-054 · Test cases: TC-111 · Intent: intent/2026-11-26-design-and-plan-before-code.md
Design: none: process change, no UI · PR 2 of 5 (on top of REQ-053)

## Files
- `intent/README.md` — template gets `## Business need`; `## What we want` asks for a measurable business intent
- `compass/build-views.mjs` — `needProblems` (intents of REQ-052 on need a `## Business need` section)
- `compass/check-spec.mjs` — runs it
- `tests/intent.test.mjs` — TC-111 and the new AGENTS.md wording
- `AGENTS.md`, `compass/agent-knowledge.md`, `.claude/skills/deliver-change/SKILL.md`, `CLAUDE.md` — need → intent and plan-file steps
- `compass/spec.json` (TC-111 Passing), `compass/tests.md`

## Steps
1. Extend the intent template and flow; keep older intents valid (only REQ-052 on is checked).
2. Add `needProblems` to build-views and call it from check-spec.
3. Update the agent docs; add TC-111; run build-views, npm test, check-spec.

## Risks
- An intent shared by old and new requirements would now need the section. Mitigation: only intents linked from
  REQ-052 on (outside the REQ-101–153 baseline) are checked, each once.
- Agents may paraphrase her words. Mitigation: the template says "in her own words"; the reviewer checks it.

## Proof
- `npm test`: TC-111 in `tests/intent.test.mjs` (missing section reported, present section accepted, old intents
  exempt, template has the section) and TC-063 with the new AGENTS.md step.
- `node compass/check-spec.mjs` reports no need problem for the 2026-11-26 intent (it has the section).
