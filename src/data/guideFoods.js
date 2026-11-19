/**
 * Món ăn trong mục "Món phải thử" của cẩm nang — kèm ảnh minh hoạ lấy từ Wikipedia (Wikimedia Commons).
 * n: tên (tiếng Anh / tên gốc), vi: tên tiếng Việt (tuỳ chọn), wiki: tiêu đề bài Wikipedia tiếng Anh,
 * city: thành phố / vùng nổi tiếng với món đó ({ vi, en }); không có = món phổ biến cả nước.
 */
const C = (en, vi) => ({ en, vi: vi || en });
const f = (n, wiki, vi, city) => ({ n, wiki: wiki || n, ...(vi ? { vi } : {}), ...(city ? { city } : {}) });

const BKK = C('Bangkok');
const CNX = C('Chiang Mai');
const ISAN = C('Isan (North-east)', 'Isan (Đông Bắc)');
const TYO = C('Tokyo');
const OSA = C('Osaka');
const KYO = C('Kyoto');
const KOBE = C('Kobe');
const SEL = C('Seoul');
const JEONJU = C('Jeonju');
const BUSAN = C('Busan');
const KL = C('Kuala Lumpur');
const PEN = C('Penang');
const MEL = C('Melaka');
const BALI = C('Bali');
const PADANG = C('Padang');
const YOGYA = C('Yogyakarta');
const BJS = C('Beijing', 'Bắc Kinh');
const CKG = C('Chongqing / Sichuan', 'Trùng Khánh / Tứ Xuyên');
const SHA = C('Shanghai', 'Thượng Hải');
const LHW = C('Lanzhou', 'Lan Châu');
const KMG = C('Yunnan', 'Vân Nam');
const CAN = C('Guangzhou', 'Quảng Châu');
const TPE = C('Taipei', 'Đài Bắc');
const TNN = C('Tainan', 'Đài Nam');
const TXG = C('Taichung', 'Đài Trung');
const MNL = C('Manila');
const CEB = C('Cebu');
const PAMP = C('Pampanga');
const REP = C('Siem Reap');
const KAMPOT = C('Kampot');
const LPQ = C('Luang Prabang');
const VTE = C('Vientiane', 'Viêng Chăn');
const HAN = C('Hanoi', 'Hà Nội');
const HUI = C('Hue', 'Huế');
const HOI = C('Hoi An', 'Hội An');
const SGN = C('Ho Chi Minh City', 'TP. Hồ Chí Minh');

