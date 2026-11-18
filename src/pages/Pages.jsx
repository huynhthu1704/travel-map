import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { MemoryGrid } from '../components/SidePanel';
import { Avatar, Chip, Empty, formatDate, Loader, LoadingImage } from '../components/ui';
import { countryName, flagOf } from '../lib/countries';
import { normalize } from '../lib/geo';
import { useI18n } from '../i18n';
import { pName, pCity } from '../lib/lang';
import Combobox from '../components/Combobox';

/** Bộ lọc dùng chung: tìm theo chữ + chọn bất kỳ quốc gia + gõ/chọn thành phố */
function useFilters(items, getPlace) {
  const [text, setText] = useState('');
  const [cc, setCc] = useState('');
  const [city, setCity] = useState('');
  const { t, lang } = useI18n();
  const { countries: geo, famousFor, ensureFamous } = useApp();
  const listId = useMemo(() => `cities-${Math.random().toString(36).slice(2, 8)}`, []);

  // Tất cả quốc gia trên thế giới; quốc gia đang có dữ liệu được đưa lên đầu
  const withData = useMemo(() => new Set(items.map((i) => getPlace(i)?.country).filter(Boolean)), [items, getPlace]);
  const allCountries = useMemo(() => {
    const ccs = new Set((geo?.features || []).map((f) => f.properties.cc).filter(Boolean));
    withData.forEach((c) => ccs.add(c));
    const byName = (x, y) => countryName(x).localeCompare(countryName(y), lang);
    const all = [...ccs];
    return { top: all.filter((c) => withData.has(c)).sort(byName), rest: all.filter((c) => !withData.has(c)).sort(byName) };
  }, [geo, withData, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nạp địa điểm nổi tiếng của quốc gia đã chọn để gợi ý tên thành phố
  useEffect(() => ensureFamous(cc), [cc, ensureFamous]);
  const cities = useMemo(() => {
    const fromItems = items.filter((i) => !cc || getPlace(i)?.country === cc).map((i) => pCity(getPlace(i)));
    const fromFamous = cc ? famousFor(cc).map((p) => pCity(p)) : [];
    return [...new Set([...fromItems, ...fromFamous].filter(Boolean))].sort((x, y) => x.localeCompare(y, lang));
  }, [items, cc, getPlace, lang, famousFor]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const n = normalize(text.trim());
    const nc = normalize(city.trim());
    return items.filter((i) => {
      const p = getPlace(i) || {};
      if (cc && p.country !== cc) return false;
      if (nc && !normalize(`${pCity(p)} ${p.city}`).includes(nc)) return false;
      if (n && !normalize(`${p.name} ${pName(p)} ${p.city} ${pCity(p)} ${countryName(p.country)} ${i.caption || ''} ${i.authorName || ''}`).includes(n)) return false;
      return true;
    });
  }, [items, text, cc, city, getPlace, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const countryOptions = useMemo(
    () => [
      ...allCountries.top.map((c) => ({ value: c, label: countryName(c), icon: flagOf(c), group: t('filter.withData') })),
      ...allCountries.rest.map((c) => ({ value: c, label: countryName(c), icon: flagOf(c), group: t('filter.allWorld') })),
    ],
    [allCountries, t],
  );
  const cityOptions = useMemo(() => cities.map((c) => ({ value: c, label: c })), [cities]);

  const ui = (
    <div className="filters">
      <input className="filters__search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('filter.search')} />
      <Combobox
        value={cc}
        options={countryOptions}
        onChange={(v) => {
          setCc(v);
          setCity('');
        }}
        placeholder={t('filter.countryPlaceholder')}
        allLabel={t('filter.allCountries')}
        ariaLabel={t('filter.byCountry')}
        icon="🌏"
      />
      <Combobox
        value={city}
        options={cityOptions}
        onChange={setCity}
        placeholder={t('filter.cityPlaceholder')}
        allLabel={t('filter.allCities')}
        ariaLabel={t('filter.byCity')}
        allowFree
        icon="🏙️"
      />
    </div>
  );
  return { filtered, ui, cc, city };
}
const memPlace = (m) => m.place;

export function ExplorePage() {
  const { publicMemories, openCountry, loaded } = useApp();
  const { t } = useI18n();
  const { filtered, ui, cc } = useFilters(publicMemories, memPlace);
  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t('explore.eyebrow')}</p>
          <h1 className="h1">{t('explore.title')}</h1>
          <p className="muted">{t('explore.sub')}</p>
        </div>
      </header>
      {ui}
      {!loaded.public ? (
        <Loader />
      ) : filtered.length ? (
        <MemoryGrid items={filtered} />
      ) : (
        <Empty
          emoji="🔭"
          title={t('explore.empty')}
          text={t('explore.emptyHint')}
          action={
            cc && (
              <button className="btn btn--primary" onClick={() => openCountry(cc)}>
                {t('explore.seeFamous', { country: countryName(cc) })}
              </button>
            )
          }
        />
      )}
    </div>
  );
}

export function MemoriesPage() {
  const { user, memories, places, requireLogin, setModal, openPlace, startPicking, loaded } = useApp();
  const [tab, setTab] = useState('memories');
  const { t } = useI18n();
  const { filtered, ui } = useFilters(memories, memPlace);
  const wish = places.filter((p) => p.status === 'wishlist');
  const visited = places.filter((p) => p.status === 'visited');

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="📸"
          title={t('mine.loginTitle')}
          text={t('mine.loginText')}
          action={<button className="btn btn--primary" onClick={() => requireLogin(() => {})}>{t('auth.login')}</button>}
        />
      </div>
    );

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t('mine.eyebrow')}</p>
          <h1 className="h1">{t('mine.title')}</h1>
        </div>
        <div className="row wrap">
          <button className="btn btn--outline" onClick={() => startPicking('place', tab === 'wishlist' ? 'wishlist' : 'visited')}>
            {t('pick.addOnMap')}
          </button>
          <button className="btn btn--primary" onClick={() => setModal({ type: 'memory' })}>
            {t('place.addMemory')}
          </button>
        </div>
      </header>
      <div className="chips">
        <Chip active={tab === 'memories'} onClick={() => setTab('memories')}>{t('mine.tabMemories', { n: memories.length })}</Chip>
        <Chip active={tab === 'visited'} onClick={() => setTab('visited')}>{t('mine.tabVisited', { n: visited.length })}</Chip>
        <Chip active={tab === 'wishlist'} onClick={() => setTab('wishlist')}>{t('mine.tabWish', { n: wish.length })}</Chip>
      </div>
      {tab === 'memories' && (
        <>
          {ui}
          {!loaded.mine ? (
            <Loader />
          ) : filtered.length ? (
            <MemoryGrid items={filtered} />
          ) : (
            <Empty emoji="🧺" title={t('mine.empty')} text={t('mine.emptyHint')} />
          )}
        </>
      )}
      {tab !== 'memories' && (
        <PlaceList items={tab === 'visited' ? visited : wish} onOpen={openPlace} emptyText={tab === 'visited' ? t('mine.noVisited') : t('mine.noWish')} />
      )}
    </div>
  );
}

