// Current UI language, readable outside React (country names, place names, canvas text).
import { FAMOUS_BY_ID } from '../data/places';

export const LANGS = [
  { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', locale: 'vi-VN' },
  { id: 'en', label: 'English', flag: '🇬🇧', locale: 'en-GB' },
];
const KEY = 'travel-map-lang';

let current = (() => {
  try {
    const v = localStorage.getItem(KEY);
    return LANGS.some((l) => l.id === v) ? v : 'vi';
  } catch {
    return 'vi';
  }
})();

export const getLang = () => current;
export const getLocale = () => LANGS.find((l) => l.id === current).locale;
export function setLangValue(lang) {
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
}

/** Localized fields of a famous place (user-saved places keep their saved text). */
const loc = (p) => (p && current !== 'vi' && (p.i18n?.[current] || FAMOUS_BY_ID[p.id]?.i18n?.[current])) || null;
export const pName = (p) => loc(p)?.name || p?.name || '';
// Thành phố ở nước ngoài luôn hiển thị tên tiếng Anh (VD: Beijing thay vì Bắc Kinh / 北京)
export const pCity = (p) => {
  if (!p) return '';
  if (current === 'vi' && p.country && p.country !== 'VN') return p.i18n?.en?.city || FAMOUS_BY_ID[p.id]?.i18n?.en?.city || p.city || '';
  return loc(p)?.city || p.city || '';
};
export const pDesc = (p) => loc(p)?.desc || p?.desc || p?.i18n?.en?.desc || '';
