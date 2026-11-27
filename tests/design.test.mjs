// TC-112 — an approved design before any code (REQ-055)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { designProblems } from '../compass/build-views.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('TC-112: no code before an approved design', () => {
  const fig = '\nFrame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=1-2'; // REQ-057
  const files = { 'compass/design/d.md': `Status: Draft\nRequirements: REQ-060${fig}` };
  const check = (reqs) => designProblems({ requirements: reqs }, (f) => files[f] ?? null);
  assert.match(check([{ id: 'REQ-060', status: 'Approved' }])[0], /REQ-060 has no design/);
  assert.deepEqual(check([{ id: 'REQ-060', status: 'Draft' }]), [], 'a Draft requirement may wait for its design');
  assert.deepEqual(check([{ id: 'REQ-040', status: 'Done' }, { id: 'REQ-120', status: 'Done' }]), [], 'older and baseline requirements are exempt');
  assert.deepEqual(check([{ id: 'REQ-060', status: 'Approved', design: 'compass/design/d.md' }]), []);
  assert.match(check([{ id: 'REQ-060', status: 'In build', design: 'compass/design/d.md' }])[0], /not Approved — no code/);
  assert.match(check([{ id: 'REQ-061', status: 'Approved', design: 'compass/design/d.md' }])[0], /does not mention REQ-061/);
  assert.match(check([{ id: 'REQ-06', status: 'Approved', design: 'compass/design/d.md' }])[0] || '', /does not mention REQ-06/, 'a longer id does not count');
  assert.match(check([{ id: 'REQ-060', status: 'Approved', design: 'compass/design/none.md' }])[0], /missing/);
  assert.deepEqual(check([{ id: 'REQ-060', status: 'Done', design: 'none: CI script only' }]), []);
  files['compass/design/d.md'] = `Status: Approved (by PO, 2026-11-26)\nRequirements: REQ-060${fig}`;
  assert.deepEqual(check([{ id: 'REQ-060', status: 'In build', design: 'compass/design/d.md' }]), []);
});

test('TC-112: the design template and the workflow describe the gate', () => {
  const readme = read('compass/design/README.md');
  for (const h of ['Status: Draft', '## Screens', 'States:', 'Frame:', 'none: <reason>']) assert.ok(readme.includes(h), h);
  assert.match(read('AGENTS.md'), /No code before the Product Owner approves the design/);
});

// TC-113 — a Figma frame in every UI design (REQ-057)
test('TC-113: a UI design from REQ-056 on links a Figma frame of the project file before code', () => {
  const tool = 'https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ';
  const files = { 'compass/design/d.md': 'Status: Approved (by PO, 2026-11-26)\nRequirements: REQ-056, REQ-050, REQ-120' };
  const check = (reqs) => designProblems({ designTool: tool, requirements: reqs }, (f) => files[f] ?? null);
  const d = 'compass/design/d.md';
  assert.match(check([{ id: 'REQ-056', status: 'In build', design: d }])[0], /REQ-056 is In build but .* links no Figma frame/);
  assert.match(check([{ id: 'REQ-056', status: 'Done', design: d }])[0], /no Figma frame/);
  assert.deepEqual(check([{ id: 'REQ-056', status: 'Approved', design: d }]), [], 'the design is drawn after the requirement is approved');
  assert.deepEqual(check([{ id: 'REQ-056', status: 'Draft', design: d }]), []);
  assert.deepEqual(check([{ id: 'REQ-056', status: 'Done', design: 'none: no UI' }]), [], 'no UI, no frame');
  assert.deepEqual(check([{ id: 'REQ-050', status: 'Done', design: d }]), [], 'older requirements are exempt');
  assert.deepEqual(check([{ id: 'REQ-120', status: 'Done', design: d }]), [], 'the REQ-101…153 baseline is exempt');
  files[d] += `\nDesign tool: ${tool}`;
  assert.match(check([{ id: 'REQ-056', status: 'In build', design: d }])[0], /no Figma frame/, 'a file link is not a frame');
  files[d] += '\nFrame: https://www.figma.com/design/AAAAAAAAAAAAAAAAAAAAAA?node-id=1-2';
  assert.match(check([{ id: 'REQ-056', status: 'In build', design: d }])[0], /no Figma frame/, 'a frame of another Figma file does not count');
  files[d] += `\nFrame: ${tool}?node-id=21-5`;
  assert.deepEqual(check([{ id: 'REQ-056', status: 'In build', design: d }]), []);
});

test('TC-113: the template, the skill and the agent knowledge ask for Figma frames', () => {
  assert.match(read('compass/design/README.md'), /REQ-057/);
  assert.match(read('compass/agent-knowledge.md'), /REQ-057/);
  assert.match(read('.claude/skills/deliver-change/SKILL.md'), /REQ-057/);
  assert.match(JSON.parse(read('compass/spec.json')).designTool, /^https:\/\/www\.figma\.com\/design\/[0-9A-Za-z]{22,}$/);
});

// TC-121 — Figma file layout: components on one page, one section per feature (REQ-061)
test('TC-121: the template, the skill and the agent knowledge put components on the Components page and each feature in one section', () => {
  for (const f of ['compass/design/README.md', 'compass/agent-knowledge.md', '.claude/skills/deliver-change/SKILL.md']) {
    const text = read(f);
    assert.match(text, /REQ-061/, `${f} names REQ-061`);
    assert.match(text, /🧩 Components/, `${f} names the Components page`);
    assert.match(text, /one Figma section/, `${f} asks for one Figma section per feature`);
  }
});
