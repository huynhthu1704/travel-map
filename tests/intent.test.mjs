// TC-063 — requirements trace back to an approved intent (REQ-038)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { intentProblems } from '../compass/build-views.mjs';

const root = new URL('../', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('compass/spec.json', root), 'utf8'));
const readRepo = (f) => (existsSync(new URL(f, root)) ? readFileSync(new URL(f, root), 'utf8') : null);

test('TC-063: the intent template and the back-filled intent exist; linked requirements are valid', () => {
  const readme = readRepo('intent/README.md');
  for (const h of ['## What we want', '## Why', '## Constraints', '## Success measure', 'Status: Draft']) assert.ok(readme.includes(h), h);
  assert.deepEqual(intentProblems(spec, readRepo), []);
  assert.equal(spec.requirements.find((r) => r.id === 'REQ-037').intent, 'intent/2026-11-25-ai-native-sdlc.md');
});

test('TC-063: missing, unapproved or unlisted intents and new requirements without one are reported', () => {
  const files = { 'intent/a.md': 'Status: Draft\nREQ-051', 'intent/b.md': 'Status: Approved (by Christine)\nREQ-052' };
  const mini = {
    requirements: [
      { id: 'REQ-051', intent: 'intent/a.md' },
      { id: 'REQ-052', intent: 'intent/b.md' },
      { id: 'REQ-053', intent: 'intent/b.md' },
      { id: 'REQ-054' },
      { id: 'REQ-055', intent: 'intent/none.md' },
      { id: 'REQ-020' },
      { id: 'REQ-150' },
    ],
  };
  const p = intentProblems(mini, (f) => files[f] ?? null).join('\n');
  assert.match(p, /REQ-051 points to intent\/a\.md, which is not Approved/);
  assert.doesNotMatch(p, /REQ-052/);
  assert.match(p, /does not list REQ-053/);
  assert.match(p, /REQ-054 has no intent/);
  assert.match(p, /REQ-055 points to missing/);
  assert.doesNotMatch(p, /REQ-020|REQ-150/, 'older and baseline requirements are not required to have one');
});
