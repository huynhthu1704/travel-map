# Plan: REQ-052 (part 2) — move REVIEW.md into compass/ and fix the remaining links

Requirements: REQ-052 · Test cases: TC-109 · Intent: compass/intent/2026-11-26-design-and-plan-before-code.md
Design: none: process change, no UI · PR 5 of 5 (on top of the intent move)

## Files
- `REVIEW.md` → `compass/REVIEW.md` (move)
- `compass/build-views.mjs` + regenerated `compass/handover.md` — the role table links compass/REVIEW.md
- `AGENTS.md`, `CLAUDE.md`, `compass/agent-knowledge.md`, `.claude/skills/deliver-change/SKILL.md` — links to
  compass/REVIEW.md and compass/intent/
- `.github/pull_request_template.md` — Intent, Design and Plan file lines; review link
- `tests/reviewPolicy.test.mjs` (new path + TC-109 part 2), `tests/plan.test.mjs` (new path)

## Steps
1. `git mv REVIEW.md compass/REVIEW.md`; replace every link to REVIEW.md and to the old intent folder.
2. Regenerate the handover; add the TC-109 checks; run build-views, npm test, check-spec.

## Risks
- The move counts as a deletion, so the PR needs the `human-approved` label. Mitigation: the Product Owner asked for it.
- A missed link. Mitigation: TC-109 checks the main docs, and a grep for `REVIEW.md` / `intent/` outside compass/ is clean.

## Proof
- `npm test`: TC-058, TC-067 and TC-109 read compass/REVIEW.md; the root file is gone.
- `node compass/check-spec.mjs` passes once the intent is approved (handover regenerated).
