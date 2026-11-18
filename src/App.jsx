import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import MapView from './components/MapView';
import SidePanel from './components/SidePanel';
import PickPanel from './components/PickPanel';
import SearchBox from './components/SearchBox';
import Modals from './components/Modals';
import { Avatar, Loader } from './components/ui';
import { ExplorePage, MemoriesPage, TripsPage } from './pages/Pages';
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
  const { user, api, requireLogin } = useApp();
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
  const { view, setView, toast, activeTripId, trips, setActiveTripId, pickMode, setPickMode, countries, user } = useApp();
  const { t } = useI18n();
  const activeTrip = trips.find((t) => t.id === activeTripId);
  // Giữ các trang đã mở trong DOM để khi quay lại vẫn còn tab, bộ lọc và vị trí cuộn
  const [mounted, setMounted] = useState(() => new Set([view]));
  useEffect(() => setMounted((m) => (m.has(view) ? m : new Set([...m, view]))), [view]);
  const pageCls = (id) => (view === id ? '' : 'page-hidden');
  return (
    <div className={`app view-${view}`}>
      <header className="topbar">
        <button className="logo" onClick={() => setView('map')}>
          <span className="logo__mark">📍</span>
          <span className="logo__text">
            {t('app.logo1')} <em>{t('app.logo2')}</em>
          </span>
        </button>
        <SearchBox />
        <nav className="nav nav--top">
          {NAV.map((n) => (
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
        {mounted.has('explore') && <div className={pageCls('explore')}><ExplorePage /></div>}
        {mounted.has('memories') && <div className={pageCls('memories')}><MemoriesPage /></div>}
        {mounted.has('trips') && <div className={pageCls('trips')}><TripsPage /></div>}
      </main>

      <nav className="nav nav--bottom">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
            <span>{n.icon}</span>
            {t('nav.' + n.id)}
          </button>
        ))}
      </nav>

      {!firebaseEnabled && <div className="demo-flag">{t('demo.flag')}</div>}
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
