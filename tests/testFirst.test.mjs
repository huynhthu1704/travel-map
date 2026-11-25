// TC-069 — a bug fix starts with a failing test that the fix does not edit (REQ-043)
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { testFirstProblems } from '../compass/test-first.mjs';
import { mergeBlockers } from '../compass/merge-pr.mjs';

const testCommit = { sha: 'aaaaaaa1', files: [{ status: 'A', path: 'tests/bug54.test.mjs' }] };
const fixCommit = { sha: 'bbbbbbb2', files: [{ status: 'M', path: 'src/lib/tour.js' }, { status: 'M', path: 'compass/spec.json' }] };

test('TC-069: failing test first, then a fix that leaves the test alone, passes', () => {
  const r = testFirstProblems([testCommit, fixCommit]);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.unitTests, ['tests/bug54.test.mjs']);
});

test('TC-069: the first commit must only hold the test, and a fix commit must follow', () => {
  const mixed = { sha: 'ccccccc3', files: [...testCommit.files, ...fixCommit.files] };
  assert.match(testFirstProblems([mixed, fixCommit]).errors.join('\n'), /only add the failing test.*src\/lib\/tour\.js/);
  assert.match(testFirstProblems([fixCommit, testCommit]).errors.join('\n'), /adds no test/);
  assert.match(testFirstProblems([testCommit]).errors.join('\n'), /at least two commits/);
  assert.match(testFirstProblems([]).errors[0], /no commits/);
});

test('TC-069: a later commit that edits the failing test fails unless the Product Owner approved', () => {
  const edit = { sha: 'ddddddd4', files: [{ status: 'M', path: 'tests/bug54.test.mjs' }] };
  assert.match(testFirstProblems([testCommit, fixCommit, edit]).errors.join('\n'), /ddddddd changes the failing test.*human-approved/);
  const del = { sha: 'eeeeeee5', files: [{ status: 'D', path: 'tests/bug54.test.mjs' }] };
  assert.equal(testFirstProblems([testCommit, del]).errors.length, 1, 'deleting the test counts as editing it');
  const ok = testFirstProblems([testCommit, fixCommit, edit], { approved: true });
  assert.deepEqual(ok.errors, []);
  assert.match(ok.warnings.join('\n'), /Product Owner approved/);
});

test('TC-069: a UI-only failing test is allowed but flagged for the reviewer', () => {
  const ui = { sha: 'fffffff6', files: [{ status: 'M', path: 'e2e/tour.spec.mjs' }] };
  const r = testFirstProblems([ui, fixCommit]);
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join('\n'), /UI-only.*reviewer/);
});

test('TC-069: merge-pr refuses a fix for a bug issue when the PR lacks the bug label (so CI ran the check)', () => {
  const head = 'abcdef1234567890abcdef1234567890abcdef12';
  const base = {
    checkRuns: ['test', 'e2e'].map((name) => ({ name, status: 'completed', conclusion: 'success' })),
    comments: [{ body: `## Independent review (Claude)\nVerdict: APPROVE\nReviewed commit: ${head}`, created_at: '2026-11-25T01:00:00Z', author_association: 'OWNER' }],
    files: [],
    headSha: head,
  };
  assert.match(mergeBlockers({ ...base, labels: [], bugIssues: [54] }).join('\n'), /#54 is a bug.*"bug" label/);
  assert.deepEqual(mergeBlockers({ ...base, labels: ['bug'], bugIssues: [54] }), []);
  assert.deepEqual(mergeBlockers({ ...base, labels: [] }), []);
});

test('TC-069: npm test runs the test-first check, and the skill describes the route', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts.test, /node compass\/test-first\.mjs/);
  const skill = readFileSync(new URL('../.claude/skills/deliver-change/SKILL.md', import.meta.url), 'utf8');
  assert.match(skill, /failing test/i);
  assert.match(skill, /compass\/test-first\.mjs/);
});

// End to end in a throwaway git repository: the script runs the first commit's test and expects it to fail
const script = fileURLToPath(new URL('../compass/test-first.mjs', import.meta.url));
function repo(commits, extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tf-repo-'));
  const env = { ...process.env, GITHUB_EVENT_PATH: '', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com' };
  const git = (...a) => execFileSync('git', a, { cwd: dir, env, stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'tests'));
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src/add.mjs'), 'export const add = (a, b) => a - b;\n');
  git('add', '.');
  git('commit', '-qm', 'base');
  git('branch', 'base');
  for (const files of commits) {
    for (const [p, text] of Object.entries(files)) writeFileSync(join(dir, p), text);
    git('add', '.');
    git('commit', '-qm', 'step');
  }
  const run = spawnSync(process.execPath, [script, 'base', '--bug'], { cwd: dir, env: { ...env, ...extraEnv }, encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
  return run;
}
const failingTest = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { add } from '../src/add.mjs';\ntest('adds', () => assert.equal(add(2, 3), 5));\n";
const fix = { 'src/add.mjs': 'export const add = (a, b) => a + b;\n' };

test('TC-069: end to end — a real failing test before the fix passes the check', () => {
  const r = repo([{ 'tests/add.test.mjs': failingTest }, fix]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /fails at .* \(before the fix\)/);
});

test('TC-069: end to end — a test that already passes before the fix, or a fix that edits the test, fails the check', () => {
  const passing = failingTest.replace('add(2, 3), 5', 'add(3, 3), 0');
  const r1 = repo([{ 'tests/add.test.mjs': passing }, fix]);
  assert.equal(r1.status, 1);
  assert.match(r1.stdout, /passes without the fix/);
  const r2 = repo([{ 'tests/add.test.mjs': failingTest }, { ...fix, 'tests/add.test.mjs': failingTest + '// tweak\n' }]);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /changes the failing test/);
});

test('TC-069: end to end — a test that hangs until the time limit does not count as failing', () => {
  const hanging = "import test from 'node:test';\ntest('hangs', () => new Promise(() => setInterval(() => {}, 1000)));\n";
  const r = repo([{ 'tests/add.test.mjs': hanging }, fix], { TEST_FIRST_TIMEOUT_MS: '1500' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /did not finish .*stopped after 1\.5 s/);
});

test('TC-069: outside a bug-fix PR the check skips', () => {
  const r = spawnSync(process.execPath, [script], { env: { ...process.env, GITHUB_EVENT_PATH: '' }, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /skipped/);
});
