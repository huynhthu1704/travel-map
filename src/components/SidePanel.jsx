import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { FAMOUS_PLACES } from '../data/places';
import { countryName, flagOf, WORLD_COUNTRY_COUNT } from '../lib/countries';
import { Chip, Empty, formatDate, Avatar, Loader, LoadingImage, OccasionField } from './ui';
import { useI18n } from '../i18n';
import { pName, pCity, pDesc, getLocale } from '../lib/lang';
import { usePlaceImage } from '../lib/placeImage';
import Combobox from './Combobox';
import DateInput from './DateInput';

/**
 * Bảng dưới dạng "bottom sheet" trên điện thoại / máy tính bảng dọc:
 * 3 mức cao (peek: chỉ thấy tiêu đề, half: nửa màn hình, full), kéo thanh nắm để đổi,
 * chạm / kéo bản đồ thì tự thu nhỏ để xem bản đồ rộng hơn, mở địa điểm thì mở nửa màn hình.
 */
const SHEET_MQ = '(max-width: 900px)';
const PEEK = 148;
function useBottomSheet(placeId, country, tripId) {
  const [mobile, setMobile] = useState(() => window.matchMedia(SHEET_MQ).matches);
  const [state, setState] = useState('half');
  const [drag, setDrag] = useState(null); // { startY, startH, h }
  useEffect(() => {
    const mq = window.matchMedia(SHEET_MQ);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  // Mở địa điểm / quốc gia / lộ trình → hiện nửa màn hình
  useEffect(() => {
    if (mobile && (placeId || country || tripId)) setState('half');
  }, [placeId, country, tripId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Người dùng kéo / chạm bản đồ → thu nhỏ bảng
  useEffect(() => {
    const onMap = () => mobile && setState((s) => (s === 'peek' ? s : 'peek'));
    window.addEventListener('map:interact', onMap);
    return () => window.removeEventListener('map:interact', onMap);
  }, [mobile]);
  const parentH = () => document.querySelector('aside.panel')?.parentElement?.clientHeight || window.innerHeight;
  const heights = () => {
    const H = parentH();
    return { peek: PEEK, half: Math.round(H * 0.5), full: Math.round(H - 12) };
  };
  const height = drag ? drag.h : heights()[state];
  // Cho các nút trên bản đồ (zoom…) nằm ngay trên bảng
  useEffect(() => {
    document.documentElement.style.setProperty('--sheet-h', mobile ? `${height}px` : '0px');
  }, [height, mobile]);
  const handleProps = {
    onPointerDown: (e) => {
      if (!mobile) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDrag({ startY: e.clientY, startH: height, h: height, moved: false });
    },
    onPointerMove: (e) => {
      if (!drag) return;
      const { full } = heights();
      const h = Math.max(PEEK - 40, Math.min(full, drag.startH + (drag.startY - e.clientY)));
      setDrag({ ...drag, h, moved: drag.moved || Math.abs(e.clientY - drag.startY) > 6 });
    },
    onPointerUp: () => {
      if (!drag) return;
      if (!drag.moved) {
        // Chạm: peek → half → full → half
        setState((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'half'));
      } else {
        const hs = heights();
        const nearest = Object.entries(hs).sort((a, b) => Math.abs(a[1] - drag.h) - Math.abs(b[1] - drag.h))[0][0];
        setState(nearest);
      }
      setDrag(null);
    },
    onPointerCancel: () => setDrag(null),
  };
  return {
    state: mobile ? state : 'desktop',
    dragging: !!drag,
    style: mobile ? { height: `${height}px` } : undefined,
    handleProps,
    // Đang thu nhỏ mà chạm vào nội dung → mở nửa màn hình
    onContentPointer: () => mobile && state === 'peek' && setState('half'),
  };
}

export default function SidePanel() {
  const { selectedPlace, selectedCountry, activeTripId, trips } = useApp();
  const { t } = useI18n();
  const sheet = useBottomSheet(selectedPlace?.id, selectedCountry, activeTripId);
  // Đang xem lộ trình 1 chuyến đi → bảng bên trái là danh sách địa điểm của chuyến đó
  const tripMode = activeTripId && trips.some((tr) => tr.id === activeTripId);
  const content = selectedPlace ? <PlacePanel /> : tripMode ? <TripRoutePanel /> : selectedCountry ? <CountryPanel /> : <WorldPanel />;
  return (
    <aside className={`panel panel--${sheet.state} ${sheet.dragging ? 'is-dragging' : ''}`} style={sheet.style}>
      <button className="panel__handle" {...sheet.handleProps} aria-label={t('panel.toggle')}>
        <span />
      </button>
      <div className="panel__scroll" onPointerDownCapture={sheet.onContentPointer}>
        {content}
      </div>
    </aside>
  );
}

/** Bảng lộ trình chuyến đi trên bản đồ: danh sách địa điểm theo đúng thứ tự & ngày giờ của Kế hoạch */
function TripRoutePanel() {
  const { trips, activeTripId, setActiveTripId, tripPlan, openPlace, setOpenTripId, setTripTab, setView, setFlyTarget } = useApp();
  const { t } = useI18n();
  const trip = trips.find((tr) => tr.id === activeTripId);
  const plan = tripPlan.filter((it) => it.tripId === activeTripId && it.place);
  const groups = [];
  plan.forEach((it, i) => {
    const k = it.date || '';
    if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, list: [] });
    groups[groups.length - 1].list.push({ it, n: i + 1 });
  });
  const shown = plan.filter((it) => !it.skipped);
  const done = plan.filter((it) => it.done).length;
  const fitAll = () => {
    if (!shown.length) return;
    const la = shown.map((x) => x.place.lat);
    const ln = shown.map((x) => x.place.lng);
    setFlyTarget({ bbox: [Math.min(...la) - 0.05, Math.max(...la) + 0.05, Math.min(...ln) - 0.05, Math.max(...ln) + 0.05], t: Date.now() });
  };
  const dayLabel = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    const wd = d.toLocaleDateString(getLocale(), { weekday: 'short' });
    const n = trip.startDate && iso >= trip.startDate ? Math.round((d - new Date(`${trip.startDate}T00:00:00`)) / 864e5) + 1 : null;
    return { n, text: `${wd}, ${formatDate(iso)}` };
  };
  if (!trip) return null;
  return (
    <div className="stack route-panel">
      <div className="route-panel__head">
        <span className="route-panel__emoji">{trip.emoji}</span>
        <div>
          <p className="eyebrow">{t('route.eyebrow')}</p>
          <h1 className="h2">{trip.name}</h1>
        </div>
      </div>
      <div className="row wrap">
        <button
          className="btn btn--sm btn--soft"
          onClick={() => {
            setOpenTripId(trip.id);
            setTripTab('plan');
            setView('trips');
          }}
        >
          🗓️ {t('route.openPlan')}
        </button>
        <button className="btn btn--sm btn--soft" onClick={fitAll} disabled={!shown.length}>
          🔍 {t('route.fitAll')}
        </button>
        <button className="btn btn--sm btn--ghost" onClick={() => setActiveTripId(null)}>
          ✕ {t('route.exit')}
        </button>
      </div>
      {plan.length > 0 && (
        <div className="plan-progress">
          <div className="plan-progress__bar">
            <i style={{ width: `${(done / Math.max(shown.length, 1)) * 100}%` }} />
          </div>
          <small>{t('plan.progress', { done, n: shown.length })}</small>
        </div>
      )}
      {plan.length === 0 && <Empty emoji="🗺️" title={t('plan.empty')} text={t('route.emptyHint')} />}
      {groups.map((g) => {
        const d = g.k ? dayLabel(g.k) : null;
        return (
          <section key={g.k || 'none'} className="route-day">
            <h4 className="plan-day__title">
              {d ? (
                <>
                  {d.n && <span className="plan-day__n">{t('plan.dayN', { n: d.n })}</span>}
                  {d.text}
                </>
              ) : (
                <>🕓 {t('plan.noDate')}</>
              )}
            </h4>
            <ol className="route-list">
              {g.list.map(({ it, n }) => (
                <li key={it.id} className={`${it.done ? 'is-done' : ''} ${it.skipped ? 'is-skipped' : ''}`}>
                  <button onClick={() => openPlace(it.place)}>
                    <span className="route-list__n">{it.skipped ? '✕' : n}</span>
                    <span className="route-list__body">
                      <b>
                        {it.place.emoji || '📍'} {pName(it.place)}
                      </b>
                      <small className="muted">
                        {[it.time && `🕘 ${it.time}`, pCity(it.place), it.done && `👣 ${t('plan.statusDone')}`, it.skipped && t('plan.statusSkip')].filter(Boolean).join(' · ')}
                      </small>
                      {it.note && <small className="route-list__note">📝 {it.note}</small>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
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

/** Danh sách id chuyến đi có địa điểm này trong kế hoạch (theo dõi trực tiếp) */
function useTripsWithPlace(placeId, trips) {
  const { api, user } = useApp();
  const [plans, setPlans] = useState({});
  const ids = trips.map((tr) => tr.id).join(',');
  useEffect(() => {
    if (!user || !ids) return setPlans({});
    const unsubs = ids.split(',').map((id) => api.watchPlan(id, (list) => setPlans((m) => ({ ...m, [id]: list.map((it) => it.place?.id) }))));
    return () => unsubs.forEach((u) => u && u());
  }, [ids, user?.uid, api]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(() => Object.entries(plans).filter(([, list]) => list.includes(placeId)).map(([id]) => id), [plans, placeId]);
}

/** Nút thêm vào kế hoạch chuyến: nếu địa điểm đã có trong kế hoạch thì báo "đã nằm trong chuyến này" */
function PlanButton({ tripId, place, onOpen }) {
  const { api, user, notify } = useApp();
  const { t } = useI18n();
  const [plan, setPlan] = useState(null);
  useEffect(() => api.watchPlan(tripId, setPlan), [tripId, api]);
  if (!plan) return null;
  const inPlan = plan.some((it) => it.place?.id === place.id);
  if (inPlan)
    return (
      <button type="button" className="btn btn--sm btn--ghost in-plan" onClick={onOpen} title={t('place.openPlan')}>
        ✅ {t('place.inPlan')} →
      </button>
    );
  return (
    <button
      type="button"
      className="btn btn--sm btn--soft"
      onClick={async () => {
        await api.addPlanItem(user, tripId, { place, order: Date.now() });
        notify(t('plan.added', { name: pName(place) }));
      }}
    >
      🗓️ {t('place.addToPlan')}
    </button>
  );
}

function PlacePanel() {
  const { removePlace, saveVisited, placeById, selectedPlace: p, setSelectedPlace, placeStatus, setPlaceStatus, setModal, memories, publicMemories, requireLogin, trips, returnView, setReturnView, setView, api, user, notify } = useApp();
  // Chuyến đi gắn với địa điểm: lấy theo dữ liệu đã lưu
  const savedTripId = placeById[p.id]?.tripId || '';
  const { setOpenTripId, setTripTab, openTripId } = useApp();
  // Chuyến đi có địa điểm này trong kế hoạch → tự chọn sẵn, không bắt chọn lại
  const planTrips = useTripsWithPlace(p.id, trips);
  const planTripId = planTrips.includes(openTripId) ? openTripId : planTrips[0] || '';
  const defaultTripId = savedTripId || planTripId;
  const [tripId, setTripId] = useState(defaultTripId);
  useEffect(() => setTripId(defaultTripId), [p.id, defaultTripId]);
  // Đã lưu địa điểm (đã đến / muốn đi) nhưng chưa gắn chuyến mà nó nằm trong kế hoạch → tự lưu chuyến đó
  useEffect(() => {
    const status = placeStatus[p.id];
    if (user && status && !savedTripId && planTripId) api.setPlaceTrip(user, placeById[p.id] || p, status, planTripId, '').catch(() => {});
  }, [p.id, planTripId, savedTripId, placeStatus[p.id]]); // eslint-disable-line react-hooks/exhaustive-deps
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
          {tripId && user && <PlanButton tripId={tripId} place={placeById[p.id] || p} onOpen={() => {
            setOpenTripId(tripId);
            setTripTab('plan');
            setView('trips');
          }} />}
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
      {(st === 'visited' || mine.length > 0) && <CheckinHistory place={p} saved={placeById[p.id]} mine={mine} tripId={tripId} />}
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

/** Lịch sử check-in tại 1 địa điểm: mỗi lần đến có ngày, dịp, ghi chú và ảnh riêng */
function CheckinHistory({ place, saved, mine, tripId }) {
  const { t } = useI18n();
  const { setModal, api, notify, requireLogin, trips } = useApp();
  // Lần đến cũ chỉ có ngày / dịp (chưa phải check-in đầy đủ) → vẫn hiện như 1 lần check-in
  const legacy = saved?.status === 'visited' && (saved.visitedAt || saved.occasion) && !mine.some((m) => m.date && m.date === saved.visitedAt) ? saved : null;
  const entries = [
    ...mine.map((m) => ({ key: m.id, date: m.date, occasion: m.occasion, caption: m.caption, photos: m.photos || [], tripId: m.tripId, memory: m })),
    ...(legacy ? [{ key: 'legacy', date: legacy.visitedAt, occasion: legacy.occasion, caption: '', photos: [], legacy: true }] : []),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const count = entries.length || (saved?.status === 'visited' ? 1 : 0);
  // Thêm lần mới: lần đến cũ (chỉ có ngày / dịp) được giữ lại thành 1 lần check-in riêng
  const add = () => requireLogin(() => setModal({ type: 'checkin', place, tripId, preserve: legacy || undefined }), t('reason.saveMemory'));
  return (
    <section className="checkins">
      <div className="trip-summary__head">
        <h3 className="section-title">
          👣 {t('checkin.history')} <span className="checkins__count">{t('checkin.times', { n: count })}</span>
        </h3>
        <button className="btn btn--sm btn--primary" onClick={add}>
          ＋ {t('checkin.again')}
        </button>
      </div>
      {entries.length === 0 && <p className="small muted">{t('checkin.none')}</p>}
      <ol className="checkins__list">
        {entries.map((e, i) => (
          <li key={e.key}>
            <div className="checkins__dot">{entries.length - i}</div>
            <div className="checkins__body">
              <div className="checkins__head">
                <b>{e.date ? formatDate(e.date) : t('checkin.noDate')}</b>
                {e.occasion && <span className="chip chip--sm">{e.occasion}</span>}
                {e.tripId && trips.find((x) => x.id === e.tripId) && (
                  <small className="muted">
                    {trips.find((x) => x.id === e.tripId).emoji} {trips.find((x) => x.id === e.tripId).name}
                  </small>
                )}
                {e.memory?.visibility === 'public' && <small title={t('checkin.public')}>🌍</small>}
              </div>
              {e.caption && <p className="small checkins__note">{e.caption}</p>}
              {e.photos.length > 0 && (
                <div className="checkins__photos">
                  {e.photos.slice(0, 4).map((src, k) => (
                    <button key={k} onClick={() => setModal({ type: 'viewMemory', memory: e.memory })}>
                      <LoadingImage src={src} alt="" loading="lazy" />
                      {k === 3 && e.photos.length > 4 && <span>+{e.photos.length - 4}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="checkins__actions">
              <button
                className="icon-btn icon-btn--sm"
                title={t('plan.edit')}
                onClick={() => setModal({ type: 'checkin', place, memory: e.memory, legacy: e.legacy ? saved : undefined, tripId })}
              >
                ✏️
              </button>
              {e.memory && (
                <button
                  className="icon-btn icon-btn--sm"
                  title={t('plan.remove')}
                  onClick={async () => {
                    if (!confirm(t('checkin.confirmDelete'))) return;
                    await api.deleteMemory(e.memory);
                    notify(t('mem.deleted'));
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
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
