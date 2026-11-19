/** Nhóm link hữu ích trong cẩm nang (Quản trị → Cẩm nang → Link hữu ích) */
export const LINK_CATS = [
  { key: 'exchange', icon: '💱', vi: 'Đổi tiền', en: 'Money exchange' },
  { key: 'embassy', icon: '🏛️', vi: 'Đại sứ quán / lãnh sự', en: 'Embassies & consulates' },
  { key: 'visa', icon: '🛂', vi: 'Visa & giấy tờ', en: 'Visa & documents' },
  { key: 'sim', icon: '📶', vi: 'SIM / eSIM', en: 'SIM / eSIM' },
  { key: 'health', icon: '🏥', vi: 'Bệnh viện / y tế', en: 'Hospitals & health' },
  { key: 'transport', icon: '🚉', vi: 'Sân bay / nhà ga', en: 'Airports & stations' },
  { key: 'other', icon: '📌', vi: 'Khác', en: 'Other' },
];
export const LINK_CAT = Object.fromEntries(LINK_CATS.map((c) => [c.key, c]));
