import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { famousIn, FAMOUS_PLACES } from '../data/places';
import { countryName, flagOf, WORLD_COUNTRY_COUNT } from '../lib/countries';
import { Chip, Empty, formatDate, Avatar } from './ui';

export default function SidePanel() {
  const { selectedPlace, selectedCountry } = useApp();
  const [expanded, setExpanded] = useState(false);
  const content = selectedPlace ? <PlacePanel /> : selectedCountry ? <CountryPanel /> : <WorldPanel />;
  return (
    <aside className={`panel ${expanded ? 'panel--expanded' : ''}`}>
      <button className="panel__handle" onClick={() => setExpanded((v) => !v)} aria-label="Mở rộng / thu gọn">
        <span />
      </button>
      <div className="panel__scroll">{content}</div>
    </aside>
  );
}

function Stat({ value, label, emoji }) {
  return (
    <div className="stat">
      <div className="stat__value">
        {emoji} {value}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function WorldPanel() {
  const { user, places, visitedCountries, openCountry, openPlace, requireLogin, setModal, trips, activeTripId, setActiveTripId } = useApp();
  const visited = places.filter((p) => p.status === 'visited');
  const wish = places.filter((p) => p.status === 'wishlist');
  const pct = Math.round((visitedCountries.size / WORLD_COUNTRY_COUNT) * 1000) / 10;
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Bản đồ của {user ? user.name.split(' ').slice(-1)[0] : 'bạn'}</p>
        <h1 className="h2">Hôm nay mình đi đâu? ✈️</h1>
        <p className="muted">Chạm vào một quốc gia trên bản đồ để xem các địa điểm nổi tiếng.</p>
      </div>
      <div className="stats">
        <Stat value={visitedCountries.size} label="quốc gia" emoji="🌏" />
        <Stat value={visited.length} label="đã đặt chân" emoji="👣" />
        <Stat value={wish.length} label="muốn đi" emoji="💛" />
      </div>
      <div className="progress" title={`${pct}% thế giới`}>
        <div className="progress__bar" style={{ width: `${Math.max(pct, 1)}%` }} />
        <span>{pct}% thế giới đã khám phá</span>
      </div>

      {!user && (
        <div className="callout">
          <b>Lưu dấu chân của bạn</b>
          <p>Đăng nhập Google để đánh dấu nơi đã đi, lưu kỉ niệm và tạo chuyến đi cùng bạn bè. Tìm kiếm & xem bản đồ thì không cần đăng nhập.</p>
          <button className="btn btn--dark" onClick={() => requireLogin(() => {})}>
            Đăng nhập với Google
          </button>
        </div>
      )}

      {user && trips.length > 0 && (
        <section>
          <h3 className="section-title">Hiện chuyến đi trên bản đồ</h3>
          <div className="chips">
            <Chip active={!activeTripId} onClick={() => setActiveTripId(null)}>Không</Chip>
            {trips.map((t) => (
              <Chip key={t.id} active={activeTripId === t.id} onClick={() => setActiveTripId(t.id)}>
                {t.emoji} {t.name}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {visitedCountries.size > 0 && (
        <section>
          <h3 className="section-title">Quốc gia đã đến</h3>
          <div className="chips">
            {[...visitedCountries].map((cc) => (
              <Chip key={cc} onClick={() => openCountry(cc)}>
                {flagOf(cc)} {countryName(cc)}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {wish.length > 0 && (
        <section>
          <h3 className="section-title">💛 Danh sách muốn đi</h3>
          <div className="list">
            {wish.map((p) => (
              <button key={p.id} className="list-item" onClick={() => openPlace(p)}>
                <span className="list-item__emoji">{p.emoji}</span>
                <span>
                  <b>{p.name}</b>
                  <small>{[p.city, countryName(p.country)].filter(Boolean).join(', ')}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title">Gợi ý khám phá</h3>
        <div className="chips">
          {Object.keys(FAMOUS_PLACES).map((cc) => (
            <Chip key={cc} onClick={() => openCountry(cc)}>
              {flagOf(cc)} {countryName(cc)}
            </Chip>
          ))}
        </div>
      </section>
      <button className="btn btn--primary btn--block" onClick={() => requireLogin(() => setModal({ type: 'memory' }), 'Đăng nhập để lưu kỉ niệm')}>
        📸 Thêm kỉ niệm mới
      </button>
    </div>
  );
}

function CountryPanel() {
  const { selectedCountry: cc, setSelectedCountry, setFlyTarget, places, memories, publicMemories, openPlace, visitedCountries } = useApp();
  const [city, setCity] = useState(null);
  const famous = famousIn(cc);
  const mine = places.filter((p) => p.country === cc);
  const pub = publicMemories.filter((m) => m.place?.country === cc);
  const cities = useMemo(
    () => [...new Set([...famous, ...mine, ...memories.map((m) => m.place)].filter((p) => p?.country === cc).map((p) => p.city).filter(Boolean))],
    [famous, mine, memories, cc],
  );
  const byCity = (p) => !city || p.city === city;

  return (
    <div className="stack">
      <button
        className="back"
        onClick={() => {
          setSelectedCountry(null);
          setFlyTarget({ world: true, t: Date.now() });
        }}
      >
        ← Bản đồ thế giới
      </button>
      <div className="country-head">
        <span className="country-head__flag">{flagOf(cc)}</span>
        <div>
          <h1 className="h2">{countryName(cc)}</h1>
          <p className="muted">
            {visitedCountries.has(cc) ? '👣 Bạn đã đặt chân tới đây' : 'Chưa đặt chân tới'} · {mine.filter((p) => p.status === 'visited').length} địa điểm đã đến
          </p>
        </div>
      </div>

      {cities.length > 1 && (
        <div className="chips chips--scroll">
          <Chip active={!city} onClick={() => setCity(null)}>Tất cả</Chip>
          {cities.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      {mine.filter(byCity).length > 0 && (
        <section>
          <h3 className="section-title">Địa điểm của bạn</h3>
          <div className="list">
            {mine.filter(byCity).map((p) => (
              <button key={p.id} className="list-item" onClick={() => openPlace(p)}>
                <span className="list-item__emoji">{p.status === 'visited' ? '👣' : '💛'}</span>
                <span>
                  <b>{p.name}</b>
                  <small>{p.city}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title">⭐ Địa điểm nổi tiếng</h3>
        {famous.length === 0 ? (
          <p className="muted">Chưa có gợi ý sẵn cho quốc gia này — hãy dùng ô tìm kiếm để thêm bất kỳ địa điểm nào nhé!</p>
        ) : (
          <div className="cards">
            {famous.filter(byCity).map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        )}
      </section>

      {pub.length > 0 && (
        <section>
          <h3 className="section-title">📷 Mọi người chia sẻ</h3>
          <MemoryGrid items={pub.filter((m) => byCity(m.place))} />
        </section>
      )}
    </div>
  );
}

export function PlaceCard({ place }) {
  const { placeStatus, setPlaceStatus, setModal, openPlace } = useApp();
  const st = placeStatus[place.id];
  return (
    <article className="place-card">
      <button className="place-card__cover" onClick={() => openPlace(place)}>
        <span>{place.emoji}</span>
      </button>
      <div className="place-card__body">
        <button className="place-card__title" onClick={() => openPlace(place)}>
          {place.name}
        </button>
        <p className="muted small">{place.city}{place.desc ? ` · ${place.desc}` : ''}</p>
        <div className="row">
          <button className={`btn btn--sm ${st === 'wishlist' ? 'btn--coral' : 'btn--soft'}`} onClick={() => setPlaceStatus(place, 'wishlist')}>
            {st === 'wishlist' ? '💛 Đã thích' : '🤍 Muốn đi'}
          </button>
          <button className={`btn btn--sm ${st === 'visited' ? 'btn--primary' : 'btn--soft'}`} onClick={() => setPlaceStatus(place, 'visited')}>
            👣 {st === 'visited' ? 'Đã đến' : 'Đã tới'}
          </button>
          <button className="btn btn--sm btn--ghost" onClick={() => setModal({ type: 'directions', place })}>
            🧭
          </button>
        </div>
      </div>
    </article>
  );
}

function PlacePanel() {
  const { selectedPlace: p, setSelectedPlace, placeStatus, setPlaceStatus, setModal, memories, publicMemories, requireLogin, trips } = useApp();
  const [tripId, setTripId] = useState('');
  const st = placeStatus[p.id];
  const mine = memories.filter((m) => m.place?.id === p.id);
  const pub = publicMemories.filter((m) => m.place?.id === p.id && !mine.some((x) => x.id === m.id));
  return (
    <div className="stack">
      <button className="back" onClick={() => setSelectedPlace(null)}>
        ← {p.country ? countryName(p.country) : 'Quay lại'}
      </button>
      <div className="place-hero">
        <span className="place-hero__emoji">{p.emoji || '📍'}</span>
        <div>
          <h1 className="h2">{p.name}</h1>
          <p className="muted">
            {[p.city, countryName(p.country)].filter(Boolean).join(', ')} {flagOf(p.country)}
          </p>
        </div>
      </div>
      {p.desc && <p>{p.desc}</p>}

      {trips.length > 0 && (
        <label className="field">
          <span>Đi cùng chuyến (để bạn bè cùng thấy)</span>
          <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
            <option value="">— Không —</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid-2">
        <button className={`btn ${st === 'visited' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'visited', tripId)}>
          👣 {st === 'visited' ? 'Đã đặt chân tới' : 'Đánh dấu đã đến'}
        </button>
        <button className={`btn ${st === 'wishlist' ? 'btn--coral' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'wishlist')}>
          {st === 'wishlist' ? '💛 Trong danh sách' : '🤍 Sẽ ghé thăm'}
        </button>
        <button className="btn btn--dark" onClick={() => setModal({ type: 'directions', place: p })}>
          🧭 Chỉ đường
        </button>
        <button
          className="btn btn--primary"
          onClick={() => requireLogin(() => setModal({ type: 'memory', place: p, tripId }), 'Đăng nhập để lưu kỉ niệm')}
        >
          📸 Thêm kỉ niệm
        </button>
      </div>

      {mine.length > 0 && (
        <section>
          <h3 className="section-title">Kỉ niệm của bạn</h3>
          <MemoryGrid items={mine} />
        </section>
      )}
      <section>
        <h3 className="section-title">📷 Mọi người đã đến đây</h3>
        {pub.length ? <MemoryGrid items={pub} /> : <Empty emoji="🌱" title="Chưa có ai chia sẻ" text="Hãy là người đầu tiên chia sẻ kỉ niệm công khai tại đây!" />}
      </section>
    </div>
  );
}

export function MemoryGrid({ items }) {
  const { setModal } = useApp();
  return (
    <div className="mgrid">
      {items.map((m) => (
        <button key={m.id} className="mgrid__item" onClick={() => setModal({ type: 'viewMemory', memory: m })}>
          {m.photos?.[0] ? <img src={m.photos[0]} alt={m.caption || m.place?.name} loading="lazy" /> : <span className="mgrid__noimg">📝</span>}
          {m.photos?.length > 1 && <span className="mgrid__count">+{m.photos.length - 1}</span>}
          <span className="mgrid__meta">
            <Avatar name={m.authorName} photo={m.authorPhoto} size={20} />
            <span>{m.place?.name}</span>
          </span>
          {m.date && <span className="mgrid__date">{formatDate(m.date)}</span>}
        </button>
      ))}
    </div>
  );
}
