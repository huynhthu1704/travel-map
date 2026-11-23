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

// TC-053 — due day of checklist items (REQ-033)
import { tripDays, setItemDue, dueStatus, dueDayNumber } from '../src/lib/checklist.js';

test('TC-053: the picker offers each day of the trip', () => {
  assert.deepEqual(tripDays('2026-11-10', '2026-11-14').map((d) => `${d.day}:${d.date}`), ['1:2026-11-10', '2:2026-11-11', '3:2026-11-12', '4:2026-11-13', '5:2026-11-14']);
  assert.deepEqual(tripDays('', ''), []);
  assert.equal(dueDayNumber('2026-11-12', '2026-11-10', '2026-11-14'), 3);
  assert.equal(dueDayNumber('2026-12-01', '2026-11-10', '2026-11-14'), 0);
});

test('TC-053: setting and clearing a due day keeps the rest of the item', () => {
  const items = [{ id: 'a', text: 'Đổi tiền', done: false, scope: 'shared' }];
  const set = setItemDue(items, 'a', '2026-11-12');
  assert.deepEqual(set[0], { ...items[0], due: '2026-11-12' });
  assert.deepEqual(setItemDue(set, 'a', null)[0], items[0]);
});

test('TC-053: due today / overdue only while the item is not done', () => {
  assert.equal(dueStatus('2026-11-12', false, '2026-11-12', '2026-11-10'), 'today');
  assert.equal(dueStatus('2026-11-11', false, '2026-11-12', '2026-11-10'), 'overdue');
  assert.equal(dueStatus('2026-11-11', true, '2026-11-12', '2026-11-10'), '');
  assert.equal(dueStatus('before', false, '2026-11-10', '2026-11-10'), 'overdue');
  assert.equal(dueStatus('before', false, '2026-11-01', '2026-11-10'), '');
});
