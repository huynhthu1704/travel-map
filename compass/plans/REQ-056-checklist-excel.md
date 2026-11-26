# Plan: REQ-056 — Checklist sheet in the trip Excel export

Requirements: REQ-056 · Test cases: TC-114 · Intent: intent/2026-11-26-checklist-in-excel.md
Design: design/2026-11-26-checklist-in-excel.md (Figma node 21-5, approved) · Issue #99 · PR 2 of 2

## Files
- `src/lib/tripExcel.js` — `buildTripWorkbook(…, { checklists, uid, today })` adds the "Checklist" sheet after the
  itinerary sheet; VI/EN labels; `exportTripExcel` unchanged apart from passing options through
- `src/lib/store.js` — `getChecklists(tripId, uid)` (Firebase: shared + my own lists, read once; demo: all, filtered
  by the builder) so the export does not depend on a live listener
- `src/pages/TripPlan.jsx`, `src/pages/TripCosts.jsx` — load the checklists and pass them with the user's uid
- `tests/tripExcel.test.mjs` — TC-114; `e2e/excel.spec.mjs` — the demo trip with a checklist now has 5 sheets
- `compass/spec.json` (REQ-056 Done, TC-114 Passing) and generated views

## Steps
1. Pure builder: filter lists (shared or `ownerUid === uid`), sort by phase (before → return, stable), one row per
   item: list (personal lists marked), when, item, for (group / everyone ticks / only <name> / personal), done
   (✓ or ticked/members), ticked by, due day (Before the trip / Day N · dd/mm / dd/mm/yyyy); red / yellow fill for
   overdue / due today via `dueStatus`; last row done/all. No sheet when there are no items.
2. Store read-once helper; both Excel buttons pass `checklists` and `uid`.
3. Tests: unit TC-114 (rows, order, per-person 2/4, privacy, empty, EN, fills); e2e sheet count.

## Risks
- Leaking another member's personal list. Mitigation: Firestore rules already block reading them; the builder
  filters again by `ownerUid` (demo mode keeps all lists locally) — covered by TC-114.
- Export fails if checklists cannot be read (e.g. view-only link). Mitigation: a failed read gives no Checklist
  sheet instead of an error.
- No new dependency; existing sheets unchanged (existing tests TC-045…TC-050 keep passing).

## Proof
- `npm test` (TC-114 in `tests/tripExcel.test.mjs`), `npm run test:e2e -- e2e/excel.spec.mjs`,
  `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`.
