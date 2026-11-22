import { BrandAppIcon } from '../components/Brand.jsx';
import { groupFeatures } from '../data/aboutGroups';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { Modal } from '../components/ui';
import { useI18n } from '../i18n';
import { FLAGS, flagReleased } from '../data/flags';
import { RELEASES } from '../data/releases';
import { formatDate } from '../components/ui';

/* ------------------------------------------------------------------ */
/* Trang Giới thiệu (#/about)                                          */
/*  - Các phần chính: nội dung cố định, ẩn nếu tính năng đang tắt       */
/*  - "Còn nhiều hơn thế": tự lấy từ FLAGS (mục có `value`) khi đã      */
/*    phát hành cho mọi người                                          */
/*  - "Mới cập nhật": tự lấy từ ghi chú phát hành (RELEASES)            */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    id: 'map',
    shot: 'map',
    icon: '🗺️',
    eyebrow: { vi: 'Bản đồ & khám phá', en: 'Map & discovery' },
    title: { vi: 'Ghim mọi nơi chỉ bằng một chạm', en: 'Pin any place with one tap' },
    steps: [
      { vi: '**Chạm vào bản đồ** hoặc tìm trong ô tìm kiếm để ghim địa điểm.', en: '**Tap the map** or use search to pin a place.' },
      { vi: 'Dán **link Google Maps** — tự lấy đúng tên và vị trí.', en: 'Paste a **Google Maps link** — the name and location fill in automatically.' },
      { vi: 'Chọn **quốc gia / thành phố** là ra danh sách địa danh nổi tiếng.', en: 'Pick a **country or city** to see its famous places.' },
    ],
    value: { vi: 'Không còn danh sách rải rác trong ghi chú và ảnh chụp màn hình.', en: 'No more lists scattered across notes and screenshots.' },
  },
  {
    id: 'checkin',
    shot: 'checkin',
    icon: '📸',
    eyebrow: { vi: 'Check-in & kỉ niệm', en: 'Check-ins & memories' },
    title: { vi: 'Mỗi lần ghé là một dòng nhật ký', en: 'Every visit becomes a diary entry' },
    steps: [
      { vi: 'Mở địa điểm → **👣 Check-in tại đây**.', en: 'Open a place → **👣 Check in here**.' },
      { vi: 'Chọn **ngày đến, dịp**, thêm **ghi chú & ảnh**; để riêng tư hoặc công khai.', en: 'Add the **date, occasion, notes & photos**; keep it private or public.' },
      { vi: 'Quay lại lần nữa? **＋ Check-in lần nữa** — tất cả nằm trong nhật ký của địa điểm.', en: 'Back again? **＋ Check in again** — every visit stays in the place’s diary.' },
    ],
    value: { vi: 'Ảnh tải theo tốc độ mạng, mở lại gần như tức thì — cả khi dùng 4G.', en: 'Photos adapt to your connection and reopen almost instantly, even on 4G.' },
  },
  {
    id: 'trips',
    shot: 'trips',
    flag: 'trips',
    icon: '🧳',
    eyebrow: { vi: 'Chuyến đi nhóm', en: 'Group trips' },
    title: { vi: 'Rủ cả nhóm, dùng chung một bản đồ', en: 'Bring the whole group onto one map' },
    steps: [
      { vi: '**Tạo chuyến đi**: tên, ngày đi – về, điểm đến trong nước hoặc quốc tế.', en: '**Create a trip**: name, dates and destinations, local or abroad.' },
      { vi: '**Mời bạn bè** — họ bấm Tham gia là thành viên ngay.', en: '**Invite friends** — they tap Join and they’re in.' },
      { vi: 'Nơi cả nhóm đi hiện trên **bản đồ của từng người**; có thể **nhân bản** chuyến cũ.', en: 'Everywhere the group goes shows on **everyone’s map**; **duplicate** past trips.' },
    ],
    value: { vi: 'Một nguồn thông tin chung — hết cảnh “gửi lại file lịch trình đi!”.', en: 'One shared source of truth — no more “can you resend the itinerary?”.' },
  },
  {
    id: 'plan',
    shot: 'plan',
    flag: 'trips',
    icon: '🗓️',
    eyebrow: { vi: 'Lịch trình', en: 'Itinerary' },
    title: { vi: 'Ngày nào đi đâu, rõ từng giờ', en: 'Where to be, day by day, hour by hour' },
    steps: [
      { vi: 'Thêm điểm đến — có gợi ý **danh lam thắng cảnh** đúng nơi bạn đi.', en: 'Add stops — with **landmark suggestions** for where you’re going.' },
      { vi: 'Đặt **ngày & giờ**, ghi chú; tự sắp theo thời gian.', en: 'Set **dates & times** and notes; everything sorts itself.' },
      { vi: 'Trong chuyến tick **👣 Đã đi**; xem **lộ trình đánh số** trên bản đồ hoặc **xuất PDF**.', en: 'On the road, tick **👣 Visited**; see a **numbered route** on the map or **export a PDF**.' },
    ],
    value: { vi: 'Cả nhóm luôn biết hôm nay đi đâu, mấy giờ.', en: 'Everyone always knows where today goes, and when.' },
  },
  {
    id: 'costs',
    shot: 'costs',
    flag: 'tripCosts',
    icon: '💰',
    eyebrow: { vi: 'Chi phí & chia tiền', en: 'Costs & splitting' },
    title: { vi: 'Tiền nong rõ ràng, tình bạn bền lâu', en: 'Clear money, lasting friendships' },
    steps: [
      { vi: 'Nhập **chi phí dự kiến** theo nhóm hoặc theo người.', en: 'Add **estimated costs** per group or per person.' },
      { vi: 'Ghi **chi phí thực tế**: ai trả, ai tham gia, bằng **bất kỳ loại tiền nào** — tỉ giá tự cập nhật.', en: 'Log **actual spending**: who paid, who’s in, in **any currency** — rates update automatically.' },
      { vi: 'Xem **🤝 Chia tiền**: cách trả nhanh nhất, bấm **✓ Đã trả**.', en: 'Open **🤝 Settle up** for the quickest way to pay back, then tap **✓ Paid**.' },
    ],
    value: { vi: 'Không cần bảng tính, không tính nhầm tỉ giá.', en: 'No spreadsheets, no exchange-rate mistakes.' },
  },
  {
    id: 'checklist',
    shot: 'checklist',
    flag: 'tripChecklist',
    icon: '✅',
    eyebrow: { vi: 'Checklist', en: 'Checklists' },
    title: { vi: 'Không bao giờ quên hộ chiếu nữa', en: 'Never forget your passport again' },
    steps: [
      { vi: 'Chọn mẫu **🛫 Trước khi đi / 🛬 Trước khi về**, trong nước hoặc quốc tế.', en: 'Pick a **🛫 Before you go / 🛬 Before you return** template, local or abroad.' },
      { vi: 'Mỗi việc là **việc chung**, **mỗi người tự tick** hoặc **một người nhận lo**.', en: 'Each item is **shared**, **everyone ticks their own**, or **one person owns it**.' },
      { vi: 'Thêm việc riêng, kéo thả để sắp xếp; checklist cá nhân chỉ mình bạn thấy.', en: 'Add your own items and drag to reorder; personal lists are only visible to you.' },
    ],
    value: { vi: 'Biết ngay ai đã chuẩn bị xong, ai còn thiếu gì.', en: 'See at a glance who’s ready and who isn’t.' },
  },
  {
    id: 'recap',
    shot: 'recap',
    flag: 'recap',
    icon: '🎬',
    eyebrow: { vi: 'Tổng kết & chia sẻ', en: 'Recap & sharing' },
    title: { vi: 'Khoe chuyến đi theo cách thật xinh', en: 'Show off your travels, beautifully' },
    steps: [
      { vi: 'Chọn **bố cục**: Bản đồ · Lưới ảnh · Tem hộ chiếu · Dòng thời gian · Trình chiếu.', en: 'Pick a **layout**: Map · Photo grid · Passport stamps · Timeline · Slideshow.' },
      { vi: '**Tự chọn ảnh** hiển thị; mọi địa điểm đều được liệt kê đủ.', en: '**Choose the photos** to show; every place is still listed.' },
      { vi: 'Xuất **ảnh hoặc video** khung Story, Post, Vuông.', en: 'Export a **photo or video** in Story, Post or Square format.' },
    ],
    value: { vi: 'Đăng Instagram, Facebook, TikTok chỉ trong vài giây.', en: 'Post to Instagram, Facebook or TikTok in seconds.' },
  },
];
const SECTION_FLAGS = new Set(SECTIONS.map((s) => s.flag).filter(Boolean).concat(['tripPdf', 'tripDuplicate', 'tripInvites', 'share']));

