import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { FAMOUS_PLACES } from '../data/places';
import { countryName, flagOf, WORLD_COUNTRY_COUNT } from '../lib/countries';
import { Chip, Empty, formatDate, Avatar, Loader, LoadingImage, OccasionField } from './ui';
import { useI18n } from '../i18n';
import { pName, pCity, pDesc } from '../lib/lang';
import { usePlaceImage } from '../lib/placeImage';
import Combobox from './Combobox';
import DateInput from './DateInput';

export default function SidePanel() {
  const { selectedPlace, selectedCountry } = useApp();
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();
  const content = selectedPlace ? <PlacePanel /> : selectedCountry ? <CountryPanel /> : <WorldPanel />;
  return (
    <aside className={`panel ${expanded ? 'panel--expanded' : ''}`}>
      <button className="panel__handle" onClick={() => setExpanded((v) => !v)} aria-label={t('panel.toggle')}>
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
  const {
    user, places, visitedCountries, openCountry, openPlace, requireLogin, setModal, trips, activeTripId, setActiveTripId, startPicking,
    homeCountry, setHomeCountry, famousFor, homeLoading, countries, setFlyTarget,
  } = useApp();
  const { t, lang } = useI18n();
  const [homeLimit, setHomeLimit] = useState(10);
  const homeFamous = famousFor(homeCountry);
  const countryOptions = useMemo(
    () =>
      (countries?.features || [])
        .map((f) => f.properties.cc)
        .filter(Boolean)
        .map((cc) => ({ value: cc, label: countryName(cc), icon: flagOf(cc) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [countries, lang],
  );
  const chooseHome = (cc) => {
    if (!cc) return;
    setHomeCountry(cc);
    setHomeLimit(10);
    setFlyTarget({ country: cc, t: Date.now() });
  };
  const visited = places.filter((p) => p.status === 'visited');
  const wish = places.filter((p) => p.status === 'wishlist');
  const pct = Math.round((visitedCountries.size / WORLD_COUNTRY_COUNT) * 1000) / 10;
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">{t('world.eyebrow', { name: user ? user.name.split(' ').slice(-1)[0] : t('world.you') })}</p>
        <h1 className="h2">{t('world.title')}</h1>
        <p className="muted">{t('world.hint')}</p>
      </div>
      {user && <OnThisDay />}
      <div className="stats">
        <Stat value={visitedCountries.size} label={t('stat.countries')} emoji="🌏" />
        <Stat value={visited.length} label={t('stat.visited')} emoji="👣" />
        <Stat value={wish.length} label={t('stat.wish')} emoji="💛" />
      </div>
      <div className="progress" title={t('world.pctTitle', { pct })}>
        <div className="progress__bar" style={{ width: `${Math.max(pct, 1)}%` }} />
        <span>{t('world.pct', { pct })}</span>
      </div>

      {!user && (
        <div className="callout">
          <b>{t('world.ctaTitle')}</b>
          <p>{t('world.ctaText')}</p>
          <button className="btn btn--dark" onClick={() => requireLogin(() => {})}>
            {t('auth.loginGoogle')}
          </button>
        </div>
      )}

      {user && trips.length > 0 && (
        <section>
          <h3 className="section-title">{t('world.showTrip')}</h3>
          <div className="chips">
            <Chip active={!activeTripId} onClick={() => setActiveTripId(null)}>{t('common.none')}</Chip>
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
          <h3 className="section-title">{t('world.visitedCountries')}</h3>
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
          <h3 className="section-title">{t('world.wishlist')}</h3>
          <div className="list">
            {wish.map((p) => (
              <button key={p.id} className="list-item" onClick={() => openPlace(p)}>
                <span className="list-item__emoji">{p.emoji}</span>
                <span>
                  <b>{pName(p)}</b>
                  <small>{[pCity(p), countryName(p.country)].filter(Boolean).join(', ')}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="stack home-famous">
        <div>
          <h3 className="section-title">{t('home.title')}</h3>
          <Combobox
            value={homeCountry}
            options={countryOptions}
            onChange={chooseHome}
            placeholder={t('filter.countryPlaceholder')}
            ariaLabel={t('filter.byCountry')}
            icon="🌏"
          />
        </div>
        <div className="chips chips--scroll">
          {Object.keys(FAMOUS_PLACES)
            .filter((cc) => cc !== homeCountry)
            .map((cc) => (
              <Chip key={cc} onClick={() => chooseHome(cc)}>
                {flagOf(cc)} {countryName(cc)}
              </Chip>
            ))}
        </div>
        <div className="cards">
          {homeFamous.slice(0, homeLimit).map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
        {homeLoading && <Loader text={t('country.loadingMore')} />}
        {homeFamous.length > homeLimit && (
          <button className="btn btn--soft btn--block" onClick={() => setHomeLimit((n) => n + 10)}>
            {t('country.showMore', { n: homeFamous.length - homeLimit })}
          </button>
        )}
        <button className="btn btn--ghost btn--sm" onClick={() => openCountry(homeCountry)}>
          {t('home.details', { country: countryName(homeCountry) })}
        </button>
      </section>
      <button className="btn btn--primary btn--block" onClick={() => requireLogin(() => setModal({ type: 'memory' }), t('reason.saveMemory'))}>
        {t('world.addMemory')}
      </button>
      <div className="btn-stack">
        {user && (
          <button className="btn btn--outline btn--block" onClick={() => setModal({ type: 'recap', mode: 'year' })}>
            {t('recap.yearButton')}
          </button>
        )}
        <button className="btn btn--outline btn--block" onClick={() => startPicking('place')}>
          {t('pick.open')}
        </button>
        <button className="btn btn--outline btn--block" onClick={() => setModal({ type: 'addLink' })}>
          {t('link.open')}
        </button>
      </div>
      <p className="small muted">{t('pick.tip')}</p>
    </div>
  );
}

function CountryPanel() {
  const { selectedCountry: cc, setSelectedCountry, setFlyTarget, places, memories, publicMemories, openPlace, visitedCountries, famousFor, famousLoading, famousLimit, setFamousLimit } = useApp();
  const [city, setCity] = useState(null);
  const { t, lang } = useI18n();
  const famous = famousFor(cc);
  const mine = places.filter((p) => p.country === cc);
  const pub = publicMemories.filter((m) => m.place?.country === cc);
  const cities = useMemo(
    () => [...new Set([...famous, ...mine, ...memories.map((m) => m.place)].filter((p) => p?.country === cc).map((p) => pCity(p)).filter(Boolean))],
    [famous, mine, memories, cc, lang], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const byCity = (p) => !city || pCity(p) === city;
  const headRef = useRef(null);

  return (
    <div className="stack">
      <StickyBar watch={headRef} compact={<>{flagOf(cc)} {countryName(cc)}</>}>
        <button
          className="back"
          onClick={() => {
            setSelectedCountry(null);
            setFlyTarget({ world: true, t: Date.now() });
          }}
        >
          {t('country.backWorld')}
        </button>
      </StickyBar>
      <div className="country-head" ref={headRef}>
        <span className="country-head__flag">{flagOf(cc)}</span>
        <div>
          <h1 className="h2">{countryName(cc)}</h1>
          <p className="muted">
            {visitedCountries.has(cc) ? t('country.visited') : t('country.notVisited')} · {t('country.placesVisited', { n: mine.filter((p) => p.status === 'visited').length })}
          </p>
        </div>
      </div>

      {cities.length > 1 && (
        <div className="chips chips--scroll">
          <Chip active={!city} onClick={() => setCity(null)}>{t('common.all')}</Chip>
          {cities.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      {mine.filter(byCity).length > 0 && (
        <section>
          <h3 className="section-title">{t('country.yourPlaces')}</h3>
          <div className="list">
            {mine.filter(byCity).map((p) => (
              <button key={p.id} className="list-item" onClick={() => openPlace(p)}>
                <span className="list-item__emoji">{p.status === 'visited' ? '👣' : '💛'}</span>
                <span>
                  <b>{pName(p)}</b>
                  <small>
                    {pCity(p)}
                    {p.visitedAt ? ` · 📅 ${formatDate(p.visitedAt)}` : ''}
                    {p.occasion ? ` · ${p.occasion}` : ''}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title">{t('country.famous')}</h3>
        {famous.length === 0 && !famousLoading ? (
          <p className="muted">{t('country.noFamous')}</p>
        ) : (
          <div className="cards">
            {famous.filter(byCity).slice(0, city ? undefined : famousLimit).map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        )}
        {famousLoading && <Loader text={t('country.loadingMore')} />}
        {!city && famous.length > famousLimit && (
          <button className="btn btn--soft btn--block" onClick={() => setFamousLimit((n) => n + 15)}>
            {t('country.showMore', { n: famous.length - famousLimit })}
          </button>
        )}
        {famous.some((p) => p.wikidata) && <p className="tiny muted">{t('country.source')}</p>}
      </section>

      {pub.length > 0 && (
        <section>
          <h3 className="section-title">{t('country.shared')}</h3>
          <MemoryGrid items={pub.filter((m) => byCity(m.place))} />
        </section>
      )}
    </div>
  );
}

export function PlaceCard({ place }) {
  const { placeStatus, setPlaceStatus, setModal, openPlace, placeById } = useApp();
  const { t } = useI18n();
  const visitedAt = placeById[place.id]?.visitedAt;
  const { src: img, loading: finding } = usePlaceImage(place);
  const st = placeStatus[place.id];
  return (
    <article className="place-card">
      <button className="place-card__cover" onClick={() => openPlace(place)} aria-label={pName(place)}>
        <LoadingImage src={img} finding={finding} alt={pName(place)} loading="lazy" fallback={<span>{place.emoji}</span>} />
        {img && <span className="place-card__badge">{place.emoji}</span>}
      </button>
      <div className="place-card__body">
        <button className="place-card__title" onClick={() => openPlace(place)}>
          {pName(place)}
        </button>
        <p className="muted small">{pCity(place)}{pDesc(place) ? ` · ${pDesc(place)}` : ''}</p>
        {st === 'visited' && (visitedAt || placeById[place.id]?.occasion) && (
          <p className="visit-date">
            {visitedAt && t('visit.on', { date: formatDate(visitedAt) })}
            {visitedAt && placeById[place.id]?.occasion && ' · '}
            {placeById[place.id]?.occasion}
          </p>
        )}
        <div className="row">
          <button className={`btn btn--sm ${st === 'wishlist' ? 'btn--coral' : 'btn--soft'}`} onClick={() => setPlaceStatus(place, 'wishlist')} aria-pressed={st === 'wishlist'}>
            {st === 'wishlist' ? t('card.liked') : t('card.wish')}
          </button>
          <button className={`btn btn--sm ${st === 'visited' ? 'btn--primary' : 'btn--soft'}`} onClick={() => setPlaceStatus(place, 'visited')}>
            👣 {st === 'visited' ? t('card.visited') : t('card.markVisited')}
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
  const { removePlace, saveVisited, placeById, selectedPlace: p, setSelectedPlace, placeStatus, setPlaceStatus, setModal, memories, publicMemories, requireLogin, trips, returnView, setReturnView, setView, api, user, notify } = useApp();
  // Chuyến đi gắn với địa điểm: lấy theo dữ liệu đã lưu
  const savedTripId = placeById[p.id]?.tripId || '';
  const [tripId, setTripId] = useState(savedTripId);
  useEffect(() => setTripId(savedTripId), [p.id, savedTripId]);
  const changeTrip = async (next) => {
    setTripId(next);
    const status = placeStatus[p.id];
    if (!status || !user) return; // chưa lưu địa điểm: chuyến đi sẽ được lưu khi bấm Đã đến / Muốn đi
    try {
      await api.setPlaceTrip(user, placeById[p.id] || p, status, next, savedTripId);
      const tr = trips.find((x) => x.id === next);
      notify(tr ? t('place.tripSaved', { name: tr.name }) : t('place.tripRemoved'));
    } catch (e) {
      setTripId(savedTripId);
      notify(e.message, 'error');
    }
  };
  const { t } = useI18n();
  const { src: img, loading: findingImg } = usePlaceImage(p);
  const st = placeStatus[p.id];
  const mine = memories.filter((m) => m.place?.id === p.id);
  const pub = publicMemories.filter((m) => m.place?.id === p.id && !mine.some((x) => x.id === m.id));
  const heroRef = useRef(null);
  return (
    <div className="stack">
      <StickyBar watch={heroRef} compact={<>{p.emoji || '📍'} {pName(p)}</>}>
        {returnView && (
          <button
            className="btn btn--sm btn--dark"
            onClick={() => {
              setView(returnView);
              setReturnView(null);
            }}
          >
            {t('place.backTo', { page: t('nav.' + returnView) })}
          </button>
        )}
        <button
          className="back"
          onClick={() => {
            setSelectedPlace(null);
            setReturnView(null);
          }}
        >
          ← {p.country ? countryName(p.country) : t('common.back')}
        </button>
      </StickyBar>
      {(img || findingImg) && (
        <figure className="place-photo">
          <LoadingImage src={img} finding={findingImg} alt={pName(p)} loaderSize="md" />
          {img && <figcaption>{t('place.photoCredit')}</figcaption>}
        </figure>
      )}
      <div className="place-hero" ref={heroRef}>
        <span className="place-hero__emoji">{p.emoji || '📍'}</span>
        <div>
          <h1 className="h2">{pName(p)}</h1>
          <p className="muted">
            {[pCity(p), countryName(p.country)].filter(Boolean).join(', ')} {flagOf(p.country)}
          </p>
        </div>
      </div>
      {p.custom && (
        <label className="field">
          <span>{t('place.rename')}</span>
          <input value={p.name} onChange={(e) => setSelectedPlace({ ...p, name: e.target.value })} maxLength={80} />
        </label>
      )}
      {pDesc(p) && <p>{pDesc(p)}</p>}

      {trips.length > 0 && (
        <label className="field">
          <span>{t('place.withTrip')}</span>
          <select value={tripId} onChange={(e) => changeTrip(e.target.value)}>
            <option value="">{t('common.noneOption')}</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
          {tripId && !st && <small className="muted">{t('place.tripHint')}</small>}
        </label>
      )}

      <div className="grid-2">
        <button className={`btn ${st === 'visited' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'visited', tripId)}>
          👣 {st === 'visited' ? t('place.visited') : t('place.markVisited')}
        </button>
        <button className={`btn ${st === 'wishlist' ? 'btn--coral' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'wishlist', tripId)}>
          {st === 'wishlist' ? t('place.inWishlist') : t('place.addWishlist')}
        </button>
        <button className="btn btn--dark" onClick={() => setModal({ type: 'directions', place: p })}>
          {t('common.directions')}
        </button>
        <button
          className="btn btn--primary"
          onClick={() => requireLogin(() => setModal({ type: 'memory', place: p, tripId }), t('reason.saveMemory'))}
        >
          {t('place.addMemory')}
        </button>
      </div>

      {st && (
        <button className="btn btn--ghost btn--sm danger remove-btn" onClick={() => removePlace(placeById[p.id] || p)}>
          🗑️ {t(st === 'visited' ? 'remove.fromVisited' : 'remove.fromWish')}
        </button>
      )}
      {st === 'visited' && (
        <label className="field visit-field">
          <span>{t('visit.edit')}</span>
          <DateInput value={placeById[p.id]?.visitedAt || ''} onChange={(v) => saveVisited(p, { visitedAt: v || null })} ariaLabel={t('visit.edit')} />
        </label>
      )}
      {st === 'visited' && <PlaceOccasion place={p} saved={placeById[p.id]?.occasion || ''} onSave={(occasion) => saveVisited(p, { occasion })} />}
      {mine.length > 0 && (
        <section>
          <h3 className="section-title">{t('place.yourMemories')}</h3>
          <MemoryGrid items={mine} />
        </section>
      )}
      <section>
        <h3 className="section-title">{t('place.others')}</h3>
        {pub.length ? <MemoryGrid items={pub} /> : <Empty emoji="🌱" title={t('place.noShares')} text={t('place.beFirst')} />}
      </section>
    </div>
  );
}

export function MemoryGrid({ items }) {
  const { setModal, placeStatus } = useApp();
  return (
    <div className="mgrid">
      {items.map((m) => (
        <button key={m.id} className="mgrid__item" onClick={() => setModal({ type: 'viewMemory', memory: m })}>
          <LoadingImage src={m.photos?.[0]} alt={m.caption || m.place?.name} loading="lazy" fallback={<span className="mgrid__noimg">📝</span>} />
          {m.photos?.length > 1 && <span className="mgrid__count">+{m.photos.length - 1}</span>}
          <span className="mgrid__meta">
            <Avatar name={m.authorName} photo={m.authorPhoto} size={20} />
            <span>{pName(m.place)}</span>
          </span>
          {m.date && <span className="mgrid__date">{formatDate(m.date)}</span>}
          {placeStatus[m.place?.id] === 'wishlist' && <span className="mgrid__wish" title="💛">💛</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Thanh trên cùng luôn dính khi cuộn: giữ nút quay lại, và khi tiêu đề lớn (`watch`) bị cuộn khuất
 * thì hiện tên quốc gia / địa điểm dạng chữ nhỏ.
 */
function StickyBar({ watch, compact, children }) {
  const barRef = useRef(null);
  const [showCompact, setShowCompact] = useState(false);
  useEffect(() => {
    const target = watch.current;
    const root = barRef.current?.closest('.panel__scroll');
    if (!target || !root) return;
    const io = new IntersectionObserver(([e]) => setShowCompact(!e.isIntersecting), { root, threshold: 0, rootMargin: '-56px 0px 0px 0px' });
    io.observe(target);
    return () => io.disconnect();
  }, [watch]);
  return (
    <div className={`sticky-bar ${showCompact ? 'sticky-bar--compact' : ''}`} ref={barRef}>
      <div className="sticky-bar__actions">{children}</div>
      <div className="sticky-bar__title" aria-hidden={!showCompact}>
        {compact}
      </div>
    </div>
  );
}

/** Ghi chú "đến vì dịp gì" trong panel địa điểm — lưu khi chọn gợi ý hoặc rời ô */
function PlaceOccasion({ place, saved, onSave }) {
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved, place.id]);
  return <OccasionField value={value} onChange={setValue} onCommit={(v) => v !== saved && onSave(v)} />;
}

/** "Ngày này năm xưa": nơi đã đến / kỉ niệm đúng ngày-tháng hôm nay của các năm trước */
function OnThisDay() {
  const { places, memories, openPlace, setModal } = useApp();
  const { t } = useI18n();
  const items = useMemo(() => {
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yr = now.getFullYear();
    const out = new Map();
    const add = (date, place, extra) => {
      if (!date || !place) return;
      const d = String(date).slice(0, 10);
      const y = Number(d.slice(0, 4));
      if (d.slice(5) !== md || !(y < yr)) return;
      const key = `${place.id}-${y}`;
      out.set(key, { ...(out.get(key) || {}), place, year: y, ...extra });
    };
    places.forEach((p) => p.status === 'visited' && add(p.visitedAt, p, { occasion: p.occasion }));
    memories.forEach((m) => add(m.date, m.place, { memory: m }));
    return [...out.values()].sort((a, b) => b.year - a.year);
  }, [places, memories]);
  if (!items.length) return null;
  const yr = new Date().getFullYear();
  return (
    <section className="otd">
      <div className="otd__head">
        <span className="otd__badge">📅</span>
        <div>
          <b>{t('otd.title')}</b>
          <small>{t('otd.sub')}</small>
        </div>
      </div>
      <div className="otd__list">
        {items.slice(0, 4).map((it) => (
          <article key={it.place.id + it.year} className="otd__item">
            {it.memory?.photos?.[0] ? (
              <button className="otd__photo" onClick={() => setModal({ type: 'viewMemory', memory: it.memory })}>
                <LoadingImage src={it.memory.photos[0]} alt={pName(it.place)} />
              </button>
            ) : (
              <span className="otd__emoji">{it.place.emoji || '📍'}</span>
            )}
            <div className="otd__text">
              <p>
                {t('otd.line', { n: yr - it.year, year: it.year })} <b>{pName(it.place)}</b> {flagOf(it.place.country)}
              </p>
              {(it.occasion || it.memory?.caption) && <small>“{it.occasion || it.memory.caption}”</small>}
              <div className="row wrap">
                <button className="btn btn--sm btn--soft" onClick={() => (it.memory ? setModal({ type: 'viewMemory', memory: it.memory }) : openPlace(it.place))}>
                  {t('otd.view')}
                </button>
                {it.memory && (
                  <button className="btn btn--sm btn--primary" onClick={() => setModal({ type: 'share', memory: it.memory })}>
                    {t('mem.share')}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
