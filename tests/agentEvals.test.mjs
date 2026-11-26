// TC-116 — agent setup evals: past mistakes stay blocked after rule changes (REQ-041)
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeCases, loadCases, reportMarkdown, runCase, runEvals, summaryLine, writeRunSummary } from '../compass/eval-agent-setup.mjs';
import { findSecrets, loadGuardrails } from '../compass/guardrails-lib.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
const suite = loadCases();
const spec = JSON.parse(readFileSync(new URL('../compass/spec.json', import.meta.url), 'utf8'));

test('TC-116: every active eval case behaves as expected and the pass rate is reported', () => {
  const run = runEvals();
  console.log(summaryLine(run));
  writeRunSummary(run); // shows the pass rate in the CI run summary
  const failed = run.results.filter((r) => !r.ok);
  assert.deepEqual(failed, [], reportMarkdown(run));
  assert.equal(run.rate, 100);
});

test('TC-116: the suite holds 20–50 well-formed cases with unique ids', () => {
  const active = activeCases(suite);
  assert.ok(active.length >= suite.minActiveCases && suite.minActiveCases >= 20, `${active.length} active cases, need at least 20`);
  assert.ok(suite.cases.length <= 50, 'keep the suite at 50 cases or fewer');
  assert.equal(new Set(suite.cases.map((c) => c.id)).size, suite.cases.length, 'case ids are unique');
  for (const c of suite.cases) {
    assert.match(c.id, /^EV-\d{3}$/, c.id);
    assert.ok(c.title && c.source && c.check, `${c.id} has title, source and check`);
    assert.ok(['blocked', 'allowed'].includes(c.expect), `${c.id} expect`);
    if (c.expect === 'blocked') assert.ok(c.why, `${c.id} names why it must be blocked`);
  }
  assert.ok(active.some((c) => c.expect === 'allowed'), 'control cases guard against rules that block everything');
  assert.deepEqual(findSecrets(readFileSync(new URL('../compass/evals/cases.json', import.meta.url), 'utf8'), loadGuardrails()), [], 'the cases file holds placeholders, never secret-looking text');
});

test('TC-116: a weakened guardrail makes the suite fail (the pass rate drops)', () => {
  const g = loadGuardrails();
  const weak = { ...g, protectedPaths: g.protectedPaths.filter((p) => p !== 'CNAME'), maxFilesPerChange: 50 };
  const run = runEvals(suite, weak, spec);
  assert.ok(run.rate < 100);
  const failed = run.results.filter((r) => !r.ok).map((r) => r.id);
  const active = new Set(activeCases(suite).map((c) => c.id));
  for (const id of ['EV-006', 'EV-007', 'EV-008', 'EV-012'].filter((id) => active.has(id))) assert.ok(failed.includes(id), `${id} catches the weaker rule`);
  // Blocked for another reason than the case is about also counts as a failure
  const wrongReason = runCase({ id: 'X', check: 'edit-hook', input: { path: 'CNAME' }, expect: 'blocked', why: 'secret pattern' }, g, spec);
  assert.equal(wrongReason.ok, false);
});

test('TC-116: no case on main is removed or weakened unless the Product Owner retired it', (t) => {
  const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  let mainText;
  try {
    git('rev-parse', '--verify', 'origin/main');
  } catch {
    // CI checks out the full history, so a missing origin/main there must not switch the guard off silently
    assert.ok(!process.env.CI, 'origin/main is missing in CI — fetch it so the eval cases can be compared');
    t.skip('origin/main is not fetched locally');
    return;
  }
  try {
    mainText = git('show', 'origin/main:compass/evals/cases.json');
  } catch {
    t.skip('origin/main has no cases file yet');
    return;
  }
  const here = new Map(suite.cases.map((c) => [c.id, c]));
  for (const old of JSON.parse(mainText).cases) {
    const c = here.get(old.id);
    assert.ok(c, `${old.id} was removed — mark it "retired" with the Product Owner's approval instead`);
    if (c.retired) {
      assert.match(c.retired, /approv/i, `${c.id} retired needs the Product Owner's approval note`);
      continue;
    }
    for (const k of ['check', 'expect', 'why', 'input']) assert.deepEqual(c[k], old[k], `${c.id} changed "${k}" — a weaker case needs the Product Owner's approval ("retired" + a new case)`);
  }
  assert.ok(activeCases(suite).length >= JSON.parse(mainText).minActiveCases, 'minActiveCases cannot shrink below main');
});

test('TC-116: the run summary file gets the pass rate', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evals-'));
  try {
    const file = join(dir, 'summary.md');
    writeRunSummary({ results: [{ id: 'EV-1', title: 't', ok: false, actual: 'allowed', detail: 'expected blocked' }], passed: 0, total: 1, rate: 0 }, file);
    const text = readFileSync(file, 'utf8');
    assert.match(text, /Agent setup evals: 0\/1 passed \(0%\)/);
    assert.match(text, /EV-1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
