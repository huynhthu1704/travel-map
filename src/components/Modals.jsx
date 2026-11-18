import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Modal, Avatar, formatDate } from './ui';
import { appleMapsUrl, googleMapsUrl, searchNominatim, normalize } from '../lib/geo';
import { countryName, flagOf } from '../lib/countries';
import { ALL_FAMOUS } from '../data/places';
import { firebaseEnabled } from '../lib/firebase';
import ShareStudio from './ShareStudio';

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
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Đăng nhập" onClose={onClose} className="modal--sm">
      <div className="login">
        <div className="login__art">🗺️👣💛</div>
        <h3 className="h2">{reason || 'Lưu giữ mọi chuyến đi'}</h3>
        <p className="muted">Đánh dấu nơi đã đặt chân, lưu ảnh kỉ niệm và tạo chuyến đi chung với bạn bè.</p>
        <button
          className="btn btn--google btn--block"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api.signIn();
              onClose();
            } catch (e) {
              notify('Đăng nhập thất bại: ' + e.message, 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          <GoogleIcon /> {busy ? 'Đang mở Google…' : 'Tiếp tục với Google'}
        </button>
        {!firebaseEnabled && <p className="small muted">Chế độ demo: chưa cấu hình Firebase nên dữ liệu chỉ lưu trên trình duyệt này.</p>}
      </div>
    </Modal>
  );
}