function PlaceList({ items, onOpen, emptyText }) {
  const { filtered, ui } = useFilters(items, (p) => p);
  const { setModal, removePlace } = useApp();
  const { t } = useI18n();
  return (
    <>
      {ui}
      {filtered.length ? (
        <div className="list list--cards">
          {filtered.map((p) => (
            <div key={p.id} className="list-item">
              <span className="list-item__emoji">{p.emoji || '📍'}</span>
              <button className="list-item__main" onClick={() => onOpen(p)}>
                <b>{pName(p)}</b>
                <small>
                  {flagOf(p.country)} {[pCity(p), countryName(p.country)].filter(Boolean).join(', ')}
                  {p.visitedAt ? ` · 📅 ${formatDate(p.visitedAt)}` : ''}
                </small>
              </button>
              <button className="btn btn--sm btn--soft" onClick={() => setModal({ type: 'directions', place: p })}>
                {t('common.directions')}
              </button>
              <button className="icon-btn icon-btn--danger" onClick={() => removePlace(p)} aria-label={t('remove.confirm')} title={t('remove.confirm')}>
                🗑️
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
  const { user, trips, api, requireLogin, notify, activeTripId, setActiveTripId, setView, loaded } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧳');
  const [code, setCode] = useState('');
  const [openId, setOpenId] = useState(null);
  const { t } = useI18n();

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="🧳"
          title={t('trips.loginTitle')}
          text={t('trips.loginText')}
          action={<button className="btn btn--primary" onClick={() => requireLogin(() => {})}>{t('auth.login')}</button>}
        />
      </div>
    );

  const open = trips.find((tr) => tr.id === openId);
  if (open) return <TripDetail trip={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t('trips.eyebrow')}</p>
          <h1 className="h1">{t('trips.title')}</h1>
          <p className="muted">{t('trips.sub')}</p>
        </div>
      </header>
      <div className="grid-2 grid-2--wide">
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const tr = await api.createTrip(user, { name: name.trim(), emoji });
            setName('');
            notify(t('trips.created', { name: tr.name }));
            setOpenId(tr.id);
          }}
        >
          <h3 className="h3">{t('trips.create')}</h3>
          <div className="row">
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} className="emoji-select" aria-label={t('trips.icon')}>
              {['🧳', '🏖️', '🏔️', '🌸', '🍜', '🎒', '🚗', '✈️', '🏕️', '🎉'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('trips.namePlaceholder')} className="grow" />
          </div>
          <button className="btn btn--primary">{t('trips.createBtn')}</button>
        </form>
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const tr = await api.joinTrip(user, code);
              notify(t('trips.joined', { name: tr.name }));
              setCode('');
            } catch (err) {
              notify(err.message, 'error');
            }
          }}
        >
          <h3 className="h3">{t('trips.join')}</h3>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('trips.codePlaceholder')} maxLength={8} />
          <button className="btn btn--dark">{t('trips.joinBtn')}</button>
        </form>
      </div>
      {!loaded.trips ? (
        <Loader />
      ) : trips.length === 0 ? (
        <Empty emoji="🎒" title={t('trips.empty')} />
      ) : (
        <div className="trip-list">
          {trips.map((tr) => (
            <article key={tr.id} className="trip-card">
              <button className="trip-card__main" onClick={() => setOpenId(tr.id)}>
                <span className="trip-card__emoji">{tr.emoji}</span>
                <span>
                  <b>{tr.name}</b>
                  <small>{t('trips.meta', { n: tr.memberIds.length, code: tr.inviteCode })}</small>
                </span>
              </button>
              <div className="avatars">
                {Object.entries(tr.members || {}).slice(0, 4).map(([id, m]) => (
                  <Avatar key={id} name={m.name} photo={m.photo} size={28} />
                ))}
              </div>
              <button
                className={`btn btn--sm ${activeTripId === tr.id ? 'btn--primary' : 'btn--soft'}`}
                onClick={() => {
                  setActiveTripId(activeTripId === tr.id ? null : tr.id);
                  setView('map');
                }}
              >
                🗺️ {activeTripId === tr.id ? t('trips.showing') : t('trips.viewMap')}
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
  const { t } = useI18n();
  const [stops, setStops] = useState(null);
  useEffect(() => api.watchStops(trip.id, setStops), [trip.id, api]);
  const link = `${location.origin}${location.pathname}#join=${trip.inviteCode}`;
  const share = async () => {
    const text = t('trip.inviteText', { name: trip.name, emoji: trip.emoji });
    if (navigator.share) {
      try {
        await navigator.share({ title: trip.name, text, url: link });
        return;
      } catch {
        /* huỷ */
      }
    }
    await navigator.clipboard?.writeText(link);
    notify(t('trip.copied'));
  };
  const stopList = stops || [];
  const countries = [...new Set(stopList.map((s) => s.place.country).filter(Boolean))];
  return (
    <div className="page">
      <button className="back" onClick={onBack}>{t('trip.back')}</button>
      <header className="page__head">
        <div>
          <h1 className="h1">
            {trip.emoji} {trip.name}
          </h1>
          <p className="muted">
            {countries.map(flagOf).join(' ')} {t('trip.stops', { n: stopList.length })} · {t('trip.code')} <b className="code">{trip.inviteCode}</b>
          </p>
        </div>
        <div className="row wrap">
          <button className="btn btn--primary" onClick={share}>{t('trip.invite')}</button>
          <button
            className="btn btn--dark"
            onClick={() => {
              setActiveTripId(trip.id);
              setView('map');
            }}
          >
            {t('trip.onMap')}
          </button>
        </div>
      </header>
      <section>
        <h3 className="section-title">{t('trip.members')}</h3>
        <div className="row wrap">
          {Object.entries(trip.members || {}).map(([id, m]) => (
            <span key={id} className="member">
              <Avatar name={m.name} photo={m.photo} size={28} /> {m.name}
              {id === trip.ownerId && <small> · {t('trip.owner')}</small>}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h3 className="section-title">{t('trip.journey')}</h3>
        {!stops ? (
          <Loader />
        ) : stops.length === 0 ? (
          <Empty emoji="📍" title={t('trip.noStops')} text={t('trip.noStopsHint')} />
        ) : (
          <ol className="timeline">
            {stops.map((s) => (
              <li key={s.id}>
                <div className="timeline__dot">{s.kind === 'memory' ? '📸' : '👣'}</div>
                <div className="timeline__body">
                  <button className="link" onClick={() => openPlace(s.place)}>
                    <b>{pName(s.place)}</b>
                  </button>
                  <div className="small muted">
                    {flagOf(s.place.country)} {[pCity(s.place), countryName(s.place.country)].filter(Boolean).join(', ')} · {t('trip.by', { name: s.byName })}
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
                          <LoadingImage src={p} alt="" loading="lazy" />
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
          if (!confirm(trip.ownerId === user.uid ? t('trip.confirmDelete') : t('trip.confirmLeave'))) return;
          await api.leaveTrip(user, trip);
          setActiveTripId(null);
          onBack();
        }}
      >
        {trip.ownerId === user.uid ? t('trip.delete') : t('trip.leave')}
      </button>
    </div>
  );
}
