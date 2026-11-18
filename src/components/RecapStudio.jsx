import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Modal, Loader, formatDate } from './ui';
import { loadImage } from '../lib/image';
import { countryName, flagOf } from '../lib/countries';
import { pName, pCity } from '../lib/lang';
import { C, HEAD, BODY, font, ease, roundRect, drawCover, pickMime, fitText } from './ShareStudio';

/* ------------------------------------------------------------------ */
/* Ảnh / video tổng kết: các nơi đã đi trong 1 năm hoặc 1 chuyến đi    */
/* 5 bố cục: Bản đồ · Lưới ảnh · Tem hộ chiếu · Dòng thời gian ·        */
/* Trình chiếu. Người dùng tự chọn ảnh (mặc định mỗi chuyến 1 ảnh).    */
/* Danh sách địa điểm luôn hiện đủ: chữ tự thu nhỏ cho vừa khung.      */
/* ------------------------------------------------------------------ */

const FORMATS = [
  { id: 'story', w: 1080, h: 1920 },
  { id: 'portrait', w: 1080, h: 1350 },
  { id: 'square', w: 1080, h: 1080 },
];
const LAYOUTS = [
  { id: 'map', emoji: '🗺️', max: 4 },
  { id: 'collage', emoji: '🖼️', max: 9 },
  { id: 'passport', emoji: '🛂', max: 3 },
  { id: 'timeline', emoji: '🗓️', max: 4 },
  { id: 'slideshow', emoji: '🎞️', max: 12 },
];
const THEMES = {
  honey: { bg1: '#FFF4CC', bg2: '#FFD86B', card: '#FFFFFF', text: C.ink, sub: C.ink2, land: '#EFE7D6', landVisited: '#FFC629', stroke: '#D9CDB4', water: '#EAF4F8', dot: C.coral, accent: '#A87400', chip: 'rgba(255,255,255,0.85)' },
  night: { bg1: '#1F1A14', bg2: '#3A2E1C', card: '#2B241C', text: '#FFFFFF', sub: '#E9DFC9', land: '#4A4237', landVisited: '#FFC629', stroke: '#5E5446', water: '#221D17', dot: '#FF7A59', accent: '#FFC629', chip: 'rgba(255,255,255,0.1)' },
};
const STAMP_INKS = ['#C2410C', '#1D4ED8', '#047857', '#7C3AED', '#B91C1C', '#0E7490', '#A16207'];

const mercY = (lat) => {
  const l = (Math.max(-80, Math.min(80, lat)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + l / 2));
};

/** Khung nhìn bản đồ bao quanh các địa điểm, giữ đúng tỉ lệ ô vẽ */
function viewFor(places, aspect) {
  const pts = places.filter((p) => p.lat != null && p.lng != null);
  if (!pts.length) return { w: -170, e: 190, s: -55, n: 75 };
  let w = Math.min(...pts.map((p) => p.lng));
  let e = Math.max(...pts.map((p) => p.lng));
  let s = Math.min(...pts.map((p) => p.lat));
  let n = Math.max(...pts.map((p) => p.lat));
  const padX = Math.max((e - w) * 0.25, 4);
  const padY = Math.max((n - s) * 0.25, 3);
  w -= padX;
  e += padX;
  s -= padY;
  n += padY;
  const cx = (w + e) / 2;
  const cy = (mercY(s) + mercY(n)) / 2;
  let spanX = ((e - w) * Math.PI) / 180;
  let spanY = mercY(n) - mercY(s);
  if (spanX / spanY > aspect) spanY = spanX / aspect;
  else spanX = spanY * aspect;
  const inv = (y) => (Math.atan(Math.sinh(y)) * 180) / Math.PI;
  return { w: cx - (spanX * 90) / Math.PI, e: cx + (spanX * 90) / Math.PI, s: inv(cy - spanY / 2), n: inv(cy + spanY / 2) };
}

/** Vẽ bản đồ (một lần) ra canvas phụ để dùng lại cho mọi khung hình video */
function drawMapLayer(features, visited, view, w, h, theme) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = theme.water;
  ctx.fillRect(0, 0, w, h);
  const yTop = mercY(view.n);
  const yBot = mercY(view.s);
  const px = (lng) => ((lng - view.w) / (view.e - view.w)) * w;
  const py = (lat) => ((yTop - mercY(lat)) / (yTop - yBot)) * h;
  ctx.lineJoin = 'round';
  for (const f of features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach(([lng, lat], i) => (i ? ctx.lineTo(px(lng), py(lat)) : ctx.moveTo(px(lng), py(lat))));
        ctx.closePath();
      }
    }
    ctx.fillStyle = visited.has(f.properties.cc) ? theme.landVisited : theme.land;
    ctx.fill('evenodd');
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  return { canvas: c, px, py };
}

/* ----------------------------- helpers ----------------------------- */

const TEXT_ONLY = (tpl) => tpl.replace('"Twemoji Country Flags", ', '');

