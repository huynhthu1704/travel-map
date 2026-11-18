import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { CURRENCIES, inputMoney, parseMoney } from '../lib/money';
import { fetchMarketRates } from '../lib/rates';

/** Ô nhập tỉ giá: gõ thoải mái, lưu khi rời ô / Enter */
function RateInput({ value, onCommit, base }) {
  const [text, setText] = useState(inputMoney(value, 'USD'));
  useEffect(() => setText(value ? inputMoney(Math.round(value * 10000) / 10000, 'USD') : ''), [value]);
  const commit = () => {
    const n = parseMoney(text, 'USD');
    if (n !== value) onCommit(n > 0 ? n : null);
  };
  return (
    <div className="money-input money-input--rate">
      <input inputMode="decimal" value={text} placeholder="?" onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())} />
      <span>{base}</span>
    </div>
  );
}

/**
 * Tiền tệ của chuyến đi: tiền quy đổi cuối cùng (base) + các tiền tệ khác với tỉ giá
 * (lấy theo thị trường hoặc tự nhập). value = { base, rates: { CODE: base / 1 CODE } }
 * suggest: các mã tiền tệ gợi ý từ điểm đến.
 */
export default function CurrencyRates({ value, onChange, suggest = [], compact }) {
  const { t } = useI18n();
  const base = value.base || 'VND';
  const rates = value.rates || {};
  const codes = Object.keys(rates);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (r) => onChange({ base, rates: r });

  const market = async (list) => {
    setBusy(true);
    setErr('');
    try {
      const m = await fetchMarketRates(base, list);
      const next = { ...rates };
      list.forEach((c) => (next[c] = m[c] ?? next[c] ?? null));
      set(next);
      if (list.some((c) => !m[c])) setErr(t('fx.someMissing'));
    } catch {
      setErr(t('fx.fetchError'));
      const next = { ...rates };
      list.forEach((c) => (next[c] = next[c] ?? null));
      set(next);
    }
    setBusy(false);
  };
  const add = (c) => c && c !== base && !codes.includes(c) && market([c]);
  const changeBase = (nb) => {
    if (nb === base) return;
    // Đổi tiền quy đổi: tính lại tỉ giá các tiền tệ khác theo tiền mới
    const k = rates[nb]; // số base cũ cho 1 nb
    const next = {};
    if (k > 0) {
      Object.entries(rates).forEach(([c, r]) => c !== nb && (next[c] = r > 0 ? r / k : null));
      next[base] = 1 / k;
    } else Object.keys(rates).forEach((c) => c !== nb && (next[c] = null));
    onChange({ base: nb, rates: next });
  };
  const missing = suggest.filter((c) => c && c !== base && !codes.includes(c));

  return (
    <div className={`fx ${compact ? 'fx--compact' : ''}`}>
      <div className="fx__base">
        <span>💱 {t('fx.base')}</span>
        <select value={base} onChange={(e) => changeBase(e.target.value)}>
          {[...new Set([base, ...CURRENCIES])].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {codes.map((c) => (
        <div key={c} className="fx__row">
          <b>1 {c} =</b>
          <RateInput value={rates[c]} base={base} onCommit={(n) => set({ ...rates, [c]: n })} />
          {!rates[c] && <span className="warn small">⚠️ {t('fx.needRate')}</span>}
          <button type="button" className="btn btn--sm btn--ghost" disabled={busy} onClick={() => market([c])} title={t('fx.marketHelp')}>
            🔄 {t('fx.market')}
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={() => {
              const next = { ...rates };
              delete next[c];
              set(next);
            }}
            aria-label={t('plan.remove')}
          >
            ✕
          </button>
        </div>
      ))}
      <div className="fx__add">
        {missing.map((c) => (
          <button key={c} type="button" className="chip chip--sm" onClick={() => add(c)} disabled={busy}>
            ＋ {c}
          </button>
        ))}
        <select value="" onChange={(e) => add(e.target.value)} disabled={busy} aria-label={t('fx.add')}>
          <option value="">＋ {t('fx.add')}</option>
          {CURRENCIES.filter((c) => c !== base && !codes.includes(c)).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {codes.length > 1 && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => market(codes)} disabled={busy}>
            🔄 {t('fx.updateAll')}
          </button>
        )}
        {busy && <small className="muted">{t('common.loading')}…</small>}
      </div>
      {err && <p className="small warn">{err}</p>}
      {!compact && <small className="muted">{t('fx.help', { base })}</small>}
    </div>
  );
}
