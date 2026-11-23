/**
 * REQ-026: trip itinerary + costs as an Excel workbook.
 * buildTripWorkbook() is pure (no browser APIs) so it can be unit-tested in Node; it returns the sheets
 * in write-excel-file's multi-sheet format plus a `validations` list per sheet (drop-downs, see xlsxValidation.js).
 *
 * Sheets: Itinerary · Costs · Settle up (groups only) · Rates · Places · Master data.
 * Every converted amount is a formula that looks up the Rates sheet, and the itinerary sums the Costs sheet
 * by item code, so editing a rate or a cost in Excel updates the whole file.
 */

const LABELS = {
  vi: {
    sheets: { plan: 'Lịch trình', costs: 'Chi phí', settle: 'Chia tiền', rates: 'Tỉ giá', places: 'Địa điểm', master: 'Master data' },
    title: (t) => `LỊCH TRÌNH & CHI PHÍ | ${t}`,
    plan: ['Ngày', 'Giờ', 'Thành phố', 'Hoạt động / địa điểm', 'Dự kiến', 'Thực tế', 'Chênh lệch', 'Trạng thái', 'Google Maps', 'Ghi chú', 'Mã'],
    share: (n) => `Phần của ${n}`,
    undated: 'Chưa xếp ngày',
    day: (n) => `Ngày ${n}`,
    other: 'Chi phí khác (không gắn lịch trình)',
    dayTotal: 'Cộng ngày',
    sectionTotal: 'Cộng',
    total: 'TỔNG CẢ CHUYẾN',
    openMap: 'Mở bản đồ',
    costs: ['Mã lịch trình', 'Mục lịch trình', 'Loại dòng', 'Ngày', 'Khoản', 'Số tiền', 'Tiền tệ', 'Quy đổi', 'Người trả', 'Người nhận', 'Cách tính tiền', 'Loại chi phí', 'Ghi chú'],
    kinds: { estimate: 'Dự kiến', actual: 'Thực tế', payment: 'Trả lại' },
    status: ['Chưa làm', 'Đang làm', 'Xong', 'Không đi'],
    split: { all: 'Cả nhóm', only: (n) => `Riêng - ${n}`, pick: 'Chọn người' },
    perPerson: (n) => `× ${n} người`,
    settle: ['Thành viên', 'Đã trả', 'Phần của mình', 'Đã chuyển trả', 'Đã nhận lại', 'Còn lại (+ nhận lại / − cần trả)'],
    transfers: 'Cách trả nhanh nhất',
    transferCols: ['Người trả', 'Người nhận', 'Số tiền'],
    rates: ['Tiền tệ', (b) => `1 đơn vị = ? ${b}`],
    ratesNote: (b) => `Số tiền ở sheet Chi phí được quy đổi về ${b} theo bảng này — sửa tỉ giá, cả file tự tính lại.`,
    places: ['Ngày', 'Thành phố', 'Địa điểm', 'Trạng thái', 'Google Maps', 'Ghi chú'],
    master: ['Trạng thái', 'Loại dòng', 'Cách tính tiền', 'Loại chi phí', 'Tiền tệ', 'Thành viên'],
    costTypes: ['Vé máy bay', 'Lưu trú', 'Di chuyển', 'Ăn uống', 'Tham quan', 'Mua sắm', 'SIM / Internet', 'Bảo hiểm', 'Giấy tờ', 'Khác'],
  },
  en: {
    sheets: { plan: 'Itinerary', costs: 'Costs', settle: 'Settle up', rates: 'Rates', places: 'Places', master: 'Master data' },
    title: (t) => `ITINERARY & COSTS | ${t}`,
    plan: ['Date', 'Time', 'City', 'Activity / place', 'Estimated', 'Actual', 'Difference', 'Status', 'Google Maps', 'Note', 'Code'],
    share: (n) => `${n}'s share`,
    undated: 'Not scheduled',
    day: (n) => `Day ${n}`,
    other: 'Other costs (not linked to the itinerary)',
    dayTotal: 'Day total',
    sectionTotal: 'Total',
    total: 'TRIP TOTAL',
    openMap: 'Open map',
    costs: ['Itinerary code', 'Itinerary item', 'Row type', 'Date', 'Item', 'Amount', 'Currency', 'Converted', 'Paid by', 'Paid to', 'Split', 'Cost type', 'Note'],
    kinds: { estimate: 'Estimate', actual: 'Actual', payment: 'Repayment' },
    status: ['To do', 'In progress', 'Done', 'Skipped'],
    split: { all: 'Whole group', only: (n) => `Only - ${n}`, pick: 'Picked people' },
    perPerson: (n) => `× ${n} people`,
    settle: ['Member', 'Paid', 'Own share', 'Repaid', 'Received back', 'Balance (+ gets back / − owes)'],
    transfers: 'Quickest way to settle',
    transferCols: ['From', 'To', 'Amount'],
    rates: ['Currency', (b) => `1 unit = ? ${b}`],
    ratesNote: (b) => `Amounts on the Costs sheet are converted to ${b} with this table — change a rate and the whole file recalculates.`,
    places: ['Date', 'City', 'Place', 'Status', 'Google Maps', 'Note'],
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

const HEAD = { fontWeight: 'bold', backgroundColor: '#FFE38A', wrap: true, alignVertical: 'center' };
const DAY = { fontWeight: 'bold', backgroundColor: '#FFF6D6' };
const TOTAL = { fontWeight: 'bold', backgroundColor: '#FFE38A' };

const dateCell = (iso, style = {}) => (iso ? { value: new Date(`${iso}T00:00:00Z`), type: Date, format: 'dd/mm/yyyy', ...style } : { value: '', ...style });
const formula = (value, money, style = {}) => ({ value, type: 'Formula', format: money, ...style });
const mapsUrl = (p) =>
  p?.gmapsLink ||
  (Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)) && (p.lat || p.lng)
    ? `https://www.google.com/maps/search/?api=1&query=${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`
    : p?.name
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.name, p.city].filter(Boolean).join(' '))}`
      : '');

/**
 * @param trip   { name, currency, rates, memberIds, members }
 * @param plan   plan items (removed ones already filtered out)
 * @param costs  estimates / actuals / repayments
 * @param opts   { lang, transfers: [{from, to, amount}] (uids), placeName(place) }
 */
export function buildTripWorkbook(trip, plan = [], costs = [], opts = {}) {
  const L = LABELS[opts.lang] || LABELS.vi;
  const base = trip.currency || 'VND';
  const money = base === 'VND' ? '#,##0' : '#,##0.00';
  const memberIds = trip.memberIds?.length ? trip.memberIds : Object.keys(trip.members || {});
  const nameOf = (uid) => trip.members?.[uid]?.name || uid || '';
  const group = memberIds.length > 1;
  const pname = opts.placeName || ((p) => p?.name || '');
  const S = L.sheets;

  // ---------- Item codes: plan items P1…, unlinked estimates E1…, unlinked actuals A1… ----------
  const sortedPlan = [...plan].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '') || (a.time || '99').localeCompare(b.time || '99') || (a.order ?? 0) - (b.order ?? 0),
  );
  const codeOfPlan = new Map(sortedPlan.map((p, i) => [p.id, `P${i + 1}`]));
  const estimates = costs.filter((c) => c.type === 'estimate');
  const actuals = costs.filter((c) => c.type === 'actual');
  const payments = costs.filter((c) => c.type === 'payment');
  const codeOfCost = new Map();
  const others = []; // itinerary rows for costs not linked to a plan item
  let e = 0;
  let a = 0;
  for (const c of estimates) {
    if (c.planItemId && codeOfPlan.has(c.planItemId)) codeOfCost.set(c.id, codeOfPlan.get(c.planItemId));
    else {
      const code = `E${++e}`;
      codeOfCost.set(c.id, code);
      others.push({ code, title: c.title, date: c.date || '' });
    }
  }
  for (const c of actuals) {
    if (c.planItemId && codeOfPlan.has(c.planItemId)) codeOfCost.set(c.id, codeOfPlan.get(c.planItemId));
    else if (c.estimateId && codeOfCost.has(c.estimateId)) codeOfCost.set(c.id, codeOfCost.get(c.estimateId));
    else {
      const code = `A${++a}`;
      codeOfCost.set(c.id, code);
      others.push({ code, title: c.title, date: c.date || '' });
    }
  }
  const titleOfCode = (code) => {
    if (code.startsWith('P')) {
      const p = sortedPlan[Number(code.slice(1)) - 1];
      return pname(p?.place);
    }
    return others.find((o) => o.code === code)?.title || '';
  };

  // ---------- Costs sheet ----------
  const CC = L.costs; // A..M, then one share column per member (groups)
  const shareCol0 = CC.length + 1; // first member share column number
  const costsHead = [...CC, ...(group ? memberIds.map((id) => L.share(nameOf(id))) : [])].map((v) => ({ value: v, ...HEAD }));
  const splitLabel = (c) => {
    const among = (c.splitAmong || []).filter(Boolean);
    if (!among.length || among.length === memberIds.length) return L.split.all;
    if (among.length === 1) return L.split.only(nameOf(among[0]));
    return `${L.split.pick}: ${among.map(nameOf).join(', ')}`;
  };
  const costRows = [];
  const pushCost = (c, kind) => {
    const r = costRows.length + 2; // header is row 1
    const among = (c.splitAmong || []).filter(Boolean);
    const parts = among.length ? among : memberIds;
    const people = kind === 'estimate' ? (c.per === 'person' ? parts.length || 1 : 1) : c.per === 'person' ? Math.max(parts.length, 1) : 1;
    const amount = (Number(c.amount) || 0) * people; // group total in the original currency
    const cur = c.currency || base;
    const code = kind === 'payment' ? '' : codeOfCost.get(c.id) || '';
    const note = [c.per === 'person' && people > 1 ? `${c.amount} ${cur} ${L.perPerson(people)}` : '', c.note || ''].filter(Boolean).join(' · ');
    const row = [
      code,
      code ? titleOfCode(code) : '',
      L.kinds[kind],
      dateCell(c.date),
      c.title || '',
      { value: amount, type: Number, format: cur === 'VND' ? '#,##0' : '#,##0.00' },
      cur,
      formula(`=F${r}*IFERROR(VLOOKUP(G${r},${q(S.rates)}!$A:$B,2,FALSE),0)`, money),
      kind === 'payment' || kind === 'actual' ? nameOf(c.paidBy) : '',
      kind === 'payment' ? nameOf(c.payTo) : '',
      kind === 'payment' ? '' : splitLabel(c),
      c.costType || '',
      note,
    ];
    if (group)
      memberIds.forEach((id) => {
        const inIt = kind !== 'payment' && (!among.length || among.includes(id));
        row.push(inIt ? formula(`=H${r}/${parts.length || 1}`, money) : { value: 0, type: Number, format: money });
      });
    costRows.push(row);
  };
  const byDate = (x, y) => (x.date || '').localeCompare(y.date || '') || (x.order ?? 0) - (y.order ?? 0);
  [...estimates].sort(byDate).forEach((c) => pushCost(c, 'estimate'));
  [...actuals].sort(byDate).forEach((c) => pushCost(c, 'actual'));
  [...payments].sort(byDate).forEach((c) => pushCost(c, 'payment'));
  const costsSheet = {
    sheet: S.costs,
    data: [costsHead, ...costRows],
    columns: [{ width: 9 }, { width: 26 }, { width: 11 }, { width: 12 }, { width: 30 }, { width: 13 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 16 }, { width: 28 }, ...(group ? memberIds.map(() => ({ width: 14 })) : [])],
    stickyRowsCount: 1,
  };

  // ---------- Itinerary sheet ----------
  // Columns: Date, Time, City, Activity, Estimated, Actual, Difference, [shares…], Status, Maps, Note, Code
  const nShare = group ? memberIds.length : 0;
  const C = { date: 1, time: 2, city: 3, act: 4, est: 5, actual: 6, diff: 7, share0: 8, status: 8 + nShare, maps: 9 + nShare, note: 10 + nShare, code: 11 + nShare };
  const width = C.code;
  const H = L.plan;
  const head = [H[0], H[1], H[2], H[3], `${H[4]} (${base})`, `${H[5]} (${base})`, H[6], ...(group ? memberIds.map((id) => L.share(nameOf(id))) : []), H[7], H[8], H[9], H[10]].map((v) => ({ value: v, ...HEAD }));
  const CS = q(S.costs);
  const sumCosts = (codeRef, kind, sumCol = 'H') => `SUMIFS(${CS}!$${sumCol}:$${sumCol},${CS}!$A:$A,${codeRef},${CS}!$C:$C,${str(L.kinds[kind])})`;
  const rows = [[{ value: L.title(trip.name || ''), fontWeight: 'bold', fontSize: 14, columnSpan: width }, ...Array(width - 1).fill(null)], head];
  const itemRows = []; // row numbers of item rows (for the grand total)
  const statusOf = (p) => (p.skipped ? L.status[3] : p.done ? L.status[2] : L.status[0]);
  const itemRow = (code, cells) => {
    const r = rows.length + 1;
    const ref = `$${col(C.code)}${r}`;
    const row = Array(width).fill(null).map(() => ({ value: '' }));
    Object.assign(row[C.date - 1], cells.date || {});
    row[C.time - 1] = { value: cells.time || '' };
    row[C.city - 1] = { value: cells.city || '' };
    row[C.act - 1] = { value: cells.act || '', wrap: true };
    row[C.est - 1] = formula(`=${sumCosts(ref, 'estimate')}`, money);
    row[C.actual - 1] = formula(`=${sumCosts(ref, 'actual')}`, money);
    row[C.diff - 1] = formula(`=${col(C.actual)}${r}-${col(C.est)}${r}`, money);
    if (group) memberIds.forEach((_, i) => (row[C.share0 - 1 + i] = formula(`=${sumCosts(ref, 'actual', col(shareCol0 + i))}`, money)));
    row[C.status - 1] = { value: cells.status || '' };
    row[C.maps - 1] = cells.url ? formula(`=HYPERLINK(${str(cells.url)},${str(L.openMap)})`, undefined, { color: '#1155CC' }) : { value: '' };
    row[C.note - 1] = { value: cells.note || '', wrap: true };
    row[C.code - 1] = { value: code, color: '#8A7F72' };
    rows.push(row);
    itemRows.push(r);
    return r;
  };
  const subtotalRow = (label, first, last, style = DAY) => {
    const r = rows.length + 1;
    const row = Array(width).fill(null).map(() => ({ value: '', ...style }));
    row[C.act - 1] = { value: label, ...style };
    const sumCol = (c) => (last >= first ? formula(`=SUM(${col(c)}${first}:${col(c)}${last})`, money, style) : { value: 0, type: Number, ...style });
    row[C.est - 1] = sumCol(C.est);
    row[C.actual - 1] = sumCol(C.actual);
    row[C.diff - 1] = formula(`=${col(C.actual)}${r}-${col(C.est)}${r}`, money, style);
    if (group) memberIds.forEach((_, i) => (row[C.share0 - 1 + i] = sumCol(C.share0 + i)));
    rows.push(row);
  };
  const sectionHead = (cells) => {
    const row = Array(width).fill(null).map(() => ({ value: '', ...DAY }));
    row[C.date - 1] = { ...DAY, ...cells.date };
    row[C.act - 1] = { value: cells.label || '', ...DAY };
    rows.push(row);
  };

  // Plan items grouped by day; undated items first
  const days = [];
  for (const p of sortedPlan) {
    const k = p.date || '';
    if (!days.length || days[days.length - 1].date !== k) days.push({ date: k, items: [] });
    days[days.length - 1].items.push(p);
  }
  days.sort((x, y) => (x.date ? 1 : 0) - (y.date ? 1 : 0) || x.date.localeCompare(y.date));
  days.forEach((d) => {
    sectionHead({ date: d.date ? dateCell(d.date) : { value: '' }, label: d.date ? L.day(days.filter((x) => x.date).indexOf(d) + 1) : L.undated });
    const first = rows.length + 1;
    d.items.forEach((p) =>
      itemRow(codeOfPlan.get(p.id), {
        date: d.date ? dateCell(d.date) : {},
        time: p.time || '',
        city: p.place?.city || '',
        act: pname(p.place),
        status: statusOf(p),
        url: mapsUrl(p.place),
        note: p.note || '',
      }),
    );
    subtotalRow(d.date ? L.dayTotal : L.sectionTotal, first, rows.length);
  });
  if (others.length) {
    sectionHead({ label: L.other });
    const first = rows.length + 1;
    others.forEach((o) => itemRow(o.code, { date: o.date ? dateCell(o.date) : {}, act: o.title }));
    subtotalRow(L.sectionTotal, first, rows.length);
  }
  // Grand total straight from the Costs sheet, so it always matches even if rows are deleted
  {
    const r = rows.length + 1;
    const row = Array(width).fill(null).map(() => ({ value: '', ...TOTAL }));
    row[C.act - 1] = { value: L.total, ...TOTAL };
    const all = (kind, sumCol = 'H') => `=SUMIFS(${CS}!$${sumCol}:$${sumCol},${CS}!$C:$C,${str(L.kinds[kind])})`;
    row[C.est - 1] = formula(all('estimate'), money, TOTAL);
    row[C.actual - 1] = formula(all('actual'), money, TOTAL);
    row[C.diff - 1] = formula(`=${col(C.actual)}${r}-${col(C.est)}${r}`, money, TOTAL);
    if (group) memberIds.forEach((_, i) => (row[C.share0 - 1 + i] = formula(all('actual', col(shareCol0 + i)), money, TOTAL)));
    rows.push(row);
  }
  const planSheet = {
    sheet: S.plan,
    data: rows,
    columns: [{ width: 12 }, { width: 8 }, { width: 14 }, { width: 34 }, { width: 13 }, { width: 13 }, { width: 13 }, ...(group ? memberIds.map(() => ({ width: 13 })) : []), { width: 11 }, { width: 12 }, { width: 30 }, { width: 6 }],
    stickyRowsCount: 2,
  };

  // ---------- Settle up (groups) ----------
  let settleSheet = null;
  if (group) {
    const sr = [[...L.settle].map((v) => ({ value: v, ...HEAD }))];
    memberIds.forEach((id, i) => {
      const r = sr.length + 1;
      const who = str(nameOf(id));
      sr.push([
        { value: nameOf(id), fontWeight: 'bold' },
        formula(`=SUMIFS(${CS}!$H:$H,${CS}!$I:$I,${who},${CS}!$C:$C,${str(L.kinds.actual)})`, money),
        formula(`=SUMIFS(${CS}!$${col(shareCol0 + i)}:$${col(shareCol0 + i)},${CS}!$C:$C,${str(L.kinds.actual)})`, money),
        formula(`=SUMIFS(${CS}!$H:$H,${CS}!$I:$I,${who},${CS}!$C:$C,${str(L.kinds.payment)})`, money),
        formula(`=SUMIFS(${CS}!$H:$H,${CS}!$J:$J,${who},${CS}!$C:$C,${str(L.kinds.payment)})`, money),
        formula(`=B${r}-C${r}+D${r}-E${r}`, money, { fontWeight: 'bold' }),
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
      ...currencies.map((c) => [c, { value: c === base ? 1 : Number(trip.rates?.[c]) || 0, type: Number, format: '#,##0.####' }]),
      [],
      [{ value: L.ratesNote(base), color: '#8A7F72' }],
    ],
    columns: [{ width: 12 }, { width: 20 }],
    stickyRowsCount: 1,
  };

  // ---------- Places ----------
  const placesSheet = {
    sheet: S.places,
    data: [
      L.places.map((v) => ({ value: v, ...HEAD })),
      ...sortedPlan.map((p) => [dateCell(p.date), p.place?.city || '', pname(p.place), statusOf(p), mapsUrl(p.place) ? formula(`=HYPERLINK(${str(mapsUrl(p.place))},${str(L.openMap)})`, undefined, { color: '#1155CC' }) : '', p.note || '']),
    ],
    columns: [{ width: 12 }, { width: 16 }, { width: 32 }, { width: 11 }, { width: 12 }, { width: 30 }],
    stickyRowsCount: 1,
  };

  // ---------- Master data (lists behind the drop-downs) ----------
  const lists = [
    L.status,
    Object.values(L.kinds),
    [L.split.all, ...memberIds.map((id) => L.split.only(nameOf(id))), L.split.pick],
    L.costTypes,
    currencies,
    memberIds.map(nameOf),
  ];
  const masterRows = Math.max(...lists.map((x) => x.length));
  const masterSheet = {
    sheet: S.master,
    data: [L.master.map((v) => ({ value: v, ...HEAD })), ...Array.from({ length: masterRows }, (_, i) => lists.map((l) => l[i] ?? ''))],
    columns: L.master.map(() => ({ width: 18 })),
    stickyRowsCount: 1,
  };
  const listRef = (i) => `${q(S.master)}!$${col(i + 1)}$2:$${col(i + 1)}$${lists[i].length + 1}`;

  // Drop-downs (data validation) — applied by xlsxValidation.js
  const lastPlan = rows.length;
  const lastCost = Math.max(costRows.length + 1, 2) + 200; // room for rows added later in Excel
  planSheet.validations = [{ sqref: `${col(C.status)}3:${col(C.status)}${lastPlan + 200}`, list: listRef(0) }];
  costsSheet.validations = [
    { sqref: `C2:C${lastCost}`, list: listRef(1) },
    { sqref: `G2:G${lastCost}`, list: listRef(4) },
    { sqref: `I2:J${lastCost}`, list: listRef(5) },
    { sqref: `L2:L${lastCost}`, list: listRef(3) },
  ];
  placesSheet.validations = [{ sqref: `D2:D${sortedPlan.length + 200}`, list: listRef(0) }];

  const sheets = [planSheet, costsSheet, settleSheet, ratesSheet, placesSheet, masterSheet].filter(Boolean);
  return { sheets, codeOfPlan, codeOfCost, labels: L };
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
