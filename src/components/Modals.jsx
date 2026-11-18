import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Modal, Avatar, formatDate } from './ui';
import { appleMapsUrl, googleMapsUrl, searchNominatim, normalize } from '../lib/geo';
import { countryName, flagOf } from '../lib/countries';
import { ALL_FAMOUS } from '../data/places';
import { firebaseEnabled } from '../lib/firebase';
import ShareStudio from './ShareStudio';
import { useI18n } from '../i18n';
import { pName, pCity } from '../lib/lang';

export default function Modals() {
  const { modal, setModal } = useApp();
  if (!modal) return null;
  const close = () => setModal(null);
  switch (modal.type) {
    case 'login':
      return <LoginModal reason={modal.reason} onClose={close} />;
    case 'directions':
      return <DirectionsModal place={modal.place} onClose={close} />;
    case 'memory':
      return <MemoryForm place={modal.place} tripId={modal.tripId} onClose={close} />;
    case 'viewMemory':
      return <MemoryViewer memory={modal.memory} onClose={close} />;
    case 'share':
      return <ShareStudio memory={modal.memory} onClose={close} />;
    default:
      return null;
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function LoginModal({ reason, onClose }) {
  const { api, notify } = useApp();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={t('auth.login')} onClose={onClose} className="modal--sm">
      <div className="login">
        <div className="login__art">🗺️👣💛</div>
        <h3 className="h2">{reason || t('auth.defaultReason')}</h3>
        <p className="muted">{t('auth.pitch')}</p>
        <button
          className="btn btn--google btn--block"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api.signIn();
              onClose();
            } catch (e) {
              notify(t('auth.failed', { msg: e.message }), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          <GoogleIcon /> {busy ? t('auth.opening') : t('auth.continueGoogle')}
        </button>
        {!firebaseEnabled && <p className="small muted">{t('auth.demoNote')}</p>}
      </div>
    </Modal>
  );
}

function DirectionsModal({ place, onClose }) {
  const { t } = useI18n();
  const isApple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const options = [
    { key: 'apple', label: 'Apple Maps', icon: '🍎', url: appleMapsUrl(place) },
    { key: 'google', label: 'Google Maps', icon: '🗺️', url: googleMapsUrl(place) },
  ];
  if (!isApple) options.reverse();
  return (
    <Modal title={t('dir.title')} onClose={onClose} className="modal--sm">
      <p className="muted">
        {t('dir.to')} <b>{pName(place)}</b>
        {pCity(place) ? `, ${pCity(place)}` : ''}
      </p>
      <div className="stack">
        {options.map((o) => (
          <a key={o.key} className="map-choice" href={o.url} target="_blank" rel="noreferrer" onClick={onClose}>
            <span className="map-choice__icon">{o.icon}</span>
            <span>
              <b>{o.label}</b>
              <small>{t('dir.hint')}</small>
            </span>
            <span>→</span>
          </a>
        ))}
      </div>
    </Modal>
  );
}

function PlacePicker({ value, onChange }) {
  const { memories, places } = useApp();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [osm, setOsm] = useState([]);
  const local = useMemo(() => {
    const n = normalize(q);
    const seen = new Set();
    return [...places, ...memories.map((m) => m.place), ...ALL_FAMOUS]
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
      .filter((p) => !n || normalize(`${p.name} ${pName(p)} ${p.city} ${pCity(p)} ${countryName(p.country)}`).includes(n))
      .slice(0, n ? 6 : 4);
  }, [q, places, memories]);
  useEffect(() => {
    if (q.length < 3) return setOsm([]);
    const c = new AbortController();
    const t = setTimeout(() => searchNominatim(q, c.signal).then(setOsm).catch(() => {}), 450);
    return () => {
      clearTimeout(t);
      c.abort();
    };
  }, [q]);
  if (value)
    return (
      <div className="picked">
        <span>{value.emoji || '📍'}</span>
        <span>
          <b>{pName(value)}</b>
          <small>
            {[pCity(value), countryName(value.country)].filter(Boolean).join(', ')} {flagOf(value.country)}
          </small>
        </span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => onChange(null)}>
          {t('mem.change')}
        </button>
      </div>
    );
  return (
    <div className="picker">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mem.pickPlaceholder')} autoFocus />
      <div className="picker__list">
        {[...local, ...osm].map((p) => (
          <button type="button" key={p.id} className="search__item" onClick={() => onChange(p)}>
            <span className="search__emoji">{p.emoji || flagOf(p.country)}</span>
            <span>
              {pName(p)}
              <small>{[pCity(p), countryName(p.country)].filter(Boolean).join(', ')}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoryForm({ place: initialPlace, tripId: initialTrip, onClose }) {
  const { api, user, trips, notify, setModal } = useApp();
  const { t } = useI18n();
  const [place, setPlace] = useState(initialPlace || null);
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [visibility, setVisibility] = useState('private');
  const [tripId, setTripId] = useState(initialTrip || '');
  const [busy, setBusy] = useState(false);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const submit = async (e) => {
    e.preventDefault();
    if (!place) return notify(t('mem.needPlace'), 'error');
    if (!files.length) return notify(t('mem.needPhoto'), 'error');
    setBusy(true);
    try {
      const mem = await api.addMemory(user, { place, caption, date, visibility, tripId }, files);
      notify(t('mem.saved'));
      setModal({ type: 'share', memory: mem });
    } catch (err) {
      notify(t('mem.saveFailed', { msg: err.message }), 'error');
      setBusy(false);
    }
  };

  return (
    <Modal title={t('mem.add')} onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        <label className="field">
          <span>{t('mem.place')}</span>
          <PlacePicker value={place} onChange={setPlace} />
        </label>
        <div className="field">
          <span>{t('mem.photos', { n: files.length })}</span>
          <div className="uploader">
            {previews.map((src, i) => (
              <div className="uploader__thumb" key={src}>
                <img src={src} alt="" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={t('mem.removePhoto')}>
                  ✕
                </button>
              </div>
            ))}
            {files.length < 10 && (
              <label className="uploader__add">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFiles([...files, ...e.target.files].slice(0, 10))}
                />
                <span>＋</span>
                <small>{t('mem.addPhoto')}</small>
              </label>
            )}
          </div>
        </div>
        <label className="field">
          <span>{t('mem.note')}</span>
          <textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t('mem.notePlaceholder')} maxLength={500} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>{t('mem.date')}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>{t('mem.trip')}</span>
            <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="">{t('common.noneOption')}</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="segmented" role="radiogroup">
          <button type="button" className={visibility === 'private' ? 'on' : ''} onClick={() => setVisibility('private')}>
            {t('mem.private')}
          </button>
          <button type="button" className={visibility === 'public' ? 'on' : ''} onClick={() => setVisibility('public')}>
            {t('mem.public')}
          </button>
        </div>
        <p className="small muted">
          {visibility === 'public' ? t('mem.publicHint') : t('mem.privateHint')}
        </p>
        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? t('mem.uploading') : t('mem.save')}
        </button>
      </form>
    </Modal>
  );
}

function MemoryViewer({ memory: m, onClose }) {
  const { user, api, setModal, openPlace, setPlaceStatus, notify, placeStatus } = useApp();
  const st = placeStatus[m.place?.id];
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [full, setFull] = useState(null);
  useEffect(() => {
    let alive = true;
    api.getFullPhotos(m).then((p) => alive && setFull(p));
    return () => {
      alive = false;
    };
  }, [m, api]);
  const mine = user && m.uid === user.uid;
  const photos = full || m.photos || [];
  return (
    <Modal title={pName(m.place) || t('mem.title')} onClose={onClose} wide>
      <div className="viewer">
        {photos.length > 0 && (
          <div className="viewer__media">
            <img src={photos[i]} alt={m.caption} />
            {photos.length > 1 && (
              <>
                <button className="viewer__nav viewer__nav--l" onClick={() => setI((i - 1 + photos.length) % photos.length)} aria-label={t('mem.prev')}>‹</button>
                <button className="viewer__nav viewer__nav--r" onClick={() => setI((i + 1) % photos.length)} aria-label={t('mem.next')}>›</button>
                <div className="viewer__dots">
                  {photos.map((_, j) => (
                    <span key={j} className={j === i ? 'on' : ''} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="viewer__info stack">
          <div className="row">
            <Avatar name={m.authorName} photo={m.authorPhoto} />
            <div>
              <b>{m.authorName}</b>
              <div className="small muted">
                {flagOf(m.place?.country)} {[pCity(m.place), countryName(m.place?.country)].filter(Boolean).join(', ')}
                {m.date ? ` · ${formatDate(m.date)}` : ''}
              </div>
            </div>
          </div>
          {m.caption && <p className="viewer__caption">{m.caption}</p>}
          <div className="row wrap">
            <button className="btn btn--sm btn--soft" onClick={() => { onClose(); openPlace(m.place); }}>{t('mem.onMap')}</button>
            {st === 'visited' ? (
              <span className="status-pill status-pill--visited">{t('mem.alreadyVisited')}</span>
            ) : (
              <button
                className={`btn btn--sm ${st === 'wishlist' ? 'btn--coral' : 'btn--soft'}`}
                onClick={() => setPlaceStatus(m.place, 'wishlist')}
                aria-pressed={st === 'wishlist'}
                title={st === 'wishlist' ? t('mem.wishRemove') : ''}
              >
                {st === 'wishlist' ? t('mem.wishAdded') : t('mem.wish')}
              </button>
            )}
            <button className="btn btn--sm btn--soft" onClick={() => setModal({ type: 'directions', place: m.place })}>{t('common.directions')}</button>
            {mine && <button className="btn btn--sm btn--primary" onClick={() => setModal({ type: 'share', memory: full ? { ...m, fullPhotos: full } : m })}>{t('mem.share')}</button>}
            {mine && (
              <button
                className="btn btn--sm btn--soft"
                onClick={async () => {
                  const v = m.visibility === 'public' ? 'private' : 'public';
                  await api.updateMemory(m.id, { visibility: v });
                  notify(v === 'public' ? t('mem.nowPublic') : t('mem.nowPrivate'));
                  onClose();
                }}
              >
                {m.visibility === 'public' ? t('mem.makePrivate') : t('mem.makePublic')}
              </button>
            )}
            {mine && (
              <button
                className="btn btn--sm btn--ghost danger"
                onClick={async () => {
                  if (!confirm(t('mem.confirmDelete'))) return;
                  await api.deleteMemory(m);
                  notify(t('mem.deleted'));
                  onClose();
                }}
              >
                {t('mem.delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
