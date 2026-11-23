/**
 * REQ-026 / REQ-029: trip itinerary + costs as an Excel workbook.
 * buildTripWorkbook() is pure (no browser APIs) so it can be unit-tested in Node; it returns the sheets in
 * write-excel-file's multi-sheet format. Extra sheet options read by xlsxValidation.js:
 *   validations    drop-down lists (Excel data validation)
 *   formulaValues  { A1: value } — the calculated value of every formula cell, so amounts are visible even in
 *                  viewers that do not recalculate (Excel Protected View, previews, phones)
 *
 * Sheets: Itinerary & costs · Settle up (groups only) · Rates · Master data.
 * Each plan item is followed by the estimates and actual costs linked to it; item, day and trip totals are
 * formulas, and every converted amount looks up the Rates sheet, so editing a rate updates the whole file.
 */

const LABELS = {
  vi: {
    sheets: { plan: 'Lịch trình & chi phí', settle: 'Chia tiền', rates: 'Tỉ giá', master: 'Master data' },
    title: (t) => `LỊCH TRÌNH & CHI PHÍ | ${t}`,
    cols: {
      date: 'Ngày', time: 'Giờ', city: 'Thành phố', act: 'Hoạt động / khoản chi', status: 'Trạng thái',
      est: 'Dự kiến', actual: 'Thực tế', diff: 'Chênh lệch', type: 'Loại dòng', amount: 'Số tiền gốc', cur: 'Tiền tệ',
      payer: 'Người trả', payee: 'Người nhận', split: 'Cách tính tiền', costType: 'Loại chi phí', maps: 'Google Maps', note: 'Ghi chú',
    },
    share: (n) => `Phần của ${n}`,
    undated: 'Chưa xếp ngày',
    day: (n) => `Ngày ${n}`,
    other: 'Chi phí khác (không gắn lịch trình)',
    repay: 'Trả lại giữa các thành viên',
    dayTotal: 'Cộng ngày',
    sectionTotal: 'Cộng',
    total: 'TỔNG CẢ CHUYẾN',
    openMap: 'Mở bản đồ',
    kinds: { item: 'Lịch trình', estimate: 'Dự kiến', actual: 'Thực tế', payment: 'Trả lại' },
    status: ['Chưa làm', 'Đang làm', 'Xong', 'Không đi'],
    split: { all: 'Cả nhóm', only: (n) => `Riêng - ${n}`, pick: 'Chọn người' },
    perPerson: (n) => `× ${n} người`,
    settle: ['Thành viên', 'Đã trả', 'Phần của mình', 'Đã chuyển trả', 'Đã nhận lại', 'Còn lại (+ nhận lại / − cần trả)'],
    transfers: 'Cách trả nhanh nhất',
    transferCols: ['Người trả', 'Người nhận', 'Số tiền'],
    rates: ['Tiền tệ', (b) => `1 đơn vị = ? ${b}`],
    ratesNote: (b) => `Số tiền ở sheet Lịch trình & chi phí được quy đổi về ${b} theo bảng này — sửa tỉ giá, cả file tự tính lại.`,
    master: ['Trạng thái', 'Loại dòng', 'Cách tính tiền', 'Loại chi phí', 'Tiền tệ', 'Thành viên'],
    costTypes: ['Vé máy bay', 'Lưu trú', 'Di chuyển', 'Ăn uống', 'Tham quan', 'Mua sắm', 'SIM / Internet', 'Bảo hiểm', 'Giấy tờ', 'Khác'],
  },
  en: {
    sheets: { plan: 'Itinerary & costs', settle: 'Settle up', rates: 'Rates', master: 'Master data' },
    title: (t) => `ITINERARY & COSTS | ${t}`,
    cols: {
      date: 'Date', time: 'Time', city: 'City', act: 'Activity / cost', status: 'Status',
      est: 'Estimated', actual: 'Actual', diff: 'Difference', type: 'Row type', amount: 'Original amount', cur: 'Currency',
      payer: 'Paid by', payee: 'Paid to', split: 'Split', costType: 'Cost type', maps: 'Google Maps', note: 'Note',
    },
    share: (n) => `${n}'s share`,
    undated: 'Not scheduled',
    day: (n) => `Day ${n}`,
    other: 'Other costs (not linked to the itinerary)',
    repay: 'Repayments between members',
    dayTotal: 'Day total',
    sectionTotal: 'Total',
    total: 'TRIP TOTAL',
    openMap: 'Open map',
    kinds: { item: 'Itinerary', estimate: 'Estimate', actual: 'Actual', payment: 'Repayment' },
    status: ['To do', 'In progress', 'Done', 'Skipped'],
    split: { all: 'Whole group', only: (n) => `Only - ${n}`, pick: 'Picked people' },
    perPerson: (n) => `× ${n} people`,
    settle: ['Member', 'Paid', 'Own share', 'Repaid', 'Received back', 'Balance (+ gets back / − owes)'],
    transfers: 'Quickest way to settle',
    transferCols: ['From', 'To', 'Amount'],
    rates: ['Currency', (b) => `1 unit = ? ${b}`],
    ratesNote: (b) => `Amounts on the Itinerary & costs sheet are converted to ${b} with this table — change a rate and the whole file recalculates.`,
    master: ['Status', 'Row type', 'Split', 'Cost type', 'Currency', 'Member'],
    costTypes: ['Flights', 'Accommodation', 'Transport', 'Food & drinks', 'Sightseeing', 'Shopping', 'SIM / Internet', 'Insurance', 'Paperwork', 'Other'],
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
 * @param opts   { lang, transfers: [{from, to, amount}] (uids), placeName(place) }
 */
export function buildTripWorkbook(trip, plan = [], costs = [], opts = {}) {
  const L = LABELS[opts.lang] || LABELS.vi;
  const S = L.sheets;
  const base = trip.currency || 'VND';
  const money = base === 'VND' ? '#,##0' : '#,##0.00';
  const memberIds = trip.memberIds?.length ? trip.memberIds : Object.keys(trip.members || {});
  const nameOf = (uid) => trip.members?.[uid]?.name || uid || '';
  const group = memberIds.length > 1;
  const pname = opts.placeName || ((p) => p?.name || '');
  const rateOf = (cur) => (!cur || cur === base ? 1 : Number(trip.rates?.[cur]) || 0);
  const peopleOf = (c) => {
    const among = (c.splitAmong || []).filter(Boolean);
    return c.per === 'person' ? Math.max((among.length ? among : memberIds).length, 1) : 1;
  };
  const convOf = (c) => round2((Number(c.amount) || 0) * peopleOf(c) * rateOf(c.currency || base));

  // ---------- Columns ----------
  const keys = ['date', 'time', 'city', 'act', 'status', 'est', 'actual', 'diff', ...(group ? memberIds.map((id) => `share:${id}`) : []), 'type', 'amount', 'cur', ...(group ? ['payer', 'payee', 'split'] : []), 'costType', 'maps', 'note'];
  const C = Object.fromEntries(keys.map((k, i) => [k, i + 1]));
  const X = (k) => col(C[k]); // column letter
  const width = keys.length;
  const headText = (k) => (k.startsWith('share:') ? L.share(nameOf(k.slice(6))) : k === 'est' || k === 'actual' ? `${L.cols[k]} (${base})` : L.cols[k]);
  const widths = { date: 12, time: 7, city: 14, act: 36, status: 11, est: 13, actual: 13, diff: 13, type: 11, amount: 13, cur: 8, payer: 13, payee: 13, split: 18, costType: 15, maps: 12, note: 32 };

  const rows = [];
  const blank = (style = {}) => Array.from({ length: width }, () => ({ value: '', ...style }));
  const put = (row, k, cell) => (row[C[k] - 1] = cell);
  rows.push([{ value: L.title(trip.name || ''), fontWeight: 'bold', fontSize: 14, columnSpan: width }, ...Array(width - 1).fill(null)]);
  rows.push(keys.map((k) => ({ value: headText(k), ...HEAD })));
  const FIRST = 3; // first data row

  // ---------- Which costs belong to which plan item ----------
  const sortedPlan = [...plan].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '') || (a.time || '99').localeCompare(b.time || '99') || (a.order ?? 0) - (b.order ?? 0),
  );
  const planIds = new Set(sortedPlan.map((p) => p.id));
  const byDate = (x, y) => (x.date || '').localeCompare(y.date || '') || (x.order ?? 0) - (y.order ?? 0);
  const estimates = costs.filter((c) => c.type === 'estimate').sort(byDate);
  const actuals = costs.filter((c) => c.type === 'actual').sort(byDate);
  const payments = costs.filter((c) => c.type === 'payment').sort(byDate);
  const estPlan = new Map(estimates.map((e) => [e.id, e.planItemId && planIds.has(e.planItemId) ? e.planItemId : null]));
  const planOfActual = (a) => (a.planItemId && planIds.has(a.planItemId) ? a.planItemId : (a.estimateId && estPlan.get(a.estimateId)) || null);
  const costsOfPlan = new Map(sortedPlan.map((p) => [p.id, []]));
  estimates.forEach((e) => estPlan.get(e.id) && costsOfPlan.get(estPlan.get(e.id)).push(e));
  actuals.forEach((a) => planOfActual(a) && costsOfPlan.get(planOfActual(a)).push(a));
  // Unlinked costs: each estimate followed by its actuals, then actuals without an estimate
  const unlinked = [];
  estimates.filter((e) => !estPlan.get(e.id)).forEach((e) => unlinked.push(e, ...actuals.filter((a) => !planOfActual(a) && a.estimateId === e.id)));
  const unlinkedEst = new Set(unlinked.filter((c) => c.type === 'estimate').map((c) => c.id));
  actuals.filter((a) => !planOfActual(a) && !unlinkedEst.has(a.estimateId)).forEach((a) => unlinked.push(a));

  const splitLabel = (c) => {
    const among = (c.splitAmong || []).filter(Boolean);
    if (!among.length || among.length === memberIds.length) return L.split.all;
    if (among.length === 1) return L.split.only(nameOf(among[0]));
    return `${L.split.pick}: ${among.map(nameOf).join(', ')}`;
  };
  const statusOf = (p) => (p.skipped ? L.status[3] : p.done ? L.status[2] : L.status[0]);
  const RATES = q(S.rates);

  /** One cost line (estimate / actual / repayment) right under its plan item. Returns converted values. */
  const costRow = (c) => {
    const r = rows.length + 1;
    const kind = c.type;
    const among = (c.splitAmong || []).filter(Boolean);
    const parts = among.length ? among : memberIds;
    const people = peopleOf(c);
    const amount = (Number(c.amount) || 0) * people; // whole-group amount in the original currency
    const cur = c.currency || base;
    const value = convOf(c);
    const conv = `=${X('amount')}${r}*IFERROR(VLOOKUP(${X('cur')}${r},${RATES}!$A:$B,2,FALSE),0)`;
    const row = blank(SUB);
    put(row, 'date', dateCell(c.date, SUB));
    put(row, 'act', { value: `   ↳ ${c.title || ''}`, wrap: true, ...SUB });
    put(row, 'type', { value: L.kinds[kind], ...SUB });
    put(row, 'amount', { value: amount, type: Number, format: cur === 'VND' ? '#,##0' : '#,##0.00', ...SUB });
    put(row, 'cur', { value: cur, ...SUB });
    put(row, kind === 'estimate' ? 'est' : 'actual', fx(conv, value, money, SUB));
    const shares = {};
    if (group) {
      if (kind !== 'estimate') put(row, 'payer', { value: nameOf(c.paidBy), ...SUB });
      if (kind === 'payment') put(row, 'payee', { value: nameOf(c.payTo), ...SUB });
      else put(row, 'split', { value: splitLabel(c), ...SUB });
      if (kind === 'actual')
        memberIds.forEach((id) => {
          const inIt = !among.length || among.includes(id);
          shares[id] = inIt ? round2(value / parts.length) : 0;
          put(row, `share:${id}`, inIt ? fx(`=${X('actual')}${r}/${parts.length}`, shares[id], money, SUB) : { value: 0, type: Number, format: money, ...SUB });
        });
    }
    put(row, 'costType', { value: c.costType || '', ...SUB });
    put(row, 'note', { value: [people > 1 ? `${c.amount} ${cur} ${L.perPerson(people)}` : '', c.note || ''].filter(Boolean).join(' · '), wrap: true, ...SUB });
    rows.push(row);
    return { kind, c, est: kind === 'estimate' ? value : 0, actual: kind === 'actual' ? value : 0, shares };
  };

  /** Totals of typed rows in a range (SUMIFS on the row type, so plan item rows never count twice) */
  const totalsRow = (label, from, to, lines, style) => {
    const r = rows.length + 1;
    const row = blank(style);
    put(row, 'act', { value: label, ...style });
    const est = round2(lines.reduce((s, x) => s + x.est, 0));
    const act = round2(lines.reduce((s, x) => s + x.actual, 0));
    const rng = (k) => `${X(k)}${from}:${X(k)}${Math.max(to, from)}`;
    const sumif = (k, kind) => `=SUMIFS(${rng(k)},${rng('type')},${str(L.kinds[kind])})`;
    put(row, 'est', fx(sumif('est', 'estimate'), est, money, style));
    put(row, 'actual', fx(sumif('actual', 'actual'), act, money, style));
    put(row, 'diff', fx(`=${X('actual')}${r}-${X('est')}${r}`, round2(act - est), money, style));
    if (group) memberIds.forEach((id) => put(row, `share:${id}`, fx(sumif(`share:${id}`, 'actual'), round2(lines.reduce((s, x) => s + (x.shares[id] || 0), 0)), money, style)));
    rows.push(row);
  };
  const sectionHead = (label, date) => {
    const row = blank(DAY);
    put(row, 'date', date ? dateCell(date, DAY) : { value: '', ...DAY });
    put(row, 'act', { value: label, ...DAY });
    rows.push(row);
  };

  // ---------- Days (undated items first) ----------
  const days = [];
  for (const p of sortedPlan) {
    const k = p.date || '';
    if (!days.length || days[days.length - 1].date !== k) days.push({ date: k, items: [] });
    days[days.length - 1].items.push(p);
  }
  days.sort((x, y) => (x.date ? 1 : 0) - (y.date ? 1 : 0) || x.date.localeCompare(y.date));
  const allLines = [];
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
      if (url) put(row, 'maps', fx(`=HYPERLINK(${str(url)},${str(L.openMap)})`, L.openMap, undefined, { color: '#1155CC' }));
      put(row, 'note', { value: p.note || '', wrap: true });
      rows.push(row);
      const lines = costsOfPlan.get(p.id).map(costRow);
      dayLines.push(...lines);
      if (lines.length) {
        // The plan item row adds up the cost lines right under it
        const a = ir + 1;
        const b = ir + lines.length;
        const sum = (k, v) => fx(`=SUM(${X(k)}${a}:${X(k)}${b})`, v, money, ITEM);
        const est = round2(lines.reduce((s, x) => s + x.est, 0));
        const act = round2(lines.reduce((s, x) => s + x.actual, 0));
        put(row, 'est', sum('est', est));
        put(row, 'actual', sum('actual', act));
        put(row, 'diff', fx(`=${X('actual')}${ir}-${X('est')}${ir}`, round2(act - est), money, ITEM));
        if (group) memberIds.forEach((id) => put(row, `share:${id}`, sum(`share:${id}`, round2(lines.reduce((s, x) => s + (x.shares[id] || 0), 0)))));
      }
    }
    totalsRow(d.date ? L.dayTotal : L.sectionTotal, from, rows.length, dayLines, DAY);
    allLines.push(...dayLines);
  }
  if (unlinked.length) {
    sectionHead(L.other);
    const from = rows.length + 1;
    const lines = unlinked.map(costRow);
    totalsRow(L.sectionTotal, from, rows.length, lines, DAY);
    allLines.push(...lines);
  }
  if (payments.length) {
    sectionHead(L.repay);
    payments.forEach(costRow);
  }
  totalsRow(L.total, FIRST, rows.length, allLines, TOTAL);

  const last = rows.length;
  const planSheet = {
    sheet: S.plan,
    data: rows,
    columns: keys.map((k) => ({ width: k.startsWith('share:') ? 13 : widths[k] })),
    stickyRowsCount: 2,
  };

  // ---------- Settle up (groups) ----------
  let settleSheet = null;
  if (group) {
    const P = q(S.plan);
    const span = (k) => `${P}!$${X(k)}$${FIRST}:$${X(k)}$${last}`;
    const typeIs = (kind) => `${span('type')},${str(L.kinds[kind])}`;
    const sum = (list) => round2(list.reduce((s, c) => s + convOf(c), 0));
    const sr = [L.settle.map((v) => ({ value: v, ...HEAD }))];
    memberIds.forEach((id) => {
      const r = sr.length + 1;
      const who = str(nameOf(id));
      const paid = sum(actuals.filter((c) => c.paidBy === id));
      const share = round2(allLines.reduce((s, x) => s + (x.shares[id] || 0), 0));
      const sent = sum(payments.filter((c) => c.paidBy === id));
      const got = sum(payments.filter((c) => c.payTo === id));
      sr.push([
        { value: nameOf(id), fontWeight: 'bold' },
        fx(`=SUMIFS(${span('actual')},${span('payer')},${who},${typeIs('actual')})`, paid, money),
        fx(`=SUMIFS(${span(`share:${id}`)},${typeIs('actual')})`, share, money),
        fx(`=SUMIFS(${span('actual')},${span('payer')},${who},${typeIs('payment')})`, sent, money),
        fx(`=SUMIFS(${span('actual')},${span('payee')},${who},${typeIs('payment')})`, got, money),
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
  const lists = [L.status, Object.values(L.kinds), [L.split.all, ...memberIds.map((id) => L.split.only(nameOf(id))), L.split.pick], L.costTypes, currencies, memberIds.map(nameOf)];
  const masterRows = Math.max(...lists.map((x) => x.length));
  const masterSheet = {
    sheet: S.master,
    data: [L.master.map((v) => ({ value: v, ...HEAD })), ...Array.from({ length: masterRows }, (_, i) => lists.map((l) => l[i] ?? ''))],
    columns: L.master.map(() => ({ width: 18 })),
    stickyRowsCount: 1,
  };
  const listRef = (i) => `${q(S.master)}!$${col(i + 1)}$2:$${col(i + 1)}$${lists[i].length + 1}`;
  const upTo = last + 200; // room for rows added later in Excel
  planSheet.validations = [
    { sqref: `${X('status')}${FIRST}:${X('status')}${upTo}`, list: listRef(0) },
    { sqref: `${X('type')}${FIRST}:${X('type')}${upTo}`, list: listRef(1) },
    { sqref: `${X('cur')}${FIRST}:${X('cur')}${upTo}`, list: listRef(4) },
    { sqref: `${X('costType')}${FIRST}:${X('costType')}${upTo}`, list: listRef(3) },
    ...(group
      ? [
          { sqref: `${X('payer')}${FIRST}:${X('payee')}${upTo}`, list: listRef(5) },
          { sqref: `${X('split')}${FIRST}:${X('split')}${upTo}`, list: listRef(2) },
        ]
      : []),
  ];

  const sheets = [planSheet, settleSheet, ratesSheet, masterSheet].filter(Boolean);
  sheets.forEach((s) => (s.formulaValues = formulaValuesOf(s.data)));
  return { sheets, columns: C, labels: L };
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
