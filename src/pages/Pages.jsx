import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { MemoryGrid } from '../components/SidePanel';
import { Avatar, Chip, Empty, formatDate } from '../components/ui';
import { countryName, flagOf } from '../lib/countries';
import { normalize } from '../lib/geo';

/** Bộ lọc dùng chung: tìm theo chữ + quốc gia + thành phố */
function useFilters(items, getPlace) {
  const [text, setText] = useState('');
  const [cc, setCc] = useState('');
  const [city, setCity] = useState('');
  const countries = useMemo(() => [...new Set(items.map((i) => getPlace(i)?.country).filter(Boolean))].sort(), [items, getPlace]);
  const cities = useMemo(
    () => [...new Set(items.filter((i) => !cc || getPlace(i)?.country === cc).map((i) => getPlace(i)?.city).filter(Boolean))].sort(),
    [items, cc, getPlace],
  );
  const filtered = useMemo(() => {
    const n = normalize(text.trim());
    return items.filter((i) => {
      const p = getPlace(i) || {};
      if (cc && p.country !== cc) return false;
      if (city && p.city !== city) return false;
      if (n && !normalize(`${p.name} ${p.city} ${countryName(p.country)} ${i.caption || ''} ${i.authorName || ''}`).includes(n)) return false;
      return true;
    });
  }, [items, text, cc, city, getPlace]);
  const ui = (
    <div className="filters">
      <input className="filters__search" value={text} onChange={(e) => setText(e.target.value)} placeholder="🔎 Tìm theo địa điểm, ghi chú…" />
      <select value={cc} onChange={(e) => { setCc(e.target.value); setCity(''); }} aria-label="Lọc theo quốc gia">
        <option value="">🌏 Tất cả quốc gia</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {flagOf(c)} {countryName(c)}
          </option>
        ))}
      </select>
      <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Lọc theo thành phố" disabled={!cities.length}>
        <option value="">🏙️ Tất cả thành phố</option>
        {cities.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  );
  return { filtered, ui };
}
const memPlace = (m) => m.place;

export function ExplorePage() {
  const { publicMemories } = useApp();
  const { filtered, ui } = useFilters(publicMemories, memPlace);
  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Cộng đồng</p>
          <h1 className="h1">Khám phá trước khi đi 🌍</h1>
          <p className="muted">Ảnh thật từ những người đã đặt chân tới — chia sẻ ở chế độ công khai.</p>
        </div>
      </header>
      {ui}
      {filtered.length ? <MemoryGrid items={filtered} /> : <Empty emoji="🔭" title="Chưa có ảnh phù hợp" text="Thử bỏ bớt bộ lọc nhé." />}
    </div>
  );
}

export function MemoriesPage() {
  const { user, memories, places, requireLogin, setModal, openPlace } = useApp();
  const [tab, setTab] = useState('memories');
  const { filtered, ui } = useFilters(memories, memPlace);
  const wish = places.filter((p) => p.status === 'wishlist');
  const visited = places.filter((p) => p.status === 'visited');

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="📸"
          title="Kỉ niệm của bạn sẽ ở đây"
          text="Đăng nhập Google để lưu ảnh kỉ niệm ở từng địa điểm."
          action={<button className="btn btn--primary" onClick={() => requireLogin(() => {})}>Đăng nhập</button>}
        />
      </div>
    );

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Của tôi</p>
          <h1 className="h1">Kỉ niệm & dấu chân 👣</h1>
        </div>
        <button className="btn btn--primary" onClick={() => setModal({ type: 'memory' })}>
          📸 Thêm kỉ niệm
        </button>
      </header>
      <div className="chips">
        <Chip active={tab === 'memories'} onClick={() => setTab('memories')}>📸 Kỉ niệm ({memories.length})</Chip>
        <Chip active={tab === 'visited'} onClick={() => setTab('visited')}>👣 Đã đến ({visited.length})</Chip>
        <Chip active={tab === 'wishlist'} onClick={() => setTab('wishlist')}>💛 Muốn đi ({wish.length})</Chip>
      </div>
      {tab === 'memories' && (
        <>
          {ui}
          {filtered.length ? (
            <MemoryGrid items={filtered} />
          ) : (
            <Empty emoji="🧺" title="Chưa có kỉ niệm nào" text="Chọn một địa điểm trên bản đồ rồi bấm “Thêm kỉ niệm”." />
          )}
        </>
      )}
      {tab !== 'memories' && (
        <PlaceList items={tab === 'visited' ? visited : wish} onOpen={openPlace} emptyText={tab === 'visited' ? 'Chưa đánh dấu nơi nào' : 'Danh sách muốn đi đang trống'} />
      )}
    </div>
  );
}

