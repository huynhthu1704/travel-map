import { createContext, useContext } from 'react';

/**
 * Quyền trong chuyến đi (REQ-001).
 * - Chủ chuyến luôn sửa được.
 * - Thành viên có trong trip.viewerIds là "chỉ xem": xem kế hoạch, chi phí, checklist nhưng không sửa.
 * - Người không phải thành viên không sửa được.
 */
export const isTripViewer = (trip, uid) => !!uid && uid !== trip?.ownerId && (trip?.viewerIds || []).includes(uid);
export const canEditTrip = (trip, uid) => !!uid && (trip?.memberIds || []).includes(uid) && !isTripViewer(trip, uid);

/** Đổi quyền 1 thành viên: trả về danh sách viewerIds mới (không bao giờ chứa chủ chuyến hay người không còn trong chuyến) */
export function setViewer(trip, uid, viewOnly) {
  const members = new Set(trip?.memberIds || []);
  const next = new Set((trip?.viewerIds || []).filter((id) => members.has(id) && id !== trip?.ownerId));
  if (viewOnly && uid !== trip?.ownerId && members.has(uid)) next.add(uid);
  else next.delete(uid);
  return [...next];
}

/** true = chuyến đang mở ở chế độ chỉ xem cho người dùng hiện tại (Kế hoạch, Chi phí, Checklist đọc giá trị này) */
export const TripReadOnly = createContext(false);
export const useTripReadOnly = () => useContext(TripReadOnly);

/** REQ-007: ai xem được chuyến — thành viên, hoặc bất kỳ ai khi chủ chuyến bật "ai có link đều xem được" */
export const canViewTrip = (trip, uid) => !!trip && ((!!uid && (trip.memberIds || []).includes(uid)) || trip.publicView === true);
/** Các tab người xem thấy: người xem bằng link không thấy Hành trình; Chi phí chỉ khi chủ chuyến cho phép */
export function visibleTripTabs(trip, uid) {
  const member = !!uid && (trip?.memberIds || []).includes(uid);
  if (member) return ['plan', 'costs', 'checklist', 'journey'];
  if (!canViewTrip(trip, uid)) return [];
  return ['plan', ...(trip.publicCosts ? ['costs'] : []), 'checklist'];
}

/**
 * REQ-012: địa điểm đã bị xoá khỏi kế hoạch thì cũng không hiện trong Hành trình (và số điểm dừng, tổng hợp).
 * planAll: mọi mục kế hoạch kể cả đã xoá (removed: true). Một địa điểm bị ẩn khi mọi mục của nó đều đã xoá.
 */
export function hideRemovedStops(stops, planAll) {
  const active = new Set();
  const removed = new Set();
  (planAll || []).forEach((it) => {
    const id = it.place?.id;
    if (!id) return;
    (it.removed ? removed : active).add(id);
  });
  return (stops || []).filter((s) => !s.place || active.has(s.place.id) || !removed.has(s.place.id));
}

/** REQ-014: số ngày / đêm của chuyến từ ngày đi – về (cả hai ngày đều tính); thiếu ngày → null */
export function tripDuration(start, end) {
  if (!start) return null;
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end || start}T00:00:00Z`);
  if (isNaN(a) || isNaN(b) || b < a) return null;
  const days = Math.round((b - a) / 864e5) + 1;
  return { days, nights: days - 1 };
}
/** Số địa điểm đang có trong kế hoạch (bỏ mục đã xoá) */
export const planPlaceCount = (planAll) => new Set((planAll || []).filter((it) => !it.removed && it.place?.id).map((it) => it.place.id)).size;

/**
 * Hành trình: ngày hiển thị của mỗi điểm dừng.
 * - Kỉ niệm (check-in có ảnh): ngày của kỉ niệm.
 * - Điểm "đã đến" có trong kế hoạch có ngày: ngày trong lịch trình (không phải ngày bấm "đã đến").
 * - Còn lại: ngày đã lưu, cuối cùng là lúc tạo.
 * Trả về danh sách đã ẩn mục bị xoá khỏi kế hoạch, kèm `shownDate` (YYYY-MM-DD hoặc mốc thời gian),
 * sắp xếp mới nhất trước.
 */
export function journeyStops(stops, planAll, memDate = {}) {
  const planDate = {};
  (planAll || []).forEach((it) => {
    const id = it.place?.id;
    if (!id || it.removed || !it.date) return;
    if (!planDate[id] || it.date < planDate[id]) planDate[id] = it.date;
  });
  const ms = (v) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : v ? Date.parse(v) || 0 : 0);
  return hideRemovedStops(stops, planAll)
    .map((s) => {
      const shownDate =
        s.kind === 'memory'
          ? (s.memoryId && memDate[s.memoryId]) || s.date || s.createdAt || null // REQ-020: ngày check-in người dùng nhập
          : planDate[s.place?.id] || s.date || s.createdAt || null;
      return { ...s, shownDate };
    })
    .sort((a, b) => {
      const ka = typeof a.shownDate === 'string' ? a.shownDate.slice(0, 10) : new Date(ms(a.shownDate) || 0).toISOString().slice(0, 10);
      const kb = typeof b.shownDate === 'string' ? b.shownDate.slice(0, 10) : new Date(ms(b.shownDate) || 0).toISOString().slice(0, 10);
      return kb.localeCompare(ka) || ms(b.createdAt) - ms(a.createdAt);
    });
}
