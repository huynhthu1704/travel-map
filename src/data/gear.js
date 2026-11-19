/** Trang Đồ dùng du lịch (#/gear): nhãn công năng, hình thức đi, danh sách gợi ý ban đầu */
export const GEAR_TAGS = [
  { key: 'assistant', icon: '🧭', vi: 'Trợ thủ du lịch', en: 'Travel assistant' },
  { key: 'electronics', icon: '🔌', vi: 'Đồ điện tử', en: 'Electronics' },
  { key: 'cleaning', icon: '🧼', vi: 'Vệ sinh', en: 'Cleaning' },
  { key: 'beauty', icon: '💄', vi: 'Làm đẹp', en: 'Beauty' },
  { key: 'health', icon: '💊', vi: 'Sức khoẻ', en: 'Health' },
  { key: 'comfort', icon: '😴', vi: 'Thoải mái', en: 'Comfort' },
  { key: 'clothing', icon: '👕', vi: 'Quần áo', en: 'Clothing' },
  { key: 'storage', icon: '🎒', vi: 'Túi & sắp xếp', en: 'Bags & packing' },
  { key: 'safety', icon: '🔒', vi: 'An toàn', en: 'Safety' },
];
export const GEAR_TRIPS = [
  { key: 'flight', icon: '✈️', vi: 'Đi máy bay', en: 'By plane' },
  { key: 'bus', icon: '🚌', vi: 'Đi xe khách', en: 'By coach' },
  { key: 'backpack', icon: '🎒', vi: 'Du lịch bụi', en: 'Backpacking' },
  { key: 'beach', icon: '🏖️', vi: 'Đi biển', en: 'Beach' },
  { key: 'mountain', icon: '⛰️', vi: 'Leo núi / trekking', en: 'Hiking' },
  { key: 'city', icon: '🏙️', vi: 'Thành phố', en: 'City break' },
];
export const GEAR_TAG = Object.fromEntries(GEAR_TAGS.map((x) => [x.key, x]));
export const GEAR_TRIP = Object.fromEntries(GEAR_TRIPS.map((x) => [x.key, x]));

const g = (icon, vi, en, dvi, den, tags, trips) => ({ icon, name: { vi, en }, desc: { vi: dvi, en: den }, tags, trips, url: '', image: '', price: '' });
/** Danh sách gợi ý — admin bấm “Thêm danh sách gợi ý” rồi dán link Shopee cho từng món */
export const GEAR_STARTER = [
  g('🔋', 'Sạc dự phòng 10.000 mAh', 'Power bank 10,000 mAh', 'Dưới 20.000 mAh để mang lên máy bay, để trong hành lý xách tay.', 'Under 20,000 mAh so it can fly — keep it in your carry-on.', ['electronics', 'assistant'], ['flight', 'bus', 'backpack', 'city']),
  g('🔌', 'Ổ chuyển đa năng', 'Universal travel adapter', 'Dùng được ổ A/C/G/I — đi Singapore, Malaysia (ổ G) là cần.', 'Fits A/C/G/I sockets — essential for Singapore and Malaysia (type G).', ['electronics', 'assistant'], ['flight', 'city']),
  g('🧳', 'Túi sắp xếp hành lý (packing cubes)', 'Packing cubes', 'Chia quần áo theo ngày, vali gọn và dễ tìm đồ.', 'Sort clothes by day — a tidier, easier-to-search suitcase.', ['storage'], ['flight', 'backpack', 'bus']),
  g('💧', 'Bình nước gấp gọn', 'Collapsible water bottle', 'Qua an ninh sân bay để rỗng, vào trong rót nước miễn phí.', 'Empty for airport security, refill for free airside.', ['assistant', 'health'], ['flight', 'backpack', 'mountain', 'city']),
  g('😴', 'Gối cổ chữ U', 'Neck pillow', 'Ngủ ngon trên máy bay, xe khách đêm.', 'Sleep better on flights and night coaches.', ['comfort'], ['flight', 'bus']),
  g('👁️', 'Bịt mắt + nút tai', 'Eye mask + earplugs', 'Ngủ được ở hostel, xe giường nằm.', 'Sleep in hostels and sleeper buses.', ['comfort'], ['bus', 'backpack', 'flight']),
  g('🧴', 'Bộ chai chiết mỹ phẩm 100 ml', '100 ml travel bottles', 'Đúng quy định chất lỏng xách tay (mỗi chai ≤ 100 ml).', 'Meets carry-on liquid rules (each bottle ≤ 100 ml).', ['beauty', 'cleaning'], ['flight']),
  g('🧻', 'Khăn giấy ướt kháng khuẩn', 'Antibacterial wet wipes', 'Lau tay, lau bàn ăn ở chợ đêm, xe khách.', 'For hands and tables at night markets and on coaches.', ['cleaning', 'health'], ['bus', 'backpack', 'city', 'beach']),
  g('☀️', 'Kem chống nắng SPF 50', 'Sunscreen SPF 50', 'Đông Nam Á nắng gắt quanh năm.', 'South-East Asian sun is strong all year.', ['beauty', 'health'], ['beach', 'mountain', 'city']),
  g('💊', 'Hộp thuốc du lịch', 'Travel first-aid kit', 'Say xe, đau bụng, hạ sốt, băng cá nhân.', 'Motion sickness, stomach, fever, plasters.', ['health', 'safety'], ['flight', 'bus', 'backpack', 'mountain']),
  g('🧥', 'Áo khoác gió mỏng gấp gọn', 'Packable windbreaker', 'Máy bay, xe khách lạnh; lên núi gặp mưa.', 'For cold planes and coaches, and mountain rain.', ['clothing'], ['flight', 'bus', 'mountain']),
  g('🩴', 'Dép xỏ ngón / dép đi biển', 'Flip-flops', 'Đi biển, tắm ở hostel, vào chùa dễ tháo.', 'Beach, hostel showers, easy off at temples.', ['clothing', 'comfort'], ['beach', 'backpack']),
  g('🎒', 'Túi chống nước (dry bag)', 'Dry bag', 'Đi đảo, đi thuyền giữ điện thoại, giấy tờ khô.', 'Keep phone and documents dry on boats and islands.', ['storage', 'safety'], ['beach', 'mountain']),
  g('🔐', 'Khoá vali TSA', 'TSA luggage lock', 'Khoá số, hải quan Mỹ mở được không phá khoá.', 'Combination lock customs can open without breaking.', ['safety'], ['flight', 'bus']),
  g('👛', 'Túi đeo chống trộm', 'Anti-theft crossbody bag', 'Khoá kéo giấu, đi chợ, đi tàu đông người yên tâm.', 'Hidden zips for crowded markets and trains.', ['safety', 'storage'], ['city', 'backpack']),
  g('📶', 'eSIM du lịch', 'Travel eSIM', 'Cài trước khi đi, đến nơi bật là có mạng.', 'Install before you go, switch on when you land.', ['assistant', 'electronics'], ['flight', 'city', 'backpack']),
];
