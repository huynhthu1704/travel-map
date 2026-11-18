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
