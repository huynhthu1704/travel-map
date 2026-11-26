// TC-063 — requirements trace back to an approved intent (REQ-038)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { intentProblems, needProblems } from '../compass/build-views.mjs';

const root = new URL('../', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('compass/spec.json', root), 'utf8'));
const readRepo = (f) => (existsSync(new URL(f, root)) ? readFileSync(new URL(f, root), 'utf8') : null);

test('TC-063: the intent template and the back-filled intent exist; linked requirements are valid', () => {
  const readme = readRepo('compass/intent/README.md');
  for (const h of ['## What we want', '## Why', '## Constraints', '## Success measure', 'Status: Draft']) assert.ok(readme.includes(h), h);
  assert.deepEqual(intentProblems(spec, readRepo), []);
  assert.equal(spec.requirements.find((r) => r.id === 'REQ-037').intent, 'compass/intent/2026-11-25-ai-native-sdlc.md');
  const agents = readRepo('AGENTS.md');
  assert.match(agents, /0\. \*\*Business need → intent \(REQ-038, REQ-054\):\*\*/);
  assert.match(agents, /intent\/README\.md/);
});

test('TC-063: missing, unapproved or unlisted intents and new requirements without one are reported', () => {
  const files = {
    'compass/intent/a.md': 'Status: Draft\n## Requirements\n- REQ-051',
    'compass/intent/b.md': 'Status: Approved (by Christine)\n## Requirements\n- REQ-052',
    'compass/intent/c.md': 'Status: Approved\n## Out of scope\nREQ-056\n## Requirements\n- none yet',
  };
  const mini = {
    requirements: [
      { id: 'REQ-051', intent: 'compass/intent/a.md' },
      { id: 'REQ-052', intent: 'compass/intent/b.md' },
      { id: 'REQ-053', intent: 'compass/intent/b.md' },
      { id: 'REQ-054' },
      { id: 'REQ-055', intent: 'compass/intent/none.md' },
      { id: 'REQ-020' },
      { id: 'REQ-150' },
      { id: 'REQ-160' },
      { id: 'REQ-51a' },
      { id: 'REQ-056', intent: 'compass/intent/c.md' },
    ],
  };
  const p = intentProblems(mini, (f) => files[f] ?? null).join('\n');
  assert.match(p, /REQ-051 points to compass\/intent\/a\.md, which is not Approved/);
  assert.doesNotMatch(p, /REQ-052/);
  assert.match(p, /does not list REQ-053/);
  assert.match(p, /REQ-054 has no intent/);
  assert.match(p, /REQ-055 points to missing/);
  assert.doesNotMatch(p, /REQ-020|REQ-150/, 'older and baseline requirements are not required to have one');
  assert.match(p, /REQ-160 has no intent/, 'only REQ-101…153 is exempt');
  assert.match(p, /REQ-51a is not a valid requirement id/);
  assert.match(p, /does not list REQ-056/, 'the id must be under ## Requirements');
});

// TC-111 — new intents keep the business need (REQ-054)
test('TC-111: intents of new requirements keep the business need', () => {
  const spec = { requirements: [{ id: 'REQ-052', intent: 'compass/intent/x.md' }, { id: 'REQ-030', intent: 'compass/intent/old.md' }] };
  const files = { 'compass/intent/x.md': 'Status: Draft\n## What we want\nmore', 'compass/intent/old.md': 'Status: Approved' };
  assert.match(needProblems(spec, (f) => files[f] ?? null)[0], /x\.md has no "## Business need"/);
  files['compass/intent/x.md'] += '\n## Business need\nwords';
  assert.deepEqual(needProblems(spec, (f) => files[f] ?? null), []);
  assert.match(readRepo('compass/intent/README.md'), /## Business need/);
});


// TC-109 — intents live in compass/intent/ (REQ-052)
test('TC-109: intents live in compass/intent/ and no intent/ folder is left at the root', () => {
  assert.ok(!existsSync(new URL('intent', root)), 'no intent/ folder at the root');
  for (const r of spec.requirements) if (r.intent) assert.match(r.intent, /^compass\/intent\//, r.id);
});
