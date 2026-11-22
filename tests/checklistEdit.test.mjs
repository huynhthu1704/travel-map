// TC-036 — sửa nội dung việc trong checklist (REQ-019)
import test from 'node:test';
import assert from 'node:assert/strict';
import { renameCheckItem, CHECK_ITEM_MAX } from '../src/lib/checklist.js';

const items = [
  { id: 'a', text: 'Mua eSIM', done: true, doneBy: 'Lan', scope: 'shared' },
  { id: 'b', text: 'Đổi tiền', doneMap: { u1: 'Thư' }, scope: 'personal' },
];

test('TC-036: editing changes only the text and keeps ticks and scope', () => {
  const out = renameCheckItem(items, 'a', '  Mua eSIM Singapore  ');
  assert.deepEqual(out[0], { ...items[0], text: 'Mua eSIM Singapore' });
  assert.equal(out[1], items[1]);
});

test('TC-036: empty or unchanged text saves nothing; long text is cut', () => {
  assert.equal(renameCheckItem(items, 'a', '   '), null);
  assert.equal(renameCheckItem(items, 'a', 'Mua eSIM'), null);
  assert.equal(renameCheckItem(items, 'b', 'x'.repeat(200))[1].text.length, CHECK_ITEM_MAX);
});
