// TC-060 — handover.md is generated from spec.json and CI catches a stale one (REQ-047)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderHandover, handoverProblems, openRequirements, renderRequirements, renderTests, featureStage } from '../compass/build-views.mjs';

const spec = JSON.parse(readFileSync(new URL('../compass/spec.json', import.meta.url), 'utf8'));
const mini = {
  features: [{ id: 'F-1', name: 'Demo' }],
  requirements: [
    { id: 'REQ-1', title: 'A', status: 'Done', priority: 'Must', featureId: 'F-1', ac: ['x'] },
    { id: 'REQ-2', title: 'B', status: 'In build', priority: 'Should', featureId: 'F-1', ac: ['x'] },
  ],
  tests: [{ id: 'TC-1', reqIds: ['REQ-1'], status: 'Passing' }, { id: 'TC-2', reqIds: ['REQ-2'], status: 'Failing' }],
  decisions: [],
};

test('TC-060: the handover lists every open requirement, counts and the feature stage', () => {
  const h = renderHandover(mini, { date: '2026-11-25' });
  assert.match(h, /\*\*Requirements:\*\* 2 \(1 not done\) · \*\*Test cases:\*\* 2 \(1 failing\)/);
  assert.match(h, /\| F-1 Demo \| Build \| REQ-2 \|/);
  assert.match(h, /- \*\*REQ-2\*\* B — In build \(Should\)/);
  assert.doesNotMatch(h.split('## Open requirements')[1], /REQ-1\*\*/);
  assert.deepEqual(handoverProblems(mini, h), []);
});

test('TC-060: a stale handover is reported (a newly done or newly added requirement)', () => {
  const h = renderHandover(mini, { date: '2026-11-25' });
  const later = { ...mini, requirements: [...mini.requirements.slice(0, 1), { ...mini.requirements[1], status: 'Done' }, { id: 'REQ-3', title: 'C', status: 'Approved', priority: 'Could', ac: ['x'] }] };
  const problems = handoverProblems(later, h);
  assert.ok(problems.some((p) => p.includes('REQ-3 is open but not listed')));
  assert.ok(problems.some((p) => p.includes('REQ-2 is listed as open')));
  assert.ok(problems.some((p) => p.startsWith('summary line')));
});

test('TC-060: the committed handover.md matches the current spec', () => {
  const text = readFileSync(new URL('../compass/handover.md', import.meta.url), 'utf8');
  assert.deepEqual(handoverProblems(spec, text), []);
  assert.ok(openRequirements(spec).length > 0);
});

test('TC-060: requirements.md and tests.md are regenerated from the spec and committed up to date', () => {
  const read = (f) => readFileSync(new URL(`../compass/${f}`, import.meta.url), 'utf8');
  assert.equal(read('requirements.md'), renderRequirements(spec), 'run `node compass/build-views.mjs`');
  assert.equal(read('tests.md'), renderTests(spec), 'run `node compass/build-views.mjs`');
});

test('TC-060: a changed status is stale; a feature with only Draft requirements is an Idea', () => {
  const h = renderHandover(mini, { date: '2026-11-25' });
  const changed = { ...mini, requirements: [mini.requirements[0], { ...mini.requirements[1], status: 'Approved' }] };
  assert.ok(handoverProblems(changed, h).some((p) => p.startsWith('REQ-2 line should be')));
  const drafts = { ...mini, requirements: [{ ...mini.requirements[1], status: 'Draft' }] };
  assert.equal(featureStage(drafts, mini.features[0]), 'Idea');
});
