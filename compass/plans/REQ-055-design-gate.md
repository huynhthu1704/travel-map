# Plan: REQ-055 — an approved design before any code

Requirements: REQ-055 · Test cases: TC-112 · Intent: intent/2026-11-26-design-and-plan-before-code.md
Design: none: process change, no UI · PR 3 of 5 (on top of REQ-054)

## Files
- `compass/design/README.md` (new) — when, how and the template (screens ↔ REQ ids, states, Figma frame links, Status)
- `compass/build-views.mjs` — `designProblems` (from REQ-052) and a `Design:` line in requirements.md
- `compass/check-spec.mjs` — runs it
- `tests/design.test.mjs` (new) — TC-112
- `AGENTS.md` (step 1b), `compass/agent-knowledge.md`, `.claude/skills/deliver-change/SKILL.md`
- `compass/spec.json` (TC-112 Passing), `compass/requirements.md`, `compass/tests.md`

## Steps
1. Add the design folder and template; each requirement gets `"design"` (a file, or `"none: <reason>"`).
2. `designProblems`: missing design past Draft, missing file, file that does not mention the requirement, In build or
   Done with a design that is not Approved. REQ-101–153 and older requirements are exempt.
3. Update the agent docs; add TC-112; run build-views, npm test, check-spec.

## Risks
- Blocks work on REQ-052+ until a design exists. Mitigation: Draft requirements are not checked; changes without UI
  say `"none: <reason>"`.
- A design file can be approved without matching the screens built. Mitigation: the independent reviewer compares the
  diff with the design; the plan names the screens.

## Proof
- `npm test`: TC-112 in `tests/design.test.mjs` (each problem case, exemptions, `none:`, approved design passes,
  template and AGENTS.md step present).
- `node compass/check-spec.mjs` shows no design problem: REQ-052–055 carry `"design": "none: process change, no UI"`.
