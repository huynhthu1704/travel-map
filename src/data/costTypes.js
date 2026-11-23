/** REQ-031: cost types a member can pick when entering a cost (stored as `costType` = key) */
export const COST_TYPES = [
  { key: 'flight', icon: '✈️', vi: 'Vé máy bay', en: 'Flights' },
  { key: 'stay', icon: '🏨', vi: 'Lưu trú', en: 'Accommodation' },
  { key: 'transport', icon: '🚆', vi: 'Di chuyển', en: 'Transport' },
  { key: 'food', icon: '🍜', vi: 'Ăn uống', en: 'Food & drinks' },
  { key: 'sightseeing', icon: '🎟️', vi: 'Tham quan', en: 'Sightseeing' },
  { key: 'shopping', icon: '🛍️', vi: 'Mua sắm', en: 'Shopping' },
  { key: 'sim', icon: '📶', vi: 'SIM / Internet', en: 'SIM / Internet' },
  { key: 'insurance', icon: '🛡️', vi: 'Bảo hiểm', en: 'Insurance' },
  { key: 'paperwork', icon: '🛂', vi: 'Giấy tờ', en: 'Paperwork' },
  { key: 'other', icon: '📦', vi: 'Khác', en: 'Other' },
];
export const COST_TYPE = Object.fromEntries(COST_TYPES.map((x) => [x.key, x]));
/** Label of a stored cost type ('' when none; unknown values are shown as typed) */
export const costTypeLabel = (key, lang = 'vi') => (key ? (COST_TYPE[key] ? COST_TYPE[key][lang] || COST_TYPE[key].vi : String(key)) : '');
