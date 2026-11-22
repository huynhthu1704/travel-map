// TC-031 — thông tin đầu trang chuyến đi (REQ-014)
import test from 'node:test';
import assert from 'node:assert/strict';
import { tripDuration, planPlaceCount } from '../src/lib/tripAccess.js';

test('TC-031: trip length in days/nights and number of planned places', () => {
  assert.deepEqual(tripDuration('2026-11-10', '2026-11-14'), { days: 5, nights: 4 });
  assert.deepEqual(tripDuration('2026-11-10', ''), { days: 1, nights: 0 });
  assert.deepEqual(tripDuration('2026-11-10', '2026-11-10'), { days: 1, nights: 0 });
  assert.equal(tripDuration('', '2026-11-10'), null);
  assert.equal(tripDuration('2026-11-14', '2026-11-10'), null);
  // 2 mục cùng địa điểm tính 1; mục đã xoá không tính
  assert.equal(planPlaceCount([{ place: { id: 'a' } }, { place: { id: 'a' } }, { place: { id: 'b' }, removed: true }, { place: { id: 'c' } }]), 2);
});
