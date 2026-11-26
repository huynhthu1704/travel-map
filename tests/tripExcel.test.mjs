// TC-045 / TC-048 / TC-049 — Excel export of itinerary + costs (REQ-026, REQ-029, REQ-030)
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTripWorkbook, col } from '../src/lib/tripExcel.js';
import { insertDataValidations, addFormulaValues, hideColumns } from '../src/lib/xlsxValidation.js';

const trip = { name: 'SG & MY', currency: 'VND', rates: { SGD: 19600 }, memberIds: ['u1', 'u2'], members: { u1: { name: 'Lan' }, u2: { name: 'Thư' } } };
const plan = [
  { id: 'p1', place: { name: 'Chinatown', city: 'Singapore', lat: 1.28, lng: 103.84 }, date: '2026-11-10', time: '14:00', order: 1, done: true },
  { id: 'p2', place: { name: 'Petronas' }, date: '2026-11-12', order: 2 },
];
const costs = [
  { id: 'e1', type: 'estimate', title: 'Khách sạn', amount: 6000000, per: 'group' },
  { id: 'a1', type: 'actual', title: 'Khách sạn 4 đêm', amount: 5800000, paidBy: 'u2', estimateId: 'e1', date: '2026-11-10' },
  { id: 'e2', type: 'estimate', title: 'Ăn tối', amount: 15, currency: 'SGD', per: 'person', planItemId: 'p1' },
  { id: 'a2', type: 'actual', title: 'Ăn tối', amount: 40, currency: 'SGD', paidBy: 'u1', estimateId: 'e2', planItemId: 'p1', date: '2026-11-10' },
  { id: 'x1', type: 'payment', title: 'Trả lại', amount: 500000, paidBy: 'u1', payTo: 'u2' },
];
const vndOnly = costs.map((c) => ({ ...c, currency: undefined, amount: c.currency === 'SGD' ? c.amount * 19600 : c.amount }));
const text = (cell) => (cell && typeof cell === 'object' ? cell.value : cell);
const find = (data, label) => data.findIndex((r) => r.some((c) => typeof text(c) === 'string' && text(c).trim() === label));

test('TC-048: one itinerary & costs sheet; settle-up only for groups', () => {
  assert.deepEqual(buildTripWorkbook(trip, plan, costs).sheets.map((s) => s.sheet), ['Lịch trình & chi phí', 'Chia tiền', 'Tỉ giá', 'Master data']);
  assert.deepEqual(buildTripWorkbook({ ...trip, memberIds: ['u1'] }, plan, costs).sheets.map((s) => s.sheet), ['Lịch trình & chi phí', 'Tỉ giá', 'Master data']);
});

test('TC-049: costs not linked to a plan item come first, then one block per day', () => {
  const data = buildTripWorkbook(trip, plan, costs).sheets[0].data;
  const pre = find(data, 'Chi phí chung / trước chuyến đi (không gắn địa điểm)');
  const day1 = find(data, 'Ngày 1');
  const day2 = find(data, 'Ngày 2');
  assert.ok(pre === 2 && pre < day1 && day1 < day2, `order: pre ${pre}, day1 ${day1}, day2 ${day2}`);
  assert.equal(find(data, '↳ Khách sạn 4 đêm'), pre + 1);
  assert.ok(find(data, '↳ Ăn tối') > find(data, 'Chinatown'));
});

test('TC-049: an estimate and its actual share one row: estimated, currency, actual, currency, final VND, difference', () => {
  const { sheets, columns: C, multi } = buildTripWorkbook(trip, plan, costs);
  assert.equal(multi, true);
  const head = sheets[0].data[1].map(text);
  assert.deepEqual(head.slice(5, 11), ['Chi phí dự kiến', 'Tiền tệ (dự kiến)', 'Chi phí thực tế', 'Tiền tệ (thực tế)', 'Thành tiền (VND)', 'Chênh lệch (thực tế − dự kiến)']);
  const row = sheets[0].data[find(sheets[0].data, '↳ Ăn tối')];
  assert.deepEqual([C.est, C.estCur, C.act$, C.actCur].map((c) => text(row[c - 1])), [30, 'SGD', 40, 'SGD']); // 15 SGD × 2 people
  assert.equal(row[C.final - 1].cached, 784000); // 40 × 19,600
  assert.equal(row[C.diff - 1].cached, 196000); // 784,000 − 588,000
  assert.match(row[C.final - 1].value, /VLOOKUP\([A-Z]+\d+,'Tỉ giá'!\$A:\$B,2,FALSE\)/);
});

