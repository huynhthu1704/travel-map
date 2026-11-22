// TC-001, TC-002, TC-003 — quyền chỉ xem trong chuyến đi (REQ-001)
import test from 'node:test';
import assert from 'node:assert/strict';
import { canEditTrip, isTripViewer, setViewer } from '../src/lib/tripAccess.js';

const trip = { ownerId: 'owner', memberIds: ['owner', 'an', 'binh'], viewerIds: ['binh'] };

test('TC-001: owner and editors can edit, viewers cannot', () => {
  assert.equal(canEditTrip(trip, 'owner'), true);
  assert.equal(canEditTrip(trip, 'an'), true);
  assert.equal(canEditTrip(trip, 'binh'), false);
  assert.equal(isTripViewer(trip, 'binh'), true);
});

test('TC-002: non-members and signed-out users cannot edit', () => {
  assert.equal(canEditTrip(trip, 'stranger'), false);
  assert.equal(canEditTrip(trip, null), false);
});

test('TC-003: owner can switch a member between view-only and edit, but never the owner', () => {
  assert.deepEqual(setViewer(trip, 'an', true).sort(), ['an', 'binh']);
  assert.deepEqual(setViewer(trip, 'binh', false), []);
  assert.deepEqual(setViewer(trip, 'owner', true), ['binh']);
  // người đã rời chuyến không còn trong danh sách chỉ xem
  assert.deepEqual(setViewer({ ...trip, memberIds: ['owner', 'an'] }, 'an', false), []);
  // chủ chuyến có lỡ nằm trong viewerIds vẫn sửa được
  assert.equal(canEditTrip({ ...trip, viewerIds: ['owner'] }, 'owner'), true);
});
