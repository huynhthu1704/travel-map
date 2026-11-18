import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { Modal } from './ui';
import { loadImage } from '../lib/image';
import { countryName, flagOf } from '../lib/countries';
import { formatDate } from './ui';

/* --------------------------------------------------------------- */
/* Studio tạo ảnh / video chia sẻ mạng xã hội từ 1–4 tấm ảnh        */
/* --------------------------------------------------------------- */

const TEMPLATES = [
  { id: 'polaroid', name: 'Polaroid', emoji: '📸' },
  { id: 'postcard', name: 'Bưu thiếp', emoji: '💌' },
  { id: 'film', name: 'Cuộn phim', emoji: '🎞️' },
  { id: 'bento', name: 'Bento', emoji: '🍱' },
];
const FORMATS = [
  { id: 'story', name: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'portrait', name: 'Post 4:5', w: 1080, h: 1350 },
  { id: 'square', name: 'Vuông 1:1', w: 1080, h: 1080 },
];

const C = {
  honey: '#FFC629', honey2: '#F5B000', honeySoft: '#FFF0C2', cream: '#FFFCF5', ink: '#1F1A14', ink2: '#4A4237', coral: '#FF7A59', white: '#FFFFFF',
};
const HEAD = '700 {s}px Lexend, "Be Vietnam Pro", sans-serif';
const BODY = '500 {s}px "Be Vietnam Pro", sans-serif';
const font = (tpl, s) => tpl.replace('{s}', Math.round(s));
const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}

