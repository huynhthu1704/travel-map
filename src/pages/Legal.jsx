import { useI18n } from '../i18n';
import { useApp } from '../AppContext';

import { LEGAL_VERSION } from '../data/legal';
// Email liên hệ đặt trong biến môi trường VITE_CONTACT_EMAIL (không ghi cứng trong mã nguồn).
// Chưa đặt → hướng dẫn dùng nút Góp ý trong ứng dụng.
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
function Contact({ vi }) {
  if (CONTACT_EMAIL) return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  return <span>{vi ? 'nút “Góp ý” ở cạnh màn hình' : 'the “Feedback” button on the screen edge'}</span>;
}

const THIRD = {
  vi: [
    ['Google (Firebase Authentication, Cloud Firestore)', 'Đăng nhập bằng Google; lưu tài khoản, check-in, ảnh đã nén, chuyến đi, thông báo. Máy chủ của Google.'],
    ['GitHub Pages', 'Lưu trữ và phân phối mã nguồn trang web. GitHub có thể ghi nhật ký truy cập (địa chỉ IP) theo chính sách của GitHub.'],
    ['OpenStreetMap / Nominatim', 'Tìm kiếm địa điểm và tra ngược toạ độ → tên địa điểm. Nội dung bạn gõ vào ô tìm kiếm và toạ độ được gửi tới máy chủ của OpenStreetMap.'],
    ['OpenFreeMap / OpenMapTiles / tile.openstreetmap.org', 'Tải hình nền bản đồ. Máy chủ biết khu vực bản đồ bạn đang xem.'],
    ['Wikidata, Wikimedia Commons, QLever (Đại học Freiburg)', 'Danh sách địa điểm nổi tiếng và ảnh minh hoạ.'],
    ['open.er-api.com', 'Tỉ giá ngoại tệ cho phần chi phí chuyến đi. Không gửi thông tin cá nhân.'],
    ['r.jina.ai, unshorten.me', 'Chỉ khi bạn dán link rút gọn Google Maps: link đó được gửi đi để lấy link đầy đủ.'],
  ],
  en: [
    ['Google (Firebase Authentication, Cloud Firestore)', 'Google sign-in; stores your account, check-ins, compressed photos, trips and notifications on Google servers.'],
    ['GitHub Pages', 'Hosts and serves the website code. GitHub may log access (IP addresses) under its own policy.'],
    ['OpenStreetMap / Nominatim', 'Place search and reverse geocoding. What you type in the search box and map coordinates are sent to OpenStreetMap servers.'],
    ['OpenFreeMap / OpenMapTiles / tile.openstreetmap.org', 'Map background tiles. These servers see which map area you are viewing.'],
    ['Wikidata, Wikimedia Commons, QLever (University of Freiburg)', 'Famous-place lists and illustration photos.'],
    ['open.er-api.com', 'Exchange rates for trip costs. No personal data is sent.'],
    ['r.jina.ai, unshorten.me', 'Only when you paste a shortened Google Maps link: that link is sent to resolve the full address.'],
  ],
};

