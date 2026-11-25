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
  assert.match(planProblems('## Plan\n<!-- hint -->\n- Files:\n- Steps:\n- Risks:\n- Proof:', [{ path: 'compass/x.mjs' }])[0], /Files, Steps, Risks, Proof/);
  assert.deepEqual(planProblems('', [{ path: 'README.md' }, { path: 'compass/spec.json' }]), []);
  assert.deepEqual(planProblems('## Plan\n- **Files** (3): a\n- Steps: s\n- Risks: r\n- Proof: p', [{ path: 'e2e/x.spec.mjs' }]), []);
});

test('TC-064: the PR template asks for the plan', () => {
  const t = readFileSync(new URL('../.github/pull_request_template.md', import.meta.url), 'utf8');
  for (const k of ['## Plan', 'Files:', 'Risks:', 'Proof']) assert.ok(t.includes(k), k);
});

test('TC-064: Steps is required, empty bold labels do not count, the plan stops at a --- footer', () => {
  assert.match(planProblems('## Plan\n- Files: a\n- Risks: r\n- Proof: p', [{ path: 'src/a.js' }])[0], /Steps/);
  const empty = '## Plan\r\n- **Files:**\r\n- **Steps:**\r\n- **Risks:**\r\n- **Proof:**\r\n';
  assert.match(planProblems(empty, [{ path: 'src/a.js' }])[0], /Files, Steps, Risks, Proof/);
  assert.equal(extractPlan('## Plan\n- Files: a\n\n---\n_footer_'), '- Files: a');
  assert.equal(planProblems('', [{ path: 'vite.config.js' }]).length, 1, 'root config files are code');
});

test('TC-064: merge-pr refuses without green CI and a trusted APPROVE of the head commit, and keeps the plan in the commit', () => {
  const ok = [{ name: 'test', status: 'completed', conclusion: 'success' }, { name: 'e2e', status: 'completed', conclusion: 'success' }];
  const head = 'abcdef1234567890abcdef1234567890abcdef12';
  const review = (v, at, sha = head, who = 'OWNER') => ({ body: `## Independent review (Claude)\nVerdict: ${v}   ·   Important: 0\nReviewed commit: ${sha}`, created_at: at, author_association: who });
  const base = { checkRuns: ok, files: [], labels: [], headSha: head };
  assert.deepEqual(mergeBlockers({ ...base, comments: [review('APPROVE', '2026-11-25T01:00:00Z')] }), []);
  assert.equal(latestReviewVerdict([review('APPROVE', '2026-11-25T01:00:00Z'), review('CHANGES NEEDED', '2026-11-25T02:00:00Z')]), 'CHANGES NEEDED');
  const stranger = mergeBlockers({ ...base, comments: [review('CHANGES NEEDED', '2026-11-25T01:00:00Z'), review('APPROVE', '2026-11-25T02:00:00Z', head, 'NONE')] });
  assert.ok(stranger.some((b) => b.includes('CHANGES NEEDED')), 'an APPROVE from someone without write access is ignored');
  assert.ok(mergeBlockers({ ...base, comments: [review('APPROVE', 'x', '1111111')] }).some((b) => b.includes('fresh review of the latest commit')), 'an APPROVE of an older commit does not count');
  assert.ok(mergeBlockers({ ...base, comments: [review('APPROVE', 'x').body.replace(/Reviewed commit.*/, '')].map((body) => ({ body, author_association: 'OWNER' })) }).some((b) => b.includes('(none given)')));
  assert.ok(mergeBlockers({ ...base, checkRuns: [ok[0]], comments: [review('APPROVE', 'x')] }).some((b) => b.includes('"e2e" has not run')));
  assert.ok(mergeBlockers({ ...base, checkRuns: [ok[0], { ...ok[1], conclusion: 'failure' }], comments: [review('APPROVE', 'x')] }).some((b) => b.includes('failure')));
  assert.ok(mergeBlockers({ ...base, comments: [] }).some((b) => b.includes('no independent review')));
  assert.ok(mergeBlockers({ ...base, comments: [review('APPROVE', 'x')], files: [{ filename: 'firestore.rules' }] }).some((b) => b.includes('firestore.rules')));
  assert.deepEqual(parseCloses('Closes #62\nfixes #7 and Resolves #7'), [62, 7]);
  assert.match(commitMessage(good + '\n\n---\nfooter', 'Co-Authored-By: X'), /^Plan:\n- Files: src\/a\.js[\s\S]*Co-Authored-By: X$/);
  assert.doesNotMatch(commitMessage(good + '\n\n---\nfooter'), /footer/);
});

// TC-067 — hardening of merge-pr and the plan check (REQ-051)
test('TC-067: placeholder values (-, TBD, TODO, n/a) do not fill a Plan line; real short values still do', () => {
  const plan = (files, steps = 'one', risks = 'none', proof = 'TC-1') => `## Plan\n- Files: ${files}\n- Steps: ${steps}\n- Risks: ${risks}\n- Proof: ${proof}`;
  for (const ph of ['-', '—', 'TBD', 'todo', 'n/a', 'N/A', '...', '**TBD**', '?']) {
    assert.match(planProblems(plan(ph), [{ path: 'src/a.js' }])[0] || '', /Files/, `"${ph}" counts as missing`);
  }
  assert.match(planProblems(plan('a', 'TODO', 'n/a', '-'), [{ path: 'src/a.js' }])[0], /Steps, Risks, Proof/);
  assert.deepEqual(planProblems(plan('src/a.js', 'one', 'none'), [{ path: 'src/a.js' }]), [], '"none" is a real answer');
  assert.deepEqual(planProblems('## Plan\n- **Files:** - src/a.js\n- **Steps:** 1. edit\n- **Risks:** low\n- **Proof:** TC-1', [{ path: 'src/a.js' }]), []);
});

test('TC-067: merge-pr refuses a code PR whose Plan was removed or emptied after CI passed', () => {
  const ok = [{ name: 'test', status: 'completed', conclusion: 'success' }, { name: 'e2e', status: 'completed', conclusion: 'success' }];
  const head = 'abcdef1234567890abcdef1234567890abcdef12';
  const comments = [{ body: `## Independent review (Claude)\nVerdict: APPROVE\nReviewed commit: ${head}`, created_at: 'x', author_association: 'OWNER' }];
  const base = { checkRuns: ok, comments, labels: [], headSha: head, files: [{ filename: 'compass/merge-pr.mjs' }] };
  assert.deepEqual(mergeBlockers({ ...base, body: good }), []);
  assert.ok(mergeBlockers({ ...base, body: '## What\nx' }).some((b) => /plan:.*no "## Plan"/.test(b)), 'plan removed');
  assert.ok(mergeBlockers({ ...base, body: '## Plan\n- Files: TBD\n- Steps: -\n- Risks: r\n- Proof: p' }).some((b) => /plan:.*Files, Steps/.test(b)), 'plan emptied');
  assert.deepEqual(mergeBlockers({ ...base, files: [{ filename: 'README.md' }], body: '' }), [], 'docs-only PRs need no plan');
});

test('TC-067: REVIEW.md and agent-knowledge describe the route for a finding the Product Owner accepted', () => {
  const review = readFileSync(new URL('../REVIEW.md', import.meta.url), 'utf8');
  const knowledge = readFileSync(new URL('../compass/agent-knowledge.md', import.meta.url), 'utf8');
  assert.match(review, /### Accepted by the Product Owner/);
  assert.match(review, /quoting her decision[\s\S]*\*\*fresh\*\* review agent[\s\S]*APPROVE/);
  assert.match(knowledge, /Accepted by the Product Owner/);
});
