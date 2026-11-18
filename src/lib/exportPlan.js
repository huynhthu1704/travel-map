// Xuất lịch trình chuyến đi ra file PDF (tạo ngay trên trình duyệt, theo dữ liệu mới nhất).
// Dùng font Be Vietnam Pro để hiển thị đúng tiếng Việt; mỗi địa điểm có link mở Google Maps.
import { destinationQuery } from './geo';
import { countryName } from './countries';
import { pName, pCity, getLocale } from './lang';
import { translate as t } from '../i18n';

const BASE = import.meta.env.BASE_URL || './';
/** Nạp thư viện PDF; nếu trang đang chạy bản cũ (file đã đổi tên sau khi cập nhật) → đánh dấu để tải lại trang */
export function loadJsPdf() {
  return import('jspdf').catch((e) => {
    const err = new Error(e?.message || 'stale');
    err.stale = true;
    throw err;
  });
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

  // ---- Tiêu đề (gọn: tên chuyến + 2 dòng thông tin) ----
  doc.setFillColor(...HONEY);
  doc.rect(M, y, 3, 11, 'F');
  font('bold', 17);
  const title = doc.splitTextToSize(plain(trip.name) || t('plan.title'), CW - 8);
  doc.text(title[0], M + 6, y + 5.5);
  font('normal', 9, MUTED);
  const dateRange = trip.startDate
    ? `${shortDate(trip.startDate)}${trip.endDate && trip.endDate !== trip.startDate ? ` – ${shortDate(trip.endDate)}` : ''}`
    : '';
  const dests = (trip.destinations || []).filter((d) => d.cc).map((d) => [...new Set([d.city, countryName(d.cc)].filter(Boolean))].join(', '));
  const members = Object.values(trip.members || {}).map((m) => m.name).filter(Boolean);
  const line1 = [dateRange, dests.join(' · '), members.length ? `${t('trip.members')}: ${members.join(', ')}` : ''].filter(Boolean).join('   |   ');
  const done = items.filter((i) => i.done).length;
  const line2 = `${t('pdf.summary', { n: items.length, done })} · ${t('pdf.exportedAt', { date: new Date().toLocaleString(getLocale()) })}`;
  const l1 = doc.splitTextToSize(plain(line1), CW - 6).slice(0, 2);
  doc.text(l1, M + 6, y + 10);
  y += 14 + (l1.length - 1) * 3.8;
  doc.text(plain(line2), M + 6, y);
  y += 6;

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
      const status = it.done ? ` · ${t('pdf.visited')}` : '';
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
