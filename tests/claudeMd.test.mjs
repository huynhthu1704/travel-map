// TC-062 — CLAUDE.md is the short lessons-learned memory (REQ-045)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const md = readFileSync(new URL('../CLAUDE.md', import.meta.url), 'utf8');

test('TC-062: CLAUDE.md stays under one page and keeps the working-knowledge import', () => {
  assert.ok(md.split('\n').length <= 45, 'keep CLAUDE.md under one page (45 lines)');
  assert.match(md, /^@compass\/agent-knowledge\.md$/m);
  assert.match(md, /AGENTS\.md/);
  assert.match(md, /REVIEW\.md/);
});

test('TC-062: it lists the commands and a lessons-learned section with the add-on-repeat rule', () => {
  for (const cmd of ['npm test', 'npm run test:e2e', 'check-spec.mjs', 'build-views.mjs', 'check-guardrails.mjs']) assert.ok(md.includes(cmd), cmd);
  const lessons = md.split('## Lessons learned')[1] || '';
  assert.match(lessons, /same mistake .*happens twice/);
  assert.ok(lessons.split('\n').filter((l) => l.startsWith('- ')).length >= 5);
});
