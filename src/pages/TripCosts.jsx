import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Loader, formatDate, TrashIcon } from '../components/ui';
import DateInput from '../components/DateInput';
import { pName, getLang } from '../lib/lang';
import { COST_TYPES, COST_TYPE } from '../data/costTypes';
import { fmtMoney, parseMoney, inputMoney, perPersonOf, groupTotalOf, settle, makeToBase, actualAmountOf, participantsOf } from '../lib/money';
import { currencyOfCountry } from '../lib/rates';
import CurrencyRates from '../components/CurrencyRates';
import { useTripReadOnly } from '../lib/tripAccess';
import { compareCosts, sortByOrder, reorderPatch, moveId, buildCostTable, sortRows, COST_SORTS } from '../lib/costCompare';
import { exportCostsPdf, shareOrDownload, loadJsPdf } from '../lib/exportPlan';
import { reloadOnce } from '../lib/freshness';

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

/**
 * REQ-006: cách tính chi phí dự kiến — Cả nhóm / Mỗi người / Chọn người.
 * Chọn người: bấm chọn những ai tham gia, rồi chọn số tiền là tổng (chia đều cho họ) hay cho mỗi người.
 */
function EstimateSplit({ mode, setMode, per, setPer, among, setAmong, trip, amount, cur, allowPick }) {
  const { t } = useI18n();
  const { user } = useApp();
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const k = mode === 'pick' ? among.length : n;
  const toggle = (id) => setAmong((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const each = mode === 'person' || (mode === 'pick' && per === 'person');
  return (
    <div className="stack-sm est-split">
      <Seg
        value={mode}
        set={setMode}
        options={[
          ['group', `👥 ${t('cost.perGroup')}`],
          ['person', `🙋 ${t('cost.perPerson')}`],
          ...(allowPick || mode === 'pick' ? [['pick', `👤 ${t('cost.pickPeople')}`]] : []),
        ]}
      />
      {mode === 'pick' && (
        <>
          <div className="cost-form__split">
            {memberIds.map((id) => (
              <button key={id} type="button" className={`chip chip--sm ${among.includes(id) ? 'chip--on' : ''}`} onClick={() => toggle(id)}>
                {among.includes(id) ? '✓ ' : ''}
                {trip.members?.[id]?.name || id}
                {id === user?.uid ? ` (${t('trips.you')})` : ''}
              </button>
            ))}
          </div>
          <Seg value={per} set={setPer} options={[['group', `💵 ${t('est.total')}`], ['person', `🙋 ${t('cost.perPerson')}`]]} />
        </>
      )}
      {amount > 0 && k > 0 && (
        <small className="muted">
          {mode === 'pick'
            ? each
              ? t('est.hintEach', { total: fmtMoney(amount * k, cur), n: k })
              : t('est.hintTotal', { each: fmtMoney(amount / k, cur), n: k })
            : each
              ? t('cost.personHint', { total: fmtMoney(amount * k, cur), n: k })
              : t('cost.groupHint', { each: fmtMoney(amount / k, cur), n: k })}
        </small>
      )}
      {mode === 'pick' && !among.length && <small className="warn">{t('est.pickOne')}</small>}
    </div>
  );
}
const estModeOf = (c) => (c.splitAmong?.length ? 'pick' : c.per || 'group');
/** Ghi chú ngắn cho 1 khoản dự kiến: "mỗi người · An, Bình" */
const estPerLabel = (c, t, nameOf) => {
  const base = c.per === 'person' ? t('ct.perPerson') : t('ct.perGroup');
  return c.splitAmong?.length ? `${c.per === 'person' ? t('ct.perPerson') : t('est.splitBetween')} · ${c.splitAmong.map((id) => nameOf(id)).join(', ')}` : base;
};

/* ------------------------------------------------------------------ */
/* Form thêm / sửa 1 khoản chi (dự kiến hoặc thực tế)                  */
/* ------------------------------------------------------------------ */
/** REQ-031: optional cost type picker */
function CostTypeSelect({ value, onChange }) {
  const { t, lang } = useI18n();
  return (
    <label className="cf-field">
      <span>🏷️ {t('cost.typeLabel')}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('cost.typeNone')}</option>
        {COST_TYPES.map((x) => (
          <option key={x.key} value={x.key}>
            {x.icon} {x[lang] || x.vi}
          </option>
        ))}
      </select>
    </label>
  );
}
/** Icon + name of a cost's type, for the cost lists ('' when none or the feature is off) */
function useCostTypeText() {
  const { lang } = useI18n();
  const { can } = useApp();
  const on = can('costType');
  return (c) => (on && c?.costType ? `${COST_TYPE[c.costType]?.icon || '🏷️'} ${COST_TYPE[c.costType]?.[lang] || COST_TYPE[c.costType]?.vi || c.costType}` : '');
}

function CostForm({ type, initial = {}, trip, plan, cur: base, curs, estimates = [], onSave, onCancel }) {
  const { t } = useI18n();
  const { user, can } = useApp();
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const [title, setTitle] = useState(initial.title || '');
  const [amount, setAmount] = useState(initial.amount ?? null);
  const [per, setPer] = useState(initial.per || 'group');
  const [estMode, setEstMode] = useState(estModeOf(initial));
  const [planItemId, setPlanItemId] = useState(initial.planItemId || '');
  const [estimateId, setEstimateId] = useState(initial.estimateId || '');
  const [paidBy, setPaidBy] = useState(initial.paidBy || user.uid);
  const [among, setAmong] = useState(initial.splitAmong?.length ? initial.splitAmong : memberIds);
  // Ai tham gia khoản chi: cả nhóm hoặc chọn từng người
  const [who, setWho] = useState(initial.splitAmong?.length ? 'some' : 'all');
  const people = who === 'all' ? memberIds : among;
  const [date, setDate] = useState(initial.date || '');
  const [note, setNote] = useState(initial.note || '');
  const [costType, setCostType] = useState(initial.costType || '');
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
  const ok = finalTitle && amount > 0 && (type === 'estimate' ? estMode !== 'pick' || among.length > 0 : paidBy && people.length);
  const toggle = (id) => setAmong((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const fromEstimate = (e) => {
    setEstimateId(e.id);
    setTitle(e.title);
    setAmount(e.amount);
    setPer(e.per || 'group');
    if (e.splitAmong?.length) {
      setAmong(e.splitAmong);
      setWho('some');
    }
    setCur(e.currency && curs.includes(e.currency) ? e.currency : base);
    setPlanItemId(e.planItemId || '');
    if (e.note) setNote(e.note);
    if (e.costType) setCostType(e.costType);
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
    const common = { type, title: finalTitle, amount, currency: cur, planItemId: planItemId || null, note: note.trim(), costType: costType || null };
    if (type === 'estimate')
      onSave({ ...common, per: estMode === 'pick' ? per : estMode, splitAmong: estMode === 'pick' ? among : [] });
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
            <EstimateSplit mode={estMode} setMode={setEstMode} per={per} setPer={setPer} among={among} setAmong={setAmong} trip={trip} amount={amount} cur={cur} allowPick={can('costPickPeople')} />
          </div>
          {placeSelect}
          {can('costType') && <CostTypeSelect value={costType} onChange={setCostType} />}
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
          {can('costType') && <CostTypeSelect value={costType} onChange={setCostType} />}
        </div>
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
/* REQ-004: thêm 1 khoản chi — nhập dự kiến, thực tế hoặc cả hai 1 lần */
/* ------------------------------------------------------------------ */
function CostItemForm({ trip, plan, cur: base, curs, onSave, onCancel }) {
  const { t } = useI18n();
  const { user } = useApp();
  const memberIds = trip.memberIds || [];
  const n = Math.max(memberIds.length, 1);
  const lastKey = `travel-map-cur-${trip.id}`;
  const firstCur = curs.includes(localStorage.getItem(lastKey)) ? localStorage.getItem(lastKey) : base;
  const [title, setTitle] = useState('');
  const [planItemId, setPlanItemId] = useState('');
  const [note, setNote] = useState('');
  const [costType, setCostType] = useState('');
  const [hasEst, setHasEst] = useState(true);
  const [estAmount, setEstAmount] = useState(null);
  const [estCur, setEstCur] = useState(firstCur);
  const [estPer, setEstPer] = useState('group');
  const [estMode, setEstMode] = useState('group');
  const [estAmong, setEstAmong] = useState(memberIds);
  const { can } = useApp();
  const [hasAct, setHasAct] = useState(false);
  const [actAmount, setActAmount] = useState(null);
  const [actCur, setActCur] = useState(firstCur);
  const [actPer, setActPer] = useState('group');
  const [paidBy, setPaidBy] = useState(user.uid);
  const [date, setDate] = useState('');
  const [who, setWho] = useState('all');
  const [among, setAmong] = useState(memberIds);
  const people = who === 'all' ? memberIds : among;
  const linked = plan.find((p) => p.id === planItemId);
  const finalTitle = title.trim() || (linked ? pName(linked.place) : '');
  const ok = finalTitle && (hasEst || hasAct) && (!hasEst || (estAmount > 0 && (estMode !== 'pick' || estAmong.length))) && (!hasAct || (actAmount > 0 && paidBy && people.length));
  const toggle = (id) => setAmong((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const curSel = (value, set) =>
    curs.length > 1 ? (
      <select className="cost-form__cur" value={value} onChange={(e) => set(e.target.value)} aria-label={t('cost.currency')}>
        {curs.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    ) : null;
  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    try {
      localStorage.setItem(lastKey, hasAct ? actCur : estCur);
    } catch {
      /* bỏ qua */
    }
    const common = { title: finalTitle, planItemId: planItemId || null, note: note.trim(), costType: costType || null };
    onSave({
      estimate: hasEst
        ? { ...common, type: 'estimate', amount: estAmount, currency: estCur, per: estMode === 'pick' ? estPer : estMode, splitAmong: estMode === 'pick' ? estAmong : [] }
        : null,
      actual: hasAct
        ? {
            ...common,
            type: 'actual',
            amount: actAmount,
            currency: actCur,
            per: actPer,
            paidBy,
            paidByName: trip.members?.[paidBy]?.name || '',
            splitAmong: who === 'all' || (among.length === memberIds.length && memberIds.every((m) => among.includes(m))) ? [] : among,
            date: date || '',
          }
        : null,
    });
  };
  return (
    <form className="cost-form cost-item-form" onSubmit={submit}>
      <div className="cf-main">
        <label className="cf-field cf-field--grow">
          <span>{t('cost.item')}</span>
          <input maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={linked ? pName(linked.place) : t('cost.titlePh.estimate')} autoFocus />
        </label>
        {plan.length > 0 && (
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
        )}
        {can('costType') && <CostTypeSelect value={costType} onChange={setCostType} />}
      </div>
      <div className="cif-parts">
        <fieldset className={`cif-part ${hasEst ? '' : 'is-off'}`}>
          <label className="switch small cif-part__head">
            <input type="checkbox" checked={hasEst} onChange={(e) => setHasEst(e.target.checked)} />
            <span>📝 {t('ct.estimatePart')}</span>
          </label>
          {hasEst && (
            <>
              <div className="cf-amount">
                <MoneyInput value={estAmount} onChange={setEstAmount} cur={estCur} />
                {curSel(estCur, setEstCur)}
              </div>
              <EstimateSplit mode={estMode} setMode={setEstMode} per={estPer} setPer={setEstPer} among={estAmong} setAmong={setEstAmong} trip={trip} amount={estAmount} cur={estCur} allowPick={can('costPickPeople')} />
            </>
          )}
        </fieldset>
        <fieldset className={`cif-part ${hasAct ? '' : 'is-off'}`}>
          <label className="switch small cif-part__head">
            <input
              type="checkbox"
              checked={hasAct}
              onChange={(e) => {
                setHasAct(e.target.checked);
                if (e.target.checked && actAmount == null && estAmount) {
                  setActAmount(estAmount);
                  setActCur(estCur);
                  setActPer(estMode === 'pick' ? estPer : estMode);
                  if (estMode === 'pick' && estAmong.length) {
                    setAmong(estAmong);
                    setWho('some');
                  }
                }
              }}
            />
            <span>🧾 {t('ct.actualPart')}</span>
          </label>
          {hasAct ? (
            <>
              <div className="cf-amount">
                <MoneyInput value={actAmount} onChange={setActAmount} cur={actCur} />
                {curSel(actCur, setActCur)}
              </div>
              <Seg value={actPer} set={setActPer} options={[['group', `👥 ${t('cost.amountTotal')}`], ['person', `🙋 ${t('cost.perPerson')}`]]} />
              <div className="cf-grid cf-grid--2">
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
              </div>
              <Seg value={who} set={setWho} options={[['all', `👥 ${t('cost.wholeGroup', { n })}`], ['some', `👤 ${t('cost.pickPeople')}`]]} />
              {who === 'some' && (
                <div className="cost-form__split">
                  {memberIds.map((id) => (
                    <button key={id} type="button" className={`chip chip--sm ${among.includes(id) ? 'chip--on' : ''}`} onClick={() => toggle(id)}>
                      {among.includes(id) ? '✓ ' : ''}
                      {trip.members?.[id]?.name || id}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <small className="muted">{t('ct.actualLater')}</small>
          )}
        </fieldset>
      </div>
      <div className="cf-foot">
        <input className="grow" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('cost.notePh')} maxLength={120} />
        <button className="btn btn--primary" disabled={!ok}>
          ＋ {t('cost.add')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t('pick.cancel')}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* REQ-003: kéo thả để sắp xếp khoản chi (chuột & cảm ứng, phím ↑ ↓)   */
/* ------------------------------------------------------------------ */
function useDragOrder(items, onCommit) {
  // REQ-008 (sửa lỗi): theo dõi con trỏ trên cả cửa sổ (không phụ thuộc vào nút đang bị React di chuyển trong DOM),
  // và giữ thứ tự mới trên màn hình cho tới khi máy chủ trả về đúng thứ tự đó (không bị nhảy về chỗ cũ).
  const [drag, setDrag] = useState(null); // { id, ids }
  const [held, setHeld] = useState(null); // thứ tự vừa lưu, chờ máy chủ xác nhận
  const ref = useRef(null);
  const dragRef = useRef(null);
  const cur = items.map((x) => x.id);
  const curKey = cur.join();
  useEffect(() => {
    if (!held) return undefined;
    if (held.join() === curKey) return setHeld(null), undefined;
    const tm = setTimeout(() => setHeld(null), 4000);
    return () => clearTimeout(tm);
  }, [curKey, held]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownIds = drag ? drag.ids : held && held.length === cur.length && held.every((id) => cur.includes(id)) ? held : cur;
  const ordered = shownIds.map((id) => items.find((x) => x.id === id)).filter(Boolean);
  const commit = (ids) => {
    if (ids.join() === curKey) return;
    setHeld(ids);
    onCommit(ids);
  };
  const start = (e, id) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { id, ids: shownIds };
    setDrag(dragRef.current);
    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d || !ref.current) return;
      ev.preventDefault?.();
      const rows = [...ref.current.querySelectorAll('[data-sort-id]')].filter((r) => r.dataset.sortId !== d.id);
      const to = rows.filter((r) => {
        const b = r.getBoundingClientRect();
        return b.top + b.height / 2 < ev.clientY;
      }).length;
      const next = moveId(d.ids, d.id, to);
      if (next.join() !== d.ids.join()) {
        dragRef.current = { ...d, ids: next };
        setDrag(dragRef.current);
      }
      // tự cuộn khi kéo gần mép trên / dưới màn hình
      if (ev.clientY < 70) window.scrollBy(0, -12);
      else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (d) commit(d.ids);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  const handle = (id) => ({
    onPointerDown: (e) => start(e, id),
    onKeyDown: (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const j = shownIds.indexOf(id) + (e.key === 'ArrowUp' ? -1 : 1);
      if (j >= 0 && j < shownIds.length) commit(moveId(shownIds, id, j));
    },
  });
  /** ↑ / ↓: dời 1 bậc (cách sắp xếp dễ hơn kéo thả, nhất là trên điện thoại) */
  const step = (id, dir) => {
    const j = shownIds.indexOf(id) + dir;
    if (j >= 0 && j < shownIds.length) commit(moveId(shownIds, id, j));
  };
  return { ref, ordered, ids: shownIds, dragId: drag?.id, handle, step, commit };
}

/* ------------------------------------------------------------------ */
/* REQ-002: so sánh dự kiến và thực tế trong 1 bảng                    */
/* ------------------------------------------------------------------ */
function CostCompare({ costs, cur, estTotal, actTotal }) {
  const { t } = useI18n();
  const r = useMemo(() => compareCosts(costs, { estTotal, actTotal, eps: 0.5 }), [costs, estTotal, actTotal]);
  if (!r.rows.length && !r.unplanned.length) return null;
  const pct = (v) => `${Math.max(0, Math.min(100, (v / r.max) * 100))}%`;
  const Diff = ({ v, status }) =>
    status === 'pending' ? (
      <span className="cmp-diff cmp-diff--pending">{t('cmp.pending')}</span>
    ) : (
      <span className={`cmp-diff cmp-diff--${v > 0.5 ? 'over' : v < -0.5 ? 'under' : 'even'}`}>
        {v > 0.5 ? '▲ +' : v < -0.5 ? '▼ −' : '='} {Math.abs(v) > 0.5 ? fmtMoney(Math.abs(v), cur) : t('cmp.even')}
      </span>
    );
  const tot = r.totals;
  return (
    <div className="card stack-sm cmp">
      <div className="trip-summary__head">
        <h3 className="h3">📊 {t('cmp.title')}</h3>
        <span className="cmp-legend small">
          <i className="cmp-key cmp-key--plan" /> {t('cmp.planned')} <i className="cmp-key cmp-key--act" /> {t('cmp.actual')}
        </span>
      </div>
      {r.rows.length > 0 && (
        <ul className="cmp-list">
          {r.rows.map((x) => (
            <li key={x.id} className={`cmp-row cmp-row--${x.status}`}>
              <div className="cmp-row__top">
                <b className="cmp-row__title">{x.title}</b>
                <Diff v={x.diff} status={x.status} />
              </div>
              <div className="cmp-bars">
                <span className="cmp-bar cmp-bar--plan" style={{ width: pct(x.planned) }} />
                <span className="cmp-bar cmp-bar--act" style={{ width: pct(x.actual) }} />
              </div>
              <small className="muted">
                {t('cmp.planned')} {fmtMoney(x.planned, cur)} · {t('cmp.actual')} {x.status === 'pending' ? '—' : fmtMoney(x.actual, cur)}
              </small>
            </li>
          ))}
        </ul>
      )}
      {r.unplanned.length > 0 && (
        <div className="cmp-extra">
          <div className="cmp-row__top">
            <b>⚠️ {t('cmp.unplanned', { n: r.unplanned.length })}</b>
            <span className="cmp-diff cmp-diff--over">+ {fmtMoney(tot.unplanned, cur)}</span>
          </div>
          <small className="muted">{t('cmp.unplannedHint')}</small>
          <ul className="cmp-extra__list">
            {r.unplanned.map((u) => (
              <li key={u.id}>
                <span>
                  {u.title}
                  {u.date && <small className="muted"> · {formatDate(u.date)}</small>}
                </span>
                <b>{fmtMoney(u.actual, cur)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="cmp-total">
        <span>
          <small>{t('cmp.planned')}</small>
          <b>{fmtMoney(tot.planned, cur)}</b>
        </span>
        <span>
          <small>{t('cmp.actualAll')}</small>
          <b>{fmtMoney(tot.actual, cur)}</b>
        </span>
        <span>
          <small>{t('cost.diff')}</small>
          <Diff v={tot.diff} status={tot.actual ? 'done' : 'pending'} />
        </span>
      </div>
      {tot.pending > 0 && <small className="muted">⏳ {t('cmp.pendingNote', { v: fmtMoney(tot.pending, cur) })}</small>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trang Chi phí của chuyến đi                                         */
/* ------------------------------------------------------------------ */
export default function TripCosts({ trip }) {
  const { t } = useI18n();
  const { api, user, notify, can } = useApp();
  const typeText = useCostTypeText();
  const ro = useTripReadOnly();
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
  // REQ-003: thứ tự do người dùng kéo thả (trường order); chưa sắp thì dự kiến theo lúc thêm, thực tế theo ngày chi
  const estimates = sortByOrder(list.filter((c) => c.type === 'estimate'));
  const actuals = sortByOrder(
    list.filter((c) => c.type === 'actual'),
    (a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0),
  );
  const payments = list.filter((c) => c.type === 'payment');
  // Dự kiến đã được ghi thành chi phí thực tế (qua estimateId)
  const recorded = Object.fromEntries(estimates.map((e) => [e.id, actuals.filter((a) => a.estimateId === e.id)]));
  const openEstimates = estimates.filter((e) => !recorded[e.id]?.length);
  const estGroup = estimates.reduce((s, c) => s + groupTotalOf(c, n, conv), 0);
  // Trung bình mỗi người (khoản chỉ áp dụng cho vài người vẫn được tính vào tổng nhóm)
  const estPerPerson = estGroup / n;
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

  // Xuất PDF chi phí (dữ liệu mới nhất đang hiển thị)
  const [exporting, setExporting] = useState(false);
  const pdfOn = can('tripCostsPdf');
  useEffect(() => {
    if (pdfOn) loadJsPdf().catch(() => {});
  }, [pdfOn]);
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    !!navigator.canShare &&
    (() => {
      try {
        return navigator.canShare({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] });
      } catch {
        return false;
      }
    })();
  const doExport = async (share) => {
    setExporting(true);
    try {
      const file = await exportCostsPdf(trip, costs || [], plan, { order: shownRows.map((r) => r.id) });
      const r = await shareOrDownload(file, { preferShare: share });
      if (r === 'downloaded') notify(t('pdf.downloaded', { name: file.name }));
    } catch (e) {
      if (e.stale) {
        notify(t('update.reloading'));
        setTimeout(() => reloadOnce() || notify(t('pdf.error', { msg: e.message }), 'error'), 1200);
      } else notify(t('pdf.error', { msg: e.message }), 'error');
    }
    setExporting(false);
  };

  const canSort = !ro && can('costReorder');
  // REQ-004: bảng chi phí gộp (dự kiến + thực tế + chênh lệch trên cùng 1 dòng)
  const tableOn = can('costTable');
  const commitOrder = (items) => (ids) => api.reorderCosts(trip.id, reorderPatch(items, ids)).catch((e) => notify(e.message, 'error'));
  const estDrag = useDragOrder(estimates, commitOrder(estimates));
  const actDrag = useDragOrder(actuals, commitOrder(actuals));
  const estTotalFn = useMemo(() => (c) => groupTotalOf(c, n, conv), [n, cur, JSON.stringify(rates)]); // eslint-disable-line react-hooks/exhaustive-deps
  const actTotalFn = useMemo(() => (c) => conv(actualAmountOf(c, memberIds), c.currency) ?? 0, [memberIds.join(), cur, JSON.stringify(rates)]); // eslint-disable-line react-hooks/exhaustive-deps
  const table = useMemo(() => buildCostTable(list, { estTotal: estTotalFn, actTotal: actTotalFn }), [list, estTotalFn, actTotalFn]);
  const topCosts = table.rows.map((r) => r.cost);
  const rowDrag = useDragOrder(topCosts, commitOrder(topCosts));
  const [addingItem, setAddingItem] = useState(false);
  // REQ-008: cách xem thứ tự (chỉ trên máy này); 'manual' = thứ tự chung của nhóm
  const sortOn = can('costSort');
  const sortKey = `travel-map-cost-sort-${trip.id}`;
  const [viewSort, setViewSortState] = useState(() => {
    try {
      const v = localStorage.getItem(sortKey);
      return COST_SORTS.includes(v) ? v : 'manual';
    } catch {
      return 'manual';
    }
  });
  const sortMode = sortOn ? viewSort : 'manual';
  const setViewSort = (v) => {
    setViewSortState(v);
    try {
      localStorage.setItem(sortKey, v);
    } catch {
      /* bỏ qua */
    }
  };
  const byId = new Map(table.rows.map((r) => [r.id, r]));
  const shownRows = sortMode === 'manual' ? rowDrag.ordered.map((c) => byId.get(c.id)).filter(Boolean) : sortRows(table.rows, sortMode);
  const canMove = canSort && sortMode === 'manual';
  const [actFor, setActFor] = useState(null); // id dự kiến đang ghi thêm chi phí thực tế
  const saveItem = async ({ estimate, actual }) => {
    try {
      let estId = null;
      if (estimate) estId = (await api.addCost(user, trip.id, estimate))?.id || null;
      if (actual) await api.addCost(user, trip.id, { ...actual, estimateId: estId });
      notify(t('cost.saved'));
      setAddingItem(false);
    } catch (e) {
      notify(e.message, 'error');
    }
  };
  const diffEl = (r) =>
    r.status === 'pending' ? (
      <span className="cmp-diff cmp-diff--pending">{t('cmp.pending')}</span>
    ) : r.status === 'extra' ? (
      <span className="cmp-diff cmp-diff--over">+ {fmtMoney(r.actual, cur)}</span>
    ) : (
      <span className={`cmp-diff cmp-diff--${r.status}`}>
        {r.status === 'over' ? '▲ +' : r.status === 'under' ? '▼ −' : '='} {r.status === 'even' ? t('cmp.even') : fmtMoney(Math.abs(r.diff), cur)}
      </span>
    );
  const handleEl = (drag, id) =>
    canSort ? (
      <button type="button" className="check-handle cost-handle" aria-label={t('check.reorder')} title={t('cmp.dragHint')} {...drag.handle(id)}>
        ⠿
      </button>
    ) : null;

  // REQ-026: itinerary + costs as an Excel workbook
  const excelOn = can('tripExcel');
  const [excelBusy, setExcelBusy] = useState(false);
  const doExcel = async () => {
    setExcelBusy(true);
    try {
      const { exportTripExcel } = await import('../lib/tripExcel.js');
      const r = await exportTripExcel(trip, plan, costs || [], { lang: getLang(), transfers, placeName: pName });
      if (r === 'downloaded') notify(t('excel.downloaded'));
    } catch (e) {
      notify(t('excel.error', { msg: e.message }), 'error');
    }
    setExcelBusy(false);
  };

  if (!costs) return <Loader />;
  return (
    <section className="stack costs">
      {(pdfOn || excelOn) && list.length > 0 && (
        <div className="costs-export" title={t('pdf.costsHint')}>
          {pdfOn && (
          <button className="btn btn--sm btn--primary" onClick={() => doExport(false)} disabled={exporting}>
            {exporting ? `⏳ ${t('pdf.making')}` : `📄 ${t('pdf.export')}`}
          </button>
          )}
          {pdfOn && canShareFiles && (
            <button className="btn btn--sm btn--outline" onClick={() => doExport(true)} disabled={exporting}>
              📤 {t('pdf.share')}
            </button>
          )}
          {excelOn && (
            <button className="btn btn--sm btn--outline" onClick={doExcel} disabled={excelBusy}>
              {excelBusy ? `⏳ ${t('excel.making')}` : `📊 ${t('excel.export')}`}
            </button>
          )}
        </div>
      )}
      {/* Tổng quan (REQ-010): chênh lệch chỉ tính trên các khoản đã chi + phát sinh, không trừ phần dự kiến chưa chi */}
      <div className="cost-summary">
        <div className="cost-stat">
          <small>{t('sum.planned', { n })}</small>
          <b>{fmtMoney(table.totals.planned, cur)}</b>
          <em>{t('sum.perPerson', { v: fmtMoney(estPerPerson, cur) })}</em>
        </div>
        <div className="cost-stat">
          <small>{t('cost.actualTotal')}</small>
          <b>{fmtMoney(table.totals.actual, cur)}</b>
          {table.totals.extra > 0 && <em>{t('sum.inclExtra', { v: fmtMoney(table.totals.extra, cur) })}</em>}
        </div>
        <div className={`cost-stat ${table.totals.spentDiff > 0.5 ? 'is-over' : table.totals.spentDiff < -0.5 ? 'is-under' : ''}`}>
          <small>{t('sum.diff')}</small>
          <b>
            {table.totals.actual > 0
              ? `${table.totals.spentDiff > 0.5 ? '+' : table.totals.spentDiff < -0.5 ? '−' : ''}${fmtMoney(Math.abs(table.totals.spentDiff), cur)}`
              : '—'}
          </b>
          <em>{table.totals.actual > 0 ? t('sum.diffHint', { v: fmtMoney(table.totals.spentPlanned, cur) }) : t('sum.noActual')}</em>
        </div>
        <div className="cost-stat">
          <small>{t('sum.pending')}</small>
          <b>{fmtMoney(table.totals.pending, cur)}</b>
          <em>{t('sum.pendingHint')}</em>
        </div>
      </div>
      {!ro && (
      <div className="card">
        <CurrencyRates value={{ base: cur, rates }} suggest={suggestCurs} onChange={(v) => api.updateTrip(trip.id, { currency: v.base, rates: v.rates })} />
        {missingRate && <p className="small warn">⚠️ {t('fx.missingWarn')}</p>}
      </div>
      )}

      {tableOn ? (
        <div className="card stack-sm">
          <div className="trip-summary__head">
            <h3 className="h3">💰 {t('ct.title')}</h3>
            {!ro && !addingItem && (
              <button className="btn btn--sm btn--primary" onClick={() => setAddingItem(true)}>
                ＋ {t('ct.add')}
              </button>
            )}
          </div>
          {sortOn && table.rows.length > 1 && (
            <div className="ct-sortbar">
              <label className="ct-sortbar__pick">
                <span>↕️ {t('sort.label')}</span>
                <select value={viewSort} onChange={(e) => setViewSort(e.target.value)}>
                  {COST_SORTS.map((k) => (
                    <option key={k} value={k}>
                      {t(`sort.${k}`)}
                    </option>
                  ))}
                </select>
              </label>
              {sortMode !== 'manual' && !ro && (
                <button className="btn btn--sm btn--soft" onClick={() => (rowDrag.commit(shownRows.map((r) => r.id)), setViewSort('manual'), notify(t('sort.saved')))}>
                  📌 {t('sort.saveAsGroup')}
                </button>
              )}
              <small className="muted">{sortMode === 'manual' ? (canMove ? t('sort.manualHint') : '') : t('sort.viewHint')}</small>
            </div>
          )}
          {addingItem && <CostItemForm trip={trip} plan={plan} cur={cur} curs={curs} onSave={saveItem} onCancel={() => setAddingItem(false)} />}
          {table.rows.length === 0 && !addingItem && <p className="small muted">{t('ct.empty')}</p>}
          {table.rows.length > 0 && (
            <div className={`cost-table ct ${rowDrag.dragId ? 'is-sorting' : ''}`} ref={rowDrag.ref}>
              <div className="cost-table__head ct-row">
                <span>{t('cost.item')}</span>
                <span>{t('cmp.planned')}</span>
                <span>{t('cmp.actual')}</span>
                <span>{t('ct.diff')}</span>
                <span />
              </div>
              {shownRows.map((r, idx) => {
                const c = r.cost;
                const pct = r.planned ? Math.min(100, (r.actual / r.planned) * 100) : r.actual ? 100 : 0;
                return (
                  <div key={r.id} data-sort-id={r.id} className={`ct-item ct-item--${r.status} ${rowDrag.dragId === r.id ? 'is-dragging' : ''}`}>
                    {editId === c.id ? (
                      <CostForm type={c.type} initial={c} estimates={estimates} trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
                    ) : (
                      <div className={`cost-row ct-row ${canSort ? 'cost-row--sortable' : ''}`}>
                        <span className="cost-row__title">
                          {canMove && handleEl(rowDrag, r.id)}
                          <b>
                            {c.title}
                            {r.kind === 'extra' && <em className="ct-tag">{t('ct.extra')}</em>}
                          </b>
                          {(typeText(c) || placeOf(c) || c.note) && <small className="muted">{[typeText(c), placeOf(c) && `📍 ${pName(placeOf(c))}`, c.note].filter(Boolean).join(' · ')}</small>}
                        </span>
                        <span className="ct-cell" data-label={t('cmp.planned')}>
                          {r.kind === 'item' ? (
                            <>
                              <Amount c={c} />
                              <small className="muted">{estPerLabel(c, t, nameOf)}</small>
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </span>
                        <span className="ct-cell" data-label={t('cmp.actual')}>
                          {r.actuals.length ? <b>{fmtMoney(r.actual, cur)}</b> : <span className="muted">—</span>}
                          {r.kind === 'item' && r.actuals.length > 0 && (
                            <span className="ct-bar">
                              <i style={{ width: `${pct}%` }} />
                            </span>
                          )}
                        </span>
                        <span className="ct-cell" data-label={t('ct.diff')}>
                          {diffEl(r)}
                        </span>
                        <span className={`cost-row__actions ${ro ? 'is-hidden' : ''}`}>
                          {canMove && (
                            <span className="ct-steps">
                              <button className="icon-btn icon-btn--sm" title={t('plan.up')} aria-label={t('plan.up')} disabled={idx === 0} onClick={() => rowDrag.step(r.id, -1)}>
                                ↑
                              </button>
                              <button className="icon-btn icon-btn--sm" title={t('plan.down')} aria-label={t('plan.down')} disabled={idx === shownRows.length - 1} onClick={() => rowDrag.step(r.id, 1)}>
                                ↓
                              </button>
                            </span>
                          )}
                          {r.kind === 'item' && (
                            <button className="icon-btn icon-btn--sm" title={t('ct.addActual')} onClick={() => setActFor(actFor === c.id ? null : c.id)}>
                              🧾
                            </button>
                          )}
                          <button className="icon-btn icon-btn--sm" title={t('plan.edit')} onClick={() => setEditId(c.id)}>
                            ✏️
                          </button>
                          <button className="icon-btn icon-btn--sm" title={t('plan.remove')} onClick={() => remove(c)}>
                            <TrashIcon />
                          </button>
                        </span>
                      </div>
                    )}
                    {/* Các lần chi thực tế (ai trả, chia cho ai) */}
                    {r.actuals.length > 0 && (
                      <ul className="ct-pays">
                        {r.actuals.map((a) =>
                          editId === a.id && r.kind === 'item' ? (
                            <li key={a.id}>
                              <CostForm type="actual" initial={a} estimates={estimates} trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d, a.id)} onCancel={() => setEditId(null)} />
                            </li>
                          ) : (
                            <li key={a.id}>
                              <span className="ct-pays__who">
                                🧾 {a.date ? `${formatDate(a.date)} · ` : ''}
                                {t('ct.paidBy', { name: nameOf(a.paidBy, a.paidByName) })}
                                {' · '}
                                {a.splitAmong?.length ? participantsOf(a, memberIds).map((id) => nameOf(id)).join(', ') : t('cost.splitAll')}
                                {r.kind === 'item' && a.title && a.title !== c.title && <em> · {a.title}</em>}
                              </span>
                              <span className="ct-pays__amt">
                                <Amount c={a} value={actualAmountOf(a, memberIds)} />
                              </span>
                              {r.kind === 'item' && !ro && (
                                <span className="cost-row__actions">
                                  <button className="icon-btn icon-btn--sm" title={t('plan.edit')} onClick={() => setEditId(a.id)}>
                                    ✏️
                                  </button>
                                  <button className="icon-btn icon-btn--sm" title={t('plan.remove')} onClick={() => remove(a)}>
                                    <TrashIcon />
                                  </button>
                                </span>
                              )}
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                    {actFor === c.id && (
                      <CostForm
                        type="actual"
                        initial={{ title: c.title, amount: c.amount, per: c.per, currency: c.currency, planItemId: c.planItemId, note: c.note, estimateId: c.id, splitAmong: c.splitAmong || [] }}
                        trip={trip}
                        plan={plan}
                        cur={cur}
                        curs={curs}
                        onSave={(d) => save({ ...d, estimateId: c.id }).then(() => setActFor(null))}
                        onCancel={() => setActFor(null)}
                      />
                    )}
                  </div>
                );
              })}
              <div className="cost-row ct-row cost-row--total">
                <span>{t('cost.total')}</span>
                <span className="ct-cell" data-label={t('cmp.planned')}>{fmtMoney(table.totals.planned, cur)}</span>
                <span className="ct-cell" data-label={t('cmp.actual')}>{fmtMoney(table.totals.actual, cur)}</span>
                <span className="ct-cell" data-label={t('ct.diff')}>
                  {table.totals.actual ? diffEl({ status: table.totals.spentDiff > 0.5 ? 'over' : table.totals.spentDiff < -0.5 ? 'under' : 'even', diff: table.totals.spentDiff }) : <span className="muted">—</span>}
                </span>
                <span />
              </div>
              {(table.totals.extra > 0 || table.totals.pending > 0) && (
                <small className="muted ct-notes">
                  {table.totals.extra > 0 && <>⚠️ {t('ct.extraNote', { v: fmtMoney(table.totals.extra, cur) })} </>}
                  {table.totals.pending > 0 && <>⏳ {t('cmp.pendingNote', { v: fmtMoney(table.totals.pending, cur) })}</>}
                </small>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
      {can('costCompare') && <CostCompare costs={list} cur={cur} estTotal={estTotalFn} actTotal={actTotalFn} />}

      {/* Dự kiến */}
      <div className="card stack-sm">
        <div className="trip-summary__head">
          <h3 className="h3">📝 {t('cost.estimates')}</h3>
          {!ro && adding !== 'estimate' && (
            <button className="btn btn--sm btn--soft" onClick={() => setAdding('estimate')}>
              ＋ {t('cost.addEstimate')}
            </button>
          )}
        </div>
        {adding === 'estimate' && <CostForm type="estimate" trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d)} onCancel={() => setAdding(null)} />}
        {estimates.length === 0 && adding !== 'estimate' && <p className="small muted">{t('cost.noEstimates')}</p>}
        {estimates.length > 0 && (
          <div className={`cost-table ${estDrag.dragId ? 'is-sorting' : ''}`} ref={estDrag.ref}>
            <div className="cost-table__head cost-row--est">
              <span>{t('cost.item')}</span>
              <span>{t('cost.amount')}</span>
              <span>{t('cost.perPersonCol')}</span>
              <span>{t('cost.actualCol')}</span>
              <span />
            </div>
            {estDrag.ordered.map((c) =>
              editId === c.id ? (
                <CostForm key={c.id} type="estimate" initial={c} trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
              ) : (
                <div key={c.id} data-sort-id={c.id} className={`cost-row cost-row--est ${canSort ? 'cost-row--sortable' : ''} ${estDrag.dragId === c.id ? 'is-dragging' : ''}`}>
                  <span className="cost-row__title">
                    {handleEl(estDrag, c.id)}
                    <b>{c.title}</b>
                    {(typeText(c) || placeOf(c) || c.note) && (
                      <small className="muted">{[typeText(c), placeOf(c) && `📍 ${pName(placeOf(c))}`, c.note].filter(Boolean).join(' · ')}</small>
                    )}
                  </span>
                  <span>
                    <Amount c={c} />
                    <small className="muted"> · {estPerLabel(c, t, nameOf)}</small>
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
                  <span className={`cost-row__actions ${ro ? 'is-hidden' : ''}`}>
                    <button
                      className="icon-btn icon-btn--sm"
                      title={t('cost.toActual')}
                      onClick={() => {
                        setPrefill({ title: c.title, amount: c.amount, per: c.per, currency: c.currency, planItemId: c.planItemId, note: c.note, estimateId: c.id, splitAmong: c.splitAmong || [] });
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
          {!ro && adding !== 'actual' && (
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
          <div className={`cost-table ${actDrag.dragId ? 'is-sorting' : ''}`} ref={actDrag.ref}>
            <div className="cost-table__head cost-row--act">
              <span>{t('cost.item')}</span>
              <span>{t('cost.amount')}</span>
              <span>{t('cost.paidBy')}</span>
              <span>{t('cost.splitCol')}</span>
              <span />
            </div>
            {actDrag.ordered.map((c) =>
              editId === c.id ? (
                <CostForm key={c.id} type="actual" initial={c} trip={trip} plan={plan} cur={cur} curs={curs} onSave={(d) => save(d, c.id)} onCancel={() => setEditId(null)} />
              ) : (
                <div key={c.id} data-sort-id={c.id} className={`cost-row cost-row--act ${canSort ? 'cost-row--sortable' : ''} ${actDrag.dragId === c.id ? 'is-dragging' : ''}`}>
                  <span className="cost-row__title">
                    {handleEl(actDrag, c.id)}
                    <b>{c.title}</b>
                    <small className="muted">
                      {[
                        typeText(c),
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
                  <span className={`cost-row__actions ${ro ? 'is-hidden' : ''}`}>
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

        </>
      )}

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
                    {id === user?.uid && <small className="muted"> ({t('trips.you')})</small>}
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
                    {!ro && (
                    <button className="btn btn--sm btn--soft" onClick={() => markPaid(tr)}>
                      ✓ {t('cost.markPaid')}
                    </button>
                    )}
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
                    {!ro && (
                    <button className="icon-btn icon-btn--sm" title={t('cost.undo')} onClick={() => api.deleteCost(trip.id, p.id)}>
                      ↩️
                    </button>
                    )}
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
