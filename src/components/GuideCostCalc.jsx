import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Modal } from './ui';
import { countryName } from '../lib/countries';
import { currencyOfCountry, fetchMarketRates } from '../lib/rates';
import { fmtMoney } from '../lib/money';
import { GUIDE_COSTS, COST_ITEMS, COST_LEVELS, FALLBACK_PER_USD } from '../data/guideCosts';

/**
 * Bảng chi phí mẫu trong Cẩm nang: chọn số ngày, số người, mức chi tiêu →
 * tổng chi phí quy đổi ra VND và tiền tệ nước đến; có thể áp vào chi phí dự kiến của một chuyến đi.
 */
export default function GuideCostCalc({ cc }) {
  const { t } = useI18n();
  const { requireLogin } = useApp();
  const local = currencyOfCountry(cc) || 'USD';
  const [days, setDays] = useState(5);
  const [people, setPeople] = useState(2);
  const [level, setLevel] = useState('mid');
  const [rates, setRates] = useState(null); // { vndPerUsd, vndPerLocal, live }
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const fallback = { vndPerUsd: FALLBACK_PER_USD.VND, vndPerLocal: FALLBACK_PER_USD.VND / (FALLBACK_PER_USD[local] || 1), live: false };
    setRates(fallback);
    fetchMarketRates('VND', ['USD', local])
      .then((r) => alive && r.USD && setRates({ vndPerUsd: r.USD, vndPerLocal: local === 'VND' ? 1 : r[local] || fallback.vndPerLocal, live: true }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [local]);

  const base = GUIDE_COSTS[cc]?.[COST_LEVELS.indexOf(level)];
  const rooms = Math.ceil(people / 2);
  const nights = Math.max(days - 1, 1);
  const rows = useMemo(() => {
    if (!base || !rates) return [];
    return COST_ITEMS.map((it) => {
      const usd = base[it.key];
      const qty = it.unit === 'person' ? people : it.unit === 'roomNight' ? rooms * nights : people * days;
      const totalVnd = usd * qty * rates.vndPerUsd;
      return { ...it, usd, qty, totalVnd, totalLocal: totalVnd / rates.vndPerLocal };
    });
  }, [base, rates, people, rooms, nights, days]);
  if (!base) return null;
  const sumVnd = rows.reduce((a, r) => a + r.totalVnd, 0);
  const sumLocal = rows.reduce((a, r) => a + r.totalLocal, 0);
  const qtyLabel = (r) =>
    r.unit === 'person' ? t('gc.qPerson', { n: people }) : r.unit === 'roomNight' ? t('gc.qRoom', { r: rooms, n: nights }) : t('gc.qPersonDay', { n: people, d: days });
  const step = (v, set, min, max) => (
    <div className="gc-step">
      <button type="button" onClick={() => set(Math.max(min, v - 1))} aria-label="-">
        −
      </button>
      <input type="number" min={min} max={max} value={v} onChange={(e) => set(Math.max(min, Math.min(max, Number(e.target.value) || min)))} />
      <button type="button" onClick={() => set(Math.min(max, v + 1))} aria-label="+">
        +
      </button>
    </div>
  );
  return (
    <section id="g-costs" className="guide-sec guide-sec--wide card gc">
      <h2 className="h3">
        <span>💵</span> {t('gc.title')}
      </h2>
      <p className="small muted">{t('gc.help', { country: countryName(cc) })}</p>
      <div className="gc-controls">
        <label className="field">
          <span>🗓️ {t('gc.days')}</span>
          {step(days, setDays, 1, 30)}
        </label>
        <label className="field">
          <span>👥 {t('gc.people')}</span>
          {step(people, setPeople, 1, 20)}
        </label>
        <div className="field">
          <span>🎚️ {t('gc.level')}</span>
          <div className="segmented segmented--sm">
            {COST_LEVELS.map((l) => (
              <button key={l} type="button" className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>
                {t('gc.lv.' + l)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="report-table-wrap">
        <table className="report-table gc-table">
          <thead>
            <tr>
              <th>{t('gc.item')}</th>
              <th>{t('gc.qty')}</th>
              <th className="num">VND</th>
              {local !== 'VND' && <th className="num">{local}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  {r.icon} {t('gc.it.' + r.key)}
                  {r.key === 'flight' && cc === 'VN' && <small className="muted"> ({t('gc.domestic')})</small>}
                </td>
                <td className="muted">{qtyLabel(r)}</td>
                <td className="num">{fmtMoney(Math.round(r.totalVnd / 1000) * 1000, 'VND')}</td>
                {local !== 'VND' && <td className="num">{fmtMoney(r.totalLocal, local)}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2}>{t('gc.total')}</th>
              <th className="num">{fmtMoney(Math.round(sumVnd / 1000) * 1000, 'VND')}</th>
              {local !== 'VND' && <th className="num">{fmtMoney(sumLocal, local)}</th>}
            </tr>
            <tr>
              <td colSpan={2} className="muted">
                {t('gc.perPerson')}
              </td>
              <td className="num">
                <b>{fmtMoney(Math.round(sumVnd / people / 1000) * 1000, 'VND')}</b>
              </td>
              {local !== 'VND' && <td className="num">{fmtMoney(sumLocal / people, local)}</td>}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="row between wrap">
        <small className="muted">
          {rates?.live ? t('gc.rateLive') : t('gc.rateFallback')}
          {local !== 'VND' && rates ? ` · 1 ${local} ≈ ${fmtMoney(rates.vndPerLocal, 'VND')}` : ''} · {t('gc.disclaimer')}
        </small>
        <button type="button" className="btn btn--sm btn--primary" onClick={() => requireLogin(() => setApplyOpen(true), t('gc.loginReason'))}>
          ➕ {t('gc.apply')}
        </button>
      </div>
      {applyOpen && <ApplyModal cc={cc} rows={rows} people={people} days={days} onClose={() => setApplyOpen(false)} />}
    </section>
  );
}

/** Thêm các dòng chi phí mẫu thành "chi phí dự kiến" của một chuyến đi */
function ApplyModal({ cc, rows, people, days, onClose }) {
  const { t } = useI18n();
  const { user, trips, api, notify, setOpenTripId, setView, setTripTab } = useApp();
  const [busy, setBusy] = useState('');
  const mine = (trips || []).filter((tr) => !tr.memberIds || tr.memberIds.includes(user?.uid));
  const apply = async (tr) => {
    setBusy(tr.id);
    try {
      const tag = `${t('gc.sampleTag')} ${countryName(cc)}`;
      const cur = tr.currency && tr.currency !== 'VND' ? { currency: 'VND' } : {};
      for (const r of rows) {
        const perPerson = r.unit !== 'roomNight';
        const amount = Math.round((perPerson ? r.totalVnd / people : r.totalVnd) / 1000) * 1000;
        await api.addCost(user, tr.id, {
          type: 'estimate',
          title: `${t('gc.it.' + r.key)} (${tag}, ${days} ${t('gc.dayUnit')})`,
          amount,
          per: perPerson ? 'person' : 'group',
          note: '',
          planItemId: null,
          ...cur,
        });
      }
      notify(t('gc.applied', { trip: tr.name }));
      onClose();
      setOpenTripId?.(tr.id);
      setTripTab?.('costs');
      setView?.('trips');
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
      setBusy('');
    }
  };
  return (
    <Modal title={t('gc.applyTitle')} onClose={onClose}>
      <div className="stack">
        <p className="small muted">{t('gc.applyHelp')}</p>
        {mine.map((tr) => (
          <button key={tr.id} type="button" className="btn btn--soft guide-trip" disabled={!!busy} onClick={() => apply(tr)}>
            <span>{tr.emoji || '🧳'}</span> <b>{tr.name}</b>
            {busy === tr.id && <span className="muted"> …</span>}
          </button>
        ))}
        {!mine.length && <p>{t('guide.noTrips')}</p>}
        <a className={`btn ${mine.length ? 'btn--ghost' : 'btn--primary'} guide-newtrip`} href="#/trips?new=1" target="_blank" rel="noopener">
          ＋ {t('guide.createTrip')} ↗
        </a>
      </div>
    </Modal>
  );
}
