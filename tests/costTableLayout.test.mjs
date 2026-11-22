// TC-033 — cột thao tác của bảng chi phí đủ rộng, không đè lên cột Chênh lệch (REQ-004)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('TC-033: the cost table action column fits five 26px buttons', () => {
  const css = readFileSync(new URL('../src/styles/pages/trips.css', import.meta.url), 'utf8');
  const m = css.match(/\.ct-row \{[^}]*grid-template-columns:\s*([^;]+);/);
  assert.ok(m, '.ct-row grid not found');
  const last = parseInt(m[1].trim().split(/\s+/).pop(), 10);
  assert.ok(last >= 5 * 26 + 4 * 2, `action column is only ${last}px`);
});
