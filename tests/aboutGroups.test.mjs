// TC-030 — "Và còn nữa" theo nhóm, quan trọng trước (REQ-013)
import test from 'node:test';
import assert from 'node:assert/strict';
import { groupFeatures, ABOUT_GROUPS } from '../src/data/aboutGroups.js';

test('TC-030: related features sit together, important ones first, nothing is lost', () => {
  const f = (key) => ({ key });
  const input = ['gear', 'costReorder', 'selectedPin', 'costTable', 'newThing', 'tripPublicView', 'quickTour', 'costCompare'].map(f);
  const g = groupFeatures(input);
  assert.deepEqual(g.map((x) => x.id), ['trips', 'costs', 'guides', 'map', 'extras']);
  assert.deepEqual(g.find((x) => x.id === 'costs').items.map((x) => x.key), ['costTable', 'costCompare', 'costReorder']);
  assert.deepEqual(g.find((x) => x.id === 'extras').items.map((x) => x.key), ['quickTour', 'newThing']);
  assert.equal(g.flatMap((x) => x.items).length, input.length);
  // không có tính năng nào nằm ở 2 nhóm
  const all = ABOUT_GROUPS.flatMap((x) => x.keys);
  assert.equal(new Set(all).size, all.length);
});
