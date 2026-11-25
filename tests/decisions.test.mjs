// TC-061 — decisions are recorded as ADRs (REQ-046)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decisionProblems, renderDecisions } from '../compass/build-views.mjs';

const spec = JSON.parse(readFileSync(new URL('../compass/spec.json', import.meta.url), 'utf8'));

test('TC-061: the November 2026 decisions are back-filled and valid', () => {
  assert.ok(spec.decisions.length >= 10);
  assert.deepEqual(decisionProblems(spec), []);
  const titles = spec.decisions.map((a) => a.title).join(' | ');
  for (const k of ['GitHub Pages', 'feature flags', 'branch protection', 'Independent review', 'Guardrails']) assert.ok(titles.includes(k), `missing ADR about ${k}`);
});

test('TC-061: incomplete or broken ADRs are reported', () => {
  const bad = { requirements: [{ id: 'REQ-1' }], decisions: [{ id: 'ADR-1', title: 'x', status: 'Maybe', date: '25/11', reqIds: ['REQ-9'] }, { id: 'ADR-1' }, { id: 'ADR-002', reqIds: 'REQ-1' }, { title: 'no id' }] };
  const p = decisionProblems(bad).join('\n');
  for (const s of ['has no context', 'should look like ADR-001', 'is used twice', 'status must be one of', 'unknown REQ-9', 'date should be YYYY-MM-DD', 'reqIds should be a list', '(no id) has no id']) assert.ok(p.includes(s), s);
  assert.doesNotThrow(() => renderDecisions(bad));
});

test('TC-061: decisions.md is generated from the spec and up to date', () => {
  const md = readFileSync(new URL('../compass/decisions.md', import.meta.url), 'utf8');
  assert.equal(md, renderDecisions(spec), 'run `node compass/build-views.mjs`');
  assert.match(md, /## ADR-001 — /);
});