function Privacy({ vi }) {
  const L = vi ? 'vi' : 'en';
  return vi ? (
    <>
      <p>Chính sách này giải thích Travel Map thu thập dữ liệu gì, dùng để làm gì và bạn có những quyền gì. Trang được vận hành bởi cá nhân, theo tinh thần Luật Bảo vệ dữ liệu cá nhân của Việt Nam (Luật số 91/2025/QH15).</p>
      <h3>1. Dữ liệu chúng tôi thu thập</h3>
      <ul>
        <li><b>Tài khoản Google:</b> tên, email, ảnh đại diện, mã người dùng (uid).</li>
        <li><b>Nội dung bạn tạo:</b> địa điểm đã đến / muốn đến, check-in (ghi chú, ngày, dịp, ảnh đã nén), chuyến đi, kế hoạch, chi phí, checklist, tên hiển thị, @tên người dùng, giới thiệu, ảnh đại diện tự tải.</li>
        <li><b>Tương tác:</b> theo dõi, lượt thích, thông báo, lời mời chuyến đi, báo cáo nội dung, góp ý / báo lỗi (có thể kèm ảnh chụp màn hình bạn chọn gửi).</li>
        <li><b>Kỹ thuật:</b> thời điểm đăng nhập gần nhất, số liệu thống kê đếm (số check-in, số ảnh…). Không dùng cookie quảng cáo. Trình duyệt lưu bộ nhớ đệm trên máy bạn để chạy nhanh hơn; bộ nhớ đệm được xoá khi bạn đăng xuất.</li>
      </ul>
      <h3>2. Mục đích</h3>
      <p>Hiển thị bản đồ và nhật ký du lịch của bạn; chia sẻ với người khác theo đúng chế độ bạn chọn (công khai / riêng tư / thành viên chuyến đi); gửi thông báo trong ứng dụng; kiểm duyệt nội dung bị báo cáo; sửa lỗi và cải thiện sản phẩm.</p>
      <h3>3. Ai xem được dữ liệu của bạn</h3>
      <ul>
        <li>Check-in <b>công khai</b>: mọi người, kể cả chưa đăng nhập. Check-in <b>riêng tư</b>: chỉ bạn (và thành viên chuyến đi nếu gắn với chuyến đi).</li>
        <li>Chuyến đi: chỉ thành viên đã tham gia.</li>
        <li>Hồ sơ: người đã đăng nhập thấy tên, @tên, ảnh, giới thiệu. Nếu bật <i>Hồ sơ riêng tư</i>, thống kê chi tiết chỉ hiện với người theo dõi chéo.</li>
        <li>Quản trị viên / biên tập viên: xem được nội dung bị báo cáo và thông tin tài khoản cần cho việc quản lý. Biên tập viên chỉ thấy email đã được che một phần. Mọi thao tác quản trị đều được ghi nhật ký.</li>
      </ul>
      <h3>4. Bên thứ ba xử lý dữ liệu</h3>
      <ul>
        {THIRD[L].map(([n, d]) => (
          <li key={n}>
            <b>{n}:</b> {d}
          </li>
        ))}
      </ul>
      <p>Dữ liệu có thể được lưu ở máy chủ ngoài Việt Nam (Google, GitHub). Chúng tôi không bán dữ liệu cá nhân. Hiện chưa có quảng cáo; nếu bật quảng cáo sau này, chính sách sẽ được cập nhật và bạn sẽ được hỏi đồng ý.</p>
      <h3>5. Thời gian lưu</h3>
      <p>Dữ liệu được lưu đến khi bạn xoá nội dung đó hoặc xoá tài khoản. Khi xoá tài khoản, toàn bộ dữ liệu gắn với bạn bị xoá; chúng tôi chỉ giữ lại một con số đếm ẩn danh (bao nhiêu tài khoản đã xoá mỗi tháng), không thể dùng để nhận ra bạn.</p>
      <h3>6. Quyền của bạn</h3>
      <ul>
        <li>Xem, sửa, xoá nội dung của bạn bất cứ lúc nào.</li>
        <li>Tải về toàn bộ dữ liệu (Hồ sơ → Tài khoản & dữ liệu → Tải dữ liệu của tôi).</li>
        <li>Xoá tài khoản (Hồ sơ → Tài khoản & dữ liệu → Xoá tài khoản).</li>
        <li>Rút lại đồng ý bằng cách xoá tài khoản; khiếu nại hoặc hỏi đáp qua kênh liên hệ bên dưới.</li>
      </ul>
      <h3>7. Trẻ em</h3>
      <p>Travel Map không dành cho người dưới 16 tuổi. Nếu bạn dưới 16 tuổi, cần có sự đồng ý của cha mẹ hoặc người giám hộ.</p>
      <h3>8. Liên hệ</h3>
      <p>
        {vi ? 'Liên hệ' : 'Contact'}: <Contact vi={vi} />
      </p>
    </>
  ) : (
    <>
      <p>This policy explains what Travel Map collects, why, and what rights you have. The site is run by an individual, following the spirit of Vietnam’s Personal Data Protection Law (Law No. 91/2025/QH15).</p>
      <h3>1. Data we collect</h3>
      <ul>
        <li><b>Google account:</b> name, email, profile photo, user id (uid).</li>
        <li><b>Content you create:</b> visited / wishlist places, check-ins (notes, dates, occasions, compressed photos), trips, plans, costs, checklists, display name, @username, bio, uploaded avatar.</li>
        <li><b>Interactions:</b> follows, likes, notifications, trip invites, content reports, feedback / bug reports (with screenshots you choose to send).</li>
        <li><b>Technical:</b> last sign-in time and simple counters (number of check-ins, photos…). No advertising cookies. Your browser keeps a local cache for speed; it is cleared when you sign out.</li>
      </ul>
      <h3>2. Purpose</h3>
      <p>To show your map and travel journal; share it with others exactly as you choose (public / private / trip members); send in-app notifications; moderate reported content; fix bugs and improve the product.</p>
      <h3>3. Who can see your data</h3>
      <ul>
        <li><b>Public</b> check-ins: everyone, even signed-out visitors. <b>Private</b> check-ins: only you (and trip members if attached to a trip).</li>
        <li>Trips: only members who have joined.</li>
        <li>Profile: signed-in users see your name, @username, photo and bio. With <i>Private profile</i> on, detailed stats are shown only to mutual followers.</li>
        <li>Admins / editors: can see reported content and the account details needed to manage the site. Editors only see partly masked emails. All admin actions are logged.</li>
      </ul>
      <h3>4. Third parties that process data</h3>
      <ul>
        {THIRD[L].map(([n, d]) => (
          <li key={n}>
            <b>{n}:</b> {d}
          </li>
        ))}
      </ul>
      <p>Data may be stored on servers outside Vietnam (Google, GitHub). We do not sell personal data. There are no ads yet; if ads are added, this policy will be updated and your consent requested.</p>
      <h3>5. Retention</h3>
      <p>Data is kept until you delete that content or your account. When you delete your account, all data tied to you is deleted; we only keep an anonymous count (how many accounts were deleted per month) that cannot identify you.</p>
      <h3>6. Your rights</h3>
      <ul>
        <li>View, edit and delete your content at any time.</li>
        <li>Download all your data (Profile → Account & data → Download my data).</li>
        <li>Delete your account (Profile → Account & data → Delete account).</li>
        <li>Withdraw consent by deleting your account; send questions or complaints via the contact below.</li>
      </ul>
      <h3>7. Children</h3>
      <p>Travel Map is not intended for people under 16. If you are under 16 you need a parent’s or guardian’s consent.</p>
      <h3>8. Contact</h3>
      <p>
        {vi ? 'Liên hệ' : 'Contact'}: <Contact vi={vi} />
      </p>
    </>
  );
}