/** **đậm** trong câu ngắn */
function Bold({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p));
}

export default function AboutPage() {
  const { lang, t } = useI18n();
  const { user, settings, can, isSuper, setModal, goHome, setView } = useApp();
  const L = (x) => (x ? x[lang] || x.vi : '');
  // Người khác chỉ thấy tính năng đã phát hành cho mọi người; chủ trang thấy cả bản chưa phát hành (có nhãn)
  const shown = (key) => (isSuper ? true : flagReleased(key, settings));
  const pending = (key) => isSuper && !flagReleased(key, settings);
  const sections = SECTIONS.filter((s) => !s.flag || shown(s.flag));
  const more = FLAGS.filter((f) => f.value && !SECTION_FLAGS.has(f.key) && shown(f.key));
  // REQ-013: xếp theo nhóm liên quan, quan trọng trước
  const moreGroups = groupFeatures(more);
  const releases = RELEASES.slice(0, 2);
  const start = () => (user ? (goHome(), setView('map')) : setModal({ type: 'login' }));
  const [zoom, setZoom] = useState(null);
  return (
    <div className="page about">
      <header className="about-hero card">
        <div className="about-hero__logo" aria-hidden>
          <BrandAppIcon size={88} />
        </div>
        <p className="eyebrow">{t('about.eyebrow')}</p>
        <h1 className="h1">
          Bee <span className="about-hero__accent">There</span>
        </h1>
        <p className="about-hero__lead">{t('about.lead')}</p>
        <div className="about-chips">
          <span className="chip">🗺️ {t('about.chip1')}</span>
          {can('trips') && <span className="chip">🧳 {t('about.chip2')}</span>}
          {can('tripCosts') && <span className="chip">💰 {t('about.chip3')}</span>}
        </div>
        <button className="btn btn--primary btn--lg" onClick={start}>
          {user ? `🗺️ ${t('about.openMap')}` : `✨ ${t('about.signup')}`}
        </button>
        <p className="tiny muted">{t('about.free')}</p>
      </header>

      <nav className="about-toc chips chips--scroll">
        {sections.map((s) => (
          <a key={s.id} className="chip" href={`#about-${s.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(`about-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
            {s.icon} {L(s.eyebrow)}
          </a>
        ))}
        {more.length > 0 && (
          <a className="chip" href="#about-more" onClick={(e) => (e.preventDefault(), document.getElementById('about-more')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
            ✨ {t('about.more')}
          </a>
        )}
      </nav>

      <div className="about-sections">
        {sections.map((s, i) => (
          <section key={s.id} id={`about-${s.id}`} className={`about-sec card ${i % 2 ? 'about-sec--alt' : ''}`}>
            <div className="about-sec__icon" aria-hidden>
              {s.icon}
            </div>
            <div className="about-sec__main">
              <p className="eyebrow">
                {String(i + 1).padStart(2, '0')} · {L(s.eyebrow)}
                {s.flag && pending(s.flag) && <span className="about-pending">{t('about.pending')}</span>}
              </p>
              <h2 className="h2">{L(s.title)}</h2>
              <ol className="about-steps">
                {s.steps.map((st, k) => (
                  <li key={k}>
                    <span className="about-steps__n">{k + 1}</span>
                    <span>
                      <Bold text={L(st)} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="about-value">
                <span>💡</span> {L(s.value)}
              </p>
            </div>
            {s.shot && (
              <figure className={`about-shot ${s.shot === 'checkin' ? 'about-shot--narrow' : ''}`}>
                <button type="button" className="about-shot__frame" onClick={() => setZoom(s)} aria-label={t('about.zoom')}>
                  <span className="about-shot__dots" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                  <img src={`${import.meta.env.BASE_URL}about/${s.shot}-${lang === 'en' ? 'en' : 'vi'}.webp`} alt={L(s.title)} loading="lazy" decoding="async" />
                </button>
                <figcaption className="tiny muted">{t('about.shotCaption')}</figcaption>
              </figure>
            )}
          </section>
        ))}
      </div>

      {more.length > 0 && (
        <section id="about-more" className="about-more">
          <h2 className="h2">✨ {t('about.moreTitle')}</h2>
          {moreGroups.map((g) => (
            <div key={g.id} className="about-group">
              <h3 className="h3 about-group__title">
                {g.icon} {L(g.name)}
              </h3>
              <div className="about-grid">
                {g.items.map((f) => (
                  <div key={f.key} className="card about-feat">
                    <span className="about-feat__icon">{f.icon}</span>
                    <b>
                      {L(f.name)}
                      {pending(f.key) && <span className="about-pending">{t('about.pending')}</span>}
                    </b>
                    <p>{L(f.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {releases.length > 0 && (
        <section className="about-news card">
          <h2 className="h2">🆕 {t('about.news')}</h2>
          {releases.map((r) => (
            <div key={r.version} className="about-news__rel">
              <p className="eyebrow">
                v{r.version} · {formatDate(new Date(r.date).getTime())}
              </p>
              <ul>
                {r.items.map((it, k) => (
                  <li key={k}>
                    <span>{it.icon}</span>
                    <span>
                      <b>{L(it.title)}</b>
                      <small className="muted">{L(it.desc)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {zoom && (
        <Modal title={`${zoom.icon} ${L(zoom.eyebrow)}`} onClose={() => setZoom(null)} wide className="about-zoom">
          <img src={`${import.meta.env.BASE_URL}about/${zoom.shot}-${lang === 'en' ? 'en' : 'vi'}.webp`} alt={L(zoom.title)} />
        </Modal>
      )}

      <section className="about-cta card">
        <h2 className="h2">{t('about.ctaTitle')}</h2>
        <p className="muted">{t('about.free')}</p>
        <button className="btn btn--primary btn--lg" onClick={start}>
          {user ? `🗺️ ${t('about.openMap')}` : `✨ ${t('about.signup')}`}
        </button>
      </section>
    </div>
  );
}
