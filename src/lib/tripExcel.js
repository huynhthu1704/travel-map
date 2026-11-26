/**
 * REQ-026 / REQ-029 / REQ-030: trip itinerary + costs as an Excel workbook.
 * buildTripWorkbook() is pure (no browser APIs) so it can be unit-tested in Node; it returns the sheets in
 * write-excel-file's multi-sheet format. Extra sheet options read by xlsxValidation.js:
 *   validations    drop-down lists (Excel data validation)
 *   formulaValues  { A1: value } — the calculated value of every formula cell, so amounts are visible even in
 *                  viewers that do not recalculate (Excel Protected View, previews, phones)
 *   hiddenColumns  [n] — helper columns kept for the formulas but hidden from view
 *
 * Sheets: Itinerary & costs · Checklist (REQ-056, when the trip has checklist items) · Settle up (groups only) · Rates ·
 * Master data.
 * Layout of the first sheet (top to bottom): costs not linked to any plan item (usually pre-trip), plan items
 * without a date, then one block per day; each plan item is followed by its cost lines. A cost line holds an
 * estimate and its actual side by side: estimated cost, [currency], actual cost, [currency], final amount in the
 * trip currency and the difference. Currency columns only appear when the trip uses more than one currency.
 */

import { COST_TYPES, costTypeLabel } from '../data/costTypes.js';
import { tripDays, dueStatus } from './checklist.js';

