import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Modal, Avatar, formatDate, Loader, LoadingImage, OccasionField, DirectionsIcon } from './ui';
import { appleMapsUrl, googleMapsUrl, searchNominatim, normalize, parseGoogleMapsInput, reverseGeocode, isGoogleMapsLink } from '../lib/geo';
import { countryName, flagOf } from '../lib/countries';
import { ALL_FAMOUS } from '../data/places';
import { firebaseEnabled } from '../lib/firebase';
// Studio ảnh / video và trang trợ giúp: chỉ tải khi mở
const ShareStudio = lazy(() => import('./ShareStudio'));
const RecapStudio = lazy(() => import('./RecapStudio'));
const FaqModal = lazy(() => import('./HelpModals').then((m) => ({ default: m.FaqModal })));
const SponsorModal = lazy(() => import('./HelpModals').then((m) => ({ default: m.SponsorModal })));
import DateInput from './DateInput';
import { useI18n } from '../i18n';
import { pName, pCity, getLang } from '../lib/lang';
import { getNetQuality } from '../lib/network';

export default function Modals() {
  const { modal, setModal } = useApp();
  if (!modal) return null;
  const close = () => setModal(null);
  return (
    <Suspense
      fallback={
        <Modal onClose={close} className="modal--sm">
          <Loader />
        </Modal>
      }
    >
      {renderModal(modal, close)}
    </Suspense>
  );
}

