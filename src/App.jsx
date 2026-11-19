import { lazy, Suspense, useEffect, useState } from 'react';
import { currentAnnouncement } from './lib/announcements';
import { AppProvider, useApp } from './AppContext';
import MapView from './components/MapView';
import SidePanel from './components/SidePanel';
import PickPanel from './components/PickPanel';
import SearchBox from './components/SearchBox';
import Modals from './components/Modals';
import FeedbackLauncher from './components/FeedbackLauncher';
import PullToRefresh from './components/PullToRefresh';
import QuickTour, { startQuickTour } from './components/QuickTour';
import Notifications from './components/Notifications';
import { Avatar, Loader, AppLink } from './components/ui';
import { hrefView, hrefProfile } from './lib/route';
// Các trang ngoài bản đồ chỉ tải khi người dùng mở → trang đầu hiện nhanh hơn
const GuidePage = lazy(() => import('./pages/Guide'));
const TipsPage = lazy(() => import('./pages/Tips'));
const LegalPage = lazy(() => import('./pages/Legal'));
const AboutPage = lazy(() => import('./pages/About'));
const AccountPage = lazy(() => import('./pages/Account'));
const ExplorePage = lazy(() => import('./pages/Pages').then((m) => ({ default: m.ExplorePage })));
const MemoriesPage = lazy(() => import('./pages/Pages').then((m) => ({ default: m.MemoriesPage })));
const TripsPage = lazy(() => import('./pages/Pages').then((m) => ({ default: m.TripsPage })));
const AdminPage = lazy(() => import('./pages/Admin'));
const ProfilePage = lazy(() => import('./pages/Profile'));
import { firebaseEnabled } from './lib/firebase';
import { hasUnseenRelease } from './lib/release';

/** Có bản phát hành mới mà người dùng chưa xem (tính lại mỗi khi đóng/mở hộp thoại) */
function useHasNewRelease(modal) {
  const [v, setV] = useState(hasUnseenRelease);
  useEffect(() => setV(hasUnseenRelease()), [modal]);
  return v;
}
import { useI18n, LANGS } from './i18n';

const NAV = [
  { id: 'map', icon: '🗺️' },
  { id: 'explore', icon: '🌍' },
  { id: 'guide', icon: '📖' },
  { id: 'memories', icon: '📸' },
  { id: 'trips', icon: '🧳' },
];

/** Nút lá cờ đổi ngôn ngữ: bấm để chuyển sang ngôn ngữ còn lại */
function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  const next = LANGS.find((l) => l.id !== lang);
  const cur = LANGS.find((l) => l.id === lang);
  return (
    <button className="lang-btn" onClick={() => setLang(next.id)} title={`${t('lang.switch')}: ${next.label}`} aria-label={`${t('lang.switch')}: ${next.label}`}>
      <span className="lang-btn__flag">{cur.flag}</span>
      <span className="lang-btn__code">{cur.id.toUpperCase()}</span>
    </button>
  );
}