const LABELS = {
  vi: {
    sheets: { plan: 'Lịch trình & chi phí', settle: 'Chia tiền', rates: 'Tỉ giá', master: 'Master data' },
    title: (t) => `LỊCH TRÌNH & CHI PHÍ | ${t}`,
    cols: {
      date: 'Ngày', time: 'Giờ', city: 'Thành phố', act: 'Hoạt động / khoản chi', status: 'Trạng thái',
      est: 'Chi phí dự kiến', estCur: 'Tiền tệ (dự kiến)', act$: 'Chi phí thực tế', actCur: 'Tiền tệ (thực tế)',
      final: (b) => `Thành tiền (${b})`, diff: 'Chênh lệch (thực tế − dự kiến)',
      payer: 'Người trả', payee: 'Người nhận', split: 'Cách tính tiền', costType: 'Loại chi phí', maps: 'Google Maps', note: 'Ghi chú',
      type: 'Loại dòng', estBase: (b) => `Dự kiến quy đổi (${b})`,
    },
    share: (n) => `Phần của ${n}`,
    pre: 'Chi phí chung / trước chuyến đi (không gắn địa điểm)',
    undated: 'Chưa xếp ngày',
    day: (n) => `Ngày ${n}`,
    repay: 'Trả lại giữa các thành viên',
    dayTotal: 'Cộng ngày',
    sectionTotal: 'Cộng',
    total: 'TỔNG CẢ CHUYẾN',
    kinds: { item: 'Lịch trình', cost: 'Chi phí', payment: 'Trả lại' },
    status: ['Chưa làm', 'Đang làm', 'Xong', 'Không đi'],
    split: { all: 'Cả nhóm', only: (n) => `Riêng - ${n}`, pick: 'Chọn người' },
    perPerson: (n) => `× ${n} người`,
    settle: ['Thành viên', 'Đã trả', 'Phần của mình', 'Đã chuyển trả', 'Đã nhận lại', 'Còn lại (+ nhận lại / − cần trả)'],
    transfers: 'Cách trả nhanh nhất',
    transferCols: ['Người trả', 'Người nhận', 'Số tiền'],
    rates: ['Tiền tệ', (b) => `1 đơn vị = ? ${b}`],
    ratesNote: (b) => `Số tiền ở sheet Lịch trình & chi phí được quy đổi về ${b} theo bảng này — sửa tỉ giá, cả file tự tính lại.`,
    master: ['Trạng thái', 'Loại dòng', 'Cách tính tiền', 'Loại chi phí', 'Tiền tệ', 'Thành viên'],
    check: {
      sheet: 'Checklist',
      title: (t) => `CHECKLIST | ${t}`,
      cols: ['Checklist', 'Khi nào', 'Việc cần làm', 'Ai lo', 'Xong', 'Người tick', 'Ngày cần làm'],
      personalList: (n) => `${n} (cá nhân)`,
      phase: { before: 'Trước khi đi', return: 'Trước khi về' },
      who: { group: 'Cả nhóm', each: 'Mỗi người tự tick', only: (n) => `Chỉ ${n}`, personal: 'Cá nhân' },
      dueBefore: 'Trước chuyến đi',
      day: (n, d) => `Ngày ${n} · ${d}`,
      done: (a, b) => `Đã xong: ${a}/${b}`,
    },
  },
  en: {
    sheets: { plan: 'Itinerary & costs', settle: 'Settle up', rates: 'Rates', master: 'Master data' },
    title: (t) => `ITINERARY & COSTS | ${t}`,
    cols: {
      date: 'Date', time: 'Time', city: 'City', act: 'Activity / cost', status: 'Status',
      est: 'Estimated cost', estCur: 'Currency (estimated)', act$: 'Actual cost', actCur: 'Currency (actual)',
      final: (b) => `Final amount (${b})`, diff: 'Difference (actual − estimated)',
      payer: 'Paid by', payee: 'Paid to', split: 'Split', costType: 'Cost type', maps: 'Google Maps', note: 'Note',
      type: 'Row type', estBase: (b) => `Estimated in ${b}`,
    },
    share: (n) => `${n}'s share`,
    pre: 'General / pre-trip costs (not linked to a place)',
    undated: 'Not scheduled',
    day: (n) => `Day ${n}`,
    repay: 'Repayments between members',
    dayTotal: 'Day total',
    sectionTotal: 'Total',
    total: 'TRIP TOTAL',
    kinds: { item: 'Itinerary', cost: 'Cost', payment: 'Repayment' },
    status: ['To do', 'In progress', 'Done', 'Skipped'],
    split: { all: 'Whole group', only: (n) => `Only - ${n}`, pick: 'Picked people' },
    perPerson: (n) => `× ${n} people`,
    settle: ['Member', 'Paid', 'Own share', 'Repaid', 'Received back', 'Balance (+ gets back / − owes)'],
    transfers: 'Quickest way to settle',
    transferCols: ['From', 'To', 'Amount'],
    rates: ['Currency', (b) => `1 unit = ? ${b}`],
    ratesNote: (b) => `Amounts on the Itinerary & costs sheet are converted to ${b} with this table — change a rate and the whole file recalculates.`,
    master: ['Status', 'Row type', 'Split', 'Cost type', 'Currency', 'Member'],
    check: {
      sheet: 'Checklist',
      title: (t) => `CHECKLIST | ${t}`,
      cols: ['List', 'When', 'Item', 'For', 'Done', 'Ticked by', 'Due day'],
      personalList: (n) => `${n} (personal)`,
      phase: { before: 'Before the trip', return: 'Before returning' },
      who: { group: 'Group', each: 'Everyone ticks', only: (n) => `Only ${n}`, personal: 'Personal' },
      dueBefore: 'Before the trip',
      day: (n, d) => `Day ${n} · ${d}`,
      done: (a, b) => `Done: ${a}/${b}`,
    },
  },
};

/** Column number (1-based) → Excel letters */
export const col = (n) => {
  let s = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};
const q = (sheet) => `'${sheet.replace(/'/g, "''")}'`;
const str = (s) => `"${String(s).replace(/"/g, '""')}"`;
const round2 = (n) => Math.round(n * 100) / 100;