function renderModal(modal, close) {
  switch (modal.type) {
    case 'login':
      return <LoginModal reason={modal.reason} onClose={close} />;
    case 'checkin':
      return <CheckinModal place={modal.place} tripId={modal.tripId} memory={modal.memory} legacy={modal.legacy} preserve={modal.preserve} onClose={close} />;
    case 'profile':
      return <ProfileModal onClose={close} />;
    case 'directions':
      return <DirectionsModal place={modal.place} onClose={close} />;
    case 'memory':
      return <MemoryForm place={modal.place} tripId={modal.tripId} onClose={close} />;
    case 'viewMemory':
      return <MemoryViewer memory={modal.memory} onClose={close} />;
    case 'share':
      return <ShareStudio memory={modal.memory} onClose={close} />;
    case 'report':
      return <ReportModal memory={modal.memory} onClose={close} />;
    case 'recap':
      return <RecapStudio mode={modal.mode || 'year'} trip={modal.trip} stops={modal.stops} onClose={close} />;
    case 'confirmRemove':
      return <ConfirmRemoveModal place={modal.place} onClose={close} />;
    case 'visitDate':
      return <VisitDateModal place={modal.place} tripId={modal.tripId} onClose={close} />;
    case 'faq':
      return <FaqModal onClose={close} />;
    case 'sponsor':
      return <SponsorModal onClose={close} />;
    case 'addLink':
      return <AddLinkModal text={modal.text} onClose={close} />;
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

/** Mở rộng link rút gọn (maps.app.goo.gl, goo.gl/maps) thành link Google Maps đầy đủ */
async function expandShortLink(url) {
  const withTimeout = (ms) => {
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), ms);
    return ctl.signal;
  };
  // 1) r.jina.ai: tải trang hộ và trả về "Final URL" sau khi chuyển hướng
  try {
    const txt = await fetch(`https://r.jina.ai/${url}`, { signal: withTimeout(15000) }).then((r) => (r.ok ? r.text() : ''));
    const fin = txt.match(/Final URL:\s*(\S+)/)?.[1] || txt.match(/https:\/\/www\.google\.[a-z.]+\/maps\/[^\s)"']+/)?.[0];
    if (fin && /\/maps/.test(fin)) return fin;
  } catch {
    /* thử cách khác */
  }
  // 2) unshorten.me (có thể trả về trang đồng ý cookie, link thật nằm trong tham số continue)
  try {
    const r = await fetch(`https://unshorten.me/json/${url}`, { signal: withTimeout(10000) }).then((x) => x.json());
    let fin = r?.resolved_url || '';
    const cont = fin.match(/[?&]continue=([^&]+)/)?.[1];
    if (cont) fin = decodeURIComponent(cont);
    if (/\/maps/.test(fin)) return fin;
  } catch {
    /* bỏ qua */
  }
  return '';
}

/** Đọc link Google Maps → địa điểm { id, name, city, country, lat, lng }; null nếu link không hợp lệ / không tìm thấy */
export async function resolveGoogleMaps(text) {
  let parsed = parseGoogleMapsInput(text);
  const url = text.match(/https?:\/\/\S+/)?.[0] || '';
  const isShort = /maps\.app\.goo\.gl|goo\.gl\/maps/.test(url);
  if (url && !/google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps/.test(url)) return null; // không phải link Google Maps
  if (isShort) {
    const fin = await expandShortLink(url);
    if (!fin) return null;
    parsed = parseGoogleMapsInput(fin);
    // Link rút gọn phải trỏ tới 1 địa điểm cụ thể (có tên hoặc toạ độ chính xác), không chỉ là một vùng bản đồ
    if (!parsed.name && !/!3d-?\d/.test(decodeURIComponent(fin))) return null;
  }
  const lang = getLang();
  if (parsed.lat != null) {
    const geo = await reverseGeocode(parsed.lat, parsed.lng, lang);
    return {
      id: `gm-${parsed.lat.toFixed(5)}_${parsed.lng.toFixed(5)}`, name: parsed.name || geo.name, city: geo.city, country: geo.country,
      lat: parsed.lat, lng: parsed.lng, emoji: '📍', custom: true,
    };
  }
  if (parsed.query) {
    const [hit] = await searchNominatim(parsed.query, undefined, lang);
    if (hit) return { ...hit, id: `gm-${hit.lat.toFixed(5)}_${hit.lng.toFixed(5)}`, name: parsed.name || hit.name, custom: true };
  }
  return null;
}

function GoogleLinkInput({ initial = '', onFound, autoRun }) {
  const { t } = useI18n();
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (value = text) => {
    if (!value.trim()) return;
    setBusy(true);
    setError('');
    const place = await resolveGoogleMaps(value);
    setBusy(false);
    if (place) onFound(place);
    else setError(t('link.notFound'));
  };
  useEffect(() => {
    if (autoRun && initial) run(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stack link-input">
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('link.placeholder')} />
      <small className="muted">{t('link.howto')}</small>
      {error && <p className="small warn">{error}</p>}
      {busy ? (
        <Loader text={t('link.finding')} />
      ) : (
        <button type="button" className="btn btn--dark" disabled={!text.trim()} onClick={() => run()}>
          {t('link.find')}
        </button>
      )}
    </div>
  );
}

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const REPORT_REASONS = ['inappropriate', 'spam', 'wrongPlace', 'copyright', 'privacy', 'other'];

/** Báo cáo kỉ niệm công khai không phù hợp — gửi cho quản trị viên */
function ReportModal({ memory, onClose }) {
  const { t } = useI18n();
  const { reportMemory, notify } = useApp();
  const [reason, setReason] = useState('inappropriate');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={`🚩 ${t('report.title')}`} onClose={onClose} className="modal--sm">
      <div className="stack">
        <p className="muted small">{t('report.text')}</p>
        <div className="report-reasons">
          {REPORT_REASONS.map((r) => (
            <label key={r} className={`report-reason ${reason === r ? 'on' : ''}`}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
              {t('admin.reason.' + r)}
            </label>
          ))}
        </div>
        {busy ? (
          <Loader size="sm" />
        ) : (
          <div className="grid-2">
            <button className="btn btn--soft" onClick={onClose}>
              {t('pick.cancel')}
            </button>
            <button
              className="btn btn--danger"
              onClick={async () => {
                setBusy(true);
                try {
                  await reportMemory(memory, reason);
                  notify(t('report.sent'));
                  onClose();
                } catch (e) {
                  notify(t('admin.error', { msg: e.message }), 'error');
                  setBusy(false);
                }
              }}
            >
              🚩 {t('report.send')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Xác nhận xoá địa điểm khỏi danh sách Đã đến / Muốn đi */
function ConfirmRemoveModal({ place, onClose }) {
  const { t } = useI18n();
  const { confirmRemovePlace, placeStatus } = useApp();
  const [busy, setBusy] = useState(false);
  const status = placeStatus[place.id] || place.status;
  return (
    <Modal title={t('remove.title')} onClose={onClose} className="modal--sm">
      <div className="stack">
        <p>
          {t(status === 'wishlist' ? 'remove.textWish' : 'remove.textVisited', { name: pName(place) })}
        </p>
        <p className="small muted">{t('remove.note')}</p>
        {busy ? (
          <Loader size="sm" />
        ) : (
          <div className="grid-2">
            <button className="btn btn--soft" onClick={onClose}>
              {t('pick.cancel')}
            </button>
            <button
              className="btn btn--danger"
              onClick={async () => {
                setBusy(true);
                await confirmRemovePlace(place);
                onClose();
              }}
            >
              🗑️ {t('remove.confirm')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Hỏi ngày đã đến khi đánh dấu "đã tới" */
function VisitDateModal({ place, tripId, onClose }) {
  const { t } = useI18n();
  const { saveVisited, notify, placeById } = useApp();
  const [date, setDate] = useState(placeById[place.id]?.visitedAt || today());
  const [occasion, setOccasion] = useState(placeById[place.id]?.occasion || '');
  const [busy, setBusy] = useState(false);
  const save = async (value) => {
    setBusy(true);
    await saveVisited(place, { visitedAt: value, occasion: occasion.trim() }, tripId);
    notify(t('toast.visited', { name: pName(place) }));
    onClose();
  };
  return (
    <Modal title={t('visit.title')} onClose={onClose} className="modal--sm">
      <div className="stack">
        <p className="muted">{t('visit.question', { name: pName(place) })}</p>
        <label className="field">
          <span>{t('visit.label')}</span>
          <DateInput value={date} max={today()} onChange={setDate} ariaLabel={t('visit.label')} />
        </label>
        <OccasionField value={occasion} onChange={setOccasion} />
        {busy ? (
          <Loader size="sm" />
        ) : (
          <div className="grid-2">
            <button className="btn btn--soft" onClick={() => save(null)}>
              {t('visit.skip')}
            </button>
            <button className="btn btn--primary" onClick={() => save(date || null)}>
              👣 {t('visit.save')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AddLinkModal({ text, onClose }) {
  const { t } = useI18n();
  const { placeStatus, setPlaceStatus, setModal, openPlace, requireLogin } = useApp();
  const [place, setPlace] = useState(null);
  const st = place && placeStatus[place.id];
  return (
    <Modal title={t('link.title')} onClose={onClose}>
      <div className="stack">
        {!place ? (
          <>
            <p className="small">{t('link.label')}</p>
            <GoogleLinkInput initial={text || ''} autoRun={!!text} onFound={setPlace} />
          </>
        ) : (
          <>
            <div className="picked">
              <span>📍</span>
              <span>
                <input className="picked__name" value={place.name} onChange={(e) => setPlace({ ...place, name: e.target.value })} placeholder={t('link.namePlaceholder')} />
                <small>
                  {[place.city, countryName(place.country)].filter(Boolean).join(', ')} {flagOf(place.country)}
                </small>
              </span>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPlace(null)}>
                {t('mem.change')}
              </button>
            </div>
            <div className="grid-2">
              <button className={`btn ${st === 'wishlist' ? 'btn--coral' : 'btn--outline'}`} onClick={() => setPlaceStatus(place, 'wishlist')}>
                {st === 'wishlist' ? t('place.inWishlist') : t('place.addWishlist')}
              </button>
              <button className={`btn ${st === 'visited' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPlaceStatus(place, 'visited')}>
                👣 {st === 'visited' ? t('place.visited') : t('place.markVisited')}
              </button>
              <button className="btn btn--soft" onClick={() => { onClose(); openPlace(place); }}>
                {t('common.viewOnMap')}
              </button>
              <button className="btn btn--primary" onClick={() => requireLogin(() => setModal({ type: 'memory', place }), t('reason.saveMemory'))}>
                {t('place.addMemory')}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function PlacePicker({ value, onChange, onPickOnMap }) {
  const { memories, places } = useApp();
  const [linkMode, setLinkMode] = useState(false);
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
  if (linkMode)
    return (
      <div className="picker">
        <GoogleLinkInput onFound={(p) => { setLinkMode(false); onChange(p); }} />
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => setLinkMode(false)}>
          ← {t('common.back')}
        </button>
      </div>
    );
  return (
    <div className="picker">
      <input
        value={q}
        onChange={(e) => (isGoogleMapsLink(e.target.value) ? setLinkMode(true) : setQ(e.target.value))}
        placeholder={t('mem.pickPlaceholder')}
        autoFocus
      />
      <div className="row wrap picker__alt">
        <button type="button" className="btn btn--sm btn--soft" onClick={onPickOnMap}>
          {t('pick.short')}
        </button>
        <button type="button" className="btn btn--sm btn--soft" onClick={() => setLinkMode(true)}>
          {t('link.open')}
        </button>
      </div>
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
  const { api, user, trips, notify, setModal, startPicking } = useApp();
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
          <PlacePicker
            value={place}
            onChange={setPlace}
            onPickOnMap={() => startPicking('memory')}
          />
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
            <DateInput value={date} onChange={setDate} ariaLabel={t('mem.date')} />
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
        {busy ? (
          <Loader text={t('mem.uploading')} />
        ) : (
          <button className="btn btn--primary btn--block">{t('mem.save')}</button>
        )}
      </form>
    </Modal>
  );
}

function MemoryViewer({ memory: m, onClose }) {
  const { user, api, setModal, openPlace, setPlaceStatus, notify, placeStatus, requireLogin } = useApp();
  const st = placeStatus[m.place?.id];
  const { t } = useI18n();
  const [i, setI] = useState(0);
  // Ảnh tải dần: hiện ảnh thu nhỏ ngay, rồi tải bản vừa / gốc tuỳ tốc độ mạng
  const [quality, setQuality] = useState(() => getNetQuality());
  const [better, setBetter] = useState(null); // { q, photos }
  const [loadingBetter, setLoadingBetter] = useState(false);
  useEffect(() => {
    let alive = true;
    if (quality === 'low') return setBetter(null);
    setLoadingBetter(true);
    api.getPhotos(m, quality).then((p) => {
      if (!alive) return;
      setBetter({ q: quality, photos: p });
      setLoadingBetter(false);
    });
    return () => {
      alive = false;
    };
  }, [m, api, quality]);
  const full = better?.q === 'high' ? better.photos : null;
  const mine = user && m.uid === user.uid;
  const photos = better?.photos?.length ? better.photos : m.photos || [];
  const hasMore = (m.photoCount || m.memoryId) && quality !== 'high';
  return (
    <Modal title={pName(m.place) || t('mem.title')} onClose={onClose} wide>
      <div className="viewer">
        {photos.length > 0 && (
          <div className="viewer__media">
            <LoadingImage key={photos[i]} src={photos[i]} alt={m.caption} loaderSize="md" />
            {hasMore && (
              <button className="viewer__hq" onClick={() => setQuality('high')} disabled={loadingBetter}>
                {loadingBetter ? `⏳ ${t('img.loading')}` : `🔍 ${t(quality === 'low' ? 'img.loadClearer' : 'img.loadOriginal')}`}
              </button>
            )}
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
            <button className="btn btn--sm btn--soft" onClick={() => setModal({ type: 'directions', place: m.place })}><DirectionsIcon /> {t('common.directions')}</button>
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
            {!mine && m.visibility === 'public' && m.uid !== 'sample' && m.uid !== 'trip-stop' && (
              <button className="btn btn--sm btn--ghost" onClick={() => requireLogin(() => setModal({ type: 'report', memory: m }), t('report.login'))}>
                🚩 {t('report.button')}
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

/** Đổi tên hiển thị thay cho tên lấy từ Google */
/** Cắt ảnh vuông ở giữa, thu về 256px, nén JPEG/WebP (≈ 20 KB) */
async function makeAvatar(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    let q = 0.85;
    let out = c.toDataURL('image/jpeg', q);
    while (out.length > 100000 && q > 0.4) out = c.toDataURL('image/jpeg', (q -= 0.1));
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProfileModal({ onClose }) {
  const { t } = useI18n();
  const { user, api, notify } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const photoChanged = (photo || '') !== (user.photo || '');
  const nameChanged = name.trim() !== user.name;
  const save = async ({ nameValue = name, photoValue = photo, close = true } = {}) => {
    setBusy(true);
    try {
      if (nameValue.trim() !== user.name || nameValue === '') await api.setDisplayName(user, nameValue);
      if ((photoValue || '') !== (user.photo || '')) await api.setProfilePhoto(user, photoValue && photoValue !== user.googlePhoto ? photoValue : null);
      notify(t('profile.saved'));
      if (close) onClose();
      else setBusy(false);
    } catch (e) {
      notify(e.message, 'error');
      setBusy(false);
    }
  };
  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return notify(t('profile.photoBad'), 'error');
    try {
      setPhoto(await makeAvatar(f));
    } catch {
      notify(t('profile.photoBad'), 'error');
    }
  };
  return (
    <Modal title={`✏️ ${t('profile.title')}`} onClose={onClose} className="modal--sm">
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) save();
        }}
      >
        <div className="avatar-edit">
          <label className="avatar-edit__pic" title={t('profile.photoChange')}>
            <Avatar name={name || user.name} photo={photo} size={88} />
            <span className="avatar-edit__cam">📷</span>
            <input type="file" accept="image/*" onChange={pick} hidden />
          </label>
          <div className="stack-sm">
            <b>{name.trim() || user.googleName}</b>
            <div className="small muted">{user.email}</div>
            <div className="row wrap">
              <label className="btn btn--sm btn--soft">
                📷 {t('profile.photoChange')}
                <input type="file" accept="image/*" onChange={pick} hidden />
              </label>
              {photo && photo !== user.googlePhoto && (
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPhoto(user.googlePhoto || '')}>
                  ↩️ {user.googlePhoto ? t('profile.photoGoogle') : t('profile.photoRemove')}
                </button>
              )}
            </div>
          </div>
        </div>
        <label className="field">
          <span>{t('profile.nameLabel')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={user.googleName} />
          <small className="muted">{t('profile.help')}</small>
        </label>
        <div className="row wrap">
          <button className="btn btn--primary" disabled={busy || !name.trim() || (!nameChanged && !photoChanged)}>
            💾 {t('profile.save')}
          </button>
          {user.name !== user.googleName && (
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => save({ nameValue: '', photoValue: photo })}>
              ↩️ {t('profile.useGoogle', { name: user.googleName })}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

/**
 * Check-in tại 1 địa điểm (đi nhiều lần được): ngày, dịp, thông tin gợi nhớ, ảnh (tuỳ chọn), chuyến đi.
 * memory: sửa 1 lần check-in đã có; legacy: lần đến cũ chỉ có ngày / dịp → lưu thành lần check-in đầy đủ.
 */
function CheckinModal({ place, tripId: initialTrip, memory, legacy, preserve, onClose }) {
  const { api, user, trips, notify, placeById, memories } = useApp();
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(memory?.date || legacy?.visitedAt || today);
  const [occasion, setOccasion] = useState(memory?.occasion || legacy?.occasion || '');
  const [caption, setCaption] = useState(memory?.caption || '');
  const [files, setFiles] = useState([]);
  const [tripId, setTripId] = useState(memory?.tripId || initialTrip || '');
  const [visibility, setVisibility] = useState(memory?.visibility || 'private');
  const [busy, setBusy] = useState(false);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  const hasPhotos = files.length > 0 || (memory?.photos?.length || 0) > 0;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Ngày đến gần nhất của địa điểm = lần check-in muộn nhất
      // Ngày đến = lần check-in muộn nhất (chỉ tính các lần check-in; lần đến cũ chỉ tính khi chưa có check-in nào)
      const others = memories.filter((m) => m.place?.id === place.id && m.id !== memory?.id).map((m) => m.date);
      const dates = [...others, ...(memories.some((m) => m.place?.id === place.id) ? [] : [placeById[place.id]?.visitedAt]), date].filter(Boolean).sort();
      const latest = dates[dates.length - 1] || date;
      if (memory) {
        await api.updateMemory(memory.id, { date, occasion, caption: caption.trim(), tripId: tripId || null, visibility: hasPhotos ? visibility : 'private' });
        await api.setPlace(user, { ...(placeById[place.id] || place) }, 'visited', placeById[place.id]?.tripId || tripId || null, latest, placeById[place.id]?.occasion || occasion);
      } else {
        if (preserve && !legacy && preserve.visitedAt !== date)
          await api.addMemory(user, { place, caption: '', date: preserve.visitedAt || '', occasion: preserve.occasion || '', visibility: 'private', tripId: '', visitedAt: latest }, []);
        await api.addMemory(user, { place, caption: caption.trim(), date, occasion, visibility, tripId, visitedAt: latest }, files);
      }
      notify(t('checkin.saved'));
      onClose();
    } catch (err) {
      notify(t('mem.saveFailed', { msg: err.message }), 'error');
      setBusy(false);
    }
  };
  return (
    <Modal title={`👣 ${memory || legacy ? t('checkin.editTitle') : t('checkin.title')} · ${pName(place)}`} onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        <div className="grid-2">
          <label className="field">
            <span>📅 {t('checkin.date')}</span>
            <DateInput value={date} onChange={setDate} max={today} ariaLabel={t('checkin.date')} />
          </label>
          <label className="field">
            <span>🧳 {t('mem.trip')}</span>
            <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="">{t('common.noneOption')}</option>
              {trips.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.emoji} {tr.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <OccasionField value={occasion} onChange={setOccasion} />
        <label className="field">
          <span>📝 {t('checkin.note')}</span>
          <textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t('checkin.notePh')} maxLength={500} />
        </label>
        <div className="field">
          <span>📸 {t('checkin.photos')}</span>
          <div className="uploader">
            {(memory?.photos || []).map((src) => (
              <div className="uploader__thumb" key={src}>
                <img src={src} alt="" />
              </div>
            ))}
            {previews.map((src, i) => (
              <div className="uploader__thumb" key={src}>
                <img src={src} alt="" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={t('mem.removePhoto')}>
                  ✕
                </button>
              </div>
            ))}
            {!memory && files.length < 10 && (
              <label className="uploader__add">
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...files, ...e.target.files].slice(0, 10))} />
                <span>＋</span>
                <small>{t('mem.addPhoto')}</small>
              </label>
            )}
          </div>
          {memory && <small className="muted">{t('checkin.photosLocked')}</small>}
        </div>
        {hasPhotos && (
          <div className="field">
            <span>{t('checkin.visibility')}</span>
            <div className="segmented segmented--sm">
              <button type="button" className={visibility === 'private' ? 'on' : ''} onClick={() => setVisibility('private')}>
                🔒 {t('checkin.private')}
              </button>
              <button type="button" className={visibility === 'public' ? 'on' : ''} onClick={() => setVisibility('public')}>
                🌍 {t('checkin.public')}
              </button>
            </div>
          </div>
        )}
        <div className="row wrap">
          <button className="btn btn--primary" disabled={busy || !date}>
            {busy ? `⏳ ${t('common.loading')}` : `💾 ${t('checkin.save')}`}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            {t('pick.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
