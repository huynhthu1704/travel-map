// TC-022, TC-023 — link chỉ xem cho người không phải thành viên (REQ-007)
import test from 'node:test';
import assert from 'node:assert/strict';
import { canViewTrip, canEditTrip, visibleTripTabs } from '../src/lib/tripAccess.js';

const trip = { ownerId: 'o', memberIds: ['o', 'm'] };

test('TC-022: only members can view unless the owner turns on the view-only link; link viewers never edit', () => {
  assert.equal(canViewTrip(trip, 'x'), false);
  assert.equal(canViewTrip(trip, null), false);
  assert.equal(canViewTrip(trip, 'm'), true);
  const pub = { ...trip, publicView: true };
  assert.equal(canViewTrip(pub, 'x'), true);
  assert.equal(canViewTrip(pub, null), true);
  assert.equal(canEditTrip(pub, 'x'), false);
  assert.equal(canEditTrip(pub, null), false);
});

test('TC-023: link viewers see Plan and Checklist, Costs only when allowed, never Journey', () => {
  assert.deepEqual(visibleTripTabs({ ...trip, publicView: true }, 'x'), ['plan', 'checklist']);
  assert.deepEqual(visibleTripTabs({ ...trip, publicView: true, publicCosts: true }, null), ['plan', 'costs', 'checklist']);
  assert.deepEqual(visibleTripTabs(trip, 'x'), []);
  assert.deepEqual(visibleTripTabs(trip, 'm'), ['plan', 'costs', 'checklist', 'journey']);
});