const HEAD = { fontWeight: 'bold', backgroundColor: '#FFE38A', wrap: true, alignVertical: 'center' };
const DAY = { fontWeight: 'bold', backgroundColor: '#FFF6D6' };
const ITEM = { fontWeight: 'bold' };
const SUB = { color: '#5A5148' };
const TOTAL = { fontWeight: 'bold', backgroundColor: '#FFE38A' };

const dateCell = (iso, style = {}) => (iso ? { value: new Date(`${iso}T00:00:00Z`), type: Date, format: 'dd/mm/yyyy', ...style } : { value: '', ...style });
/** A formula cell that also carries its calculated value (written as the cached result) */
const fx = (value, cached, format, style = {}) => ({ value, type: 'Formula', format, cached, ...style });
const mapsUrl = (p) =>
  p?.gmapsLink ||
  (Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)) && (p.lat || p.lng)
    ? `https://www.google.com/maps/search/?api=1&query=${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`
    : p?.name
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.name, p.city].filter(Boolean).join(' '))}`
      : '');

/** { A1: cached value } for every formula cell of a sheet's data */
export function formulaValuesOf(data) {
  const out = {};
  data.forEach((row, i) =>
    (row || []).forEach((cell, j) => {
      if (cell && cell.type === 'Formula' && cell.cached !== undefined) out[`${col(j + 1)}${i + 1}`] = cell.cached;
    }),
  );
  return out;
}

/**
 * @param trip   { name, currency, rates, memberIds, members }
 * @param plan   plan items (removed ones already filtered out)
 * @param costs  estimates / actuals / repayments
 * @param opts   { lang, transfers: [{from, to, amount}] (uids), placeName(place),
 *                 checklists (REQ-056), uid (the exporting user: only shared lists and their own are exported),
 *                 today (YYYY-MM-DD, for the overdue / due-today colours) }
 */
export function buildTripWorkbook(trip, plan = [], costs = [], opts = {}) {
  const lang = LABELS[opts.lang] ? opts.lang : 'vi';
  const L = LABELS[lang];
  const S = L.sheets;
  const base = trip.currency || 'VND';
  const money = base === 'VND' ? '#,##0' : '#,##0.00';
  const fmtOf = (cur) => (cur === 'VND' ? '#,##0' : '#,##0.00');
  const memberIds = trip.memberIds?.length ? trip.memberIds : Object.keys(trip.members || {});
  const nameOf = (uid) => trip.members?.[uid]?.name || uid || '';
  const group = memberIds.length > 1;
  const pname = opts.placeName || ((p) => p?.name || '');
  const rateOf = (cur) => (!cur || cur === base ? 1 : Number(trip.rates?.[cur]) || 0);
  const peopleOf = (c) => {
    const among = (c.splitAmong || []).filter(Boolean);
    return c.per === 'person' ? Math.max((among.length ? among : memberIds).length, 1) : 1;
  };
  const totalOf = (c) => (Number(c.amount) || 0) * peopleOf(c); // whole-group amount in the cost's own currency
  const convOf = (c) => round2(totalOf(c) * rateOf(c.currency || base));
  const multi = costs.some((c) => (c.currency || base) !== base);

  // ---------- Columns ----------
  const keys = [
    'date', 'time', 'city', 'act', 'status',
    'est', ...(multi ? ['estCur'] : []), 'act$', ...(multi ? ['actCur'] : []), 'final', 'diff',
    ...(group ? memberIds.map((id) => `share:${id}`) : []),
    ...(group ? ['payer', 'payee', 'split'] : []), 'costType', 'maps', 'note', 'type', 'estBase',
  ];
  const C = Object.fromEntries(keys.map((k, i) => [k, i + 1]));
  const X = (k) => col(C[k]);
  const width = keys.length;
  const headText = (k) => {
    if (k.startsWith('share:')) return L.share(nameOf(k.slice(6)));
    const v = L.cols[k];
    if (typeof v === 'function') return v(base);
    return !multi && (k === 'est' || k === 'act$') ? `${v} (${base})` : v;
  };
  const widths = { date: 12, time: 7, city: 14, act: 36, status: 11, est: 14, estCur: 9, act$: 14, actCur: 9, final: 15, diff: 15, payer: 13, payee: 13, split: 18, costType: 15, maps: 40, note: 32, type: 10, estBase: 14 };

  const rows = [];
  const blank = (style = {}) => Array.from({ length: width }, () => ({ value: '', ...style }));
  const put = (row, k, cell) => C[k] && (row[C[k] - 1] = cell);
  rows.push([{ value: L.title(trip.name || ''), fontWeight: 'bold', fontSize: 14, columnSpan: width }, ...Array(width - 1).fill(null)]);
  rows.push(keys.map((k) => ({ value: headText(k), ...HEAD })));
  const FIRST = 3;
  const RATES = q(S.rates);
  const rate = (curCell) => (multi ? `*IFERROR(VLOOKUP(${curCell},${RATES}!$A:$B,2,FALSE),0)` : '');

  // ---------- Pair estimates with actuals; attach lines to plan items ----------
  const sortedPlan = [...plan].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '') || (a.time || '99').localeCompare(b.time || '99') || (a.order ?? 0) - (b.order ?? 0),
  );
  const planIds = new Set(sortedPlan.map((p) => p.id));
  const byDate = (x, y) => (x.date || '').localeCompare(y.date || '') || (x.order ?? 0) - (y.order ?? 0);
  const estimates = costs.filter((c) => c.type === 'estimate').sort(byDate);
  const actuals = costs.filter((c) => c.type === 'actual').sort(byDate);
  const payments = costs.filter((c) => c.type === 'payment').sort(byDate);
  const estIds = new Set(estimates.map((e) => e.id));
  // A "line" is { est?, act? }: an estimate with its first actual; further actuals get their own line
  const linesOfEst = (e) => {
    const acts = actuals.filter((a) => a.estimateId === e.id);
    return acts.length ? acts.map((a, i) => (i === 0 ? { est: e, act: a } : { act: a })) : [{ est: e }];
  };
  const planOf = (c) => (c.planItemId && planIds.has(c.planItemId) ? c.planItemId : null);
  const linesOfPlan = new Map(sortedPlan.map((p) => [p.id, []]));
  const preLines = [];
  for (const e of estimates) (planOf(e) ? linesOfPlan.get(planOf(e)) : preLines).push(...linesOfEst(e));
  for (const a of actuals.filter((x) => !x.estimateId || !estIds.has(x.estimateId))) (planOf(a) ? linesOfPlan.get(planOf(a)) : preLines).push({ act: a });

  const splitLabel = (c) => {
    const among = (c.splitAmong || []).filter(Boolean);
    if (!among.length || among.length === memberIds.length) return L.split.all;
    if (among.length === 1) return L.split.only(nameOf(among[0]));
    return `${L.split.pick}: ${among.map(nameOf).join(', ')}`;
  };
  const statusOf = (p) => (p.skipped ? L.status[3] : p.done ? L.status[2] : L.status[0]);

  /** One cost line. Returns its values in the trip currency for totals. */
  const lineRow = ({ est, act }, kind = L.kinds.cost) => {
    const r = rows.length + 1;
    const main = act || est;
    const row = blank(SUB);
    put(row, 'date', dateCell(act?.date || est?.date, SUB));
    put(row, 'act', { value: `   ↳ ${main.title || ''}`, wrap: true, ...SUB });
    put(row, 'type', { value: kind, ...SUB });
    const estCur = est ? est.currency || base : '';
    const actCur = act ? act.currency || base : '';
    if (est) put(row, 'est', { value: totalOf(est), type: Number, format: fmtOf(estCur), ...SUB });
    if (act) put(row, 'act$', { value: totalOf(act), type: Number, format: fmtOf(actCur), ...SUB });
    if (multi) {
      put(row, 'estCur', { value: estCur, ...SUB });
      put(row, 'actCur', { value: actCur, ...SUB });
    }
    const estV = est ? convOf(est) : 0;
    const finV = act ? convOf(act) : null;
    const E = `${X('est')}${r}`;
    const A = `${X('act$')}${r}`;
    put(row, 'estBase', fx(`=IF(${E}="",0,${E}${rate(`${X('estCur')}${r}`)})`, estV, money, SUB));
    put(row, 'final', fx(`=IF(${A}="","",${A}${rate(`${X('actCur')}${r}`)})`, finV ?? '', money, SUB));
    put(row, 'diff', fx(`=IF(OR(${A}="",${E}=""),"",${X('final')}${r}-${X('estBase')}${r})`, act && est ? round2(finV - estV) : '', money, SUB));
    const shares = {};
    if (group) {
      if (act) put(row, 'payer', { value: nameOf(act.paidBy), ...SUB });
      if (main.type === 'payment') put(row, 'payee', { value: nameOf(main.payTo), ...SUB });
      else put(row, 'split', { value: splitLabel(main), ...SUB });
      if (act && main.type !== 'payment') {
        const among = (act.splitAmong || []).filter(Boolean);
        const parts = among.length ? among : memberIds;
        memberIds.forEach((id) => {
          const inIt = !among.length || among.includes(id);
          shares[id] = inIt ? round2(finV / parts.length) : 0;
          put(row, `share:${id}`, inIt ? fx(`=IF(${X('final')}${r}="",0,${X('final')}${r}/${parts.length})`, shares[id], money, SUB) : { value: 0, type: Number, format: money, ...SUB });
        });
      }
    }
    put(row, 'costType', { value: costTypeLabel(main.costType || est?.costType, lang), ...SUB });
    const notes = [];
    if (est && peopleOf(est) > 1) notes.push(`${est.amount} ${estCur} ${L.perPerson(peopleOf(est))}`);
    if (act && peopleOf(act) > 1) notes.push(`${act.amount} ${actCur} ${L.perPerson(peopleOf(act))}`);
    put(row, 'note', { value: [...notes, act?.note || '', est?.note || ''].filter(Boolean).join(' · '), wrap: true, ...SUB });
    rows.push(row);
    return { est: estV, fin: finV ?? 0, diff: act && est ? round2(finV - estV) : 0, shares };
  };

  const sum = (lines, k) => round2(lines.reduce((s, x) => s + (x[k] || 0), 0));
  const shareSum = (lines, id) => round2(lines.reduce((s, x) => s + (x.shares[id] || 0), 0));
  /** Fill the money cells of a summary row (plan item, day, section or trip) from the cost lines in a range */
  const fillTotals = (row, r, from, to, lines, style) => {
    const rng = (k) => `${X(k)}${from}:${X(k)}${Math.max(to, from)}`;
    const sumif = (k) => `=SUMIFS(${rng(k)},${rng('type')},${str(L.kinds.cost)})`;
    put(row, 'est', fx(sumif('estBase'), sum(lines, 'est'), money, style));
    put(row, 'act$', fx(sumif('final'), sum(lines, 'fin'), money, style));
    if (multi) {
      put(row, 'estCur', { value: base, ...style });
      put(row, 'actCur', { value: base, ...style });
    }
    put(row, 'final', fx(`=${X('act$')}${r}`, sum(lines, 'fin'), money, style));
    put(row, 'diff', fx(sumif('diff'), sum(lines, 'diff'), money, style));
    if (group) memberIds.forEach((id) => put(row, `share:${id}`, fx(sumif(`share:${id}`), shareSum(lines, id), money, style)));
  };
  const totalsRow = (label, from, to, lines, style) => {
    const r = rows.length + 1;
    const row = blank(style);
    put(row, 'act', { value: label, ...style });
    fillTotals(row, r, from, to, lines, style);
    rows.push(row);
  };
  const sectionHead = (label, date) => {
    const row = blank(DAY);
    put(row, 'date', date ? dateCell(date, DAY) : { value: '', ...DAY });
    put(row, 'act', { value: label, ...DAY });
    rows.push(row);
  };
  const allLines = [];

  // ---------- 1. General / pre-trip costs (not linked to a plan item) ----------
  if (preLines.length) {
    sectionHead(L.pre);
    const from = rows.length + 1;
    const lines = preLines.map((l) => lineRow(l));
    totalsRow(L.sectionTotal, from, rows.length, lines, DAY);
    allLines.push(...lines);
  }

  // ---------- 2. Plan items: undated first, then one block per day ----------
  const days = [];
  for (const p of sortedPlan) {
    const k = p.date || '';
    if (!days.length || days[days.length - 1].date !== k) days.push({ date: k, items: [] });
    days[days.length - 1].items.push(p);
  }
  days.sort((x, y) => (x.date ? 1 : 0) - (y.date ? 1 : 0) || x.date.localeCompare(y.date));
  let dayNo = 0;
  for (const d of days) {
    sectionHead(d.date ? L.day(++dayNo) : L.undated, d.date);
    const from = rows.length + 1;
    const dayLines = [];
    for (const p of d.items) {
      const ir = rows.length + 1;
      const row = blank(ITEM);
      put(row, 'date', d.date ? dateCell(d.date, ITEM) : { value: '', ...ITEM });
      put(row, 'time', { value: p.time || '', ...ITEM });
      put(row, 'city', { value: p.place?.city || '', ...ITEM });
      put(row, 'act', { value: pname(p.place), wrap: true, ...ITEM });
      put(row, 'status', { value: statusOf(p), ...ITEM });
      put(row, 'type', { value: L.kinds.item, ...SUB });
      const url = mapsUrl(p.place);
      // REQ-032: show the full URL (copyable, readable in any viewer) and keep it clickable
      if (url) put(row, 'maps', fx(`=HYPERLINK(${str(url)})`, url, undefined, { color: '#1155CC' }));
      put(row, 'note', { value: p.note || '', wrap: true });
      rows.push(row);
      const lines = linesOfPlan.get(p.id).map((l) => lineRow(l));
      if (lines.length) fillTotals(row, ir, ir + 1, ir + lines.length, lines, ITEM); // the item adds up the lines right under it
      dayLines.push(...lines);
    }
    totalsRow(d.date ? L.dayTotal : L.sectionTotal, from, rows.length, dayLines, DAY);
    allLines.push(...dayLines);
  }

  // ---------- 3. Repayments (not trip spending; used by Settle up) ----------
  if (payments.length) {
    sectionHead(L.repay);
    payments.forEach((p) => lineRow({ act: p }, L.kinds.payment));
  }
  totalsRow(L.total, FIRST, rows.length, allLines, TOTAL);

  const last = rows.length;
  const planSheet = {
    sheet: S.plan,
    data: rows,
    columns: keys.map((k) => ({ width: k.startsWith('share:') ? 13 : widths[k] })),
    stickyRowsCount: 2,
    hiddenColumns: [C.estBase],
  };

  // ---------- Settle up (groups) ----------
  let settleSheet = null;
  if (group) {
    const P = q(S.plan);
    const span = (k) => `${P}!$${X(k)}$${FIRST}:$${X(k)}$${last}`;
    const typeIs = (kind) => `${span('type')},${str(kind)}`;
    const sumC = (list) => round2(list.reduce((s, c) => s + convOf(c), 0));
    const sr = [L.settle.map((v) => ({ value: v, ...HEAD }))];
    memberIds.forEach((id) => {
      const r = sr.length + 1;
      const who = str(nameOf(id));
      const paid = sumC(actuals.filter((c) => c.paidBy === id));
      const share = shareSum(allLines, id);
      const sent = sumC(payments.filter((c) => c.paidBy === id));
      const got = sumC(payments.filter((c) => c.payTo === id));
      sr.push([
        { value: nameOf(id), fontWeight: 'bold' },
        fx(`=SUMIFS(${span('final')},${span('payer')},${who},${typeIs(L.kinds.cost)})`, paid, money),
        fx(`=SUMIFS(${span(`share:${id}`)},${typeIs(L.kinds.cost)})`, share, money),
        fx(`=SUMIFS(${span('final')},${span('payer')},${who},${typeIs(L.kinds.payment)})`, sent, money),
        fx(`=SUMIFS(${span('final')},${span('payee')},${who},${typeIs(L.kinds.payment)})`, got, money),
        fx(`=B${r}-C${r}+D${r}-E${r}`, round2(paid - share + sent - got), money, { fontWeight: 'bold' }),
      ]);
    });
    const tr = (opts.transfers || []).filter((x) => x.amount > 0);
    if (tr.length) {
      sr.push([], [{ value: L.transfers, fontWeight: 'bold' }], L.transferCols.map((v) => ({ value: v, ...HEAD })));
      tr.forEach((x) => sr.push([nameOf(x.from), nameOf(x.to), { value: x.amount, type: Number, format: money }]));
    }
    settleSheet = { sheet: S.settle, data: sr, columns: [{ width: 18 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 30 }], stickyRowsCount: 1 };
  }

  // ---------- Rates ----------
  const currencies = [...new Set([base, ...Object.keys(trip.rates || {}), ...costs.map((c) => c.currency).filter(Boolean)])];
  const ratesSheet = {
    sheet: S.rates,
    data: [
      [{ value: L.rates[0], ...HEAD }, { value: L.rates[1](base), ...HEAD }],
      ...currencies.map((c) => [c, { value: rateOf(c), type: Number, format: '#,##0.####' }]),
      [],
      [{ value: L.ratesNote(base), color: '#8A7F72' }],
    ],
    columns: [{ width: 12 }, { width: 20 }],
    stickyRowsCount: 1,
  };

  // ---------- Master data (lists behind the drop-downs) ----------
  const lists = [L.status, Object.values(L.kinds), [L.split.all, ...memberIds.map((id) => L.split.only(nameOf(id))), L.split.pick], COST_TYPES.map((x) => x[lang]), currencies, memberIds.map(nameOf)];
  const masterRows = Math.max(...lists.map((x) => x.length));
  const masterSheet = {
    sheet: S.master,
    data: [L.master.map((v) => ({ value: v, ...HEAD })), ...Array.from({ length: masterRows }, (_, i) => lists.map((l) => l[i] ?? ''))],
    columns: L.master.map(() => ({ width: 18 })),
    stickyRowsCount: 1,
  };
  const listRef = (i) => `${q(S.master)}!$${col(i + 1)}$2:$${col(i + 1)}$${lists[i].length + 1}`;
  const upTo = last + 200; // room for rows added later in Excel
  const v = (k, i) => ({ sqref: `${X(k)}${FIRST}:${X(k)}${upTo}`, list: listRef(i) });
  planSheet.validations = [
    v('status', 0),
    v('type', 1),
    v('costType', 3),
    ...(multi ? [v('estCur', 4), v('actCur', 4)] : []),
    ...(group ? [{ sqref: `${X('payer')}${FIRST}:${X('payee')}${upTo}`, list: listRef(5) }, v('split', 2)] : []),
  ];

  const checkSheet = buildChecklistSheet(trip, opts, L.check, memberIds.length);
  const sheets = [planSheet, checkSheet, settleSheet, ratesSheet, masterSheet].filter(Boolean);
  sheets.forEach((s) => (s.formulaValues = formulaValuesOf(s.data)));
  return { sheets, columns: C, labels: L, multi };
}

const OVERDUE = '#FDE2DC';
const DUE_TODAY = '#FFF3B0';
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ddmm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/**
 * REQ-056: the trip's checklists as one sheet — one row per item, "before the trip" lists first.
 * Only shared lists and the exporting user's own personal lists (other members' lists never leave the app).
 * Returns null when there is nothing to show.
 */
export function buildChecklistSheet(trip, opts, K, members = 1) {
  const visible = (opts.checklists || []).filter((l) => l && (l.scope === 'shared' || (opts.uid && l.ownerUid === opts.uid)));
  const lists = [...visible.filter((l) => l.phase !== 'return'), ...visible.filter((l) => l.phase === 'return')];
  const today = opts.today || localToday();
  const days = tripDays(trip.startDate, trip.endDate);
  const dueText = (due) => {
    if (!due) return '';
    if (due === 'before') return K.dueBefore;
    const day = days.find((x) => x.date === due);
    return day ? K.day(day.day, ddmm(due)) : `${ddmm(due)}/${due.slice(0, 4)}`;
  };
  const n = Math.max(1, members);
  const rows = [];
  let done = 0;
  lists.forEach((l) => {
    const shared = l.scope === 'shared';
    (l.items || []).forEach((it) => {
      const each = shared && it.scope === 'personal';
      const ticked = each ? Object.values(it.doneMap || {}).filter(Boolean) : [];
      const isDone = each ? ticked.length >= n : !!it.done;
      if (isDone) done++;
      const who = !shared ? K.who.personal : each ? K.who.each : it.scope === 'me' ? K.who.only(it.ownerName || '') : K.who.group;
      const status = dueStatus(it.due, isDone, today, trip.startDate);
      const fill = status === 'overdue' ? { backgroundColor: OVERDUE } : status === 'today' ? { backgroundColor: DUE_TODAY } : {};
      const cells = [
        shared ? l.title || '' : K.personalList(l.title || ''),
        K.phase[l.phase === 'return' ? 'return' : 'before'],
        it.text || '',
        who,
        each ? `${ticked.length}/${n}` : isDone ? '✓' : '',
        each ? ticked.join(', ') : isDone ? it.doneBy || '' : '',
        dueText(it.due),
      ];
      rows.push(cells.map((value, i) => ({ value, ...fill, ...(i === 4 ? { align: 'center' } : {}) })));
    });
  });
  if (!rows.length) return null;
  return {
    sheet: K.sheet,
    data: [
      [{ value: K.title(trip.name || ''), fontWeight: 'bold', fontSize: 12 }],
      K.cols.map((value) => ({ value, ...HEAD })),
      ...rows,
      [{ value: K.done(done, rows.length), ...TOTAL }, ...K.cols.slice(1).map(() => ({ value: '', ...TOTAL }))],
    ],
    columns: [{ width: 24 }, { width: 16 }, { width: 36 }, { width: 22 }, { width: 8 }, { width: 22 }, { width: 18 }],
    stickyRowsCount: 2,
  };
}

/** REQ-056: read the trip's checklists once for the export; a failed read means no Checklist sheet, not an error */
export async function checklistsForExport(api, tripId, uid) {
  try {
    return (await api.getChecklists?.(tripId, uid)) || [];
  } catch {
    return [];
  }
}

export const excelFileName = (trip) => `${(trip.name || 'trip').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'trip'}.xlsx`;

/** Build the workbook and hand it to the browser (download, or share sheet on phones when asked) */
export async function exportTripExcel(trip, plan, costs, opts = {}) {
  const [{ default: writeXlsxFile }, { dataValidationFeature }] = await Promise.all([import('write-excel-file/browser'), import('./xlsxValidation.js')]);
  const { sheets } = buildTripWorkbook(trip, plan, costs, opts);
  const blob = await writeXlsxFile(sheets, { features: [dataValidationFeature], fontFamily: 'Arial', fontSize: 10 }).toBlob();
  const name = excelFileName(trip);
  const file = new File([blob], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (opts.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
