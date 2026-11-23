// TC-040 — thẻ hướng dẫn nhanh không che nút trên điện thoại (REQ-023)
import test from 'node:test';
import assert from 'node:assert/strict';
import { mobileCardPlacement } from '../src/lib/tourLayout.js';

const vh = 844;
const overlaps = (rect, c) => {
  const top = c.top ?? vh - c.bottom - c.room;
  const bottom = c.top != null ? c.top + c.room : vh - c.bottom;
  return !(bottom <= rect.top || top >= rect.top + rect.height);
};

test('TC-040: a button low on the screen gets the card above it, sized to fit', () => {
  const rect = { top: 583, height: 54 };
  const c = mobileCardPlacement(rect, vh);
  assert.ok(c.bottom != null && !overlaps(rect, c));
  assert.match(c.maxHeight, /min\(62dvh, \d+px\)/);
});

test('TC-040: a tab in the middle-right gets the card in the larger free space', () => {
  const rect = { top: 365, height: 46 };
  const c = mobileCardPlacement(rect, vh);
  assert.ok(c.top >= rect.top + rect.height && !overlaps(rect, c));
});

test('TC-040: the full-screen map keeps the card at the bottom', () => {
  assert.match(mobileCardPlacement({ top: 63, height: 720 }, vh).bottom, /84px/);
});
