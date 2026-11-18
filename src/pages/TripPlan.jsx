import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Empty, Loader, formatDate } from '../components/ui';
import DateInput from '../components/DateInput';
import { ALL_FAMOUS } from '../data/places';
import { templateItems } from '../data/checklists';
import { countryName, flagOf } from '../lib/countries';
import { normalize, searchNominatim, isGoogleMapsLink } from '../lib/geo';
import { getLang, getLocale, pName, pCity } from '../lib/lang';
import { resolveGoogleMaps } from '../components/Modals';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const weekday = (iso) => new Date(iso).toLocaleDateString(getLocale(), { weekday: 'short' });

/* ------------------------------------------------------------------ */
/* Ô tìm địa điểm để thêm vào kế hoạch                                 */
/* ------------------------------------------------------------------ */
function PlacePicker({ onPick, placeholder }) {
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
        setOsm(await searchNominatim(q.trim(), ctl.signal, getLang()));
      } catch {
        /* huỷ */
      }
      setBusy(false);
    }, 450);
    return () => {
      clearTimeout(tm);
      ctl.abort();
    };
  }, [q]);
  const pick = (p) => {
    onPick(p);
    setQ('');
    setOsm([]);
  };
  const fromLink = async () => {
    setBusy(true);
    const p = await resolveGoogleMaps(q);
    setBusy(false);
    if (p) pick(p);
  };
  const seen = new Set(local.map((p) => normalize(p.name)));
  const results = [...local, ...osm.filter((p) => !seen.has(normalize(p.name)) && p.type !== 'country')];
  return (
    <div className="place-picker">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {isGoogleMapsLink(q) && (
        <button className="btn btn--sm btn--dark" onClick={fromLink} disabled={busy}>
          🔗 {t('link.find')}
        </button>
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
  const toggleDone = async () => {
    if (item.done) {
      await api.updatePlanItem(trip.id, item.id, { done: false, doneBy: null, doneAt: null });
      return;
    }
    await api.updatePlanItem(trip.id, item.id, { done: true, doneBy: user.name, doneAt: Date.now() });
    // Đánh dấu "đã đến" trên bản đồ của mình + thêm vào hành trình chuyến đi
    const d = item.date && item.date <= today() ? item.date : today();
    await saveVisited(item.place, { visitedAt: d }, trip.id);
    notify(t('plan.doneToast', { name: pName(item.place) }));
  };
  return (
    <li className={`plan-item ${item.done ? 'is-done' : ''}`}>
      <button className="plan-item__check" onClick={toggleDone} aria-pressed={!!item.done} title={item.done ? t('plan.undo') : t('plan.markDone')}>
        {item.done ? '✓' : index + 1}
      </button>
      <div className="plan-item__body">
        <button className="link plan-item__name" onClick={() => openPlace(item.place)}>
          {item.place.emoji || '📍'} <b>{pName(item.place)}</b>
        </button>
        <small className="muted">
          {flagOf(item.place.country)} {[pCity(item.place), countryName(item.place.country)].filter(Boolean).join(', ')}
          {item.time && <> · 🕘 {item.time}</>}
          {item.done && item.doneBy && <> · {t('plan.doneBy', { name: item.doneBy })}</>}
        </small>
        {item.note && !editing && <p className="small plan-item__note">📝 {item.note}</p>}
        {editing && (
          <div className="plan-item__edit">
            <div className="row wrap">
              <label className="field">
                <span>📅 {t('plan.date')}</span>
                <DateInput value={date} onChange={setDate} ariaLabel={t('plan.date')} />
              </label>
              <label className="field">
                <span>🕘 {t('plan.time')}</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>📝 {t('plan.note')}</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('plan.notePlaceholder')} maxLength={200} />
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
            🧭
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
  const { api, user, notify, places, famousFor, ensureFamous, setActiveTripId, setView } = useApp();
  const [items, setItems] = useState(null);
  const [addDate, setAddDate] = useState('');
  useEffect(() => api.watchPlan(trip.id, setItems), [trip.id, api]);
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
    let oa = a.order ?? 0;
    let ob = b.order ?? 0;
    if (oa === ob) ob = oa + dir;
    await api.reorderPlan(trip.id, [
      { id: a.id, order: ob },
      { id: b.id, order: oa },
    ]);
  };

  // Gợi ý: danh sách Muốn đi của tôi + địa điểm nổi tiếng ở các quốc gia trong kế hoạch
  const wish = places.filter((p) => p.status === 'wishlist' && !planned.has(p.id));
  const planCountries = [...new Set(list.map((i) => i.place.country).filter(Boolean))];
  useEffect(() => planCountries.forEach((cc) => ensureFamous(cc)), [planCountries.join(','), ensureFamous]); // eslint-disable-line react-hooks/exhaustive-deps
  const wishIds = new Set(wish.map((p) => p.id));
  const wishNames = new Set([...wish, ...list.map((i) => i.place)].map((p) => normalize(p.name)));
  const suggested = planCountries
    .flatMap((cc) => famousFor(cc))
    .filter((p) => !planned.has(p.id) && !wishIds.has(p.id) && !wishNames.has(normalize(p.name)))
    .slice(0, 12);

  const done = list.filter((i) => i.done).length;
  let counter = 0;
  return (
    <section className="stack">
      <div className="card stack">
        <div className="trip-summary__head">
          <h3 className="h3">🗓️ {t('plan.title')}</h3>
          {list.length > 0 && (
            <button
              className="btn btn--sm btn--dark"
              onClick={() => {
                setActiveTripId(trip.id);
                setView('map');
              }}
            >
              🗺️ {t('plan.onMap')}
            </button>
          )}
        </div>
        {list.length > 0 && (
          <div className="plan-progress">
            <div className="plan-progress__bar">
              <i style={{ width: `${(done / list.length) * 100}%` }} />
            </div>
            <small>{t('plan.progress', { done, n: list.length })}</small>
          </div>
        )}
        <div className="plan-add">
          <PlacePicker onPick={(p) => add(p)} placeholder={t('plan.searchPlaceholder')} />
          <label className="field plan-add__date">
            <span>📅 {t('plan.addOnDate')}</span>
            <DateInput value={addDate} onChange={setAddDate} ariaLabel={t('plan.addOnDate')} />
          </label>
        </div>
        {wish.length > 0 && (
          <div className="stack-sm">
            <small className="muted">💛 {t('plan.fromWishlist')}</small>
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
            <small className="muted">✨ {t('plan.suggested')}</small>
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
                <PlanItem key={it.id} item={it} trip={trip} index={counter++} canUp={i > 0} canDown={i < group.length - 1} onMove={(dir) => move(group, i, dir)} />
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
  const [newScope, setNewScope] = useState('shared'); // mục mới: 👥 cả nhóm tick chung / 🙋 mỗi người tự tick
  const [collapsed, setCollapsed] = useState(false);
  const sharedList = list.scope === 'shared';
  const memberCount = trip.memberIds?.length || 1;
  // Mục "mỗi người" trong checklist chung: ai cũng tick riêng (doneMap: {uid: tên})
  const perPerson = (it) => sharedList && it.scope === 'personal';
  const isDone = (it) => (perPerson(it) ? !!it.doneMap?.[user.uid] : !!it.done);

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
  const switchScope = (it) => save(items.map((x) => (x.id === it.id ? { ...x, scope: x.scope === 'personal' ? 'shared' : 'personal' } : x)));
  const remove = (it) => save(items.filter((x) => x.id !== it.id));
  const addItem = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    save([...items, { id: Math.random().toString(36).slice(2, 10), text: text.trim(), scope: sharedList ? newScope : 'personal', done: false, doneBy: null, doneMap: {} }]);
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
                  <label>
                    <input type="checkbox" checked={isDone(it)} onChange={() => toggle(it)} />
                    <span>{it.text}</span>
                  </label>
                  {sharedList && !pp && it.done && it.doneBy && <small className="muted">✓ {it.doneBy}</small>}
                  {sharedList && (
                    <button
                      type="button"
                      className={`item-scope ${pp ? 'item-scope--each' : ''}`}
                      onClick={() => switchScope(it)}
                      title={(pp ? t('check.itemEachHelp') : t('check.itemGroupHelp')) + (pp && names.length ? ` — ✓ ${names.join(', ')}` : '') + ` · ${t('check.tapToSwitch')}`}
                    >
                      {pp ? `🙋 ${names.length}/${memberCount}` : '👥'}
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
