// TC-051 — cost types (REQ-031)
import test from 'node:test';
import assert from 'node:assert/strict';
import { COST_TYPES, costTypeLabel } from '../src/data/costTypes.js';
import { buildTripWorkbook } from '../src/lib/tripExcel.js';

test('TC-051: ten cost types with Vietnamese and English names', () => {
  assert.equal(COST_TYPES.length, 10);
  assert.ok(COST_TYPES.every((x) => x.key && x.icon && x.vi && x.en));
  assert.equal(costTypeLabel('stay'), 'Lưu trú');
  assert.equal(costTypeLabel('stay', 'en'), 'Accommodation');
  assert.equal(costTypeLabel(''), '');
});

test('TC-051: the Excel export shows the cost type name and lists all types in Master data', () => {
  const trip = { name: 'T', currency: 'VND', memberIds: ['u1'], members: { u1: { name: 'Lan' } } };
  const { sheets, columns: C } = buildTripWorkbook(trip, [], [{ id: 'a', type: 'actual', title: 'Hostel', amount: 500000, paidBy: 'u1', costType: 'stay' }]);
  const row = sheets[0].data.find((r) => r.some((c) => c && String(c.value).includes('Hostel')));
  assert.equal(row[C.costType - 1].value, 'Lưu trú');
  const master = sheets.find((s) => s.sheet === 'Master data').data.map((r) => (r[3] && r[3].value !== undefined ? r[3].value : r[3]));
  assert.deepEqual(master.slice(1, 11), COST_TYPES.map((x) => x.vi));
});
