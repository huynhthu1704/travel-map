/**
 * So sánh chi phí dự kiến và thực tế (REQ-002) + sắp xếp thứ tự khoản chi (REQ-003).
 * Thuần JavaScript, không phụ thuộc React — các hàm tính tiền được truyền vào để dễ kiểm thử.
 */

/**
 * costs: toàn bộ khoản chi của chuyến
 * estTotal(c): tổng dự kiến cả nhóm của 1 khoản (đã quy đổi về tiền chính)
 * actTotal(c): tổng thực tế của 1 khoản (đã quy đổi)
 * Khoản thực tế được tính vào một dự kiến khi có estimateId trỏ tới dự kiến đó;
 * còn lại là "phát sinh ngoài dự kiến".
 */
export function compareCosts(costs, { estTotal, actTotal, eps = 0.5 }) {
  const estimates = sortByOrder(costs.filter((c) => c.type === 'estimate'));
  const actuals = costs.filter((c) => c.type === 'actual');
  const estIds = new Set(estimates.map((e) => e.id));
  const rows = estimates.map((e) => {
    const linked = actuals.filter((a) => a.estimateId === e.id);
    const planned = estTotal(e);
    const actual = linked.reduce((s, a) => s + actTotal(a), 0);
    const diff = linked.length ? actual - planned : null;
    const status = !linked.length ? 'pending' : diff > eps ? 'over' : diff < -eps ? 'under' : 'even';
    return { id: e.id, title: e.title, planned, actual, diff, status, linked };
  });
  const unplanned = sortByOrder(
    actuals.filter((a) => !a.estimateId || !estIds.has(a.estimateId)),
    (a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0),
  ).map((a) => ({ id: a.id, title: a.title, date: a.date || '', actual: actTotal(a) }));
  const planned = rows.reduce((s, r) => s + r.planned, 0);
  const actualPlanned = rows.reduce((s, r) => s + r.actual, 0);
  const unplannedTotal = unplanned.reduce((s, u) => s + u.actual, 0);
  const pending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.planned, 0);
  const actual = actualPlanned + unplannedTotal;
  return {
    rows,
    unplanned,
    totals: { planned, actualPlanned, unplanned: unplannedTotal, actual, diff: actual - planned, pending },
    max: Math.max(1, ...rows.map((r) => Math.max(r.planned, r.actual)), ...unplanned.map((u) => u.actual)),
  };
}

/** Sắp theo trường order (do người dùng kéo thả); khoản chưa có order đứng sau, theo fallback (mặc định giữ nguyên) */
export function sortByOrder(list, fallback = () => 0) {
  return list
    .map((x, i) => ({ x, i }))
    .sort((a, b) => {
      const oa = a.x.order;
      const ob = b.x.order;
      if (oa != null && ob != null && oa !== ob) return oa - ob;
      if (oa != null && ob == null) return -1;
      if (oa == null && ob != null) return 1;
      return fallback(a.x, b.x) || a.i - b.i;
    })
    .map((w) => w.x);
}

/** Thứ tự mới sau khi kéo: trả về các khoản cần ghi { id, order } (chỉ những khoản đổi vị trí / chưa có order) */
export function reorderPatch(list, nextIds) {
  const byId = new Map(list.map((x) => [x.id, x]));
  return nextIds.map((id, i) => ({ id, order: i, prev: byId.get(id)?.order })).filter((p) => p.prev !== p.order).map(({ id, order }) => ({ id, order }));
}

/** Di chuyển 1 phần tử tới vị trí to trong mảng id */
export function moveId(ids, id, to) {
  const rest = ids.filter((x) => x !== id);
  const k = Math.max(0, Math.min(to, rest.length));
  return [...rest.slice(0, k), id, ...rest.slice(k)];
}

/**
 * REQ-004: bảng chi phí gộp — mỗi dòng là 1 khoản (dự kiến, kèm các lần chi thực tế gắn với nó),
 * hoặc 1 khoản thực tế phát sinh ngoài dự kiến. Thứ tự theo order (kéo thả), mặc định theo lúc thêm.
 */
export function buildCostTable(costs, { estTotal, actTotal, eps = 0.5 }) {
  const estimates = costs.filter((c) => c.type === 'estimate');
  const actuals = costs.filter((c) => c.type === 'actual');
  const estIds = new Set(estimates.map((e) => e.id));
  const byDate = (a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0);
  const top = [...estimates, ...actuals.filter((a) => !a.estimateId || !estIds.has(a.estimateId))];
  const rows = sortByOrder(top, (a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map((c) => {
    if (c.type === 'estimate') {
      const linked = actuals.filter((a) => a.estimateId === c.id).sort(byDate);
      const planned = estTotal(c);
      const actual = linked.reduce((s, a) => s + actTotal(a), 0);
      const diff = linked.length ? actual - planned : null;
      return { id: c.id, kind: 'item', cost: c, actuals: linked, planned, actual, diff, status: !linked.length ? 'pending' : diff > eps ? 'over' : diff < -eps ? 'under' : 'even' };
    }
    const actual = actTotal(c);
    return { id: c.id, kind: 'extra', cost: c, actuals: [c], planned: null, actual, diff: actual, status: 'extra' };
  });
  const planned = rows.reduce((s, r) => s + (r.planned || 0), 0);
  const actual = rows.reduce((s, r) => s + r.actual, 0);
  const extra = rows.filter((r) => r.kind === 'extra').reduce((s, r) => s + r.actual, 0);
  const pending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.planned, 0);
  return { rows, totals: { planned, actual, extra, pending, diff: actual - planned } };
}
