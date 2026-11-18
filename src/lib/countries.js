import { feature } from 'topojson-client';
import countriesLib from 'i18n-iso-countries';
import vi from 'i18n-iso-countries/langs/vi.json';
import en from 'i18n-iso-countries/langs/en.json';
import { getLang } from './lang';

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

const SHORT_EN = {
  CN: 'China', SY: 'Syria',
  US: 'United States', GB: 'United Kingdom', KR: 'South Korea', KP: 'North Korea', RU: 'Russia', LA: 'Laos', VN: 'Vietnam',
  TW: 'Taiwan', IR: 'Iran', SY: 'Syria', VE: 'Venezuela', BO: 'Bolivia', TZ: 'Tanzania', MD: 'Moldova', CD: 'DR Congo',
  CG: 'Congo', CZ: 'Czechia', AE: 'UAE', MM: 'Myanmar', HK: 'Hong Kong', MO: 'Macau',
};

export function countryName(cc) {
  if (!cc) return '';
  if (getLang() === 'en') return SHORT_EN[cc] || countriesLib.getName(cc, 'en') || cc;
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
const loaded = {};
/**
 * Tải GeoJSON các quốc gia và gắn mã ISO alpha-2 + tên tiếng Việt.
 * detail '110m' (~36KB nén) để tô màu bản đồ thật nhanh; '50m' (~230KB nén) chi tiết hơn, có cả nước nhỏ như Singapore.
 */
export async function loadCountries(detail = '50m') {
  if (loaded[detail]) return loaded[detail];
  const topo = (detail === '110m' ? await import('world-atlas/countries-110m.json') : await import('world-atlas/countries-50m.json')).default;
  const fc = feature(topo, topo.objects.countries);
  fc.features = fc.features
    .map((f) => {
      const cc = f.id ? countriesLib.numericToAlpha2(f.id) : alpha2FromName(f.properties.name);
      return { ...f, geometry: unwrapGeometry(f.geometry), properties: { ...f.properties, cc: cc || null, nameVi: cc ? countryName(cc) : f.properties.name } };
    })
    .filter((f) => f.properties.name !== 'Antarctica');
  loaded[detail] = fc;
  if (detail === '50m' || !cache) cache = fc;
  return fc;
}

export const WORLD_COUNTRY_COUNT = 195;

/** Khung bao {s, n, w, e} của một quốc gia (sau khi đã tải GeoJSON) */
export function bboxOf(cc) {
  const f = cache?.features.find((x) => x.properties.cc === cc);
  if (!f) return null;
  const b = { s: 90, n: -90, w: 540, e: -540 };
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      b.w = Math.min(b.w, c[0]);
      b.e = Math.max(b.e, c[0]);
      b.s = Math.min(b.s, c[1]);
      b.n = Math.max(b.n, c[1]);
    } else c.forEach(walk);
  };
  walk(f.geometry.coordinates);
  return b;
}
