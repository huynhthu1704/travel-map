# Design: Checklist sheet in the trip Excel export

Status: Approved (by Christine, 2026-11-26)
Requirements: REQ-056
Design tool: Figma — Bee There file, page "📐 Feature designs" (https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=21-5)

## Approach
No new button or screen. The existing **📊 Export Excel** button (Plan and Costs tabs, flag `tripExcel`) downloads the
same workbook with one more sheet, **"Checklist"** (same name in VI and EN), placed right after "Lịch trình & chi phí" /
"Itinerary & costs". Same font (Arial 10), header style and sticky header row as the other sheets. No new feature
flag (Product Owner's decision, ADR-017). Built by the pure `buildTripWorkbook()` so it is unit-tested.

## Screens
### SCR-1 · Checklist sheet — REQ-056
- Purpose: see, print or share every to-do of the trip next to the itinerary and costs.
- Row 1: title `CHECKLIST | <trip name>`.
- Row 2 (header, sticky): **List · When · Item · For · Done · Ticked by · Due day**

  | Column (EN) | VI header | Example values (VI / EN) |
  |---|---|---|
  | List | Checklist | "Đồ cần mang"; personal lists get "(cá nhân)" / "(personal)" |
  | When | Khi nào | Trước khi đi / Before the trip · Trước khi về / Before returning |
  | Item | Việc cần làm | the item text |
  | For | Ai lo | Cả nhóm / Group · Mỗi người tự tick / Everyone ticks · Chỉ <tên> / Only <name> · Cá nhân / Personal |
  | Done | Xong | ✓ or blank; "Everyone ticks" items show `2/4` (members who ticked / members) |
  | Ticked by | Người tick | who ticked; "Everyone ticks" items list the names who ticked |
  | Due day | Ngày cần làm | Trước chuyến đi / Before the trip · Ngày 3 · 12/11 / Day 3 · 12/11 · 20/12/2026 |

- Order: "Before the trip" lists first, then "Before returning"; lists in creation order; items in the order shown in the app.
- Last row: `Đã xong / Done: 5/12` (done items / all items; an "Everyone ticks" item counts as done when every member ticked).
- Items not done that are overdue / due today on the export day get the same red / yellow fill as in the app (REQ-033).
  The file is shared by the group, so an "Everyone ticks" item stays red / yellow until every current member ticked it
  (in the app each member sees their own tick).
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=21-5 (REQ-056 · Excel export — Checklist sheet (VI))
- States: trip without checklist items → no Checklist sheet, the rest of the file unchanged. Error → the existing
  Excel error message.

## Notes
- Privacy: only shared lists and the exporting user's own personal lists (same filter as the Checklist tab).
- Phone: the button is unchanged; the file opens in any spreadsheet app.
