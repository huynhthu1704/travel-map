// TC-059 — guardrails.json is enforced (REQ-036)
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkChange, dependenciesChanged, loadGuardrails, APPROVAL_LABEL } from '../compass/guardrails-lib.mjs';
import { decide } from '../compass/hooks/guard-edit.mjs';

const g = loadGuardrails();
const f = (path, extra = {}) => ({ path, status: 'M', addedText: '', lines: 10, ...extra });

test('TC-059: protected paths need the approval label; forbidden paths never pass', () => {
  assert.equal(checkChange([f('.github/workflows/compass-ci.yml')], g).errors.length, 1);
  assert.deepEqual(checkChange([f('.github/workflows/compass-ci.yml')], g, { labels: [APPROVAL_LABEL] }).errors, []);
  assert.equal(checkChange([f('.env.local')], g, { labels: [APPROVAL_LABEL] }).errors.length, 1);
  assert.deepEqual(checkChange([f('src/App.jsx'), f('.env.production')], g).errors, []);
});

test('TC-059: more than 12 files, deletions and dependency changes are caught', () => {
  const many = Array.from({ length: 13 }, (_, i) => f(`src/f${i}.js`));
  assert.match(checkChange(many, g).errors[0], /13 files changed/);
  assert.equal(checkChange([f('src/old.js', { status: 'D' })], g).errors.length, 1);
  assert.equal(checkChange([f('package.json')], g, { depsChanged: true }).errors.length, 1);
  assert.equal(dependenciesChanged('{"dependencies":{"a":"1"}}', '{"dependencies":{"a":"2"}}'), true);
  assert.equal(dependenciesChanged('{"version":"1","dependencies":{"a":"1"}}', '{"version":"2","dependencies":{"a":"1"}}'), false);
});

test('TC-059: secrets in added lines fail even with approval; long files only warn', () => {
  const key = 'ghp_' + 'a'.repeat(30);
  const r = checkChange([f('src/x.js', { addedText: `const t = "${key}"` })], g, { labels: [APPROVAL_LABEL] });
  assert.match(r.errors[0], /looks like a secret/);
  assert.ok(!r.errors[0].includes(key), 'the message never repeats the secret');
  const long = checkChange([f('src/pages/Admin.jsx', { lines: 2500 })], g);
  assert.deepEqual(long.errors, []);
  assert.equal(long.warnings.length, 1);
});

test('TC-059: the edit hook blocks protected paths until approved, and blocks secrets', () => {
  const edit = (file_path, content = 'x') => ({ tool_name: 'Write', tool_input: { file_path, content } });
  const blocked = decide(edit('CNAME'), g);
  assert.equal(blocked.block, true);
  assert.match(blocked.reason, /Product Owner/);
  assert.equal(decide(edit('CNAME'), g, ['CNAME']).block, false);
  assert.equal(decide(edit('.env'), g, ['.env']).block, true);
  assert.equal(decide(edit('src/a.js', 'AKIA' + 'B'.repeat(16)), g).block, true);
  assert.equal(decide(edit('src/a.js', 'ok'), g).block, false);
  assert.equal(decide(edit('/tmp/elsewhere.txt'), g).block, false);
});
