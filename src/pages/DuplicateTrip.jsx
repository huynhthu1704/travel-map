import { useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import DateInput from '../components/DateInput';

// Lấy dữ liệu 1 lần từ hàm watch (rồi huỷ theo dõi)
const once = (watch) =>
  new Promise((resolve) => {
    let unsub = null;
    let done = false;
    unsub = watch((list) => {
      if (done) return;
      done = true;
      resolve(list || []);
      setTimeout(() => unsub && unsub(), 0);
    });
  });
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayDiff = (a, b) => Math.round((new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)) / 864e5);

/** Nhân bản chuyến đi: copy kế hoạch, checklist, chi phí dự kiến sang chuyến mới (chỉ có mình mình) */
export default function DuplicateTrip({ trip, onClose, onCreated }) {
  const { t } = useI18n();
  const { api, user, notify } = useApp();
  const [name, setName] = useState(`${trip.name} ${t('dup.copySuffix')}`);
  const [start, setStart] = useState('');
  const [opts, setOpts] = useState({ plan: true, notes: true, checklists: true, estimates: true });
  const [busy, setBusy] = useState(false);
  const toggle = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  // Có ngày xuất phát mới thì dời toàn bộ ngày trong kế hoạch theo cùng khoảng cách
  const shift = start && trip.startDate ? dayDiff(start, trip.startDate) : null;
  const moveDate = (d) => (!d ? '' : shift != null ? addDays(d, shift) : '');

  const run = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const tr = await api.createTrip(user, {
        name: name.trim(),
        emoji: trip.emoji,
        destinations: trip.destinations || [],
        kind: trip.kind || 'domestic',
        startDate: start || null,
        endDate: start && trip.startDate && trip.endDate ? addDays(trip.endDate, shift) : null,
        currency: trip.currency || null,
      });
      if (opts.plan) {
        const items = await once((cb) => api.watchPlan(trip.id, cb));
        for (const it of items)
          await api.addPlanItem(user, tr.id, { place: it.place, date: moveDate(it.date), time: it.time || '', note: opts.notes ? it.note || '' : '', order: it.order });
      }
      if (opts.checklists) {
        const lists = await once((cb) => api.watchChecklists(trip.id, cb, user.uid));
        for (const l of lists) {
          const items = (l.items || []).map((it) => ({
            ...it,
            done: false,
            doneBy: null,
            doneMap: {},
            ...(it.scope === 'me' ? { ownerUid: user.uid, ownerName: user.name } : {}),
          }));
          await api.addChecklist(user, tr.id, { title: l.title, phase: l.phase, scope: l.scope, items });
        }
      }
      if (opts.estimates) {
        const costs = await once((cb) => api.watchCosts(trip.id, cb));
        for (const c of costs.filter((x) => x.type === 'estimate'))
          await api.addCost(user, tr.id, { type: 'estimate', title: c.title, amount: c.amount, per: c.per || 'group', planItemId: null, note: c.note || '' });
      }
      notify(t('dup.done', { name: tr.name }));
      onCreated(tr);
    } catch (e) {
      notify(e.message, 'error');
      setBusy(false);
    }
  };

  const Opt = ({ k, label, disabled }) => (
    <label className={`switch ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" checked={opts[k] && !disabled} disabled={disabled} onChange={() => toggle(k)} />
      <span>{label}</span>
    </label>
  );
  return (
    <div className="card stack dup-trip">
      <div className="trip-summary__head">
        <h3 className="h3">📋 {t('dup.title')}</h3>
        <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
          ✕
        </button>
      </div>
      <p className="small muted">{t('dup.intro')}</p>
      <div className="grid-2">
        <label className="field">
          <span>{t('trip.nameLabel')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </label>
        <label className="field">
          <span>🛫 {t('dup.newStart')}</span>
          <DateInput value={start} onChange={setStart} ariaLabel={t('dup.newStart')} />
          <small className="muted">{start && trip.startDate ? t('dup.shiftHint') : t('dup.noDateHint')}</small>
        </label>
      </div>
      <div className="dup-opts">
        <Opt k="plan" label={`🗓️ ${t('dup.optPlan')}`} />
        <Opt k="notes" label={`📝 ${t('dup.optNotes')}`} disabled={!opts.plan} />
        <Opt k="checklists" label={`✅ ${t('dup.optChecklists')}`} />
        <Opt k="estimates" label={`💰 ${t('dup.optEstimates')}`} />
      </div>
      <p className="tiny muted">{t('dup.notCopied')}</p>
      <div className="row wrap">
        <button className="btn btn--primary" onClick={run} disabled={busy || !name.trim()}>
          {busy ? `⏳ ${t('dup.copying')}` : `📋 ${t('dup.create')}`}
        </button>
        <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
          {t('pick.cancel')}
        </button>
      </div>
    </div>
  );
}
