# Plan: bug #108 — "everyone ticks" counts only current trip members (REQ-131)

Requirements: REQ-131 · Test cases: TC-116 · Bug #108 (sent by the Product Owner: "fix #108", 2026-11-26)
Design: none: no visual change, the existing 🙋 n/m badge shows the right number

## Files
- `e2e/checkTicks.spec.mjs` — commit 1: failing UI test (a tick of someone who left trip t1 is counted: 🙋 2/2)
- `src/lib/checklist.js` — `memberTicks(doneMap, memberIds)`: names of current members who ticked (all ticks when the
  trip has no member list)
- `src/pages/TripPlan.jsx` — the 🙋 badge and its tooltip use `memberTicks`
- `src/lib/tripExcel.js` — the Excel export (#104) uses the same helper, so app and file always agree
- `compass/spec.json` (TC-116) and the generated views

## Steps
1. Failing e2e test → helper → use it in the checklist item badge and in the Excel builder.
2. `npm test` (TC-114 still covers the Excel side), the new e2e test and `e2e/trips.spec.mjs`.

## Risks
- Ticking/unticking is unchanged: the stored `doneMap` keeps every tick; only the display counts current members.
  A member who rejoins sees their old tick again (acceptable, same as before they left).
- No change to "is done for me" (`doneMap[my uid]`).

## Proof
- `PW_CHROME=… npx playwright test e2e/checkTicks.spec.mjs` fails before the fix (🙋 2/2) and passes after (🙋 1/2);
  `npm test`; `node compass/test-first.mjs origin/main --bug`; check-spec; check-guardrails.
