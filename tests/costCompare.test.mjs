// TC-005..TC-008 — so sánh dự kiến / thực tế (REQ-002) và sắp xếp khoản chi (REQ-003)
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareCosts, sortByOrder, reorderPatch, moveId } from '../src/lib/costCompare.js';

const amt = (c) => c.amount;
const costs = [
  { id: 'e1', type: 'estimate', title: 'Flights', amount: 1000 },
  { id: 'e2', type: 'estimate', title: 'Hotel', amount: 600 },
  { id: 'e3', type: 'estimate', title: 'Food', amount: 300 },
  { id: 'a1', type: 'actual', title: 'Flights', amount: 1100, estimateId: 'e1' },
  { id: 'a2', type: 'actual', title: 'Hotel', amount: 500, estimateId: 'e2' },
  { id: 'a3', type: 'actual', title: 'Taxi', amount: 80, date: '2026-11-12' },
  { id: 'a4', type: 'actual', title: 'Souvenirs', amount: 120, date: '2026-11-11' },
  { id: 'p1', type: 'payment', amount: 999 },
];

test('TC-005: each estimate shows planned, actual and difference with a status', () => {
  const r = compareCosts(costs, { estTotal: amt, actTotal: amt });
  const by = Object.fromEntries(r.rows.map((x) => [x.id, x]));
  assert.equal(by.e1.diff, 100);
  assert.equal(by.e1.status, 'over');
  assert.equal(by.e2.status, 'under');
  assert.equal(by.e3.status, 'pending');
  assert.equal(by.e3.diff, null);
});

test('TC-006: actuals not linked to an estimate are listed as unplanned, sorted by date', () => {
  const r = compareCosts(costs, { estTotal: amt, actTotal: amt });
  assert.deepEqual(r.unplanned.map((u) => u.id), ['a4', 'a3']);
  assert.equal(r.totals.unplanned, 200);
  assert.equal(r.totals.planned, 1900);
  assert.equal(r.totals.actual, 1800);
  assert.equal(r.totals.diff, -100);
  assert.equal(r.totals.pending, 300);
  // dự kiến đã bị xoá → khoản thực tế trỏ tới nó thành phát sinh
  const orphan = compareCosts([...costs, { id: 'a5', type: 'actual', amount: 10, estimateId: 'gone' }], { estTotal: amt, actTotal: amt });
  assert.ok(orphan.unplanned.some((u) => u.id === 'a5'));
});

test('TC-007: sortByOrder puts ordered items first in order, the rest keep their fallback order', () => {
  const list = [{ id: 'a' }, { id: 'b', order: 1 }, { id: 'c', order: 0 }, { id: 'd' }];
  assert.deepEqual(sortByOrder(list).map((x) => x.id), ['c', 'b', 'a', 'd']);
});

test('TC-008: dragging writes only the items whose position changed', () => {
  const list = [{ id: 'a', order: 0 }, { id: 'b', order: 1 }, { id: 'c', order: 2 }];
  const next = moveId(list.map((x) => x.id), 'c', 0);
  assert.deepEqual(next, ['c', 'a', 'b']);
  assert.deepEqual(reorderPatch(list, next), [
    { id: 'c', order: 0 },
    { id: 'a', order: 1 },
    { id: 'b', order: 2 },
  ]);
  assert.deepEqual(reorderPatch(list, ['a', 'b', 'c']), []);
});

import { buildCostTable } from '../src/lib/costCompare.js';

test('TC-010: unified table — one row per cost item with its linked actuals, extras inline, totals', () => {
  const list = [
    { id: 'e1', type: 'estimate', title: 'Flights', amount: 1000, createdAt: 1 },
    { id: 'a3', type: 'actual', title: 'Taxi', amount: 80, createdAt: 2 },
    { id: 'e2', type: 'estimate', title: 'Hotel', amount: 600, createdAt: 3 },
    { id: 'a1', type: 'actual', title: 'Flight 1', amount: 700, estimateId: 'e1', date: '2026-11-10', createdAt: 4 },
    { id: 'a2', type: 'actual', title: 'Flight 2', amount: 400, estimateId: 'e1', date: '2026-11-09', createdAt: 5 },
    { id: 'p1', type: 'payment', amount: 5 },
  ];
  const r = buildCostTable(list, { estTotal: amt, actTotal: amt });
  assert.deepEqual(r.rows.map((x) => [x.id, x.kind, x.status]), [
    ['e1', 'item', 'over'],
    ['a3', 'extra', 'extra'],
    ['e2', 'item', 'pending'],
  ]);
  assert.deepEqual(r.rows[0].actuals.map((a) => a.id), ['a2', 'a1']);
  assert.equal(r.rows[0].diff, 100);
  assert.deepEqual(r.totals, { planned: 1600, actual: 1180, extra: 80, pending: 600, diff: -420, spentPlanned: 1000, spentDiff: 180 });
});

test('TC-011: unified table follows drag order across items and extras', () => {
  const list = [
    { id: 'e1', type: 'estimate', amount: 1, order: 2 },
    { id: 'x1', type: 'actual', amount: 1, order: 0 },
    { id: 'e2', type: 'estimate', amount: 1, order: 1 },
  ];
  assert.deepEqual(buildCostTable(list, { estTotal: amt, actTotal: amt }).rows.map((r) => r.id), ['x1', 'e2', 'e1']);
});
