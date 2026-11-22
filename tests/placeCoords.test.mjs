// TC-038 — toạ độ quản trị viên sửa được áp ở mọi nơi (REQ-021)
import test from 'node:test';
import assert from 'node:assert/strict';
import { setCoordOverrides, fixPlace, fixMemory } from '../src/lib/fixes.js';

const halong = { id: 'wd-Q125', name: 'Ha Long Bay', lat: 20.0, lng: 107.0 };

test('TC-038: an admin coordinate override moves saved places, memories and directions', () => {
  setCoordOverrides({ 'wd-Q125': { nameVi: 'Vịnh Hạ Long', lat: 20.91, lng: 107.18 } });
  assert.deepEqual([fixPlace(halong).lat, fixPlace(halong).lng], [20.91, 107.18]);
  assert.equal(fixMemory({ id: 'm', place: halong }).place.lat, 20.91);
});

test('TC-038: overrides without coordinates or with blank values change nothing', () => {
  setCoordOverrides({ 'wd-Q125': { nameVi: 'Vịnh Hạ Long' }, x: { lat: '', lng: '' } });
  assert.equal(fixPlace(halong), halong);
  setCoordOverrides({});
});
