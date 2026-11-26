---
name: trip-excel-export
description: Use when changing the trip Excel export in Bee There (src/lib/tripExcel.js, src/lib/xlsxValidation.js, the Excel buttons in TripPlan/TripCosts) — layout, columns, formulas, sheets or drop-down lists.
---

# Trip Excel export rules (REQ-026/029/030/032/056, ADR-009, ADR-017)

- **No new dependency:** build with `write-excel-file` (already installed); XML tweaks go in `src/lib/xlsxValidation.js`.
- **Pure builder:** `buildTripWorkbook(trip, plan, costs, { lang, transfers, placeName, checklists, uid, today })` returns `{ sheets, columns, labels, multi }`; keep UI code out of it so it stays unit-testable.
- **Sheets** (names follow the export language): "Lịch trình & chi phí" / "Itinerary & costs" (one sheet), "Checklist" (REQ-056, only when there are items), "Chia tiền" / "Settle up" (group trips only), "Tỉ giá" / "Rates", "Master data". No separate Places sheet.
- **Checklist sheet (REQ-056):** one row per item — list, when, item, for whom, done, ticked by, due day; "before the trip" lists first; "everyone ticks" items show ticked/members counting **current members only** (#104); overdue / due-today rows red / yellow; last row done/all. **Privacy:** only shared lists and the exporting user's own (`ownerUid === uid`); callers read lists once with `checklistsForExport(api, tripId, uid)`.
- **Main sheet order:** unlinked / pre-trip costs first → undated plan items → each day: plan item rows, each followed by its "↳" cost lines, then day totals → repayments → the grand-total row ("TỔNG CẢ CHUYẾN" / "TRIP TOTAL").
- **Cost lines:** an estimate and its first actual share one row; extra actuals get their own row.
- **Columns:** estimate, [estimate currency], actual, [actual currency], final amount in the trip's base currency (`trip.currency || 'VND'`), difference… Currency columns only when `multi` (some cost currency ≠ base).
- **Formulas need cached values** (`addFormulaValues`), or amounts are blank in Protected View. Totals use SUMIFS on the (visible) row-type column; only the helper column `estBase` is hidden (`hiddenColumns`).
- **Google Maps column** shows the full URL, not "Open map".
- Drop-down lists (status, cost type…) come from the Master data sheet; cost types from `src/data/costTypes.js`.

## Enforced by
- `tests/tripExcel.test.mjs` (layout, columns, cached values) and `e2e/excel.spec.mjs` (download from the UI). Check results also with LibreOffice when formulas change.
