// TC-112 — an approved design before any code (REQ-055)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { designProblems } from '../compass/build-views.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('TC-112: no code before an approved design', () => {
  const files = { 'compass/design/d.md': 'Status: Draft\nRequirements: REQ-060' };
  const check = (reqs) => designProblems({ requirements: reqs }, (f) => files[f] ?? null);
  assert.match(check([{ id: 'REQ-060', status: 'Approved' }])[0], /REQ-060 has no design/);
  assert.deepEqual(check([{ id: 'REQ-060', status: 'Draft' }]), [], 'a Draft requirement may wait for its design');
  assert.deepEqual(check([{ id: 'REQ-040', status: 'Done' }, { id: 'REQ-120', status: 'Done' }]), [], 'older and baseline requirements are exempt');
  assert.deepEqual(check([{ id: 'REQ-060', status: 'Approved', design: 'compass/design/d.md' }]), []);
  assert.match(check([{ id: 'REQ-060', status: 'In build', design: 'compass/design/d.md' }])[0], /not Approved — no code/);
  assert.match(check([{ id: 'REQ-061', status: 'Approved', design: 'compass/design/d.md' }])[0], /does not mention REQ-061/);
  assert.match(check([{ id: 'REQ-060', status: 'Approved', design: 'compass/design/none.md' }])[0], /missing/);
  assert.deepEqual(check([{ id: 'REQ-060', status: 'Done', design: 'none: CI script only' }]), []);
  files['compass/design/d.md'] = 'Status: Approved (by PO, 2026-11-26)\nRequirements: REQ-060';
  assert.deepEqual(check([{ id: 'REQ-060', status: 'In build', design: 'compass/design/d.md' }]), []);
});

test('TC-112: the design template and the workflow describe the gate', () => {
  const readme = read('compass/design/README.md');
  for (const h of ['Status: Draft', '## Screens', 'States:', 'Frame:', 'none: <reason>']) assert.ok(readme.includes(h), h);
  assert.match(read('AGENTS.md'), /No code before the Product Owner approves the design/);
});
