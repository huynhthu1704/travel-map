// TC-035 — Quản trị: sửa link Google Maps / toạ độ cho mọi địa điểm (REQ-018)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/pages/Admin.jsx', import.meta.url), 'utf8');
const editor = src.slice(src.indexOf('const fromLink'), src.indexOf("t('admin.f.image')"));

test('TC-035: the Google Maps link box and coordinates are shown for every place, not only added ones', () => {
  assert.ok(!/\{isCustom && \(\s*<div className="row wrap">\s*<input className="grow" value=\{f\.link\}/.test(editor), 'link box is still limited to custom places');
  const custom = editor.slice(editor.indexOf('{isCustom && ('));
  const customBlock = custom.slice(0, custom.indexOf(')}'));
  assert.ok(!customBlock.includes("admin.f.lat"), 'latitude field is still limited to custom places');
  assert.match(editor, /admin\.f\.lat/);
});

test('TC-035: saving a famous place stores moved coordinates in its override', () => {
  assert.match(src, /saveOverride\(place\.id, \{[^}]*\.\.\.\(moved \? \{ lat, lng \} : \{\}\)/);
});
