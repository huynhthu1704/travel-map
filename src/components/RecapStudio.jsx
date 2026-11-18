import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Modal, Loader } from './ui';
import { loadImage } from '../lib/image';
import { countryName, flagOf } from '../lib/countries';
import { pName, pCity } from '../lib/lang';
import { C, HEAD, BODY, font, ease, roundRect, drawCover, wrapText, pickMime } from './ShareStudio';

/* ------------------------------------------------------------------ */
/* Ảnh / video tổng kết: các nơi đã đi trong 1 năm hoặc 1 chuyến đi    */
/* ------------------------------------------------------------------ */

const FORMATS = [
  { id: 'story', w: 1080, h: 1920 },
  { id: 'portrait', w: 1080, h: 1350 },
  { id: 'square', w: 1080, h: 1080 },
];
const THEMES = {
  honey: { bg1: '#FFF4CC', bg2: '#FFD86B', card: '#FFFFFF', text: C.ink, sub: C.ink2, land: '#EFE7D6', landVisited: '#FFC629', stroke: '#D9CDB4', water: '#EAF4F8', dot: C.coral, accent: '#A87400' },
  night: { bg1: '#1F1A14', bg2: '#3A2E1C', card: '#2B241C', text: '#FFFFFF', sub: '#E9DFC9', land: '#4A4237', landVisited: '#FFC629', stroke: '#5E5446', water: '#221D17', dot: '#FF7A59', accent: '#FFC629' },
};

const mercY = (lat) => {
  const l = (Math.max(-80, Math.min(80, lat)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + l / 2));
};

