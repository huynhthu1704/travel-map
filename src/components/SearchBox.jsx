import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { ALL_FAMOUS } from '../data/places';
import { countryName, flagOf } from '../lib/countries';
import { normalize, searchNominatim } from '../lib/geo';
import { useI18n } from '../i18n';
import { getLang, pName, pCity } from '../lib/lang';

/** Ô tìm kiếm: quốc gia, địa điểm nổi tiếng, kỉ niệm của tôi + mọi địa điểm trên OpenStreetMap */
export default function SearchBox() {
  const { countries, openCountry, openPlace, memories, setFlyTarget } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [osm, setOsm] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef();
  const { t, lang } = useI18n();

  const local = useMemo(() => {
    const n = normalize(q.trim());
    if (n.length < 1) return { countries: [], places: [] };
    const cs = (countries?.features || [])
      .filter((f) => f.properties.cc && (normalize(countryName(f.properties.cc)).includes(n) || normalize(f.properties.nameVi).includes(n) || normalize(f.properties.name).includes(n)))
      .slice(0, 4)
      .map((f) => f.properties.cc);
    const seen = new Set();
    const ps = [...memories.map((m) => m.place), ...ALL_FAMOUS]
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
      .filter((p) => normalize(`${p.name} ${pName(p)} ${p.city} ${pCity(p)} ${countryName(p.country)}`).includes(n))
      .slice(0, 6);
    return { countries: cs, places: ps };
  }, [q, countries, memories, lang]);

  useEffect(() => {
    if (q.trim().length < 3) {
      setOsm([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setOsm(await searchNominatim(q.trim(), ctl.signal, getLang()));
      } catch {
        /* bỏ qua */
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    const h = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);

  const pick = (fn) => {
    fn();
    setOpen(false);
    setQ('');
  };

  const hasResults = local.countries.length + local.places.length + osm.length > 0;

  return (
    <div className="search" ref={boxRef}>
      <span className="search__icon">🔎</span>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.label')}
      />
      {open && q.trim() && (
        <div className="search__dropdown">
          {local.countries.length > 0 && <div className="search__group">{t('search.countries')}</div>}
          {local.countries.map((cc) => (
            <button key={cc} className="search__item" onClick={() => pick(() => openCountry(cc))}>
              <span className="search__emoji">{flagOf(cc)}</span>
              <span>{countryName(cc)}</span>
            </button>
          ))}
          {local.places.length > 0 && <div className="search__group">{t('search.places')}</div>}
          {local.places.map((p) => (
            <button key={p.id} className="search__item" onClick={() => pick(() => openPlace(p))}>
              <span className="search__emoji">{p.emoji || '📍'}</span>
              <span>
                {pName(p)}
                <small>{[pCity(p), countryName(p.country)].filter(Boolean).join(', ')}</small>
              </span>
            </button>
          ))}
          {osm.length > 0 && <div className="search__group">{t('search.osm')}</div>}
          {osm.map((p) => (
            <button
              key={p.id}
              className="search__item"
              onClick={() =>
                pick(() => {
                  openPlace(p, { fly: false });
                  setFlyTarget(p.bbox ? { bbox: p.bbox, t: Date.now() } : { lat: p.lat, lng: p.lng, zoom: 12, t: Date.now() });
                })
              }
            >
              <span className="search__emoji">{flagOf(p.country)}</span>
              <span>
                {p.name}
                <small>{p.display}</small>
              </span>
            </button>
          ))}
          {loading && <div className="search__hint">{t('search.loading')}</div>}
          {!loading && !hasResults && q.trim().length >= 3 && <div className="search__hint">{t('search.empty')}</div>}
        </div>
      )}
    </div>
  );
}
