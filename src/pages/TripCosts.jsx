import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Loader, formatDate } from '../components/ui';
import DateInput from '../components/DateInput';
import { pName } from '../lib/lang';
import { CURRENCIES, fmtMoney, parseMoney, inputMoney, perPersonOf, groupTotalOf, settle } from '../lib/money';

/* ------------------------------------------------------------------ */
/* Ô nhập tiền: tự thêm dấu phân cách hàng nghìn                       */
/* ------------------------------------------------------------------ */
function MoneyInput({ value, onChange, cur, placeholder, autoFocus }) {
  const [text, setText] = useState(inputMoney(value, cur));
  useEffect(() => {
    if (parseMoney(text, cur) !== value) setText(inputMoney(value, cur));
  }, [value, cur]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="money-input">
      <input
        inputMode="decimal"
        value={text}
        placeholder={placeholder || '0'}
        autoFocus={autoFocus}
        onChange={(e) => {
          const n = parseMoney(e.target.value, cur);
          setText(e.target.value);
          onChange(n);
        }}
        onBlur={() => setText(inputMoney(value, cur))}
      />
      <span>{cur}</span>
    </div>
  );
}

const Seg = ({ value, set, options }) => (
  <div className="segmented segmented--sm">
    {options.map(([v, label]) => (
      <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => set(v)}>
        {label}
      </button>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Form thêm / sửa 1 khoản chi (dự kiến hoặc thực tế)                  */
/* ------------------------------------------------------------------ */
function CostForm({ type, initial = {}, trip, plan, cur, onSave, onCancel }) {
  const { t } = useI18n();
  const { user } = useApp();
  const memberIds = trip.memberIds || [];
  const [title, setTitle] = useState(initial.title || '');
  const [amount, setAmount] = useState(initial.amount ?? null);
  const [per, setPer] = useState(initial.per || 'group');
  const [planItemId, setPlanItemId] = useState(initial.planItemId || '');
  const [paidBy, setPaidBy] = useState(initial.paidBy || user.uid);
  const [among, setAmong] = useState(initial.splitAmong?.length ? initial.splitAmong : memberIds);
  const [date, setDate] = useState(initial.date || '');
  const [note, setNote] = useState(initial.note || '');
  const linked = plan.find((p) => p.id === planItemId);
  const finalTitle = title.trim() || (linked ? pName(linked.place) : '');
  const ok = finalTitle && amount > 0 && (type === 'estimate' || (paidBy && among.length));
  const toggle = (id) => setAmong((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    const base = { type, title: finalTitle, amount, planItemId: planItemId || null, note: note.trim() };
    if (type === 'estimate') onSave({ ...base, per });
    else
      onSave({
        ...base,
        paidBy,
        paidByName: trip.members?.[paidBy]?.name || '',
        splitAmong: among.length === memberIds.length && memberIds.every((m) => among.includes(m)) ? [] : among,
        date: date || '',
      });
  };
  return (
    <form className="cost-form" onSubmit={submit}>
      <div className="cost-form__row">
        <input className="grow" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={linked ? pName(linked.place) : t(`cost.titlePh.${type}`)} maxLength={80} autoFocus={!initial.id} />
        <MoneyInput value={amount} onChange={setAmount} cur={cur} />
      </div>
      <div className="cost-form__row">
        {plan.length > 0 && (
          <select value={planItemId} onChange={(e) => setPlanItemId(e.target.value)} className="cost-form__link" aria-label={t('cost.linkPlace')}>
            <option value="">📍 {t('cost.noPlace')}</option>
            {plan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.place.emoji || '📍'} {pName(p.place)}
              </option>
            ))}
          </select>
        )}
        {type === 'estimate' ? (
          <Seg value={per} set={setPer} options={[['group', `👥 ${t('cost.perGroup')}`], ['person', `🙋 ${t('cost.perPerson')}`]]} />
        ) : (
          <>
            <label className="cost-form__inline">
              <span>💳 {t('cost.paidBy')}</span>
              <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {memberIds.map((id) => (
                  <option key={id} value={id}>
                    {trip.members?.[id]?.name || id}
                  </option>
                ))}
              </select>
            </label>
            <DateInput value={date} onChange={setDate} ariaLabel={t('cost.date')} />
          </>
        )}
      </div>
      {type === 'estimate' && amount > 0 && (
        <small className="muted">
          {per === 'group'
            ? t('cost.groupHint', { each: fmtMoney(amount / Math.max(memberIds.length, 1), cur), n: memberIds.length })
            : t('cost.personHint', { total: fmtMoney(amount * memberIds.length, cur), n: memberIds.length })}
        </small>
      )}
      {type === 'actual' && memberIds.length > 1 && (
        <div className="cost-form__split">
          <span className="small muted">{t('cost.splitAmong')}</span>
          {memberIds.map((id) => (
            <button key={id} type="button" className={`chip chip--sm ${among.includes(id) ? 'chip--on' : ''}`} onClick={() => toggle(id)}>
              {among.includes(id) ? '✓ ' : ''}
              {trip.members?.[id]?.name || id}
            </button>
          ))}
          {amount > 0 && among.length > 0 && <small className="muted">= {fmtMoney(amount / among.length, cur)} / {t('cost.person')}</small>}
        </div>
      )}
      <div className="cost-form__row">
        <input className="grow" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('cost.notePh')} maxLength={120} />
        <button className="btn btn--sm btn--primary" disabled={!ok}>
          {initial.id ? `💾 ${t('trip.save')}` : `＋ ${t('cost.add')}`}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onCancel}>
            {t('pick.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Trang Chi phí của chuyến đi                                         */
/* ------------------------------------------------------------------ */
export default function TripCosts({ trip }) {
  const { t } = useI18n();
  const { api, user, notify } = useApp();
  const [costs, setCosts] = useState(null);
  const [plan, setPlan] = useState([]);
  const [adding, setAdding] = useState(null); // 'estimate' | 'actual' | null
  const [prefill, setPrefill] = useState(null);
  const [editId, setEditId] = useState(null);
  useEffect(() => api.watchCosts(trip.id, setCosts), [trip.id, api]);
  useEffect(() => api.watchPlan(trip.id, setPlan), [trip.id, api]);
  const cur = trip.currency || 'VND';
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const nameOf = (id, fallback) => trip.members?.[id]?.name || fallback || '—';
  const placeOf = (c) => plan.find((p) => p.id === c.planItemId)?.place;

  const list = costs || [];
  const estimates = list.filter((c) => c.type === 'estimate');
  const actuals = list.filter((c) => c.type === 'actual').sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
  const payments = list.filter((c) => c.type === 'payment');
  const estPerPerson = estimates.reduce((s, c) => s + perPersonOf(c, n), 0);
  const estGroup = estimates.reduce((s, c) => s + groupTotalOf(c, n), 0);
  const actualTotal = actuals.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const { balances, transfers } = useMemo(() => settle(list, memberIds, cur), [costs, memberIds.join(), cur]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (data, id) => {
    try {
      if (id) await api.updateCost(trip.id, id, data);
      else await api.addCost(user, trip.id, data);
      notify(t('cost.saved'));
      setAdding(null);
      setPrefill(null);
      setEditId(null);
    } catch (e) {
      notify(e.message, 'error');
    }
  };
  const remove = (c) => confirm(t('cost.confirmDelete', { name: c.title })) && api.deleteCost(trip.id, c.id);
  const markPaid = (tr) =>
    api.addCost(user, trip.id, { type: 'payment', title: t('cost.repay'), amount: tr.amount, paidBy: tr.from, payTo: tr.to, paidByName: nameOf(tr.from), date: '' }).then(() => notify(t('cost.paidDone')));

  if (!costs) return <Loader />;
  return (
    <section className="stack costs">
      {/* Tổng quan */}
      <div className="cost-summary">
        <div className="cost-stat">
          <small>{t('cost.estPerPerson')}</small>
          <b>{fmtMoney(estPerPerson, cur)}</b>
        </div>
        <div className="cost-stat">
          <small>{t('cost.estGroup', { n })}</small>
          <b>{fmtMoney(estGroup, cur)}</b>
        </div>
        <div className="cost-stat">
          <small>{t('cost.actualTotal')}</small>
          <b>{fmtMoney(actualTotal, cur)}</b>
        </div>
        <div className={`cost-stat ${actualTotal > estGroup && estGroup > 0 ? 'is-over' : ''}`}>
          <small>{t('cost.diff')}</small>
          <b>{estGroup > 0 ? `${actualTotal > estGroup ? '+' : actualTotal < estGroup ? '−' : ''}${fmtMoney(Math.abs(actualTotal - estGroup), cur)}` : '—'}</b>
        </div>
        <label className="cost-cur">
          <small>{t('cost.currency')}</small>
          <select value={cur} onChange={(e) => api.updateTrip(trip.id, { currency: e.target.value })}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Dự kiến */}
      <div className="card stack-sm">
        <div className="trip-summary__head">
          <h3 className="h3">📝 {t('cost.estimates')}</h3>
          {adding !== 'estimate' && (
            <button className="btn btn--sm btn--soft" onClick={() => setAdding('estimate')}>
              ＋ {t('cost.addEstimate')}
            </button>
          )}
        </div>
        {adding === 'estimate' && <CostForm type="estimate" trip={trip} plan={plan} cur={cur} onSave={(d) => save(d)} onCancel={() => setAdding(null)} />}
        {estimates.length === 0 && adding !== 'estimate' && <p className="small muted">{t('cost.noEstimates')}</p>}
        {estimates.length > 0 && (
          <div className="cost-table">
            <div className="cost-table__head cost-row--est">
              <span>{t('cost.item')}</span>
              <span>{t('cost.amount')}</span>
              <span>{t('cost.perPersonCol')}</span>
              <span />
            </div>
            {estimates.map((c) =>
              editId === c.id ? (
                <CostForm key={c.id} type="estimate" initial={c} trip={trip} plan={plan} cur={cur} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
              ) : (
                <div key={c.id} className="cost-row cost-row--est">
                  <span className="cost-row__title">
                    <b>{c.title}</b>
                    {(placeOf(c) || c.note) && (
                      <small className="muted">{[placeOf(c) && `📍 ${pName(placeOf(c))}`, c.note].filter(Boolean).join(' · ')}</small>
                    )}
                  </span>
                  <span>
                    {fmtMoney(c.amount, cur)}
                    <small className="muted"> / {c.per === 'person' ? t('cost.person') : t('cost.group')}</small>
                  </span>
                  <span>{fmtMoney(perPersonOf(c, n), cur)}</span>
                  <span className="cost-row__actions">
                    <button
                      className="icon-btn icon-btn--sm"
                      title={t('cost.toActual')}
                      onClick={() => {
                        setPrefill({ title: c.title, amount: groupTotalOf(c, n), planItemId: c.planItemId, note: c.note });
                        setAdding('actual');
                      }}
                    >
                      🧾
                    </button>
                    <button className="icon-btn icon-btn--sm" title={t('plan.edit')} onClick={() => setEditId(c.id)}>
                      ✏️
                    </button>
                    <button className="icon-btn icon-btn--sm" title={t('plan.remove')} onClick={() => remove(c)}>
                      🗑️
                    </button>
                  </span>
                </div>
              ),
            )}
            <div className="cost-row cost-row--est cost-row--total">
              <span>{t('cost.total')}</span>
              <span>{fmtMoney(estGroup, cur)}</span>
              <span>{fmtMoney(estPerPerson, cur)}</span>
              <span />
            </div>
          </div>
        )}
      </div>

      {/* Thực tế */}
      <div className="card stack-sm">
        <div className="trip-summary__head">
          <h3 className="h3">🧾 {t('cost.actuals')}</h3>
          {adding !== 'actual' && (
            <button className="btn btn--sm btn--primary" onClick={() => setAdding('actual')}>
              ＋ {t('cost.addActual')}
            </button>
          )}
        </div>
        {adding === 'actual' && (
          <CostForm
            key={JSON.stringify(prefill)}
            type="actual"
            initial={prefill || {}}
            trip={trip}
            plan={plan}
            cur={cur}
            onSave={(d) => save(d)}
            onCancel={() => {
              setAdding(null);
              setPrefill(null);
            }}
          />
        )}
        {actuals.length === 0 && adding !== 'actual' && <p className="small muted">{t('cost.noActuals')}</p>}
        {actuals.length > 0 && (
          <div className="cost-table">
            <div className="cost-table__head cost-row--act">
              <span>{t('cost.item')}</span>
              <span>{t('cost.amount')}</span>
              <span>{t('cost.paidBy')}</span>
              <span>{t('cost.splitCol')}</span>
              <span />
            </div>
            {actuals.map((c) =>
              editId === c.id ? (
                <CostForm key={c.id} type="actual" initial={c} trip={trip} plan={plan} cur={cur} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
              ) : (
                <div key={c.id} className="cost-row cost-row--act">
                  <span className="cost-row__title">
                    <b>{c.title}</b>
                    <small className="muted">
                      {[placeOf(c) && `📍 ${pName(placeOf(c))}`, c.date && formatDate(c.date), c.note].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                  <span>
                    <b>{fmtMoney(c.amount, cur)}</b>
                  </span>
                  <span className="cost-row__payer">
                    <Avatar name={nameOf(c.paidBy, c.paidByName)} photo={trip.members?.[c.paidBy]?.photo} size={22} />
                    {nameOf(c.paidBy, c.paidByName)}
                  </span>
                  <span className="small">{c.splitAmong?.length ? t('cost.splitSome', { n: c.splitAmong.length }) : t('cost.splitAll')}</span>
                  <span className="cost-row__actions">
                    <button className="icon-btn icon-btn--sm" title={t('plan.edit')} onClick={() => setEditId(c.id)}>
                      ✏️
                    </button>
                    <button className="icon-btn icon-btn--sm" title={t('plan.remove')} onClick={() => remove(c)}>
                      🗑️
                    </button>
                  </span>
                </div>
              ),
            )}
            <div className="cost-row cost-row--act cost-row--total">
              <span>{t('cost.total')}</span>
              <span>{fmtMoney(actualTotal, cur)}</span>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* Chia tiền */}
      <div className="card stack-sm">
        <h3 className="h3">🤝 {t('cost.settleTitle')}</h3>
        {actuals.length === 0 ? (
          <p className="small muted">{t('cost.settleEmpty')}</p>
        ) : (
          <>
            <div className="cost-table">
              <div className="cost-table__head cost-row--bal">
                <span>{t('cost.member')}</span>
                <span>{t('cost.paid')}</span>
                <span>{t('cost.share')}</span>
                <span>{t('cost.balance')}</span>
              </div>
              {Object.entries(balances).map(([id, x]) => (
                <div key={id} className="cost-row cost-row--bal">
                  <span className="cost-row__payer">
                    <Avatar name={nameOf(id)} photo={trip.members?.[id]?.photo} size={22} />
                    {nameOf(id)}
                    {id === user.uid && <small className="muted"> ({t('trips.you')})</small>}
                  </span>
                  <span>{fmtMoney(x.paid, cur)}</span>
                  <span>{fmtMoney(x.share, cur)}</span>
                  <span className={x.net > 0.5 ? 'pos' : x.net < -0.5 ? 'neg' : 'muted'}>
                    {Math.abs(x.net) < 0.5 ? t('cost.even') : x.net > 0 ? t('cost.receive', { v: fmtMoney(x.net, cur) }) : t('cost.owe', { v: fmtMoney(-x.net, cur) })}
                  </span>
                </div>
              ))}
            </div>
            {transfers.length ? (
              <div className="stack-sm">
                <b className="small">{t('cost.howToSettle')}</b>
                {transfers.map((tr, i) => (
                  <div key={i} className="transfer">
                    <span>
                      <b>{nameOf(tr.from)}</b> → <b>{nameOf(tr.to)}</b>
                    </span>
                    <b className="transfer__amt">{fmtMoney(tr.amount, cur)}</b>
                    <button className="btn btn--sm btn--soft" onClick={() => markPaid(tr)}>
                      ✓ {t('cost.markPaid')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small pos">🎉 {t('cost.allSettled')}</p>
            )}
            {payments.length > 0 && (
              <details className="small">
                <summary>{t('cost.paymentsDone', { n: payments.length })}</summary>
                {payments.map((p) => (
                  <div key={p.id} className="transfer transfer--done">
                    <span>
                      ✓ {nameOf(p.paidBy, p.paidByName)} → {nameOf(p.payTo)}
                    </span>
                    <span>{fmtMoney(p.amount, cur)}</span>
                    <button className="icon-btn icon-btn--sm" title={t('cost.undo')} onClick={() => api.deleteCost(trip.id, p.id)}>
                      ↩️
                    </button>
                  </div>
                ))}
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}
