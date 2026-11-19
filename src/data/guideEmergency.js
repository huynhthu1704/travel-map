/**
 * Số khẩn cấp theo quốc gia (kiểm tra 11/2026). Bấm để gọi (tel:).
 * k: loại (police | ambulance | fire | all | tourist | rescue)
 */
const n = (k, num, note, show) => ({ k, num, show: show || num, ...(note ? { note } : {}) });

export const GUIDE_EMERGENCY = {
  TH: [n('tourist', '1155', { vi: 'có tiếng Anh', en: 'English spoken' }), n('police', '191'), n('ambulance', '1669'), n('fire', '199')],
  JP: [n('police', '110'), n('ambulance', '119', { vi: 'cứu thương & cứu hoả', en: 'ambulance & fire' })],
  KR: [n('police', '112'), n('ambulance', '119', { vi: 'cứu thương & cứu hoả', en: 'ambulance & fire' }), n('tourist', '1330', { vi: 'đường dây du lịch, nhiều ngôn ngữ', en: 'tourist hotline, multilingual' })],
  SG: [n('police', '999'), n('ambulance', '995', { vi: 'cứu thương & cứu hoả', en: 'ambulance & fire' })],
  MY: [n('all', '999', { vi: 'gọi từ điện thoại di động có thể bấm 112', en: '112 also works from mobiles' })],
  ID: [n('all', '112'), n('police', '110'), n('ambulance', '118'), n('fire', '113')],
  CN: [n('police', '110'), n('ambulance', '120'), n('fire', '119')],
  TW: [n('police', '110'), n('ambulance', '119', { vi: 'cứu thương & cứu hoả', en: 'ambulance & fire' }), n('tourist', '0800011765', { vi: 'đường dây du lịch 24/7', en: '24/7 tourist hotline' }, '0800 011 765')],
  PH: [n('all', '911')],
  KH: [n('police', '117'), n('ambulance', '119'), n('fire', '118')],
  LA: [n('police', '1191'), n('ambulance', '1195'), n('fire', '1190'), n('tourist', '021251128', { vi: 'cảnh sát du lịch Viêng Chăn', en: 'tourist police, Vientiane' }, '021 251 128')],
  VN: [n('police', '113'), n('fire', '114'), n('ambulance', '115'), n('rescue', '112', { vi: 'tìm kiếm cứu nạn', en: 'search & rescue' })],
};

/** Tổng đài bảo hộ công dân Việt Nam ở nước ngoài (Cục Lãnh sự, Bộ Ngoại giao) */
export const VN_CITIZEN_HOTLINE = '+84981848484';
