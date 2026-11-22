// Xuất lịch trình chuyến đi ra file PDF (tạo ngay trên trình duyệt, theo dữ liệu mới nhất).
// Dùng font Be Vietnam Pro để hiển thị đúng tiếng Việt; mỗi địa điểm có link mở Google Maps.
import { destinationQuery } from './geo';
import { countryName } from './countries';
import { pName, pCity, getLocale } from './lang';
import { translate as t } from '../i18n';
import { perPersonOf, groupTotalOf, settle, makeToBase, actualAmountOf, participantsOf, decimalsOf } from './money';
import { buildCostTable, orderRowsByIds } from './costCompare';

const BASE = import.meta.env.BASE_URL || './';
/** Nạp thư viện PDF; nếu trang đang chạy bản cũ (file đã đổi tên sau khi cập nhật) → đánh dấu để tải lại trang */
export function loadJsPdf() {
  return import('jspdf').catch((e) => {
    const err = new Error(e?.message || 'stale');
    err.stale = true;
    throw err;
  });
}

// Logo (favicon) → ảnh PNG để chèn vào PDF
let logoCache;
async function loadLogo() {
  if (logoCache !== undefined) return logoCache;
  try {
    const img = new Image();
    img.src = `${BASE}favicon.svg`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    c.getContext('2d').drawImage(img, 0, 0, 128, 128);
    logoCache = c.toDataURL('image/png');
  } catch {
    logoCache = null;
  }
  return logoCache;
}

