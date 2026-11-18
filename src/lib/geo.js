/** Link chỉ đường */
export const appleMapsUrl = (p) => `https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`;
export const googleMapsUrl = (p) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=&travelmode=driving`;

/** Tìm kiếm địa điểm bất kỳ bằng OpenStreetMap Nominatim (miễn phí, không cần key). */
export async function searchNominatim(q, signal, lang = 'vi') {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=${lang}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((r) => {
    const a = r.address || {};
    return {
      id: `osm-${r.osm_type?.[0] || 'x'}${r.osm_id}`,
      name: r.name || r.display_name.split(',')[0],
      city: a.city || a.town || a.village || a.state || a.county || '',
      country: (a.country_code || '').toUpperCase(),
      lat: Number(r.lat),
      lng: Number(r.lon),
      emoji: '📍',
      bbox: r.boundingbox?.map(Number),
      type: r.addresstype || r.type,
      display: r.display_name,
    };
  });
}

export const normalize = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
