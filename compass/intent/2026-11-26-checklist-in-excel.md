# Intent: Trip checklist in the Excel export

Status: Approved (by Christine, 2026-11-26)
Requested: 2026-11-26 by Christine, in chat

## What we want
A trip member who exports a trip to Excel gets the trip's checklist in the same file, so the itinerary, costs and
to-dos can be printed, shared or worked on offline from one file. Today the checklist cannot be exported at all
(0 of a trip's checklist items appear in any export); target: every checklist item the member can see in the app
appears in the Excel file, from the next release.

## Business need
"Allow user to export checklist into the same excel file as a separate sheet."

## Why
People prepare a trip from the Excel file (costs, itinerary) but the to-do list stays only in the app, so they switch
between the two or copy the list by hand.

## Constraints
- Same Excel file and the same Excel buttons (trip plan and costs pages); one new sheet named "Checklist" in both languages.
- Privacy: only what the user can already see — shared checklists plus the user's own personal checklists; never other
  members' personal lists.
- No new dependency (write-excel-file), free Firebase Spark plan. No new feature flag: ships with the existing `tripExcel` flag (ADR-017, decided 2026-11-26).
- The existing sheets do not change.

## Success measure
Exporting a demo trip with checklists gives a workbook with a "Checklist" sheet listing every visible item with its
list, phase (before the trip / before returning), done status, who ticked it, who it is for and its due day; the sheet
is left out when the trip has no checklist items.

## Out of scope
- Importing a checklist back from Excel.
- A checklist-only export, PDF export of the checklist.
- Editing the checklist through the Excel file (ticking in Excel does not sync back).

## Requirements
- REQ-056 — Export the trip checklist to the same Excel file as a separate sheet (#99)
