import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { FAMOUS_PLACES } from '../data/places';
import { countryName, flagOf, WORLD_COUNTRY_COUNT } from '../lib/countries';
import { Chip, Empty, formatDate, Avatar, Loader, LoadingImage, OccasionField, DirectionsIcon, AppLink, TrashIcon } from './ui';
import { hrefPlace, hrefProfile, hrefCountry } from '../lib/route';
import { useI18n } from '../i18n';
import { pName, pCity, pDesc, getLocale } from '../lib/lang';
import { usePlaceImage } from '../lib/placeImage';
import { photoCountOf, useThumbs } from '../lib/useThumbs';
import Combobox from './Combobox';
import { normalize } from '../lib/geo';
import DateInput from './DateInput';
import TimeInput from './TimeInput';

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
  // bảng bị ẩn (vd. đang chọn điểm trên bản đồ): trả nút bản đồ về sát đáy
  useEffect(() => () => document.documentElement.style.setProperty('--sheet-h', '0px'), []);
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

/** Đổi ngày / giờ của 1 địa điểm ngay trong bảng lộ trình trên bản đồ (bản đồ đánh số lại ngay) */
function RouteItemEdit({ item, tripId }) {
  const { api, notify } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(item.date || '');
  const [time, setTime] = useState(item.time || '');
  useEffect(() => {
    if (!open) {
      setDate(item.date || '');
      setTime(item.time || '');
    }
  }, [item.date, item.time, open]);
  const save = async () => {
    await api.updatePlanItem(tripId, item.id, { date: date || '', time: time || '' });
    notify(t('plan.saved'));
    setOpen(false);
  };
  return (
    <>
      <button className="icon-btn icon-btn--sm route-list__edit" title={t('route.editWhen')} aria-label={t('route.editWhen')} onClick={() => setOpen((v) => !v)}>
        {open ? '✕' : '🕘'}
      </button>
      {open && (
        <div className="route-edit">
          <div className="route-edit__row">
            <DateInput value={date} onChange={setDate} ariaLabel={t('plan.date')} />
            <TimeInput value={time} onChange={setTime} ariaLabel={t('plan.time')} />
          </div>
          <div className="row">
            <button className="btn btn--sm btn--primary" onClick={save}>
              💾 {t('trip.save')}
            </button>
            <button className="btn btn--sm btn--ghost" onClick={() => setOpen(false)}>
              {t('pick.cancel')}
            </button>
          </div>
        </div>
      )}
    </>
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
                  <RouteItemEdit item={it} tripId={trip.id} />
                  <AppLink className="route-list__main" href={hrefPlace(it.place)} onClick={() => openPlace(it.place)}>
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
                  </AppLink>
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

/* Trạng thái danh sách (ô tìm, địa điểm đang mở xem nhanh) — giữ lại khi vào trang chi tiết rồi quay về */
const listMemory = {};

/** Xem nhanh một địa điểm ngay trong danh sách: ảnh, mô tả, check-in, muốn đi, chỉ đường, chi tiết */
function PlacePreview({ place: p, onDetail }) {
  const { t } = useI18n();
  const { placeStatus, setPlaceStatus, setModal, requireLogin, memories } = useApp();
  const { src, loading } = usePlaceImage(p);
  const st = placeStatus[p.id];
  const times = memories.filter((m) => m.place?.id === p.id).length || (st === 'visited' ? 1 : 0);
  const desc = pDesc(p);
  return (
    <div className="pv">
      <div className="pv__top">
        {(src || loading) && (
          <div className="pv__img">
            <LoadingImage src={src} finding={loading} alt="" loading="lazy" />
          </div>
        )}
        <div className="pv__text">
          <small className="muted">
            {[pCity(p), countryName(p.country)].filter(Boolean).join(', ')} {flagOf(p.country)}
          </small>
          {desc && <p className="pv__desc">{desc}</p>}
          {st === 'visited' && <span className="pv__badge pv__badge--done">✓ {t('checkin.been')} · {t('checkin.times', { n: times })}</span>}
          {st === 'wishlist' && <span className="pv__badge">💛 {t('pv.inWish')}</span>}
        </div>
      </div>
      <div className="pv__actions">
        <button className="btn btn--sm btn--primary" onClick={() => requireLogin(() => setModal({ type: 'checkin', place: p }), t('reason.saveMemory'))}>
          {st === 'visited' ? `＋ ${t('checkin.ctaAgain')}` : `👣 ${t('checkin.title')}`}
        </button>
        {st !== 'visited' && (
          <button className={`btn btn--sm ${st === 'wishlist' ? 'btn--coral' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'wishlist')}>
            {st === 'wishlist' ? '💛' : '🤍'} {t('pv.wish')}
          </button>
        )}
        <button className="btn btn--sm btn--outline" title={t('common.directions')} aria-label={t('common.directions')} onClick={() => setModal({ type: 'directions', place: p })}>
          <DirectionsIcon />
        </button>
        <button className="btn btn--sm btn--dark pv__more" onClick={onDetail}>
          {t('pv.detail')} →
        </button>
      </div>
    </div>
  );
}

/** Nhóm địa điểm theo quốc gia → thành phố, có ô tìm, mở / thu gọn từng quốc gia.
    Bấm một địa điểm → mở xem nhanh ngay tại chỗ + bay bản đồ tới; "Chi tiết" mới mở trang riêng. */
function GroupedPlaces({ items, emptyEmoji, emptyTitle, emptyText, rowExtra, sortCountries = 'count', memKey = 'list' }) {
  const { openPlace, openCountry, setFlyTarget } = useApp();
  const { t, lang } = useI18n();
  const mem = (listMemory[memKey] ||= { q: '', openId: null });
  const [q, setQState] = useState(mem.q);
  const [openId, setOpenIdState] = useState(mem.openId);
  const setQ = (v) => setQState((mem.q = v));
  const setOpenId = (v) => setOpenIdState((mem.openId = v));
  const rootRef = useRef(null);
  // Quay về từ trang chi tiết: cuộn tới địa điểm đang mở
  useEffect(() => {
    if (!mem.openId) return;
    const el = rootRef.current?.querySelector(`[data-pid="${CSS.escape(mem.openId)}"]`);
    el?.scrollIntoView({ block: 'center' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (p) => {
    if (openId === p.id) return setOpenId(null);
    setOpenId(p.id);
    if (p.lat != null) setFlyTarget({ lat: p.lat, lng: p.lng, zoom: 15, focus: true, t: Date.now() });
  };
  const n = normalize(q.trim());
  const filtered = n ? items.filter((p) => normalize(`${p.name} ${pName(p)} ${p.city} ${pCity(p)} ${countryName(p.country)}`).includes(n)) : items;
  const groups = useMemo(() => {
    const g = {};
    filtered.forEach((p) => {
      const cc = p.country || '—';
      const city = pCity(p) || t('group.otherCity');
      ((g[cc] ||= {})[city] ||= []).push(p);
    });
    const ccs = Object.keys(g).sort((a, b) =>
      sortCountries === 'count'
        ? Object.values(g[b]).flat().length - Object.values(g[a]).flat().length || countryName(a).localeCompare(countryName(b), lang)
        : countryName(a).localeCompare(countryName(b), lang),
    );
    return ccs.map((cc) => ({
      cc,
      total: Object.values(g[cc]).flat().length,
      cities: Object.entries(g[cc]).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], lang)),
    }));
  }, [filtered, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!items.length) return <Empty emoji={emptyEmoji} title={emptyTitle} text={emptyText} />;
  return (
    <div className="stack-sm grouped" ref={rootRef}>
      {items.length > 6 && <input className="grouped__search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('group.search')} />}
      {groups.map((g, gi) => (
        <details key={g.cc} className="grouped__country" open={!!n || groups.length === 1 || g.cities.some(([, l]) => l.some((p) => p.id === openId))}>
          <summary>
            <span className="grouped__flag">{g.cc === '—' ? '🌐' : flagOf(g.cc)}</span>
            <b>{g.cc === '—' ? t('group.otherCountry') : countryName(g.cc)}</b>
            <span className="grouped__count">{g.total}</span>
            {g.cc !== '—' && (
              <AppLink className="icon-btn icon-btn--sm" href={hrefCountry(g.cc)} title={t('group.viewCountry')} onClick={() => openCountry(g.cc)}>
                🗺️
              </AppLink>
            )}
          </summary>
          {g.cities.map(([city, list]) => (
            <div key={city} className="grouped__city">
              <div className="grouped__cityname">
                🏙️ {city} <span>{list.length}</span>
              </div>
              {list.map((p) => (
                <div key={p.id} className={`grouped__item ${openId === p.id ? 'is-open' : ''}`} data-pid={p.id}>
                  <div className="grouped__row">
                    <button className="grouped__place" aria-expanded={openId === p.id} onClick={() => toggle(p)}>
                      <span className="grouped__emoji">{p.emoji || '📍'}</span>
                      <span className="grouped__text">
                        <b>{pName(p)}</b>
                        {p.visitedAt && <small>{formatDate(p.visitedAt)}</small>}
                      </span>
                      <span className="grouped__chev" aria-hidden>
                        ›
                      </span>
                    </button>
                    {openId !== p.id && rowExtra?.(p)}
                  </div>
                  {openId === p.id && <PlacePreview place={p} onDetail={() => openPlace(p, { from: 'list' })} />}
                </div>
              ))}
            </div>
          ))}
        </details>
      ))}
      {n && !groups.length && <p className="small muted">{t('plan.noResults')}</p>}
    </div>
  );
}

const HOME_TABS = ['overview', 'visited', 'wishlist', 'famous'];

function WorldPanel() {
  const {
    user, places, memories, visitedCountries, openCountry, requireLogin, setModal, trips, activeTripId, setActiveTripId, startPicking,
    homeCountry, setHomeCountry, famousFor, homeLoading, countries, setFlyTarget, placeStatus, setPlaceStatus,
  } = useApp();
  const { t, lang } = useI18n();
  const [tab, setTabState] = useState(() => {
    try {
      return HOME_TABS.includes(localStorage.getItem('travel-map-home-tab')) ? localStorage.getItem('travel-map-home-tab') : 'overview';
    } catch {
      return 'overview';
    }
  });
  const setTab = (v) => {
    setTabState(v);
    try {
      localStorage.setItem('travel-map-home-tab', v);
    } catch {
      /* bỏ qua */
    }
  };
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
    setFlyTarget({ country: cc, t: Date.now() });
  };
  // Đã đi = địa điểm đánh dấu đã đến + nơi có kỉ niệm (không trùng)
  const visitedList = useMemo(() => {
    const m = new Map();
    places.filter((p) => p.status === 'visited').forEach((p) => m.set(p.id, p));
    memories.forEach((mem) => mem.place && !m.has(mem.place.id) && m.set(mem.place.id, { ...mem.place, visitedAt: mem.date }));
    return [...m.values()];
  }, [places, memories]);
  const wish = places.filter((p) => p.status === 'wishlist');
  const pct = Math.round((visitedCountries.size / WORLD_COUNTRY_COUNT) * 1000) / 10;
  const quick = (p) => {
    const st = placeStatus[p.id];
    return (
      <span className="grouped__quick">
        <button className={`icon-btn icon-btn--sm ${st === 'wishlist' ? 'is-on' : ''}`} title={t('card.wish')} onClick={() => setPlaceStatus(p, 'wishlist')}>
          {st === 'wishlist' ? '💛' : '🤍'}
        </button>
        <button className={`icon-btn icon-btn--sm ${st === 'visited' ? 'is-on' : ''}`} title={t('card.markVisited')} onClick={() => setPlaceStatus(p, 'visited')}>
          👣
        </button>
      </span>
    );
  };
  const tabs = [
    ['overview', '🏠', t('home.tab.overview')],
    ['visited', '👣', t('home.tab.visited'), visitedList.length],
    ['wishlist', '💛', t('home.tab.wishlist'), wish.length],
    ['famous', '🌍', t('home.tab.famous')],
  ];
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">{t('world.eyebrow', { name: user ? user.name.split(' ').slice(-1)[0] : t('world.you') })}</p>
        <h1 className="h2">{t('world.title')}</h1>
      </div>
      <div className="home-tabs" role="tablist">
        {tabs.map(([id, icon, label, count]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <span>{icon}</span>
            <small>{label}</small>
            {count > 0 && <em>{count}</em>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <p className="muted small">{t('world.hint')}</p>
          {user && <OnThisDay />}
          <div className="stats">
            <button className="stat stat--btn" onClick={() => setTab('visited')}>
              <div className="stat__value">🌏 {visitedCountries.size}</div>
              <div className="stat__label">{t('stat.countries')}</div>
            </button>
            <button className="stat stat--btn" onClick={() => setTab('visited')}>
              <div className="stat__value">👣 {visitedList.length}</div>
              <div className="stat__label">{t('stat.visited')}</div>
            </button>
            <button className="stat stat--btn" onClick={() => setTab('wishlist')}>
              <div className="stat__value">💛 {wish.length}</div>
              <div className="stat__label">{t('stat.wish')}</div>
            </button>
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
                {trips.map((tr) => (
                  <Chip key={tr.id} active={activeTripId === tr.id} onClick={() => setActiveTripId(tr.id)}>
                    {tr.emoji} {tr.name}
                  </Chip>
                ))}
              </div>
            </section>
          )}
          <button className="btn btn--primary btn--block" onClick={() => requireLogin(() => setModal({ type: 'memory' }), t('reason.saveMemory'))}>
            {t('world.addMemory')}
          </button>
          <PopularPlaces />
          <nav className="quick-links" aria-label={t('home.more')}>
            <button onClick={() => setModal({ type: 'faq' })}>
              <span className="quick-links__ic">❓</span>
              <span>{t('home.link.faq')}</span>
            </button>
            <button onClick={() => requireLogin(() => setModal({ type: 'feedback' }), t('fb.loginReason'))}>
              <span className="quick-links__ic">💬</span>
              <span>{t('home.link.feedback')}</span>
            </button>
            <button onClick={() => setModal({ type: 'sponsor' })}>
              <span className="quick-links__ic">☕</span>
              <span>{t('home.link.sponsor')}</span>
            </button>
            <button onClick={() => setModal({ type: 'whatsNew' })}>
              <span className="quick-links__ic">✨</span>
              <span>
                {t('rn.open')} <em>v{__APP_VERSION__}</em>
              </span>
            </button>
          </nav>
        </>
      )}

      {tab === 'visited' && (
        <>
          <p className="small muted">{t('home.visitedSummary', { n: visitedList.length, c: visitedCountries.size })}</p>
          <GroupedPlaces
            items={visitedList}
            memKey="visited"
            emptyEmoji="👣"
            emptyTitle={t('home.visitedEmpty')}
            emptyText={t('home.visitedEmptyHint')}
          />
        </>
      )}

      {tab === 'wishlist' && (
        <>
          <p className="small muted">{t('home.wishSummary', { n: wish.length })}</p>
          <GroupedPlaces
            items={wish}
            memKey="wishlist"
            emptyEmoji="💛"
            emptyTitle={t('home.wishEmpty')}
            emptyText={t('home.wishEmptyHint')}
            rowExtra={(p) => (
              <button className="icon-btn icon-btn--sm" title={t('card.markVisited')} onClick={() => setPlaceStatus(p, 'visited')}>
                👣
              </button>
            )}
          />
        </>
      )}

      {tab === 'famous' && (
        <section className="stack home-famous">
          <Combobox value={homeCountry} options={countryOptions} onChange={chooseHome} placeholder={t('filter.countryPlaceholder')} ariaLabel={t('filter.byCountry')} icon="🌏" />
          <div className="chips chips--scroll">
            {Object.keys(FAMOUS_PLACES)
              .filter((cc) => cc !== homeCountry)
              .map((cc) => (
                <Chip key={cc} onClick={() => chooseHome(cc)}>
                  {flagOf(cc)} {countryName(cc)}
                </Chip>
              ))}
          </div>
          {homeLoading && <Loader text={t('country.loadingMore')} />}
          <GroupedPlaces items={homeFamous} memKey={`famous-${homeCountry}`} emptyEmoji="🏞️" emptyTitle={t('home.famousEmpty')} rowExtra={quick} />
        </section>
      )}
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
              <AppLink key={p.id} className="list-item" href={hrefPlace(p)} onClick={() => openPlace(p)}>
                <span className="list-item__emoji">{p.status === 'visited' ? '👣' : '💛'}</span>
                <span>
                  <b>{pName(p)}</b>
                  <small>
                    {pCity(p)}
                    {p.visitedAt ? ` · 📅 ${formatDate(p.visitedAt)}` : ''}
                    {p.occasion ? ` · ${p.occasion}` : ''}
                  </small>
                </span>
              </AppLink>
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
      <AppLink className="place-card__cover" href={hrefPlace(place)} onClick={() => openPlace(place)} aria-label={pName(place)}>
        <LoadingImage src={img} finding={finding} alt={pName(place)} loading="lazy" fallback={<span>{place.emoji}</span>} />
        {img && <span className="place-card__badge">{place.emoji}</span>}
      </AppLink>
      <div className="place-card__body">
        <AppLink className="place-card__title" href={hrefPlace(place)} onClick={() => openPlace(place)}>
          {pName(place)}
        </AppLink>
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
          <button className="btn btn--sm btn--ghost" title={t('common.directions')} aria-label={t('common.directions')} onClick={() => setModal({ type: 'directions', place })}>
            <DirectionsIcon />
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
  const { setOpenTripId, setTripTab, openTripId, placeOrigin } = useApp();
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
          ← {placeOrigin === 'list' ? t('pv.backToList') : p.country ? countryName(p.country) : t('common.back')}
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

      <CheckinHistory place={p} saved={placeById[p.id]} mine={mine} tripId={tripId}>
        <div className="place-actions">
          <button className="btn btn--outline" onClick={() => setModal({ type: 'directions', place: p })}>
            <DirectionsIcon /> {t('common.directions')}
          </button>
          {st !== 'visited' && (
            <button className={`btn ${st === 'wishlist' ? 'btn--coral' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'wishlist', tripId)}>
              {st === 'wishlist' ? t('place.inWishlist') : t('place.addWishlist')}
            </button>
          )}
        </div>
      </CheckinHistory>

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

      {st && (
        <button className="btn btn--ghost btn--sm danger remove-btn" onClick={() => removePlace(placeById[p.id] || p)}>
          <TrashIcon /> {t(st === 'visited' ? 'remove.fromVisited' : 'remove.fromWish')}
        </button>
      )}
      <section>
        <h3 className="section-title">{t('place.others')}</h3>
        {pub.length ? <MemoryGrid items={pub} /> : <Empty emoji="🌱" title={t('place.noShares')} text={t('place.beFirst')} />}
      </section>
    </div>
  );
}

export function MemoryGrid({ items }) {
  const { setModal, placeStatus, user, openProfile } = useApp();
  return (
    <div className="mgrid">
      {items.map((m) => (
        <div
          key={m.id}
          className="mgrid__item"
          role="button"
          tabIndex={0}
          onClick={() => setModal({ type: 'viewMemory', memory: m })}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setModal({ type: 'viewMemory', memory: m }))}
        >
          <LoadingImage src={m.photos?.[0]} alt={m.caption || m.place?.name} loading="lazy" fallback={<span className="mgrid__noimg">📝</span>} />
          {photoCountOf(m) > 1 && <span className="mgrid__count">+{photoCountOf(m) - 1}</span>}
          <span className="mgrid__meta">
            <span>{pName(m.place)}</span>
            {m.uid !== user?.uid && m.authorName && (
              <AppLink
                className="mgrid__author"
                href={m.uid && m.uid !== 'sample' && m.uid !== 'trip-stop' ? hrefProfile(m.uid) : undefined}
                title={m.authorName}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!m.uid || m.uid === 'sample' || m.uid === 'trip-stop') return setModal({ type: 'viewMemory', memory: m });
                  openProfile(m.uid);
                }}
              >
                <small>👤 {m.authorName}</small>
              </AppLink>
            )}
          </span>
          {m.date && <span className="mgrid__date">{formatDate(m.date)}</span>}
          {placeStatus[m.place?.id] === 'wishlist' && <span className="mgrid__wish" title="💛">💛</span>}
        </div>
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
function CheckinHistory({ place, saved, mine, tripId, children }) {
  const { t } = useI18n();
  const { setModal, api, notify, requireLogin, trips } = useApp();
  // Lần đến cũ chỉ có ngày / dịp (chưa có lần check-in nào) → hiện như 1 lần check-in.
  // Khi đã có check-in thì danh sách check-in là nguồn chính, ngày đến = lần check-in gần nhất.
  const legacy = saved?.status === 'visited' && (saved.visitedAt || saved.occasion) && mine.length === 0 ? saved : null;
  const latest = mine.map((m) => m.date).filter(Boolean).sort().pop() || null;
  const { saveVisited } = useApp();
  useEffect(() => {
    if (mine.length && saved?.status === 'visited' && latest && saved.visitedAt !== latest) saveVisited(place, { visitedAt: latest }).catch(() => {});
  }, [latest, saved?.visitedAt, mine.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const entries = [
    ...mine.map((m) => ({ key: m.id, date: m.date, occasion: m.occasion, caption: m.caption, photos: m.photos || [], tripId: m.tripId, memory: m })),
    ...(legacy ? [{ key: 'legacy', date: legacy.visitedAt, occasion: legacy.occasion, caption: '', photos: [], legacy: true }] : []),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const count = entries.length || (saved?.status === 'visited' ? 1 : 0);
  // Thêm lần mới: lần đến cũ (chỉ có ngày / dịp) được giữ lại thành 1 lần check-in riêng
  const add = () => requireLogin(() => setModal({ type: 'checkin', place, tripId, preserve: legacy || undefined }), t('reason.saveMemory'));
  const been = count > 0;
  const lastDate = entries.find((e) => e.date)?.date;
  return (
    <>
      <div className={`checkin-card ${been ? 'checkin-card--done' : ''}`}>
        <div className="checkin-card__head">
          <span className="checkin-card__icon">{been ? '✓' : '👣'}</span>
          <div>
            <b>{been ? t('checkin.been') : t('checkin.ask')}</b>
            <small>
              {been
                ? [t('checkin.times', { n: count }), lastDate && t('checkin.last', { date: formatDate(lastDate) })].filter(Boolean).join(' · ')
                : t('checkin.askHint')}
            </small>
          </div>
        </div>
        <button className="btn btn--primary btn--block checkin-card__cta" onClick={add}>
          {been ? `＋ ${t('checkin.ctaAgain')}` : `👣 ${t('checkin.cta')}`}
        </button>
      </div>
      {children}
      {entries.length > 0 && (
    <section className="checkins">
      <h3 className="section-title">📖 {t('checkin.log')}</h3>
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
              {e.memory && photoCountOf(e.memory) > 0 && <CheckinPhotos memory={e.memory} onOpen={() => setModal({ type: 'viewMemory', memory: e.memory })} />}
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
                  <TrashIcon />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
      )}
    </>
  );
}

function CheckinPhotos({ memory, onOpen }) {
  const photos = useThumbs(memory);
  const n = photoCountOf(memory);
  return (
    <div className="checkins__photos">
      {photos.slice(0, 4).map((src, k) => (
        <button key={k} onClick={onOpen}>
          <LoadingImage src={src} alt="" loading="lazy" />
          {k === 3 && n > 4 && <span>+{n - 4}</span>}
        </button>
      ))}
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
/** Địa điểm được nhiều người check-in công khai nhất (gợi ý trên trang chủ) */
function PopularPlaces() {
  const { publicMemories, loadPublic, openPlace } = useApp();
  const { t } = useI18n();
  // tải check-in công khai khi trình duyệt rảnh để không làm chậm lần mở trang đầu
  useEffect(() => {
    const go = () => loadPublic();
    const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const top = useMemo(() => {
    const g = new Map();
    publicMemories.forEach((m) => {
      if (!m.place?.id || m.uid === 'trip-stop' || m.uid === 'sample') return;
      const e = g.get(m.place.id) || { place: m.place, people: new Set(), count: 0, photo: '', last: '' };
      e.people.add(m.uid);
      e.count += 1;
      const d = String(m.date || '');
      if (m.photos?.[0] && (!e.photo || d > e.last)) {
        e.photo = m.photos[0];
        e.last = d;
      }
      g.set(m.place.id, e);
    });
    return [...g.values()].sort((a, b) => b.people.size - a.people.size || b.count - a.count).slice(0, 5);
  }, [publicMemories]);
  if (!top.length) return null;
  return (
    <section className="popular">
      <h3 className="section-title">🔥 {t('home.popular')}</h3>
      <div className="popular__list">
        {top.map((e, i) => (
          <AppLink key={e.place.id} className="popular__item" href={hrefPlace(e.place)} onClick={() => openPlace(e.place)}>
            <span className="popular__rank">{i + 1}</span>
            <span className="popular__img">
              <LoadingImage src={e.photo} alt="" loading="lazy" fallback={<span>{e.place.emoji || '📍'}</span>} />
            </span>
            <span className="popular__text">
              <b>{pName(e.place)}</b>
              <small>
                {flagOf(e.place.country)} {[pCity(e.place), countryName(e.place.country)].filter(Boolean).join(', ')}
              </small>
            </span>
            <span className="popular__count" title={t('home.popularCount', { people: e.people.size, n: e.count })}>
              👥 {e.people.size}
            </span>
          </AppLink>
        ))}
      </div>
    </section>
  );
}

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