function DirectionsModal({ place, onClose }) {
  const isApple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const options = [
    { key: 'apple', label: 'Apple Maps', icon: '🍎', url: appleMapsUrl(place) },
    { key: 'google', label: 'Google Maps', icon: '🗺️', url: googleMapsUrl(place) },
  ];
  if (!isApple) options.reverse();
  return (
    <Modal title="Mở chỉ đường bằng…" onClose={onClose} className="modal--sm">
      <p className="muted">
        Đến <b>{place.name}</b>
        {place.city ? `, ${place.city}` : ''}
      </p>
      <div className="stack">
        {options.map((o) => (
          <a key={o.key} className="map-choice" href={o.url} target="_blank" rel="noreferrer" onClick={onClose}>
            <span className="map-choice__icon">{o.icon}</span>
            <span>
              <b>{o.label}</b>
              <small>Mở trong ứng dụng hoặc trình duyệt</small>
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
  const [q, setQ] = useState('');
  const [osm, setOsm] = useState([]);
  const local = useMemo(() => {
    const n = normalize(q);
    const seen = new Set();
    return [...places, ...memories.map((m) => m.place), ...ALL_FAMOUS]
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
      .filter((p) => !n || normalize(`${p.name} ${p.city} ${countryName(p.country)}`).includes(n))
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
          <b>{value.name}</b>
          <small>
            {[value.city, countryName(value.country)].filter(Boolean).join(', ')} {flagOf(value.country)}
          </small>
        </span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => onChange(null)}>
          Đổi
        </button>
      </div>
    );
  return (
    <div className="picker">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm địa điểm: Hội An, Kyoto, quán cà phê…" autoFocus />
      <div className="picker__list">
        {[...local, ...osm].map((p) => (
          <button type="button" key={p.id} className="search__item" onClick={() => onChange(p)}>
            <span className="search__emoji">{p.emoji || flagOf(p.country)}</span>
            <span>
              {p.name}
              <small>{[p.city, countryName(p.country)].filter(Boolean).join(', ')}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoryForm({ place: initialPlace, tripId: initialTrip, onClose }) {
  const { api, user, trips, notify, setModal } = useApp();
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
    if (!place) return notify('Hãy chọn địa điểm', 'error');
    if (!files.length) return notify('Hãy chọn ít nhất 1 ảnh', 'error');
    setBusy(true);
    try {
      const mem = await api.addMemory(user, { place, caption, date, visibility, tripId }, files);
      notify('Đã lưu kỉ niệm 📸');
      setModal({ type: 'share', memory: mem });
    } catch (err) {
      notify('Không lưu được: ' + err.message, 'error');
      setBusy(false);
    }
  };

  return (
    <Modal title="Thêm kỉ niệm" onClose={onClose} wide>
      <form className="stack" onSubmit={submit}>
        <label className="field">
          <span>Địa điểm</span>
          <PlacePicker value={place} onChange={setPlace} />
        </label>
        <div className="field">
          <span>Ảnh ({files.length}/10)</span>
          <div className="uploader">
            {previews.map((src, i) => (
              <div className="uploader__thumb" key={src}>
                <img src={src} alt="" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Xoá ảnh">
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
                <small>Thêm ảnh</small>
              </label>
            )}
          </div>
        </div>
        <label className="field">
          <span>Ghi chú</span>
          <textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Hôm đó trời đẹp, tụi mình…" maxLength={500} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Ngày</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Chuyến đi</span>
            <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="">— Không —</option>
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
            🔒 Riêng tư
          </button>
          <button type="button" className={visibility === 'public' ? 'on' : ''} onClick={() => setVisibility('public')}>
            🌍 Công khai
          </button>
        </div>
        <p className="small muted">
          {visibility === 'public' ? 'Mọi người có thể xem để tham khảo trước khi đi du lịch.' : 'Chỉ bạn (và thành viên chuyến đi nếu có) nhìn thấy.'}
        </p>
        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Đang tải ảnh lên…' : 'Lưu kỉ niệm'}
        </button>
      </form>
    </Modal>
  );
}

function MemoryViewer({ memory: m, onClose }) {
  const { user, api, setModal, openPlace, setPlaceStatus, notify } = useApp();
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
    <Modal title={m.place?.name || 'Kỉ niệm'} onClose={onClose} wide>
      <div className="viewer">
        {photos.length > 0 && (
          <div className="viewer__media">
            <img src={photos[i]} alt={m.caption} />
            {photos.length > 1 && (
              <>
                <button className="viewer__nav viewer__nav--l" onClick={() => setI((i - 1 + photos.length) % photos.length)} aria-label="Ảnh trước">‹</button>
                <button className="viewer__nav viewer__nav--r" onClick={() => setI((i + 1) % photos.length)} aria-label="Ảnh sau">›</button>
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
                {flagOf(m.place?.country)} {[m.place?.city, countryName(m.place?.country)].filter(Boolean).join(', ')}
                {m.date ? ` · ${formatDate(m.date)}` : ''}
              </div>
            </div>
          </div>
          {m.caption && <p className="viewer__caption">{m.caption}</p>}
          <div className="row wrap">
            <button className="btn btn--sm btn--soft" onClick={() => { onClose(); openPlace(m.place); }}>🗺️ Xem trên bản đồ</button>
            {!mine && <button className="btn btn--sm btn--soft" onClick={() => setPlaceStatus(m.place, 'wishlist')}>💛 Muốn đi</button>}
            <button className="btn btn--sm btn--soft" onClick={() => setModal({ type: 'directions', place: m.place })}>🧭 Chỉ đường</button>
            {mine && <button className="btn btn--sm btn--primary" onClick={() => setModal({ type: 'share', memory: full ? { ...m, fullPhotos: full } : m })}>✨ Chia sẻ</button>}
            {mine && (
              <button
                className="btn btn--sm btn--soft"
                onClick={async () => {
                  const v = m.visibility === 'public' ? 'private' : 'public';
                  await api.updateMemory(m.id, { visibility: v });
                  notify(v === 'public' ? 'Đã chuyển sang công khai 🌍' : 'Đã chuyển sang riêng tư 🔒');
                  onClose();
                }}
              >
                {m.visibility === 'public' ? '🔒 Chuyển riêng tư' : '🌍 Công khai'}
              </button>
            )}
            {mine && (
              <button
                className="btn btn--sm btn--ghost danger"
                onClick={async () => {
                  if (!confirm('Xoá kỉ niệm này?')) return;
                  await api.deleteMemory(m);
                  notify('Đã xoá');
                  onClose();
                }}
              >
                🗑️ Xoá
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
