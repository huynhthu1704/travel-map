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
