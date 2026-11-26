/** REQ-019: đổi nội dung 1 việc trong checklist — giữ nguyên trạng thái đã tick, người lo, phạm vi */
export const CHECK_ITEM_MAX = 120;
export function renameCheckItem(items, id, text) {
  const v = String(text || '').trim().slice(0, CHECK_ITEM_MAX);
  if (!v) return null; // để trống → không lưu (muốn xoá thì dùng nút ✕)
  let changed = false;
  const next = (items || []).map((x) => {
    if (x.id !== id || x.text === v) return x;
    changed = true;
    return { ...x, text: v };
  });
  return changed ? next : null;
}

/**
 * REQ-033: due day of a checklist item. `due` is 'before' (before the trip) or a YYYY-MM-DD date.
 * tripDays() lists the trip's days so the picker can offer "Day 1 · 10/11", "Day 2 · 11/11"…
 */
export function tripDays(start, end, max = 60) {
  if (!start) return [];
  const out = [];
  const d = new Date(`${start}T00:00:00Z`);
  const stop = new Date(`${end || start}T00:00:00Z`);
  for (let i = 1; d <= stop && i <= max; i++) {
    out.push({ day: i, date: d.toISOString().slice(0, 10) });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Set (or clear with null / '') the due day of one item; returns the new item list */
export function setItemDue(items, id, due) {
  return (items || []).map((x) => {
    if (x.id !== id) return x;
    const { due: _old, ...rest } = x; // eslint-disable-line no-unused-vars
    return due ? { ...rest, due } : rest;
  });
}

/** 'overdue' | 'today' | '' for an item that is not done yet (a 'before' item is due on the first trip day) */
export function dueStatus(due, done, today, tripStart) {
  if (!due || done) return '';
  const date = due === 'before' ? tripStart : due;
  if (!date) return '';
  if (due === 'before') return today >= date ? 'overdue' : '';
  return date < today ? 'overdue' : date === today ? 'today' : '';
}

/** Which trip day a due date falls on (0 when outside the trip) */
export const dueDayNumber = (due, start, end) => {
  const days = tripDays(start, end);
  return days.find((x) => x.date === due)?.day || 0;
};

/**
 * Bug #108 / #104: names of the people who ticked an "everyone ticks" item, counting only current trip members
 * (a tick stays stored when someone leaves the trip). With no member list every tick counts.
 */
export function memberTicks(doneMap, memberIds = []) {
  const ids = memberIds || [];
  return Object.entries(doneMap || {})
    .filter(([uid, name]) => name && (!ids.length || ids.includes(uid)))
    .map(([, name]) => name);
}
