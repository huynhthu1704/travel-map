// Đường dẫn trong URL (dạng #/...) để tải lại trang vẫn mở đúng chỗ đang xem.
// GitHub Pages không hỗ trợ đường dẫn thật cho ứng dụng 1 trang, nên dùng phần sau dấu #.
//   #/                       bản đồ
//   #/country/VN             bản đồ, đang xem 1 quốc gia
//   #/place/<id>?lat=&lng=…  bản đồ, đang xem 1 địa điểm
//   #/explore  #/memories  #/trips  #/trips/<id>  #/admin
//   ?trip=<id>               đang hiện 1 chuyến đi trên bản đồ (dùng được với mọi trang)

const PAGES = ['explore', 'memories', 'admin'];

export function parseRoute(hash = '') {
  const h = hash.replace(/^#\/?/, '');
  const [path, qs = ''] = h.split('?');
  const q = new URLSearchParams(qs);
  const seg = path.split('/').filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const r = { view: 'map', country: null, place: null, trip: q.get('trip') || null, tripDetail: null };
  if (PAGES.includes(seg[0])) r.view = seg[0];
  else if (seg[0] === 'trips') {
    r.view = 'trips';
    r.tripDetail = seg[1] || null;
  } else if (seg[0] === 'country' && seg[1]) r.country = seg[1].toUpperCase();
  else if (seg[0] === 'place' && seg[1] && q.get('lat') && q.get('lng')) {
    const lat = Number(q.get('lat'));
    const lng = Number(q.get('lng'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      r.place = { id: seg[1], name: q.get('n') || '', city: q.get('city') || '', country: q.get('cc') || '', lat, lng, emoji: q.get('e') || '📍', restored: true };
      r.country = r.place.country || null;
    }
  }
  return r;
}

export function buildRoute({ view, country, place, trip, tripDetail }) {
  const q = new URLSearchParams();
  let path = '';
  if (view === 'map') {
    if (place?.id && place.lat != null) {
      path = `place/${encodeURIComponent(place.id)}`;
      q.set('lat', Number(place.lat).toFixed(5));
      q.set('lng', Number(place.lng).toFixed(5));
      if (place.name) q.set('n', place.name);
      if (place.city) q.set('city', place.city);
      if (place.country) q.set('cc', place.country);
      if (place.emoji && place.emoji !== '📍') q.set('e', place.emoji);
    } else if (country) path = `country/${country}`;
  } else if (view === 'trips') path = tripDetail ? `trips/${encodeURIComponent(tripDetail)}` : 'trips';
  else path = view;
  if (trip) q.set('trip', trip);
  const s = q.toString();
  return `#/${path}${s ? `?${s}` : ''}`;
}