function drawCover(ctx, img, x, y, w, h, r = 0, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
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

function wrapText(ctx, text, maxW, maxLines = 2) {
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
function render(ctx, { tpl, W, H, imgs, title, sub, caption, date, flag }, time = Infinity) {
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
    ctx.font = font(HEAD, 78);
    ctx.textAlign = 'center';
    ctx.fillText(`${title}`, W / 2, 150, W - 120);
    ctx.font = font(BODY, 36);
    ctx.fillStyle = C.ink2;
    ctx.fillText(`${flag} ${sub}${date ? ' · ' + date : ''}`, W / 2, 210, W - 120);
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
      drawCover(ctx, imgs[i], -fw / 2 + pad, -fh / 2 + pad, fw - pad * 2, fh - pad * 2 - 70, 4, zoomAt(i));
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
    ctx.font = '72px serif';
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
      drawCover(ctx, imgs[i], x, y + (1 - a) * 40, w, h, 28, zoomAt(i));
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = C.ink2;
    ctx.font = font(BODY, 38);
    ctx.textAlign = 'left';
    const cy = H - m - 150;
    if (caption) wrapText(ctx, caption, W - m * 2 - 140).forEach((l, i) => ctx.fillText(l, m + 70, cy + i * 50));
    ctx.font = font(BODY, 30);
    ctx.fillStyle = C.honey2;
    ctx.fillText(`📍 ${sub}${date ? '  ·  ' + date : ''}`, m + 70, H - m - 52);
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
      drawCover(ctx, img, sx, top + i * (fh + 30), sw, fh, 6, zoomAt(i));
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.honey;
      ctx.font = font(BODY, 22);
      ctx.textAlign = 'left';
      ctx.fillText(`${String(i + 1).padStart(2, '0')}A  ▸  ${title.toUpperCase()}`, sx, top + i * (fh + 30) + fh + 24);
    });
    ctx.globalAlpha = titleA;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.honey;
    ctx.font = font(HEAD, 72);
    ctx.fillText(title, W / 2, 130, W - 120);
    ctx.fillStyle = C.honeySoft;
    ctx.font = font(BODY, 32);
    ctx.fillText(`${flag} ${sub}${date ? ' · ' + date : ''}`, W / 2, 185, W - 120);
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
    ctx.font = font(HEAD, 72);
    ctx.fillText(title, m + 50, m + 115, W - m * 2 - 220);
    ctx.font = font(BODY, 32);
    ctx.fillText(`${sub}${date ? ' · ' + date : ''}`, m + 50, m + 170, W - m * 2 - 220);
    ctx.font = '110px serif';
    ctx.textAlign = 'right';
    ctx.fillText(flag, W - m - 40, m + 160);
    ctx.globalAlpha = 1;
    const top = m + 220 + 24;
    const bottom = H - m - (caption ? 190 : 80);
    gridSlots(n, m, top, W - m * 2, bottom - top, 24).forEach(([x, y, w, h], i) => {
      const a = appear(i);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, imgs[i], x, y, w, h, 44, zoomAt(i) * (0.94 + 0.06 * a));
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
  ctx.fillText('🍯 Bản đồ du lịch', W / 2, H - (tpl === 'postcard' ? 18 : tpl === 'bento' ? 22 : 40));
  ctx.globalAlpha = 1;
}

function pickMime() {
  const list = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return list.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
}

export default function ShareStudio({ memory, onClose }) {
  const { notify, api } = useApp();
  const [extra, setExtra] = useState([]); // ảnh thêm từ thiết bị
  const [base, setBase] = useState(memory.fullPhotos || memory.photos || []);
  const sources = useMemo(() => [...base, ...extra], [base, extra]);
  const [selected, setSelected] = useState(() => base.slice(0, 4));
  // Tải ảnh độ phân giải đầy đủ (ảnh trong danh sách chỉ là ảnh thu nhỏ)
  useEffect(() => {
    if (memory.fullPhotos) return;
    api.getFullPhotos(memory).then((full) => {
      if (!full?.length) return;
      setBase(full);
      setSelected((sel) => sel.map((s) => full[(memory.photos || []).indexOf(s)] || s));
    });
  }, [memory, api]);
  const [tpl, setTpl] = useState('polaroid');
  const [fmt, setFmt] = useState('story');
  const [caption, setCaption] = useState(memory.caption || '');
  const [imgs, setImgs] = useState([]);
  const [busy, setBusy] = useState('');
  const [tainted, setTainted] = useState(false);
  const canvasRef = useRef();
  const F = FORMATS.find((f) => f.id === fmt);

  useEffect(() => {
    let alive = true;
    Promise.all(selected.map((s) => loadImage(s).catch(() => null))).then((list) => alive && setImgs(list.filter(Boolean)));
    return () => {
      alive = false;
    };
  }, [selected]);

  const opts = useMemo(
    () => ({
      tpl, W: F.w, H: F.h, imgs, title: memory.place?.name || 'Chuyến đi', caption,
      sub: [memory.place?.city, countryName(memory.place?.country)].filter(Boolean).join(', '),
      date: formatDate(memory.date || memory.createdAt), flag: flagOf(memory.place?.country),
    }),
    [tpl, F, imgs, caption, memory],
  );

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !imgs.length) return;
    c.width = F.w;
    c.height = F.h;
    document.fonts?.ready.then(() => render(c.getContext('2d'), opts));
    render(c.getContext('2d'), opts);
    try {
      c.getContext('2d').getImageData(0, 0, 1, 1);
      setTainted(false);
    } catch {
      setTainted(true);
    }
  }, [opts, imgs, F]);

  const toggle = (src) =>
    setSelected((s) => (s.includes(src) ? s.filter((x) => x !== src) : s.length >= 4 ? s : [...s, src]));

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
    notify('Đã tải về máy — đăng lên Instagram / TikTok / Facebook thôi! ✨');
  };

  const exportImage = () => {
    canvasRef.current.toBlob((b) => b && deliver(b, `ban-do-du-lich-${Date.now()}.png`), 'image/png');
  };

  const exportVideo = async () => {
    const mime = pickMime();
    if (!mime) return notify('Trình duyệt chưa hỗ trợ quay video, hãy xuất ảnh nhé', 'error');
    setBusy('Đang tạo video…');
    const c = document.createElement('canvas');
    c.width = F.w;
    c.height = F.h;
    const ctx = c.getContext('2d');
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    const duration = 1.5 + imgs.length * 0.9 + 2.5;
    rec.start();
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        render(ctx, opts, t);
        if (t < duration) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    rec.stop();
    await done;
    setBusy('');
    const blob = new Blob(chunks, { type: mime.split(';')[0] });
    deliver(blob, `ban-do-du-lich-${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
  };

  return (
    <Modal title="✨ Tạo ảnh chia sẻ" onClose={onClose} wide className="modal--studio">
      <div className="studio">
        <div className="studio__preview">
          {imgs.length ? <canvas ref={canvasRef} /> : <div className="studio__empty">Chọn 1–4 ảnh để bắt đầu</div>}
        </div>
        <div className="studio__controls stack">
          <div className="field">
            <span>Chọn ảnh ({selected.length}/4)</span>
            <div className="studio__photos">
              {sources.map((s) => (
                <button key={s} className={`studio__ph ${selected.includes(s) ? 'on' : ''}`} onClick={() => toggle(s)}>
                  <img src={s} alt="" />
                  {selected.includes(s) && <span>{selected.indexOf(s) + 1}</span>}
                </button>
              ))}
              <label className="studio__ph studio__ph--add" title="Thêm ảnh từ máy">
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
          <div className="field">
            <span>Mẫu</span>
            <div className="tpl-grid">
              {TEMPLATES.map((t) => (
                <button key={t.id} className={`tpl ${tpl === t.id ? 'on' : ''}`} onClick={() => setTpl(t.id)}>
                  <span>{t.emoji}</span>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Khung hình</span>
            <div className="segmented">
              {FORMATS.map((f) => (
                <button key={f.id} className={fmt === f.id ? 'on' : ''} onClick={() => setFmt(f.id)}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Chú thích</span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Một câu thật cute…" />
          </label>
          {tainted && (
            <p className="small warn">
              Không đọc được ảnh này để xuất. Hãy bấm ＋ để chọn ảnh từ máy.
            </p>
          )}
          <div className="grid-2">
            <button className="btn btn--primary" disabled={!imgs.length || tainted || !!busy} onClick={exportImage}>
              🖼️ Lưu / chia sẻ ảnh
            </button>
            <button className="btn btn--dark" disabled={!imgs.length || tainted || !!busy} onClick={exportVideo}>
              {busy || '🎬 Tạo video'}
            </button>
          </div>
          <p className="small muted">Trên điện thoại sẽ mở bảng chia sẻ để đăng thẳng lên Instagram, TikTok, Facebook, Zalo…</p>
        </div>
      </div>
    </Modal>
  );
}
