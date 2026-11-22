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
