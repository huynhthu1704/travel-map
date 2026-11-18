/**
 * Ghi chú phát hành (Release notes) — mới nhất ở trên cùng.
 * Mỗi lần phát hành: thêm 1 mục vào đầu mảng, tăng "version" trong package.json cho khớp.
 *   date: 'YYYY-MM-DD' — các bản phát hành cùng ngày được gộp thành 1 nhóm
 *   items[].image: ảnh minh hoạ trong thư mục public/releases/ (không bắt buộc)
 */
export const RELEASES = [
  {
    version: '1.6.0',
    date: '2026-11-18',
    items: [
      {
        icon: '🔎',
        title: { vi: 'Tìm bạn bè trên Travel Map', en: 'Find other travellers' },
        desc: {
          vi: 'Gõ tên một người vào ô tìm kiếm để mở hồ sơ của họ. Bạn cũng có thể bấm vào tên tác giả trên một check-in công khai, hoặc gửi link hồ sơ của mình bằng nút “Chia sẻ hồ sơ”.',
          en: 'Type a name in the search bar to open someone’s profile. You can also tap the author’s name on a public check-in, or send your own profile with the “Share profile” button.',
        },
        image: 'releases/search-people.webp',
      },
      {
        icon: '👤',
        title: { vi: 'Hồ sơ cá nhân gọn hơn', en: 'A tidier profile page' },
        desc: {
          vi: 'Đổi ảnh đại diện (bấm biểu tượng 📷) và tên hiển thị ngay trên trang cá nhân, cạnh phần giới thiệu. Danh sách tỉnh/thành đã đến được chia theo từng quốc gia, dễ đọc hơn. Hoạt động gần đây chuyển sang một trang riêng.',
          en: 'Change your photo (tap 📷) and display name right on your profile, next to your bio. Cities you have visited are grouped by country and easier to read. Recent activity now has its own page.',
        },
        image: 'releases/profile.webp',
      },
      {
        icon: '🔥',
        title: { vi: 'Địa điểm được check-in nhiều nhất', en: 'Most checked-in places' },
        desc: {
          vi: 'Trang chủ gợi ý những địa điểm có nhiều lượt check-in công khai nhất. Bấm vào để xem địa điểm trên bản đồ.',
          en: 'The home panel highlights the places with the most public check-ins. Tap one to see it on the map.',
        },
      },
      {
        icon: '🆕',
        title: { vi: 'Ghi chú phát hành', en: 'Release notes' },
        desc: {
          vi: 'Trang “Có gì mới” cho biết phiên bản bạn đang dùng và những thay đổi của từng lần cập nhật. Dấu chấm đỏ trong menu tài khoản báo khi có bản mới.',
          en: 'The “What’s new” page shows the version you are using and what changed in each update. A red dot in the account menu tells you when there is something new.',
        },
      },
      {
        icon: '📸',
        title: { vi: 'Ảnh chụp màn hình khi góp ý giống hệt màn hình', en: 'Feedback screenshots match your screen' },
        desc: {
          vi: 'Khi khoanh vùng trên màn hình để góp ý, ảnh chụp giờ giữ đúng những gì bạn thấy, kể cả bản đồ và cờ quốc gia. Trên máy tính, trình duyệt sẽ hỏi “Chia sẻ tab này” — hãy đồng ý để có ảnh chính xác nhất.',
          en: 'When you pick an area of the screen for feedback, the screenshot now keeps exactly what you see, including the map and flags. On a computer, the browser asks to “Share this tab” — allow it for the most accurate image.',
        },
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-11-18',
    items: [
      {
        icon: '🤝',
        title: { vi: 'Hồ sơ, theo dõi và lượt thích', en: 'Profiles, follows and likes' },
        desc: {
          vi: 'Mỗi người có một trang hồ sơ với số quốc gia, thành phố đã đến và các check-in công khai. Theo dõi nhau để trở thành bạn bè và xem hoạt động của nhau. Thả tim cho check-in công khai bạn thích.',
          en: 'Everyone has a profile with countries, cities and public check-ins. Follow each other to become friends and see each other’s activity. Like the public check-ins you enjoy.',
        },
      },
      {
        icon: '🔔',
        title: { vi: 'Thông báo trong ứng dụng', en: 'In-app notifications' },
        desc: {
          vi: 'Chuông thông báo cho biết khi có người thích check-in, theo dõi bạn, hoặc khi có tính năng mới. Đánh dấu đã đọc / chưa đọc từng thông báo.',
          en: 'The bell tells you when someone likes your check-in, follows you, or when a new feature launches. Mark each one read or unread.',
        },
        image: 'releases/notifications.webp',
      },
      {
        icon: '💬',
        title: { vi: 'Góp ý & báo lỗi', en: 'Feedback & bug reports' },
        desc: {
          vi: 'Bấm nút “Góp ý” ở cạnh màn hình, chọn Báo lỗi hoặc Đề xuất, khoanh vùng phần bị lỗi để tự chụp màn hình, đính kèm ảnh/video. Theo dõi trạng thái trong mục “Góp ý của tôi”.',
          en: 'Tap the “Feedback” tab on the edge of the screen, choose Bug or Enhancement, pick the area to screenshot it automatically, and attach photos or videos. Track the status under “My feedback”.',
        },
        image: 'releases/feedback.webp',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-11-18',
    items: [
      {
        icon: '🎞️',
        title: { vi: 'Tổng kết chuyến đi với 5 kiểu trình bày', en: 'Recaps in 5 layouts' },
        desc: {
          vi: 'Tạo ảnh hoặc video tổng kết theo kiểu Bản đồ, Ghép ảnh, Hộ chiếu, Dòng thời gian hoặc Trình chiếu. Tự chọn ảnh muốn đưa vào và xem trước trước khi tải về.',
          en: 'Make an image or video recap as a Map, Collage, Passport, Timeline or Slideshow. Choose the photos to include and preview before downloading.',
        },
        image: 'releases/recap.webp',
      },
      {
        icon: '✏️',
        title: { vi: 'Sửa kỉ niệm', en: 'Edit memories' },
        desc: {
          vi: 'Thêm hoặc bớt ảnh, sửa ngày và ghi chú của một kỉ niệm đã lưu.',
          en: 'Add or remove photos and change the date or note of a saved memory.',
        },
      },
      {
        icon: '⚡',
        title: { vi: 'Tải trang nhanh hơn', en: 'Faster loading' },
        desc: {
          vi: 'Trang mở nhanh hơn ở những lần sau và vẫn xem được dữ liệu đã tải khi mạng yếu.',
          en: 'Pages open faster on repeat visits, and data you have already loaded still shows on a weak connection.',
        },
      },
      {
        icon: '❓',
        title: { vi: 'Câu hỏi thường gặp & ủng hộ người làm', en: 'FAQ & support the creator' },
        desc: {
          vi: 'Xem hướng dẫn nhanh trong mục Câu hỏi thường gặp, và mời người làm ly cà phê qua mã QR.',
          en: 'Read quick answers in the FAQ, and buy the creator a coffee with a QR code.',
        },
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-18',
    items: [
      {
        icon: '📍',
        title: { vi: 'Check-in mới', en: 'New check-in' },
        desc: {
          vi: 'Check-in nhiều lần tại một địa điểm, mỗi lần có ngày, dịp, ghi chú và ảnh. Xem trước địa điểm ngay trong danh sách và bay mượt tới đó trên bản đồ.',
          en: 'Check in at a place as many times as you like, each with a date, occasion, note and photos. Preview places right in the list and fly smoothly to them on the map.',
        },
      },
      {
        icon: '🧳',
        title: { vi: 'Lên kế hoạch chuyến đi', en: 'Trip planning' },
        desc: {
          vi: 'Lịch trình theo ngày, checklist, chi phí nhiều loại tiền và chia tiền, xuất lịch trình ra PDF, xem đường đi trên bản đồ.',
          en: 'Day-by-day plans, checklists, multi-currency costs and settle-up, PDF itineraries and the route on the map.',
        },
      },
    ],
  },
];

export const LATEST_VERSION = RELEASES[0].version;
