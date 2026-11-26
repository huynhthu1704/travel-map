# Tests

_Generated from `spec.json`. Unit tests: `npm test` (tests/). UI tests: `npm run test:e2e` (e2e/, Playwright, demo mode)._

| ID | Title | Requirements | Type | Status | File |
|---|---|---|---|---|---|
| TC-001 | Owner and editors can edit; viewers cannot | REQ-001 | automated | Passing | tests/tripAccess.test.mjs |
| TC-002 | Non-members and signed-out users cannot edit | REQ-001 | automated | Passing | tests/tripAccess.test.mjs |
| TC-003 | Switching a member between view-only and edit never affects the owner | REQ-001 | automated | Passing | tests/tripAccess.test.mjs |
| TC-004 | Viewer UI: banner shown, edit controls hidden, Copy this trip creates an editable copy | REQ-001 | manual | Passing (demo) | — |
| TC-005 | Each estimate shows planned, actual, difference and status | REQ-002 | automated | Passing | tests/costCompare.test.mjs |
| TC-006 | Unlinked actuals are listed as unplanned; totals include them | REQ-002 | automated | Passing | tests/costCompare.test.mjs |
| TC-007 | sortByOrder: ordered items first, others keep fallback order | REQ-003 | automated | Passing | tests/costCompare.test.mjs |
| TC-008 | Dragging writes only items whose position changed | REQ-003 | automated | Passing | tests/costCompare.test.mjs |
| TC-009 | UI: comparison card renders, drag reorders and persists, no handles for viewers | REQ-002, REQ-003 | manual | Passing (demo) | — |
| TC-010 | Unified table rows: items with linked actuals, extras inline, totals | REQ-004 | automated | Passing | tests/costCompare.test.mjs |
| TC-011 | Unified table follows drag order across items and extras | REQ-004, REQ-003 | automated | Passing | tests/costCompare.test.mjs |
| TC-012 | UI: add cost with estimate+actual, estimate only then 🧾 actual, actual only (unplanned) | REQ-004 | manual | Passing (demo) | — |
| TC-013 | Selected place is drawn once, outside normal pins and clusters | REQ-005 | automated | Passing | tests/mapSelect.test.mjs |
| TC-014 | UI: open a place among many pins — highlighted pin and name label; closing removes it | REQ-005 | manual | Passing (demo) | — |
| TC-015 | Group total and per-person share for group / per person / picked people | REQ-006 | automated | Passing | tests/estimatePeople.test.mjs |
| TC-016 | UI: pick people in the estimate form, label shows names, actual pre-filled with same people | REQ-006 | manual | Passing (demo) | — |
| TC-017 | View sorts: manual, date, amount, difference, name | REQ-008 | automated | Passing | tests/costSort.test.mjs |
| TC-018 | Sorting never loses or duplicates rows | REQ-008 | automated | Passing | tests/costSort.test.mjs |
| TC-019 | PDF rows follow the on-screen order | REQ-009 | automated | Passing | tests/costSort.test.mjs |
| TC-020 | Summary difference compares only spent items plus unplanned | REQ-010 | automated | Passing | tests/costSort.test.mjs |
| TC-021 | UI: drag, ↑ ↓, sort menu, save as group order, PDF single table in on-screen order | REQ-008, REQ-009, REQ-010 | manual | Passing (demo) | — |
| TC-022 | View access: members or public link; link viewers never edit | REQ-007 | automated | Passing | tests/publicTrip.test.mjs |
| TC-023 | Tabs visible to link viewers | REQ-007 | automated | Passing | tests/publicTrip.test.mjs |
| TC-024 | UI: turn link on, open signed-out, copy trip after sign-in, turn link off | REQ-007 | manual | Passing (demo) | — |
| TC-025 | PDF keeps arrow characters (→ ← ↔ ⇒) in titles | REQ-009 | manual | Passing (demo) | — |
| TC-026 | English dictionary loads on its own and covers the Vietnamese keys | REQ-011 | automated | Passing | tests/pageSpeed.test.mjs |
| TC-027 | Lighthouse mobile before/after on Map, Explore, Guides, Trips, About | REQ-011 | manual | Passing: Explore 44→80, Guides 51→81, Trips 52→75, About 43→75; Map FCP 3.9→3.1 s, LCP 6.5→5.2 s | — |
| TC-028 | Stops of places removed from the plan are hidden; re-added places show | REQ-012 | automated | Passing | tests/journey.test.mjs |
| TC-029 | UI: delete a checked-in place from the plan → Journey count drops | REQ-012 | manual | Passing (demo: 6 → 5) | — |
| TC-030 | Features grouped, important first, none lost or duplicated | REQ-013 | automated | Passing | tests/aboutGroups.test.mjs |
| TC-031 | Trip length and planned-place count | REQ-014 | automated | Passing | tests/tripFacts.test.mjs |
| TC-032 | Main CSS is non-blocking; page CSS is split out | REQ-015 | automated | Passing | tests/pageCss.test.mjs |
| TC-033 | Cost table action buttons do not overlap the difference column | REQ-004 | automated | Passing | tests/costTableLayout.test.mjs |
| TC-034 | Journey dates follow the itinerary | REQ-017 | automated | Passing | tests/journeyDates.test.mjs |
| TC-035 | Google Maps link and coordinates for every place in Admin | REQ-018 | automated | Passing | tests/adminPlaceCoords.test.mjs |
| TC-036 | Rename a checklist item keeping its state | REQ-019 | automated | Passing | tests/checklistEdit.test.mjs |
| TC-037 | Journey uses the entered check-in date | REQ-020 | automated | Passing | tests/journeyDates.test.mjs |
| TC-038 | Admin coordinate overrides apply to saved places and check-ins | REQ-021 | automated | Passing | tests/placeCoords.test.mjs |
| TC-039 | Admin Google Maps link is used for directions | REQ-022 | automated | Passing | tests/placeCoords.test.mjs |
| TC-040 | Tour card never covers the highlighted target on phones | REQ-023 | automated | Passing | tests/tourLayout.test.mjs |
| TC-041 | Increase the number of user by adding some suggestion from 'Guides' into trip's checklist — happy path | REQ-024 | Automated | Not run | — |
| TC-042 | Increase the number of user by adding some suggestion from 'Guides' into trip's checklist — invalid input | REQ-024 | Automated | Not run | — |
| TC-043 | Accessibility and performance baseline — happy path | REQ-025 | Automated | Not run | — |
| TC-044 | Accessibility and performance baseline — invalid input | REQ-025 | Manual | Not run | — |
| TC-045 | Excel workbook: sheets, formulas linking costs to the itinerary, rates, drop-downs | REQ-026 | automated | Passing | tests/tripExcel.test.mjs |
| TC-046 | UI: Export Excel on the Plan and Costs tabs, hidden while the flag is off | REQ-026, REQ-029, REQ-030 | automated | Passing | e2e/excel.spec.mjs |
| TC-047 | Bug reporter: a deliberately failing test produces one issue (dry run); reruns comment; passes close | REQ-027 | manual | Passing (dry run, 2026-11-23) | e2e/report-bugs.mjs |
| TC-048 | Excel: one itinerary & costs sheet, item totals, cached formula values, sheet list | REQ-029 | automated | Passing | tests/tripExcel.test.mjs |
| TC-049 | Excel: pre-trip costs first, day blocks, estimate/actual columns, currency columns only for multi-currency trips, totals | REQ-030 | automated | Passing | tests/tripExcel.test.mjs |
| TC-050 | Excel: Google Maps cell holds the full URL (also the admin link) | REQ-032 | automated | Passing | tests/tripExcel.test.mjs |
| TC-051 | Cost types list and Excel cost type column | REQ-031 | automated | Passing | tests/costTypes.test.mjs |
| TC-052 | UI: save a cost with a type; picker hidden while the flag is off | REQ-031 | automated | Passing | e2e/costType.spec.mjs |
| TC-053 | Checklist due day: trip day list, set/clear, due-today and overdue status | REQ-033 | automated | Passing | tests/checklistEdit.test.mjs |
| TC-054 | UI: mark an item for Day 3, highlighted on that day, kept after reload, cleared | REQ-033 | automated | Passing | e2e/checkDue.spec.mjs |
| TC-055 | Workflows: deploy gated on green CI, smoke test + rollback, npm audit | REQ-034 | automated | Passing | tests/cicd.test.mjs |
| TC-056 | Bug #54: skipping the quick tour right after it opens keeps it closed | REQ-143 | automated | Passing | e2e/help.spec.mjs |
| TC-057 | Agent knowledge file exists, is imported by CLAUDE.md and holds no secrets | REQ-035 | automated | Passing | tests/agentKnowledge.test.mjs |
| TC-058 | REVIEW.md: passes, severities, merge rule; linked from AGENTS.md, PR template and agent knowledge | REQ-037 | automated | Passing | tests/reviewPolicy.test.mjs |
| TC-059 | Guardrails: protected/forbidden paths, 12-file limit, deletions, dependency changes, secrets; edit hook decisions | REQ-036 | automated | Passing | tests/guardrails.test.mjs |
| TC-060 | Handover: open requirements, counts and feature stage; stale handover detected; committed file is current | REQ-047 | automated | Passing | tests/handover.test.mjs |
| TC-061 | ADRs: November decisions back-filled, validation of fields/ids/links, decisions.md generated | REQ-046 | automated | Passing | tests/decisions.test.mjs |
| TC-062 | CLAUDE.md: under one page, commands, lessons-learned section and rule, knowledge import | REQ-045 | automated | Passing | tests/claudeMd.test.mjs |
| TC-063 | Intent: template, back-filled intent, requirement links validated (missing, unapproved, unlisted, required from REQ-051) | REQ-038 | automated | Passing | tests/intent.test.mjs |
| TC-064 | Plan: required for code PRs, template, merge-pr refuses without green CI/APPROVE and keeps the plan in the commit | REQ-039 | automated | Passing | tests/plan.test.mjs |
| TC-065 | Skills: four policy skills with valid frontmatter, use-when descriptions and an existing enforcing check | REQ-040 | automated | Passing | tests/skills.test.mjs |
| TC-066 | Policy checks behind the skills: VI/EN keys and placeholders match; flags have VI/EN texts and new flags are default-off with a value | REQ-040, REQ-051 | automated | Passing | tests/skills.test.mjs |
| TC-067 | Hardening: merge-pr re-checks the plan, placeholder plan values count as missing, accepted-finding route documented, new-flag rule for every non-legacy flag | REQ-051 | automated | Passing | tests/plan.test.mjs |
| TC-068 | Enforcement files are protected: CI check fails without human-approved, the edit hook blocks them until approved, and CI runs main's copy of the check so a weakened check in the PR does not pass | REQ-050 | automated | Passing | tests/guardrails.test.mjs |
| TC-069 | Test-first check: the first commit only adds a test that fails before the fix, later commits do not edit it unless human-approved, merge-pr needs the bug label for bug issues; a test that times out does not count as failing | REQ-043 | automated | Passing | tests/testFirst.test.mjs |
| TC-101 | Automated UI tests: Account & platform | REQ-101, REQ-102, REQ-103, REQ-104, REQ-105, REQ-106, REQ-107, REQ-108, REQ-109, REQ-110 | automated | Passing | e2e/account.spec.mjs |
| TC-102 | Automated UI tests: Map & places | REQ-111, REQ-112, REQ-113, REQ-114, REQ-115, REQ-116, REQ-117 | automated | Passing | e2e/map.spec.mjs |
| TC-103 | Automated UI tests: Check-ins & memories | REQ-118, REQ-119, REQ-120, REQ-121, REQ-122 | automated | Passing | e2e/checkins.spec.mjs |
| TC-104 | Automated UI tests: Social | REQ-123, REQ-124, REQ-125 | automated | Passing | e2e/social.spec.mjs |
| TC-105 | Automated UI tests: Trips | REQ-126, REQ-127, REQ-128, REQ-129, REQ-130, REQ-131, REQ-132, REQ-133 | automated | Passing | e2e/trips.spec.mjs |
| TC-106 | Automated UI tests: Guides, tips & gear | REQ-134, REQ-135, REQ-136, REQ-137, REQ-138, REQ-139, REQ-140, REQ-141 | automated | Passing | e2e/guides.spec.mjs |
| TC-107 | Automated UI tests: Help & onboarding | REQ-142, REQ-143, REQ-144, REQ-145, REQ-146 | automated | Passing | e2e/help.spec.mjs |
| TC-108 | Automated UI tests: Admin | REQ-147, REQ-148, REQ-149, REQ-150, REQ-151, REQ-152, REQ-153 | automated | Passing | e2e/admin.spec.mjs |
| TC-109 | Intent and review files are under compass/; old root paths are gone | REQ-052 | automated | Passing | tests/intent.test.mjs, tests/reviewPolicy.test.mjs |
| TC-110 | Plan file required for code changes; empty sections and placeholders rejected | REQ-053 | automated | Passing | tests/plan.test.mjs |
| TC-111 | New intents keep the business need | REQ-054 | automated | Passing | tests/intent.test.mjs |
| TC-112 | Design gate: missing design, unapproved design for In build, design not mentioning the requirement | REQ-055 | automated | Passing | tests/design.test.mjs |
| TC-114 | Excel Checklist sheet: rows, order, per-person progress, privacy filter, no sheet when empty, EN labels | REQ-056 | automated | Planned | tests/tripExcel.test.mjs |