test('TC-049: currency columns are hidden when every cost is in the trip currency', () => {
  const { sheets, columns: C, multi } = buildTripWorkbook(trip, plan, vndOnly);
  assert.equal(multi, false);
  assert.equal(C.estCur, undefined);
  assert.equal(C.actCur, undefined);
  assert.deepEqual(sheets[0].data[1].map(text).slice(5, 9), ['Chi phí dự kiến (VND)', 'Chi phí thực tế (VND)', 'Thành tiền (VND)', 'Chênh lệch (thực tế − dự kiến)']);
});

test('TC-049: day and trip totals add up every column; repayments are not spending', () => {
  const { sheets, columns: C } = buildTripWorkbook(trip, plan, costs);
  const data = sheets[0].data;
  const total = data[find(data, 'TỔNG CẢ CHUYẾN')];
  assert.equal(total[C.est - 1].cached, 6588000);
  assert.equal(total[C.act$ - 1].cached, 6584000); // 5,800,000 + 784,000 (repayment excluded)
  assert.equal(total[C.final - 1].cached, 6584000);
  assert.equal(total[C.diff - 1].cached, -4000);
  assert.equal(text(total[C.estCur - 1]), 'VND');
  assert.ok(sheets[0].hiddenColumns.includes(C.estBase));
});

test('TC-045 / TC-048: settle-up balances, cached values, hidden helper column and drop-downs', () => {
  const { sheets } = buildTripWorkbook(trip, plan, costs);
  const settle = sheets[1].data;
  const lan = settle[find(settle, 'Lan')];
  // Lan paid 784,000; share 392,000 + 2,900,000; repaid 500,000 → −2,008,000
  assert.equal(lan[5].cached, -2008000);
  const xml = addFormulaValues('<row><c r="A1" s="3"><f>=SUM(B1:B2)</f></c></row>', { A1: 5 });
  assert.equal(xml, '<row><c r="A1" s="3"><f>SUM(B1:B2)</f><v>5</v></c></row>');
  assert.match(hideColumns('<cols><col min="3" max="3" width="9"/></cols>', [3]), /hidden="1"/);
  const v = insertDataValidations('<worksheet><sheetData/><pageMargins/></worksheet>', sheets[0].validations);
  assert.ok(v.indexOf('<dataValidations') < v.indexOf('<pageMargins'));
  assert.equal(col(28), 'AB');
});

// TC-050 — Google Maps column shows the URL (REQ-032)
test('TC-050: the Google Maps cell holds the full URL as a clickable link', () => {
  const { sheets, columns: C } = buildTripWorkbook(trip, plan, costs);
  const row = sheets[0].data[find(sheets[0].data, 'Chinatown')];
  const cell = row[C.maps - 1];
  assert.equal(cell.value, '=HYPERLINK("https://www.google.com/maps/search/?api=1&query=1.280000,103.840000")');
  assert.equal(cell.cached, 'https://www.google.com/maps/search/?api=1&query=1.280000,103.840000');
  const gm = buildTripWorkbook(trip, [{ ...plan[0], place: { ...plan[0].place, gmapsLink: 'https://maps.app.goo.gl/x' } }], []);
  const data = gm.sheets[0].data;
  assert.equal(data[find(data, 'Chinatown')][gm.columns.maps - 1].cached, 'https://maps.app.goo.gl/x');
});

// TC-114 — the trip checklist as its own sheet (REQ-056)
const ctrip = { ...trip, name: 'SG & MY', startDate: '2026-12-10', endDate: '2026-12-14', memberIds: ['u1', 'u2', 'u3', 'u4'] };
const checklists = [
  { id: 'r', title: 'Việc trước khi về', phase: 'return', scope: 'shared', items: [{ id: 'r1', text: 'Trả phòng', due: '2026-12-14' }] },
  {
    id: 'k', title: 'Đồ cần mang', phase: 'before', scope: 'shared',
    items: [
      { id: 'a', text: 'Hộ chiếu', done: true, doneBy: 'Lan', due: 'before' },
      { id: 'b', text: 'Sạc dự phòng', scope: 'personal', doneMap: { u1: 'Lan', u2: 'Thư' }, due: '2026-12-10' },
      { id: 'c', text: 'Đổi tiền SGD', scope: 'me', ownerUid: 'u3', ownerName: 'An', due: '2026-11-20' },
      { id: 'd', text: 'Bảo hiểm', due: '2026-11-26' },
    ],
  },
  { id: 'm', title: 'Của tôi', phase: 'before', scope: 'personal', ownerUid: 'u1', items: [{ id: 'm1', text: 'Thuốc', done: true, doneBy: 'Lan' }] },
  { id: 'x', title: 'Của Thư', phase: 'before', scope: 'personal', ownerUid: 'u2', items: [{ id: 'x1', text: 'BÍ MẬT' }] },
];
const sheetOf = (opts) => buildTripWorkbook(ctrip, plan, costs, { checklists, uid: 'u1', today: '2026-11-26', ...opts }).sheets;

