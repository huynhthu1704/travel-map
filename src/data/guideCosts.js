/**
 * Bảng chi phí mẫu theo quốc gia — ước tính tham khảo (USD, 11/2026), 3 mức: tiết kiệm / trung bình / thoải mái.
 * flight: vé khứ hồi từ TP.HCM / Hà Nội, mỗi người (VN: bay nội địa)
 * hotel:  mỗi phòng mỗi đêm (2 người / phòng)
 * food, transport, activity: mỗi người mỗi ngày
 */
const row = (flight, hotel, food, transport, activity) => ({ flight, hotel, food, transport, activity });
export const COST_LEVELS = ['budget', 'mid', 'comfort'];
export const COST_ITEMS = [
  { key: 'flight', icon: '✈️', unit: 'person' },
  { key: 'hotel', icon: '🏨', unit: 'roomNight' },
  { key: 'food', icon: '🍜', unit: 'personDay' },
  { key: 'transport', icon: '🚇', unit: 'personDay' },
  { key: 'activity', icon: '🎟️', unit: 'personDay' },
];
export const GUIDE_COSTS = {
  TH: [row(120, 20, 10, 5, 8), row(180, 45, 20, 10, 20), row(280, 110, 45, 25, 45)],
  JP: [row(350, 45, 25, 12, 10), row(500, 100, 45, 20, 25), row(750, 220, 90, 40, 50)],
  KR: [row(280, 40, 20, 8, 8), row(400, 85, 35, 15, 20), row(600, 180, 70, 35, 45)],
  SG: [row(120, 70, 18, 6, 15), row(180, 140, 35, 12, 40), row(300, 280, 80, 30, 80)],
  MY: [row(100, 20, 10, 5, 8), row(160, 45, 20, 10, 20), row(260, 110, 40, 25, 40)],
  ID: [row(200, 20, 10, 6, 10), row(300, 50, 20, 15, 25), row(450, 140, 45, 35, 55)],
  CN: [row(250, 30, 15, 8, 10), row(380, 70, 30, 15, 25), row(600, 160, 60, 35, 50)],
  TW: [row(220, 35, 15, 6, 8), row(330, 75, 30, 12, 20), row(500, 160, 60, 30, 40)],
  PH: [row(180, 20, 10, 6, 12), row(260, 50, 20, 12, 30), row(400, 130, 40, 30, 60)],
  KH: [row(80, 15, 8, 6, 15), row(140, 35, 15, 12, 40), row(240, 90, 35, 25, 60)],
  LA: [row(120, 12, 8, 6, 5), row(200, 30, 15, 12, 15), row(320, 80, 30, 25, 35)],
  VN: [row(60, 15, 8, 4, 5), row(100, 35, 15, 8, 12), row(160, 90, 35, 20, 30)],
};
/** Tỉ giá dự phòng khi không lấy được tỉ giá thị trường: số đơn vị cho 1 USD */
export const FALLBACK_PER_USD = { VND: 26300, THB: 32.5, JPY: 150, KRW: 1400, SGD: 1.3, MYR: 4.2, IDR: 16300, CNY: 7.15, TWD: 31, PHP: 57, KHR: 4050, LAK: 21500 };
