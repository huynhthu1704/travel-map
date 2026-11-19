/**
 * Món ăn trong mục "Món phải thử" của cẩm nang — kèm ảnh minh hoạ lấy từ Wikipedia (Wikimedia Commons).
 * n: tên (tiếng Anh / tên gốc), vi: tên tiếng Việt (tuỳ chọn), wiki: tiêu đề bài Wikipedia tiếng Anh.
 */
const f = (n, wiki, vi) => ({ n, wiki: wiki || n, ...(vi ? { vi } : {}) });

export const GUIDE_FOODS = {
  TH: [f('Pad thai'), f('Tom yum'), f('Som tam', 'Green papaya salad', 'Som tam (gỏi đu đủ)'), f('Mango sticky rice', 'Mango sticky rice', 'Xôi xoài'), f('Khao soi'), f('Thai tea', 'Thai tea', 'Trà sữa Thái')],
  JP: [f('Sushi'), f('Ramen'), f('Tempura'), f('Takoyaki'), f('Okonomiyaki'), f('Wagyu', 'Wagyu', 'Bò wagyu'), f('Onigiri'), f('Matcha')],
  KR: [f('Samgyeopsal'), f('Korean fried chicken', 'Korean fried chicken', 'Gà rán Hàn'), f('Tteokbokki'), f('Bibimbap'), f('Samgye-tang', 'Samgye-tang', 'Canh gà sâm'), f('Gwangjang Market', 'Gwangjang Market', 'Chợ Gwangjang')],
  SG: [f('Hainanese chicken rice', 'Hainanese chicken rice', 'Cơm gà Hải Nam'), f('Chilli crab', 'Chilli crab', 'Cua sốt ớt'), f('Laksa'), f('Kaya toast', 'Kaya toast', 'Bánh mì kaya'), f('Satay')],
  MY: [f('Nasi lemak'), f('Char kway teow'), f('Roti canai'), f('Teh tarik'), f('Penang laksa', 'Asam laksa', 'Laksa Penang'), f('Durian', 'Durian', 'Sầu riêng')],
  ID: [f('Nasi goreng'), f('Mie goreng'), f('Satay'), f('Rendang'), f('Babi guling', 'Babi guling', 'Babi guling (heo quay Bali)'), f('Kopi Java', 'Java coffee', 'Cà phê Java')],
  CN: [f('Peking duck', 'Peking duck', 'Vịt quay Bắc Kinh'), f('Sichuan hot pot', 'Hot pot', 'Lẩu Tứ Xuyên'), f('Xiaolongbao', 'Xiaolongbao', 'Tiểu long bao'), f('Lanzhou beef noodles', 'Lanzhou beef noodle soup', 'Mì kéo Lan Châu'), f('Crossing-the-bridge noodles', 'Crossing-the-bridge noodles', 'Bún qua cầu')],
  TW: [f('Bubble tea', 'Bubble tea', 'Trà sữa trân châu'), f('Beef noodle soup', 'Beef noodle soup', 'Mì bò'), f('Lu rou fan', 'Minced pork rice', 'Cơm thịt kho'), f('Stinky tofu', 'Stinky tofu', 'Đậu phụ thối'), f('Mango shaved ice', 'Shaved ice', 'Xoài đá bào')],
  PH: [f('Adobo', 'Philippine adobo'), f('Lechon', 'Lechon', 'Lechon (heo quay)'), f('Sinigang'), f('Sisig'), f('Halo-halo'), f('Dried mango', 'Dried mango', 'Xoài sấy')],
  KH: [f('Fish amok', 'Fish amok', 'Amok cá'), f('Lok lak', 'Beef lok lak', 'Lok lak bò'), f('Num banh chok', 'Num banhchok'), f('Kampot pepper crab', 'Kampot pepper', 'Cua xào tiêu Kampot')],
  LA: [f('Sticky rice', 'Glutinous rice', 'Xôi nếp'), f('Larb', 'Larb', 'Láp'), f('Tam mak hoong', 'Green papaya salad', 'Gỏi đu đủ'), f('Khao piak sen'), f('Khao jee', 'Khao jee pâté', 'Bánh mì Lào'), f('Beerlao')],
  VN: [f('Phở', 'Pho'), f('Bún chả', 'Bún chả'), f('Bún bò Huế', 'Bún bò Huế'), f('Cao lầu', 'Cao lầu'), f('Bánh mì', 'Bánh mì'), f('Cơm tấm', 'Cơm tấm'), f('Cà phê trứng', 'Egg coffee'), f('Cà phê sữa đá', 'Vietnamese iced coffee')],
};
