import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import MapView from './components/MapView';
import SidePanel from './components/SidePanel';
import PickPanel from './components/PickPanel';
import SearchBox from './components/SearchBox';
import Modals from './components/Modals';
import { Avatar, Loader } from './components/ui';
// Các trang ngoài bản đồ chỉ tải khi người dùng mở → trang đầu hiện nhanh hơn
const ExplorePage = lazy(() => import('./pages/Pages').then((m) => ({ default: m.ExplorePage })));
const MemoriesPage = lazy(() => import('./pages/Pages').then((m) => ({ default: m.MemoriesPage })));
const TripsPage = lazy(() => import('./pages/Pages').then((m) => ({ default: m.TripsPage })));
const AdminPage = lazy(() => import('./pages/Admin'));
import { firebaseEnabled } from './lib/firebase';
import { useI18n, LANGS } from './i18n';

const NAV = [
  { id: 'map', icon: '🗺️' },
  { id: 'explore', icon: '🌍' },
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
  const { user, api, requireLogin, setModal } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (user === undefined) return <span className="avatar avatar--letter skeleton" />;
  if (!user)
    return (
      <button className="btn btn--dark btn--sm" onClick={() => requireLogin(() => {})}>
        {t('auth.login')}
      </button>
    );
  return (
    <div className="user-menu">
      <button className="user-menu__btn" onClick={() => setOpen((v) => !v)} aria-label={t('auth.account')}>
        <Avatar name={user.name} photo={user.photo} size={36} />
      </button>
      {open && (
        <div className="user-menu__pop" onMouseLeave={() => setOpen(false)}>
          <b>{user.name}</b>
          <small className="muted">{user.email}</small>
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => {
              setModal({ type: 'profile' });
              setOpen(false);
            }}
          >
            ✏️ {t('profile.edit')}
          </button>
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => {
              setModal({ type: 'faq' });
              setOpen(false);
            }}
          >
            ❓ {t('faq.open')}
          </button>
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => {
              setModal({ type: 'sponsor' });
              setOpen(false);
            }}
          >
            ☕ {t('sponsor.open')}
          </button>
          <button
            className="btn btn--sm btn--soft"
            onClick={() => {
              api.signOut();
              setOpen(false);
            }}
          >
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { view, setView, toast, activeTripId, trips, setActiveTripId, pickMode, setPickMode, countries, user, isStaff, settings, banned, goHome } = useApp();
  const { t, lang } = useI18n();
  // Mục menu theo cài đặt trang (bật/tắt tính năng) và quyền quản trị
  const nav = NAV.filter((n) => (n.id === 'explore' ? settings.features.explore !== false : n.id === 'trips' ? settings.features.trips !== false : true)).concat(
    isStaff ? [{ id: 'admin', icon: '🛠️' }] : [],
  );
  const ann = settings.announcement;
  const annText = ann?.active ? (lang === 'en' ? ann.en || ann.vi : ann.vi || ann.en) : '';
  const [annClosed, setAnnClosed] = useState(() => sessionStorage.getItem('travel-map-ann') || '');
  const activeTrip = trips.find((t) => t.id === activeTripId);
  // Giữ các trang đã mở trong DOM để khi quay lại vẫn còn tab, bộ lọc và vị trí cuộn
  const [mounted, setMounted] = useState(() => new Set([view]));
  useEffect(() => setMounted((m) => (m.has(view) ? m : new Set([...m, view]))), [view]);
  const pageCls = (id) => (view === id ? '' : 'page-hidden');
  return (
    <div className={`app view-${view}`}>
      <header className="topbar">
        <button className="logo" onClick={goHome} title={t('app.home')}>
          <span className="logo__mark">📍</span>
          <span className="logo__text">
            {t('app.logo1')} <em>{t('app.logo2')}</em>
          </span>
        </button>
        <SearchBox />
        <nav className="nav nav--top">
          {nav.map((n) => (
            <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
              {n.icon} {t('nav.' + n.id)}
            </button>
          ))}
        </nav>
        <LangSwitch />
        <UserMenu />
      </header>

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
          {view === 'map' && (pickMode === 'place' ? <PickPanel /> : <SidePanel />)}
        </div>
        <Suspense fallback={view !== 'map' ? <div className="page"><Loader /></div> : null}>
          {mounted.has('explore') && <div className={pageCls('explore')}><ExplorePage /></div>}
          {mounted.has('memories') && <div className={pageCls('memories')}><MemoriesPage /></div>}
          {mounted.has('trips') && <div className={pageCls('trips')}><TripsPage /></div>}
          {mounted.has('admin') && view === 'admin' && <AdminPage />}
        </Suspense>
      </main>

      <nav className="nav nav--bottom">
        {nav.map((n) => (
          <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
            <span>{n.icon}</span>
            {t('nav.' + n.id)}
          </button>
        ))}
      </nav>

      {!firebaseEnabled && <div className="demo-flag">{t('demo.flag')}</div>}
      {annText && annClosed !== annText && (
        <div className={`announce announce--floating announce--${ann.tone}`} role="status">
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
      {banned && <div className="announce announce--floating announce--warning">{t('admin.bannedNotice')}</div>}
      {toast && <div className={`toast toast--${toast.kind}`} key={toast.id}>{toast.msg}</div>}
      <Modals />
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
