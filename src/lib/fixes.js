// Sửa toạ độ sai của một số mục Wikidata (đã đối chiếu Wikipedia / OpenStreetMap).
// Áp cho cả danh sách nổi tiếng, địa điểm người dùng đã lưu và kỉ niệm — kể cả dữ liệu cũ đã lưu.
export const COORD_FIXES = {
  'wd-Q5278298': { lat: 10.5375, lng: 107.12917 }, // Núi Dinh (Bà Rịa) — Wikidata ghi nhầm ở Thanh Hoá
};

// REQ-021: toạ độ quản trị viên sửa trong Admin → Địa điểm (placeOverrides) — áp cho mọi nơi dùng địa điểm đó
let adminCoords = {};
/** REQ-022: chỉ nhận link Google Maps thật (https, tên miền Google) — dùng để mở thẳng trang địa điểm khi chỉ đường */
export const safeGmapsLink = (s) => {
  try {
    const u = new URL(String(s || '').trim());
    if (u.protocol !== 'https:') return '';
    const h = u.hostname.toLowerCase();
    const ok = h === 'maps.app.goo.gl' || (h === 'goo.gl' && u.pathname.startsWith('/maps')) || h === 'maps.google.com' || /^(www\.)?google\.[a-z.]+$/.test(h) && u.pathname.startsWith('/maps');
    return ok ? u.toString() : '';
  } catch {
    return '';
  }
};
/** Nhận toàn bộ placeOverrides, chỉ giữ phần toạ độ hợp lệ và link Google Maps */
export function setCoordOverrides(overrides = {}) {
  const next = {};
  for (const [id, o] of Object.entries(overrides || {})) {
    const lat = Number(o?.lat);
    const lng = Number(o?.lng);
    const f = {};
    if (o?.lat !== '' && o?.lng !== '' && o?.lat != null && o?.lng != null && Number.isFinite(lat) && Number.isFinite(lng)) Object.assign(f, { lat, lng });
    const link = safeGmapsLink(o?.gmapsLink);
    if (link) f.gmapsLink = link;
    if (Object.keys(f).length) next[id] = f;
  }
  adminCoords = next;
  return next;
}

export const fixPlace = (p) => {
  const f = p && (adminCoords[p.id] || COORD_FIXES[p.id]);
  if (!f) return p;
  return Object.keys(f).some((k) => p[k] !== f[k]) ? { ...p, ...f } : p;
};

export const fixMemory = (m) => {
  const place = m?.place && fixPlace(m.place);
  return place && place !== m.place ? { ...m, place } : m;
};
