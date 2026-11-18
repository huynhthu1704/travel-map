import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { famousIn, FAMOUS_PLACES } from '../data/places';
import { countryName, flagOf, WORLD_COUNTRY_COUNT } from '../lib/countries';
import { Chip, Empty, formatDate, Avatar } from './ui';
import { useI18n } from '../i18n';
import { pName, pCity, pDesc } from '../lib/lang';

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
  const { user, places, visitedCountries, openCountry, openPlace, requireLogin, setModal, trips, activeTripId, setActiveTripId, setPickMode } = useApp();
  const { t } = useI18n();
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

      <section>
        <h3 className="section-title">{t('world.suggest')}</h3>
        <div className="chips">
          {Object.keys(FAMOUS_PLACES).map((cc) => (
            <Chip key={cc} onClick={() => openCountry(cc)}>
              {flagOf(cc)} {countryName(cc)}
            </Chip>
          ))}
        </div>
      </section>
      <button className="btn btn--primary btn--block" onClick={() => requireLogin(() => setModal({ type: 'memory' }), t('reason.saveMemory'))}>
        {t('world.addMemory')}
      </button>
      <div className="grid-2">
        <button className="btn btn--outline btn--sm" onClick={() => setPickMode('place')}>
          {t('pick.open')}
        </button>
        <button className="btn btn--outline btn--sm" onClick={() => setModal({ type: 'addLink' })}>
          {t('link.open')}
        </button>
      </div>
      <p className="small muted">{t('pick.tip')}</p>
    </div>
  );
}

function CountryPanel() {
  const { selectedCountry: cc, setSelectedCountry, setFlyTarget, places, memories, publicMemories, openPlace, visitedCountries } = useApp();
  const [city, setCity] = useState(null);
  const { t, lang } = useI18n();
  const famous = famousIn(cc);
  const mine = places.filter((p) => p.country === cc);
  const pub = publicMemories.filter((m) => m.place?.country === cc);
  const cities = useMemo(
    () => [...new Set([...famous, ...mine, ...memories.map((m) => m.place)].filter((p) => p?.country === cc).map((p) => pCity(p)).filter(Boolean))],
    [famous, mine, memories, cc, lang], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const byCity = (p) => !city || pCity(p) === city;

  return (
    <div className="stack">
      <button
        className="back"
        onClick={() => {
          setSelectedCountry(null);
          setFlyTarget({ world: true, t: Date.now() });
        }}
      >
        {t('country.backWorld')}
      </button>
      <div className="country-head">
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
                  <small>{pCity(p)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title">{t('country.famous')}</h3>
        {famous.length === 0 ? (
          <p className="muted">{t('country.noFamous')}</p>
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
          <h3 className="section-title">{t('country.shared')}</h3>
          <MemoryGrid items={pub.filter((m) => byCity(m.place))} />
        </section>
      )}
    </div>
  );
}

export function PlaceCard({ place }) {
  const { placeStatus, setPlaceStatus, setModal, openPlace } = useApp();
  const { t } = useI18n();
  const st = placeStatus[place.id];
  return (
    <article className="place-card">
      <button className="place-card__cover" onClick={() => openPlace(place)}>
        <span>{place.emoji}</span>
      </button>
      <div className="place-card__body">
        <button className="place-card__title" onClick={() => openPlace(place)}>
          {pName(place)}
        </button>
        <p className="muted small">{pCity(place)}{pDesc(place) ? ` · ${pDesc(place)}` : ''}</p>
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
  const { selectedPlace: p, setSelectedPlace, placeStatus, setPlaceStatus, setModal, memories, publicMemories, requireLogin, trips, returnView, setReturnView, setView } = useApp();
  const [tripId, setTripId] = useState('');
  const { t } = useI18n();
  const st = placeStatus[p.id];
  const mine = memories.filter((m) => m.place?.id === p.id);
  const pub = publicMemories.filter((m) => m.place?.id === p.id && !mine.some((x) => x.id === m.id));
  return (
    <div className="stack">
      <div className="back-row">
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
      </div>
      <div className="place-hero">
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
          <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
            <option value="">{t('common.noneOption')}</option>
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
          👣 {st === 'visited' ? t('place.visited') : t('place.markVisited')}
        </button>
        <button className={`btn ${st === 'wishlist' ? 'btn--coral' : 'btn--outline'}`} onClick={() => setPlaceStatus(p, 'wishlist')}>
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
          {m.photos?.[0] ? <img src={m.photos[0]} alt={m.caption || m.place?.name} loading="lazy" /> : <span className="mgrid__noimg">📝</span>}
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
