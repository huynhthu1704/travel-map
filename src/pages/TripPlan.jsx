import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Empty, Loader, formatDate, DirectionsIcon } from '../components/ui';
import DateInput from '../components/DateInput';
import TimeInput from '../components/TimeInput';
import { ALL_FAMOUS } from '../data/places';
import { templateItems } from '../data/checklists';
import { countryName, flagOf } from '../lib/countries';
import { normalize, searchNominatim, isGoogleMapsLink } from '../lib/geo';
import { getLang, getLocale, pName, pCity } from '../lib/lang';
import { resolveGoogleMaps } from '../components/Modals';
import { destLabel } from '../components/DestinationPicker';
import { exportPlanPdf, shareOrDownload, loadJsPdf } from '../lib/exportPlan';
import { reloadOnce } from '../lib/freshness';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const distKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const NEAR_KM = 40; // bán kính coi là "ở thành phố đó"

/** Toạ độ trung tâm các thành phố điểm đến (tra 1 lần qua OpenStreetMap, lưu cache) */
function useCityCenters(dests) {
  const key = dests.map((d) => `${d.cc}|${d.city}`).join(';');
  const [centers, setCenters] = useState({});
  useEffect(() => {
    let alive = true;
    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem('travel-map-city-centers') || '{}');
    } catch {
      /* bỏ qua */
    }
    const todo = dests.filter((d) => d.city);
    setCenters(Object.fromEntries(todo.filter((d) => cache[`${d.cc}|${d.city}`]).map((d) => [`${d.cc}|${d.city}`, cache[`${d.cc}|${d.city}`]])));
    (async () => {
      for (const d of todo) {
        const k = `${d.cc}|${d.city}`;
        if (cache[k]) continue;
        try {
          const [r] = await searchNominatim(d.city, undefined, getLang(), { countrycodes: d.cc, limit: 1 });
          if (r) {
            cache[k] = { lat: r.lat, lng: r.lng };
            try {
              localStorage.setItem('travel-map-city-centers', JSON.stringify(cache));
            } catch {
              /* đầy bộ nhớ */
            }
            if (alive) setCenters((c) => ({ ...c, [k]: cache[k] }));
          }
        } catch {
          /* mạng lỗi */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return centers;
}

const weekday = (iso) => new Date(iso).toLocaleDateString(getLocale(), { weekday: 'short' });

/* ------------------------------------------------------------------ */
/* Ô tìm địa điểm để thêm vào kế hoạch                                 */
/* ------------------------------------------------------------------ */
function PlacePicker({ onPick, placeholder, countrycodes = '' }) {
  const { t, lang } = useI18n();
  const { allLiveFamous, places, memories } = useApp();
  const [q, setQ] = useState('');
  const [osm, setOsm] = useState([]);
  const [busy, setBusy] = useState(false);
  const local = useMemo(() => {
    const n = normalize(q.trim());
    if (n.length < 2 || isGoogleMapsLink(q)) return [];
    const seen = new Set();
    return [...places, ...memories.map((m) => m.place), ...ALL_FAMOUS, ...(allLiveFamous || [])]
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
      .filter((p) => normalize(`${p.name} ${pName(p)} ${p.city} ${pCity(p)} ${countryName(p.country)}`).includes(n))
      .slice(0, 6);
  }, [q, places, memories, allLiveFamous, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (q.trim().length < 3 || isGoogleMapsLink(q)) return setOsm([]);
    const ctl = new AbortController();
    const tm = setTimeout(async () => {
      setBusy(true);
      try {
        setOsm(await searchNominatim(q.trim(), ctl.signal, getLang(), { countrycodes }));
      } catch {
        /* huỷ */
      }
      setBusy(false);
    }, 450);
    return () => {
      clearTimeout(tm);
      ctl.abort();
    };
  }, [q, countrycodes]);
  const pick = (p) => {
    onPick(p);
    setQ('');
    setOsm([]);
  };
  const [linkState, setLinkState] = useState(''); // '' | 'notFound'
  useEffect(() => setLinkState(''), [q]);
  const fromLink = async () => {
    setBusy(true);
    setLinkState('');
    const p = await resolveGoogleMaps(q);
    setBusy(false);
    if (p) pick(p);
    else setLinkState('notFound');
  };
  const seen = new Set(local.map((p) => normalize(p.name)));
  const results = [...local, ...osm.filter((p) => !seen.has(normalize(p.name)) && p.type !== 'country')];
  return (
    <div className="place-picker">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {isGoogleMapsLink(q) && (
        <button className="btn btn--sm btn--dark" onClick={fromLink} disabled={busy}>
          {busy ? `⏳ ${t('link.finding')}` : `🔗 ${t('link.find')}`}
        </button>
      )}
      {isGoogleMapsLink(q) && linkState === 'notFound' && (
        <div className="place-picker__results">
          <p className="small warn">🔎 {t('link.notFoundShort')}</p>
        </div>
      )}
      {q.trim().length >= 2 && !isGoogleMapsLink(q) && (
        <div className="place-picker__results">
          {results.map((p) => (
            <button key={p.id} type="button" onClick={() => pick(p)}>
              <span>{p.emoji || '📍'}</span>
              <span>
                <b>{pName(p)}</b>
                <small>
                  {flagOf(p.country)} {[pCity(p), countryName(p.country)].filter(Boolean).join(', ')}
                </small>
              </span>
              <em>＋</em>
            </button>
          ))}
          {busy && <p className="small muted">{t('common.loading')}…</p>}
          {!busy && !results.length && <p className="small muted">{t('plan.noResults')}</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kế hoạch chuyến đi                                                  */
/* ------------------------------------------------------------------ */
function PlanItem({ item, index, canUp, canDown, onMove, trip }) {
  const { t } = useI18n();
  const { api, user, notify, openPlace, setModal, saveVisited } = useApp();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(item.date || '');
  const [time, setTime] = useState(item.time || '');
  const [note, setNote] = useState(item.note || '');
  useEffect(() => {
    setDate(item.date || '');
    setTime(item.time || '');
    setNote(item.note || '');
  }, [item.date, item.time, item.note]);
  const save = async () => {
    await api.updatePlanItem(trip.id, item.id, { date: date || '', time: time || '', note: note.trim() });
    setEditing(false);
    notify(t('plan.saved'));
  };
  // Trạng thái: chưa đi / đã đi / không đi (bấm lại nút đang chọn để quay về "chưa đi")
  const setSkipped = async () => {
    if (item.skipped) return api.updatePlanItem(trip.id, item.id, { skipped: false });
    await api.updatePlanItem(trip.id, item.id, { skipped: true, done: false, doneBy: user.name, doneAt: null });
    notify(t('plan.skippedToast', { name: pName(item.place) }));
  };
  const toggleDone = async () => {
    if (item.done) {
      await api.updatePlanItem(trip.id, item.id, { done: false, doneBy: null, doneAt: null });
      return;
    }
    await api.updatePlanItem(trip.id, item.id, { done: true, skipped: false, doneBy: user.name, doneAt: Date.now() });
    // Đánh dấu "đã đến" trên bản đồ của mình + thêm vào hành trình chuyến đi
    const d = item.date && item.date <= today() ? item.date : today();
    await saveVisited(item.place, { visitedAt: d }, trip.id);
    notify(t('plan.doneToast', { name: pName(item.place) }));
  };
  return (
    <li className={`plan-item ${item.done ? 'is-done' : ''} ${item.skipped ? 'is-skipped' : ''}`}>
      <button className="plan-item__check" onClick={toggleDone} aria-pressed={!!item.done} title={item.done ? t('plan.undo') : t('plan.markDone')}>
        {item.done ? '✓' : item.skipped ? '✕' : index + 1}
      </button>
      <div className="plan-item__body">
        <button className="link plan-item__name" onClick={() => openPlace(item.place)}>
          {item.place.emoji || '📍'} <b>{pName(item.place)}</b>
        </button>
        <small className="muted">
          {flagOf(item.place.country)} {[pCity(item.place), countryName(item.place.country)].filter(Boolean).join(', ')}
          {item.time && <> · 🕘 {item.time}</>}
          {(item.done || item.skipped) && item.doneBy && <> · {t(item.skipped ? 'plan.skippedBy' : 'plan.doneBy', { name: item.doneBy })}</>}
        </small>
        <div className="plan-status" role="group" aria-label={t('plan.status')}>
          <button type="button" className={`plan-status__btn ${item.done ? 'on on--done' : ''}`} onClick={toggleDone} aria-pressed={!!item.done}>
            👣 {t('plan.statusDone')}
          </button>
          <button type="button" className={`plan-status__btn ${item.skipped ? 'on on--skip' : ''}`} onClick={setSkipped} aria-pressed={!!item.skipped}>
            🚫 {t('plan.statusSkip')}
          </button>
        </div>
        {item.note && !editing && (
          <button className="small plan-item__note" onClick={() => setEditing(true)} title={t('plan.edit')}>
            📝 {item.note}
          </button>
        )}
        {!item.note && !editing && (
          <button className="plan-item__add-note" onClick={() => setEditing(true)}>
            ＋ {t('plan.addNote')}
          </button>
        )}
        {editing && (
          <div className="plan-item__edit">
            <div className="row wrap">
              <label className="field">
                <span>📅 {t('plan.date')}</span>
                <DateInput value={date} onChange={setDate} ariaLabel={t('plan.date')} />
              </label>
              <label className="field">
                <span>🕘 {t('plan.time')}</span>
                <TimeInput value={time} onChange={setTime} ariaLabel={t('plan.time')} />
              </label>
            </div>
            <label className="field">
              <span>📝 {t('plan.note')}</span>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('plan.notePlaceholder')} maxLength={500} autoFocus={!item.note && !item.date} />
              <small className="muted">{t('plan.noteHelp')}</small>
            </label>
            <div className="row wrap">
              <button className="btn btn--sm btn--primary" onClick={save}>
                💾 {t('trip.save')}
              </button>
              {(date || time) && (
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => {
                    setDate('');
                    setTime('');
                  }}
                >
                  {t('plan.clearDate')}
                </button>
              )}
              <button className="btn btn--sm btn--ghost" onClick={() => setEditing(false)}>
                {t('pick.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
      {!editing && (
        <div className="plan-item__actions">
          <button className="icon-btn" onClick={() => onMove(-1)} disabled={!canUp} aria-label={t('plan.up')} title={t('plan.up')}>
            ↑
          </button>
          <button className="icon-btn" onClick={() => onMove(1)} disabled={!canDown} aria-label={t('plan.down')} title={t('plan.down')}>
            ↓
          </button>
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label={t('plan.edit')} title={t('plan.edit')}>
            ✏️
          </button>
          <button className="icon-btn" onClick={() => setModal({ type: 'directions', place: item.place })} aria-label={t('common.directions')} title={t('common.directions')}>
            <DirectionsIcon />
          </button>
          <button
            className="icon-btn"
            onClick={() => confirm(t('plan.confirmDelete', { name: pName(item.place) })) && api.deletePlanItem(trip.id, item.id)}
            aria-label={t('plan.remove')}
            title={t('plan.remove')}
          >
            🗑️
          </button>
        </div>
      )}
    </li>
  );
}

export function TripPlan({ trip }) {
  const { t } = useI18n();
  const { api, user, notify, places, famousFor, ensureFamous, setActiveTripId, setView, placeById, showTripOnMap } = useApp();
  const [items, setItems] = useState(null);
  const [addDate, setAddDate] = useState('');
  useEffect(() => api.watchPlan(trip.id, setItems), [trip.id, api]);
  // Đồng bộ 1 lần: địa điểm đã có trong Hành trình nhưng chưa có trong kế hoạch → thêm vào kế hoạch
  const [stops, setStops] = useState(null);
  useEffect(() => api.watchStops(trip.id, setStops), [trip.id, api]);
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || !items || !stops || !user || !(trip.memberIds || []).includes(user.uid)) return;
    synced.current = true;
    const have = new Set(items.map((i) => i.place?.id));
    const todo = [];
    stops.forEach((s) => {
      if (!s.place || have.has(s.place.id)) return;
      have.add(s.place.id);
      todo.push(s);
    });
    (async () => {
      for (const s of todo) {
        const mineSaved = s.byUid === user.uid ? placeById[s.place.id] : null;
        await api.ensurePlanItem({ uid: s.byUid || user.uid, name: s.byName || user.name }, trip.id, s.place, { done: s.kind !== 'wishlist', date: mineSaved?.visitedAt || '' }).catch(() => {});
      }
    })();
  }, [items, stops]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = items || [];
  const planned = new Set(list.map((i) => i.place.id));

  const add = async (place, date = addDate) => {
    if (planned.has(place.id)) return notify(t('plan.already', { name: pName(place) }), 'error');
    const sameDay = list.filter((i) => (i.date || '') === (date || ''));
    const order = sameDay.length ? Math.max(...sameDay.map((i) => i.order ?? 0)) + 1 : Date.now();
    await api.addPlanItem(user, trip.id, { place, date: date || '', order });
    notify(t('plan.added', { name: pName(place) }));
  };

  // Nhóm theo ngày dự định; mục chưa có ngày để cuối
  const groups = useMemo(() => {
    const g = new Map();
    list.forEach((i) => {
      const k = i.date || '';
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(i);
    });
    return [...g.entries()];
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = async (group, idx, dir) => {
    const a = group[idx];
    const b = group[idx + dir];
    if (!a || !b) return;
    // Giờ khác nhau (trong ngày xếp theo giờ) → đổi khung giờ cho nhau để đổi thứ tự
    if ((a.time || '') !== (b.time || '')) {
      await Promise.all([api.updatePlanItem(trip.id, a.id, { time: b.time || '' }), api.updatePlanItem(trip.id, b.id, { time: a.time || '' })]);
      notify(t('plan.timesSwapped', { a: pName(a.place), b: pName(b.place) }));
      return;
    }
    let oa = a.order ?? 0;
    let ob = b.order ?? 0;
    if (oa === ob) ob = oa + dir;
    await api.reorderPlan(trip.id, [
      { id: a.id, order: ob },
      { id: b.id, order: oa },
    ]);
  };

  // Gợi ý được khoanh vùng theo điểm đến của chuyến (quốc gia + thành phố);
  // chưa khai báo điểm đến thì dựa vào các quốc gia đã có trong kế hoạch
  const planCountries = [...new Set(list.map((i) => i.place.country).filter(Boolean))];
  const dests = trip.destinations?.length ? trip.destinations : planCountries.map((cc) => ({ cc, city: '' }));
  const destCcs = [...new Set(dests.map((d) => d.cc))];
  useEffect(() => destCcs.forEach((cc) => ensureFamous(cc)), [destCcs.join(','), ensureFamous]); // eslint-disable-line react-hooks/exhaustive-deps
  const centers = useCityCenters(dests);
  const inDest = (p) =>
    !dests.length ||
    dests.some((d) => {
      if (p.country && p.country !== d.cc) return false;
      if (!d.city) return p.country === d.cc;
      const c = centers[`${d.cc}|${d.city}`];
      if (c && p.lat != null && distKm(c, p) <= NEAR_KM) return true;
      return normalize(`${p.city || ''} ${pCity(p)} ${p.i18n?.en?.city || ''}`).includes(normalize(d.city));
    });
  const wish = places.filter((p) => p.status === 'wishlist' && !planned.has(p.id) && inDest(p));
  const wishIds = new Set(wish.map((p) => p.id));
  const takenNames = new Set([...wish, ...list.map((i) => i.place)].map((p) => normalize(p.name)));
  const suggested = destCcs
    .flatMap((cc) => famousFor(cc))
    .filter((p) => inDest(p) && !planned.has(p.id) && !wishIds.has(p.id) && !takenNames.has(normalize(p.name)))
    .slice(0, 16);
  const where = destLabel(dests);

  const done = list.filter((i) => i.done).length;
  const skipped = list.filter((i) => i.skipped).length;
  // Nạp sẵn công cụ PDF ở nền khi mở tab Kế hoạch để bấm xuất là có ngay
  useEffect(() => {
    loadJsPdf().catch(() => {});
  }, []);
  // Xuất PDF từ dữ liệu mới nhất đang hiển thị (cập nhật trực tiếp từ máy chủ)
  const [exporting, setExporting] = useState(false);
  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare && (() => {
    try {
      return navigator.canShare({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] });
    } catch {
      return false;
    }
  })();
  const doExport = async (share) => {
    setExporting(true);
    try {
      const file = await exportPlanPdf(trip, list);
      const r = await shareOrDownload(file, { preferShare: share });
      if (r === 'downloaded') notify(t('pdf.downloaded', { name: file.name }));
    } catch (e) {
      if (e.stale) {
        // Web vừa được cập nhật: tải lại trang (vẫn ở đúng chuyến / tab này) rồi bấm xuất lại
        notify(t('update.reloading'));
        setTimeout(() => reloadOnce() || notify(t('pdf.error', { msg: e.message }), 'error'), 1200);
      } else notify(t('pdf.error', { msg: e.message }), 'error');
    }
    setExporting(false);
  };
  let counter = 0;
  return (
    <section className="stack">
      <div className="card stack">
        <div className="trip-summary__head">
          <h3 className="h3">🗓️ {t('plan.title')}</h3>
          {list.length > 0 && (
            <div className="row wrap">
              <button className="btn btn--sm btn--primary" onClick={() => doExport(false)} disabled={exporting}>
                {exporting ? `⏳ ${t('pdf.making')}` : `📄 ${t('pdf.export')}`}
              </button>
              {canShareFiles && (
                <button className="btn btn--sm btn--outline" onClick={() => doExport(true)} disabled={exporting}>
                  📤 {t('pdf.share')}
                </button>
              )}
              <button
                className="btn btn--sm btn--dark"
                onClick={() => showTripOnMap(trip.id)}
              >
                🗺️ {t('plan.onMap')}
              </button>
            </div>
          )}
        </div>
        {list.length > 0 && (
          <div className="plan-progress">
            <div className="plan-progress__bar">
              <i style={{ width: `${(done / Math.max(list.length - skipped, 1)) * 100}%` }} />
            </div>
            <small>
              {t('plan.progress', { done, n: list.length - skipped })}
              {skipped > 0 && ` · ${t('plan.skippedCount', { n: skipped })}`}
            </small>
          </div>
        )}
        <div className="plan-add">
          <PlacePicker onPick={(p) => add(p)} placeholder={t('plan.searchPlaceholder')} countrycodes={trip.destinations?.length ? destCcs.join(',') : ''} />
          <label className="field plan-add__date">
            <span>📅 {t('plan.addOnDate')}</span>
            <DateInput value={addDate} onChange={setAddDate} ariaLabel={t('plan.addOnDate')} />
          </label>
        </div>
        {!trip.destinations?.length && <p className="tiny muted">💡 {t('plan.destHint')}</p>}
        {wish.length > 0 && (
          <div className="stack-sm">
            <small className="muted">💛 {where ? t('plan.fromWishlistIn', { where }) : t('plan.fromWishlist')}</small>
            <div className="chips chips--wrap">
              {wish.slice(0, 12).map((p) => (
                <button key={p.id} className="chip" onClick={() => add(p)}>
                  ＋ {p.emoji} {pName(p)}
                </button>
              ))}
            </div>
          </div>
        )}
        {suggested.length > 0 && (
          <div className="stack-sm">
            <small className="muted">✨ {where ? t('plan.suggestedIn', { where }) : t('plan.suggested')}</small>
            <div className="chips chips--wrap">
              {suggested.map((p) => (
                <button key={p.id} className="chip" onClick={() => add(p)}>
                  ＋ {p.emoji} {pName(p)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!items ? (
        <Loader />
      ) : list.length === 0 ? (
        <Empty emoji="🗺️" title={t('plan.empty')} text={t('plan.emptyHint')} />
      ) : (
        groups.map(([date, group]) => (
          <div key={date || 'none'} className="plan-day">
            <h4 className="plan-day__title">
              {date ? (
                <>
                  {trip.startDate && date >= trip.startDate && <span className="plan-day__n">{t('plan.dayN', { n: dayDiff(date, trip.startDate) + 1 })}</span>}
                  {weekday(date)}, {formatDate(date)}
                </>
              ) : (
                <>🕓 {t('plan.noDate')}</>
              )}
            </h4>
            <ol className="plan-list">
              {group.map((it, i) => (
                <PlanItem
                  key={it.id}
                  item={it}
                  trip={trip}
                  index={counter++}
                  // Luôn đổi chỗ được trong ngày; nếu khác giờ thì 2 địa điểm đổi khung giờ cho nhau
                  canUp={i > 0}
                  canDown={i < group.length - 1}
                  onMove={(dir) => move(group, i, dir)}
                />
              ))}
            </ol>
          </div>
        ))
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Checklist trước khi đi / trước khi về                              */
/* ------------------------------------------------------------------ */
function NewChecklist({ trip, onClose, defaultPhase }) {
  const { t, lang } = useI18n();
  const { api, user, notify } = useApp();
  const [phase, setPhase] = useState(defaultPhase || 'before');
  const [scope, setScope] = useState('personal');
  const [kind, setKind] = useState(trip.kind || 'domestic');
  const [useTemplate, setUseTemplate] = useState(true);
  const create = async () => {
    const title = `${t('check.phase.' + phase)} · ${t('trip.kind.' + kind)}`;
    await api.addChecklist(user, trip.id, { title, phase, scope, items: useTemplate ? templateItems(kind, phase, lang) : [] });
    notify(t('check.created'));
    onClose();
  };
  const Seg = ({ value, set, options }) => (
    <div className="segmented segmented--sm">
      {options.map(([v, label]) => (
        <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => set(v)}>
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <div className="card new-check">
      <div className="new-check__head">
        <b>＋ {t('check.new')}</b>
        <button className="icon-btn icon-btn--sm" onClick={onClose} aria-label={t('common.close')}>
          ✕
        </button>
      </div>
      <div className="new-check__grid">
        <div className="new-check__field">
          <span title={t('check.scopeHelp.' + scope)}>{t('check.scopeQShort')}</span>
          <Seg value={scope} set={setScope} options={[['personal', `🙋 ${t('check.scope.personal')}`], ['shared', `👥 ${t('check.scope.sharedShort')}`]]} />
        </div>
        <div className="new-check__field">
          <span>{t('check.phaseQ')}</span>
          <Seg value={phase} set={setPhase} options={[['before', `🛫 ${t('check.phase.beforeShort')}`], ['return', `🛬 ${t('check.phase.returnShort')}`]]} />
        </div>
        <div className="new-check__field">
          <span>{t('check.kindQ')}</span>
          <Seg value={kind} set={setKind} options={[['domestic', `🏠 ${t('trip.kind.domestic')}`], ['international', `🌏 ${t('trip.kind.international')}`]]} />
        </div>
      </div>
      <div className="new-check__foot">
        <label className="switch small">
          <input type="checkbox" checked={useTemplate} onChange={(e) => setUseTemplate(e.target.checked)} />
          <span>{t('check.useTemplate')}</span>
        </label>
        <small className="muted">{t('check.scopeHelp.' + scope)}</small>
        <button className="btn btn--sm btn--primary" onClick={create}>
          {t('check.create')}
        </button>
      </div>
    </div>
  );
}

function Checklist({ list, trip }) {
  const { t } = useI18n();
  const { api, user } = useApp();
  const [text, setText] = useState('');
  const [newScope, setNewScope] = useState('shared'); // mục mới: 👥 chung / 🙋 mỗi người tự tick / 👤 chỉ mình tôi lo
  const [collapsed, setCollapsed] = useState(false);
  const sharedList = list.scope === 'shared';
  const memberCount = trip.memberIds?.length || 1;
  // Mục "mỗi người" trong checklist chung: ai cũng tick riêng (doneMap: {uid: tên})
  const perPerson = (it) => sharedList && it.scope === 'personal';
  const isDone = (it) => (perPerson(it) ? !!it.doneMap?.[user.uid] : !!it.done);
  // Mục "chỉ mình tôi": 1 người nhận lo, chỉ người đó tick được (người khác vẫn thấy ai đang lo)
  const onlyMe = (it) => sharedList && it.scope === 'me';
  const canTick = (it) => !onlyMe(it) || it.ownerUid === user.uid;

  // Kéo thả để sắp xếp (chuột & cảm ứng): giữ ⠿ rồi kéo lên / xuống
  const [drag, setDrag] = useState(null); // { id, draft: [...] }
  const ulRef = useRef(null);
  const items = drag ? drag.draft : list.items || [];
  const save = (next) => api.updateChecklist(trip.id, list.id, { items: next });
  const onDragStart = (e, it) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ id: it.id, draft: list.items || [] });
  };
  const onDragMove = (e) => {
    if (!drag || !ulRef.current) return;
    // Vị trí mới = số mục khác có điểm giữa nằm trên con trỏ (bỏ qua chính mục đang kéo)
    const others = [...ulRef.current.children].filter((li) => li.dataset.id !== drag.id);
    const to = others.filter((li) => {
      const r = li.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
    const rest = drag.draft.filter((x) => x.id !== drag.id);
    const moved = drag.draft.find((x) => x.id === drag.id);
    const next = [...rest.slice(0, to), moved, ...rest.slice(to)];
    if (next.map((x) => x.id).join() !== drag.draft.map((x) => x.id).join()) setDrag({ ...drag, draft: next });
  };
  const onDragEnd = () => {
    if (!drag) return;
    if (drag.draft.map((x) => x.id).join() !== (list.items || []).map((x) => x.id).join()) save(drag.draft);
    setDrag(null);
  };
  const moveBy = (it, dir) => {
    const arr = [...(list.items || [])];
    const i = arr.findIndex((x) => x.id === it.id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    save(arr);
  };

  const done = items.filter(isDone).length;
  const toggle = (it) =>
    save(
      items.map((x) => {
        if (x.id !== it.id) return x;
        if (perPerson(x)) {
          const m = { ...(x.doneMap || {}) };
          if (m[user.uid]) delete m[user.uid];
          else m[user.uid] = user.name;
          return { ...x, doneMap: m };
        }
        return { ...x, done: !x.done, doneBy: !x.done ? user.name : null };
      }),
    );
  // Bấm biểu tượng để đổi: Chung → Mỗi người → Chỉ mình tôi → Chung
  const NEXT = { shared: 'personal', personal: 'me', me: 'shared' };
  const switchScope = (it) =>
    save(
      items.map((x) => {
        if (x.id !== it.id) return x;
        const scope = NEXT[x.scope || 'shared'] || 'shared';
        return scope === 'me' ? { ...x, scope, ownerUid: user.uid, ownerName: user.name, done: false, doneBy: null } : { ...x, scope, ownerUid: null, ownerName: null };
      }),
    );
  const remove = (it) => save(items.filter((x) => x.id !== it.id));
  const addItem = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const scope = sharedList ? newScope : 'personal';
    save([
      ...items,
      { id: Math.random().toString(36).slice(2, 10), text: text.trim(), scope, done: false, doneBy: null, doneMap: {}, ...(scope === 'me' ? { ownerUid: user.uid, ownerName: user.name } : {}) },
    ]);
    setText('');
  };
  const reset = () =>
    save(
      items.map((x) => {
        if (!perPerson(x)) return { ...x, done: false, doneBy: null };
        const m = { ...(x.doneMap || {}) };
        delete m[user.uid];
        return { ...x, doneMap: m };
      }),
    );
  return (
    <div className={`card checklist ${done === items.length && items.length ? 'is-complete' : ''}`}>
      <div className="trip-summary__head">
        <button className="link checklist__title" onClick={() => setCollapsed((c) => !c)}>
          <b>
            {list.phase === 'return' ? '🛬' : '🛫'} {list.title}
          </b>
          <span className={`role role--${sharedList ? 'editor' : 'user'}`}>{sharedList ? `👥 ${t('check.scope.shared')}` : `🙋 ${t('check.scope.personal')}`}</span>
        </button>
        <span className="small muted">
          {done}/{items.length} {collapsed ? '▸' : '▾'}
        </span>
      </div>
      <div className="plan-progress__bar">
        <i style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
      </div>
      {!collapsed && (
        <>
          {sharedList && <p className="tiny muted check-legend">{t('check.legend')}</p>}
          <ul className={`check-items ${drag ? 'is-sorting' : ''}`} ref={ulRef}>
            {items.map((it) => {
              const pp = perPerson(it);
              const names = Object.values(it.doneMap || {});
              return (
                <li key={it.id} data-id={it.id} className={`${isDone(it) ? 'is-done' : ''} ${drag?.id === it.id ? 'is-dragging' : ''}`}>
                  <button
                    type="button"
                    className="check-handle"
                    aria-label={t('check.reorder')}
                    title={t('check.reorder')}
                    onPointerDown={(e) => onDragStart(e, it)}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragEnd}
                    onPointerCancel={onDragEnd}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') (e.preventDefault(), moveBy(it, -1));
                      if (e.key === 'ArrowDown') (e.preventDefault(), moveBy(it, 1));
                    }}
                  >
                    ⠿
                  </button>
                  <label className={canTick(it) ? '' : 'is-locked'} title={canTick(it) ? '' : t('check.onlyOwnerTicks', { name: it.ownerName })}>
                    <input type="checkbox" checked={isDone(it)} disabled={!canTick(it)} onChange={() => toggle(it)} />
                    <span>{it.text}</span>
                  </label>
                  {sharedList && !pp && !onlyMe(it) && it.done && it.doneBy && <small className="muted">✓ {it.doneBy}</small>}
                  {sharedList && (
                    <button
                      type="button"
                      className={`item-scope ${pp ? 'item-scope--each' : ''} ${onlyMe(it) ? 'item-scope--me' : ''}`}
                      onClick={() => (onlyMe(it) && it.ownerUid !== user.uid ? null : switchScope(it))}
                      title={
                        (onlyMe(it) ? t('check.itemMeHelp', { name: it.ownerName }) : pp ? t('check.itemEachHelp') : t('check.itemGroupHelp')) +
                        (pp && names.length ? ` — ✓ ${names.join(', ')}` : '') +
                        (onlyMe(it) && it.ownerUid !== user.uid ? '' : ` · ${t('check.tapToSwitch')}`)
                      }
                    >
                      {onlyMe(it) ? `👤 ${it.ownerUid === user.uid ? t('check.me') : it.ownerName || '?'}` : pp ? `🙋 ${names.length}/${memberCount}` : '👥'}
                    </button>
                  )}
                  <button className="icon-btn icon-btn--sm" onClick={() => remove(it)} aria-label={t('plan.remove')}>
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          <form className="row" onSubmit={addItem}>
            {sharedList && (
              <div className="segmented segmented--sm check-new-scope" role="group" aria-label={t('check.itemScope')}>
                <button type="button" className={newScope === 'shared' ? 'on' : ''} onClick={() => setNewScope('shared')} title={t('check.itemGroupHelp')}>
                  👥 {t('check.itemGroup')}
                </button>
                <button type="button" className={newScope === 'personal' ? 'on' : ''} onClick={() => setNewScope('personal')} title={t('check.itemEachHelp')}>
                  🙋 {t('check.itemEach')}
                </button>
                <button type="button" className={newScope === 'me' ? 'on' : ''} onClick={() => setNewScope('me')} title={t('check.itemMeHelp', { name: user.name })}>
                  👤 {t('check.itemMe')}
                </button>
              </div>
            )}
            <input className="grow" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('check.addPlaceholder')} maxLength={120} />
            <button className="btn btn--sm btn--soft">＋ {t('check.add')}</button>
          </form>
          <div className="row wrap">
            {done > 0 && (
              <button className="btn btn--sm btn--ghost" onClick={reset}>
                ↺ {t('check.reset')}
              </button>
            )}
            <button className="btn btn--sm btn--ghost danger" onClick={() => confirm(t('check.confirmDelete')) && api.deleteChecklist(trip.id, list.id)}>
              🗑️ {t('check.delete')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TripChecklists({ trip }) {
  const { t } = useI18n();
  const { api, user } = useApp();
  const [lists, setLists] = useState(null);
  const [creating, setCreating] = useState(null); // null | 'before' | 'return'
  useEffect(() => api.watchChecklists(trip.id, setLists, user?.uid), [trip.id, api, user?.uid]);
  // Checklist cá nhân chỉ người tạo thấy; checklist chung cả nhóm cùng thấy
  const mine = (lists || []).filter((l) => l.scope === 'shared' || l.ownerUid === user?.uid);
  const phases = ['before', 'return'];
  return (
    <section className="stack">
      {creating && <NewChecklist trip={trip} defaultPhase={creating} onClose={() => setCreating(null)} />}
      {!lists ? (
        <Loader />
      ) : (
        <div className="check-columns">
        {phases.map((ph) => {
          const ls = mine.filter((l) => (l.phase || 'before') === ph);
          return (
            <div key={ph} className="stack">
              <div className="trip-summary__head check-col__head">
                <h3 className="h3">
                  {ph === 'before' ? '🛫' : '🛬'} {t('check.phase.' + ph)}
                </h3>
                {!creating && (
                  <button className="btn btn--sm btn--soft" onClick={() => setCreating(ph)}>
                    ＋ {t('check.newShort')}
                  </button>
                )}
              </div>
              {ls.length ? ls.map((l) => <Checklist key={l.id} list={l} trip={trip} />) : <p className="muted small check-empty">{t('check.none.' + ph)}</p>}
            </div>
          );
        })}
        </div>
      )}
    </section>
  );
}
