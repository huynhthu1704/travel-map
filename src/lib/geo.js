/** Link chỉ đường */
export const appleMapsUrl = (p) => `https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`;
export const googleMapsUrl = (p) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=&travelmode=driving`;

/** Chữ Latin (kể cả tiếng Việt có dấu)? Dùng để tránh hiển thị chữ địa phương như 東京, 서울, กรุงเทพ… */
export const isLatin = (s = '') => !/[^\u0000-ɏḀ-ỿ -⁯₠-⃏\s]/u.test(s.replace(/\p{Emoji_Presentation}/gu, ''));

/**
 * Tìm kiếm địa điểm bất kỳ bằng OpenStreetMap Nominatim (miễn phí, không cần key).
 * Địa điểm ở nước ngoài luôn dùng tên tiếng Anh; địa điểm ở Việt Nam giữ tên tiếng Việt khi giao diện là tiếng Việt.
 */
export async function searchNominatim(q, signal, lang = 'vi') {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&limit=6&accept-language=en&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((r) => {
    const a = r.address || {};
    const nd = r.namedetails || {};
    const country = (a.country_code || '').toUpperCase();
    const englishFirst = r.display_name.split(',')[0].trim();
    const latin = (...xs) => xs.find((x) => x && isLatin(x));
    let name;
    if (country === 'VN' && lang === 'vi') name = latin(nd['name:vi'], nd.name, nd['name:en'], englishFirst);
    else name = latin(nd['name:en'], nd.int_name, nd['name:latin'], englishFirst, r.name, nd.name) || r.name;
    const city = latin(a.city, a.town, a.village, a.municipality, a.county, a.state, a.region) || '';
    return {
      id: `osm-${r.osm_type?.[0] || 'x'}${r.osm_id}`,
      name: name || englishFirst,
      city,
      country,
      lat: Number(r.lat),
      lng: Number(r.lon),
      emoji: '📍',
      bbox: r.boundingbox?.map(Number),
      type: r.addresstype || r.type,
      display: r.display_name
        .split(',')
        .map((x) => x.trim())
        .filter(isLatin)
        .join(', '),
    };
  });
}

export const normalize = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

/** Lấy thông tin địa điểm (tên, thành phố, quốc gia) từ toạ độ — OpenStreetMap Nominatim. */
export async function reverseGeocode(lat, lng, lang = 'vi') {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&namedetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } }).then((res) => res.json());
    const a = r.address || {};
    const nd = r.namedetails || {};
    const country = (a.country_code || '').toUpperCase();
    const latin = (...xs) => xs.find((x) => x && isLatin(x));
    const city = latin(a.city, a.town, a.village, a.municipality, a.county, a.state, a.region) || '';
    const street = latin([a.house_number, a.road].filter(Boolean).join(' '), a.suburb, a.neighbourhood, a.quarter);
    const name =
      country === 'VN' && lang === 'vi'
        ? latin(nd['name:vi'], nd.name, street, city)
        : latin(nd['name:en'], nd.int_name, nd.name, street, city);
    return { name: name || '', city, country };
  } catch {
    return { name: '', city: '', country: '' };
  }
}

const num = (s) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * Đọc link Google Maps (hoặc nội dung chia sẻ từ app Google Maps) → { name, lat, lng, query, shortOnly }.
 * Hỗ trợ: /maps/place/Ten/@lat,lng…, …!3dLAT!4dLNG, ?q=lat,lng, ?q=dia+chi, ?query=…, ll=, /search/…
 * Link rút gọn (maps.app.goo.gl) không mở được từ trình duyệt, nên dùng phần chữ đi kèm (tên + địa chỉ) để tìm.
 */
export function parseGoogleMapsInput(text = '') {
  const raw = text.trim();
  const urlMatch = raw.match(/https?:\/\/[^\s]+/);
  const urlStr = urlMatch?.[0];
  const extra = raw
    .replace(urlStr || '', '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = { name: extra[0] || '', address: extra.slice(1).join(', '), lat: null, lng: null, query: '', shortOnly: false };
  if (!urlStr) {
    // Có thể người dùng dán toạ độ "10.77, 106.70"
    const m = raw.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (m) Object.assign(out, { lat: num(m[1]), lng: num(m[2]), name: '' });
    else out.query = raw;
    return out;
  }
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    out.query = extra.join(', ');
    return out;
  }
  const full = decodeURIComponent(u.href);
  // Toạ độ chính xác của địa điểm (ưu tiên) rồi tới tâm bản đồ (@lat,lng)
  const d = full.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const at = full.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const p = u.searchParams;
  const qv = p.get('q') || p.get('query') || p.get('daddr') || p.get('destination') || p.get('ll') || '';
  const qCoord = qv.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const coord = d || qCoord || at;
  if (coord) {
    out.lat = num(coord[1]);
    out.lng = num(coord[2]);
  }
  const place = u.pathname.match(/\/maps\/place\/([^/]+)/);
  if (place) out.name = decodeURIComponent(place[1].replace(/\+/g, ' ')).split(',')[0];
  else if (qv && !qCoord) out.name = out.name || qv.replace(/\+/g, ' ').split(',')[0];
  const search = u.pathname.match(/\/maps\/search\/([^/]+)/);
  if (search && !out.name) out.name = decodeURIComponent(search[1].replace(/\+/g, ' '));
  if (out.lat == null) {
    out.query = [out.name, out.address].filter(Boolean).join(', ') || (qv && !qCoord ? qv : '');
    out.shortOnly = /goo\.gl|maps\.app/.test(u.hostname) && !out.query;
  }
  return out;
}

export const isGoogleMapsLink = (s = '') => /(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(s);