/** Khung nhìn bản đồ bao quanh các địa điểm, giữ đúng tỉ lệ ô vẽ */
function viewFor(places, aspect) {
  if (!places.length) return { w: -170, e: 190, s: -55, n: 75 };
  let w = Math.min(...places.map((p) => p.lng));
  let e = Math.max(...places.map((p) => p.lng));
  let s = Math.min(...places.map((p) => p.lat));
  let n = Math.max(...places.map((p) => p.lat));
  const padX = Math.max((e - w) * 0.25, 4);
  const padY = Math.max((n - s) * 0.25, 3);
  w -= padX;
  e += padX;
  s -= padY;
  n += padY;
  // khớp tỉ lệ khung (theo Mercator)
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

/** Vẽ một khung hình tổng kết. time = Infinity → ảnh tĩnh đầy đủ */
function renderRecap(ctx, o, time = Infinity) {
  const { W, H, theme: T } = o;
  const k = W / 1080; // hệ số tỉ lệ
  const tall = H / W > 1.5;
  const sq = H / W < 1.1;
  const at = (t0, dur = 0.6) => ease((time - t0) / dur);

  // nền
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, T.bg1);
  g.addColorStop(1, T.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const m = 64 * k;
  let y = (tall ? 120 : 80) * k;

  // tiêu đề
  ctx.globalAlpha = at(0);
  ctx.textAlign = 'left';
  ctx.fillStyle = T.accent;
  ctx.font = font(BODY, 30 * k);
  ctx.fillText(o.eyebrow.toUpperCase(), m, y);
  y += 84 * k;
  ctx.fillStyle = T.text;
  ctx.font = font(HEAD, (sq ? 70 : 84) * k);
  wrapText(ctx, o.title, W - m * 2, 2).forEach((l, i) => ctx.fillText(l, m, y + i * 92 * k));
  y += (ctx.measureText(o.title).width > W - m * 2 ? 2 : 1) * 92 * k - 40 * k;
  ctx.globalAlpha = 1;

  // số liệu (đếm dần trong video)
  y += 36 * k;
  const statH = (sq ? 120 : 150) * k;
  const gap = 20 * k;
  const sw = (W - m * 2 - gap * 2) / 3;
  o.stats.forEach((st, i) => {
    const a = at(0.3 + i * 0.15);
    const x = m + i * (sw + gap);
    ctx.globalAlpha = a;
    ctx.fillStyle = T.card;
    roundRect(ctx, x, y, sw, statH, 28 * k);
    ctx.fill();
    ctx.fillStyle = T.text;
    ctx.font = font(HEAD, (sq ? 52 : 64) * k);
    const v = time === Infinity ? st.value : Math.round(st.value * ease((time - 0.4) / 1.6));
    ctx.fillText(`${st.icon} ${v}`, x + 24 * k, y + statH * 0.55);
    ctx.fillStyle = T.sub;
    ctx.font = font(BODY, 26 * k);
    ctx.fillText(st.label, x + 26 * k, y + statH * 0.85);
  });
  ctx.globalAlpha = 1;
  y += statH + 28 * k;

  // bản đồ
  const listRows = sq ? 2 : tall ? 4 : 3;
  const photosH = o.imgs.length ? (sq ? 0 : tall ? 300 : 230) * k : 0;
  const listH = (listRows * 56 + 20) * k;
  const bottom = H - 70 * k;
  const mapH = Math.max(220 * k, bottom - y - listH - (photosH ? photosH + 24 * k : 0) - 24 * k);
  const mapW = W - m * 2;
  ctx.save();
  roundRect(ctx, m, y, mapW, mapH, 36 * k);
  ctx.clip();
  if (o.map) ctx.drawImage(o.map.canvas, m, y, mapW, mapH);
  // điểm đã đến lần lượt hiện ra
  const per = Math.min(0.35, 3 / Math.max(o.places.length, 1));
  o.places.forEach((p, i) => {
    const a = at(1 + i * per, 0.4);
    if (a <= 0 || !o.map) return;
    const sx = mapW / o.map.canvas.width;
    const x = m + o.map.px(p.lng) * sx;
    const yy = y + o.map.py(p.lat) * (mapH / o.map.canvas.height);
    const r = 13 * k * (0.6 + 0.4 * a);
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, yy, r + 5 * k, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, yy, r, 0, Math.PI * 2);
    ctx.fillStyle = T.dot;
    ctx.fill();
  });
  ctx.restore();
  ctx.globalAlpha = 1;
  y += mapH + 24 * k;

  // ảnh kỉ niệm
  if (photosH) {
    const n = o.imgs.length;
    const pw = (W - m * 2 - gap * (n - 1)) / n;
    o.imgs.forEach((img, i) => {
      const a = at(1.6 + i * 0.25);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      drawCover(ctx, img, m + i * (pw + gap), y + (1 - a) * 30 * k, pw, photosH, 26 * k);
    });
    ctx.globalAlpha = 1;
    y += photosH + 24 * k;
  }

  // danh sách địa điểm (2 cột)
  const shown = o.places.slice(0, listRows * 2);
  const more = o.places.length - shown.length;
  const colW = (W - m * 2 - gap) / 2;
  ctx.font = font(BODY, 30 * k);
  shown.forEach((p, i) => {
    const a = at(2 + i * 0.12);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = m + col * (colW + gap);
    const yy = y + row * 56 * k + 34 * k;
    ctx.fillStyle = T.text;
    let label = `${flagOf(p.country)} ${pName(p)}`;
    while (ctx.measureText(label).width > colW && label.length > 4) label = label.slice(0, -2) + '…';
    ctx.fillText(label, x, yy);
  });
  if (more > 0) {
    ctx.globalAlpha = at(2.6);
    ctx.fillStyle = T.sub;
    ctx.font = font(BODY, 26 * k);
    ctx.textAlign = 'right';
    ctx.fillText(o.moreLabel(more), W - m, y + listRows * 56 * k + 30 * k);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.fillStyle = T.sub;
  ctx.font = font(BODY, 24 * k);
  ctx.fillText(o.watermark, W / 2, H - 28 * k);
  ctx.globalAlpha = 1;
}

/**
 * mode 'year': tổng kết các nơi đã đi trong 1 năm (người dùng chọn năm)
 * mode 'trip': tổng hợp 1 chuyến đi (truyền trip + stops)
 */
const NO_STOPS = [];

export default function RecapStudio({ mode = 'year', trip, stops = NO_STOPS, onClose }) {
  const { places, memories, countries, api, notify } = useApp();
  const { t, lang } = useI18n();
  const now = new Date().getFullYear();

  // --- dữ liệu theo năm ---
  const years = useMemo(() => {
    const ys = new Set([now]);
    places.forEach((p) => p.status === 'visited' && p.visitedAt && ys.add(Number(p.visitedAt.slice(0, 4))));
    memories.forEach((m) => m.date && ys.add(Number(String(m.date).slice(0, 4))));
    return [...ys].filter(Boolean).sort((a, b) => b - a);
  }, [places, memories, now]);
  const [year, setYear] = useState(() => years[0] || now);

  const data = useMemo(() => {
    if (mode === 'trip') {
      const map = new Map();
      stops.forEach((s) => s.place && !map.has(s.place.id) && map.set(s.place.id, s.place));
      const photoSrc = stops.flatMap((s) => (s.photos || []).map((url) => ({ url, memoryId: s.memoryId }))).slice(0, 4);
      return { places: [...map.values()], photoSrc, memIds: [...new Set(stops.map((s) => s.memoryId).filter(Boolean))] };
    }
    const map = new Map();
    const inYear = (d) => d && String(d).slice(0, 4) === String(year);
    places.forEach((p) => p.status === 'visited' && inYear(p.visitedAt) && map.set(p.id, p));
    const mems = memories.filter((m) => inYear(m.date)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    mems.forEach((m) => m.place && !map.has(m.place.id) && map.set(m.place.id, m.place));
    const sorted = [...map.values()].sort((a, b) => String(a.visitedAt || '').localeCompare(String(b.visitedAt || '')));
    return { places: sorted, photoSrc: mems.flatMap((m) => (m.photos || []).slice(0, 1).map((url) => ({ url, mem: m }))).slice(0, 4) };
  }, [mode, stops, places, memories, year]);

  const [fmt, setFmt] = useState('story');
  const [theme, setTheme] = useState('honey');
  const [imgs, setImgs] = useState([]);
  const [busy, setBusy] = useState('');
  const canvasRef = useRef();
  const F = FORMATS.find((f) => f.id === fmt);

  // Ảnh: dùng ảnh độ phân giải đầy đủ nếu có
  useEffect(() => {
    let alive = true;
    (async () => {
      const urls = await Promise.all(
        data.photoSrc.map(async (ph) => {
          try {
            const full = await api.getFullPhotos(ph.mem || { id: ph.memoryId, memoryId: ph.memoryId, photos: [ph.url] });
            return full?.[0] || ph.url;
          } catch {
            return ph.url;
          }
        }),
      );
      const list = await Promise.all(urls.map((u) => loadImage(u).catch(() => null)));
      if (alive) setImgs(list.filter(Boolean));
    })();
    return () => {
      alive = false;
    };
  }, [data, api]);

  const stats = useMemo(() => {
    const cc = new Set(data.places.map((p) => p.country).filter(Boolean));
    const cities = new Set(data.places.map((p) => pCity(p)).filter(Boolean));
    return [
      { icon: '📍', value: data.places.length, label: t('recap.places') },
      { icon: '🌏', value: cc.size, label: t('recap.countries') },
      { icon: '🏙️', value: cities.size, label: t('recap.cities') },
    ];
  }, [data, t, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const opts = useMemo(() => {
    const T = THEMES[theme];
    const k = F.w / 1080;
    const m = 64 * k;
    const mapW = Math.round(F.w - m * 2);
    const mapH = Math.round(F.h * (F.h / F.w > 1.5 ? 0.36 : 0.32));
    const visited = new Set(data.places.map((p) => p.country));
    const view = viewFor(data.places, mapW / mapH);
    const map = countries ? drawMapLayer(countries.features, visited, view, mapW, mapH, T) : null;
    return {
      W: F.w, H: F.h, theme: T, map, imgs, places: data.places, stats,
      eyebrow: mode === 'trip' ? `${trip?.emoji || '🧳'} ${t('recap.tripEyebrow')}` : t('recap.yearEyebrow'),
      title: mode === 'trip' ? trip?.name || '' : t('recap.yearTitle', { year }),
      moreLabel: (n) => t('recap.more', { n }),
      watermark: t('canvas.watermark'),
    };
  }, [theme, F, data, imgs, stats, countries, mode, trip, year, t]);

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
        await navigator.share({ files: [file], title: opts.title, text: `${opts.title} #bandodulich` });
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

  const exportImage = () => canvasRef.current.toBlob((b) => b && deliver(b, `travel-map-recap-${Date.now()}.png`), 'image/png');

  const exportVideo = async () => {
    const mime = pickMime();
    if (!mime) return notify(t('studio.noVideo'), 'error');
    setBusy(t('studio.making'));
    const c = document.createElement('canvas');
    c.width = F.w;
    c.height = F.h;
    const ctx = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    const duration = 1 + Math.min(3, data.places.length * 0.35) + 3.5;
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
    deliver(new Blob(chunks, { type: mime.split(';')[0] }), `travel-map-recap-${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
  };

  return (
    <Modal title={mode === 'trip' ? t('recap.tripModal') : t('recap.yearModal')} onClose={onClose} wide className="modal--studio">
      <div className="studio">
        <div className="studio__preview">{countries ? <canvas ref={canvasRef} /> : <Loader size="md" />}</div>
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
          {data.places.length === 0 ? (
            <p className="warn small">{mode === 'trip' ? t('recap.emptyTrip') : t('recap.emptyYear', { year })}</p>
          ) : (
            <div className="recap-list">
              {data.places.slice(0, 30).map((p) => (
                <span key={p.id} className="chip chip--sm">
                  {flagOf(p.country)} {pName(p)}
                </span>
              ))}
              {data.places.length > 30 && <span className="small muted">{t('recap.more', { n: data.places.length - 30 })}</span>}
            </div>
          )}
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
          ) : (
            <div className="grid-2">
              <button className="btn btn--primary" disabled={!countries} onClick={exportImage}>
                {t('studio.saveImage')}
              </button>
              <button className="btn btn--dark" disabled={!countries} onClick={exportVideo}>
                {t('studio.makeVideo')}
              </button>
            </div>
          )}
          <p className="small muted">{t('studio.mobileHint')}</p>
        </div>
      </div>
    </Modal>
  );
}
