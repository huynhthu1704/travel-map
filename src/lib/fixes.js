// Sửa toạ độ sai của một số mục Wikidata (đã đối chiếu Wikipedia / OpenStreetMap).
// Áp cho cả danh sách nổi tiếng, địa điểm người dùng đã lưu và kỉ niệm — kể cả dữ liệu cũ đã lưu.
export const COORD_FIXES = {
  'wd-Q5278298': { lat: 10.5375, lng: 107.12917 }, // Núi Dinh (Bà Rịa) — Wikidata ghi nhầm ở Thanh Hoá
};

export const fixPlace = (p) => {
  const f = p && COORD_FIXES[p.id];
  return f ? { ...p, ...f } : p;
};

export const fixMemory = (m) => (m?.place && COORD_FIXES[m.place.id] ? { ...m, place: fixPlace(m.place) } : m);