function PlaceList({ items, onOpen, emptyText }) {
  const { filtered, ui } = useFilters(items, (p) => p);
  const { setModal } = useApp();
  return (
    <>
      {ui}
      {filtered.length ? (
        <div className="list list--cards">
          {filtered.map((p) => (
            <div key={p.id} className="list-item">
              <span className="list-item__emoji">{p.emoji || '📍'}</span>
              <button className="list-item__main" onClick={() => onOpen(p)}>
                <b>{p.name}</b>
                <small>
                  {flagOf(p.country)} {[p.city, countryName(p.country)].filter(Boolean).join(', ')}
                </small>
              </button>
              <button className="btn btn--sm btn--soft" onClick={() => setModal({ type: 'directions', place: p })}>
                🧭 Chỉ đường
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty emoji="🗺️" title={emptyText} />
      )}
    </>
  );
}

export function TripsPage() {
  const { user, trips, api, requireLogin, notify, activeTripId, setActiveTripId, setView } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧳');
  const [code, setCode] = useState('');
  const [openId, setOpenId] = useState(null);

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="🧳"
          title="Đi chơi cùng nhau"
          text="Tạo chuyến đi, mời bạn bè bằng link và cùng nhau đánh dấu mọi nơi đã đi."
          action={<button className="btn btn--primary" onClick={() => requireLogin(() => {})}>Đăng nhập</button>}
        />
      </div>
    );

  const open = trips.find((t) => t.id === openId);
  if (open) return <TripDetail trip={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Nhóm</p>
          <h1 className="h1">Chuyến đi chung 🧳</h1>
          <p className="muted">Mọi địa điểm cả nhóm đi cùng nhau sẽ hiện trên bản đồ của tất cả thành viên.</p>
        </div>
      </header>
      <div className="grid-2 grid-2--wide">
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const t = await api.createTrip(user, { name: name.trim(), emoji });
            setName('');
            notify(`Đã tạo “${t.name}” — gửi link mời bạn bè nhé!`);
            setOpenId(t.id);
          }}
        >
          <h3 className="h3">Tạo chuyến đi mới</h3>
          <div className="row">
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} className="emoji-select" aria-label="Biểu tượng">
              {['🧳', '🏖️', '🏔️', '🌸', '🍜', '🎒', '🚗', '✈️', '🏕️', '🎉'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Đà Lạt cuối tuần" className="grow" />
          </div>
          <button className="btn btn--primary">Tạo chuyến đi</button>
        </form>
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const t = await api.joinTrip(user, code);
              notify(`Đã tham gia “${t.name}” 🎉`);
              setCode('');
            } catch (err) {
              notify(err.message, 'error');
            }
          }}
        >
          <h3 className="h3">Tham gia bằng mã mời</h3>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: K3X9QA" maxLength={8} />
          <button className="btn btn--dark">Tham gia</button>
        </form>
      </div>
      {trips.length === 0 ? (
        <Empty emoji="🎒" title="Chưa có chuyến đi nào" />
      ) : (
        <div className="trip-list">
          {trips.map((t) => (
            <article key={t.id} className="trip-card">
              <button className="trip-card__main" onClick={() => setOpenId(t.id)}>
                <span className="trip-card__emoji">{t.emoji}</span>
                <span>
                  <b>{t.name}</b>
                  <small>{t.memberIds.length} thành viên · mã {t.inviteCode}</small>
                </span>
              </button>
              <div className="avatars">
                {Object.entries(t.members || {}).slice(0, 4).map(([id, m]) => (
                  <Avatar key={id} name={m.name} photo={m.photo} size={28} />
                ))}
              </div>
              <button
                className={`btn btn--sm ${activeTripId === t.id ? 'btn--primary' : 'btn--soft'}`}
                onClick={() => {
                  setActiveTripId(activeTripId === t.id ? null : t.id);
                  setView('map');
                }}
              >
                🗺️ {activeTripId === t.id ? 'Đang hiện' : 'Xem bản đồ'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TripDetail({ trip, onBack }) {
  const { user, api, notify, setActiveTripId, setView, openPlace, setModal } = useApp();
  const [stops, setStops] = useState([]);
  useEffect(() => api.watchStops(trip.id, setStops), [trip.id, api]);
  const link = `${location.origin}${location.pathname}#join=${trip.inviteCode}`;
  const share = async () => {
    const text = `Tham gia chuyến đi “${trip.name}” ${trip.emoji} cùng mình trên Bản đồ du lịch!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: trip.name, text, url: link });
        return;
      } catch {
        /* huỷ */
      }
    }
    await navigator.clipboard?.writeText(link);
    notify('Đã copy link mời 🔗');
  };
  const countries = [...new Set(stops.map((s) => s.place.country).filter(Boolean))];
  return (
    <div className="page">
      <button className="back" onClick={onBack}>← Tất cả chuyến đi</button>
      <header className="page__head">
        <div>
          <h1 className="h1">
            {trip.emoji} {trip.name}
          </h1>
          <p className="muted">
            {countries.map(flagOf).join(' ')} {stops.length} điểm dừng · Mã mời <b className="code">{trip.inviteCode}</b>
          </p>
        </div>
        <div className="row wrap">
          <button className="btn btn--primary" onClick={share}>🔗 Mời bạn bè</button>
          <button
            className="btn btn--dark"
            onClick={() => {
              setActiveTripId(trip.id);
              setView('map');
            }}
          >
            🗺️ Xem trên bản đồ
          </button>
        </div>
      </header>
      <section>
        <h3 className="section-title">Thành viên</h3>
        <div className="row wrap">
          {Object.entries(trip.members || {}).map(([id, m]) => (
            <span key={id} className="member">
              <Avatar name={m.name} photo={m.photo} size={28} /> {m.name}
              {id === trip.ownerId && <small> · trưởng nhóm</small>}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h3 className="section-title">Hành trình</h3>
        {stops.length === 0 ? (
          <Empty emoji="📍" title="Chưa có điểm dừng" text="Khi thêm kỉ niệm hoặc đánh dấu “đã đến”, hãy chọn chuyến đi này để cả nhóm cùng thấy." />
        ) : (
          <ol className="timeline">
            {stops.map((s) => (
              <li key={s.id}>
                <div className="timeline__dot">{s.kind === 'memory' ? '📸' : '👣'}</div>
                <div className="timeline__body">
                  <button className="link" onClick={() => openPlace(s.place)}>
                    <b>{s.place.name}</b>
                  </button>
                  <div className="small muted">
                    {flagOf(s.place.country)} {[s.place.city, countryName(s.place.country)].filter(Boolean).join(', ')} · bởi {s.byName}
                    {s.createdAt ? ` · ${formatDate(s.createdAt)}` : ''}
                  </div>
                  {s.caption && <p>{s.caption}</p>}
                  {s.photos?.length > 0 && (
                    <div className="timeline__photos">
                      {s.photos.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            setModal({ type: 'viewMemory', memory: { id: s.id, memoryId: s.memoryId, uid: 'trip-stop', authorName: s.byName, authorPhoto: s.byPhoto, place: s.place, caption: s.caption, photos: s.photos } })
                          }
                        >
                          <img src={p} alt="" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
      <button
        className="btn btn--ghost danger"
        onClick={async () => {
          if (!confirm(trip.ownerId === user.uid ? 'Xoá chuyến đi này cho cả nhóm?' : 'Rời khỏi chuyến đi?')) return;
          await api.leaveTrip(user, trip);
          setActiveTripId(null);
          onBack();
        }}
      >
        {trip.ownerId === user.uid ? '🗑️ Xoá chuyến đi' : '🚪 Rời chuyến đi'}
      </button>
    </div>
  );
}
