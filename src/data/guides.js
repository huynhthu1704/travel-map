/**
 * Cẩm nang du lịch châu Á (12 nước) — nội dung song ngữ, kiểm tra visa tháng 11/2026 cho hộ chiếu Việt Nam.
 * Mỗi mục: { vi, en }. Có thể chứa link dạng [chữ](https://…).
 * Thêm nước mới: thêm 1 phần tử vào GUIDES với cùng các khoá trong SECTIONS.
 */
export const GUIDES_CHECKED = '2026-11';

export const SECTIONS = [
  { key: 'visa', icon: '🛂', vi: 'Visa & giấy tờ', en: 'Visas & documents' },
  { key: 'season', icon: '🌤️', vi: 'Mùa đẹp nhất', en: 'Best time to visit' },
  { key: 'money', icon: '💸', vi: 'Tiền & chi phí', en: 'Money & costs' },
  { key: 'power', icon: '🔌', vi: 'Ổ điện', en: 'Power plugs' },
  { key: 'emergency', icon: '🆘', vi: 'Số khẩn cấp', en: 'Emergency numbers' },
  { key: 'places', icon: '📍', vi: 'Nơi nên đi', en: 'Where to go' },
  { key: 'food', icon: '🍜', vi: 'Món phải thử', en: 'Must-try food' },
  { key: 'transport', icon: '🚆', vi: 'Di chuyển', en: 'Getting around' },
  { key: 'phrases', icon: '🗣️', vi: 'Câu nói hữu ích', en: 'Useful phrases' },
  { key: 'etiquette', icon: '🙏', vi: 'Lưu ý văn hoá', en: 'Etiquette' },
];

