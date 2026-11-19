import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Loader, formatDate, TrashIcon } from '../components/ui';
import DateInput from '../components/DateInput';
import { pName } from '../lib/lang';
import { fmtMoney, parseMoney, inputMoney, perPersonOf, groupTotalOf, settle, makeToBase, actualAmountOf, participantsOf } from '../lib/money';
import { currencyOfCountry } from '../lib/rates';
import CurrencyRates from '../components/CurrencyRates';

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
function CostForm({ type, initial = {}, trip, plan, cur: base, curs, estimates = [], onSave, onCancel }) {
  const { t } = useI18n();
  const { user } = useApp();
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const [title, setTitle] = useState(initial.title || '');
  const [amount, setAmount] = useState(initial.amount ?? null);
  const [per, setPer] = useState(initial.per || 'group');
  const [planItemId, setPlanItemId] = useState(initial.planItemId || '');
  const [estimateId, setEstimateId] = useState(initial.estimateId || '');
  const [paidBy, setPaidBy] = useState(initial.paidBy || user.uid);
  const [among, setAmong] = useState(initial.splitAmong?.length ? initial.splitAmong : memberIds);
  // Ai tham gia khoản chi: cả nhóm hoặc chọn từng người
  const [who, setWho] = useState(initial.splitAmong?.length ? 'some' : 'all');
  const people = who === 'all' ? memberIds : among;
  const [date, setDate] = useState(initial.date || '');
  const [note, setNote] = useState(initial.note || '');
  const linked = plan.find((p) => p.id === planItemId);
  // Tiền tệ của khoản này: nhập đúng tiền đã trả, chỉ quy đổi khi tính tổng / chia tiền
  const lastKey = `travel-map-cur-${trip.id}`;
  const [cur, setCur] = useState(() => initial.currency || (curs.includes(localStorage.getItem(lastKey)) ? localStorage.getItem(lastKey) : base));
  useEffect(() => {
    if (initial.currency || !linked || estimateId) return;
    const c = currencyOfCountry(linked.place.country);
    if (c && curs.includes(c)) setCur(c);
  }, [planItemId]); // eslint-disable-line react-hooks/exhaustive-deps
  const finalTitle = title.trim() || (linked ? pName(linked.place) : '');
  const ok = finalTitle && amount > 0 && (type === 'estimate' || (paidBy && people.length));
  const toggle = (id) => setAmong((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const fromEstimate = (e) => {
    setEstimateId(e.id);
    setTitle(e.title);
    setAmount(e.amount);
    setPer(e.per || 'group');
    setCur(e.currency && curs.includes(e.currency) ? e.currency : base);
    setPlanItemId(e.planItemId || '');
    if (e.note) setNote(e.note);
  };
  const chosenEst = estimates.find((e) => e.id === estimateId);
  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    try {
      localStorage.setItem(lastKey, cur);
    } catch {
      /* bỏ qua */
    }
    const common = { type, title: finalTitle, amount, currency: cur, planItemId: planItemId || null, note: note.trim() };
    if (type === 'estimate') onSave({ ...common, per });
    else
      onSave({
        ...common,
        estimateId: estimateId || null,
        per,
        paidBy,
        paidByName: trip.members?.[paidBy]?.name || '',
        splitAmong: who === 'all' || (among.length === memberIds.length && memberIds.every((m) => among.includes(m))) ? [] : among,
        date: date || '',
      });
  };
  const placeSelect = plan.length > 0 && (
    <label className="cf-field">
      <span>📍 {t('cost.placeLabel')}</span>
      <select value={planItemId} onChange={(e) => setPlanItemId(e.target.value)}>
        <option value="">{t('cost.noPlace')}</option>
        {plan.map((p) => (
          <option key={p.id} value={p.id}>
            {p.place.emoji || '📍'} {pName(p.place)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form className="cost-form" onSubmit={submit}>
      {/* Chọn nhanh từ bảng dự kiến */}
      {type === 'actual' && !initial.id && estimates.length > 0 && (
        <div className="cf-pick">
          <span className="small muted">⚡ {t('cost.pickFromEst')}</span>
          <div className="chips chips--wrap">
            {estimates.map((e) => (
              <button key={e.id} type="button" className={`chip chip--sm ${estimateId === e.id ? 'chip--on' : ''}`} onClick={() => fromEstimate(e)}>
                {e.title} · {fmtMoney(e.per === 'person' ? e.amount * n : e.amount, e.currency || base)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="cf-main">
        <label className="cf-field cf-field--grow">
          <span>{t('cost.item')}</span>
          <input maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={linked ? pName(linked.place) : t(`cost.titlePh.${type}`)} maxLength={80} autoFocus={!initial.id} />
        </label>
        <label className="cf-field">
          <span>{t('cost.amount')}</span>
          <div className="cf-amount">
            <MoneyInput value={amount} onChange={setAmount} cur={cur} />
            {curs.length > 1 && (
              <select className="cost-form__cur" value={cur} onChange={(e) => setCur(e.target.value)} aria-label={t('cost.currency')}>
                {curs.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </label>
      </div>
      {chosenEst && amount != null && (
        <small className="muted">
          {t('cost.vsEstimate', { v: `${fmtMoney(chosenEst.amount, chosenEst.currency || base)} / ${chosenEst.per === 'person' ? t('cost.person') : t('cost.group')}` })}
        </small>
      )}
      {type === 'estimate' ? (
        <div className="cf-grid">
          <div className="cf-field">
            <span>{t('cost.calcBy')}</span>
            <Seg value={per} set={setPer} options={[['group', `👥 ${t('cost.perGroup')}`], ['person', `🙋 ${t('cost.perPerson')}`]]} />
          </div>
          {placeSelect}
        </div>
      ) : (
        <div className="cf-grid">
          <label className="cf-field">
            <span>💳 {t('cost.paidBy')}</span>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {memberIds.map((id) => (
                <option key={id} value={id}>
                  {trip.members?.[id]?.name || id}
                  {id === user.uid ? ` (${t('trips.you')})` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="cf-field">
            <span>📅 {t('cost.date')}</span>
            <DateInput value={date} onChange={setDate} ariaLabel={t('cost.date')} />
          </div>
          {placeSelect}
        </div>
      )}
      {type === 'estimate' && amount > 0 && (
        <small className="muted">
          {per === 'group'
            ? t('cost.groupHint', { each: fmtMoney(amount / n, cur), n })
            : t('cost.personHint', { total: fmtMoney(amount * n, cur), n })}
        </small>
      )}
      {type === 'actual' && (
        <div className="cf-grid cf-grid--2">
          <div className="cf-field">
            <span>💵 {t('cost.amountIs')}</span>
            <Seg value={per} set={setPer} options={[['group', `👥 ${t('cost.amountTotal')}`], ['person', `🙋 ${t('cost.perPerson')}`]]} />
          </div>
          <div className="cf-field">
            <span>➗ {t('cost.whoJoined')}</span>
            <Seg value={who} set={setWho} options={[['all', `👥 ${t('cost.wholeGroup', { n })}`], ['some', `👤 ${t('cost.pickPeople')}`]]} />
          </div>
        </div>
      )}
      {type === 'actual' && who === 'some' && (
        <div className="cost-form__split">
          {memberIds.map((id) => (
            <button key={id} type="button" className={`chip chip--sm ${among.includes(id) ? 'chip--on' : ''}`} onClick={() => toggle(id)}>
              {among.includes(id) ? '✓ ' : ''}
              {trip.members?.[id]?.name || id}
              {id === user.uid ? ` (${t('trips.you')})` : ''}
            </button>
          ))}
        </div>
      )}
      {type === 'actual' && amount > 0 && people.length > 0 && (
        <small className="cf-calc">
          {per === 'person'
            ? t('cost.calcPerson', { each: fmtMoney(amount, cur), n: people.length, total: fmtMoney(amount * people.length, cur) })
            : t('cost.calcGroup', { total: fmtMoney(amount, cur), n: people.length, each: fmtMoney(amount / people.length, cur) })}
        </small>
      )}
      <div className="cf-foot">
        <input className="grow" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('cost.notePh')} maxLength={120} />
        <button className="btn btn--primary" disabled={!ok}>
          {initial.id ? `💾 ${t('trip.save')}` : `＋ ${t('cost.add')}`}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
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
  const cur = trip.currency || 'VND'; // tiền quy đổi cuối cùng
  const rates = trip.rates || {};
  const curs = [cur, ...Object.keys(rates).filter((c) => c !== cur)];
  const conv = makeToBase(cur, rates);
  const suggestCurs = [...new Set((trip.destinations || []).map((d) => currencyOfCountry(d.cc)).filter(Boolean))];
  /** Số tiền theo tiền gốc + (≈ quy đổi) nếu là ngoại tệ */
  const Amount = ({ c, value = c.amount, strong }) => {
    const v = <>{fmtMoney(value, c.currency || cur)}</>;
    if (!c.currency || c.currency === cur) return strong ? <b>{v}</b> : v;
    const b = conv(value, c.currency);
    return (
      <span className="amt">
        {strong ? <b>{v}</b> : v}
        <small className={b == null ? 'warn' : 'muted'}>{b == null ? `⚠️ ${t('fx.needRate')}` : `≈ ${fmtMoney(b, cur)}`}</small>
      </span>
    );
  };
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const nameOf = (id, fallback) => trip.members?.[id]?.name || fallback || '—';
  const placeOf = (c) => plan.find((p) => p.id === c.planItemId)?.place;

  const list = costs || [];
  const estimates = list.filter((c) => c.type === 'estimate');
  const actuals = list.filter((c) => c.type === 'actual').sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
  const payments = list.filter((c) => c.type === 'payment');
  // Dự kiến đã được ghi thành chi phí thực tế (qua estimateId)
  const recorded = Object.fromEntries(estimates.map((e) => [e.id, actuals.filter((a) => a.estimateId === e.id)]));
  const openEstimates = estimates.filter((e) => !recorded[e.id]?.length);
  const estPerPerson = estimates.reduce((s, c) => s + perPersonOf(c, n, conv), 0);
  const estGroup = estimates.reduce((s, c) => s + groupTotalOf(c, n, conv), 0);
  const actualTotal = actuals.reduce((s, c) => s + (conv(actualAmountOf(c, memberIds), c.currency) ?? 0), 0);
  const missingRate = list.some((c) => c.currency && c.currency !== cur && conv(1, c.currency) == null);
  const { balances, transfers } = useMemo(() => settle(list, memberIds, cur, conv), [costs, memberIds.join(), cur, JSON.stringify(rates)]); // eslint-disable-line react-hooks/exhaustive-deps

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
      </div>
      <div className="card">
        <CurrencyRates value={{ base: cur, rates }} suggest={suggestCurs} onChange={(v) => api.updateTrip(trip.id, { currency: v.base, rates: v.rates })} />
        {missingRate && <p className="small warn">⚠️ {t('fx.missingWarn')}</p>}
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
        {adding === 'estimate' && <CostForm type="estimate" trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d)} onCancel={() => setAdding(null)} />}
        {estimates.length === 0 && adding !== 'estimate' && <p className="small muted">{t('cost.noEstimates')}</p>}
        {estimates.length > 0 && (
          <div className="cost-table">
            <div className="cost-table__head cost-row--est">
              <span>{t('cost.item')}</span>
              <span>{t('cost.amount')}</span>
              <span>{t('cost.perPersonCol')}</span>
              <span>{t('cost.actualCol')}</span>
              <span />
            </div>
            {estimates.map((c) =>
              editId === c.id ? (
                <CostForm key={c.id} type="estimate" initial={c} trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
              ) : (
                <div key={c.id} className="cost-row cost-row--est">
                  <span className="cost-row__title">
                    <b>{c.title}</b>
                    {(placeOf(c) || c.note) && (
                      <small className="muted">{[placeOf(c) && `📍 ${pName(placeOf(c))}`, c.note].filter(Boolean).join(' · ')}</small>
                    )}
                  </span>
                  <span>
                    <Amount c={c} />
                    <small className="muted"> / {c.per === 'person' ? t('cost.person') : t('cost.group')}</small>
                  </span>
                  <span>{fmtMoney(perPersonOf(c, n, conv), cur)}</span>
                  <span>
                    {recorded[c.id]?.length ? (
                      <span className="est-done" title={t('cost.recordedHelp')}>
                        ✓ {fmtMoney(recorded[c.id].reduce((x, a) => x + (conv(actualAmountOf(a, memberIds), a.currency) ?? 0), 0), cur)}
                      </span>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </span>
                  <span className="cost-row__actions">
                    <button
                      className="icon-btn icon-btn--sm"
                      title={t('cost.toActual')}
                      onClick={() => {
                        setPrefill({ title: c.title, amount: c.amount, per: c.per, currency: c.currency, planItemId: c.planItemId, note: c.note, estimateId: c.id });
                        setAdding('actual');
                      }}
                    >
                      🧾
                    </button>
                    <button className="icon-btn icon-btn--sm" title={t('plan.edit')} onClick={() => setEditId(c.id)}>
                      ✏️
                    </button>
                    <button className="icon-btn icon-btn--sm" title={t('plan.remove')} onClick={() => remove(c)}>
                      <TrashIcon />
                    </button>
                  </span>
                </div>
              ),
            )}
            <div className="cost-row cost-row--est cost-row--total">
              <span>{t('cost.total')}</span>
              <span>{fmtMoney(estGroup, cur)}</span>
              <span>{fmtMoney(estPerPerson, cur)}</span>
              <span className="est-done">{actuals.some((a) => a.estimateId) ? `✓ ${fmtMoney(estimates.reduce((x, e) => x + (recorded[e.id] || []).reduce((y, a) => y + (conv(actualAmountOf(a, memberIds), a.currency) ?? 0), 0), 0), cur)}` : ''}</span>
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
            estimates={openEstimates}
            trip={trip}
            plan={plan}
            cur={cur}
            curs={curs}
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
                <CostForm key={c.id} type="actual" initial={c} trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
              ) : (
                <div key={c.id} className="cost-row cost-row--act">
                  <span className="cost-row__title">
                    <b>{c.title}</b>
                    <small className="muted">
                      {[
                        placeOf(c) && `📍 ${pName(placeOf(c))}`,
                        c.date && formatDate(c.date),
                        c.estimateId && estimates.find((e) => e.id === c.estimateId) && `📝 ${t('cost.fromEstimate')}`,
                        c.note,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                  </span>
                  <span className="amt">
                    <Amount c={c} value={actualAmountOf(c, memberIds)} strong />
                    {c.per === 'person' && (
                      <small className="muted">
                        {fmtMoney(c.amount, c.currency || cur)} × {participantsOf(c, memberIds).length}
                      </small>
                    )}
                  </span>
                  <span className="cost-row__payer">
                    <Avatar name={nameOf(c.paidBy, c.paidByName)} photo={trip.members?.[c.paidBy]?.photo} size={22} />
                    {nameOf(c.paidBy, c.paidByName)}
                  </span>
                  <span className="small" title={participantsOf(c, memberIds).map((id) => nameOf(id)).join(', ')}>
                    {c.splitAmong?.length ? participantsOf(c, memberIds).map((id) => nameOf(id)).join(', ') : t('cost.splitAll')}
                  </span>
                  <span className="cost-row__actions">
                    <button className="icon-btn icon-btn--sm" title={t('plan.edit')} onClick={() => setEditId(c.id)}>
                      ✏️
                    </button>
                    <button className="icon-btn icon-btn--sm" title={t('plan.remove')} onClick={() => remove(c)}>
                      <TrashIcon />
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
