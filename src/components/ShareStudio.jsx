import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { Modal, Loader } from './ui';
import { loadImage } from '../lib/image';
import { countryName, flagOf } from '../lib/countries';
import { formatDate } from './ui';
import { useI18n } from '../i18n';
import { pName, pCity } from '../lib/lang';

/* --------------------------------------------------------------- */
/* Studio tạo ảnh / video chia sẻ mạng xã hội từ 1–4 tấm ảnh        */
/* --------------------------------------------------------------- */

const TEMPLATES = [
  { id: 'polaroid', emoji: '📸' },
  { id: 'postcard', emoji: '💌' },
  { id: 'film', emoji: '🎞️' },
  { id: 'bento', emoji: '🍱' },
];
const FORMATS = [
  { id: 'story', w: 1080, h: 1920 },
  { id: 'portrait', w: 1080, h: 1350 },
  { id: 'square', w: 1080, h: 1080 },
];

export const C = {
  honey: '#FFC629', honey2: '#F5B000', honeySoft: '#FFF0C2', cream: '#FFFCF5', ink: '#1F1A14', ink2: '#4A4237', coral: '#FF7A59', white: '#FFFFFF',
};
export const HEAD = '700 {s}px "Twemoji Country Flags", Lexend, "Be Vietnam Pro", sans-serif';
export const BODY = '500 {s}px "Twemoji Country Flags", "Be Vietnam Pro", sans-serif';
export const font = (tpl, s) => tpl.replace('{s}', Math.round(s));

/* Vẽ chữ một dòng vừa khung (dùng cho tiêu đề / dòng phụ).
   Safari iOS đo và canh giữa sai khi dòng chữ có emoji cờ, nên:
   - tách emoji (cờ, 📍…) ra vẽ riêng với bề rộng cố định,
   - đo phần chữ bằng font không có emoji,
   - tự tính toạ độ và luôn vẽ canh trái;
   - quá dài thì giảm cỡ chữ, rồi mới cắt "…". */
const EMOJI_RE = /(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}\uFE0F?)/u;
const textOnly = (tpl) => tpl.replace('"Twemoji Country Flags", ', '');
function lineParts(text) {
  return text.split(EMOJI_RE).filter(Boolean).map((t) => ({ t, emoji: EMOJI_RE.test(t) && t.match(EMOJI_RE)[0] === t }));
}
function lineWidth(ctx, parts, tpl, s) {
  ctx.font = font(textOnly(tpl), s);
  return parts.reduce((w, p) => w + (p.emoji ? s * 1.3 : ctx.measureText(p.t).width), 0);
}
export function fitText(ctx, text, x, y, maxW, tpl, size, minSize = size * 0.6) {
  const align = ctx.textAlign;
  let parts = lineParts(text);
  let s = size;
  while (s > minSize && lineWidth(ctx, parts, tpl, s) > maxW) s -= 2;
  if (lineWidth(ctx, parts, tpl, s) > maxW) {
    // cắt dần ký tự cuối của phần chữ rồi thêm "…"
    while (parts.length && lineWidth(ctx, [...parts, { t: '…' }], tpl, s) > maxW) {
      const last = parts[parts.length - 1];
      if (last.emoji || last.t.length <= 1) parts = parts.slice(0, -1);
      else parts = [...parts.slice(0, -1), { t: last.t.slice(0, -1) }];
    }
    if (parts.length) parts[parts.length - 1] = { ...parts[parts.length - 1], t: parts[parts.length - 1].t.trimEnd() };
    parts = [...parts, { t: '…' }];
  }
  const w = lineWidth(ctx, parts, tpl, s);
  let cx = align === 'center' ? x - w / 2 : align === 'right' || align === 'end' ? x - w : x;
  ctx.textAlign = 'left';
  for (const p of parts) {
    if (p.emoji) {
      ctx.font = font(tpl, s * 1.05);
      ctx.fillText(p.t, cx, y);
      cx += s * 1.3;
    } else {
      ctx.font = font(textOnly(tpl), s);
      ctx.fillText(p.t, cx, y);
      cx += ctx.measureText(p.t).width;
    }
  }
  ctx.textAlign = align;
}
export const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}

export const DEFAULT_CROP = { x: 0.5, y: 0.5, z: 1 };

