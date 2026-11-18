import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { ALL_FAMOUS } from '../data/places';
import { countryName, flagOf } from '../lib/countries';
import { normalize, searchNominatim } from '../lib/geo';

/** Ô tìm kiếm: quốc gia, địa điểm nổi tiếng, kỉ niệm của tôi + mọi địa điểm trên OpenStreetMap */
export default function SearchBox() {
  const { countries, openCountry, openPlace, memories, setFlyTarget } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [osm, setOsm] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef();

  const local = useMemo(() => {
    const n = normalize(q.trim());
    if (n.length < 1) return { countries: [], places: [] };
    const cs = (countries?.features || [])
      .filter((f) => f.properties.cc && (normalize(f.properties.nameVi).includes(n) || normalize(f.properties.name).includes(n)))
      .slice(0, 4)
      .map((f) => f.properties.cc);
    const seen = new Set();
    const ps = [...memories.map((m) => m.place), ...ALL_FAMOUS]
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))
      .filter((p) => normalize(`${p.name} ${p.city} ${countryName(p.country)}`).includes(n))
      .slice(0, 6);
    return { countries: cs, places: ps };
  }, [q, countries, memories]);

  useEffect(() => {
    if (q.trim().length < 3) {
      setOsm([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setOsm(await searchNominatim(q.trim(), ctl.signal));
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
        placeholder="Tìm quốc gia, thành phố, địa điểm…"
        aria-label="Tìm kiếm"
      />
      {open && q.trim() && (
        <div className="search__dropdown">
          {local.countries.length > 0 && <div className="search__group">Quốc gia</div>}
          {local.countries.map((cc) => (
            <button key={cc} className="search__item" onClick={() => pick(() => openCountry(cc))}>
              <span className="search__emoji">{flagOf(cc)}</span>
              <span>{countryName(cc)}</span>
            </button>
          ))}
          {local.places.length > 0 && <div className="search__group">Địa điểm nổi bật</div>}
          {local.places.map((p) => (
            <button key={p.id} className="search__item" onClick={() => pick(() => openPlace(p))}>
              <span className="search__emoji">{p.emoji || '📍'}</span>
              <span>
                {p.name}
                <small>{[p.city, countryName(p.country)].filter(Boolean).join(', ')}</small>
              </span>
            </button>
          ))}
          {osm.length > 0 && <div className="search__group">Kết quả trên bản đồ</div>}
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
          {loading && <div className="search__hint">Đang tìm…</div>}
          {!loading && !hasResults && q.trim().length >= 3 && <div className="search__hint">Không tìm thấy kết quả 😢</div>}
        </div>
      )}
    </div>
  );
}
