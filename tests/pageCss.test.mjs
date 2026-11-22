// TC-032 — CSS không chặn lúc mở trang (REQ-015)
import test from 'node:test';
import assert from 'node:assert/strict';
import { asyncMainCss } from '../vite.config.js';

test('TC-032: the main stylesheet link becomes a non-blocking preload with a noscript fallback', () => {
  const html = '<head><link rel="stylesheet" crossorigin href="./assets/index-abc.css"></head>';
  const out = asyncMainCss().transformIndexHtml.handler(html);
  assert.ok(!/<link rel="stylesheet" crossorigin href/.test(out.replace(/<noscript>.*?<\/noscript>/g, '')), 'no render-blocking link left');
  assert.match(out, /rel="preload" as="style" crossorigin href="\.\/assets\/index-abc\.css" data-app-css/);
  assert.match(out, /onload="this\.onload=null;this\.rel='stylesheet'"/);
  assert.match(out, /<noscript><link rel="stylesheet" href="\.\/assets\/index-abc\.css"><\/noscript>/);
});

test('TC-032: every page stylesheet is imported by the code of its page', async () => {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs');
  const dir = new URL('../src/styles/pages/', import.meta.url);
  if (!existsSync(dir)) return;
  const walk = (u) => readdirSync(u, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(new URL(e.name + '/', u)) : /\.jsx?$/.test(e.name) ? [readFileSync(new URL(e.name, u), 'utf8')] : []);
  const code = walk(new URL('../src/', import.meta.url)).join('\n');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.css'))) {
    assert.ok(code.includes(`styles/pages/${f}'`), `${f} is not imported anywhere`);
  }
});
