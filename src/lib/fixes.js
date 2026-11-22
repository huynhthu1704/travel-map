// Sửa toạ độ sai của một số mục Wikidata (đã đối chiếu Wikipedia / OpenStreetMap).
// Áp cho cả danh sách nổi tiếng, địa điểm người dùng đã lưu và kỉ niệm — kể cả dữ liệu cũ đã lưu.
export const COORD_FIXES = {
  'wd-Q5278298': { lat: 10.5375, lng: 107.12917 }, // Núi Dinh (Bà Rịa) — Wikidata ghi nhầm ở Thanh Hoá
};

// REQ-021: toạ độ quản trị viên sửa trong Admin → Địa điểm (placeOverrides) — áp cho mọi nơi dùng địa điểm đó
let adminCoords = {};
/** Nhận toàn bộ placeOverrides, chỉ giữ phần toạ độ hợp lệ */
export function setCoordOverrides(overrides = {}) {
  const next = {};
  for (const [id, o] of Object.entries(overrides || {})) {
    const lat = Number(o?.lat);
    const lng = Number(o?.lng);
    if (o?.lat !== '' && o?.lng !== '' && o?.lat != null && o?.lng != null && Number.isFinite(lat) && Number.isFinite(lng)) next[id] = { lat, lng };
  }
  adminCoords = next;
  return next;
}

export const fixPlace = (p) => {
  const f = p && (adminCoords[p.id] || COORD_FIXES[p.id]);
  return f && (p.lat !== f.lat || p.lng !== f.lng) ? { ...p, ...f } : p;
};

export const fixMemory = (m) => {
  const place = m?.place && fixPlace(m.place);
  return place && place !== m.place ? { ...m, place } : m;
};
