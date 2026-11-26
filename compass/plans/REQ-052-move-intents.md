# Plan: REQ-052 (part 1) — move intent/ into compass/intent/

Requirements: REQ-052 · Test cases: TC-109 · Intent: compass/intent/2026-11-26-design-and-plan-before-code.md
Design: none: process change, no UI · PR 4 of 5 (on top of REQ-055); part 2 moves REVIEW.md

## Files
- `intent/README.md`, `intent/2026-11-25-ai-native-sdlc.md`, `intent/2026-11-26-design-and-plan-before-code.md` → `compass/intent/` (moves; the README also mentions the design step)
- `compass/build-views.mjs` — intent paths must look like `compass/intent/<file>.md`
- `compass/spec.json` — every `"intent"` path, TC-109 Passing; regenerated `compass/requirements.md`, `compass/tests.md`
- `tests/intent.test.mjs` — new paths and TC-109

## Steps
1. `git mv` the three intent files; update the spec paths and the path rule in build-views.
2. Update the tests; add TC-109; run build-views, npm test, check-spec.
3. `AGENTS.md`, `compass/agent-knowledge.md`, the deliver-change skill and the PR template still say `intent/`; PR 5
   updates them together with the REVIEW.md move (12-file limit).

## Risks
- Three moves count as six changed files and as deletions, so the PR needs the `human-approved` label. Mitigation:
  the Product Owner asked for the move; she adds the label.
- Between PR 4 and PR 5, AGENTS.md, agent-knowledge and the skill point to the old intent folder. Mitigation: merge PR 5 right after.

## Proof
- `npm test`: TC-109 and TC-063/TC-111 with the new paths.
- `node compass/check-spec.mjs`: every intent path resolves under `compass/intent/`.
