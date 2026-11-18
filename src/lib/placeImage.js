// Ảnh minh hoạ cho địa điểm nổi tiếng: ưu tiên ảnh Wikidata (Wikimedia Commons),
// nếu không có thì lấy ảnh đại diện bài Wikipedia tìm theo tên. Có cache trong localStorage.
import { useEffect, useState } from 'react';
import { FAMOUS_BY_ID } from '../data/places';

const KEY = 'travel-map-img-v1';
let cache = {};
try {
  cache = JSON.parse(localStorage.getItem(KEY) || '{}');
} catch {
  cache = {};
}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full */
  }
};
const pending = {};

async function wikiThumb(lang, q) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(q)}&prop=pageimages&piprop=thumbnail&pithumbsize=640`;
  const j = await fetch(url).then((r) => r.json());
  const page = Object.values(j?.query?.pages || {})[0];
  return page?.thumbnail?.source || '';
}

export async function getPlaceImage(p) {
  if (!p) return '';
  if (p.image) return p.image;
  const famous = p.famous || FAMOUS_BY_ID[p.id] || /^wd-/.test(p.id || '');
  if (!famous) return '';
  if (cache[p.id] !== undefined) return cache[p.id];
  if (pending[p.id]) return pending[p.id];
  pending[p.id] = (async () => {
    const en = p.i18n?.en || FAMOUS_BY_ID[p.id]?.i18n?.en;
    let img = '';
    try {
      if (p.country === 'VN') img = await wikiThumb('vi', p.name);
      if (!img && en?.name) img = await wikiThumb('en', [en.name, en.city].filter(Boolean).join(' '));
      if (!img) img = await wikiThumb('en', p.name);
    } catch {
      img = '';
    }
    cache[p.id] = img;
    save();
    return img;
  })();
  return pending[p.id];
}

/** Hook: trả về URL ảnh ('' nếu không có / đang tải) */
export function usePlaceImage(p) {
  const [src, setSrc] = useState(() => p?.image || cache[p?.id] || '');
  useEffect(() => {
    let alive = true;
    setSrc(p?.image || cache[p?.id] || '');
    getPlaceImage(p).then((s) => alive && setSrc(s));
    return () => {
      alive = false;
    };
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return src;
}
