import { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import MapView from './components/MapView';
import SidePanel from './components/SidePanel';
import SearchBox from './components/SearchBox';
import Modals from './components/Modals';
import { Avatar } from './components/ui';
import { ExplorePage, MemoriesPage, TripsPage } from './pages/Pages';
import { firebaseEnabled } from './lib/firebase';

const NAV = [
  { id: 'map', label: 'Bản đồ', icon: '🗺️' },
  { id: 'explore', label: 'Khám phá', icon: '🌍' },
  { id: 'memories', label: 'Kỉ niệm', icon: '📸' },
  { id: 'trips', label: 'Chuyến đi', icon: '🧳' },
];

function UserMenu() {
  const { user, api, requireLogin } = useApp();
  const [open, setOpen] = useState(false);
  if (user === undefined) return <span className="avatar avatar--letter skeleton" />;
  if (!user)
    return (
      <button className="btn btn--dark btn--sm" onClick={() => requireLogin(() => {})}>
        Đăng nhập
      </button>
    );
  return (
    <div className="user-menu">
      <button className="user-menu__btn" onClick={() => setOpen((v) => !v)} aria-label="Tài khoản">
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
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { view, setView, toast, activeTripId, trips, setActiveTripId } = useApp();
  const activeTrip = trips.find((t) => t.id === activeTripId);
  return (
    <div className={`app view-${view}`}>
      <header className="topbar">
        <button className="logo" onClick={() => setView('map')}>
          <span className="logo__mark">📍</span>
          <span className="logo__text">
            Bản đồ <em>du lịch</em>
          </span>
        </button>
        <SearchBox />
        <nav className="nav nav--top">
          {NAV.map((n) => (
            <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <UserMenu />
      </header>

      <main className="main">
        <div className="map-wrap" aria-hidden={view !== 'map'}>
          <MapView />
          {activeTrip && view === 'map' && (
            <div className="trip-badge">
              {activeTrip.emoji} Đang xem chuyến <b>{activeTrip.name}</b>
              <button onClick={() => setActiveTripId(null)} aria-label="Tắt">✕</button>
            </div>
          )}
          <div className="legend">
            <span><i className="dot dot--visited" />Đã đến</span>
            <span><i className="dot dot--wish" />Muốn đi</span>
            <span><i className="dot dot--famous" />Nổi tiếng</span>
            {activeTrip && <span><i className="dot dot--trip" />Chuyến đi</span>}
          </div>
          {view === 'map' && <SidePanel />}
        </div>
        {view === 'explore' && <ExplorePage />}
        {view === 'memories' && <MemoriesPage />}
        {view === 'trips' && <TripsPage />}
      </main>

      <nav className="nav nav--bottom">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
            <span>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {!firebaseEnabled && <div className="demo-flag">Chế độ demo · dữ liệu lưu trên trình duyệt</div>}
      {toast && <div className={`toast toast--${toast.kind}`} key={toast.id}>{toast.msg}</div>}
      <Modals />
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
