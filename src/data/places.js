// Danh sách địa điểm nổi tiếng gợi ý sẵn theo quốc gia (mã ISO alpha-2).
// Có thể mở rộng thoải mái — mỗi địa điểm cần: id, name, city, lat, lng, emoji, desc.
const raw = {
  VN: [
    ['vn-halong', 'Vịnh Hạ Long', 'Quảng Ninh', 20.9101, 107.1839, '⛵', 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi.'],
    ['vn-hoian', 'Phố cổ Hội An', 'Quảng Nam', 15.8801, 108.338, '🏮', 'Phố đèn lồng lung linh, di sản UNESCO.'],
    ['vn-hoguom', 'Hồ Hoàn Kiếm', 'Hà Nội', 21.0287, 105.8524, '🐢', 'Trái tim của thủ đô, đi bộ phố cổ cuối tuần.'],
    ['vn-sapa', 'Sa Pa', 'Lào Cai', 22.3364, 103.8438, '🏔️', 'Ruộng bậc thang, Fansipan và mây trời Tây Bắc.'],
    ['vn-dalat', 'Đà Lạt', 'Lâm Đồng', 11.9404, 108.4583, '🌼', 'Thành phố ngàn hoa, cà phê và đồi thông.'],
    ['vn-hue', 'Đại Nội Huế', 'Huế', 16.4698, 107.5786, '🏯', 'Kinh thành triều Nguyễn cổ kính.'],
    ['vn-bana', 'Cầu Vàng – Bà Nà', 'Đà Nẵng', 15.9951, 107.9963, '🌉', 'Cây cầu được nâng bởi đôi bàn tay khổng lồ.'],
    ['vn-phongnha', 'Phong Nha – Kẻ Bàng', 'Quảng Bình', 17.5906, 106.2833, '🦇', 'Vương quốc hang động với Sơn Đoòng.'],
    ['vn-benthanh', 'Chợ Bến Thành', 'TP. Hồ Chí Minh', 10.7725, 106.698, '🛵', 'Biểu tượng Sài Gòn, thiên đường ăn vặt.'],
    ['vn-phuquoc', 'Phú Quốc', 'Kiên Giang', 10.2899, 103.984, '🏝️', 'Đảo ngọc với biển xanh và hoàng hôn Sunset Town.'],
    ['vn-ninhbinh', 'Tràng An', 'Ninh Bình', 20.2539, 105.9049, '🛶', 'Ngồi thuyền xuyên hang giữa non nước hữu tình.'],
    ['vn-hagiang', 'Mã Pí Lèng', 'Hà Giang', 23.2441, 105.4129, '🏍️', 'Đèo hùng vĩ nhất miền Bắc, phượt thủ mê mẩn.'],
  ],
  JP: [
    ['jp-fuji', 'Núi Phú Sĩ', 'Yamanashi', 35.3606, 138.7274, '🗻', 'Biểu tượng Nhật Bản, đẹp nhất mùa hoa anh đào.'],
    ['jp-fushimi', 'Fushimi Inari', 'Kyoto', 34.9671, 135.7727, '⛩️', 'Hàng nghìn cổng torii đỏ rực.'],
    ['jp-shibuya', 'Ngã tư Shibuya', 'Tokyo', 35.6595, 139.7005, '🚦', 'Ngã tư đông đúc nhất thế giới.'],
    ['jp-nara', 'Công viên Nara', 'Nara', 34.685, 135.843, '🦌', 'Chơi cùng những chú nai thân thiện.'],
    ['jp-dotonbori', 'Dotonbori', 'Osaka', 34.6687, 135.5013, '🐙', 'Thiên đường ẩm thực đường phố.'],
    ['jp-arashiyama', 'Rừng tre Arashiyama', 'Kyoto', 35.017, 135.6713, '🎋', 'Lối đi xuyên rừng tre xanh mát.'],
    ['jp-hokkaido', 'Furano', 'Hokkaido', 43.342, 142.383, '💜', 'Cánh đồng oải hương tím mộng mơ.'],
  ],
  KR: [
    ['kr-gyeongbok', 'Cung Gyeongbokgung', 'Seoul', 37.5796, 126.977, '🏯', 'Mặc hanbok dạo cung điện hoàng gia.'],
    ['kr-namsan', 'Tháp N Seoul', 'Seoul', 37.5512, 126.9882, '🗼', 'Khóa tình yêu và view toàn thành phố.'],
    ['kr-bukchon', 'Làng Bukchon Hanok', 'Seoul', 37.5826, 126.9831, '🏘️', 'Ngôi làng truyền thống giữa lòng Seoul.'],
    ['kr-gamcheon', 'Làng văn hóa Gamcheon', 'Busan', 35.0975, 129.0106, '🎨', 'Những ngôi nhà sắc màu trên sườn đồi.'],
    ['kr-jeju', 'Seongsan Ilchulbong', 'Jeju', 33.4581, 126.9425, '🌅', 'Ngắm bình minh trên miệng núi lửa.'],
    ['kr-nami', 'Đảo Nami', 'Chuncheon', 37.7907, 127.5255, '🍁', 'Hàng cây lá vàng lãng mạn.'],
  ],
  TH: [
    ['th-grandpalace', 'Cung điện Hoàng gia', 'Bangkok', 13.75, 100.4913, '👑', 'Kiến trúc vàng rực rỡ của Thái Lan.'],
    ['th-watarun', 'Chùa Wat Arun', 'Bangkok', 13.7437, 100.4889, '🛕', 'Chùa Bình Minh bên sông Chao Phraya.'],
    ['th-phiphi', 'Đảo Phi Phi', 'Krabi', 7.7407, 98.7784, '🏝️', 'Nước biển trong vắt, vách đá ấn tượng.'],
    ['th-chiangmai', 'Doi Suthep', 'Chiang Mai', 18.8048, 98.9216, '⛰️', 'Ngôi chùa trên núi nhìn xuống Chiang Mai.'],
    ['th-ayutthaya', 'Ayutthaya', 'Ayutthaya', 14.3532, 100.5689, '🗿', 'Cố đô với tượng Phật trong rễ cây.'],
  ],
  SG: [
    ['sg-mbs', 'Marina Bay Sands', 'Singapore', 1.2834, 103.8607, '🏙️', 'Hồ bơi vô cực trên tầng thượng.'],
    ['sg-gardens', 'Gardens by the Bay', 'Singapore', 1.2816, 103.8636, '🌳', 'Siêu cây phát sáng về đêm.'],
    ['sg-sentosa', 'Sentosa', 'Singapore', 1.2494, 103.8303, '🎢', 'Đảo vui chơi với Universal Studios.'],
    ['sg-merlion', 'Merlion Park', 'Singapore', 1.2868, 103.8545, '🦁', 'Tượng sư tử biển biểu tượng.'],
  ],
  CN: [
    ['cn-greatwall', 'Vạn Lý Trường Thành', 'Bắc Kinh', 40.4319, 116.5704, '🧱', 'Kỳ quan thế giới dài hàng nghìn km.'],
    ['cn-forbidden', 'Tử Cấm Thành', 'Bắc Kinh', 39.9163, 116.3972, '🏯', 'Cung điện hoàng gia lớn nhất thế giới.'],
    ['cn-zhangjiajie', 'Trương Gia Giới', 'Hồ Nam', 29.3249, 110.4343, '⛰️', 'Những cột đá như bước ra từ phim Avatar.'],
    ['cn-bund', 'Bến Thượng Hải', 'Thượng Hải', 31.2401, 121.4904, '🌃', 'Skyline lung linh bên sông Hoàng Phố.'],
    ['cn-guilin', 'Quế Lâm – Dương Sóc', 'Quảng Tây', 24.7781, 110.4964, '🛶', 'Sông Li Giang thơ mộng.'],
  ],
  FR: [
    ['fr-eiffel', 'Tháp Eiffel', 'Paris', 48.8584, 2.2945, '🗼', 'Biểu tượng lãng mạn của Paris.'],
    ['fr-louvre', 'Bảo tàng Louvre', 'Paris', 48.8606, 2.3376, '🖼️', 'Gặp nàng Mona Lisa.'],
    ['fr-montsaintmichel', 'Mont-Saint-Michel', 'Normandy', 48.636, -1.5115, '🏰', 'Tu viện trên đảo đá giữa biển.'],
    ['fr-nice', 'Promenade des Anglais', 'Nice', 43.6951, 7.2654, '🌊', 'Dạo biển xanh Côte d’Azur.'],
    ['fr-provence', 'Cánh đồng Valensole', 'Provence', 43.8374, 5.9836, '💜', 'Oải hương tháng 7.'],
  ],
  IT: [
    ['it-colosseum', 'Đấu trường Colosseum', 'Rome', 41.8902, 12.4922, '🏛️', 'Đấu trường La Mã gần 2.000 năm tuổi.'],
    ['it-venice', 'Kênh đào Venice', 'Venice', 45.4408, 12.3155, '🚣', 'Thành phố trên mặt nước.'],
    ['it-pisa', 'Tháp nghiêng Pisa', 'Pisa', 43.723, 10.3966, '📐', 'Tạo dáng “đỡ tháp” kinh điển.'],
    ['it-amalfi', 'Positano', 'Amalfi', 40.628, 14.485, '🍋', 'Làng ven biển nhiều màu sắc.'],
    ['it-florence', 'Nhà thờ Duomo', 'Florence', 43.7731, 11.256, '⛪', 'Mái vòm phục hưng nổi tiếng.'],
  ],
  ES: [
    ['es-sagrada', 'Sagrada Família', 'Barcelona', 41.4036, 2.1744, '⛪', 'Kiệt tác dang dở của Gaudí.'],
    ['es-guell', 'Park Güell', 'Barcelona', 41.4145, 2.1527, '🦎', 'Công viên khảm gốm đầy màu sắc.'],
    ['es-alhambra', 'Alhambra', 'Granada', 37.1761, -3.5881, '🕌', 'Cung điện Moorish tuyệt đẹp.'],
    ['es-plaza', 'Plaza de España', 'Sevilla', 37.3772, -5.9869, '💃', 'Quảng trường lát gốm, nơi quay phim.'],
  ],
  GB: [
    ['gb-bigben', 'Big Ben', 'London', 51.5007, -0.1246, '🕰️', 'Tháp đồng hồ biểu tượng London.'],
    ['gb-towerbridge', 'Tower Bridge', 'London', 51.5055, -0.0754, '🌉', 'Cây cầu cổ điển bên sông Thames.'],
    ['gb-stonehenge', 'Stonehenge', 'Wiltshire', 51.1789, -1.8262, '🪨', 'Vòng đá bí ẩn thời tiền sử.'],
    ['gb-edinburgh', 'Lâu đài Edinburgh', 'Edinburgh', 55.9486, -3.1999, '🏰', 'Lâu đài trên đỉnh núi lửa cổ.'],
  ],
  US: [
    ['us-liberty', 'Tượng Nữ thần Tự do', 'New York', 40.6892, -74.0445, '🗽', 'Biểu tượng nước Mỹ.'],
    ['us-timessquare', 'Times Square', 'New York', 40.758, -73.9855, '🌆', 'Ngã tư rực rỡ đèn LED.'],
    ['us-goldengate', 'Cầu Cổng Vàng', 'San Francisco', 37.8199, -122.4783, '🌉', 'Cây cầu đỏ cam trong sương mù.'],
    ['us-grandcanyon', 'Grand Canyon', 'Arizona', 36.1069, -112.1129, '🏜️', 'Hẻm núi hùng vĩ.'],
    ['us-yosemite', 'Yosemite', 'California', 37.8651, -119.5383, '🌲', 'Vườn quốc gia với vách đá El Capitan.'],
    ['us-hollywood', 'Hollywood Sign', 'Los Angeles', 34.1341, -118.3215, '🎬', 'Check-in kinh đô điện ảnh.'],
  ],
  AU: [
    ['au-opera', 'Nhà hát Opera Sydney', 'Sydney', -33.8568, 151.2153, '🎭', 'Mái vỏ sò trắng bên cảng.'],
    ['au-reef', 'Rạn san hô Great Barrier', 'Queensland', -18.2871, 147.6992, '🐠', 'Hệ san hô lớn nhất thế giới.'],
    ['au-uluru', 'Uluru', 'Northern Territory', -25.3444, 131.0369, '🪨', 'Khối đá đỏ linh thiêng.'],
    ['au-greatocean', 'Twelve Apostles', 'Victoria', -38.6662, 143.1048, '🌊', 'Những cột đá vôi giữa biển.'],
  ],
  ID: [
    ['id-ubud', 'Ruộng bậc thang Tegallalang', 'Bali', -8.4335, 115.2793, '🌾', 'Xích đu giữa ruộng lúa xanh.'],
    ['id-tanahlot', 'Đền Tanah Lot', 'Bali', -8.6212, 115.0868, '🌅', 'Ngôi đền trên đá giữa biển.'],
    ['id-borobudur', 'Borobudur', 'Yogyakarta', -7.6079, 110.2038, '🛕', 'Đền Phật giáo lớn nhất thế giới.'],
    ['id-komodo', 'Komodo', 'Nusa Tenggara', -8.55, 119.4833, '🦎', 'Gặp rồng Komodo và bãi biển hồng.'],
  ],
  MY: [
    ['my-petronas', 'Tháp đôi Petronas', 'Kuala Lumpur', 3.1579, 101.7116, '🏙️', 'Tòa tháp đôi biểu tượng.'],
    ['my-batu', 'Động Batu', 'Selangor', 3.2379, 101.684, '🌈', 'Cầu thang 7 sắc cầu vồng.'],
    ['my-penang', 'George Town', 'Penang', 5.4141, 100.3288, '🎨', 'Tranh tường và ẩm thực đường phố.'],
  ],
  KH: [
    ['kh-angkor', 'Angkor Wat', 'Siem Reap', 13.4125, 103.867, '🛕', 'Quần thể đền đài kỳ vĩ.'],
    ['kh-palace', 'Hoàng cung Phnom Penh', 'Phnom Penh', 11.5637, 104.9311, '👑', 'Cung điện mái vàng.'],
  ],
  LA: [
    ['la-luangprabang', 'Luang Prabang', 'Luang Prabang', 19.8856, 102.1347, '🧡', 'Cố đô yên bình, khất thực sớm mai.'],
    ['la-kuangsi', 'Thác Kuang Si', 'Luang Prabang', 19.7494, 101.9927, '💧', 'Thác nước xanh ngọc bích.'],
  ],
  CH: [
    ['ch-matterhorn', 'Matterhorn', 'Zermatt', 45.9763, 7.6586, '🏔️', 'Ngọn núi hình kim tự tháp.'],
    ['ch-lucerne', 'Cầu Chapel', 'Lucerne', 47.0517, 8.3075, '🌉', 'Cầu gỗ cổ bên hồ.'],
    ['ch-interlaken', 'Jungfraujoch', 'Interlaken', 46.5475, 7.9853, '🚞', 'Nóc nhà châu Âu.'],
  ],
  TR: [
    ['tr-cappadocia', 'Cappadocia', 'Nevşehir', 38.6431, 34.8289, '🎈', 'Khinh khí cầu lúc bình minh.'],
    ['tr-hagia', 'Hagia Sophia', 'Istanbul', 41.0086, 28.9802, '🕌', 'Công trình nghìn năm tuổi.'],
    ['tr-pamukkale', 'Pamukkale', 'Denizli', 37.9204, 29.1201, '🤍', 'Ruộng bậc thang đá vôi trắng.'],
  ],
};

export const FAMOUS_PLACES = Object.fromEntries(
  Object.entries(raw).map(([cc, list]) => [
    cc,
    list.map(([id, name, city, lat, lng, emoji, desc]) => ({ id, name, city, lat, lng, emoji, desc, country: cc, famous: true })),
  ]),
);

export const ALL_FAMOUS = Object.values(FAMOUS_PLACES).flat();

export function famousIn(cc) {
  return FAMOUS_PLACES[cc] || [];
}
