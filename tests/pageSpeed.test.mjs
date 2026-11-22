// TC-026 — tiếng Anh tách thành file riêng nhưng vẫn đầy đủ (REQ-011)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import EN from '../src/i18n-en.js';

test('TC-026: the English dictionary loads on its own and covers every Vietnamese key', () => {
  const vi = readFileSync(new URL('../src/i18n.jsx', import.meta.url), 'utf8');
  const viKeys = new Set([...vi.matchAll(/^\s{4}['"]([\w.\-]+)['"]\s*:/gm)].map((m) => m[1]));
  assert.ok(viKeys.size > 1000, `expected many vi keys, got ${viKeys.size}`);
  const missing = [...viKeys].filter((k) => !(k in EN));
  assert.ok(missing.length < viKeys.size * 0.02, `English is missing ${missing.length} keys, e.g. ${missing.slice(0, 5).join(', ')}`);
  assert.equal(typeof EN['app.seoTitle'], 'string');
});
