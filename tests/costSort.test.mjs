// TC-017..TC-019 — sắp xếp bảng chi phí (REQ-008) và thứ tự khi xuất PDF (REQ-009)
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCostTable, sortRows, orderRowsByIds } from '../src/lib/costCompare.js';

const amt = (c) => c.amount;
const list = [
  { id: 'e1', type: 'estimate', title: 'Hotel', amount: 600, order: 0 },
  { id: 'e2', type: 'estimate', title: 'Flights', amount: 1000, order: 1 },
  { id: 'e3', type: 'estimate', title: 'Food', amount: 300, order: 2 },
  { id: 'a1', type: 'actual', title: 'Flights', amount: 1100, estimateId: 'e2', date: '2026-11-12' },
  { id: 'a2', type: 'actual', title: 'Hotel', amount: 500, estimateId: 'e1', date: '2026-11-10' },
  { id: 'x1', type: 'actual', title: 'Taxi', amount: 80, date: '2026-11-11', order: 3 },
];
const rows = buildCostTable(list, { estTotal: amt, actTotal: amt }).rows;
const ids = (rs) => rs.map((r) => r.id);

test('TC-017: view sorts — manual, date, amount, difference, name', () => {
  assert.deepEqual(ids(sortRows(rows, 'manual')), ['e1', 'e2', 'e3', 'x1']);
  assert.deepEqual(ids(sortRows(rows, 'date')), ['e1', 'x1', 'e2', 'e3']);
  assert.deepEqual(ids(sortRows(rows, 'amount')), ['e2', 'e1', 'e3', 'x1']);
  assert.deepEqual(ids(sortRows(rows, 'diff')), ['e2', 'x1', 'e1', 'e3']);
  assert.deepEqual(ids(sortRows(rows, 'name')), ['e2', 'e3', 'e1', 'x1']);
});

test('TC-018: sorting never loses or duplicates rows', () => {
  for (const m of ['manual', 'date', 'amount', 'diff', 'name', 'unknown']) assert.deepEqual(ids(sortRows(rows, m)).sort(), ['e1', 'e2', 'e3', 'x1']);
});

test('TC-019: PDF rows follow the on-screen order; unknown or missing ids keep their place at the end', () => {
  assert.deepEqual(ids(orderRowsByIds(rows, ['x1', 'e3', 'e1', 'e2'])), ['x1', 'e3', 'e1', 'e2']);
  assert.deepEqual(ids(orderRowsByIds(rows, ['e3', 'gone'])), ['e3', 'e1', 'e2', 'x1']);
  assert.deepEqual(ids(orderRowsByIds(rows, [])), ['e1', 'e2', 'e3', 'x1']);
});

test('TC-020: summary difference compares only what was spent (+ unplanned), not unspent estimates', () => {
  const t = buildCostTable(list, { estTotal: amt, actTotal: amt }).totals;
  // đã chi: Flights 1100 (dự kiến 1000) + Hotel 500 (dự kiến 600) + Taxi 80 phát sinh; Food 300 chưa chi
  assert.equal(t.spentPlanned, 1600);
  assert.equal(t.actual, 1680);
  assert.equal(t.spentDiff, 80);
  assert.equal(t.pending, 300);
  assert.equal(t.extra, 80);
});
