// TC-015 — chi phí dự kiến cho một số người (REQ-006)
import test from 'node:test';
import assert from 'node:assert/strict';
import { estGroupTotal, estShare, estPeople, buildCostTable } from '../src/lib/costCompare.js';

test('TC-015: estimates can apply to picked people only', () => {
  const n = 4;
  // cả nhóm
  assert.equal(estGroupTotal({ amount: 400, per: 'group' }, n), 400);
  assert.equal(estShare({ amount: 400, per: 'group' }, n), 100);
  assert.equal(estGroupTotal({ amount: 100, per: 'person' }, n), 400);
  // chọn 2 người: tổng 300 chia 2
  const pickTotal = { amount: 300, per: 'group', splitAmong: ['a', 'b'] };
  assert.equal(estPeople(pickTotal, n), 2);
  assert.equal(estGroupTotal(pickTotal, n), 300);
  assert.equal(estShare(pickTotal, n), 150);
  // chọn 2 người, mỗi người 120 → tổng 240
  const pickEach = { amount: 120, per: 'person', splitAmong: ['a', 'b'] };
  assert.equal(estGroupTotal(pickEach, n), 240);
  assert.equal(estShare(pickEach, n), 120);
  // quy đổi tiền tệ vẫn áp dụng
  assert.equal(estGroupTotal({ amount: 10, per: 'person', currency: 'SGD', splitAmong: ['a'] }, n, (v) => v * 20000), 200000);
  // bảng gộp dùng tổng đúng của khoản chọn người
  const t = buildCostTable([{ id: 'e', type: 'estimate', ...pickEach }], { estTotal: (c) => estGroupTotal(c, n), actTotal: () => 0 });
  assert.equal(t.totals.planned, 240);
});
