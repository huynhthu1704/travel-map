/**
 * Hướng dẫn nhanh cho người mới. Mỗi bước:
 *  target: CSS selector phần tử cần làm nổi bật (bỏ trống = thẻ ở giữa màn hình)
 *  image: ảnh minh hoạ trong public/ (tuỳ chọn) · demo: hoạt hình minh hoạ dựng sẵn (tuỳ chọn)
 *  tryIt: gợi ý người dùng thử ngay trên vùng được làm nổi bật (vùng đó vẫn bấm được)
 */
export const TOUR_STEPS = [
  {
    id: 'welcome',
    demo: 'welcome',
    title: { vi: 'Chào mừng tới Travel Map! 👋', en: 'Welcome to Travel Map! 👋' },
    text: {
      vi: 'Lưu mọi nơi bạn đã đến và muốn đến trên một tấm bản đồ, ghi lại kỉ niệm bằng ảnh và lên kế hoạch chuyến đi cùng bạn bè. Mình dẫn bạn đi một vòng trong 1 phút nhé.',
      en: 'Keep every place you have been and want to go on one map, save memories with photos and plan trips with friends. Let us show you around — it takes a minute.',
    },
  },
  {
    id: 'map',
    target: '.map-wrap .leaflet-container, .map-wrap .maplibregl-map, .map-wrap',
    demo: 'tap',
    tryIt: true,
    title: { vi: 'Chạm vào bản đồ để thêm địa điểm', en: 'Tap the map to add a place' },
    text: {
      vi: 'Chạm vào bất kỳ đâu trên bản đồ để ghim vị trí đó, rồi đánh dấu Đã đến hoặc Muốn đi. Các nước bạn đã đến sẽ được tô màu vàng.',
      en: 'Tap anywhere on the map to pin it, then mark it as Visited or Wishlist. Countries you have visited turn yellow.',
    },
  },
  {
    id: 'search',
    target: '.topbar .search',
    tryIt: true,
    title: { vi: 'Tìm mọi thứ ở đây', en: 'Search for anything' },
    text: {
      vi: 'Gõ tên quốc gia, thành phố, địa điểm — hoặc @tên của bạn bè để mở hồ sơ của họ. Thử gõ "Đà Lạt" xem!',
      en: 'Type a country, city or place — or a friend’s @username to open their profile. Try typing "Da Lat"!',
    },
    image: 'releases/search-people.webp',
  },
  {
    id: 'tabs',
    target: '[data-tour="home-tabs"]',
    tryIt: true,
    title: { vi: 'Đã đi · Muốn đi · Nổi tiếng', en: 'Visited · Wishlist · Famous' },
    text: {
      vi: 'Xem lại các nơi đã đến, danh sách muốn đi (gom theo quốc gia), và gợi ý danh lam thắng cảnh nổi tiếng. Bấm thử từng tab nhé.',
      en: 'Review places you have visited, your wishlist (grouped by country) and famous sights to discover. Tap the tabs to try.',
    },
  },
  {
    id: 'memory',
    target: '[data-tour="add-memory"]',
    image: 'releases/recap.webp',
    title: { vi: 'Lưu kỉ niệm & tạo video tổng kết', en: 'Save memories & make recaps' },
    text: {
      vi: 'Check-in kèm ảnh, ngày và ghi chú. Cuối chuyến hoặc cuối năm, tạo ảnh / video tổng kết để chia sẻ lên mạng xã hội chỉ với vài lần bấm.',
      en: 'Check in with photos, a date and a note. After a trip or at year end, turn them into a shareable image or video recap in a few taps.',
    },
  },
  {
    id: 'nav',
    target: '.nav--top, .nav--bottom',
    title: { vi: 'Khám phá · Kỉ niệm · Chuyến đi', en: 'Explore · Memories · Trips' },
    text: {
      vi: 'Khám phá: xem ảnh thật của mọi người ở nơi bạn sắp đến. Kỉ niệm: toàn bộ dấu chân của bạn. Chuyến đi: lập lịch trình, checklist và chia chi phí cùng nhóm.',
      en: 'Explore: real photos from people who have been there. Memories: all your footprints. Trips: itineraries, checklists and shared costs with your group.',
    },
  },
  {
    id: 'social',
    target: '.notif__bell, .user-menu',
    image: 'releases/notifications.webp',
    title: { vi: 'Bạn bè & thông báo', en: 'Friends & notifications' },
    text: {
      vi: 'Theo dõi bạn bè, thả tim check-in công khai và nhận thông báo khi có người tương tác. Bấm ảnh đại diện để mở hồ sơ và đặt @tên của bạn.',
      en: 'Follow friends, like public check-ins and get notified when people interact. Tap your avatar to open your profile and set your @username.',
    },
  },
  {
    id: 'feedback',
    target: '.fb-tab',
    image: 'releases/feedback.webp',
    title: { vi: 'Góp ý bất cứ lúc nào', en: 'Send feedback anytime' },
    text: {
      vi: 'Thấy lỗi hay có ý tưởng? Bấm nút Góp ý ở cạnh màn hình, khoanh vùng cần góp ý — web tự chụp màn hình gửi cho đội ngũ.',
      en: 'Spotted a bug or have an idea? Tap the Feedback tab on the edge of the screen and pick the area — we capture the screenshot for you.',
    },
  },
  {
    id: 'done',
    demo: 'done',
    title: { vi: 'Sẵn sàng rồi! 🎉', en: 'You are all set! 🎉' },
    text: {
      vi: 'Bắt đầu bằng cách ghim nơi đầu tiên bạn từng đến. Bạn có thể xem lại hướng dẫn này bất cứ lúc nào ở trang chủ hoặc menu tài khoản.',
      en: 'Start by pinning the first place you have been to. You can replay this tour anytime from the home panel or the account menu.',
    },
  },
];
