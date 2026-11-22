/**
 * REQ-013: mục "Và còn nữa" trên trang Giới thiệu — tính năng xếp theo nhóm liên quan, quan trọng trước.
 * Thứ tự nhóm và thứ tự trong nhóm = mức độ quan trọng. Tính năng mới chưa có trong danh sách rơi vào nhóm cuối.
 */
export const ABOUT_GROUPS = [
  { id: 'trips', icon: '🧳', name: { vi: 'Đi cùng nhau', en: 'Travel together' }, keys: ['tripPublicView', 'tripViewers', 'tripChecklist', 'tripInvites', 'tripDuplicate', 'tripPdf', 'trips'] },
  { id: 'costs', icon: '💰', name: { vi: 'Chi phí & chia tiền', en: 'Costs & splitting' }, keys: ['costTable', 'costCompare', 'costPickPeople', 'tripCostsPdf', 'costSort', 'costReorder', 'tripCosts'] },
  { id: 'guides', icon: '📖', name: { vi: 'Cẩm nang & chuẩn bị', en: 'Guides & packing' }, keys: ['guide', 'guideCosts', 'guideToTrip', 'guideFoodCities', 'guideLinks', 'gear', 'tips'] },
  { id: 'map', icon: '🗺️', name: { vi: 'Bản đồ & khám phá', en: 'Map & discovery' }, keys: ['selectedPin', 'wikidata', 'popularPlaces', 'explore', 'likes', 'follow', 'share', 'recap'] },
  { id: 'extras', icon: '✨', name: { vi: 'Tiện ích khác', en: 'Handy extras' }, keys: ['quickTour', 'whatsNew', 'pullToRefresh', 'feedback', 'sponsor'] },
];

/** features: danh sách cờ tính năng sẽ hiện (đã lọc) → [{ ...group, items }], bỏ nhóm rỗng */
export function groupFeatures(features) {
  const byKey = new Map(features.map((f) => [f.key, f]));
  const used = new Set();
  const groups = ABOUT_GROUPS.map((g) => {
    const items = g.keys.map((k) => byKey.get(k)).filter(Boolean);
    items.forEach((f) => used.add(f.key));
    return { ...g, items };
  });
  const rest = features.filter((f) => !used.has(f.key));
  if (rest.length) groups[groups.length - 1].items.push(...rest);
  return groups.filter((g) => g.items.length);
}
