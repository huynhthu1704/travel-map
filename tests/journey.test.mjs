// TC-028 — mục đã xoá khỏi kế hoạch không còn hiện trong Hành trình (REQ-012)
import test from 'node:test';
import assert from 'node:assert/strict';
import { hideRemovedStops } from '../src/lib/tripAccess.js';

test('TC-028: stops of places removed from the plan are hidden; others stay', () => {
  const stops = [
    { id: 's1', place: { id: 'a' } },
    { id: 's2', place: { id: 'b' } },
    { id: 's3', place: { id: 'c' } },
    { id: 's4', place: { id: 'd' } },
  ];
  const plan = [
    { place: { id: 'a' } },
    { place: { id: 'b' }, removed: true },
    { place: { id: 'c' }, removed: true },
    { place: { id: 'c' } }, // thêm lại sau khi xoá → vẫn hiện
  ];
  assert.deepEqual(hideRemovedStops(stops, plan).map((s) => s.id), ['s1', 's3', 's4']);
  assert.deepEqual(hideRemovedStops(stops, []).length, 4);
});
