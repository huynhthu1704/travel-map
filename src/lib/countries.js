import { feature } from 'topojson-client';
import countriesLib from 'i18n-iso-countries';
import vi from 'i18n-iso-countries/langs/vi.json';
import en from 'i18n-iso-countries/langs/en.json';

countriesLib.registerLocale(vi);
countriesLib.registerLocale(en);

export function flagOf(cc) {
  if (!cc || cc.length !== 2) return '🏳️';
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

// Tên ngắn gọn, quen thuộc hơn so với tên chính thức trong thư viện
const SHORT_VI = {
  US: 'Mỹ', GB: 'Anh', MY: 'Malaysia', LA: 'Lào', KR: 'Hàn Quốc', KP: 'Triều Tiên', RU: 'Nga', CZ: 'Séc', AE: 'UAE',
  TW: 'Đài Loan', HK: 'Hồng Kông', MO: 'Ma Cao', PH: 'Philippines', NL: 'Hà Lan', NZ: 'New Zealand', MM: 'Myanmar',
  TZ: 'Tanzania', BO: 'Bolivia', VE: 'Venezuela', IR: 'Iran', SY: 'Syria', MD: 'Moldova', CD: 'CHDC Congo', CG: 'Congo',
};

export function countryName(cc) {
  if (!cc) return '';
  return SHORT_VI[cc] || countriesLib.getName(cc, 'vi') || countriesLib.getName(cc, 'en') || cc;
}

/** Tránh vệt ngang khi polygon cắt qua kinh tuyến 180° (Nga, Fiji…) bằng cách "mở" kinh độ liên tục. */
function unwrapRing(ring) {
  let offset = 0;
  return ring.map(([x, y], i) => {
    if (i > 0) {
      const prev = ring[i - 1][0];
      if (x - prev > 180) offset -= 360;
      else if (prev - x > 180) offset += 360;
    }
    return [x + offset, y];
  });
}
function unwrapGeometry(g) {
  if (!g) return g;
  if (g.type === 'Polygon') return { ...g, coordinates: g.coordinates.map(unwrapRing) };
  if (g.type === 'MultiPolygon') return { ...g, coordinates: g.coordinates.map((p) => p.map(unwrapRing)) };
  return g;
}

export function alpha2FromName(name) {
  if (!name) return null;
  return countriesLib.getAlpha2Code(name, 'vi') || countriesLib.getAlpha2Code(name, 'en') || null;
}

let cache = null;
/** Tải GeoJSON các quốc gia (lazy, ~700KB) và gắn mã ISO alpha-2 + tên tiếng Việt. */
export async function loadCountries() {
  if (cache) return cache;
  const topo = (await import('world-atlas/countries-50m.json')).default;
  const fc = feature(topo, topo.objects.countries);
  fc.features = fc.features
    .map((f) => {
      const cc = f.id ? countriesLib.numericToAlpha2(f.id) : alpha2FromName(f.properties.name);
      return { ...f, geometry: unwrapGeometry(f.geometry), properties: { ...f.properties, cc: cc || null, nameVi: cc ? countryName(cc) : f.properties.name } };
    })
    .filter((f) => f.properties.name !== 'Antarctica');
  cache = fc;
  return fc;
}

export const WORLD_COUNTRY_COUNT = 195;
