/** Đánh dấu người dùng đã xem ghi chú phát hành của phiên bản hiện tại */
const KEY = 'travel-map-seen-release';
export const APP_VERSION = __APP_VERSION__;
export function hasUnseenRelease() {
  try {
    return localStorage.getItem(KEY) !== APP_VERSION;
  } catch {
    return false;
  }
}
export function markReleaseSeen() {
  try {
    localStorage.setItem(KEY, APP_VERSION);
  } catch {
    /* bỏ qua */
  }
}
