// TC-063 — requirements trace back to an approved intent (REQ-038)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { intentProblems, needProblems, DONE_WHEN_REQUIRED_FROM } from '../compass/build-views.mjs';

const root = new URL('../', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('compass/spec.json', root), 'utf8'));
const readRepo = (f) => (existsSync(new URL(f, root)) ? readFileSync(new URL(f, root), 'utf8') : null);

test('TC-063: the intent template and the back-filled intent exist; linked requirements are valid', () => {
  const readme = readRepo('compass/intent/README.md');
  for (const h of ['## What we want', '## Why', '## Constraints', '## Done when', 'Status: Draft']) assert.ok(readme.includes(h), h); // "## Success measure" became "## Done when" (REQ-059)
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
  // The same intent file is reported once, however many requirements point to it
  spec.requirements.push({ id: 'REQ-060', intent: 'compass/intent/y.md' }, { id: 'REQ-061', intent: 'compass/intent/y.md' });
  files['compass/intent/y.md'] = 'Status: Approved';
  assert.deepEqual(needProblems(spec, (f) => files[f] ?? null).length, 1);
  // The REQ-101…153 baseline is exempt
  assert.deepEqual(needProblems({ requirements: [{ id: 'REQ-120', intent: 'compass/intent/y.md' }] }, (f) => files[f] ?? null), []);
  // The template keeps her words and asks for the business intent (AC 2; "baseline → target" dropped by REQ-059)
  const readme = readRepo('compass/intent/README.md');
  assert.match(readme, /## Business need/);
  // only the template's placeholder line under "## What we want", up to the next heading
  const want = (readme.split(/^## What we want\s*$/m).at(-1) || '').split(/^## /m)[0];
  for (const part of ['who', 'what changes']) assert.ok(want.includes(part), `"## What we want" asks for ${part}`);
});

// TC-070 — every intent has a "Done when"; targets only for bets (REQ-059)
test('TC-070: the template, AGENTS.md and the deliver-change skill ask for "Done when", not a baseline → target', () => {
  // The template, AGENTS.md and the deliver-change skill describe the same rule
  const readme = readRepo('compass/intent/README.md');
  const template = readme.split('## Template').at(-1);
  assert.match(template, /^## Done when$/m);
  assert.doesNotMatch(template, /baseline → target/, 'the template does not ask every intent for a target');
  for (const kind of [/Small feature/, /Process or internal change/, /\bA bet\b/]) assert.match(readme, kind, `README names ${kind}`);
  // …and what each row says, so a reworded row cannot silently drop the rule
  for (const rule of [/Small feature[^\n]*no target/, /Process or internal change[^\n]*`## Done when` only/, /A bet[^\n]*current value[^\n]*after a few weeks of real data/]) assert.match(readme, rule);
  for (const f of ['AGENTS.md', '.claude/skills/deliver-change/SKILL.md']) {
    const t = readRepo(f);
    assert.match(t, /## Done when/, `${f} asks for Done when`);
    assert.match(t, /REQ-059/, f);
    assert.doesNotMatch(t, /measurable business intent/, `${f} no longer asks for a measurable intent`);
  }
});

// TC-070 (AC 4) — check-spec requires "## Done when" in intents of REQ-059 on
test('TC-070: intents of REQ-059 on need "## Done when" (check-spec)', () => {
  assert.equal(DONE_WHEN_REQUIRED_FROM, 59);
  const need = '## Business need\nwords\n';
  const files = { 'compass/intent/a.md': need, 'compass/intent/b.md': need, 'compass/intent/c.md': `${need}## Done when\nit works\n`, 'compass/intent/d.md': 'Status: Approved' };
  const p = (reqs) => needProblems({ requirements: reqs }, (f) => files[f] ?? null);
  assert.deepEqual(p([{ id: 'REQ-058', intent: 'compass/intent/a.md' }]), [], 'older intents are not required to have one');
  assert.match(p([{ id: 'REQ-059', intent: 'compass/intent/b.md' }])[0], /b\.md has no "## Done when" section/);
  assert.deepEqual(p([{ id: 'REQ-060', intent: 'compass/intent/c.md' }]), []);
  assert.deepEqual(p([{ id: 'REQ-120', intent: 'compass/intent/b.md' }]), [], 'the REQ-101…153 baseline is exempt');
  assert.match(p([{ id: 'REQ-061', intent: 'compass/intent/d.md' }]).join('\n'), /no "## Business need".*and no "## Done when"/, 'both missing → one message');
  assert.equal(p([{ id: 'REQ-061', intent: 'compass/intent/d.md' }]).length, 1);
  // the approved intent of REQ-059 itself follows the rule
  assert.match(readRepo('compass/intent/2026-11-27-done-when-before-targets.md'), /^## Done when$/m);
});


// TC-109 — intents live in compass/intent/ (REQ-052)
test('TC-109: intents live in compass/intent/ and no intent/ folder is left at the root', () => {
  assert.ok(!existsSync(new URL('intent', root)), 'no intent/ folder at the root');
  for (const r of spec.requirements) if (r.intent) assert.match(r.intent, /^compass\/intent\//, r.id);
});