/** Vẽ ảnh phủ kín khung. `crop` = điểm lấy nét (x, y: 0–1) + mức phóng (z ≥ 1) do người dùng chỉnh. */
export function drawCover(ctx, img, x, y, w, h, r = 0, zoom = 1, crop = DEFAULT_CROP) {
  const s = Math.max(w / img.width, h / img.height) * zoom * crop.z;
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, x + (w - iw) * crop.x, y + (h - ih) * crop.y, iw, ih);
  ctx.restore();
}

function gridSlots(n, x, y, w, h, gap) {
  if (n === 1) return [[x, y, w, h]];
  if (n === 2) {
    if (h > w * 1.1) return [[x, y, w, (h - gap) / 2], [x, y + (h + gap) / 2, w, (h - gap) / 2]];
    return [[x, y, (w - gap) / 2, h], [x + (w + gap) / 2, y, (w - gap) / 2, h]];
  }
  if (n === 3) {
    const big = h > w ? (h - gap) * 0.58 : h;
    if (h > w) return [[x, y, w, big], [x, y + big + gap, (w - gap) / 2, h - big - gap], [x + (w + gap) / 2, y + big + gap, (w - gap) / 2, h - big - gap]];
    return [[x, y, (w - gap) * 0.6, h], [x + (w - gap) * 0.6 + gap, y, (w - gap) * 0.4, (h - gap) / 2], [x + (w - gap) * 0.6 + gap, y + (h + gap) / 2, (w - gap) * 0.4, (h - gap) / 2]];
  }
  const cw = (w - gap) / 2;
  const ch = (h - gap) / 2;
  return [[x, y, cw, ch], [x + cw + gap, y, cw, ch], [x, y + ch + gap, cw, ch], [x + cw + gap, y + ch + gap, cw, ch]];
}

export function wrapText(ctx, text, maxW, maxLines = 2) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
  return lines;
}

