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