export const GUIDE_FOODS = {
  TH: [
    f('Pad thai', null, null, BKK),
    f('Tom yum', null, null, BKK),
    f('Mango sticky rice', 'Mango sticky rice', 'Xôi xoài', BKK),
    f('Thai tea', 'Thai tea', 'Trà sữa Thái', BKK),
    f('Khao soi', null, null, CNX),
    f('Sai ua', 'Sai ua', 'Xúc xích Sai ua', CNX),
    f('Som tam', 'Green papaya salad', 'Som tam (gỏi đu đủ)', ISAN),
    f('Gai yang', 'Gai yang', 'Gà nướng Gai yang', ISAN),
  ],
  JP: [
    f('Sushi', null, null, TYO),
    f('Monjayaki', null, null, TYO),
    f('Takoyaki', null, null, OSA),
    f('Okonomiyaki', null, null, OSA),
    f('Kushikatsu', null, null, OSA),
    f('Matcha', null, null, KYO),
    f('Kaiseki', null, null, KYO),
    f('Kobe beef', 'Kobe beef', 'Bò Kobe', KOBE),
    f('Ramen'),
    f('Tempura'),
    f('Onigiri'),
  ],
  KR: [
    f('Samgyeopsal', null, null, SEL),
    f('Korean fried chicken', 'Korean fried chicken', 'Gà rán Hàn', SEL),
    f('Tteokbokki', null, null, SEL),
    f('Gwangjang Market', 'Gwangjang Market', 'Chợ Gwangjang', SEL),
    f('Jeonju bibimbap', 'Bibimbap', 'Bibimbap Jeonju', JEONJU),
    f('Dwaeji gukbap', 'Dwaeji gukbap', null, BUSAN),
    f('Ssiat hotteok', 'Hotteok', 'Bánh Hotteok', BUSAN),
    f('Samgye-tang', 'Samgye-tang', 'Canh gà sâm'),
  ],
  SG: [f('Hainanese chicken rice', 'Hainanese chicken rice', 'Cơm gà Hải Nam'), f('Chilli crab', 'Chilli crab', 'Cua sốt ớt'), f('Laksa'), f('Kaya toast', 'Kaya toast', 'Bánh mì kaya'), f('Satay')],
  MY: [
    f('Nasi lemak', null, null, KL),
    f('Roti canai', null, null, KL),
    f('Teh tarik', null, null, KL),
    f('Char kway teow', null, null, PEN),
    f('Penang laksa', 'Asam laksa', 'Laksa Penang', PEN),
    f('Chicken rice ball', 'Chicken rice ball', 'Cơm gà viên', MEL),
    f('Durian', 'Durian', 'Sầu riêng'),
  ],
  ID: [
    f('Babi guling', 'Babi guling', 'Babi guling (heo quay Bali)', BALI),
    f('Rendang', null, null, PADANG),
    f('Gudeg', null, null, YOGYA),
    f('Nasi goreng'),
    f('Mie goreng'),
    f('Satay'),
    f('Kopi Java', 'Java coffee', 'Cà phê Java'),
  ],
  CN: [
    f('Peking duck', 'Peking duck', 'Vịt quay Bắc Kinh', BJS),
    f('Sichuan hot pot', 'Hot pot', 'Lẩu Tứ Xuyên', CKG),
    f('Mapo tofu', 'Mapo tofu', 'Đậu phụ Tứ Xuyên', CKG),
    f('Xiaolongbao', 'Xiaolongbao', 'Tiểu long bao', SHA),
    f('Lanzhou beef noodles', 'Lanzhou beef noodle soup', 'Mì kéo Lan Châu', LHW),
    f('Crossing-the-bridge noodles', 'Crossing-the-bridge noodles', 'Bún qua cầu', KMG),
    f('Dim sum', 'Dim sum', null, CAN),
  ],
  TW: [
    f('Beef noodle soup', 'Beef noodle soup', 'Mì bò', TPE),
    f('Lu rou fan', 'Minced pork rice', 'Cơm thịt kho', TPE),
    f('Stinky tofu', 'Stinky tofu', 'Đậu phụ thối', TPE),
    f('Bubble tea', 'Bubble tea', 'Trà sữa trân châu', TXG),
    f('Danzai noodles', 'Danzai noodles', 'Mì Đam Tử', TNN),
    f('Mango shaved ice', 'Shaved ice', 'Xoài đá bào'),
  ],
  PH: [
    f('Adobo', 'Philippine adobo', null, MNL),
    f('Sinigang', null, null, MNL),
    f('Halo-halo', null, null, MNL),
    f('Lechon', 'Lechon', 'Lechon (heo quay)', CEB),
    f('Dried mango', 'Dried mango', 'Xoài sấy', CEB),
    f('Sisig', null, null, PAMP),
  ],
  KH: [
    f('Fish amok', 'Fish amok', 'Amok cá', REP),
    f('Num banh chok', 'Num banhchok', null, REP),
    f('Kampot pepper crab', 'Kampot pepper', 'Cua xào tiêu Kampot', KAMPOT),
    f('Lok lak', 'Beef lok lak', 'Lok lak bò'),
  ],
  LA: [
    f('Or lam', 'Or lam', 'Món hầm Or lam', LPQ),
    f('Khao piak sen', null, null, LPQ),
    f('Khao jee', 'Khao jee pâté', 'Bánh mì Lào', VTE),
    f('Beerlao', null, null, VTE),
    f('Sticky rice', 'Glutinous rice', 'Xôi nếp'),
    f('Larb', 'Larb', 'Láp'),
    f('Tam mak hoong', 'Green papaya salad', 'Gỏi đu đủ'),
  ],
  VN: [
    f('Phở', 'Pho', null, HAN),
    f('Bún chả', 'Bún chả', null, HAN),
    f('Cà phê trứng', 'Egg coffee', null, HAN),
    f('Bún bò Huế', 'Bún bò Huế', null, HUI),
    f('Cao lầu', 'Cao lầu', null, HOI),
    f('Bánh mì', 'Bánh mì', null, HOI),
    f('Cơm tấm', 'Cơm tấm', null, SGN),
    f('Cà phê sữa đá', 'Vietnamese iced coffee', null, SGN),
  ],
};