function dots(ctx, W, H, color, step = 54) {
  ctx.fillStyle = color;
  for (let y = step / 2; y < H; y += step) for (let x = (y / step) % 2 ? step / 2 : step; x < W; x += step) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Vẽ 1 khung hình. `time` (giây) dùng cho video: ảnh xuất hiện lần lượt.
 * time = Infinity => ảnh tĩnh, mọi thứ đã hiện đủ.
 */
function render(ctx, { tpl, W, H, imgs, crops = [], title, sub, caption, date, flag, watermark }, time = Infinity) {
  const slots = []; // vùng hiển thị từng ảnh (toạ độ canvas) — dùng để kéo chỉnh vị trí
  const crop = (i) => crops[i] || DEFAULT_CROP;
  const n = imgs.length;
  const appear = (i) => ease((time - 0.3 - i * 0.9) / 0.7);
  const zoomAt = (i) => (time === Infinity ? 1 : 1.12 - 0.12 * ease((time - i * 0.9) / 4));
  const titleA = ease(time / 0.6);
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  if (tpl === 'polaroid') {
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);
    dots(ctx, W, H, '#FFE38A');
    ctx.globalAlpha = titleA;
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    fitText(ctx, title, W / 2, 150, W - 160, HEAD, 78);
    ctx.fillStyle = C.ink2;
    fitText(ctx, `${flag} ${sub}${date ? ' · ' + date : ''}`, W / 2, 210, W - 160, BODY, 36);
    ctx.globalAlpha = 1;
    const top = 260;
    const bottom = H - (caption ? 230 : 140);
    const area = gridSlots(n, 90, top, W - 180, bottom - top, 40);
    const tilts = [-4, 3.5, -2.5, 4];
    area.forEach(([x, y, w, h], i) => {
      const a = appear(i);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x + w / 2, y + h / 2 + (1 - a) * 80);
      ctx.rotate(((n === 1 ? -2 : tilts[i]) * Math.PI) / 180);
      const pad = 22;
      const fw = w * 0.96;
      const fh = h * 0.96;
      ctx.shadowColor = 'rgba(122,84,0,.25)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = C.white;
      ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      ctx.shadowColor = 'transparent';
      drawCover(ctx, imgs[i], -fw / 2 + pad, -fh / 2 + pad, fw - pad * 2, fh - pad * 2 - 70, 4, zoomAt(i), crop(i));
      slots.push({ i, x: x + w / 2 - fw / 2 + pad, y: y + h / 2 - fh / 2 + pad, w: fw - pad * 2, h: fh - pad * 2 - 70 });
      ctx.fillStyle = C.ink2;
      ctx.font = font(BODY, 30);
      ctx.textAlign = 'center';
      ctx.fillText(['♡', '✿', '☀', '✈'][i], 0, fh / 2 - 26);
      // băng dính
      ctx.fillStyle = 'rgba(255,198,41,.75)';
      ctx.rotate((6 * Math.PI) / 180);
      ctx.fillRect(-60, -fh / 2 - 22, 120, 44);
      ctx.restore();
    });
    if (caption) {
      ctx.globalAlpha = ease((time - 0.6 - n * 0.9) / 0.6);
      ctx.fillStyle = C.ink;
      ctx.font = font(BODY, 40);
      ctx.textAlign = 'center';
      wrapText(ctx, `“${caption}”`, W - 200).forEach((l, i) => ctx.fillText(l, W / 2, H - 170 + i * 52));
      ctx.globalAlpha = 1;
    }
  } else if (tpl === 'postcard') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#FFD452');
    g.addColorStop(1, '#FF9E6B');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const m = 60;
    ctx.fillStyle = C.cream;
    roundRect(ctx, m, m, W - m * 2, H - m * 2, 40);
    ctx.fill();
    ctx.setLineDash([18, 14]);
    ctx.strokeStyle = C.honey2;
    ctx.lineWidth = 4;
    roundRect(ctx, m + 24, m + 24, W - m * 2 - 48, H - m * 2 - 48, 28);
    ctx.stroke();
    ctx.setLineDash([]);
    // tem
    ctx.save();
    ctx.translate(W - m - 150, m + 70);
    ctx.rotate(0.08);
    ctx.fillStyle = C.white;
    ctx.fillRect(-10, -10, 120, 140);
    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 4;
    ctx.strokeRect(-2, -2, 104, 124);
    ctx.font = '72px "Twemoji Country Flags", serif';
    ctx.textAlign = 'center';
    ctx.fillText(flag, 50, 82);
    ctx.restore();
    ctx.globalAlpha = titleA;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.coral;
    ctx.font = font(BODY, 34);
    ctx.fillText('Greetings from', m + 70, m + 120);
    ctx.fillStyle = C.ink;
    ctx.font = font(HEAD, 84);
    wrapText(ctx, title, W - m * 2 - 300, 2).forEach((l, i) => ctx.fillText(l, m + 70, m + 210 + i * 92));
    ctx.globalAlpha = 1;
    const titleLines = ctx.measureText(title).width > W - m * 2 - 300 ? 2 : 1;
    const top = m + 210 + titleLines * 92 - 30;
    const bottom = H - m - (caption ? 210 : 90);
    gridSlots(n, m + 70, top, W - m * 2 - 140, bottom - top, 24).forEach(([x, y, w, h], i) => {
      const a = appear(i);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, imgs[i], x, y + (1 - a) * 40, w, h, 28, zoomAt(i), crop(i));
      slots.push({ i, x, y, w, h });
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = C.ink2;
    ctx.font = font(BODY, 38);
    ctx.textAlign = 'left';
    const cy = H - m - 150;
    if (caption) wrapText(ctx, caption, W - m * 2 - 140).forEach((l, i) => ctx.fillText(l, m + 70, cy + i * 50));
    ctx.fillStyle = C.honey2;
    fitText(ctx, `📍 ${sub}${date ? '  ·  ' + date : ''}`, m + 70, H - m - 52, W - m * 2 - 140, BODY, 30);
  } else if (tpl === 'film') {
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    const sx = 150;
    const sw = W - 300;
    ctx.fillStyle = '#2B241C';
    ctx.fillRect(sx - 60, 0, sw + 120, H);
    ctx.fillStyle = C.ink;
    for (let y = 20; y < H; y += 70) {
      roundRect(ctx, sx - 42, y, 26, 40, 6);
      ctx.fill();
      roundRect(ctx, sx + sw + 16, y, 26, 40, 6);
      ctx.fill();
    }
    const top = 240;
    const bottom = H - (caption ? 260 : 160);
    const fh = (bottom - top - (n - 1) * 30) / n;
    imgs.forEach((img, i) => {
      const a = appear(i);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, img, sx, top + i * (fh + 30), sw, fh, 6, zoomAt(i), crop(i));
      slots.push({ i, x: sx, y: top + i * (fh + 30), w: sw, h: fh });
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.honey;
      ctx.font = font(BODY, 22);
      ctx.textAlign = 'left';
      ctx.fillText(`${String(i + 1).padStart(2, '0')}A  ▸  ${title.toUpperCase()}`, sx, top + i * (fh + 30) + fh + 24);
    });
    ctx.globalAlpha = titleA;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.honey;
    fitText(ctx, title, W / 2, 130, W - 160, HEAD, 72);
    ctx.fillStyle = C.honeySoft;
    fitText(ctx, `${flag} ${sub}${date ? ' · ' + date : ''}`, W / 2, 185, W - 160, BODY, 32);
    ctx.globalAlpha = 1;
    if (caption) {
      ctx.fillStyle = C.white;
      ctx.font = font(BODY, 38);
      wrapText(ctx, caption, W - 220).forEach((l, i) => ctx.fillText(l, W / 2, H - 190 + i * 50));
    }
  } else {
    // bento
    ctx.fillStyle = C.white;
    ctx.fillRect(0, 0, W, H);
    const m = 56;
    ctx.globalAlpha = titleA;
    ctx.fillStyle = C.honey;
    roundRect(ctx, m, m, W - m * 2, 220, 44);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'left';
    fitText(ctx, title, m + 50, m + 115, W - m * 2 - 220, HEAD, 72);
    fitText(ctx, `${sub}${date ? ' · ' + date : ''}`, m + 50, m + 170, W - m * 2 - 220, BODY, 32);
    ctx.font = '110px "Twemoji Country Flags", serif';
    ctx.textAlign = 'right';
    ctx.fillText(flag, W - m - 40, m + 160);
    ctx.globalAlpha = 1;
    const top = m + 220 + 24;
    const bottom = H - m - (caption ? 190 : 80);
    gridSlots(n, m, top, W - m * 2, bottom - top, 24).forEach(([x, y, w, h], i) => {
      const a = appear(i);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, imgs[i], x, y, w, h, 44, zoomAt(i) * (0.94 + 0.06 * a), crop(i));
      slots.push({ i, x, y, w, h });
      ctx.globalAlpha = 1;
    });
    if (caption) {
      ctx.fillStyle = C.honeySoft;
      roundRect(ctx, m, H - m - 166, W - m * 2, 140, 44);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = font(BODY, 36);
      ctx.textAlign = 'left';
      wrapText(ctx, caption, W - m * 2 - 100).forEach((l, i) => ctx.fillText(l, m + 50, H - m - 106 + i * 46));
    }
  }
  // watermark
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.font = font(BODY, 24);
  ctx.fillStyle = tpl === 'film' ? C.honey : tpl === 'postcard' ? C.ink : C.ink2;
  ctx.fillText(watermark, W / 2, H - (tpl === 'postcard' ? 18 : tpl === 'bento' ? 22 : 40));
  ctx.globalAlpha = 1;
  return slots;
}

