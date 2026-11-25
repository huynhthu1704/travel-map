// TC-064 — a plan before coding, kept with the code (REQ-039)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractPlan, planProblems } from '../compass/guardrails-lib.mjs';
import { parseCloses, latestReviewVerdict, mergeBlockers, commitMessage } from '../compass/merge-pr.mjs';

const good = '## What\nx\n\n## Plan\n- Files: src/a.js\n- Steps: one\n- Risks: none\n- Proof: TC-1\n\n## Checklist\n- [ ] y';

test('TC-064: a PR that changes code needs a filled-in Plan; docs-only PRs do not', () => {
  assert.match(extractPlan(good), /^- Files: src\/a\.js/);
  assert.deepEqual(planProblems(good, [{ path: 'src/a.js' }]), []);
  assert.match(planProblems('## What\nx', [{ path: 'src/a.js' }])[0], /no "## Plan" section/);
  assert.match(planProblems('## Plan\n<!-- hint -->\n- Files:\n- Risks:\n- Proof:', [{ path: 'compass/x.mjs' }])[0], /Files, Risks, Proof/);
  assert.deepEqual(planProblems('', [{ path: 'README.md' }, { path: 'compass/spec.json' }]), []);
  assert.deepEqual(planProblems('## Plan\n- **Files** (3): a\n- Risks: r\n- Proof: p', [{ path: 'e2e/x.spec.mjs' }]), []);
});

test('TC-064: the PR template asks for the plan', () => {
  const t = readFileSync(new URL('../.github/pull_request_template.md', import.meta.url), 'utf8');
  for (const k of ['## Plan', 'Files:', 'Risks:', 'Proof']) assert.ok(t.includes(k), k);
});

test('TC-064: merge-pr refuses without green CI and an APPROVE review, and keeps the plan in the commit', () => {
  const ok = [{ name: 'test', status: 'completed', conclusion: 'success' }, { name: 'e2e', status: 'completed', conclusion: 'success' }];
  const review = (v, at) => ({ body: `## Independent review (Claude)\nVerdict: ${v}   ·   Important: 0`, created_at: at });
  assert.deepEqual(mergeBlockers({ checkRuns: ok, comments: [review('APPROVE', '2026-11-25T01:00:00Z')], files: [], labels: [] }), []);
  assert.equal(latestReviewVerdict([review('APPROVE', '2026-11-25T01:00:00Z'), review('CHANGES NEEDED', '2026-11-25T02:00:00Z')]), 'CHANGES NEEDED');
  assert.ok(mergeBlockers({ checkRuns: [{ name: 'e2e', status: 'completed', conclusion: 'failure' }], comments: [review('APPROVE', 'x')] }).some((b) => b.includes('failure')));
  assert.ok(mergeBlockers({ checkRuns: ok, comments: [] }).some((b) => b.includes('no independent review')));
  assert.ok(mergeBlockers({ checkRuns: ok, comments: [review('APPROVE', 'x')], files: [{ filename: 'firestore.rules' }], labels: [] }).some((b) => b.includes('firestore.rules')));
  assert.deepEqual(parseCloses('Closes #62\nfixes #7 and Resolves #7'), [62, 7]);
  assert.match(commitMessage(good, 'Co-Authored-By: X'), /^Plan:\n- Files: src\/a\.js[\s\S]*Co-Authored-By: X$/);
});