function Terms({ vi }) {
  return vi ? (
    <>
      <p>Khi dùng Travel Map, bạn đồng ý với các điều khoản sau.</p>
      <h3>1. Tài khoản</h3>
      <p>Bạn đăng nhập bằng tài khoản Google của mình và chịu trách nhiệm về hoạt động trong tài khoản. Không mạo danh người khác, không chọn @tên gây hiểu lầm hoặc xúc phạm.</p>
      <h3>2. Nội dung của bạn</h3>
      <ul>
        <li>Bạn giữ quyền sở hữu ảnh và nội dung bạn đăng. Khi đăng ở chế độ công khai, bạn cho phép Travel Map hiển thị nội dung đó cho người khác trong ứng dụng.</li>
        <li>Chỉ đăng ảnh bạn có quyền sử dụng. Cân nhắc trước khi đăng công khai ảnh có người khác hoặc trẻ em, và không đăng địa chỉ nhà riêng.</li>
        <li>Không đăng nội dung vi phạm pháp luật, bạo lực, khiêu dâm, thù ghét, quấy rối, spam hoặc quảng cáo trái phép.</li>
      </ul>
      <h3>3. Kiểm duyệt</h3>
      <p>Người dùng có thể báo cáo nội dung. Quản trị viên có thể ẩn nội dung vi phạm, khoá tài khoản vi phạm nhiều lần. Bạn sẽ nhận thông báo khi nội dung của mình bị ẩn.</p>
      <h3>4. Chuyến đi chung</h3>
      <p>Thành viên chuyến đi cùng xem và sửa kế hoạch, chi phí, checklist chung. Phần chia chi phí chỉ để tham khảo; Travel Map không xử lý tiền và không chịu trách nhiệm về việc thanh toán giữa các thành viên.</p>
      <h3>5. Thông tin địa điểm</h3>
      <p>Thông tin bản đồ, địa điểm, tỉ giá lấy từ nguồn mở và có thể chưa chính xác. Hãy kiểm tra lại trước khi đi.</p>
      <h3>6. Dịch vụ</h3>
      <p>Travel Map được cung cấp miễn phí “như hiện có”. Tính năng có thể thay đổi, tạm dừng hoặc ngừng. Hãy dùng “Tải dữ liệu của tôi” để tự sao lưu.</p>
      <h3>7. Chấm dứt</h3>
      <p>Bạn có thể xoá tài khoản bất cứ lúc nào. Chúng tôi có thể khoá tài khoản vi phạm điều khoản.</p>
      <h3>8. Thay đổi</h3>
      <p>Khi điều khoản hoặc chính sách thay đổi đáng kể, bạn sẽ được hỏi đồng ý lại khi đăng nhập.</p>
      <p>
        Liên hệ: <Contact vi />
      </p>
    </>
  ) : (
    <>
      <p>By using Travel Map you agree to these terms.</p>
      <h3>1. Account</h3>
      <p>You sign in with your own Google account and are responsible for activity in it. Don’t impersonate others or pick a misleading or offensive @username.</p>
      <h3>2. Your content</h3>
      <ul>
        <li>You keep ownership of the photos and content you post. Posting publicly lets Travel Map show that content to others in the app.</li>
        <li>Only post photos you have the right to use. Think before publicly posting photos of other people or children, and don’t post your home address.</li>
        <li>No illegal, violent, sexual, hateful, harassing, spam or unauthorised advertising content.</li>
      </ul>
      <h3>3. Moderation</h3>
      <p>Users can report content. Admins may hide violating content and ban repeat offenders. You are notified when your content is hidden.</p>
      <h3>4. Shared trips</h3>
      <p>Trip members see and edit the shared plan, costs and checklists together. Cost splitting is for reference only; Travel Map does not handle money and is not responsible for payments between members.</p>
      <h3>5. Place information</h3>
      <p>Map, place and exchange-rate data come from open sources and may be inaccurate. Double-check before you travel.</p>
      <h3>6. Service</h3>
      <p>Travel Map is provided free and “as is”. Features may change, pause or stop. Use “Download my data” to keep your own backup.</p>
      <h3>7. Termination</h3>
      <p>You can delete your account at any time. We may ban accounts that break these terms.</p>
      <h3>8. Changes</h3>
      <p>When the terms or policy change significantly, you’ll be asked to agree again when you sign in.</p>
      <p>
        Contact: <Contact />
      </p>
    </>
  );
}

export default function LegalPage({ kind }) {
  const { lang, t } = useI18n();
  const { setView } = useApp();
  const vi = lang === 'vi';
  return (
    <div className="page">
      <article className="legal card">
        <nav className="legal__tabs" aria-label={t('legal.privacy') + ' / ' + t('legal.terms')}>
          {['privacy', 'terms'].map((k) => (
            <a key={k} href={`#/${k}`} className={kind === k ? 'on' : ''} aria-current={kind === k ? 'page' : undefined} onClick={() => setView(k)}>
              {k === 'privacy' ? '🛡️' : '📜'} {t(`legal.${k}`)}
            </a>
          ))}
        </nav>
        <header className="legal__head">
          <h1 className="h1">{kind === 'terms' ? t('legal.terms') : t('legal.privacy')}</h1>
          <p className="tiny muted">{t('legal.updated', { date: LEGAL_VERSION })}</p>
        </header>
        {kind === 'terms' ? <Terms vi={vi} /> : <Privacy vi={vi} />}
      </article>
    </div>
  );
}
