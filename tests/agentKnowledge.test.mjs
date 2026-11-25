// TC-057 — agent working knowledge lives in the repo and is loaded by CLAUDE.md (REQ-035)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('TC-057: CLAUDE.md imports the agent knowledge file', () => {
  assert.match(read('CLAUDE.md'), /^@compass\/agent-knowledge\.md$/m);
});

test('TC-057: agent knowledge has the key sections and no secrets', () => {
  const k = read('compass/agent-knowledge.md');
  for (const heading of ['People and how to work with Christine', 'Delivery contract', 'Feature flags', 'Tests and CI/CD', 'Open items']) {
    assert.ok(k.includes(heading), `missing section: ${heading}`);
  }
  assert.ok(k.includes('Protected paths'), 'protected paths must be listed');
  assert.doesNotMatch(k, /[\w.+-]+@[\w-]+\.[\w.]+/, 'no e-mail addresses');
  assert.doesNotMatch(k, /AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,}|-----BEGIN/, 'no keys or tokens');
});