function UserMenu() {
  const { user, api, requireLogin, setModal, openProfile, modal, setView, can } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const hasNew = useHasNewRelease(modal);
  if (user === undefined) return <span className="avatar avatar--letter skeleton" />;
  if (!user)
    return (
      <div className="row topbar__guest">
        <a className="btn btn--ghost btn--sm topbar__about" href="#/about">
          ℹ️ {t('about.link')}
        </a>
        <button className="btn btn--dark btn--sm" onClick={() => requireLogin(() => {})}>
          {t('auth.login')}
        </button>
      </div>
    );
  return (
    <div className="user-menu">
      <button className="user-menu__btn" onClick={() => setOpen((v) => !v)} aria-label={t('auth.account')}>
        <Avatar name={user.name} photo={user.photo} size={36} />
        {hasNew && <span className="dot-new dot-new--avatar" />}
      </button>
      {open && (
        <div className="user-menu__pop" onMouseLeave={() => setOpen(false)}>
          <b>{user.name}</b>
          <small className="muted">{user.email}</small>
          <AppLink
            href={hrefProfile(user.uid)}
            className="btn btn--sm btn--ghost"
            onClick={() => {
              openProfile(user.uid);
              setOpen(false);
            }}
          >
            👤 {t('social.myProfile')}
          </AppLink>
          <a className="btn btn--sm btn--ghost" href="#/about" onClick={() => setOpen(false)}>
            ℹ️ {t('about.menu')}
          </a>
          {can('whatsNew') && (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setModal({ type: 'whatsNew' });
                setOpen(false);
              }}
            >
              🆕 {t('rn.open')}
              {hasNew && <span className="dot-new" />}
            </button>
          )}
          {can('quickTour') && (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setOpen(false);
                startQuickTour();
              }}
            >
              🧭 {t('tour.open')}
            </button>
          )}
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => {
              setModal({ type: 'faq' });
              setOpen(false);
            }}
          >
            ❓ {t('faq.open')}
          </button>
          {can('feedback') && (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setModal({ type: 'feedback' });
                setOpen(false);
              }}
            >
              💬 {t('fb.menu')}
            </button>
          )}
          {can('sponsor') && (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setModal({ type: 'sponsor' });
                setOpen(false);
              }}
            >
              ☕ {t('sponsor.open')}
            </button>
          )}
          <button
            className="btn btn--sm btn--soft"
            onClick={() => {
              api.signOut();
              setOpen(false);
            }}
          >
            {t('auth.logout')}
          </button>
          <small className="muted user-menu__ver">
            <a href="#/about" onClick={() => setOpen(false)}>{t('about.link')}</a> · <a href="#/privacy" onClick={() => setOpen(false)}>{t('legal.privacy')}</a> · <a href="#/terms" onClick={() => setOpen(false)}>{t('legal.terms')}</a> · v{__APP_VERSION__}
          </small>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { view, setView, toast, activeTripId, trips, setActiveTripId, pickMode, setPickMode, countries, user, isStaff, settings, banned, goHome, can } = useApp();
  const { t, lang } = useI18n();
  // Mục menu theo cài đặt trang (bật/tắt tính năng) và quyền quản trị
  const nav = NAV.filter((n) => (n.id === 'explore' || n.id === 'trips' || n.id === 'guide' ? can(n.id) : true)).concat(
    isStaff ? [{ id: 'admin', icon: '🛠️' }] : [],
  );
  // Thông báo đầu trang: theo lịch (Quản trị → Thông báo đầu trang), cập nhật mỗi phút
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const ann = currentAnnouncement(settings, nowTick);
  const annText = ann ? (lang === 'en' ? ann.en || ann.vi : ann.vi || ann.en) : '';
  const [annClosed, setAnnClosed] = useState(() => sessionStorage.getItem('travel-map-ann') || '');
  const activeTrip = trips.find((t) => t.id === activeTripId);
  // Giữ các trang đã mở trong DOM để khi quay lại vẫn còn tab, bộ lọc và vị trí cuộn
  const [mounted, setMounted] = useState(() => new Set([view]));
  useEffect(() => setMounted((m) => (m.has(view) ? m : new Set([...m, view]))), [view]);
  const pageCls = (id) => (view === id ? '' : 'page-hidden');
  return (
    <div className={`app view-${view} ${annText && annClosed !== annText ? 'app--ann' : ''}`}>
      {can('pullToRefresh') && <PullToRefresh />}
      {can('quickTour') && <QuickTour />}
      <header className="topbar">
        <AppLink href="#/" className="logo" onClick={goHome} title={t('app.home')}>
          <span className="logo__mark" aria-hidden>
            <svg viewBox="0 0 64 64" width="38" height="38">
              <rect width="64" height="64" rx="18" fill="#FFC629" />
              <path d="M32 12c-8.3 0-15 6.5-15 14.6C17 37.5 32 52 32 52s15-14.5 15-25.4C47 18.5 40.3 12 32 12z" fill="#1F1A14" />
              <circle cx="32" cy="27" r="6" fill="#FFC629" />
            </svg>
          </span>
          <span className="logo__text">
            {t('app.logo1')} <em>{t('app.logo2')}</em>
          </span>
        </AppLink>
        <SearchBox />
        <nav className="nav nav--top">
          {nav.map((n) => (
            <AppLink key={n.id} href={hrefView(n.id)} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
              {n.icon} {t('nav.' + n.id)}
            </AppLink>
          ))}
        </nav>
        <LangSwitch />
        <Notifications />
        <UserMenu />
      </header>
      {annText && annClosed !== annText && (
        <div className={`announce announce--floating announce--${ann.tone || 'info'}`} role="status">
          <span>{annText}</span>
          <button
            onClick={() => {
              sessionStorage.setItem('travel-map-ann', annText);
              setAnnClosed(annText);
            }}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
      )}

      <main className="main">
        <div className="map-wrap" aria-hidden={view !== 'map'}>
          <MapView />
          {activeTrip && view === 'map' && (
            <div className="trip-badge">
              {activeTrip.emoji} {t('map.viewingTrip')} <b>{activeTrip.name}</b>
              <button onClick={() => setActiveTripId(null)} aria-label={t('map.off')}>✕</button>
            </div>
          )}
          {pickMode === 'memory' && view === 'map' && (
            <div className="pick-banner">
              📍 {t('pick.banner')}
              <button onClick={() => setPickMode(null)}>{t('pick.cancel')}</button>
            </div>
          )}
          <div className="legend">
            <span><i className="dot dot--visited" />{t('legend.visited')}</span>
            <span><i className="dot dot--wish" />{t('legend.wish')}</span>
            <span><i className="dot dot--famous" />{t('legend.famous')}</span>
            {activeTrip && <span><i className="dot dot--trip" />{t('legend.trip')}</span>}
          </div>
          {/* Đang chọn 1 điểm cho kỉ niệm: ẩn bảng bên để chạm được bản đồ (nhất là trên điện thoại) */}
          {view === 'map' && (pickMode === 'place' ? <PickPanel /> : pickMode === 'memory' ? null : <SidePanel />)}
        </div>
        <Suspense fallback={view !== 'map' ? <div className="page"><Loader /></div> : null}>
          {mounted.has('explore') && can('explore') && <div className={pageCls('explore')}><ExplorePage /></div>}
          {mounted.has('memories') && <div className={pageCls('memories')}><MemoriesPage /></div>}
          {mounted.has('trips') && can('trips') && <div className={pageCls('trips')}><TripsPage /></div>}
          {mounted.has('admin') && view === 'admin' && <AdminPage />}
          {view === 'profile' && <ProfilePage />}
          {(view === 'privacy' || view === 'terms') && <LegalPage kind={view} />}
          {view === 'account' && <AccountPage />}
          {view === 'about' && <AboutPage />}
          {view === 'guide' && can('guide') && <GuidePage />}
          {view === 'tips' && <TipsPage />}
        </Suspense>
      </main>

      <nav className="nav nav--bottom">
        {nav.map((n) => (
          <AppLink key={n.id} href={hrefView(n.id)} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
            <span>{n.icon}</span>
            {t('nav.' + n.id)}
          </AppLink>
        ))}
      </nav>

      {!firebaseEnabled && <div className="demo-flag">{t('demo.flag')}</div>}
      {banned && <div className="announce announce--floating announce--warning">{t('admin.bannedNotice')}</div>}
      {toast && <div className={`toast toast--${toast.kind}`} key={toast.id}>{toast.msg}</div>}
      <Modals />
      {user && can('feedback') && <FeedbackLauncher />}
      {(!countries || user === undefined) && <Loader page size="md" />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