let fontCache = null;
async function loadFonts() {
  if (fontCache) return fontCache;
  const get = async (f) => {
    const buf = await fetch(`${BASE}fonts/${f}`).then((r) => {
      if (!r.ok) throw new Error('font');
      return r.arrayBuffer();
    });
    let bin = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  fontCache = { regular: await get('BeVietnamPro-Regular.ttf'), bold: await get('BeVietnamPro-Bold.ttf') };
  return fontCache;
}

// Bỏ emoji (font PDF không có) nhưng giữ chữ có dấu
const plain = (s = '') => String(s).replace(/\p{Extended_Pictographic}|\p{Regional_Indicator}|️|‍/gu, '').replace(/\s+/g, ' ').trim();
const fmtDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const wd = d.toLocaleDateString(getLocale(), { weekday: 'long' });
  const dm = d.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${dm}`;
};
const shortDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const mapsLink = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationQuery(p))}`;
const fileSafe = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'trip';

/** items: kế hoạch đã sắp theo ngày + thứ tự (giống trên web) */
export async function exportPlanPdf(trip, items) {
  const [{ jsPDF }, fonts] = await Promise.all([loadJsPdf(), loadFonts()]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS('BVP-R.ttf', fonts.regular);
  doc.addFont('BVP-R.ttf', 'BVP', 'normal');
  doc.addFileToVFS('BVP-B.ttf', fonts.bold);
  doc.addFont('BVP-B.ttf', 'BVP', 'bold');

  const W = 210;
  const H = 297;
  const M = 16; // lề
  const CW = W - M * 2;
  const HONEY = [255, 198, 41];
  const HONEY_SOFT = [255, 245, 214];
  const INK = [33, 27, 20];
  const MUTED = [120, 110, 98];
  const LINK = [26, 115, 232];
  let y = M;

  const font = (style = 'normal', size = 10, color = INK) => {
    doc.setFont('BVP', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const ensure = (h) => {
    if (y + h > H - 18) {
      doc.addPage();
      y = M;
    }
  };

  // ---- Thanh thương hiệu: logo + "Bee There" bên trái, nút "Mở & sửa trên web" bên phải ----
  const tripUrl = `${location.origin}${location.pathname}#/trips/${encodeURIComponent(trip.id)}`;
  const logo = await loadLogo();
  if (logo) doc.addImage(logo, 'PNG', M, y - 1, 7, 7);
  else {
    doc.setFillColor(...HONEY);
    doc.roundedRect(M, y - 1, 7, 7, 2, 2, 'F');
  }
  font('bold', 11.5, INK);
  doc.text('bee', M + 9.5, y + 4.2);
  const tw = doc.getTextWidth('bee');
  doc.setTextColor(168, 116, 0);
  doc.text('.', M + 9.5 + tw, y + 4.2);
  const tw2 = tw + doc.getTextWidth('.');
  doc.setTextColor(...INK);
  doc.text('there', M + 9.5 + tw2, y + 4.2);
  // nút liên kết
  font('bold', 8.5, INK);
  const btnLabel = plain(t('pdf.editOnWebBtn'));
  const bw = doc.getTextWidth(btnLabel) + 10;
  const bx = M + CW - bw;
  doc.setFillColor(...HONEY);
  doc.roundedRect(bx, y - 1, bw, 7, 3.5, 3.5, 'F');
  doc.textWithLink(btnLabel, bx + 5, y + 3.7, { url: tripUrl });
  doc.link(bx, y - 1, bw, 7, { url: tripUrl });
  y += 9;
  doc.setDrawColor(235, 228, 216);
  doc.line(M, y, M + CW, y);
  y += 9;

  // ---- Tiêu đề chuyến đi + 2 dòng thông tin ----
  font('bold', 18, INK);
  const title = doc.splitTextToSize(plain(trip.name) || t('plan.title'), CW);
  doc.text(title[0], M, y);
  y += 6;
  font('normal', 9, MUTED);
  const dateRange = trip.startDate
    ? `${shortDate(trip.startDate)}${trip.endDate && trip.endDate !== trip.startDate ? ` – ${shortDate(trip.endDate)}` : ''}`
    : '';
  const dests = (trip.destinations || []).filter((d) => d.cc).map((d) => [...new Set([d.city, countryName(d.cc)].filter(Boolean))].join(', '));
  const members = Object.values(trip.members || {}).map((m) => m.name).filter(Boolean);
  const line1 = [dateRange, dests.join(' · '), members.length ? `${t('trip.members')}: ${members.join(', ')}` : ''].filter(Boolean).join('   |   ');
  const done = items.filter((i) => i.done).length;
  const line2 = `${t('pdf.summary', { n: items.length, done })} · ${t('pdf.exportedAt', { date: new Date().toLocaleString(getLocale()) })}`;
  const l1 = doc.splitTextToSize(plain(line1), CW).slice(0, 2);
  doc.text(l1, M, y);
  y += l1.length * 3.8 + 0.5;
  doc.text(plain(line2), M, y);
  y += 8;

  if (!items.length) {
    font('normal', 11, MUTED);
    doc.text(plain(t('plan.empty')), M, y + 4);
  }

  // ---- Bảng: # | Giờ | Địa điểm | Ghi chú | Bản đồ ----
  const COL = { n: M, time: M + 8, place: M + 22, note: M + 92, map: M + CW - 17 };
  const PLACE_W = COL.note - COL.place - 3;
  const NOTE_W = COL.map - COL.note - 3;
  const tableHead = () => {
    font('bold', 7.5, MUTED);
    doc.text('#', COL.n + 2.5, y, { align: 'center' });
    doc.text(plain(t('plan.time')).toUpperCase(), COL.time, y);
    doc.text(plain(t('pdf.place')).toUpperCase(), COL.place, y);
    doc.text(plain(t('plan.note')).toUpperCase(), COL.note, y);
    doc.text(plain(t('pdf.map')).toUpperCase(), COL.map, y);
    y += 2;
    doc.setDrawColor(...HONEY);
    doc.setLineWidth(0.4);
    doc.line(M, y, M + CW, y);
    doc.setLineWidth(0.2);
    y += 4.2;
  };
  const newPage = () => {
    doc.addPage();
    y = M;
    tableHead();
  };
  if (items.length) tableHead();

  let n = 0;
  const groups = [];
  items.forEach((i) => {
    const k = i.date || '';
    if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, list: [] });
    groups[groups.length - 1].list.push(i);
  });
  for (const g of groups) {
    if (y + 14 > H - 16) newPage();
    // dòng tiêu đề ngày (mảnh)
    doc.setFillColor(...HONEY_SOFT);
    doc.rect(M, y - 3.6, CW, 5.6, 'F');
    font('bold', 9.5);
    let head = g.k ? fmtDate(g.k) : t('plan.noDate');
    if (g.k && trip.startDate && g.k >= trip.startDate) {
      const day = Math.round((new Date(g.k) - new Date(trip.startDate)) / 864e5) + 1;
      head = `${t('plan.dayN', { n: day })} · ${head}`;
    }
    doc.text(plain(head), M + 2, y);
    y += 5.6;

    for (const it of g.list) {
      n += 1;
      const p = it.place || {};
      font('bold', 9.5);
      const nameLines = doc.splitTextToSize(plain(pName(p)) || '—', PLACE_W);
      font('normal', 8, MUTED);
      const loc = [...new Set([pCity(p), countryName(p.country)].filter(Boolean))].join(', ');
      const status = it.done ? ` · ${t('pdf.visited')}` : it.skipped ? ` · ${t('plan.statusSkip')}` : '';
      const locLines = doc.splitTextToSize(plain(loc + status), PLACE_W);
      font('normal', 8.5);
      const noteLines = it.note ? doc.splitTextToSize(plain(it.note), NOTE_W) : [];
      const rowH = Math.max(nameLines.length * 4 + locLines.length * 3.4, noteLines.length * 3.7, 4) + 2.6;
      if (y + rowH > H - 16) newPage();
      const top = y;
      // số thứ tự / dấu đã đi
      doc.setFillColor(...(it.done ? [76, 175, 80] : HONEY));
      doc.circle(COL.n + 2.5, top - 1.2, 2.5, 'F');
      if (it.done) {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.lines([[0.9, 1], [1.8, -2]], COL.n + 1.3, top - 1.3);
        doc.setLineWidth(0.2);
      } else {
        font('bold', 7, INK);
        doc.text(String(n), COL.n + 2.5, top - 0.2, { align: 'center' });
      }
      // giờ
      if (it.time) {
        font('bold', 9, INK);
        doc.text(it.time, COL.time, top);
      }
      // địa điểm
      font('bold', 9.5, INK);
      doc.text(nameLines, COL.place, top);
      font('normal', 8, MUTED);
      doc.text(locLines, COL.place, top + nameLines.length * 4);
      // ghi chú
      if (noteLines.length) {
        font('normal', 8.5, INK);
        doc.text(noteLines, COL.note, top);
      }
      // link Google Maps
      font('normal', 8.5, LINK);
      doc.textWithLink(plain(t('pdf.openMapsShort')), COL.map, top, { url: mapsLink(p) });
      y = top + rowH;
      doc.setDrawColor(235, 228, 216);
      doc.line(M, y - 3, M + CW, y - 3);
      y += 1;
    }
    y += 2;
  }

  // ---- Chân trang ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // Chỉ giữ số trang (dòng tên web / chuyến đi / link ở chân trang đã bỏ theo yêu cầu)
    font('normal', 8.5, MUTED);
    doc.text(`${i}/${pages}`, W - M, H - 9, { align: 'right' });
  }

  const name = `${fileSafe(trip.name)}-${t('pdf.fileSuffix')}.pdf`;
  const blob = doc.output('blob');
  return { blob, name };
}

/** Chia sẻ file (điện thoại hỗ trợ) hoặc tải về */
export async function shareOrDownload({ blob, name }, { preferShare = false } = {}) {
  const file = new File([blob], name, { type: 'application/pdf' });
  if (preferShare && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

/* ------------------------------------------------------------------ */
/* Xuất chi phí chuyến đi ra PDF (dự kiến, thực tế, chia tiền)         */
/* ------------------------------------------------------------------ */

/** Tiền trong PDF: số + mã tiền tệ (font PDF không có đủ ký hiệu như ฿ ₩) */
const pdfMoney = (n, cur = 'VND') => {
  const d = decimalsOf(cur);
  const v = (Number(n) || 0).toLocaleString(getLocale(), { minimumFractionDigits: 0, maximumFractionDigits: d });
  return `${v} ${cur}`;
};

/**
 * costs: toàn bộ khoản chi mới nhất của chuyến; plan: kế hoạch (tên địa điểm gắn với khoản chi)
 * opts.order: id các dòng theo đúng thứ tự đang hiện trên màn hình (REQ-009)
 */
export async function exportCostsPdf(trip, costs, plan = [], opts = {}) {
  const [{ jsPDF }, fonts] = await Promise.all([loadJsPdf(), loadFonts()]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS('BVP-R.ttf', fonts.regular);
  doc.addFont('BVP-R.ttf', 'BVP', 'normal');
  doc.addFileToVFS('BVP-B.ttf', fonts.bold);
  doc.addFont('BVP-B.ttf', 'BVP', 'bold');

  const W = 210;
  const H = 297;
  const M = 16;
  const CW = W - M * 2;
  const HONEY = [255, 198, 41];
  const HONEY_SOFT = [255, 245, 214];
  const INK = [33, 27, 20];
  const MUTED = [120, 110, 98];
  const LINE = [235, 228, 216];
  const POS = [46, 125, 50];
  const NEG = [198, 40, 40];
  let y = M;
  const font = (style = 'normal', size = 10, color = INK) => {
    doc.setFont('BVP', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // ---- Dữ liệu (giống trang Chi phí trên web) ----
  const cur = trip.currency || 'VND';
  const rates = trip.rates || {};
  const conv = makeToBase(cur, rates);
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const nameOf = (id, fb) => trip.members?.[id]?.name || fb || '—';
  const placeOf = (c) => plan.find((p) => p.id === c.planItemId)?.place;
  const actuals = costs.filter((c) => c.type === 'actual');
  const payments = costs.filter((c) => c.type === 'payment');
  const base = (c, v) => conv(v, c.currency || cur) ?? 0;
  // REQ-009: 1 bảng giống trên web, đúng thứ tự đang hiện trên màn hình
  const table = buildCostTable(costs, { estTotal: (c) => groupTotalOf(c, n, conv), actTotal: (c) => base(c, actualAmountOf(c, memberIds)) });
  const rowsInOrder = orderRowsByIds(table.rows, opts.order);
  const tot = table.totals;
  const estGroup = tot.planned;
  const estPerPerson = estGroup / n;
  const { balances, transfers } = settle(costs, memberIds, cur, conv);
  /** Số tiền gốc, kèm "≈ quy đổi" nếu là ngoại tệ */
  const amountLines = (c, v) => {
    const c0 = c.currency || cur;
    const out = [pdfMoney(v, c0)];
    if (c0 !== cur) {
      const b = conv(v, c0);
      out.push(b == null ? `(${plain(t('fx.needRate'))})` : `≈ ${pdfMoney(b, cur)}`);
    }
    return out;
  };

  // ---- Thanh thương hiệu ----
  const tripUrl = `${location.origin}${location.pathname}#/trips/${encodeURIComponent(trip.id)}`;
  const logo = await loadLogo();
  if (logo) doc.addImage(logo, 'PNG', M, y - 1, 7, 7);
  font('bold', 11.5, INK);
  doc.text('bee', M + 9.5, y + 4.2);
  const tw = doc.getTextWidth('bee');
  doc.setTextColor(168, 116, 0);
  doc.text('.', M + 9.5 + tw, y + 4.2);
  doc.setTextColor(...INK);
  doc.text('there', M + 9.5 + tw + doc.getTextWidth('.'), y + 4.2);
  font('bold', 8.5, INK);
  const btnLabel = plain(t('pdf.editOnWebBtn'));
  const bw = doc.getTextWidth(btnLabel) + 10;
  const bx = M + CW - bw;
  doc.setFillColor(...HONEY);
  doc.roundedRect(bx, y - 1, bw, 7, 3.5, 3.5, 'F');
  doc.textWithLink(btnLabel, bx + 5, y + 3.7, { url: tripUrl });
  doc.link(bx, y - 1, bw, 7, { url: tripUrl });
  y += 9;
  doc.setDrawColor(...LINE);
  doc.line(M, y, M + CW, y);
  y += 9;

  // ---- Tiêu đề ----
  font('bold', 8.5, [168, 116, 0]);
  doc.text(plain(t('pdf.costsTitle')).toUpperCase(), M, y - 5);
  font('bold', 18, INK);
  doc.text(doc.splitTextToSize(plain(trip.name) || '—', CW)[0], M, y + 1);
  y += 7;
  font('normal', 9, MUTED);
  const dateRange = trip.startDate ? `${shortDate(trip.startDate)}${trip.endDate && trip.endDate !== trip.startDate ? ` – ${shortDate(trip.endDate)}` : ''}` : '';
  const dests = (trip.destinations || []).filter((d) => d.cc).map((d) => [...new Set([d.city, countryName(d.cc)].filter(Boolean))].join(', '));
  const members = memberIds.map((id) => nameOf(id)).filter((x) => x !== '—');
  const line1 = [dateRange, dests.join(' · '), members.length ? `${t('trip.members')}: ${members.join(', ')}` : ''].filter(Boolean).join('   |   ');
  const l1 = doc.splitTextToSize(plain(line1), CW).slice(0, 2);
  doc.text(l1, M, y);
  y += l1.length * 3.8 + 0.5;
  const rateTxt = Object.entries(rates)
    .filter(([c, r]) => c !== cur && r)
    .map(([c, r]) => `1 ${c} = ${pdfMoney(r, cur)}`)
    .join(' · ');
  const line2 = [t('pdf.baseCur', { cur }), rateTxt && `${t('pdf.rates')}: ${rateTxt}`, t('pdf.exportedAt', { date: new Date().toLocaleString(getLocale()) })].filter(Boolean).join(' · ');
  const l2 = doc.splitTextToSize(plain(line2), CW).slice(0, 2);
  doc.text(l2, M, y);
  y += l2.length * 3.8 + 5;

  // ---- 4 ô tổng quan ----
  // REQ-010: chênh lệch chỉ tính trên các khoản đã chi + phát sinh
  const sd = tot.spentDiff;
  const stats = [
    [t('sum.planned', { n }), pdfMoney(estGroup, cur), INK, t('sum.perPerson', { v: pdfMoney(estPerPerson, cur) })],
    [t('cost.actualTotal'), pdfMoney(tot.actual, cur), INK, tot.extra > 0 ? t('sum.inclExtra', { v: pdfMoney(tot.extra, cur) }) : ''],
    [t('sum.diff'), tot.actual > 0 ? `${sd > 0.5 ? '+' : sd < -0.5 ? '−' : ''}${pdfMoney(Math.abs(sd), cur)}` : '—', sd > 0.5 ? NEG : sd < -0.5 ? POS : INK, tot.actual > 0 ? t('sum.diffHint', { v: pdfMoney(tot.spentPlanned, cur) }) : ''],
    [t('sum.pending'), pdfMoney(tot.pending, cur), INK, t('sum.pendingHint')],
  ];
  const gap = 3;
  const bwid = (CW - gap * 3) / 4;
  stats.forEach(([label, val, color, sub], i) => {
    const x = M + i * (bwid + gap);
    doc.setFillColor(...HONEY_SOFT);
    doc.roundedRect(x, y, bwid, 24, 2.5, 2.5, 'F');
    font('normal', 7.2, MUTED);
    doc.text(doc.splitTextToSize(plain(label), bwid - 6).slice(0, 2), x + 3, y + 5);
    font('bold', 10.5, color);
    doc.text(doc.splitTextToSize(val, bwid - 6)[0], x + 3, y + 14.5);
    if (sub) {
      font('normal', 6.6, MUTED);
      doc.text(doc.splitTextToSize(plain(sub), bwid - 6).slice(0, 2), x + 3, y + 18.8);
    }
  });
  y += 32;

  // ---- Bảng chung ----
  const ensure = (h, onNew) => {
    if (y + h > H - 16) {
      doc.addPage();
      y = M;
      onNew?.();
    }
  };
  const section = (title) => {
    ensure(22);
    font('bold', 12.5, INK);
    doc.text(plain(title), M, y);
    y += 6;
  };
  /** cols: [{label, x, w, align}] */
  const head = (cols) => {
    font('bold', 7.2, MUTED);
    cols.forEach((c) => doc.text(plain(c.label).toUpperCase(), c.align === 'right' ? c.x + c.w : c.x, y, { align: c.align || 'left' }));
    y += 2;
    doc.setDrawColor(...HONEY);
    doc.setLineWidth(0.4);
    doc.line(M, y, M + CW, y);
    doc.setLineWidth(0.2);
    y += 4.4;
  };
  /** cells: [{lines:[...], style, color, size, sub:[...] }] cùng thứ tự với cols */
  const row = (cols, cells, { fill } = {}) => {
    const prepared = cells.map((cell, i) => {
      font(cell.style || 'normal', cell.size || 8.8);
      const main = cell.lines.flatMap((l) => doc.splitTextToSize(plain(l), cols[i].w));
      font('normal', 7.6);
      const sub = (cell.sub || []).filter(Boolean).flatMap((l) => doc.splitTextToSize(plain(l), cols[i].w));
      return { ...cell, main, sub };
    });
    const h = Math.max(...prepared.map((c) => c.main.length * 3.9 + c.sub.length * 3.3), 4) + 2.6;
    ensure(h, () => head(cols));
    const top = y;
    if (fill) {
      doc.setFillColor(...fill);
      doc.rect(M, top - 3.8, CW, h, 'F');
    }
    prepared.forEach((c, i) => {
      const col = cols[i];
      const x = col.align === 'right' ? col.x + col.w : col.x;
      const opt = { align: col.align || 'left' };
      font(c.style || 'normal', c.size || 8.8, c.color || INK);
      doc.text(c.main, x, top, opt);
      if (c.sub.length) {
        font('normal', 7.6, MUTED);
        doc.text(c.sub, x, top + c.main.length * 3.9, opt);
      }
    });
    y = top + h;
    doc.setDrawColor(...LINE);
    doc.line(M, y - 3.4, M + CW, y - 3.4);
    y += 0.6;
  };
  const empty = (msg) => {
    font('normal', 9, MUTED);
    doc.text(plain(msg), M, y);
    y += 8;
  };

  // ---- 1. Bảng chi phí: dự kiến · thực tế · chênh lệch (REQ-009) ----
  section(t('ct.title'));
  if (!rowsInOrder.length) empty(t('ct.empty'));
  else {
    const cols = [
      { label: t('cost.item'), x: M, w: 68 },
      { label: t('cmp.planned'), x: M + 70, w: 36, align: 'right' },
      { label: t('cmp.actual'), x: M + 108, w: 34, align: 'right' },
      { label: t('ct.diff'), x: M + 144, w: CW - 144, align: 'right' },
    ];
    head(cols);
    rowsInOrder.forEach((r) => {
      const c = r.cost;
      const p = placeOf(c);
      const perLabel = r.kind === 'item'
        ? [c.per === 'person' ? t('ct.perPerson') : t('ct.perGroup'), c.splitAmong?.length ? c.splitAmong.map((id) => nameOf(id)).join(', ') : ''].filter(Boolean).join(' · ')
        : '';
      const diffTxt =
        r.status === 'pending' ? t('cmp.pending') : r.status === 'extra' ? `+${pdfMoney(r.actual, cur)}` : r.status === 'even' ? t('cmp.even') : `${r.diff > 0 ? '+' : '−'}${pdfMoney(Math.abs(r.diff), cur)}`;
      const diffColor = r.status === 'over' || r.status === 'extra' ? NEG : r.status === 'under' ? POS : MUTED;
      // các lần chi thực tế: ngày · ai trả · chia cho ai · số tiền
      const pays = r.actuals.map((a) => {
        const who = a.splitAmong?.length ? participantsOf(a, memberIds).map((id) => nameOf(id)).join(', ') : t('cost.splitAll');
        return `• ${[a.date ? shortDate(a.date) : '', t('ct.paidBy', { name: nameOf(a.paidBy, a.paidByName) }), who].filter(Boolean).join(' · ')}: ${amountLines(a, actualAmountOf(a, memberIds)).join(' ')}`;
      });
      row(
        cols,
        [
          { lines: [`${c.title || '—'}${r.kind === 'extra' ? `  (${t('ct.extra')})` : ''}`], style: 'bold', color: r.kind === 'extra' ? NEG : INK, sub: [[p && pName(p), c.note].filter(Boolean).join(' · '), ...pays] },
          r.kind === 'item' ? { lines: [amountLines(c, c.amount)[0]], sub: [...amountLines(c, c.amount).slice(1), perLabel] } : { lines: ['—'], color: MUTED },
          { lines: [r.actuals.length ? pdfMoney(r.actual, cur) : '—'], style: r.actuals.length ? 'bold' : 'normal', color: r.actuals.length ? INK : MUTED },
          { lines: [diffTxt], style: 'bold', color: diffColor },
        ],
        r.kind === 'extra' ? { fill: [255, 245, 245] } : {},
      );
    });
    row(
      cols,
      [
        { lines: [t('cost.total')], style: 'bold' },
        { lines: [pdfMoney(tot.planned, cur)], style: 'bold' },
        { lines: [pdfMoney(tot.actual, cur)], style: 'bold' },
        { lines: [tot.actual > 0 ? `${sd > 0.5 ? '+' : sd < -0.5 ? '−' : ''}${pdfMoney(Math.abs(sd), cur)}` : '—'], style: 'bold', color: sd > 0.5 ? NEG : sd < -0.5 ? POS : INK },
      ],
      { fill: HONEY_SOFT },
    );
    const notes = [tot.extra > 0 ? t('ct.extraNote', { v: pdfMoney(tot.extra, cur) }) : '', tot.pending > 0 ? t('cmp.pendingNote', { v: pdfMoney(tot.pending, cur) }) : ''].filter(Boolean).join('  ');
    if (notes) {
      font('normal', 8, MUTED);
      doc.text(doc.splitTextToSize(plain(notes), CW), M, y + 1);
      y += 5;
    }
  }
  y += 6;

  // ---- 3. Chia tiền ----
  section(t('cost.settleTitle'));
  if (!actuals.length) empty(t('cost.settleEmpty'));
  else {
    const cols = [
      { label: t('cost.member'), x: M, w: 56 },
      { label: t('cost.paid'), x: M + 58, w: 36, align: 'right' },
      { label: t('cost.share'), x: M + 96, w: 36, align: 'right' },
      { label: t('cost.balance'), x: M + 134, w: CW - 134, align: 'right' },
    ];
    head(cols);
    Object.entries(balances).forEach(([id, x]) => {
      const even = Math.abs(x.net) < 0.5;
      row(cols, [
        { lines: [nameOf(id)], style: 'bold' },
        { lines: [pdfMoney(x.paid, cur)] },
        { lines: [pdfMoney(x.share, cur)] },
        { lines: [even ? t('cost.even') : x.net > 0 ? t('cost.receive', { v: pdfMoney(x.net, cur) }) : t('cost.owe', { v: pdfMoney(-x.net, cur) })], style: 'bold', color: even ? MUTED : x.net > 0 ? POS : NEG },
      ]);
    });
    y += 3;
    ensure(12);
    font('bold', 9.5, INK);
    if (transfers.length) {
      doc.text(plain(t('cost.howToSettle')), M, y);
      y += 5.5;
      transfers.forEach((tr) => {
        ensure(7);
        doc.setFillColor(...HONEY_SOFT);
        doc.roundedRect(M, y - 4, CW, 6.6, 2, 2, 'F');
        font('normal', 9, INK);
        doc.text(plain(t('pdf.pays', { a: nameOf(tr.from), b: nameOf(tr.to) })), M + 3, y);
        font('bold', 9.5, INK);
        doc.text(pdfMoney(tr.amount, cur), M + CW - 3, y, { align: 'right' });
        y += 8;
      });
    } else {
      font('bold', 9.5, POS);
      doc.text(plain(t('cost.allSettled')), M, y);
      y += 7;
    }
    if (payments.length) {
      y += 1;
      ensure(10);
      font('bold', 8.5, MUTED);
      doc.text(plain(t('cost.paymentsDone', { n: payments.length })), M, y);
      y += 4.5;
      payments.forEach((p) => {
        ensure(5);
        font('normal', 8.4, MUTED);
        doc.text(`• ${plain(t('pdf.paid', { a: nameOf(p.paidBy, p.paidByName), b: nameOf(p.payTo) }))}`, M + 2, y);
        doc.text(pdfMoney(p.amount, cur), M + CW - 3, y, { align: 'right' });
        y += 4.4;
      });
    }
  }

  // ---- Chân trang ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    font('normal', 8.5, MUTED);
    doc.text(`${i}/${pages}`, W - M, H - 9, { align: 'right' });
  }
  const name = `${fileSafe(trip.name)}-${t('pdf.costsSuffix')}.pdf`;
  return { blob: doc.output('blob'), name };
}
