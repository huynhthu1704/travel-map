// Xuất lịch trình chuyến đi ra file PDF (tạo ngay trên trình duyệt, theo dữ liệu mới nhất).
// Dùng font Be Vietnam Pro để hiển thị đúng tiếng Việt; mỗi địa điểm có link mở Google Maps.
import { destinationQuery } from './geo';
import { countryName } from './countries';
import { pName, pCity, getLocale } from './lang';
import { translate as t } from '../i18n';

const BASE = import.meta.env.BASE_URL || './';
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
const mapsLink = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationQuery(p))}`;
const fileSafe = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'trip';

/** items: kế hoạch đã sắp theo ngày + thứ tự (giống trên web) */
export async function exportPlanPdf(trip, items) {
  const [{ jsPDF }, fonts] = await Promise.all([import('jspdf'), loadFonts()]);
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

  // ---- Tiêu đề ----
  doc.setFillColor(...HONEY);
  doc.roundedRect(M, y, CW, 2.2, 1, 1, 'F');
  y += 10;
  font('bold', 20);
  const title = doc.splitTextToSize(plain(trip.name) || t('plan.title'), CW);
  doc.text(title, M, y);
  y += title.length * 8;
  font('normal', 10, MUTED);
  const meta = [];
  if (trip.startDate) meta.push(`${t('trip.startDate')}: ${fmtDate(trip.startDate)}`);
  if (trip.endDate) meta.push(`${t('trip.endDate')}: ${fmtDate(trip.endDate)}`);
  const dests = (trip.destinations || []).filter((d) => d.cc).map((d) => (d.city ? `${d.city}, ${countryName(d.cc)}` : countryName(d.cc)));
  if (dests.length) meta.push(`${t('dest.label')}: ${dests.join(' · ')}`);
  const members = Object.values(trip.members || {}).map((m) => m.name).filter(Boolean);
  if (members.length) meta.push(`${t('trip.members')}: ${members.join(', ')}`);
  meta.forEach((line) => {
    const l = doc.splitTextToSize(plain(line), CW);
    doc.text(l, M, y);
    y += l.length * 5;
  });
  const done = items.filter((i) => i.done).length;
  doc.text(plain(`${t('pdf.summary', { n: items.length, done })} · ${t('pdf.exportedAt', { date: new Date().toLocaleString(getLocale()) })}`), M, y);
  y += 9;

  if (!items.length) {
    font('normal', 11, MUTED);
    doc.text(plain(t('plan.empty')), M, y);
  }

  // ---- Theo từng ngày ----
  let n = 0;
  const groups = [];
  items.forEach((i) => {
    const k = i.date || '';
    if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, list: [] });
    groups[groups.length - 1].list.push(i);
  });
  for (const g of groups) {
    ensure(22);
    doc.setFillColor(...HONEY_SOFT);
    doc.roundedRect(M, y - 5, CW, 9, 2, 2, 'F');
    font('bold', 11.5);
    let head = g.k ? fmtDate(g.k) : t('plan.noDate');
    if (g.k && trip.startDate && g.k >= trip.startDate) {
      const day = Math.round((new Date(g.k) - new Date(trip.startDate)) / 864e5) + 1;
      head = `${t('plan.dayN', { n: day })} · ${head}`;
    }
    doc.text(plain(head), M + 3, y + 0.8);
    y += 10;

    for (const it of g.list) {
      n += 1;
      const p = it.place || {};
      const nameLines = doc.splitTextToSize(plain(pName(p)) || '—', CW - 34);
      font('normal', 9.5);
      const noteLines = it.note ? doc.splitTextToSize(plain(`${t('plan.note')}: ${it.note}`), CW - 14) : [];
      const h = nameLines.length * 5.6 + 5 + 5 + noteLines.length * 4.6 + 4;
      ensure(h);
      const top = y;
      // số thứ tự
      doc.setFillColor(...(it.done ? [76, 175, 80] : HONEY));
      doc.circle(M + 4, top - 1.4, 3.6, 'F');
      if (it.done) {
        // dấu tích vẽ bằng nét (font không có ký tự ✓)
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.7);
        doc.lines([[1.3, 1.4], [2.6, -2.8]], M + 2.3, top - 1.5);
        doc.setLineWidth(0.2);
      } else {
        font('bold', 9, INK);
        doc.text(String(n), M + 4, top - 0.2, { align: 'center' });
      }
      // tên + giờ
      font('bold', 12);
      doc.text(nameLines, M + 11, top);
      if (it.time) {
        font('bold', 11, INK);
        doc.text(it.time, M + CW, top, { align: 'right' });
      }
      y = top + nameLines.length * 5.6 - 1;
      // địa chỉ + trạng thái
      font('normal', 9.5, MUTED);
      const loc = [...new Set([pCity(p), countryName(p.country)].filter(Boolean))].join(', ');
      const status = it.done ? ` · ${t('pdf.visited')}${it.doneBy ? ` (${it.doneBy})` : ''}` : '';
      doc.text(plain(loc + status), M + 11, y);
      y += 5;
      // link Google Maps
      font('normal', 9.5, LINK);
      doc.textWithLink(plain(t('pdf.openMaps')), M + 11, y, { url: mapsLink(p) });
      y += 5;
      // ghi chú
      if (noteLines.length) {
        font('normal', 9.5, INK);
        doc.text(noteLines, M + 11, y);
        y += noteLines.length * 4.6;
      }
      // đường kẻ
      doc.setDrawColor(235, 228, 216);
      doc.line(M + 11, y, M + CW, y);
      y += 6;
    }
    y += 2;
  }

  // ---- Chân trang ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    font('normal', 8.5, MUTED);
    doc.text(plain(`${t('app.logo1')} ${t('app.logo2')} · ${plain(trip.name)}`), M, H - 9);
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
