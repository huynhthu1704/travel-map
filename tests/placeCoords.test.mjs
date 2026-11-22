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

// TC-039 — Chỉ đường mở link Google Maps quản trị viên đã gắn (REQ-022)
test('TC-039: a Google Maps link saved by an admin travels with the place', () => {
  setCoordOverrides({ 'wd-Q125': { lat: 3.2389573, lng: 101.6816966, gmapsLink: 'https://maps.app.goo.gl/abc123' } });
  assert.equal(fixPlace(halong).gmapsLink, 'https://maps.app.goo.gl/abc123');
  setCoordOverrides({});
});

test('TC-039: only real https Google Maps links are accepted', async () => {
  const { safeGmapsLink } = await import('../src/lib/fixes.js');
  assert.ok(safeGmapsLink('https://www.google.com/maps/place/Batu+Caves/@3.2379,101.684,17z'));
  assert.ok(safeGmapsLink('https://maps.app.goo.gl/xyz'));
  assert.equal(safeGmapsLink('http://maps.app.goo.gl/xyz'), '');
  assert.equal(safeGmapsLink('https://evil.example/maps'), '');
  assert.equal(safeGmapsLink('https://www.google.com/search?q=x'), '');
  assert.equal(safeGmapsLink('javascript:alert(1)'), '');
});
