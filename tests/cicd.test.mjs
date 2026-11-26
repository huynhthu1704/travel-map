// TC-055 — CI/CD guardrails (REQ-034)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const deploy = readFileSync(new URL('../.github/workflows/compass-deploy.yml', import.meta.url), 'utf8');
const ci = readFileSync(new URL('../.github/workflows/compass-ci.yml', import.meta.url), 'utf8');

test('TC-055: deploy runs only after a green Compass CI run on main (not on every push)', () => {
  assert.match(deploy, /workflow_run:\s*\n\s*workflows: \[Compass CI\]/);
  assert.match(deploy, /workflow_run\.conclusion == 'success'/);
  assert.doesNotMatch(deploy, /^\s*push:/m);
  assert.match(deploy, /ref: \$\{\{ steps\.ref\.outputs\.sha \}\}/, 'deploys the exact commit that passed CI');
});

test('TC-055: the live site is smoke-tested and a failure rolls back and opens a bug', () => {
  assert.match(deploy, /smoke-test:/);
  assert.match(deploy, /rollback:[\s\S]*if: failure\(\)/);
  assert.match(deploy, /gh workflow run compass-deploy\.yml/);
  assert.match(deploy, /labels\[\]=bug/);
  assert.doesNotMatch(deploy, /cp -r/, 'no "copy every file" fallback');
});

test('TC-055: CI runs a library security audit', () => {
  assert.match(ci, /npm audit --omit=dev --audit-level=critical/);
});

// TC-115 — automatic deploys publish only the newest commit of main (REQ-058)
test('TC-115: an automatic deploy of a commit that is not the head of main is skipped; manual runs are not', () => {
  assert.match(deploy, /gh api "repos\/\$GITHUB_REPOSITORY\/commits\/main" --jq \.sha/, 'asks GitHub for the head of main');
  const pick = deploy.slice(deploy.indexOf('name: Pick the commit to deploy'), deploy.indexOf('uses: actions/checkout@v4'));
  const auto = pick.slice(pick.indexOf('workflow_run'), pick.indexOf('else'));
  assert.match(auto, /if \[ "\$sha" != "\$head" \]; then[\s\S]*skip=true/, 'only the automatic branch can skip');
  assert.doesNotMatch(pick.slice(pick.indexOf('else')), /skip=true/, 'manual deploys and rollbacks are never skipped');
  assert.match(deploy, /skip: \$\{\{ steps\.ref\.outputs\.skip \}\}/);
  for (const job of ['deploy', 'smoke-test']) {
    const body = deploy.slice(deploy.indexOf(`\n  ${job}:`) + 1).split(/\n  [a-z-]+:\n/)[0];
    assert.match(body, /if: needs\.build\.outputs\.skip != 'true'/, `${job} is skipped too`);
  }
  for (const step of ['Build site', 'upload-pages-artifact']) {
    const at = deploy.indexOf(step);
    assert.match(deploy.slice(Math.max(0, at - 120), at + 80), /if: steps\.ref\.outputs\.skip != 'true'/, `${step} is skipped`);
  }
});
