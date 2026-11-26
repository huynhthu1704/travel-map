# Plan: REQ-056 follow-ups — bug #104 and review notes

Requirements: REQ-056 · Test cases: TC-114 · Intent: intent/2026-11-26-checklist-in-excel.md
Design: design/2026-11-26-checklist-in-excel.md · Bug #104 · Requested by the Product Owner in chat (2026-11-26)

## Files
- `tests/tripExcel.test.mjs` — commit 1: failing test for #104 (not edited afterwards, REQ-043)
- `src/lib/tripExcel.js` — "everyone ticks" counts only ticks of `trip.memberIds` (all ticks when no members are known)
- `src/lib/store.js` — data-model comment for checklist items (scope, doneMap, ownerUid, ownerName, due)
- `.claude/skills/trip-excel-export/SKILL.md` — Checklist sheet, its options and the privacy filter
- `compass/intent/2026-11-26-checklist-in-excel.md` — constraints follow ADR-017 (no new flag; sheet "Checklist")
- `compass/design/2026-11-26-checklist-in-excel.md`, `compass/spec.json` (+ requirements.md) — the colour of an
  "everyone ticks" item follows the whole group (red until every member ticked); Figma note updated the same way
- `compass/agent-knowledge.md` — Excel decision row mentions the Checklist sheet

## Steps
1. Failing test (#104) → fix in the builder → `npm test` green.
2. Documentation and spec wording; build-views.

## Risks
- Members missing on old trips: when `memberIds` is empty no tick is dropped (same as before).
- Wording-only design clarification, no behaviour change: matches the approved rule that such an item counts as
  done when every member ticked.

## Proof
- `npm test` (TC-114 incl. #104), `node compass/test-first.mjs origin/main --bug`, `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main`.
