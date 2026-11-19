/**
 * Feature flags — bật / tắt tính năng mới theo từng nhóm người dùng.
 *
 * Quy trình phát hành tính năng mới:
 *  1. Thêm 1 mục vào FLAGS bên dưới với `defaultOn: false`.
 *  2. Bọc phần giao diện bằng `can('<key>')` (lấy từ useApp()).
 *  3. Chủ trang (super admin) luôn thấy để thử; người khác chỉ thấy khi admin bật trong
 *     Quản trị → Tính năng: bật cho một số người dùng (thử trước) hoặc bật cho tất cả.
 *
 * Cấu hình lưu ở settings/site → flags: { [key]: { on: boolean, users: [uid] } }.
 * Chưa có cấu hình thì dùng `defaultOn`.
 */
export const FLAGS = [
  { key: 'explore', icon: '🌍', name: { vi: "Trang Khám phá", en: "Explore page" }, desc: { vi: "Xem check-in công khai của mọi người.", en: "See everyone’s public check-ins." }, since: '', defaultOn: true },
  { key: 'trips', icon: '🧳', name: { vi: "Chuyến đi", en: "Trips" }, desc: { vi: "Tạo chuyến đi, kế hoạch, chi phí, checklist.", en: "Trips with plans, costs and checklists." }, since: '', defaultOn: true },
  { key: 'tripInvites', icon: '📨', name: { vi: "Mời bạn bè vào chuyến", en: "Trip invites" }, desc: { vi: "Tìm người dùng và gửi lời mời vào chuyến.", en: "Invite users to a trip." }, since: '', defaultOn: true },
  { key: 'tripCosts', icon: '💰', name: { vi: "Chi phí chuyến đi", en: "Trip costs" }, desc: { vi: "Tab chi phí & chia tiền trong chuyến đi.", en: "Costs & splitting tab." }, since: '', defaultOn: true },
  { key: 'tripChecklist', icon: '✅', name: { vi: "Checklist chuyến đi", en: "Trip checklists" }, desc: { vi: "Tab checklist chung / cá nhân.", en: "Shared / personal checklists." }, since: '', defaultOn: true },
  { key: 'tripPdf', icon: '📄', name: { vi: "Xuất kế hoạch PDF", en: "Plan PDF export" }, desc: { vi: "Nút xuất / chia sẻ kế hoạch dạng PDF.", en: "Export / share the plan as PDF." }, since: '', defaultOn: true },
  { key: 'tripDuplicate', icon: '📋', name: { vi: "Nhân bản chuyến đi", en: "Duplicate trip" }, desc: { vi: "Tạo chuyến mới từ chuyến có sẵn.", en: "Copy an existing trip." }, since: '', defaultOn: true },
  { key: 'recap', icon: '🎞️', name: { vi: "Recap năm / chuyến đi", en: "Year / trip recap" }, desc: { vi: "Tạo ảnh, video tổng kết.", en: "Recap images and videos." }, since: '', defaultOn: true },
  { key: 'share', icon: '📤', name: { vi: "Chia sẻ kỉ niệm", en: "Share studio" }, desc: { vi: "Tạo ảnh chia sẻ từ check-in.", en: "Share images from a check-in." }, since: '', defaultOn: true },
  { key: 'likes', icon: '❤️', name: { vi: "Lượt thích", en: "Likes" }, desc: { vi: "Thích check-in công khai.", en: "Like public check-ins." }, since: '', defaultOn: true },
  { key: 'follow', icon: '👋', name: { vi: "Theo dõi bạn bè", en: "Follow" }, desc: { vi: "Theo dõi người dùng, bảng tin bạn bè.", en: "Follow people and friends feed." }, since: '', defaultOn: true },
  { key: 'wikidata', icon: '🏞️', name: { vi: "Địa điểm nổi tiếng (Wikidata)", en: "Famous places (Wikidata)" }, desc: { vi: "Tải thêm địa điểm nổi tiếng theo quốc gia.", en: "Load more famous places per country." }, since: '', defaultOn: true },
  { key: 'popularPlaces', icon: '🔥', name: { vi: "Nơi được check-in nhiều", en: "Most checked-in places" }, desc: { vi: "Mục trên trang chủ.", en: "Home panel section." }, since: '', defaultOn: true },
  { key: 'quickTour', icon: '🧭', name: { vi: "Hướng dẫn nhanh", en: "Quick tour" }, desc: { vi: "Tour giới thiệu cho người mới.", en: "Onboarding tour." }, since: '', defaultOn: true },
  { key: 'feedback', icon: '💬', name: { vi: "Góp ý & báo lỗi", en: "Feedback" }, desc: { vi: "Nút Góp ý và gửi báo lỗi.", en: "Feedback tab and bug reports." }, since: '', defaultOn: true },
  { key: 'sponsor', icon: '☕', name: { vi: "Ủng hộ", en: "Support us" }, desc: { vi: "Trang ủng hộ / donate.", en: "Support page." }, since: '', defaultOn: true },
  { key: 'whatsNew', icon: '✨', name: { vi: "Có gì mới", en: "What’s new" }, desc: { vi: "Ghi chú phát hành.", en: "Release notes." }, since: '', defaultOn: true },
  { key: 'pullToRefresh', icon: '↻', name: { vi: "Kéo xuống để tải lại", en: "Pull to refresh" }, desc: { vi: "Trên điện thoại.", en: "On phones." }, since: '', defaultOn: true },
  { key: 'guide', icon: '📖', name: { vi: "Trang Cẩm nang", en: "Guides page" }, desc: { vi: "Cẩm nang 12 nước châu Á.", en: "Guides for 12 Asian countries." }, since: '2026-11-19', defaultOn: true },
  { key: 'tips', icon: '🧭', name: { vi: "Kinh nghiệm theo quốc gia", en: "Country travel tips" }, desc: { vi: "Bài kinh nghiệm, Hữu ích / Sai lệch, hỏi đáp.", en: "Community tips, votes and Q&A." }, since: '2026-11-19', defaultOn: false },
];
export const FLAG_BY_KEY = Object.fromEntries(FLAGS.map((f) => [f.key, f]));

/** Người dùng này có thấy tính năng `key` không */
export function flagAllows(key, settings, user, isSuper) {
  const def = FLAG_BY_KEY[key];
  if (!def) return true;
  if (isSuper) return true;
  const cfg = settings?.flags?.[key];
  // Công tắc cũ (Cài đặt → Bật / tắt tính năng) của explore / trips / wikidata vẫn được tôn trọng
  const legacy = settings?.features?.[key] === false ? false : undefined;
  const on = cfg?.on ?? legacy ?? def.defaultOn;
  if (on) return true;
  return !!user && (cfg?.users || []).includes(user.uid);
}
