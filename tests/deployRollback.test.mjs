// TC-124 — the deploy rollback finds the last good version even after many skipped deploys (REQ-034, bug #110)
// Runs the real rollback script from .github/workflows/compass-deploy.yml with a fake `gh` that answers like the
// GitHub API (paged workflow runs, jobs per run) and records what the script asks it to do.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workflow = readFileSync(fileURLToPath(new URL('../.github/workflows/compass-deploy.yml', import.meta.url)), 'utf8');
const hasTools = ['bash', 'jq'].every((t) => spawnSync('sh', ['-c', `command -v ${t}`]).status === 0);

/**
 * The `run: |` script of the rollback job, dedented, with the event name filled in.
 * Assumes the layout of compass-deploy.yml: the rollback job has one `run: |` step whose lines are indented 10 spaces.
 */
function rollbackScript(event) {
  const job = workflow.slice(workflow.indexOf('\n  rollback:'));
  const lines = job.slice(job.indexOf('run: |') + 'run: |'.length).split('\n').slice(1);
  const body = [];
  for (const l of lines) {
    if (l.trim() && !l.startsWith('          ')) break;
    body.push(l.slice(10));
  }
  assert.ok(body.length > 5, 'found the rollback script');
  return body.join('\n').replaceAll('${{ github.event_name }}', event);
}

// Fake gh: paged runs list (honours per_page and page like the API), jobs and run details, records other calls.
const FAKE_GH = `#!/usr/bin/env node
const fs = require('fs');
const { execFileSync } = require('child_process');
const runs = JSON.parse(fs.readFileSync(process.env.FAKE_RUNS, 'utf8'));
const args = process.argv.slice(2);
const log = (x) => fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(x) + '\\n');
const jqAt = args.indexOf('--jq');
const out = (data) => {
  const json = JSON.stringify(data);
  if (jqAt < 0) return process.stdout.write(json);
  process.stdout.write(execFileSync('jq', ['-r', args[jqAt + 1]], { input: json }));
};
if (args[0] === 'workflow') { log({ workflow: args }); process.exit(0); }
const path = args[1];
if (/\\/issues$/.test(path)) { log({ issue: args }); process.stdout.write('https://example.test/issues/1\\n'); process.exit(0); }
let m;
if ((m = path.match(/\\/actions\\/workflows\\/compass-deploy\\.yml\\/runs\\?(.*)$/))) {
  const q = new URLSearchParams(m[1]);
  const per = Number(q.get('per_page') || 30), page = Number(q.get('page') || 1);
  log({ list: { per, page } });
  out({ total_count: runs.length, workflow_runs: runs.slice((page - 1) * per, page * per).map((r) => ({ id: r.id, display_title: 'Deploy ' + r.sha })) });
} else if ((m = path.match(/\\/actions\\/runs\\/(\\d+)\\/jobs$/))) {
  const r = runs.find((x) => x.id === Number(m[1]));
  out({ jobs: ['build', 'deploy', 'smoke-test'].map((name) => ({ name, conclusion: name === 'build' || !r.skipped ? 'success' : 'skipped' })) });
} else if ((m = path.match(/\\/actions\\/runs\\/(\\d+)$/))) {
  const r = runs.find((x) => x.id === Number(m[1]));
  out({ id: r.id, display_title: 'Deploy ' + r.sha });
} else { process.stderr.write('fake gh: unexpected ' + args.join(' ')); process.exit(1); }
`;

/** Runs the rollback script against the given successful deploy runs (newest first). */
function runRollback(runs, { event = 'workflow_run', bad = 'b'.repeat(40) } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rollback-'));
  try {
    writeFileSync(join(dir, 'gh'), FAKE_GH);
    chmodSync(join(dir, 'gh'), 0o755);
    writeFileSync(join(dir, 'runs.json'), JSON.stringify(runs));
    writeFileSync(join(dir, 'log'), '');
    writeFileSync(join(dir, 'script.sh'), rollbackScript(event));
    const res = spawnSync('bash', ['-e', join(dir, 'script.sh')], {
      encoding: 'utf8',
      timeout: 60000,
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        FAKE_RUNS: join(dir, 'runs.json'),
        FAKE_LOG: join(dir, 'log'),
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_RUN_ID: '999',
        GH_TOKEN: 'x',
        BAD: bad,
      },
    });
    const calls = readFileSync(join(dir, 'log'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    return { res, calls };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const sha = (n) => n.toString(16).padStart(40, '0');
// 30 skipped automatic deploys (REQ-058) after the last deploy whose smoke test passed
const skipped = Array.from({ length: 30 }, (_, i) => ({ id: 1000 - i, sha: sha(500 - i), skipped: true }));
const GOOD = sha(7);

test('TC-124: the rollback redeploys the last good version even after 30 skipped deploys (bug #110)', { skip: !hasTools && 'needs bash and jq' }, () => {
  const { res, calls } = runRollback([...skipped, { id: 900, sha: GOOD }, { id: 899, sha: sha(6) }]);
  assert.equal(res.status, 0, res.stderr);
  const redeploys = calls.filter((c) => c.workflow);
  assert.equal(redeploys.length, 1, 'starts exactly one redeploy');
  assert.ok(redeploys[0].workflow.includes(`ref=${GOOD}`), `redeploys ${GOOD.slice(0, 7)}: ${JSON.stringify(redeploys)}`);
  const issue = calls.find((c) => c.issue);
  assert.ok(issue && issue.issue.join(' ').includes('Rolled back automatically'), 'the bug issue says it rolled back');
});

test('TC-124: with no good version at all the rollback redeploys nothing and still opens the bug', { skip: !hasTools && 'needs bash and jq' }, () => {
  const { res, calls } = runRollback(skipped);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(calls.filter((c) => c.workflow).length, 0, 'no redeploy');
  const issue = calls.find((c) => c.issue);
  assert.ok(issue && issue.issue.join(' ').includes('Nothing was rolled back'), 'the bug issue says nothing was rolled back');
});

test('TC-124: the failed commit itself is never chosen, and a manual run does not roll back', { skip: !hasTools && 'needs bash and jq' }, () => {
  const bad = sha(42);
  const auto = runRollback([{ id: 5, sha: bad }, ...skipped, { id: 4, sha: GOOD }], { bad });
  assert.equal(auto.res.status, 0, auto.res.stderr);
  assert.ok(auto.calls.find((c) => c.workflow)?.workflow.includes(`ref=${GOOD}`), 'skips the bad commit and picks the good one');
  const manual = runRollback([{ id: 4, sha: GOOD }], { event: 'workflow_dispatch' });
  assert.equal(manual.res.status, 0, manual.res.stderr);
  assert.equal(manual.calls.filter((c) => c.workflow).length, 0, 'manual runs only open the bug');
});

test('TC-124: the rollback reads further pages when the first page holds only skipped deploys', { skip: !hasTools && 'needs bash and jq' }, () => {
  const many = Array.from({ length: 130 }, (_, i) => ({ id: 5000 - i, sha: sha(9000 - i), skipped: true }));
  const { res, calls } = runRollback([...many, { id: 100, sha: GOOD }, { id: 99, sha: sha(6) }]);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(calls.find((c) => c.workflow)?.workflow.includes(`ref=${GOOD}`), 'finds the good run on page 2');
  const lists = calls.filter((c) => c.list);
  assert.equal(lists.length, 2, `stops paging once it found the good run: ${JSON.stringify(lists)}`);
  assert.equal(calls.filter((c) => c.workflow).length, 1, 'starts exactly one redeploy');
});
