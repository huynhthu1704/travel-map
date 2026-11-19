/**
 * Feature flags — bật / tắt tính năng mới theo từng nhóm người dùng.
 *
 * Quy trình phát hành tính năng mới:
 *  1. Thêm 1 mục vào FLAGS bên dưới với `defaultOn: false`.
 *  2. Bọc phần giao diện bằng `can('<key>')` (lấy từ useApp()).
 *  3. Chủ trang (super admin) luôn thấy để thử; người khác chỉ thấy khi admin bật trong
 *     Quản trị → Tính năng: bật cho một số người dùng (thử trước) hoặc bật cho tất cả.
 *
 *  4. Điền `value` (giá trị cho người dùng, 1 câu) → tính năng tự hiện ở trang Giới thiệu (#/about)
 *     ngay khi được phát hành cho mọi người. Tính năng nội bộ / kỹ thuật thì bỏ trống `value`.
 *
 * Cấu hình lưu ở settings/site → flags: { [key]: { on: boolean, users: [uid] } }.
 * Chưa có cấu hình thì dùng `defaultOn`.
 */
export const FLAGS = [
  { key: 'guideLinks', icon: '📌', name: { vi: "Link hữu ích trong cẩm nang", en: "Useful links in guides" }, desc: { vi: "Mục Địa điểm hữu ích (đổi tiền, đại sứ quán…) do đội vận hành quản lý.", en: "Useful places (money exchange, embassies…) managed by staff." }, value: { vi: "Mở thẳng Google Maps tới chỗ đổi tiền, đại sứ quán… đã được kiểm tra.", en: "Jump straight to vetted money exchanges, embassies and more on Google Maps." }, since: '2026-11-19', defaultOn: false },
  { key: 'guideFoodCities', icon: '🍜', name: { vi: "Món ngon theo thành phố", en: "Local food by city" }, desc: { vi: "Lọc món phải thử theo thành phố / vùng trong cẩm nang.", en: "Filter must-try food by city or region in guides." }, value: { vi: "Biết đến thành phố nào thì nên ăn món gì.", en: "Know what to eat in each city you visit." }, since: '2026-11-19', defaultOn: false },
  { key: 'guideCosts', icon: '💵', name: { vi: "Bảng chi phí mẫu trong cẩm nang", en: "Sample trip costs in guides" }, desc: { vi: "Chọn số ngày, số người, mức chi tiêu → ước tính chi phí quy đổi VND và tiền nước đến; áp vào chuyến đi.", en: "Pick days, people and budget level → estimated costs in VND and local currency; apply to a trip." }, value: { vi: "Biết chuyến đi tốn khoảng bao nhiêu trước khi đặt vé — quy đổi sẵn ra VND.", en: "Know roughly what a trip costs before you book — already converted to VND." }, since: '2026-11-19', defaultOn: false },
  { key: 'guideToTrip', icon: '➕', name: { vi: "Thêm địa điểm cẩm nang vào chuyến", en: "Add guide places to a trip" }, desc: { vi: "Bấm địa điểm trong mục Nơi nên đi để thêm vào kế hoạch chuyến đi.", en: "Tap a place in Where to go to add it to a trip plan." }, value: { vi: "Thấy chỗ hay trong cẩm nang? Một chạm là nó nằm trong kế hoạch chuyến đi.", en: "Spotted a great place in a guide? One tap adds it to your trip plan." }, since: '2026-11-19', defaultOn: false },
  { key: 'explore', icon: '🌍', name: { vi: "Trang Khám phá", en: "Explore page" }, desc: { vi: "Xem check-in công khai của mọi người.", en: "See everyone’s public check-ins." }, value: { vi: "Xem check-in công khai của mọi người để tìm cảm hứng cho chuyến tiếp theo.", en: "Browse everyone’s public check-ins for your next trip idea." }, since: '', defaultOn: true },
  { key: 'trips', icon: '🧳', name: { vi: "Chuyến đi", en: "Trips" }, desc: { vi: "Tạo chuyến đi, kế hoạch, chi phí, checklist.", en: "Trips with plans, costs and checklists." }, value: { vi: "Gom điểm đến, lịch trình, chi phí và checklist của một chuyến vào một chỗ.", en: "Destinations, itinerary, costs and checklists for a trip in one place." }, since: '', defaultOn: true },
  { key: 'tripInvites', icon: '📨', name: { vi: "Mời bạn bè vào chuyến", en: "Trip invites" }, desc: { vi: "Tìm người dùng và gửi lời mời vào chuyến.", en: "Invite users to a trip." }, value: { vi: "Mời bạn bè vào chuyến bằng tên — họ bấm Tham gia là cả nhóm dùng chung.", en: "Invite friends by name — once they tap Join, the whole group shares the trip." }, since: '', defaultOn: true },
  { key: 'tripCosts', icon: '💰', name: { vi: "Chi phí chuyến đi", en: "Trip costs" }, desc: { vi: "Tab chi phí & chia tiền trong chuyến đi.", en: "Costs & splitting tab." }, value: { vi: "Ghi ai trả gì, nhiều loại tiền, tự tính cách trả lại nhanh nhất.", en: "Track who paid what in any currency and get the quickest way to settle up." }, since: '', defaultOn: true },
  { key: 'tripChecklist', icon: '✅', name: { vi: "Checklist chuyến đi", en: "Trip checklists" }, desc: { vi: "Tab checklist chung / cá nhân.", en: "Shared / personal checklists." }, value: { vi: "Mẫu sẵn cho trước khi đi / trước khi về — biết ngay ai còn thiếu gì.", en: "Ready-made before-you-go and before-you-return lists — see who still has things to do." }, since: '', defaultOn: true },
  { key: 'tripPdf', icon: '📄', name: { vi: "Xuất kế hoạch PDF", en: "Plan PDF export" }, desc: { vi: "Nút xuất / chia sẻ kế hoạch dạng PDF.", en: "Export / share the plan as PDF." }, value: { vi: "Xuất lịch trình ra PDF để in hoặc gửi cho người không dùng app.", en: "Export the itinerary as a PDF to print or send to anyone." }, since: '', defaultOn: true },
  { key: 'tripDuplicate', icon: '📋', name: { vi: "Nhân bản chuyến đi", en: "Duplicate trip" }, desc: { vi: "Tạo chuyến mới từ chuyến có sẵn.", en: "Copy an existing trip." }, value: { vi: "Nhân bản chuyến cũ để đi lại mà không phải nhập lại từ đầu.", en: "Duplicate a past trip instead of starting from scratch." }, since: '', defaultOn: true },
  { key: 'recap', icon: '🎞️', name: { vi: "Recap năm / chuyến đi", en: "Year / trip recap" }, desc: { vi: "Tạo ảnh, video tổng kết.", en: "Recap images and videos." }, value: { vi: "Tổng kết năm bằng 5 bố cục ảnh / video — đăng mạng xã hội trong vài giây.", en: "Your year in travel in 5 photo / video layouts, ready to post in seconds." }, since: '', defaultOn: true },
  { key: 'share', icon: '📤', name: { vi: "Chia sẻ kỉ niệm", en: "Share studio" }, desc: { vi: "Tạo ảnh chia sẻ từ check-in.", en: "Share images from a check-in." }, value: { vi: "Biến một kỉ niệm thành ảnh đẹp kiểu Polaroid, Postcard, Film để chia sẻ.", en: "Turn a memory into a Polaroid, Postcard or Film-style image to share." }, since: '', defaultOn: true },
  { key: 'likes', icon: '❤️', name: { vi: "Lượt thích", en: "Likes" }, desc: { vi: "Thích check-in công khai.", en: "Like public check-ins." }, value: { vi: "Thả tim cho check-in bạn thích.", en: "Like the check-ins you love." }, since: '', defaultOn: true },
  { key: 'follow', icon: '👋', name: { vi: "Theo dõi bạn bè", en: "Follow" }, desc: { vi: "Theo dõi người dùng, bảng tin bạn bè.", en: "Follow people and friends feed." }, value: { vi: "Theo dõi người đi cùng gu để thấy họ vừa đến đâu.", en: "Follow travellers you like and see where they’ve just been." }, since: '', defaultOn: true },
  { key: 'wikidata', icon: '🏞️', name: { vi: "Địa điểm nổi tiếng (Wikidata)", en: "Famous places (Wikidata)" }, desc: { vi: "Tải thêm địa điểm nổi tiếng theo quốc gia.", en: "Load more famous places per country." }, since: '', defaultOn: true },
  { key: 'popularPlaces', icon: '🔥', name: { vi: "Nơi được check-in nhiều", en: "Most checked-in places" }, desc: { vi: "Mục trên trang chủ.", en: "Home panel section." }, value: { vi: "Xem nơi đang được nhiều người check-in nhất.", en: "See the places people check in at most." }, since: '', defaultOn: true },
  { key: 'quickTour', icon: '🧭', name: { vi: "Hướng dẫn nhanh", en: "Quick tour" }, desc: { vi: "Tour giới thiệu cho người mới.", en: "Onboarding tour." }, value: { vi: "Hướng dẫn nhanh 1 phút cho người mới.", en: "A 1-minute tour for newcomers." }, since: '', defaultOn: true },
  { key: 'feedback', icon: '💬', name: { vi: "Góp ý & báo lỗi", en: "Feedback" }, desc: { vi: "Nút Góp ý và gửi báo lỗi.", en: "Feedback tab and bug reports." }, since: '', defaultOn: true },
  { key: 'sponsor', icon: '☕', name: { vi: "Ủng hộ", en: "Support us" }, desc: { vi: "Trang ủng hộ / donate.", en: "Support page." }, since: '', defaultOn: true },
  { key: 'whatsNew', icon: '✨', name: { vi: "Có gì mới", en: "What’s new" }, desc: { vi: "Ghi chú phát hành.", en: "Release notes." }, since: '', defaultOn: true },
  { key: 'pullToRefresh', icon: '↻', name: { vi: "Kéo xuống để tải lại", en: "Pull to refresh" }, desc: { vi: "Trên điện thoại.", en: "On phones." }, since: '', defaultOn: true },
  { key: 'guide', icon: '📖', name: { vi: "Trang Cẩm nang", en: "Guides page" }, desc: { vi: "Cẩm nang 12 nước châu Á.", en: "Guides for 12 Asian countries." }, value: { vi: "Cẩm nang 12 nước châu Á: visa, mùa đẹp, chi phí, nơi nên đi, món phải thử.", en: "Guides to 12 Asian countries: visas, best season, costs, places and food." }, since: '2026-11-19', defaultOn: true },
  { key: 'tips', icon: '🧭', name: { vi: "Kinh nghiệm theo quốc gia", en: "Country travel tips" }, desc: { vi: "Bài kinh nghiệm, Hữu ích / Sai lệch, hỏi đáp.", en: "Community tips, votes and Q&A." }, value: { vi: "Đọc và chia sẻ kinh nghiệm thật theo từng nước, có bình chọn hữu ích và hỏi đáp.", en: "Read and share real tips by country, with helpful votes and Q&A." }, since: '2026-11-19', defaultOn: false },
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

/** Tính năng đã phát hành cho mọi người (không tính danh sách thử trước) */
export function flagReleased(key, settings) {
  const def = FLAG_BY_KEY[key];
  if (!def) return true;
  const cfg = settings?.flags?.[key];
  const legacy = settings?.features?.[key] === false ? false : undefined;
  return !!(cfg?.on ?? legacy ?? def.defaultOn);
}
