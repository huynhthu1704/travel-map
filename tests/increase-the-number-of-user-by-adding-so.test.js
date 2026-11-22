import { test } from 'node:test';
import assert from 'node:assert/strict';
import { increaseTheNumberOfUserByAddingSo } from '../src/features/increase-the-number-of-user-by-adding-so.js';

test('TC-001 REQ-001 happy path saves the result', () => {
  const r = increaseTheNumberOfUserByAddingSo({ name: 'Christine' });
  assert.equal(r.ok, true);
  assert.equal(r.saved.name, 'Christine');
});

test('TC-002 REQ-001 empty field returns an error and saves nothing', () => {
  const r = increaseTheNumberOfUserByAddingSo({ name: '' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.name);
});
