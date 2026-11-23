// TC-045 / TC-048 — Excel export of itinerary + costs (REQ-026, REQ-029)
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTripWorkbook, col } from '../src/lib/tripExcel.js';
import { insertDataValidations, addFormulaValues } from '../src/lib/xlsxValidation.js';

const trip = { name: 'SG & MY', currency: 'VND', rates: { SGD: 19600 }, memberIds: ['u1', 'u2'], members: { u1: { name: 'Lan' }, u2: { name: 'Thư' } } };
const plan = [
  { id: 'p1', place: { name: 'Chinatown', city: 'Singapore', lat: 1.28, lng: 103.84 }, date: '2026-11-10', time: '14:00', order: 1, done: true },
  { id: 'p0', place: { name: 'Mua eSIM' }, date: '', order: 0 },
];
const costs = [
  { id: 'e1', type: 'estimate', title: 'Khách sạn', amount: 6000000, per: 'group' },
  { id: 'e2', type: 'estimate', title: 'Ăn tối', amount: 15, currency: 'SGD', per: 'person', planItemId: 'p1' },
  { id: 'a1', type: 'actual', title: 'Khách sạn 4 đêm', amount: 5800000, paidBy: 'u2', estimateId: 'e1', date: '2026-11-10' },
  { id: 'a2', type: 'actual', title: 'Hải sản', amount: 100, currency: 'SGD', paidBy: 'u1', planItemId: 'p1', date: '2026-11-10' },
  { id: 'x1', type: 'payment', title: 'Trả lại', amount: 500000, paidBy: 'u1', payTo: 'u2' },
];
const text = (cell) => (cell && typeof cell === 'object' ? cell.value : cell);
const rowOf = (data, label) => data.find((r) => r.some((c) => text(c) === label));

test('TC-048: itinerary and costs share one sheet; no Places or separate Costs sheet', () => {
  const { sheets } = buildTripWorkbook(trip, plan, costs);
  assert.deepEqual(sheets.map((s) => s.sheet), ['Lịch trình & chi phí', 'Chia tiền', 'Tỉ giá', 'Master data']);
  const solo = buildTripWorkbook({ ...trip, memberIds: ['u1'] }, plan, costs).sheets.map((s) => s.sheet);
  assert.deepEqual(solo, ['Lịch trình & chi phí', 'Tỉ giá', 'Master data']);
});

test('TC-048: each plan item is followed by its costs and adds them up', () => {
  const { sheets, columns: C } = buildTripWorkbook(trip, plan, costs);
  const data = sheets[0].data;
  const i = data.indexOf(rowOf(data, 'Chinatown'));
  assert.equal(text(data[i + 1][C.act - 1]).trim(), '↳ Ăn tối');
  assert.equal(text(data[i + 2][C.act - 1]).trim(), '↳ Hải sản');
  const item = data[i];
  assert.equal(item[C.actual - 1].value, `=SUM(${col(C.actual)}${i + 2}:${col(C.actual)}${i + 3})`);
  assert.equal(item[C.actual - 1].cached, 1960000); // 100 SGD × 19,600
  assert.equal(item[C.est - 1].cached, 588000); // 15 SGD × 2 people × 19,600
  // An actual linked only to an unlinked estimate stays with that estimate under "Other costs"
  const other = data.indexOf(rowOf(data, 'Chi phí khác (không gắn lịch trình)'));
  assert.equal(text(data[other + 2][C.act - 1]).trim(), '↳ Khách sạn 4 đêm');
});

test('TC-048: every formula carries its value so viewers that do not recalculate still show amounts', () => {
  const { sheets, columns: C } = buildTripWorkbook(trip, plan, costs);
  const data = sheets[0].data;
  const total = rowOf(data, 'TỔNG CẢ CHUYẾN');
  assert.equal(total[C.est - 1].cached, 6588000);
  assert.equal(total[C.actual - 1].cached, 7760000); // repayments are not trip spending
  const r = data.indexOf(total) + 1;
  assert.equal(sheets[0].formulaValues[`${col(C.actual)}${r}`], 7760000);
  const xml = addFormulaValues(`<row><c r="${col(C.actual)}${r}" s="3"><f>=SUM(A1:A2)</f></c><c r="Z1"><f>=HYPERLINK("u","Mở bản đồ")</f></c></row>`, { ...sheets[0].formulaValues, Z1: 'Mở bản đồ' });
  assert.match(xml, new RegExp(`<c r="${col(C.actual)}${r}" s="3"><f>SUM\\(A1:A2\\)</f><v>7760000</v></c>`));
  assert.match(xml, /<c r="Z1" t="str"><f>HYPERLINK\("u","Mở bản đồ"\)<\/f><v>Mở bản đồ<\/v><\/c>/);
});

test('TC-045: settle-up balances match the app (paid − share + repaid − received)', () => {
  const { sheets } = buildTripWorkbook(trip, plan, costs);
  const settle = sheets[1].data;
  const lan = rowOf(settle, 'Lan');
  const thu = rowOf(settle, 'Thư');
  // Lan paid 1,960,000; share 980,000 + 2,900,000; repaid 500,000 → −1,420,000
  assert.equal(lan[5].cached, -1420000);
  assert.equal(thu[5].cached, 1420000);
  assert.match(lan[1].value, /SUMIFS\('Lịch trình & chi phí'!\$[A-Z]+\$3:\$[A-Z]+\$\d+/);
});

test('TC-045: converted amounts look up the Rates sheet; master data backs the drop-downs', () => {
  const { sheets, columns: C } = buildTripWorkbook(trip, plan, costs);
  const line = rowOf(sheets[0].data, '   ↳ Hải sản');
  assert.match(line[C.actual - 1].value, /VLOOKUP\([A-Z]+\d+,'Tỉ giá'!\$A:\$B,2,FALSE\)/);
  const master = sheets[3].data.map((r) => r.map(text));
  assert.deepEqual(master.slice(1, 5).map((r) => r[0]), ['Chưa làm', 'Đang làm', 'Xong', 'Không đi']);
  assert.ok(master.some((r) => r[2] === 'Riêng - Thư'));
  const xml = insertDataValidations('<worksheet><sheetData/><pageMargins/></worksheet>', sheets[0].validations);
  assert.ok(xml.indexOf('<dataValidations') < xml.indexOf('<pageMargins'));
});