export function pickMime() {
  const list = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return list.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
}

export default function ShareStudio({ memory, onClose }) {
  const { notify, api } = useApp();
  const { t } = useI18n();
  const [extra, setExtra] = useState([]); // ảnh thêm từ thiết bị
  const [base, setBase] = useState(memory.fullPhotos || memory.photos || []);
  const sources = useMemo(() => [...base, ...extra], [base, extra]);
  const [selected, setSelected] = useState(() => base.slice(0, 4));
  const [tpl, setTpl] = useState('polaroid');
  const [fmt, setFmt] = useState('story');
  const [caption, setCaption] = useState(memory.caption || '');
  const [loaded, setLoaded] = useState([]); // [{src, img}] theo thứ tự đã chọn
  const [crops, setCrops] = useState({}); // src → {x, y, z}
  const [active, setActive] = useState(0); // ảnh đang chỉnh (index trong selected)
  const [slots, setSlots] = useState([]);
  const [busy, setBusy] = useState('');
  const [tainted, setTainted] = useState(false);
  const canvasRef = useRef();
  const drag = useRef(null);
  const F = FORMATS.find((f) => f.id === fmt);

  // Tải ảnh độ phân giải đầy đủ (ảnh trong danh sách chỉ là ảnh thu nhỏ)
  useEffect(() => {
    if (memory.fullPhotos) return;
    api.getFullPhotos(memory).then((full) => {
      if (!full?.length) return;
      setBase(full);
      // Document có thể chỉ giữ ảnh bìa → khi có đủ ảnh thì chọn sẵn tối đa 4 ảnh như trước
      setSelected((sel) => (sel.length <= 1 && full.length > 1 ? full.slice(0, 4) : sel.map((s) => full[(memory.photos || []).indexOf(s)] || s)));
    });
  }, [memory, api]);

  useEffect(() => {
    let alive = true;
    Promise.all(selected.map((src) => loadImage(src).then((img) => ({ src, img })).catch(() => null))).then(
      (list) => alive && setLoaded(list.filter(Boolean)),
    );
    return () => {
      alive = false;
    };
  }, [selected]);

  const opts = useMemo(
    () => ({
      tpl, W: F.w, H: F.h, imgs: loaded.map((l) => l.img), crops: loaded.map((l) => crops[l.src] || DEFAULT_CROP),
      title: pName(memory.place) || t('studio.fallbackTitle'), caption,
      sub: [pCity(memory.place), countryName(memory.place?.country)].filter(Boolean).join(', '),
      date: formatDate(memory.date || memory.createdAt), flag: flagOf(memory.place?.country), watermark: t('canvas.watermark'),
    }),
    [tpl, F, loaded, crops, caption, memory, t],
  );

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !loaded.length) return;
    c.width = F.w;
    c.height = F.h;
    const draw = () => setSlots(render(c.getContext('2d'), opts));
    draw();
    document.fonts?.ready.then(draw);
    try {
      c.getContext('2d').getImageData(0, 0, 1, 1);
      setTainted(false);
    } catch {
      setTainted(true);
    }
  }, [opts, loaded, F]);

  const toggle = (src) =>
    setSelected((s) => (s.includes(src) ? s.filter((x) => x !== src) : s.length >= 4 ? s : [...s, src]));

  /* ---------- Kéo để chỉnh vị trí ảnh trong khung ---------- */
  const toCanvas = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * F.w, y: ((e.clientY - r.top) / r.height) * F.h, scale: F.w / r.width };
  };
  const activeSrc = loaded[active]?.src;
  const cropOf = (src) => crops[src] || DEFAULT_CROP;
  const setCrop = (src, patch) => setCrops((c) => ({ ...c, [src]: { ...(c[src] || DEFAULT_CROP), ...patch } }));

  const onPointerDown = (e) => {
    const p = toCanvas(e);
    const slot = slots.find((s) => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h);
    if (!slot) return;
    setActive(slot.i);
    drag.current = { slot, last: p };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const p = toCanvas(e);
    const { slot } = d;
    const { src, img } = loaded[slot.i] || {};
    if (!img) return;
    const c = cropOf(src);
    const sc = Math.max(slot.w / img.width, slot.h / img.height) * c.z;
    const overX = img.width * sc - slot.w;
    const overY = img.height * sc - slot.h;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    setCrop(src, {
      x: overX > 1 ? clamp(c.x - (p.x - d.last.x) / overX) : 0.5,
      y: overY > 1 ? clamp(c.y - (p.y - d.last.y) / overY) : 0.5,
    });
    d.last = p;
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e) => {
    if (!activeSrc) return;
    const z = Math.min(3, Math.max(1, cropOf(activeSrc).z * (e.deltaY < 0 ? 1.06 : 1 / 1.06)));
    setCrop(activeSrc, { z });
  };
  const activeSlot = slots.find((s) => s.i === active);

  const deliver = async (blob, name) => {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: opts.title, text: `${opts.title} ${opts.flag} #bandodulich` });
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

  const exportImage = () => {
    canvasRef.current.toBlob((b) => b && deliver(b, `travel-map-${Date.now()}.png`), 'image/png');
  };

  const exportVideo = async () => {
    const mime = pickMime();
    if (!mime) return notify(t('studio.noVideo'), 'error');
    setBusy(t('studio.making'));
    const c = document.createElement('canvas');
    c.width = F.w;
    c.height = F.h;
    const ctx = c.getContext('2d');
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    const duration = 1.5 + loaded.length * 0.9 + 2.5;
    rec.start();
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        const time = (performance.now() - t0) / 1000;
        render(ctx, opts, time);
        if (time < duration) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    rec.stop();
    await done;
    setBusy('');
    const blob = new Blob(chunks, { type: mime.split(';')[0] });
    deliver(blob, `travel-map-${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
  };

  return (
    <Modal title={t('studio.title')} onClose={onClose} wide className="modal--studio">
      <div className="studio">
        <div className="studio__preview">
          {loaded.length ? (
            <div className="studio__stage">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              />
              {activeSlot && (
                <div
                  className="studio__focus"
                  style={{
                    left: `${(activeSlot.x / F.w) * 100}%`,
                    top: `${(activeSlot.y / F.h) * 100}%`,
                    width: `${(activeSlot.w / F.w) * 100}%`,
                    height: `${(activeSlot.h / F.h) * 100}%`,
                  }}
                >
                  <span>✥</span>
                </div>
              )}
            </div>
          ) : (
            selected.length ? <Loader size="md" /> : <div className="studio__empty">{t('studio.empty')}</div>
          )}
        </div>
        <div className="studio__controls stack">
          <div className="field">
            <span>{t('studio.pick', { n: selected.length })}</span>
            <div className="studio__photos">
              {sources.map((s) => (
                <button key={s} className={`studio__ph ${selected.includes(s) ? 'on' : ''}`} onClick={() => toggle(s)}>
                  <img src={s} alt="" />
                  {selected.includes(s) && <span>{selected.indexOf(s) + 1}</span>}
                </button>
              ))}
              <label className="studio__ph studio__ph--add" title={t('studio.addFromDevice')}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const urls = [...e.target.files].map((f) => URL.createObjectURL(f));
                    setExtra((x) => [...x, ...urls]);
                    setSelected((s) => [...s, ...urls].slice(0, 4));
                  }}
                />
                ＋
              </label>
            </div>
          </div>

          {loaded.length > 0 && (
            <div className="field adjust">
              <span>{t('studio.adjust')}</span>
              <div className="adjust__row">
                <div className="adjust__thumbs">
                  {loaded.map((l, i) => (
                    <button key={l.src} className={`adjust__thumb ${i === active ? 'on' : ''}`} onClick={() => setActive(i)} aria-label={t('studio.editing', { n: i + 1 })}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <label className="adjust__zoom">
                  <span>🔍</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={activeSrc ? cropOf(activeSrc).z : 1}
                    onChange={(e) => activeSrc && setCrop(activeSrc, { z: Number(e.target.value) })}
                    aria-label={t('studio.zoom')}
                  />
                </label>
                <button className="btn btn--sm btn--ghost" onClick={() => activeSrc && setCrop(activeSrc, DEFAULT_CROP)}>
                  {t('studio.reset')}
                </button>
              </div>
              <small className="muted">{t('studio.adjustHint')}</small>
            </div>
          )}

          <div className="field">
            <span>{t('studio.template')}</span>
            <div className="tpl-grid">
              {TEMPLATES.map((x) => (
                <button key={x.id} className={`tpl ${tpl === x.id ? 'on' : ''}`} onClick={() => setTpl(x.id)}>
                  <span>{x.emoji}</span>
                  {t('tpl.' + x.id)}
                </button>
              ))}
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
          <label className="field">
            <span>{t('studio.caption')}</span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder={t('studio.captionPlaceholder')} />
          </label>
          {tainted && <p className="small warn">{t('studio.tainted')}</p>}
          <div className="grid-2">
            <button className="btn btn--primary" disabled={!loaded.length || tainted || !!busy} onClick={exportImage}>
              {t('studio.saveImage')}
            </button>
            <button className="btn btn--dark" disabled={!loaded.length || tainted || !!busy} onClick={exportVideo}>
              {busy || t('studio.makeVideo')}
            </button>
          </div>
          <p className="small muted">{t('studio.mobileHint')}</p>
        </div>
      </div>
    </Modal>
  );
}