const gm = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const GUIDES = [
  {
    cc: 'TH',
    visaTag: { vi: 'Miễn visa 30 ngày', en: '30 days visa-free' },
    lead: {
      vi: 'Miễn visa 30 ngày, bay chưa tới 2 giờ, ăn ngon và rẻ — lựa chọn dễ nhất cho chuyến nước ngoài đầu tiên.',
      en: '30 days visa-free, under 2 hours by air, cheap and delicious — the easiest first trip abroad.',
    },
    visa: {
      vi: 'Miễn visa 30 ngày (Thái Lan rút từ 60 về 30 ngày từ tháng 5/2026), gia hạn thêm 30 ngày tại phòng xuất nhập cảnh. Bắt buộc khai **TDAC** (thẻ nhập cảnh điện tử, miễn phí) trong 3 ngày trước khi đến tại [tdac.immigration.go.th](https://tdac.immigration.go.th). Mang vé khứ hồi.',
      en: '30 days visa-free (cut from 60 in May 2026), extendable 30 days. Fill in the free **TDAC** digital arrival card within 3 days before arrival at [tdac.immigration.go.th](https://tdac.immigration.go.th). Carry a return ticket.',
    },
    season: {
      vi: 'Tháng 11 – 2 (mát, khô). Tháng 3 – 5 rất nóng; tết Songkran 13–15/4 té nước. Phía Đông (Koh Samui) mưa nhiều tháng 10 – 12.',
      en: 'Nov – Feb (cool, dry). Mar – May is very hot; Songkran water festival 13–15 Apr. Gulf islands (Koh Samui) are wet Oct – Dec.',
    },
    money: {
      vi: 'Baht (THB). Khoảng 40–70 USD/ngày. Quét QR và thẻ phổ biến ở Bangkok; chợ đêm dùng tiền mặt.',
      en: 'Baht (THB). About USD 40–70 a day. Cards and QR common in Bangkok; markets are cash.',
    },
    power: { vi: '220V, ổ A/B/C/O (ổ Việt Nam cắm được).', en: '220V, plugs A/B/C/O.' },
    places: {
      vi: 'Bangkok (Chùa Phật Ngọc, Wat Arun, chợ Chatuchak cuối tuần), Chiang Mai (phố cổ, Doi Suthep), Phuket – Krabi (đảo Phi Phi, biển Railay), Pattaya đi 1 ngày từ Bangkok.',
      en: 'Bangkok (Grand Palace, Wat Arun, weekend Chatuchak market), Chiang Mai (old city, Doi Suthep), Phuket – Krabi (Phi Phi, Railay), Pattaya as a day trip.',
    },
    food: { vi: 'Pad thai, tom yum, som tam (gỏi đu đủ), xôi xoài, khao soi (Chiang Mai), trà sữa Thái.', en: 'Pad thai, tom yum, som tam, mango sticky rice, khao soi (Chiang Mai), Thai milk tea.' },
    transport: {
      vi: 'Bangkok: tàu BTS/MRT, thuyền trên sông Chao Phraya, đặt xe Grab/Bolt. Liên tỉnh: bay nội địa giá rẻ hoặc tàu đêm đi Chiang Mai. Tránh tuk-tuk không chốt giá trước.',
      en: 'Bangkok: BTS/MRT, Chao Phraya boats, Grab/Bolt. Between cities: budget flights or the night train to Chiang Mai. Agree tuk-tuk prices first.',
    },
    phrases: {
      vi: 'Xin chào: *sa-wat-dee kha/khrap* · Cảm ơn: *khop khun kha/khrap* · Bao nhiêu tiền: *tao rai?* · Không cay: *mai phet* (nữ nói *kha*, nam nói *khrap* ở cuối câu)',
      en: 'Hello: *sawasdee kha/khrap* · Thank you: *khop khun kha/khrap* · How much: *tao rai?* · Not spicy: *mai phet*',
    },
    etiquette: {
      vi: 'Không nói xấu hoàng gia (vi phạm luật). Vào chùa che vai và đầu gối, cởi giày. Không chạm đầu người khác, không chỉ chân vào người hay tượng Phật. Thuốc lá điện tử bị cấm.',
      en: 'Never criticise the monarchy (it is a crime). Cover shoulders and knees in temples, remove shoes. Don’t touch heads or point feet. E-cigarettes are banned.',
    },
  },
  {
    cc: 'JP',
    visaTag: { vi: 'Cần visa', en: 'Visa required' },
    lead: {
      vi: 'Cần xin visa trước và chi phí cao, bù lại là an toàn, sạch và đi lại cực kỳ thuận tiện.',
      en: 'Visa needed and pricier, but very safe, clean and easy to get around.',
    },
    visa: {
      vi: `**Cần visa**. Khách tự túc nộp hồ sơ qua đại sứ quán / lãnh sự quán Nhật ([Hà Nội](${gm('Embassy of Japan in Vietnam Hanoi')}), [TP.HCM](${gm('Consulate General of Japan Ho Chi Minh City')}), [Đà Nẵng](${gm('Consulate General of Japan Da Nang')})) hoặc đại lý được ủy quyền; eVisa chỉ dành cho tour trọn gói. Từ 1/7/2026 phí tăng mạnh: visa 1 lần khoảng 2,59 triệu đồng, nhiều lần khoảng 5,17 triệu. Nộp trước ít nhất 3–4 tuần.`,
      en: `**Visa required.** Independent travellers apply via the Japanese embassy ([Hanoi](${gm('Embassy of Japan in Vietnam Hanoi')})) or consulates ([HCMC](${gm('Consulate General of Japan Ho Chi Minh City')}), [Da Nang](${gm('Consulate General of Japan Da Nang')})) or accredited agencies; the eVisa is for package tours only. From 1 Jul 2026 fees rose: about VND 2.59 million single entry, VND 5.17 million multiple. Apply 3–4 weeks ahead.`,
    },
    season: {
      vi: 'Hoa anh đào cuối tháng 3 – đầu tháng 4; lá đỏ tháng 11. Tránh Tuần lễ Vàng (29/4 – 5/5) và Obon giữa tháng 8 vì đông, đắt. Tháng 6 mưa dầm, tháng 7 – 8 nóng ẩm.',
      en: 'Cherry blossoms late Mar – early Apr; autumn leaves in Nov. Avoid Golden Week (29 Apr – 5 May) and mid-Aug Obon. June is rainy; Jul – Aug hot and humid.',
    },
    money: {
      vi: 'Yên (JPY). Khoảng 100–160 USD/ngày. Thẻ IC (Suica, PASMO, ICOCA) nạp tiền dùng cho tàu, bus, cửa hàng tiện lợi; vẫn nên mang tiền mặt cho quán nhỏ.',
      en: 'Yen (JPY). About USD 100–160 a day. A top-up IC card (Suica, PASMO, ICOCA) works on trains, buses and convenience stores; keep some cash for small shops.',
    },
    power: { vi: '100V, ổ A/B (chân dẹt) — cần đầu chuyển cho phích tròn Việt Nam.', en: '100V, plugs A/B.' },
    places: {
      vi: 'Tokyo (Asakusa, Shibuya, Shinjuku), núi Phú Sĩ – Kawaguchiko, Kyoto (Fushimi Inari, Kiyomizu-dera, Arashiyama), Nara (hươu), Osaka (Dotonbori). Lần đầu: 7–10 ngày cung Tokyo – Kyoto – Osaka.',
      en: 'Tokyo (Asakusa, Shibuya, Shinjuku), Mt Fuji – Kawaguchiko, Kyoto (Fushimi Inari, Kiyomizu-dera, Arashiyama), Nara, Osaka (Dotonbori). First trip: 7–10 days Tokyo – Kyoto – Osaka.',
    },
    food: { vi: 'Sushi, ramen, tempura, takoyaki và okonomiyaki (Osaka), bò wagyu, đồ ăn cửa hàng tiện lợi (onigiri), matcha.', en: 'Sushi, ramen, tempura, takoyaki and okonomiyaki (Osaka), wagyu, convenience-store onigiri, matcha.' },
    transport: {
      vi: 'Tàu điện đúng giờ, đến mọi nơi. Tàu cao tốc Shinkansen Tokyo – Kyoto khoảng 2 giờ 15 phút. JR Pass chỉ đáng mua khi đi nhiều chặng xa — tính trước giá vé lẻ. Taxi rất đắt.',
      en: 'Trains are punctual and go everywhere. Shinkansen Tokyo – Kyoto is about 2h15. The JR Pass only pays off with several long legs — compare single fares first. Taxis are expensive.',
    },
    phrases: {
      vi: 'Xin chào: *konnichiwa* · Cảm ơn: *arigatou gozaimasu* · Xin lỗi / làm ơn: *sumimasen* · Cái này bao nhiêu: *kore wa ikura desu ka?*',
      en: 'Hello: *konnichiwa* · Thank you: *arigatou gozaimasu* · Excuse me: *sumimasen* · How much: *kore wa ikura desu ka?*',
    },
    etiquette: {
      vi: 'Không tip. Xếp hàng, nói nhỏ, không nghe điện thoại trên tàu. Ít thùng rác công cộng — mang rác theo. Cởi giày khi vào nhà, ryokan và một số nhà hàng. Onsen thường từ chối khách có hình xăm lớn.',
      en: 'No tipping. Queue, speak softly, no phone calls on trains. Few public bins — carry your rubbish. Remove shoes indoors, in ryokan and some restaurants. Many onsen refuse visible tattoos.',
    },
  },
  {
    cc: 'KR',
    visaTag: { vi: 'Cần visa C-3', en: 'C-3 visa required' },
    lead: {
      vi: 'Cần visa C-3 nhưng người sống ở Hà Nội, Đà Nẵng, TP.HCM nay xin được visa nhiều lần dài hạn; Seoul + Busan là lịch trình 6–8 ngày dễ nhất.',
      en: 'A C-3 visa is needed; Seoul + Busan makes an easy 6–8 day trip.',
    },
    visa: {
      vi: '**Cần visa C-3** nộp tại Trung tâm tiếp nhận thị thực Hàn Quốc (KVAC) Hà Nội / TP.HCM; người Việt **không dùng được K-ETA** và không có e-visa cho khách lẻ (cẩn thận trang web giả). Phí tham khảo 20 USD (1 lần) / 80 USD (nhiều lần) + phí dịch vụ KVAC. Từ 30/3/2026 mở rộng diện được cấp visa nhiều lần tới 10 năm cho cư dân Hà Nội, Đà Nẵng, TP.HCM đủ điều kiện.',
      en: '**C-3 visa required** via KVAC Hanoi / HCMC; Vietnamese cannot use K-ETA and there is no individual e-visa. About USD 20 single / USD 80 multiple plus a KVAC fee. Since 30 Mar 2026 more residents of Hanoi, Da Nang and HCMC qualify for up-to-10-year multiple-entry visas.',
    },
    season: {
      vi: 'Mùa xuân (hoa anh đào đầu tháng 4) và mùa thu (lá đỏ cuối tháng 10 – tháng 11). Tháng 12 – 2 rất lạnh, có tuyết và trượt tuyết. Tháng 7 – 8 mưa nhiều.',
      en: 'Spring (cherry blossoms early Apr) and autumn (foliage late Oct – Nov). Dec – Feb is freezing with snow and skiing. Jul – Aug is the rainy monsoon.',
    },
    money: {
      vi: 'Won (KRW). Khoảng 80–130 USD/ngày. Thẻ giao thông T-money dùng cho tàu, bus, cửa hàng tiện lợi. Thẻ quốc tế được nhận gần như mọi nơi.',
      en: 'Won (KRW). About USD 80–130 a day. T-money card for metro, buses and convenience stores. Cards accepted almost everywhere.',
    },
    power: { vi: '220V, ổ C/F (phích tròn Việt Nam dùng được).', en: '220V, plugs C/F.' },
    places: {
      vi: 'Seoul (cung Gyeongbokgung mặc hanbok miễn vé, làng Bukchon, Myeongdong, tháp N Seoul), đảo Nami, Busan (Haeundae, làng Gamcheon), đảo Jeju.',
      en: 'Seoul (Gyeongbokgung — free entry in hanbok, Bukchon, Myeongdong, N Seoul Tower), Nami Island, Busan (Haeundae, Gamcheon village), Jeju Island.',
    },
    food: { vi: 'Thịt nướng Hàn (samgyeopsal), gà rán, tteokbokki, bibimbap, canh gà sâm (samgyetang), đồ ăn vặt chợ Gwangjang.', en: 'Korean BBQ (samgyeopsal), fried chicken, tteokbokki, bibimbap, ginseng chicken soup (samgyetang), Gwangjang Market street food.' },
    transport: {
      vi: 'Tàu điện ngầm Seoul dễ đi, biển báo có tiếng Anh. Seoul – Busan bằng tàu cao tốc KTX khoảng 2 giờ 30 phút. Dùng Naver Map hoặc KakaoMap (Google Maps chỉ đường không đầy đủ ở Hàn).',
      en: 'Seoul’s metro is easy with English signs. Seoul – Busan by KTX takes about 2h30. Use Naver Map or KakaoMap — Google Maps directions are limited in Korea.',
    },
    phrases: { vi: 'Xin chào: *annyeonghaseyo* · Cảm ơn: *kamsahamnida* · Bao nhiêu tiền: *eolmayeyo?* · Cho tôi cái này: *igeo juseyo*', en: 'Hello: *annyeonghaseyo* · Thank you: *kamsahamnida* · How much: *eolmayeyo?* · This one please: *igeo juseyo*' },
    etiquette: {
      vi: 'Không tip. Nhận đồ và rót rượu cho người lớn tuổi bằng hai tay. Ghế ưu tiên trên tàu (màu hồng / đỏ) để trống. Không cắm đũa dựng đứng vào bát cơm.',
      en: 'No tipping. Use both hands when giving to or pouring for elders. Leave priority seats (pink/red) free. Never stand chopsticks upright in rice.',
    },
  },
  {
    cc: 'SG',
    visaTag: { vi: 'Miễn visa 30 ngày', en: '30 days visa-free' },
    // Tờ khai nhập cảnh điện tử chính thức (miễn phí) — hiện thành nút trong mục Visa
    entryForms: [{ name: { vi: 'Khai SG Arrival Card (trang ICA chính thức)', en: 'Submit SG Arrival Card (official ICA site)' }, url: 'https://eservices.ica.gov.sg/sgarrivalcard/' }],
    lead: { vi: 'Miễn visa 30 ngày, nhỏ gọn, an toàn — 3–4 ngày là đủ, nhưng chỗ ở đắt.', en: '30 days visa-free, compact and safe — 3–4 days is enough, though hotels are pricey.' },
    visa: {
      vi: 'Miễn visa 30 ngày. Khai **SG Arrival Card** điện tử miễn phí trong 3 ngày trước khi đến (trang ICA hoặc app MyICA — tránh trang thu phí). Hộ chiếu còn hạn trên 6 tháng, có vé ra khỏi Singapore.',
      en: '30 days visa-free. Submit the free **SG Arrival Card** within 3 days before arrival (ICA site or MyICA app — avoid paid look-alikes). 6+ months passport validity and an onward ticket.',
    },
    season: { vi: 'Nóng ẩm quanh năm (25–32°C). Tháng 2 – 4 ít mưa hơn; tháng 11 – 1 mưa nhiều nhưng có trang trí Giáng sinh.', en: 'Hot and humid all year (25–32°C). Feb – Apr is drier; Nov – Jan is wetter but festive.' },
    money: {
      vi: 'Đô la Singapore (SGD). Khoảng 100–170 USD/ngày, phần lớn là khách sạn. Ăn ở khu ẩm thực (hawker centre) rẻ. Chạm thẻ Visa/Master để đi tàu, bus.',
      en: 'Singapore dollar (SGD). About USD 100–170 a day, mostly hotel. Hawker centres keep food cheap. Tap a contactless card on metro and buses.',
    },
    power: { vi: '230V, ổ G (3 chân vuông kiểu Anh) — cần đầu chuyển.', en: '230V, plug G — bring an adapter.' },
    places: {
      vi: 'Marina Bay (Merlion, Marina Bay Sands), Gardens by the Bay (show đèn miễn phí buổi tối), Jewel Changi, Sentosa, Chinatown, Little India, Kampong Glam.',
      en: 'Marina Bay (Merlion, Marina Bay Sands), Gardens by the Bay (free evening light show), Jewel Changi, Sentosa, Chinatown, Little India, Kampong Glam.',
    },
    food: { vi: 'Cơm gà Hải Nam, cua sốt ớt, laksa, bánh mì nướng kaya + trứng lòng đào, satay ở Lau Pa Sat.', en: 'Hainanese chicken rice, chilli crab, laksa, kaya toast with soft-boiled eggs, satay at Lau Pa Sat.' },
    transport: {
      vi: 'Tàu MRT phủ gần hết, sân bay Changi có tuyến MRT thẳng vào trung tâm. Đặt xe Grab, Gojek. Đi bộ nhiều, khá nóng — mang ô.',
      en: 'The MRT covers almost everything, including Changi Airport. Grab and Gojek for rides. Lots of walking in heat — carry an umbrella.',
    },
    phrases: {
      vi: 'Tiếng Anh dùng mọi nơi. Ở khu ẩm thực: *da bao* = mang về, *kopi* = cà phê, *kopi-o* = cà phê đen có đường, *teh* = trà sữa.',
      en: 'English everywhere. Hawker lingo: *da bao* = takeaway, *kopi* = coffee, *kopi-o* = black coffee with sugar, *teh* = milk tea.',
    },
    etiquette: {
      vi: 'Luật nghiêm: cấm nhố kẹo cao su, xả rác bị phạt nặng, không ăn uống trên MRT, thuốc lá điện tử bị cấm. Ở khu ẩm thực, gói khăn giấy đặt trên bàn là “cho giữ chỗ”.',
      en: 'Strict laws: no chewing gum sales, heavy littering fines, no eating or drinking on the MRT, vapes banned. A tissue pack on a hawker table means the seat is taken.',
    },
  },
  {
    cc: 'MY',
    visaTag: { vi: 'Miễn visa 30 ngày', en: '30 days visa-free' },
    entryForms: [{ name: { vi: 'Khai MDAC (trang Sở Di trú Malaysia)', en: 'Submit MDAC (official Immigration site)' }, url: 'https://imigresen-online.imi.gov.my/mdac/main' }],
    lead: { vi: 'Miễn visa 30 ngày, chi phí dễ chịu, ẩm thực pha trộn Mã Lai – Hoa – Ấn.', en: '30 days visa-free, affordable, with a Malay – Chinese – Indian food mix.' },
    visa: {
      vi: 'Miễn visa 30 ngày. Bắt buộc khai **MDAC** (thẻ nhập cảnh điện tử, miễn phí) trong 3 ngày trước khi đến — cả đường bay, bộ, biển; cẩn thận trang giả thu phí.',
      en: '30 days visa-free. Submit the free **MDAC** digital arrival card within 3 days before arrival by air, land or sea; beware paid copycat sites.',
    },
    season: {
      vi: 'Kuala Lumpur nóng ẩm quanh năm. Bờ Tây (Penang, Langkawi) đẹp tháng 12 – 4; bờ Đông (Perhentian, Redang) chỉ nên đi tháng 4 – 9, mùa gió mùa nhiều đảo đóng cửa.',
      en: 'KL is hot year-round. West coast (Penang, Langkawi) is best Dec – Apr; east-coast islands (Perhentian, Redang) Apr – Sep only.',
    },
    money: { vi: 'Ringgit (MYR). Khoảng 40–70 USD/ngày. Thẻ Touch ’n Go cho tàu và đường cao tốc; nhiều nơi nhận quét QR.', en: 'Ringgit (MYR). About USD 40–70 a day. Touch ’n Go card for rail and tolls; QR payments common.' },
    power: { vi: '240V, ổ G (3 chân vuông) — cần đầu chuyển.', en: '240V, plug G.' },
    places: {
      vi: 'Kuala Lumpur (tháp đôi Petronas, động Batu, phố Jalan Alor), Melaka (phố cổ di sản), Penang (George Town, tranh tường), Cameron Highlands (đồi chè), Langkawi, Sabah (núi Kinabalu).',
      en: 'Kuala Lumpur (Petronas Towers, Batu Caves, Jalan Alor), Melaka, Penang (George Town street art), Cameron Highlands, Langkawi, Sabah (Mt Kinabalu).',
    },
    food: { vi: 'Nasi lemak, char kway teow, roti canai và teh tarik, laksa Penang, satay, sầu riêng Musang King (tháng 6 – 8).', en: 'Nasi lemak, char kway teow, roti canai with teh tarik, Penang laksa, satay, Musang King durian (Jun – Aug).' },
    transport: {
      vi: 'KL: tàu LRT/MRT/Monorail, tàu KLIA Ekspres từ sân bay 28 phút. Grab rẻ và phổ biến. KL – Penang: tàu ETS khoảng 4 giờ hoặc bay.',
      en: 'KL: LRT/MRT/Monorail, KLIA Ekspres from the airport in 28 min. Grab is cheap and everywhere. KL – Penang: ETS train about 4h or a short flight.',
    },
    phrases: {
      vi: 'Xin chào: *selamat pagi* (sáng) / *hai* · Cảm ơn: *terima kasih* · Bao nhiêu: *berapa?* · Không cay: *tak pedas*. Tiếng Anh dùng rộng rãi.',
      en: 'Hello: *selamat pagi* / *hai* · Thank you: *terima kasih* · How much: *berapa?* · Not spicy: *tak pedas*. English widely spoken.',
    },
    etiquette: {
      vi: 'Đa số theo đạo Hồi: ăn mặc kín đáo, vào thánh đường mượn áo chùng (nữ che tóc). Dùng tay phải để ăn và đưa đồ. Tháng Ramadan hạn chế ăn uống nơi công cộng ban ngày.',
      en: 'Mostly Muslim: dress modestly; robes are lent at mosques (women cover hair). Use your right hand to eat and pass things. Avoid eating in public by day during Ramadan.',
    },
  },
  {
    cc: 'ID',
    visaTag: { vi: 'Miễn visa 30 ngày', en: '30 days visa-free' },
    lead: { vi: 'Miễn visa 30 ngày cho khách ASEAN; Bali là điểm đến chính nhưng phải nộp phí du lịch riêng.', en: '30 days visa-free for ASEAN; Bali is the main draw but adds its own tourist levy.' },
    visa: {
      vi: 'Miễn visa 30 ngày (không gia hạn được). Khai tờ khai **All Indonesia** miễn phí ([allindonesia.imigrasi.go.id](https://allindonesia.imigrasi.go.id)) trong 3 ngày trước khi đến. Đi Bali: thêm **phí du lịch 150.000 IDR**/người (khoảng 10 USD), trả trước tại Love Bali hoặc tại sân bay. Chỉ dùng trang đuôi .go.id.',
      en: '30 days visa-free (not extendable). Fill in the free **All Indonesia** arrival form within 3 days before arrival. Bali adds a **IDR 150,000 tourist levy** (about USD 10) via Love Bali or at the airport. Use .go.id sites only.',
    },
    season: {
      vi: 'Mùa khô tháng 4 – 10 (Bali, Lombok, Komodo đẹp nhất tháng 5 – 9). Tháng 11 – 3 mưa nhiều. Tránh Ngày Im lặng Nyepi ở Bali (thường tháng 3): sân bay đóng cửa 24 giờ.',
      en: 'Dry season Apr – Oct (Bali, Lombok, Komodo best May – Sep). Nov – Mar is wet. On Bali’s Nyepi Day of Silence (usually March) the airport closes for 24 hours.',
    },
    money: { vi: 'Rupiah (IDR). Khoảng 40–80 USD/ngày (Bali). Đổi tiền ở quầy có giấy phép, đếm lại tại chỗ.', en: 'Rupiah (IDR). About USD 40–80 a day in Bali. Use licensed money changers and count on the spot.' },
    power: { vi: '230V, ổ C/F (phích tròn dùng được).', en: '230V, plugs C/F.' },
    places: {
      vi: 'Bali (Ubud – ruộng bậc thang Tegallalang, đền Tanah Lot, Uluwatu, Nusa Penida), Lombok và quần đảo Gili, vườn quốc gia Komodo, Yogyakarta (đền Borobudur, Prambanan), núi lửa Bromo.',
      en: 'Bali (Ubud and Tegallalang rice terraces, Tanah Lot, Uluwatu, Nusa Penida), Lombok and the Gilis, Komodo National Park, Yogyakarta (Borobudur, Prambanan), Mt Bromo.',
    },
    food: { vi: 'Nasi goreng, mie goreng, satay, rendang, babi guling (heo quay Bali), cà phê Java.', en: 'Nasi goreng, mie goreng, satay, rendang, babi guling (Balinese roast pork), Java coffee.' },
    transport: {
      vi: 'Bali không có tàu: thuê xe có tài xế theo ngày hoặc đặt Grab/Gojek (một số khu hạn chế xe công nghệ). Đảo xa: tàu cao tốc hoặc bay nội địa. Thuê xe máy cần bằng lái quốc tế.',
      en: 'No trains on Bali: hire a car with driver by the day, or use Grab/Gojek (restricted in some areas). Fast boats or domestic flights between islands. Riding a scooter requires an international licence.',
    },
    phrases: { vi: 'Cảm ơn: *terima kasih* · Bao nhiêu: *berapa?* · Không, cảm ơn: *tidak, terima kasih* · Ngon: *enak*', en: 'Thank you: *terima kasih* · How much: *berapa?* · No, thanks: *tidak, terima kasih* · Delicious: *enak*' },
    etiquette: {
      vi: 'Vào đền ở Bali phải quấn sarong (thường cho mượn). Không dẫm lên đĩa lễ vật canang trên đường. Ngoài Bali đa số theo đạo Hồi — ăn mặc kín đáo. Bali ban hành quy tắc ứng xử cho khách, vi phạm có thể bị trục xuất.',
      en: 'Wear a sarong in Bali temples (usually lent). Don’t step on canang offerings. Outside Bali most people are Muslim — dress modestly. Bali has a visitor code of conduct; breaches can mean deportation.',
    },
  },
  {
    cc: 'CN',
    visaTag: { vi: 'Cần visa (quá cảnh 10 ngày, Hải Nam 30 ngày miễn visa)', en: 'Visa (10-day transit & Hainan visa-free)' },
    lead: {
      vi: 'Từ 20/8/2026 người Việt được quá cảnh miễn visa 10 ngày và vào Hải Nam miễn visa 30 ngày; đi du lịch khứ hồi thông thường vẫn cần visa.',
      en: 'Since 20 Aug 2026 Vietnamese get 10-day visa-free transit and 30-day visa-free Hainan; a normal round trip still needs a visa.',
    },
    visa: {
      vi: '**Visa du lịch (L)** cho chuyến khứ hồi Việt Nam – Trung Quốc – Việt Nam. **Quá cảnh 240 giờ** miễn visa qua 65 cửa khẩu nếu có vé đi tiếp **sang nước thứ ba** (ví dụ Hà Nội → Thượng Hải → Seoul). **Hải Nam:** miễn visa 30 ngày khi nhập cảnh và ở trong tỉnh.',
      en: '**Tourist (L) visa** for a Vietnam – China – Vietnam trip. **240-hour visa-free transit** via 65 ports with a confirmed onward ticket to a **third country**. **Hainan:** 30 days visa-free within the province.',
    },
    season: {
      vi: 'Mùa xuân (tháng 4 – 5) và mùa thu (tháng 9 – 10). Tránh Tết Nguyên đán và Quốc khánh 1 – 7/10: cả nước đi chơi, cực đông. Hải Nam đẹp tháng 11 – 4.',
      en: 'Spring (Apr – May) and autumn (Sep – Oct). Avoid Chinese New Year and Golden Week (1 – 7 Oct). Hainan is best Nov – Apr.',
    },
    money: {
      vi: 'Nhân dân tệ (CNY). Khoảng 60–110 USD/ngày. Thanh toán gần như toàn bộ qua **Alipay / WeChat Pay** — cài và liên kết thẻ quốc tế trước khi đi, vẫn mang chút tiền mặt.',
      en: 'Yuan (CNY). About USD 60–110 a day. Nearly everything is paid by **Alipay / WeChat Pay** — link a foreign card before you go; carry a little cash.',
    },
    power: { vi: '220V, ổ A/C/I.', en: '220V, plugs A/C/I.' },
    places: {
      vi: 'Bắc Kinh (Vạn Lý Trường Thành – đoạn Mộ Điền Dụ, Tử Cấm Thành), Thượng Hải (Bến Thượng Hải), Trùng Khánh, Trương Gia Giới, Quế Lâm – Dương Sóc, Vân Nam (Lệ Giang, Đại Lý), Hải Nam (Tam Á).',
      en: 'Beijing (Great Wall at Mutianyu, Forbidden City), Shanghai (the Bund), Chongqing, Zhangjiajie, Guilin – Yangshuo, Yunnan (Lijiang, Dali), Hainan (Sanya).',
    },
    food: { vi: 'Vịt quay Bắc Kinh, lẩu Tứ Xuyên / Trùng Khánh, tiểu long bao Thượng Hải, mì kéo Lan Châu, bún qua cầu Vân Nam.', en: 'Peking duck, Sichuan / Chongqing hotpot, Shanghai xiaolongbao, Lanzhou hand-pulled noodles, Yunnan crossing-the-bridge noodles.' },
    transport: {
      vi: 'Tàu cao tốc nối các thành phố (Bắc Kinh – Thượng Hải khoảng 4–5 giờ), mua vé trên app Trip.com hoặc 12306 bằng hộ chiếu. Google, Facebook, Gmail bị chặn — mua eSIM chuyển vùng quốc tế, dùng Amap hoặc Baidu Maps.',
      en: 'High-speed rail links the cities (Beijing – Shanghai about 4–5h); book on Trip.com or 12306 with your passport. Google, Facebook and Gmail are blocked — get a roaming eSIM; use Amap or Baidu Maps.',
    },
    phrases: { vi: 'Xin chào: *nǐ hǎo* · Cảm ơn: *xièxie* · Bao nhiêu tiền: *duōshǎo qián?* · Không cay: *bù yào là*', en: 'Hello: *nǐ hǎo* · Thank you: *xièxie* · How much: *duōshǎo qián?* · Not spicy: *bù yào là*' },
    etiquette: {
      vi: 'Không tip. Mang hộ chiếu theo người — cần khi vào điểm tham quan, mua vé tàu. Nhiều điểm nổi tiếng phải đặt vé trước theo tên thật (Tử Cấm Thành). Tránh bàn chuyện chính trị.',
      en: 'No tipping. Carry your passport — needed for sights and train tickets. Major sights (Forbidden City) need advance real-name booking. Avoid political topics.',
    },
  },
  {
    cc: 'TW',
    visaTag: { vi: 'Cần visa (hoặc TAC)', en: 'Visa (or TAC) required' },
    lead: { vi: 'Cần visa (trừ khi có visa Mỹ, Châu Âu… còn hạn); đổi lại là gần, thân thiện, đồ ăn đường phố tuyệt vời.', en: 'Visa needed unless you hold certain Western visas; close, friendly, great street food.' },
    visa: {
      vi: '**Cần visa**, nộp qua Văn phòng Kinh tế – Văn hoá Đài Bắc (Hà Nội, TP.HCM). Người đang có visa / thẻ cư trú còn hạn của Mỹ, Canada, Anh, Schengen, Úc, New Zealand có thể xin **Giấy phép du lịch trực tuyến (TAC)** miễn phí; visa Nhật / Hàn **không còn** được dùng cho TAC từ 9/2023. Danh sách có thể thay đổi — kiểm tra trang [Cục Di dân](https://niaspeedy.immigration.gov.tw/nia_southeast/).',
      en: '**Visa required** via the Taipei Economic and Cultural Office (Hanoi, HCMC). Holders of a valid US, Canadian, UK, Schengen, Australian or NZ visa/residence may apply for a free online **Travel Authorization Certificate (TAC)**; Japanese/Korean visas no longer qualify since Sep 2023. Check the [National Immigration Agency](https://niaspeedy.immigration.gov.tw/nia_southeast/).',
    },
    season: {
      vi: 'Tháng 10 – 4 mát mẻ, dễ đi. Tháng 7 – 9 nóng, có bão. Hoa anh đào tháng 2 – 3 ở A Lý Sơn và Dương Minh Sơn.',
      en: 'Oct – Apr is mild and pleasant. Jul – Sep is hot with typhoons. Cherry blossoms Feb – Mar at Alishan and Yangmingshan.',
    },
    money: { vi: 'Đài tệ (TWD). Khoảng 60–100 USD/ngày. Thẻ EasyCard dùng cho tàu, bus, cửa hàng tiện lợi. Chợ đêm dùng tiền mặt.', en: 'New Taiwan dollar (TWD). About USD 60–100 a day. EasyCard for metro, buses and convenience stores. Night markets are cash.' },
    power: { vi: '110V, ổ A/B (chân dẹt) — cần đầu chuyển; xem thiết bị có hỗ trợ 110V không.', en: '110V, plugs A/B — check your devices support 110V.' },
    places: {
      vi: 'Đài Bắc (Taipei 101, chợ đêm Sĩ Lâm, Cửu Phần, Thập Phần thả đèn trời), hẻm Taroko ở Hoa Liên, hồ Nhật Nguyệt, Đài Trung (làng Cầu Vồng), Cao Hùng, Đài Nam (đền miếu, đồ ăn cổ).',
      en: 'Taipei (Taipei 101, Shilin night market, Jiufen, Shifen sky lanterns), Taroko Gorge in Hualien, Sun Moon Lake, Taichung, Kaohsiung, Tainan (temples, old-style food).',
    },
    food: { vi: 'Trà sữa trân châu, mì bò, cơm thịt kho (lu ròu fàn), gà rán miếng lớn, đậu phụ thối, bánh bao Din Tai Fung, xôi xoài đá bào.', en: 'Bubble tea, beef noodle soup, braised pork rice, giant fried chicken, stinky tofu, Din Tai Fung dumplings, mango shaved ice.' },
    transport: {
      vi: 'Tàu điện ngầm Đài Bắc sạch, dễ đi. Tàu cao tốc THSR Đài Bắc – Cao Hùng khoảng 1 giờ 30 phút; tàu TRA đi bờ Đông (Hoa Liên). Thẻ EasyCard dùng cho gần hết.',
      en: 'Taipei MRT is clean and easy. THSR high-speed rail Taipei – Kaohsiung about 1h30; TRA trains for the east coast (Hualien). EasyCard works almost everywhere.',
    },
    phrases: {
      vi: 'Xin chào: *nǐ hǎo* · Cảm ơn: *xièxie* · Bao nhiêu: *duōshǎo qián?* · Ít đường / ít đá: *bàn táng / shǎo bīng* (khi gọi trà sữa)',
      en: 'Hello: *nǐ hǎo* · Thank you: *xièxie* · How much: *duōshǎo qián?* · Half sugar / less ice: *bàn táng / shǎo bīng*',
    },
    etiquette: {
      vi: 'Không ăn uống (kể cả nhai kẹo, uống nước) trong khu vực tàu điện ngầm — bị phạt. Ghế ưu tiên màu xanh để trống. Phân loại rác; xe rác phát nhạc đi qua theo giờ.',
      en: 'No eating or drinking (even water or gum) in the MRT system — you will be fined. Leave dark-blue priority seats free. Sort your rubbish; garbage trucks play music on schedule.',
    },
  },
  {
    cc: 'PH',
    visaTag: { vi: 'Miễn visa 21 ngày', en: '21 days visa-free' },
    lead: { vi: 'Miễn visa 21 ngày, biển đảo thuộc hàng đẹp nhất châu Á — nên đi thẳng đảo thay vì ở lâu tại Manila.', en: '21 days visa-free with some of Asia’s best islands — head straight to them rather than lingering in Manila.' },
    visa: {
      vi: 'Miễn visa 21 ngày (theo thỏa thuận song phương). Đăng ký **eTravel** miễn phí ([etravel.gov.ph](https://etravel.gov.ph)) trong 72 giờ trước khi bay. Hộ chiếu còn hạn trên 6 tháng, có vé khứ hồi; có thể bị hỏi chứng minh chỗ ở.',
      en: '21 days visa-free (bilateral). Register on the free **eTravel** portal within 72 hours of flying. 6+ months passport validity and a return ticket; you may be asked for hotel bookings.',
    },
    season: { vi: 'Mùa khô tháng 12 – 5 (tháng 1 – 4 đẹp nhất). Tháng 6 – 11 mùa mưa và bão, chuyến bay / tàu ra đảo dễ bị huỷ.', en: 'Dry season Dec – May (Jan – Apr best). Jun – Nov brings rain and typhoons; island flights and ferries may cancel.' },
    money: { vi: 'Peso (PHP). Khoảng 40–70 USD/ngày. Đảo nhỏ ít cây ATM — mang đủ tiền mặt. Khách đi đảo thường phải nộp phí môi trường nhỏ.', en: 'Peso (PHP). About USD 40–70 a day. Few ATMs on small islands — bring cash. Islands often charge a small environmental fee.' },
    power: { vi: '220V, ổ A/B/C.', en: '220V, plugs A/B/C.' },
    places: {
      vi: 'Palawan (El Nido, Coron, Puerto Princesa – sông ngầm), Boracay (bãi White Beach), Cebu – Bohol (đồi Sôcôla, khỉ Tarsier, bơi cùng cá mòi ở Moalboal), Siargao, Manila cổ (Intramuros).',
      en: 'Palawan (El Nido, Coron, Puerto Princesa underground river), Boracay’s White Beach, Cebu – Bohol (Chocolate Hills, tarsiers, Moalboal sardine run), Siargao, Manila’s Intramuros.',
    },
    food: { vi: 'Adobo, lechon (heo quay Cebu), sinigang (canh chua me), sisig, halo-halo, xoài sấy Cebu.', en: 'Adobo, Cebu lechon, sinigang (sour tamarind soup), sisig, halo-halo, Cebu dried mangoes.' },
    transport: {
      vi: 'Giữa các đảo: bay nội địa (Cebu Pacific, PAL) hoặc tàu cao tốc. Trong thành phố: Grab; xe jeepney và tricycle cho chặng ngắn (hỏi giá trước). Giao thông Manila rất tắc — để dư thời gian ra sân bay.',
      en: 'Between islands: domestic flights (Cebu Pacific, PAL) or fast ferries. In cities: Grab; jeepneys and tricycles for short hops (agree the fare). Manila traffic is heavy — leave early for flights.',
    },
    phrases: {
      vi: 'Tiếng Anh dùng rộng rãi. Cảm ơn: *salamat (po)* · Bao nhiêu: *magkano?* · Chào buổi sáng: *magandang umaga* (thêm *po* để lịch sự).',
      en: 'English widely spoken. Thank you: *salamat (po)* · How much: *magkano?* · Good morning: *magandang umaga* (*po* adds politeness).',
    },
    etiquette: {
      vi: 'Người Philippines rất thân thiện, phần lớn theo Công giáo — ăn mặc lịch sự khi vào nhà thờ. Tip khoảng 5–10% ở nhà hàng nếu chưa tính phí phục vụ. Giữ đồ cẩn thận ở nơi đông người ở Manila.',
      en: 'Very friendly, mostly Catholic — dress respectfully in churches. Tip about 5–10% where no service charge is added. Watch your belongings in crowded parts of Manila.',
    },
  },
  {
    cc: 'KH',
    visaTag: { vi: 'Miễn visa 30 ngày', en: '30 days visa-free' },
    lead: { vi: 'Miễn visa 30 ngày, đi đường bộ từ TP.HCM được; quần thể Angkor đáng để dành trọn 2–3 ngày.', en: '30 days visa-free, reachable overland from HCMC; give Angkor 2–3 full days.' },
    visa: {
      vi: 'Miễn visa 30 ngày cho hộ chiếu phổ thông Việt Nam (theo ASEAN). Campuchia có thẻ nhập cảnh điện tử (e-Arrival) — kiểm tra trang chính thức trước khi đi. Cửa khẩu bộ phổ biến: Mộc Bài – Bavet (Tây Ninh).',
      en: '30 days visa-free for Vietnamese ordinary passports (ASEAN). Check whether the online e-Arrival card is required before you go. Main land crossing: Moc Bai – Bavet.',
    },
    season: { vi: 'Tháng 11 – 2 khô và dịu. Tháng 3 – 5 rất nóng (trên 35°C). Tháng 6 – 10 mưa nhưng cảnh xanh, ít khách.', en: 'Nov – Feb is dry and mild. Mar – May is very hot (35°C+). Jun – Oct is rainy but green and quiet.' },
    money: {
      vi: 'Riel (KHR) nhưng **đô la Mỹ dùng phổ biến**; tiền thối lẻ thường trả bằng riel. Mang tiền USD mới, không rách. Khoảng 35–60 USD/ngày. Vé Angkor 1 ngày 37 USD, 3 ngày 62 USD (giá tham khảo).',
      en: 'Riel (KHR), but **US dollars are widely used**; small change comes in riel. Bring clean, untorn USD notes. About USD 35–60 a day. Angkor pass about USD 37 (1 day) / 62 (3 days).',
    },
    power: { vi: '230V, ổ A/C/G.', en: '230V, plugs A/C/G.' },
    places: {
      vi: 'Siem Reap (Angkor Wat ngắm bình minh, Bayon, Ta Prohm), Phnom Penh (Cung điện Hoàng gia, bảo tàng Tuol Sleng), Kampot – Kep (cua, tiêu), đảo Koh Rong.',
      en: 'Siem Reap (Angkor Wat at sunrise, Bayon, Ta Prohm), Phnom Penh (Royal Palace, Tuol Sleng), Kampot – Kep (crab, pepper), Koh Rong island.',
    },
    food: { vi: 'Amok cá hấp nước cốt dừa, lok lak bò, num banh chok (bún ca-ri), cua xào tiêu Kampot.', en: 'Fish amok, beef lok lak, num banh chok (rice noodles with green curry), Kampot pepper crab.' },
    transport: {
      vi: 'TP.HCM – Phnom Penh xe khách 6–7 giờ; Phnom Penh – Siem Reap xe khách khoảng 6 giờ hoặc bay. Trong thành phố: tuk-tuk, app PassApp / Grab. Đi Angkor: thuê tuk-tuk trọn ngày.',
      en: 'HCMC – Phnom Penh by bus 6–7h; Phnom Penh – Siem Reap bus about 6h or a short flight. In town: tuk-tuks, PassApp or Grab. For Angkor, hire a tuk-tuk for the day.',
    },
    phrases: { vi: 'Xin chào: *suosdey* · Cảm ơn: *aw kun* · Bao nhiêu: *tóch món?*', en: 'Hello: *suosdey* · Thank you: *aw kun* · How much: *tóch món?*' },
    etiquette: {
      vi: 'Vào đền Angkor phải che vai và đầu gối (bị kiểm tra ở cổng lên tầng cao). Không chạm vào đầu người khác và nhà sư. Chỉ mua vé Angkor tại quầy chính thức Angkor Enterprise.',
      en: 'Cover shoulders and knees at Angkor temples (checked at upper levels). Don’t touch heads or monks. Buy Angkor passes only from the official Angkor Enterprise office.',
    },
  },
  {
    cc: 'LA',
    visaTag: { vi: 'Miễn visa 30 ngày', en: '30 days visa-free' },
    lead: { vi: 'Miễn visa 30 ngày, nhịp sống chậm; tàu cao tốc Viêng Chăn – Luang Prabang giúp đi lại nhanh hơn nhiều.', en: '30 days visa-free and slow-paced; the Vientiane – Luang Prabang railway makes it much quicker to get around.' },
    visa: {
      vi: 'Miễn visa 30 ngày cho hộ chiếu phổ thông Việt Nam (theo ASEAN). Vào bằng đường bay hoặc cửa khẩu bộ (Cầu Treo, Lao Bảo, Tây Trang…).',
      en: '30 days visa-free for Vietnamese ordinary passports (ASEAN). Enter by air or land borders (Cau Treo, Lao Bao, Tay Trang…).',
    },
    season: {
      vi: 'Tháng 11 – 2 mát, khô. Tháng 3 – 4 nóng và có khói đốt nương ở phía Bắc. Tết Bunpimay (Songkran Lào) giữa tháng 4. Tháng 6 – 10 mưa, thác nước đẹp nhất.',
      en: 'Nov – Feb is cool and dry. Mar – Apr is hot and smoky up north. Lao New Year mid-April. Jun – Oct is rainy, waterfalls at their best.',
    },
    money: { vi: 'Kip (LAK). Khoảng 30–55 USD/ngày. Nhiều nơi nhận USD hoặc baht Thái nhưng tỷ giá kém — nên rút kip.', en: 'Kip (LAK). About USD 30–55 a day. USD and Thai baht are often accepted at poor rates — withdraw kip.' },
    power: { vi: '230V, ổ A/B/C/E/F.', en: '230V, plugs A/B/C/E/F.' },
    places: {
      vi: 'Luang Prabang (chùa Xieng Thong, lễ khất thực sáng sớm, thác Kuang Si, chợ đêm), Vang Vieng (núi đá vôi, khí cầu, chèo thuyền), Viêng Chăn (That Luang, Patuxai), Cánh đồng Chum, 4.000 đảo (Si Phan Don).',
      en: 'Luang Prabang (Wat Xieng Thong, dawn alms giving, Kuang Si Falls, night market), Vang Vieng (karsts, balloons, kayaking), Vientiane (That Luang, Patuxai), Plain of Jars, Si Phan Don (4,000 Islands).',
    },
    food: { vi: 'Xôi nếp và láp (gỏi thịt băm), gỏi đu đủ tam mak hoong, khao piak sen, bánh mì Lào, bia Beerlao.', en: 'Sticky rice and larb, tam mak hoong (papaya salad), khao piak sen noodle soup, Lao baguette, Beerlao.' },
    transport: {
      vi: 'Tàu cao tốc Lào – Trung: Viêng Chăn – Vang Vieng khoảng 1 giờ, – Luang Prabang khoảng 2 giờ; vé bán nhanh hết, mua trước và mang hộ chiếu. Trong thành phố: tuk-tuk, app LOCA.',
      en: 'Lao–China railway: Vientiane – Vang Vieng about 1h, – Luang Prabang about 2h; tickets sell out, book ahead with your passport. In town: tuk-tuks or the LOCA app.',
    },
    phrases: { vi: 'Xin chào: *sabaidee* · Cảm ơn: *khop jai* · Bao nhiêu: *tao dai?* · Không cay: *bo phet*', en: 'Hello: *sabaidee* · Thank you: *khop jai* · How much: *tao dai?* · Not spicy: *bo phet*' },
    etiquette: {
      vi: 'Xem lễ khất thực ở Luang Prabang trong im lặng, đứng xa, không dùng đèn flash; chỉ dâng lễ nếu thật lòng và ăn mặc chỉnh tề. Phụ nữ không chạm vào nhà sư. Nhiều vùng còn bom mìn chưa nổ — đi đúng đường mòn.',
      en: 'Watch the Luang Prabang alms giving silently from a distance, no flash; only take part if sincere and properly dressed. Women should not touch monks. Unexploded ordnance remains in rural areas — stay on marked paths.',
    },
  },
  {
    cc: 'VN',
    visaTag: { vi: 'Cho khách nước ngoài', en: 'For foreign visitors' },
    lead: {
      vi: 'Viết cho bạn bè quốc tế: e-visa 90 ngày cho mọi quốc tịch, nhiều nước được miễn visa.',
      en: 'Written for foreign visitors: a 90-day e-visa for all nationalities, and many are visa-exempt.',
    },
    visa: {
      vi: '**E-visa** tối đa 90 ngày, 1 hoặc nhiều lần, nộp tại trang chính thức [evisa.gov.vn](https://evisa.gov.vn) (phí tham khảo 25 USD 1 lần). Miễn visa: các nước ASEAN (14–30 ngày), Hàn, Nhật, nhiều nước châu Âu (45 ngày)… — danh sách thay đổi, kiểm tra trước khi đi.',
      en: '**E-visa** up to 90 days, single or multiple entry, via the official [evisa.gov.vn](https://evisa.gov.vn) (about USD 25 single). Visa-exempt: ASEAN (14–30 days), Korea, Japan, many European countries (45 days)… — check the current list.',
    },
    season: {
      vi: 'Ba miền khác nhau: Bắc đẹp tháng 10 – 4 (mùa đông lạnh), miền Trung đẹp tháng 2 – 8 (tháng 9 – 12 mưa bão), Nam đẹp tháng 12 – 4. Dịp Tết (thường cuối tháng 1 – tháng 2) nhiều nơi nghỉ, vé đắt.',
      en: 'Three climates: north best Oct – Apr (cold winters), centre Feb – Aug (storms Sep – Dec), south Dec – Apr. Around Tết (late Jan – Feb) many places close and transport is pricey.',
    },
    money: {
      vi: 'Đồng (VND). Khoảng 30–60 USD/ngày. Quét QR và thẻ phổ biến ở thành phố; quán vỉa hè và chợ dùng tiền mặt. Cẩn thận nhầm tờ 10.000 và 100.000.',
      en: 'Dong (VND). About USD 30–60 a day. QR and cards are common in cities; street food and markets are cash. Don’t mix up 10,000 and 100,000 notes.',
    },
    power: { vi: '220V, ổ A/C.', en: '220V, plugs A/C.' },
    places: {
      vi: 'Hà Nội (phố cổ, hồ Hoàn Kiếm), vịnh Hạ Long, Ninh Bình, Sa Pa – Hà Giang, Huế, Đà Nẵng – Hội An, Phú Quốc, TP.HCM và đồng bằng sông Cửu Long.',
      en: 'Hanoi (Old Quarter, Hoan Kiem Lake), Ha Long Bay, Ninh Binh, Sa Pa – Ha Giang, Hue, Da Nang – Hoi An, Phu Quoc, Ho Chi Minh City and the Mekong Delta.',
    },
    food: { vi: 'Phở, bún chả (Hà Nội), bún bò Huế, cao lầu và bánh mì (Hội An), cơm tấm (Sài Gòn), cà phê trứng, cà phê sữa đá.', en: 'Phở, bún chả (Hanoi), bún bò Huế, cao lầu and bánh mì (Hoi An), cơm tấm (Saigon), egg coffee, iced milk coffee.' },
    transport: {
      vi: 'Bay nội địa giữa Bắc – Trung – Nam (rẻ, nhiều chuyến). Tàu hỏa Thống Nhất đoạn Huế – Đà Nẵng qua đèo Hải Vân rất đẹp. Trong thành phố: Grab, Xanh SM (xe máy hoặc ô tô). Hà Nội và TP.HCM có tàu điện (metro) một số tuyến.',
      en: 'Domestic flights link north, centre and south cheaply. The Reunification train between Hue and Da Nang over the Hai Van Pass is scenic. In cities: Grab or Xanh SM (motorbike or car). Hanoi and HCMC have a few metro lines.',
    },
    phrases: { vi: 'Cho khách nước ngoài: *xin chào*, *cảm ơn*, *bao nhiêu?*, *không cay*, *ngon*.', en: 'Hello: *xin chào* · Thank you: *cảm ơn* · How much: *bao nhiêu?* · Not spicy: *không cay* · Delicious: *ngon*' },
    etiquette: {
      vi: 'Qua đường: đi đều, chậm, không chạy. Vào chùa và đền chính phủ ăn mặc kín đáo. Thương lượng giá ở chợ du lịch. Tip không bắt buộc nhưng được quý.',
      en: 'Crossing the street: walk slowly and steadily, don’t run. Dress modestly in temples and at government sites. Haggle at tourist markets. Tipping is optional but appreciated.',
    },
  },
];

export const GUIDE_BY_CC = Object.fromEntries(GUIDES.map((g) => [g.cc, g]));

/** Các mục sửa được trong Quản trị → Cẩm nang (ngoài các mục nội dung) */
export const GUIDE_META_FIELDS = [
  { key: 'visaTag', icon: '🏷️', vi: 'Nhãn visa', en: 'Visa tag' },
  { key: 'lead', icon: '✨', vi: 'Giới thiệu ngắn', en: 'Short intro' },
];
/** Áp phần đã sửa (guideOverrides/{cc}.fields) lên nội dung gốc */
export function applyGuideOverride(g, ov) {
  if (!g || !ov?.fields) return g;
  const out = { ...g };
  Object.entries(ov.fields).forEach(([k, v]) => {
    if (v && (v.vi || v.en)) out[k] = { ...(g[k] || {}), ...v };
  });
  return out;
}