function background(ctx, o) {
  const { W, H, theme: T } = o;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, T.bg1);
  g.addColorStop(1, T.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Nhãn nhỏ + tiêu đề lớn. Trả về y sau tiêu đề */
function header(ctx, o, y, at, { center = false, size = 84 } = {}) {
  const { W, k, theme: T } = o;
  const m = 64 * k;
  const x = center ? W / 2 : m;
  ctx.globalAlpha = at(0);
  ctx.textAlign = center ? 'center' : 'left';
  ctx.fillStyle = T.accent;
  fitText(ctx, o.eyebrow.toUpperCase(), x, y, W - m * 2, BODY, 30 * k);
  y += (size + 4) * k;
  ctx.fillStyle = T.text;
  fitText(ctx, o.title, x, y, W - m * 2, HEAD, size * k, size * k * 0.55);
  if (o.subtitle) {
    y += 52 * k;
    ctx.fillStyle = T.sub;
    fitText(ctx, o.subtitle, x, y, W - m * 2, BODY, 30 * k);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  return y + 30 * k;
}

function statsRow(ctx, o, y, at, h) {
  const { W, k, theme: T } = o;
  const m = 64 * k;
  const gap = 20 * k;
  const n = o.stats.length;
  const sw = (W - m * 2 - gap * (n - 1)) / n;
  o.stats.forEach((st, i) => {
    const x = m + i * (sw + gap);
    ctx.globalAlpha = at(0.3 + i * 0.12);
    ctx.fillStyle = T.card;
    roundRect(ctx, x, y, sw, h, 26 * k);
    ctx.fill();
    ctx.fillStyle = T.text;
    const v = o.time === Infinity ? st.value : Math.round(st.value * ease((o.time - 0.4) / 1.6));
    fitText(ctx, `${st.icon} ${v}`, x + 22 * k, y + h * 0.56, sw - 40 * k, HEAD, Math.min(60, h / k / 2.3) * k);
    ctx.fillStyle = T.sub;
    fitText(ctx, st.label, x + 24 * k, y + h * 0.84, sw - 40 * k, BODY, 24 * k);
  });
  ctx.globalAlpha = 1;
  return y + h;
}

/**
 * Tất cả địa điểm dạng "nhãn" xếp tràn dòng, tự giảm cỡ chữ đến khi vừa khung.
 * Không bao giờ ghi "+N nơi khác": nhỏ nhất vẫn không vừa thì chuyển sang dạng chữ liền.
 */
function placeCloud(ctx, o, x, y, w, h, at, t0 = 2) {
  const { k, theme: T, places } = o;
  if (!places.length || h <= 0) return;
  const items = places.map((p) => ({ flag: flagOf(p.country), text: pName(p) }));
  for (let s = 32; s >= 13; s -= 1) {
    const size = s * k;
    const padX = size * 0.55;
    const flagW = size * 1.55;
    const chipH = size * 1.75;
    const gap = size * 0.4;
    ctx.font = font(TEXT_ONLY(BODY), size);
    let cx = 0;
    let cy = 0;
    const pos = [];
    let ok = true;
    for (const it of items) {
      let tw = ctx.measureText(it.text).width;
      const maxText = w - padX * 2 - flagW;
      if (tw > maxText) tw = maxText;
      const cw = padX * 2 + flagW + tw;
      if (cx > 0 && cx + cw > w) {
        cx = 0;
        cy += chipH + gap;
      }
      pos.push({ x: cx, y: cy, w: cw, tw });
      cx += cw + gap;
      if (cy + chipH > h) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const per = Math.min(0.08, 2 / items.length);
    items.forEach((it, i) => {
      const a = at(t0 + i * per, 0.35);
      if (a <= 0) return;
      const p = pos[i];
      ctx.globalAlpha = a;
      ctx.fillStyle = T.chip;
      roundRect(ctx, x + p.x, y + p.y, p.w, chipH, chipH / 2);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.font = font(BODY, size * 1.02);
      ctx.fillText(it.flag, x + p.x + padX, y + p.y + chipH * 0.68);
      ctx.fillStyle = T.text;
      fitText(ctx, it.text, x + p.x + padX + flagW, y + p.y + chipH * 0.68, p.tw, BODY, size, size);
    });
    ctx.globalAlpha = 1;
    return;
  }
  // Rất nhiều địa điểm: chữ liền, phân cách bằng dấu ·
  ctx.globalAlpha = at(t0);
  ctx.fillStyle = T.text;
  const size = 13 * k;
  ctx.font = font(TEXT_ONLY(BODY), size);
  const words = items.map((it) => it.text);
  let line = '';
  let yy = y + size;
  for (const wd of words) {
    const test = line ? `${line} · ${wd}` : wd;
    if (ctx.measureText(test).width > w && line) {
      ctx.fillText(line, x, yy);
      line = wd;
      yy += size * 1.45;
      if (yy > y + h) break;
    } else line = test;
  }
  if (yy <= y + h) ctx.fillText(line, x, yy);
  ctx.globalAlpha = 1;
}

function watermark(ctx, o, color) {
  const { W, H, k, theme: T } = o;
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.fillStyle = color || T.sub;
  ctx.font = font(BODY, 24 * k);
  ctx.fillText(o.watermark, W / 2, H - 28 * k);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

/** Lưới ảnh thích ứng 1–9 ảnh */
function mosaic(n, x, y, w, h, gap) {
  if (n <= 0) return [];
  if (n === 1) return [[x, y, w, h]];
  if (n === 2) return w >= h ? [[x, y, (w - gap) / 2, h], [x + (w + gap) / 2, y, (w - gap) / 2, h]] : [[x, y, w, (h - gap) / 2], [x, y + (h + gap) / 2, w, (h - gap) / 2]];
  if (n === 3) {
    const big = (h - gap) * 0.58;
    return [[x, y, w, big], [x, y + big + gap, (w - gap) / 2, h - big - gap], [x + (w + gap) / 2, y + big + gap, (w - gap) / 2, h - big - gap]];
  }
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = (h - gap * (rows - 1)) / rows;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? n - r * cols : cols;
    const rw = (w - gap * (inRow - 1)) / inRow; // hàng cuối thiếu ảnh → giãn đều cho kín
    const c = i - r * cols;
    out.push([x + c * (inRow === cols ? cw + gap : rw + gap), y + r * (ch + gap), inRow === cols ? cw : rw, ch]);
  }
  return out;
}

function drawMap(ctx, o, x, y, w, h, at) {
  const { k, theme: T } = o;
  ctx.save();
  roundRect(ctx, x, y, w, h, 36 * k);
  ctx.clip();
  if (o.map) ctx.drawImage(o.map.canvas, x, y, w, h);
  const per = Math.min(0.35, 3 / Math.max(o.places.length, 1));
  o.places.forEach((p, i) => {
    const a = at(1 + i * per, 0.4);
    if (a <= 0 || !o.map || p.lat == null) return;
    const px = x + o.map.px(p.lng) * (w / o.map.canvas.width);
    const py = y + o.map.py(p.lat) * (h / o.map.canvas.height);
    const r = 12 * k * (0.6 + 0.4 * a);
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(px, py, r + 5 * k, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = T.dot;
    ctx.fill();
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* ----------------------------- layouts ----------------------------- */

function layoutMap(ctx, o, at) {
  const { W, H, k } = o;
  const tall = H / W > 1.5;
  const sq = H / W < 1.1;
  const m = 64 * k;
  let y = header(ctx, o, (tall ? 120 : 80) * k, at, { size: sq ? 70 : 84 });
  y = statsRow(ctx, o, y + 10 * k, at, (sq ? 110 : 140) * k) + 26 * k;
  const imgs = o.imgs.slice(0, sq ? 0 : 4);
  const photosH = imgs.length ? (tall ? 280 : 200) * k : 0;
  const bottom = H - 70 * k;
  const cloudH = Math.max(H * (sq ? 0.17 : 0.2), 0);
  const mapH = Math.max(200 * k, bottom - y - cloudH - (photosH ? photosH + 22 * k : 0) - 22 * k);
  drawMap(ctx, o, m, y, W - m * 2, mapH, at);
  y += mapH + 22 * k;
  if (photosH) {
    const gap = 18 * k;
    const pw = (W - m * 2 - gap * (imgs.length - 1)) / imgs.length;
    imgs.forEach((im, i) => {
      const a = at(1.6 + i * 0.2);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, im.img, m + i * (pw + gap), y + (1 - a) * 30 * k, pw, photosH, 24 * k);
    });
    ctx.globalAlpha = 1;
    y += photosH + 22 * k;
  }
  placeCloud(ctx, o, m, y, W - m * 2, bottom - y, at, 2.2);
  watermark(ctx, o);
}

function layoutCollage(ctx, o, at) {
  const { W, H, k, theme: T } = o;
  const sq = H / W < 1.1;
  const m = 56 * k;
  let y = header(ctx, o, (H / W > 1.5 ? 110 : 76) * k, at, { center: true, size: sq ? 64 : 80 });
  // số liệu dạng chữ một dòng
  ctx.textAlign = 'center';
  ctx.fillStyle = T.text;
  ctx.globalAlpha = at(0.3);
  fitText(ctx, o.stats.map((s) => `${s.icon} ${s.value} ${s.label}`).join('   '), W / 2, y + 16 * k, W - m * 2, BODY, 32 * k);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  y += 50 * k;
  const bottom = H - 70 * k;
  const cloudH = Math.max(H * (sq ? 0.16 : 0.19), 90 * k);
  const imgs = o.imgs.slice(0, 9);
  const gh = bottom - y - cloudH - 24 * k;
  if (imgs.length) {
    mosaic(imgs.length, m, y, W - m * 2, gh, 14 * k).forEach(([x, yy, w, h], i) => {
      const a = at(0.6 + i * 0.22, 0.5);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      const s = 0.92 + 0.08 * a;
      drawCover(ctx, imgs[i].img, x + (w * (1 - s)) / 2, yy + (h * (1 - s)) / 2, w * s, h * s, 22 * k);
    });
    ctx.globalAlpha = 1;
  } else {
    drawMap(ctx, o, m, y, W - m * 2, gh, at);
  }
  y += gh + 24 * k;
  placeCloud(ctx, o, m, y, W - m * 2, bottom - y, at, 1.2 + imgs.length * 0.22);
  watermark(ctx, o);
}

function layoutPassport(ctx, o, at) {
  const { W, H, k } = o;
  const sq = H / W < 1.1;
  const night = o.themeId === 'night';
  const paper = night ? '#2A2F3A' : '#F6EFDF';
  const ink = night ? '#F3E9D2' : '#3B2F1E';
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);
  // hoa văn nền mờ
  ctx.strokeStyle = night ? 'rgba(255,255,255,0.05)' : 'rgba(120,90,40,0.08)';
  ctx.lineWidth = 2 * k;
  for (let i = -H; i < W; i += 46 * k) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  const m = 64 * k;
  // đầu trang hộ chiếu
  ctx.globalAlpha = at(0);
  ctx.fillStyle = night ? '#FFC629' : '#7A1F1F';
  ctx.font = font(HEAD, 26 * k);
  ctx.fillText('✈  PASSPORT · TRAVEL MAP', m, 90 * k);
  ctx.fillStyle = ink;
  fitText(ctx, o.title, m, 170 * k, W - m * 2, HEAD, (sq ? 60 : 74) * k, 40 * k);
  ctx.font = font(BODY, 28 * k);
  ctx.globalAlpha = at(0.2) * 0.8;
  fitText(ctx, o.stats.map((s) => `${s.value} ${s.label}`).join('  ·  '), m, 222 * k, W - m * 2, BODY, 28 * k);
  ctx.globalAlpha = 1;
  // tem: mỗi quốc gia 1 tem lớn, mỗi thành phố 1 tem nhỏ
  const stamps = [
    ...o.countries.map((cc) => ({ big: true, top: flagOf(cc), label: countryName(cc).toUpperCase(), sub: `${o.places.filter((p) => p.country === cc).length} ✦` })),
    ...o.cities.map((c) => ({ big: false, top: flagOf(c.cc), label: c.name.toUpperCase(), sub: c.date ? formatDate(c.date) : '' })),
  ];
  const top = 270 * k;
  const photos = o.imgs.slice(0, sq ? 0 : 3);
  const photoH = photos.length ? (H / W > 1.5 ? 330 : 250) * k : 0;
  const cloudH = H * (sq ? 0.16 : 0.15);
  const areaH = H - top - 70 * k - cloudH - (photoH ? photoH + 30 * k : 0) - 20 * k;
  const areaW = W - m * 2;
  // chọn cỡ tem để vừa hết
  let cols = 3;
  let size = 0;
  for (cols = 3; cols <= 8; cols++) {
    size = areaW / cols;
    if (Math.ceil(stamps.length / cols) * size * 0.92 <= areaH) break;
  }
  const rows = Math.ceil(stamps.length / cols);
  const cell = Math.min(areaW / cols, areaH / Math.max(rows, 1) / 0.92);
  stamps.forEach((s, i) => {
    const a = at(0.6 + i * Math.min(0.15, 2.4 / stamps.length), 0.35);
    if (a <= 0) return;
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = m + c * cell + cell / 2;
    const cy = top + r * cell * 0.92 + cell * 0.46;
    const rad = (s.big ? 0.44 : 0.38) * cell;
    const inkC = STAMP_INKS[i % STAMP_INKS.length];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((((i * 37) % 17) - 8) * (Math.PI / 180));
    ctx.scale(1.4 - 0.4 * a, 1.4 - 0.4 * a);
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = night ? '#FFD86B' : inkC;
    ctx.fillStyle = night ? '#FFD86B' : inkC;
    ctx.lineWidth = Math.max(2, cell * 0.03);
    ctx.beginPath();
    if (s.big) ctx.arc(0, 0, rad, 0, Math.PI * 2);
    else roundRect(ctx, -rad, -rad * 0.72, rad * 2, rad * 1.44, rad * 0.18);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, cell * 0.012);
    ctx.beginPath();
    if (s.big) ctx.arc(0, 0, rad * 0.84, 0, Math.PI * 2);
    else roundRect(ctx, -rad * 0.88, -rad * 0.6, rad * 1.76, rad * 1.2, rad * 0.12);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.globalAlpha = a;
    ctx.font = font(BODY, cell * 0.2);
    ctx.fillText(s.top, 0, -rad * 0.22);
    ctx.globalAlpha = a * 0.9;
    fitText(ctx, s.label, 0, rad * 0.2, rad * 1.55, HEAD, cell * 0.11, cell * 0.06);
    ctx.font = font(TEXT_ONLY(BODY), cell * 0.075);
    if (s.sub) ctx.fillText(s.sub, 0, rad * 0.46);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  let y = top + Math.max(areaH, 0) + 20 * k;
  if (photoH) {
    const gap = 26 * k;
    const pw = (W - m * 2 - gap * (photos.length - 1)) / photos.length;
    photos.forEach((im, i) => {
      const a = at(1.8 + i * 0.25);
      if (a <= 0) return;
      const x = m + i * (pw + gap);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x + pw / 2, y + photoH / 2);
      ctx.rotate(((i % 2 ? 3 : -3) * Math.PI) / 180);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 18 * k;
      ctx.fillRect(-pw / 2, -photoH / 2, pw, photoH);
      ctx.shadowBlur = 0;
      drawCover(ctx, im.img, -pw / 2 + 12 * k, -photoH / 2 + 12 * k, pw - 24 * k, photoH - 56 * k, 4 * k);
      ctx.fillStyle = '#3B2F1E';
      ctx.textAlign = 'center';
      fitText(ctx, im.label || '', 0, photoH / 2 - 16 * k, pw - 30 * k, BODY, 20 * k);
      ctx.restore();
    });
    y += photoH + 30 * k;
  }
  const oT = { ...o, theme: { ...o.theme, text: ink, chip: night ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)' } };
  placeCloud(ctx, oT, m, y, W - m * 2, H - 70 * k - y, at, 2.4);
  watermark(ctx, o, ink);
}

function layoutTimeline(ctx, o, at) {
  const { W, H, k, theme: T } = o;
  const m = 64 * k;
  let y = header(ctx, o, (H / W > 1.5 ? 120 : 80) * k, at, { size: H / W < 1.1 ? 64 : 80 });
  y = statsRow(ctx, o, y + 6 * k, at, (H / W < 1.1 ? 100 : 130) * k) + 30 * k;
  const groups = o.timeline;
  const imgs = o.imgs.slice(0, 4);
  const photoW = imgs.length ? 250 * k : 0;
  const bottom = H - 70 * k;
  const areaH = bottom - y;
  const lineX = m + 18 * k;
  const textX = lineX + 40 * k;
  const textW = W - textX - m - (photoW ? photoW + 30 * k : 0);
  // cỡ chữ lớn nhất để toàn bộ mốc thời gian vừa khung
  let size = 34;
  const measure = (s) => {
    ctx.font = font(TEXT_ONLY(BODY), s * k);
    let total = 0;
    for (const g of groups) {
      const words = g.places.join(' · ');
      const lines = Math.max(1, Math.ceil(ctx.measureText(words).width / textW));
      total += s * k * 1.25 + lines * s * k * 1.35 + s * k * 0.7;
    }
    return total;
  };
  while (size > 13 && measure(size) > areaH) size -= 1;
  const S = size * k;
  ctx.globalAlpha = at(0.6);
  ctx.strokeStyle = T.accent;
  ctx.lineWidth = 4 * k;
  ctx.beginPath();
  ctx.moveTo(lineX, y);
  ctx.lineTo(lineX, y + Math.min(areaH, measure(size)));
  ctx.stroke();
  ctx.globalAlpha = 1;
  let yy = y;
  groups.forEach((g, i) => {
    const a = at(0.8 + i * Math.min(0.3, 3 / groups.length), 0.4);
    ctx.globalAlpha = Math.max(a, 0);
    ctx.fillStyle = T.dot;
    ctx.beginPath();
    ctx.arc(lineX, yy + S * 0.55, S * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = T.accent;
    fitText(ctx, g.label, textX, yy + S * 0.9, textW, HEAD, S * 0.9, S * 0.6);
    yy += S * 1.25;
    ctx.fillStyle = T.text;
    ctx.font = font(TEXT_ONLY(BODY), S);
    let line = '';
    for (const wd of g.places) {
      const test = line ? `${line} · ${wd}` : wd;
      if (ctx.measureText(test).width > textW && line) {
        ctx.fillText(line, textX, yy + S);
        yy += S * 1.35;
        line = wd;
      } else line = test;
    }
    if (line) ctx.fillText(line, textX, yy + S);
    yy += S * 1.35 + S * 0.7;
  });
  ctx.globalAlpha = 1;
  if (photoW) {
    const gap = 18 * k;
    const ph = Math.min((areaH - gap * (imgs.length - 1)) / imgs.length, photoW * 1.25);
    imgs.forEach((im, i) => {
      const a = at(1.2 + i * 0.25);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, im.img, W - m - photoW + (1 - a) * 40 * k, y + i * (ph + gap), photoW, ph, 22 * k);
    });
    ctx.globalAlpha = 1;
  }
  watermark(ctx, o);
}

/** Trình chiếu: từng ảnh tràn màn hình (zoom chậm), cuối cùng là thẻ tổng kết. Ảnh tĩnh = thẻ tổng kết trên nền ảnh bìa. */
const SLIDE = 2.4;
const SUMMARY = 4.5; // trình chiếu: thẻ tổng kết trước, rồi tới ảnh của từng chuyến
function layoutSlideshow(ctx, o, at, time) {
  const { W, H, k } = o;
  const imgs = o.imgs;
  if (time !== Infinity && time >= SUMMARY && imgs.length) {
    const st = time - SUMMARY;
    const i = Math.min(imgs.length - 1, Math.floor(st / SLIDE));
    const local = Math.min(1, (st - i * SLIDE) / SLIDE);
    const im = imgs[i];
    const z = 1.04 + 0.1 * local;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = ease(local * 5);
    drawCover(ctx, im.img, 0, 0, W, H, 0, z, { x: i % 2 ? 0.4 : 0.6, y: 0.5, z: 1 });
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = ease((local - 0.1) * 4);
    ctx.fillStyle = '#fff';
    fitText(ctx, im.label || '', 64 * k, H - 170 * k, W - 128 * k, HEAD, 64 * k, 36 * k);
    ctx.fillStyle = '#FFD86B';
    fitText(ctx, im.sub || '', 64 * k, H - 110 * k, W - 128 * k, BODY, 30 * k);
    ctx.fillStyle = '#fff';
    ctx.font = font(BODY, 26 * k);
    ctx.textAlign = 'right';
    ctx.fillText(`${i + 1}/${imgs.length}`, W - 64 * k, 90 * k);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
    return;
  }
  // thẻ tổng kết (mở đầu video; cũng là ảnh tĩnh)
  const t2 = time;
  const at2 = (t0, dur = 0.6) => (t2 === Infinity ? 1 : ease((t2 - t0) / dur));
  const o2 = { ...o, time: t2 };
  if (imgs[0]) {
    drawCover(ctx, imgs[0].img, 0, 0, W, H, 0, 1.15);
    ctx.fillStyle = o.themeId === 'night' ? 'rgba(20,16,12,0.78)' : 'rgba(255,248,225,0.84)';
    ctx.fillRect(0, 0, W, H);
  } else background(ctx, o);
  const m = 64 * k;
  let y = header(ctx, o2, (H / W > 1.5 ? 160 : 90) * k, at2, { center: true, size: H / W < 1.1 ? 66 : 86 });
  y = statsRow(ctx, o2, y + 20 * k, at2, (H / W < 1.1 ? 110 : 150) * k) + 40 * k;
  placeCloud(ctx, o2, m, y, W - m * 2, H - 90 * k - y, at2, 0.8);
  watermark(ctx, o2);
}

/** Vẽ một khung hình tổng kết. time = Infinity → ảnh tĩnh đầy đủ */
function renderRecap(ctx, o, time = Infinity) {
  const oo = { ...o, time };
  const at = (t0, dur = 0.6) => (time === Infinity ? 1 : ease((time - t0) / dur));
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
  if (o.layout !== 'passport') background(ctx, oo);
  if (o.layout === 'collage') layoutCollage(ctx, oo, at);
  else if (o.layout === 'passport') layoutPassport(ctx, oo, at);
  else if (o.layout === 'timeline') layoutTimeline(ctx, oo, at);
  else if (o.layout === 'slideshow') layoutSlideshow(ctx, oo, at, time);
  else layoutMap(ctx, oo, at);
}

function videoDuration(o) {
  const n = o.places.length;
  if (o.layout === 'slideshow') return SUMMARY + o.imgs.length * SLIDE + 0.3;
  if (o.layout === 'collage') return 1.2 + Math.min(9, o.imgs.length) * 0.22 + Math.min(2, n * 0.08) + 3;
  if (o.layout === 'passport') return 0.6 + 2.4 + 3.5;
  if (o.layout === 'timeline') return 0.8 + 3 + 3;
  return 1 + Math.min(3, n * 0.35) + 3.5;
}

/* ----------------------------- component ----------------------------- */

const NO_STOPS = [];
const tsOf = (v) => (v?.toMillis ? new Date(v.toMillis()).toISOString().slice(0, 10) : typeof v === 'number' ? new Date(v).toISOString().slice(0, 10) : v || '');

export default function RecapStudio({ mode = 'year', trip, stops = NO_STOPS, onClose }) {
  const { places, memories, countries, api, notify, trips } = useApp();
  const { t, lang } = useI18n();
  const now = new Date().getFullYear();

  const years = useMemo(() => {
    const ys = new Set([now]);
    places.forEach((p) => p.status === 'visited' && p.visitedAt && ys.add(Number(p.visitedAt.slice(0, 4))));
    memories.forEach((m) => m.date && ys.add(Number(String(m.date).slice(0, 4))));
    return [...ys].filter(Boolean).sort((a, b) => b - a);
  }, [places, memories, now]);
  const [year, setYear] = useState(() => years[0] || now);
  // Kỉ niệm chỉ giữ ảnh bìa trong document → tải thêm ảnh thu nhỏ để chọn
  const [moreThumbs, setMoreThumbs] = useState({});
  useEffect(() => {
    let alive = true;
    const inScope = memories.filter((m) => (mode === 'trip' ? m.tripId === trip?.id : String(m.date || '').startsWith(String(year))));
    inScope
      .filter((m) => (m.photoCount || 0) > (m.photos?.length || 0) && !moreThumbs[m.id])
      .forEach((m) => api.getThumbs(m).then((l) => alive && l?.length && setMoreThumbs((x) => ({ ...x, [m.id]: l }))));
    return () => {
      alive = false;
    };
  }, [memories, mode, trip, year, api]); // eslint-disable-line react-hooks/exhaustive-deps

  // Địa điểm (kèm ngày) + kho ảnh để chọn
  const data = useMemo(() => {
    const map = new Map();
    const pool = [];
    const addPool = (mem, place, date, tripId) =>
      (moreThumbs[mem.id] || mem.photos || []).forEach((url, i) => pool.push({ key: `${mem.id || mem.memoryId}:${i}`, url, i, mem, place, date, tripId: tripId || '' }));
    if (mode === 'trip') {
      stops.forEach((s) => s.place && !map.has(s.place.id) && map.set(s.place.id, { ...s.place, date: s.date || tsOf(s.createdAt) }));
      const seen = new Set();
      memories
        .filter((m) => m.tripId === trip?.id)
        .forEach((m) => {
          seen.add(m.id);
          if (m.place && !map.has(m.place.id)) map.set(m.place.id, { ...m.place, date: m.date });
          addPool(m, m.place, m.date, trip?.id);
        });
      stops.forEach((s) => s.memoryId && !seen.has(s.memoryId) && (seen.add(s.memoryId), addPool({ id: s.memoryId, memoryId: s.memoryId, photos: s.photos }, s.place, s.date || tsOf(s.createdAt), trip?.id)));
    } else {
      const inYear = (d) => d && String(d).slice(0, 4) === String(year);
      places.forEach((p) => p.status === 'visited' && inYear(p.visitedAt) && map.set(p.id, { ...p, date: p.visitedAt }));
      const mems = memories.filter((m) => inYear(m.date));
      mems.forEach((m) => {
        if (m.place && !map.has(m.place.id)) map.set(m.place.id, { ...m.place, date: m.date });
        addPool(m, m.place, m.date, m.tripId);
      });
    }
    const list = [...map.values()].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    pool.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    return { places: list, pool };
  }, [mode, stops, places, memories, year, trip, moreThumbs]);

  const [layout, setLayout] = useState('map');
  // Số ảnh bố cục đang chọn hiển thị: chỉ cho chọn đúng bấy nhiêu ảnh
  const maxFor = LAYOUTS.find((l) => l.id === layout).max;
  // Mặc định: mỗi chuyến đi 1 ảnh (chuyến đi: mỗi địa điểm 1 ảnh), tối thiểu 4 ảnh nếu có
  const defaultPick = useMemo(() => {
    const pick = [];
    const used = new Set();
    const groupKey = (ph) => (mode === 'trip' ? `p:${ph.place?.id}` : ph.tripId ? `t:${ph.tripId}` : null);
    data.pool.forEach((ph) => {
      const g = groupKey(ph);
      if (g && !used.has(g) && pick.length < 8) {
        used.add(g);
        pick.push(ph.key);
      }
    });
    data.pool.forEach((ph) => {
      const g = `p:${ph.place?.id}`;
      if (pick.length < 4 && !pick.includes(ph.key) && !used.has(g)) {
        used.add(g);
        pick.push(ph.key);
      }
    });
    data.pool.forEach((ph) => pick.length < Math.min(4, data.pool.length) && !pick.includes(ph.key) && pick.push(ph.key));
    return pick.slice(0, maxFor);
  }, [data, mode, maxFor]);
  const [picked, setPicked] = useState(defaultPick);
  // Đổi năm / chuyến → chọn lại mặc định; ảnh tải thêm sau không ghi đè lựa chọn của người dùng
  const pickKey = `${mode}-${year}-${trip?.id || ''}`;
  const pickKeyRef = useRef(pickKey);
  const touched = useRef(false);
  useEffect(() => {
    if (pickKeyRef.current !== pickKey) {
      pickKeyRef.current = pickKey;
      touched.current = false;
    }
    if (!touched.current) setPicked(defaultPick);
    else setPicked((cur) => (cur.length > maxFor ? cur.slice(0, maxFor) : cur));
  }, [defaultPick, pickKey, maxFor]);
  const togglePick = (key) =>
    (touched.current = true) &&
    setPicked((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : cur.length >= maxFor ? (notify(t('recap.maxPhotos', { n: maxFor })), cur) : [...cur, key]));

  const [fmt, setFmt] = useState('story');
  const [theme, setTheme] = useState('honey');
  const [imgs, setImgs] = useState([]);
  const [busy, setBusy] = useState('');
  const canvasRef = useRef();
  const F = FORMATS.find((f) => f.id === fmt);

  // Tải ảnh đã chọn (ảnh vừa nếu có), giữ đúng thứ tự chọn
  const cacheRef = useRef({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await Promise.all(
        picked.map(async (key) => {
          const ph = data.pool.find((x) => x.key === key);
          if (!ph) return null;
          if (cacheRef.current[key]) return cacheRef.current[key];
          let url = ph.url;
          try {
            const arr = await api.getPhotos(ph.mem, 'medium');
            url = arr?.[ph.i] || ph.url;
          } catch {
            /* dùng ảnh thu nhỏ */
          }
          try {
            const img = await loadImage(url);
            const item = {
              key,
              img,
              label: ph.place ? pName(ph.place) : '',
              sub: [ph.place && [pCity(ph.place), countryName(ph.place.country)].filter(Boolean).join(', '), ph.date && formatDate(ph.date)].filter(Boolean).join(' · '),
            };
            cacheRef.current[key] = item;
            return item;
          } catch {
            return null;
          }
        }),
      );
      if (alive) setImgs(list.filter(Boolean));
    })();
    return () => {
      alive = false;
    };
  }, [picked, data, api]);

  const derived = useMemo(() => {
    const cc = [...new Set(data.places.map((p) => p.country).filter(Boolean))];
    const cityMap = new Map();
    data.places.forEach((p) => {
      const name = pCity(p);
      if (name && !cityMap.has(`${p.country}|${name}`)) cityMap.set(`${p.country}|${name}`, { name, cc: p.country, date: p.date });
    });
    const cities = [...cityMap.values()];
    // Dòng thời gian: năm → theo tháng; chuyến đi → theo ngày
    const groups = new Map();
    data.places.forEach((p) => {
      const d = p.date ? String(p.date) : '';
      const key = d ? (mode === 'trip' ? d.slice(0, 10) : d.slice(0, 7)) : '~';
      (groups.get(key) || groups.set(key, []).get(key)).push(pName(p));
    });
    const label = (key) => {
      if (key === '~') return t('recap.noDate');
      if (mode === 'trip') return formatDate(key);
      const dt = new Date(`${key}-01T00:00:00`);
      const txt = dt.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    };
    const timeline = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ label: label(k), places: v }));
    const stats = [
      { icon: '📍', value: data.places.length, label: t('recap.places') },
      { icon: '🌏', value: cc.length, label: t('recap.countries') },
      { icon: '🏙️', value: cities.length, label: t('recap.cities') },
    ];
    if (mode === 'year') stats.push({ icon: '🧳', value: new Set(memories.filter((m) => String(m.date || '').startsWith(String(year)) && m.tripId).map((m) => m.tripId)).size || trips.filter((x) => String(x.startDate || '').startsWith(String(year))).length, label: t('recap.trips') });
    return { countries: cc, cities, timeline, stats };
  }, [data, mode, t, lang, memories, trips, year]);

  const opts = useMemo(() => {
    const T = THEMES[theme];
    const k = F.w / 1080;
    const m = 64 * k;
    const mapW = Math.round(F.w - m * 2);
    const mapH = Math.round(F.h * (F.h / F.w > 1.5 ? 0.36 : 0.32));
    const visited = new Set(data.places.map((p) => p.country));
    const view = viewFor(data.places, mapW / mapH);
    const map = countries ? drawMapLayer(countries.features, visited, view, mapW, mapH, T) : null;
    const range = data.places.length && data.places[0].date ? [data.places[0].date, data.places[data.places.length - 1].date].filter(Boolean) : [];
    return {
      W: F.w, H: F.h, k, theme: T, themeId: theme, layout, map, imgs, places: data.places, ...derived,
      eyebrow: mode === 'trip' ? `${trip?.emoji || '🧳'} ${t('recap.tripEyebrow')}` : t('recap.yearEyebrow'),
      title: mode === 'trip' ? trip?.name || '' : t('recap.yearTitle', { year }),
      subtitle: mode === 'trip' && range.length ? `${formatDate(range[0])} → ${formatDate(range[range.length - 1])}` : derived.countries.map((cc) => `${flagOf(cc)} ${countryName(cc)}`).join('  '),
      watermark: t('canvas.watermark'),
    };
  }, [theme, F, data, imgs, derived, countries, mode, trip, year, t, layout]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = F.w;
    c.height = F.h;
    const draw = () => renderRecap(c.getContext('2d'), opts);
    draw();
    document.fonts?.ready.then(draw);
  }, [opts, F]);

  const deliver = async (blob, name) => {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: opts.title, text: `${opts.title} #travelmap` });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    notify(t('studio.downloaded'));
  };

  // Ảnh: hiện đúng ảnh sẽ lưu để xem lại trước, rồi mới lưu / chia sẻ
  const exportImage = () => canvasRef.current.toBlob((b) => b && setResult({ kind: 'image', url: URL.createObjectURL(b), blob: b, name: `travel-map-recap-${Date.now()}.png` }), 'image/png');

  // Xem trước chuyển động ngay trên khung xem trước (không ghi video)
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(0);
  const stopPreview = () => {
    cancelAnimationFrame(playRef.current);
    setPlaying(false);
    const c = canvasRef.current;
    if (c) renderRecap(c.getContext('2d'), opts);
  };
  const playPreview = () => {
    const c = canvasRef.current;
    if (!c) return;
    if (layout === 'slideshow' && !imgs.length) return notify(t('recap.needPhotos'), 'error');
    setPlaying(true);
    const ctx = c.getContext('2d');
    const duration = videoDuration(opts);
    const t0 = performance.now();
    const tick = () => {
      const time = (performance.now() - t0) / 1000;
      renderRecap(ctx, opts, Math.min(time, duration));
      if (time < duration) playRef.current = requestAnimationFrame(tick);
      else setTimeout(stopPreview, 600);
    };
    tick();
  };
  useEffect(() => () => cancelAnimationFrame(playRef.current), []);
  useEffect(() => {
    if (playing) stopPreview();
  }, [opts]); // eslint-disable-line react-hooks/exhaustive-deps
  // Video đã tạo: xem lại trước khi lưu / chia sẻ
  const [result, setResult] = useState(null); // { url, blob, name }
  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  const exportVideo = async () => {
    stopPreview();
    const mime = pickMime();
    if (!mime) return notify(t('studio.noVideo'), 'error');
    if (layout === 'slideshow' && !imgs.length) return notify(t('recap.needPhotos'), 'error');
    setBusy(t('studio.making'));
    const c = document.createElement('canvas');
    c.width = F.w;
    c.height = F.h;
    const ctx = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    const duration = videoDuration(opts);
    rec.start();
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        const time = (performance.now() - t0) / 1000;
        renderRecap(ctx, opts, time);
        if (time < duration) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    rec.stop();
    await done;
    setBusy('');
    const blob = new Blob(chunks, { type: mime.split(';')[0] });
    setResult({ url: URL.createObjectURL(blob), blob, name: `travel-map-recap-${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}` });
  };

  return (
    <Modal title={mode === 'trip' ? t('recap.tripModal') : t('recap.yearModal')} onClose={onClose} wide className="modal--studio">
      <div className="studio">
        <div className="studio__preview">
          {!countries ? (
            <Loader size="md" />
          ) : (
            <>
              <canvas ref={canvasRef} style={result ? { display: 'none' } : undefined} />
              {result && (result.kind === 'image' ? <img className="studio__video" src={result.url} alt="" /> : <video className="studio__video" src={result.url} controls autoPlay loop playsInline />)}
            </>
          )}
        </div>
        <div className="studio__controls stack">
          {mode === 'year' && (
            <div className="field">
              <span>{t('recap.year')}</span>
              <div className="chips">
                {years.map((y) => (
                  <button key={y} className={`chip ${y === year ? 'chip--on' : ''}`} onClick={() => setYear(y)}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}
          {data.places.length === 0 && <p className="warn small">{mode === 'trip' ? t('recap.emptyTrip') : t('recap.emptyYear', { year })}</p>}
          <div className="field">
            <span>{t('recap.layout')}</span>
            <div className="recap-layouts">
              {LAYOUTS.map((l) => (
                <button key={l.id} className={layout === l.id ? 'on' : ''} onClick={() => setLayout(l.id)}>
                  <b>{l.emoji}</b>
                  <small>{t('recap.layout.' + l.id)}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>
              {t('recap.pickPhotos', { n: picked.length, max: maxFor })}
              <small className="muted"> · {t('recap.layoutNeeds', { n: maxFor })}</small>
            </span>
            {data.pool.length === 0 ? (
              <p className="small muted">{t('recap.noPhotos')}</p>
            ) : (
              <>
                <div className="recap-photos">
                  {data.pool.map((ph) => {
                    const idx = picked.indexOf(ph.key);
                    return (
                      <button key={ph.key} className={idx >= 0 ? 'on' : ''} onClick={() => togglePick(ph.key)} title={ph.place ? pName(ph.place) : ''}>
                        <img src={ph.url} alt="" loading="lazy" />
                        {idx >= 0 && <span>{idx + 1}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="row wrap">
                  <button className="btn btn--sm btn--ghost" onClick={() => setPicked(defaultPick)}>
                    ↺ {mode === 'trip' ? t('recap.pickDefaultTrip') : t('recap.pickDefault')}
                  </button>
                  {picked.length > 0 && (
                    <button className="btn btn--sm btn--ghost" onClick={() => ((touched.current = true), setPicked([]))}>
                      ✕ {t('recap.pickNone')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="field">
            <span>{t('recap.theme')}</span>
            <div className="segmented">
              <button className={theme === 'honey' ? 'on' : ''} onClick={() => setTheme('honey')}>
                🍯 {t('recap.themeHoney')}
              </button>
              <button className={theme === 'night' ? 'on' : ''} onClick={() => setTheme('night')}>
                🌙 {t('recap.themeNight')}
              </button>
            </div>
          </div>
          <div className="field">
            <span>{t('studio.format')}</span>
            <div className="segmented">
              {FORMATS.map((f) => (
                <button key={f.id} className={fmt === f.id ? 'on' : ''} onClick={() => setFmt(f.id)}>
                  {t('fmt.' + f.id)}
                </button>
              ))}
            </div>
          </div>
          {busy ? (
            <Loader text={busy} />
          ) : result ? (
            <div className="stack-sm">
              <p className="small">✅ {t(result.kind === 'image' ? 'studio.imageReady' : 'studio.videoReady')}</p>
              <div className="grid-2">
                <button className="btn btn--primary" onClick={() => deliver(result.blob, result.name)}>
                  {t(result.kind === 'image' ? 'studio.saveImage' : 'studio.saveVideo')}
                </button>
                <button className="btn btn--outline" onClick={() => setResult(null)}>
                  ← {t('studio.backToEdit')}
                </button>
              </div>
            </div>
          ) : (
            <div className="stack-sm">
              <button className="btn btn--outline btn--block" disabled={!countries} onClick={playing ? stopPreview : playPreview}>
                {playing ? `⏹ ${t('studio.stopPreview')}` : `▶ ${t('studio.playPreview')}`}
              </button>
              <div className="grid-2">
                <button className="btn btn--primary" disabled={!countries} onClick={exportImage}>
                  {t('studio.makeImage')}
                </button>
                <button className="btn btn--dark" disabled={!countries} onClick={exportVideo}>
                  {t('studio.makeVideo')}
                </button>
              </div>
            </div>
          )}
          <p className="small muted">{t('studio.mobileHint')}</p>
        </div>
      </div>
    </Modal>
  );
}
