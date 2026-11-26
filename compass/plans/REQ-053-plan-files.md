# Plan: REQ-053 — a plan file for every change that touches code

Requirements: REQ-053 (and the Draft REQ-052, REQ-054, REQ-055 entries) · Test cases: TC-110 (TC-109, TC-111, TC-112 Not run)
Intent: intent/2026-11-26-design-and-plan-before-code.md (Draft) · Design: none: process change, no UI
PR 1 of 5 — next: REQ-054 business need, REQ-055 design gate, REQ-052 move intent/ and REVIEW.md into compass/.

## Files
- `intent/2026-11-26-design-and-plan-before-code.md` — the intent for the five PRs (Draft until the Product Owner approves)
- `compass/spec.json` — REQ-052–055 (Draft), TC-109–112, ADR-015 (Proposed); regenerated `requirements.md`, `tests.md`, `decisions.md`, `handover.md`
- `compass/plans/README.md` (new) — template and rule; `compass/plans/REQ-053-plan-files.md` — this plan
- `compass/plan-file.mjs` (new) — plan file checker (local command + functions)
- `compass/merge-pr.mjs` — refuses a code PR without a complete plan file; names it in the squash message
- `tests/plan.test.mjs` — TC-110, and the TC-067 fixture now carries a plan file
- `AGENTS.md` — step 2b and the command list

## Steps
1. Add the intent (Draft) and the spec entries for all four requirements, so later PRs only flip test statuses.
2. Write `compass/plan-file.mjs` (missing sections, placeholders, plan text from PR patches) and call it from merge-pr.
3. Document `compass/plans/` and the AGENTS.md step; add TC-110; run build-views, npm test, check-spec.

## Risks
- The CI guardrails check still reads only the PR body Plan (protected file, unchanged). Mitigation: merge-pr checks
  the plan file; the PR body keeps the four short lines.
- The spec check fails while the intent is Draft. Mitigation: that is the intended gate; the Product Owner approves the
  intent, then REQ-052–055 move to In build and ADR-015 to Accepted.
- PRs already open when this merges need a plan file before merge-pr will merge them. Mitigation: add one; it is one file.

## Proof
- `npm test`: TC-110 in `tests/plan.test.mjs` (missing file, empty sections, placeholders, README not a plan, docs-only
  PR, plan text from a patch, merge-pr blocker and commit message) and the updated TC-067.
- `node compass/plan-file.mjs origin/main` passes on this branch.
