import { sizedWikiImage } from './network';
// Ảnh minh hoạ cho địa điểm nổi tiếng: ưu tiên ảnh Wikidata (Wikimedia Commons),
// nếu không có thì lấy ảnh đại diện bài Wikipedia tìm theo tên. Có cache trong localStorage.
import { useEffect, useState } from 'react';
import { FAMOUS_BY_ID } from '../data/places';

const KEY = 'travel-map-img-v2';
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

const norm = (x = '') =>
  x
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

/** Tên bài viết có khớp với tên địa điểm không (tránh lấy nhầm ảnh của trang khác) */
function titleMatches(title, name) {
  const a = new Set(norm(title));
  const b = norm(name).filter((w) => !['the', 'of', 'and', 'cua', 'va'].includes(w));
  if (!b.length) return false;
  const hit = b.filter((w) => a.has(w)).length;
  return hit / b.length >= 0.6;
}

/** Ảnh đại diện của đúng một bài Wikipedia (theo tiêu đề) */
async function pageThumb(lang, title) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=thumbnail&pithumbsize=640`;
  const j = await fetch(url).then((r) => r.json());
  return Object.values(j?.query?.pages || {})[0]?.thumbnail?.source || '';
}

/** Tìm bài Wikipedia theo tên, chỉ nhận khi tiêu đề khớp tên địa điểm */
async function searchThumb(lang, q, name) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(q)}&prop=pageimages&piprop=thumbnail&pithumbsize=640`;
  const j = await fetch(url).then((r) => r.json());
  const pages = Object.values(j?.query?.pages || {}).sort((x, y) => (x.index || 0) - (y.index || 0));
  const page = pages.find((pg) => pg.thumbnail && titleMatches(pg.title, name));
  return page?.thumbnail?.source || '';
}

/** Địa điểm từ Wikidata: lấy ảnh từ chính bài Wikipedia liên kết với mục Wikidata đó */
async function wikidataThumb(qid) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&ids=${qid}&props=sitelinks&sitefilter=viwiki|enwiki`;
  const j = await fetch(url).then((r) => r.json());
  const links = j?.entities?.[qid]?.sitelinks || {};
  for (const [site, lang] of [['viwiki', 'vi'], ['enwiki', 'en']]) {
    if (links[site]?.title) {
      const img = await pageThumb(lang, links[site].title);
      if (img) return img;
    }
  }
  return '';
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
    const qid = p.wikidata || (/^wd-(Q\d+)$/.exec(p.id || '') || [])[1];
    let img = '';
    try {
      if (qid) img = await wikidataThumb(qid);
      else {
        if (p.country === 'VN') img = await searchThumb('vi', p.name, p.name);
        if (!img && en?.name) img = await searchThumb('en', [en.name, en.city].filter(Boolean).join(' '), en.name);
        if (!img) img = await searchThumb('en', p.name, p.name);
      }
    } catch {
      img = '';
    }
    cache[p.id] = img;
    save();
    return img;
  })();
  return pending[p.id];
}

/** Hook: { src, loading } — src = '' nếu không có ảnh; loading = đang tìm URL ảnh */
const known = (p) => !!p && (!!p.image || cache[p.id] !== undefined || !(p.famous || FAMOUS_BY_ID[p.id] || /^wd-/.test(p.id || '')));

export function usePlaceImage(p) {
  const [state, setState] = useState(() => ({ src: p?.image || cache[p?.id] || '', loading: !known(p) }));
  useEffect(() => {
    let alive = true;
    setState({ src: p?.image || cache[p?.id] || '', loading: !known(p) });
    getPlaceImage(p).then((s) => alive && setState({ src: s, loading: false }));
    return () => {
      alive = false;
    };
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Ảnh Wikipedia: chọn kích thước theo tốc độ mạng của người dùng
  return { ...state, src: sizedWikiImage(state.src) };
}

/** Hook: ảnh đại diện bài Wikipedia tiếng Anh theo tiêu đề (món ăn trong cẩm nang…) — có cache */
export function useWikiThumb(title) {
  const key = 'wiki:' + title;
  const [src, setSrc] = useState(() => cache[key] || '');
  const [loading, setLoading] = useState(() => cache[key] === undefined);
  useEffect(() => {
    if (!title) return undefined;
    let alive = true;
    if (cache[key] !== undefined) {
      setSrc(cache[key]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    pending[key] ||= pageThumb('en', title)
      .catch(() => '')
      .then((img) => {
        cache[key] = img;
        save();
        return img;
      });
    pending[key].then((img) => alive && (setSrc(img), setLoading(false)));
    return () => {
      alive = false;
    };
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps
  return { src: sizedWikiImage(src), loading };
}
