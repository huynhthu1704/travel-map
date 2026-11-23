// TC-045 — Excel export of itinerary + costs (REQ-026)
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTripWorkbook, col } from '../src/lib/tripExcel.js';
import { insertDataValidations } from '../src/lib/xlsxValidation.js';

const trip = { name: 'SG & MY', currency: 'VND', rates: { SGD: 19600 }, memberIds: ['u1', 'u2'], members: { u1: { name: 'Lan' }, u2: { name: 'Thư' } } };
const plan = [
  { id: 'p1', place: { name: 'Chinatown', city: 'Singapore', lat: 1.28, lng: 103.84 }, date: '2026-11-10', time: '14:00', order: 1, done: true },
  { id: 'p0', place: { name: 'Mua eSIM' }, date: '', order: 0 },
];
const costs = [
  { id: 'e1', type: 'estimate', title: 'Khách sạn', amount: 6000000, per: 'group' },
  { id: 'a1', type: 'actual', title: 'Khách sạn 4 đêm', amount: 5800000, paidBy: 'u2', estimateId: 'e1', date: '2026-11-10' },
  { id: 'a2', type: 'actual', title: 'Hải sản', amount: 100, currency: 'SGD', paidBy: 'u1', planItemId: 'p1', date: '2026-11-10' },
  { id: 'x1', type: 'payment', title: 'Trả lại', amount: 500000, paidBy: 'u1', payTo: 'u2' },
];
const text = (cell) => (cell && typeof cell === 'object' ? cell.value : cell);

test('TC-045: a group trip gets itinerary, costs, settle-up, rates, places and master-data sheets', () => {
  const { sheets } = buildTripWorkbook(trip, plan, costs);
  assert.deepEqual(sheets.map((s) => s.sheet), ['Lịch trình', 'Chi phí', 'Chia tiền', 'Tỉ giá', 'Địa điểm', 'Master data']);
  const solo = buildTripWorkbook({ ...trip, memberIds: ['u1'] }, plan, costs).sheets.map((s) => s.sheet);
  assert.ok(!solo.includes('Chia tiền'), 'no settle-up sheet for a solo trip');
});

test('TC-045: a cost linked to a plan item is summed on that item’s row by formula', () => {
  const { sheets, codeOfPlan, codeOfCost } = buildTripWorkbook(trip, plan, costs);
  assert.equal(codeOfCost.get('a2'), codeOfPlan.get('p1'));
  assert.equal(codeOfCost.get('a1'), codeOfCost.get('e1')); // actual follows its estimate
  const itin = sheets[0].data;
  const row = itin.find((r) => r.some((c) => text(c) === 'Chinatown'));
  const actual = row[5];
  assert.equal(actual.type, 'Formula');
  assert.match(actual.value, /SUMIFS\('Chi phí'!\$H:\$H,'Chi phí'!\$A:\$A,\$M\d+,'Chi phí'!\$C:\$C,"Thực tế"\)/);
});

test('TC-045: converted amounts look up the Rates sheet', () => {
  const { sheets } = buildTripWorkbook(trip, plan, costs);
  const costsSheet = sheets[1].data;
  const sgd = costsSheet.find((r) => text(r[6]) === 'SGD');
  assert.match(sgd[7].value, /VLOOKUP\(G\d+,'Tỉ giá'!\$A:\$B,2,FALSE\)/);
  const rates = sheets[3].data.map((r) => r.map(text));
  assert.deepEqual(rates.slice(1, 3), [['VND', 1], ['SGD', 19600]]);
});

test('TC-045: master data lists back the drop-downs', () => {
  const { sheets } = buildTripWorkbook(trip, plan, costs);
  const master = sheets[5].data.map((r) => r.map(text));
  assert.deepEqual(master.slice(1, 5).map((r) => r[0]), ['Chưa làm', 'Đang làm', 'Xong', 'Không đi']);
  assert.ok(master.some((r) => r[2] === 'Riêng - Thư'));
  assert.ok(sheets[1].validations.some((v) => v.sqref.startsWith('C2:') && v.list.includes("'Master data'!$B$2")));
  const xml = insertDataValidations('<worksheet><sheetData/><pageMargins/></worksheet>', sheets[1].validations);
  assert.ok(xml.indexOf('<dataValidations') < xml.indexOf('<pageMargins'));
  assert.equal(col(28), 'AB');
});
