// TC-058 — independent PR review policy (REQ-037)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const review = read('REVIEW.md');

test('TC-058: REVIEW.md defines the review passes, severities and comment format', () => {
  for (const pass of ['Correctness', 'Requirement match', 'Security and privacy', 'Compass contract']) assert.match(review, new RegExp(pass));
  assert.match(review, /\*\*important\*\*/);
  assert.match(review, /at most 5/);
  assert.match(review, /## Independent review \(Claude\)/);
});

test('TC-058: important findings block the merge and the author cannot approve its own PR', () => {
  assert.match(review, /CHANGES NEEDED` → \*\*no merge\*\*/);
  assert.match(review, /did not write the code/);
  assert.match(review, /never reviews or approves its own work/);
});

test('TC-058: the workflow, the PR template and the agent knowledge point to REVIEW.md', () => {
  assert.match(read('AGENTS.md'), /REVIEW\.md/);
  assert.match(read('.github/pull_request_template.md'), /Independent review/);
  assert.match(read('compass/agent-knowledge.md'), /REVIEW\.md/);
});
