// TC-013 — ghim địa điểm đang chọn (REQ-005)
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSelected } from '../src/lib/mapSelect.js';

const ms = [
  { place: { id: 'a' }, kind: 'famous' },
  { place: { id: 'b' }, kind: 'visited' },
  { place: { id: 'c' }, kind: 'wishlist' },
];

test('TC-013: the selected place is taken out of the normal pins (and clusters) and drawn once on its own', () => {
  const r = pickSelected(ms, 'a');
  assert.equal(r.selected.place.id, 'a');
  assert.deepEqual(r.rest.map((m) => m.place.id), ['b', 'c']);
  assert.deepEqual(pickSelected(ms, null).rest, ms);
  assert.equal(pickSelected(ms, 'zzz').selected, null);
  assert.equal(pickSelected(ms, 'zzz').rest.length, 3);
});
