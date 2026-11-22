/**
 * REQ-005: tách địa điểm đang chọn ra khỏi danh sách ghim để vẽ riêng (ghim nổi bật, không bị gom cụm, luôn nằm trên cùng).
 * markers: [{ place, kind, emoji }]; selectedId: id địa điểm đang mở (hoặc null)
 */
export function pickSelected(markers, selectedId) {
  if (!selectedId) return { selected: null, rest: markers };
  const selected = markers.find((m) => m.place?.id === selectedId) || null;
  return { selected, rest: selected ? markers.filter((m) => m !== selected) : markers };
}
