import { useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import Combobox from './Combobox';
import { countryName, flagOf } from '../lib/countries';
import { pCity } from '../lib/lang';

/** Một điểm đến: quốc gia + thành phố (thành phố gợi ý từ danh lam thắng cảnh, gõ tự do được) */
function DestinationRow({ value, onChange, onRemove, countryOptions }) {
  const { t, lang } = useI18n();
  const { famousFor, ensureFamous, places } = useApp();
  useEffect(() => ensureFamous(value.cc), [value.cc, ensureFamous]);
  const cityOptions = useMemo(() => {
    if (!value.cc) return [];
    const fromPlaces = places.filter((p) => p.country === value.cc).map(pCity);
    const fromFamous = famousFor(value.cc).map(pCity);
    return [...new Set([...fromPlaces, ...fromFamous].filter(Boolean))].sort((a, b) => a.localeCompare(b, lang)).map((c) => ({ value: c, label: c }));
  }, [value.cc, famousFor, places, lang]);
  return (
    <div className="dest-row">
      <Combobox value={value.cc} options={countryOptions} onChange={(cc) => onChange({ cc: cc || '', city: '' })} placeholder={t('dest.country')} ariaLabel={t('dest.country')} icon="🌏" />
      <Combobox
        value={value.city}
        options={cityOptions}
        onChange={(city) => onChange({ ...value, city: city || '' })}
        placeholder={value.cc ? t('dest.cityAny') : t('dest.pickCountryFirst')}
        ariaLabel={t('dest.city')}
        allLabel={value.cc ? t('dest.wholeCountry') : undefined}
        allowFree
        icon="🏙️"
      />
      {onRemove && (
        <button type="button" className="icon-btn icon-btn--sm dest-row__x" onClick={onRemove} aria-label={t('plan.remove')}>
          ✕
        </button>
      )}
    </div>
  );
}

/** Danh sách điểm đến của chuyến đi: [{ cc, city }] */
export default function DestinationPicker({ value, onChange }) {
  const { t, lang } = useI18n();
  const { countries } = useApp();
  const list = value.length ? value : [{ cc: '', city: '' }];
  const countryOptions = useMemo(
    () =>
      (countries?.features || [])
        .map((f) => f.properties.cc)
        .filter(Boolean)
        .map((c) => ({ value: c, label: countryName(c), icon: flagOf(c) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [countries, lang],
  );
  const set = (i, d) => onChange(list.map((x, j) => (j === i ? d : x)));
  return (
    <div className="dest-picker">
      {list.map((d, i) => (
        <DestinationRow
          key={i}
          value={d}
          countryOptions={countryOptions}
          onChange={(nd) => set(i, nd)}
          onRemove={list.length > 1 || d.cc ? () => onChange(list.filter((_, j) => j !== i)) : null}
        />
      ))}
      {list[list.length - 1]?.cc && (
        <button type="button" className="btn btn--sm btn--soft dest-add" onClick={() => onChange([...list, { cc: '', city: '' }])}>
          ＋ {t('dest.add')}
        </button>
      )}
    </div>
  );
}

/** Chuỗi hiển thị: "🇻🇳 Đà Lạt · 🇸🇬 Singapore" */
export const destLabel = (dests = []) =>
  dests
    .filter((d) => d.cc)
    .map((d) => `${flagOf(d.cc)} ${d.city || countryName(d.cc)}`)
    .join(' · ');

export const cleanDests = (dests = []) => dests.filter((d) => d.cc).map((d) => ({ cc: d.cc, city: (d.city || '').trim() }));