test('TC-114: a Checklist sheet right after the itinerary, one row per visible item, before-the-trip lists first', () => {
  const sheets = sheetOf();
  assert.deepEqual(sheets.map((s) => s.sheet), ['Lịch trình & chi phí', 'Checklist', 'Chia tiền', 'Tỉ giá', 'Master data']);
  const d = sheets[1].data.map((r) => r.map(text));
  assert.equal(d[0][0], 'CHECKLIST | SG & MY');
  assert.deepEqual(d[1], ['Checklist', 'Khi nào', 'Việc cần làm', 'Ai lo', 'Xong', 'Người tick', 'Ngày cần làm']);
  assert.deepEqual(d.slice(2, -1).map((r) => r[2]), ['Hộ chiếu', 'Sạc dự phòng', 'Đổi tiền SGD', 'Bảo hiểm', 'Thuốc', 'Trả phòng']);
  assert.deepEqual(d[2], ['Đồ cần mang', 'Trước khi đi', 'Hộ chiếu', 'Cả nhóm', '✓', 'Lan', 'Trước chuyến đi']);
  assert.deepEqual(d[3].slice(3), ['Mỗi người tự tick', '2/4', 'Lan, Thư', 'Ngày 1 · 10/12'], 'everyone ticks: ticked / members');
  assert.deepEqual(d[4].slice(3), ['Chỉ An', '', '', '20/11/2026']);
  assert.deepEqual(d[6].slice(0, 4), ['Của tôi (cá nhân)', 'Trước khi đi', 'Thuốc', 'Cá nhân']);
  assert.deepEqual(d[7].slice(0, 2), ['Việc trước khi về', 'Trước khi về']);
  assert.equal(d.at(-1)[0], 'Đã xong: 2/6');
  assert.ok(!JSON.stringify(d).includes('BÍ MẬT'), "another member's personal list is never exported");
  assert.equal(sheets[1].stickyRowsCount, 2);
});

test('TC-114: overdue items are red, items due today yellow, done items plain', () => {
  const data = sheetOf()[1].data;
  const fill = (i) => data[i][0].backgroundColor;
  assert.equal(fill(4), '#FDE2DC');
  assert.equal(fill(5), '#FFF3B0');
  assert.equal(fill(2), undefined);
  assert.equal(fill(7), undefined, 'not due yet');
});

test('TC-114: English labels; no Checklist sheet without items or without my lists', () => {
  const en = sheetOf({ lang: 'en' })[1].data.map((r) => r.map(text));
  assert.deepEqual(en[1], ['List', 'When', 'Item', 'For', 'Done', 'Ticked by', 'Due day']);
  assert.deepEqual(en[3].slice(1, 4), ['Before the trip', 'Sạc dự phòng', 'Everyone ticks']);
  assert.equal(en[2][6], 'Before the trip');
  assert.equal(en[3][6], 'Day 1 · 10/12');
  assert.equal(en.at(-1)[0], 'Done: 2/6');
  const names = (opts) => buildTripWorkbook(ctrip, plan, costs, opts).sheets.map((s) => s.sheet);
  assert.deepEqual(names({}), ['Lịch trình & chi phí', 'Chia tiền', 'Tỉ giá', 'Master data'], 'existing sheets unchanged');
  assert.deepEqual(names({ checklists: [{ ...checklists[3] }], uid: 'u1' }), ['Lịch trình & chi phí', 'Chia tiền', 'Tỉ giá', 'Master data']);
  assert.deepEqual(names({ checklists: [{ id: 'e', scope: 'shared', items: [] }] }), ['Lịch trình & chi phí', 'Chia tiền', 'Tỉ giá', 'Master data']);
});
