/**
 * REQ-023: vị trí thẻ hướng dẫn nhanh trên điện thoại — nằm trong khoảng trống lớn hơn (trên / dưới vùng nổi bật)
 * và không cao hơn khoảng đó, để không che nút đang được chỉ. room = chiều cao còn trống (ẩn ảnh minh hoạ khi < 460).
 */
export function mobileCardPlacement(rect, vh, gap = 10) {
  if (rect.height > vh * 0.55) return { left: 12, right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' }; // bản đồ: thẻ ở đáy
  const above = rect.top - gap - 8;
  const below = vh - (rect.top + rect.height) - gap - 8;
  if (below >= above) return { left: 12, right: 12, top: rect.top + rect.height + gap, maxHeight: `min(62dvh, ${Math.round(below)}px)`, room: below };
  return { left: 12, right: 12, bottom: vh - rect.top + gap, maxHeight: `min(62dvh, ${Math.round(above)}px)`, room: above };
}
