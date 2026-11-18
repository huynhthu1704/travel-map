// Checklist gợi ý mặc định theo loại chuyến đi (trong nước / nước ngoài) và giai đoạn (trước khi đi / trước khi về).
// Người dùng có thể bỏ bớt hoặc thêm mục của riêng mình sau khi tạo.
// Mục bắt đầu bằng '@' là việc chung của cả nhóm (1 người làm là xong); còn lại mỗi người tự tick.

export const CHECKLIST_TEMPLATES = {
  domestic: {
    before: {
      vi: [
        'CCCD / căn cước, bằng lái xe',
        '@Vé xe / vé máy bay và xác nhận đặt phòng',
        'Tiền mặt + thẻ ngân hàng',
        'Sạc điện thoại, sạc dự phòng, tai nghe',
        'Quần áo hợp thời tiết, giày dép',
        'Đồ vệ sinh cá nhân',
        'Thuốc men cơ bản (say xe, đau bụng, hạ sốt, băng cá nhân)',
        'Kem chống nắng, mũ, kính râm',
        '@Xem dự báo thời tiết nơi đến',
        'Tắt điện, khoá ga, khoá cửa nhà',
        'Báo người thân lịch trình',
      ],
      en: [
        'ID card, driving licence',
        '@Bus / flight tickets and hotel confirmation',
        'Cash + bank cards',
        'Phone charger, power bank, earphones',
        'Clothes for the weather, shoes',
        'Toiletries',
        'Basic medicine (motion sickness, stomach, fever, plasters)',
        'Sunscreen, hat, sunglasses',
        '@Check the weather forecast',
        'Switch off power, gas, lock the house',
        'Share your itinerary with family',
      ],
    },
    return: {
      vi: [
        'Kiểm tra phòng: tủ, ngăn kéo, phòng tắm, két sắt',
        'Sạc, cáp và đồ điện tử',
        'Giấy tờ tùy thân, ví',
        '@Trả phòng, trả xe thuê, lấy lại tiền cọc',
        'Đặc sản / quà cho mọi người',
        '@Kiểm tra vé về và giờ khởi hành',
        'Đồ cá nhân trên xe / trong cốp',
      ],
      en: [
        'Check the room: wardrobe, drawers, bathroom, safe',
        'Chargers, cables and electronics',
        'ID and wallet',
        '@Check out, return rentals, get deposits back',
        'Local specialties / gifts',
        '@Check return tickets and departure time',
        'Personal items left in the car',
      ],
    },
  },
  international: {
    before: {
      vi: [
        'Hộ chiếu (còn hạn ít nhất 6 tháng)',
        'Visa / giấy tờ nhập cảnh, khai báo điện tử nếu cần',
        '@Vé máy bay, xác nhận khách sạn (bản in + trên điện thoại)',
        'Bảo hiểm du lịch',
        'Đổi ngoại tệ, thẻ thanh toán quốc tế',
        'Báo ngân hàng sắp dùng thẻ ở nước ngoài',
        'eSIM / SIM du lịch / chuyển vùng quốc tế',
        'Ổ cắm chuyển đổi',
        'Sạc + sạc dự phòng (để trong hành lý xách tay)',
        'Thuốc men + đơn thuốc nếu có',
        'Chụp lại giấy tờ quan trọng, lưu trên điện thoại',
        'Kiểm tra quy định hành lý của hãng bay',
        '@Tải bản đồ offline và app dịch',
        'Tắt điện, khoá ga, khoá cửa nhà',
      ],
      en: [
        'Passport (valid for at least 6 months)',
        'Visa / entry forms, e-arrival card if required',
        '@Flight tickets, hotel confirmation (printed + on phone)',
        'Travel insurance',
        'Foreign currency, international cards',
        'Tell your bank you will use cards abroad',
        'eSIM / travel SIM / roaming',
        'Plug adapter',
        'Chargers + power bank (in carry-on)',
        'Medicine + prescriptions',
        'Photos of key documents saved on your phone',
        "Check the airline's baggage rules",
        '@Download offline maps and a translation app',
        'Switch off power, gas, lock the house',
      ],
    },
    return: {
      vi: [
        'Hộ chiếu và vé máy bay về',
        '@Check-in online chuyến về',
        'Kiểm tra phòng, két sắt, ngăn kéo',
        'Hoàn thuế (VAT refund) tại sân bay nếu có',
        'Quy định hải quan: chất lỏng, thực phẩm, đồ mang về',
        'Tiêu nốt / đổi lại ngoại tệ',
        'Sạc, cáp và đồ điện tử',
        'Quà lưu niệm',
        '@Trả SIM / thiết bị thuê, lấy lại tiền cọc',
      ],
      en: [
        'Passport and return flight tickets',
        '@Online check-in for the flight home',
        'Check the room, safe and drawers',
        'VAT refund at the airport if eligible',
        'Customs rules: liquids, food, items you bring back',
        'Spend or exchange leftover currency',
        'Chargers, cables and electronics',
        'Souvenirs',
        '@Return rented SIM / devices, get deposits back',
      ],
    },
  },
};

export const templateItems = (kind, phase, lang) => {
  const t = CHECKLIST_TEMPLATES[kind === 'international' ? 'international' : 'domestic'][phase === 'return' ? 'return' : 'before'];
  return (t[lang] || t.vi).map((raw, i) => ({
    id: `t${i}-${Math.random().toString(36).slice(2, 7)}`,
    text: raw.replace(/^@/, ''),
    scope: raw.startsWith('@') ? 'shared' : 'personal',
    done: false,
    doneBy: null,
    doneMap: {},
  }));
};
