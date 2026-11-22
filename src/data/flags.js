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
  { key: 'costTable', icon: '🧮', name: { vi: "Bảng chi phí gộp", en: "Combined cost table" }, desc: { vi: "Dự kiến, thực tế và chênh lệch của mỗi khoản trên cùng 1 dòng; thêm khoản chi nhập dự kiến, thực tế hoặc cả hai.", en: "Estimate, actual and difference for each cost on one row; add a cost with the estimate, the actual, or both." }, value: { vi: "Một bảng duy nhất để so dự kiến với thực tế và thấy ngay khoản phát sinh.", en: "One table to compare estimates with actual spend and spot unplanned costs." }, since: '2026-11-22', defaultOn: false },
  { key: 'costSort', icon: '↕️', name: { vi: "Sắp xếp bảng chi phí", en: "Sort the cost table" }, desc: { vi: "Chọn cách sắp xếp bảng chi phí gộp (ngày, số tiền, vượt dự kiến, tên) và lưu làm thứ tự của nhóm.", en: "Sort the combined cost table (date, amount, over budget, name) and save it as the group order." }, value: { vi: "Sắp xếp chi phí trong 1 chạm, không cần kéo thả.", en: "Sort costs in one tap, no dragging needed." }, since: '2026-11-22', defaultOn: false },
  { key: 'costPickPeople', icon: '👤', name: { vi: "Chi phí dự kiến: chọn người", en: "Estimates: pick people" }, desc: { vi: "Thêm lựa chọn 'Chọn người' cho chi phí dự kiến, bên cạnh Cả nhóm và Mỗi người.", en: "Adds a 'Pick people' option to estimated costs, next to Group and Per person." }, value: { vi: "Dự trù cả những khoản chỉ vài người trong nhóm dùng (tour riêng, vé show…).", en: "Plan costs only some of the group share (a side tour, show tickets…)." }, since: '2026-11-22', defaultOn: false },
  { key: 'selectedPin', icon: '📌', name: { vi: "Đánh dấu địa điểm đang chọn", en: "Highlight the selected place" }, desc: { vi: "Ghim đang chọn to hơn, viền vàng, vòng sáng nhấp nháy và nhãn tên; không bị gom cụm.", en: "The selected pin is larger, honey-ringed, gently pulsing and labelled; never hidden in a cluster." }, value: { vi: "Giữa hàng chục ghim, nhìn là biết mình đang xem địa điểm nào.", en: "Among dozens of pins, see at once which place you're looking at." }, since: '2026-11-22', defaultOn: false },
  { key: 'costCompare', icon: '📊', name: { vi: "So sánh dự kiến – thực tế", en: "Estimate vs actual comparison" }, desc: { vi: "Thẻ so sánh từng khoản dự kiến với thực tế, chênh lệch và các khoản phát sinh.", en: "Card comparing each estimate with actual spend, the difference and unplanned costs." }, value: { vi: "Nhìn là biết khoản nào vượt dự kiến và đã tiêu gì ngoài kế hoạch.", en: "See at a glance what went over budget and what wasn't planned." }, since: '2026-11-22', defaultOn: false },
  { key: 'costReorder', icon: '↕️', name: { vi: "Kéo thả sắp xếp chi phí", en: "Drag to reorder costs" }, desc: { vi: "Giữ ⠿ và kéo để sắp lại thứ tự khoản dự kiến / thực tế.", en: "Hold ⠿ and drag to reorder estimated / actual costs." }, value: { vi: "Sắp các khoản chi theo thứ tự bạn muốn.", en: "Put your costs in the order you want." }, since: '2026-11-22', defaultOn: false },
  { key: 'tripPublicView', icon: '🔗', name: { vi: "Link chỉ xem chuyến đi", en: "View-only trip link" }, desc: { vi: "Chủ chuyến bật link để ai có link đều xem được kế hoạch (và chi phí nếu cho phép) mà không cần tham gia.", en: "Owners turn on a link so anyone can view the plan (and costs if allowed) without joining." }, value: { vi: "Gửi lịch trình cho gia đình, bạn bè xem mà không cần mời vào nhóm.", en: "Send the itinerary to family and friends without adding them to the group." }, since: '2026-11-22', defaultOn: false },
  { key: 'tripViewers', icon: '👀', name: { vi: "Thành viên chỉ xem", en: "View-only members" }, desc: { vi: "Chủ chuyến đặt quyền Chỉ xem / Có thể sửa cho từng thành viên; người chỉ xem có nút sao chép chuyến đi.", en: "Trip owners set each member to View only or Can edit; viewers get a Copy trip button." }, value: { vi: "Chia sẻ chuyến đi cho người khác xem mà không lo bị sửa nhầm — họ vẫn sao chép về để tự lên kế hoạch.", en: "Share a trip for viewing without accidental edits — viewers can still copy it to plan their own." }, since: '2026-11-22', defaultOn: false },
  { key: 'tripCostsPdf', icon: '🧾', name: { vi: "Xuất chi phí PDF", en: "Costs PDF export" }, desc: { vi: "Nút xuất / chia sẻ bảng chi phí chuyến đi (dự kiến, thực tế, chia tiền) dạng PDF.", en: "Export / share trip costs (estimates, actuals, split) as PDF." }, value: { vi: "Xuất bảng chi phí và chia tiền ra PDF để gửi cả nhóm.", en: "Export costs and who-owes-whom as a PDF to send the group." }, since: '2026-11-22', defaultOn: false },
  { key: 'gear', icon: '🎒', name: { vi: "Trang Đồ dùng du lịch", en: "Travel gear page" }, desc: { vi: "Gợi ý đồ dùng theo hình thức đi và công năng, có link mua (affiliate).", en: "Gear ideas by trip type and purpose, with (affiliate) shop links." }, value: { vi: "Biết mang gì cho từng kiểu chuyến đi, có link mua sẵn.", en: "Know what to pack for each kind of trip, with shop links." }, since: '2026-11-19', defaultOn: false },
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
