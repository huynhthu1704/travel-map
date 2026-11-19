/**
 * Câu nói hữu ích — chữ bản địa để trình duyệt đọc to (Web Speech API).
 * lang: mã giọng đọc; say: { [phiên âm in nghiêng trong cẩm nang, viết thường]: chữ bản địa }
 */
export const GUIDE_PHRASES = {
  TH: {
    lang: 'th-TH',
    say: {
      'sa-wat-dee kha/khrap': 'สวัสดีค่ะ',
      'sawasdee kha/khrap': 'สวัสดีค่ะ',
      'khop khun kha/khrap': 'ขอบคุณค่ะ',
      'tao rai?': 'เท่าไร',
      'mai phet': 'ไม่เผ็ด',
    },
  },
  JP: {
    lang: 'ja-JP',
    say: {
      konnichiwa: 'こんにちは',
      'arigatou gozaimasu': 'ありがとうございます',
      sumimasen: 'すみません',
      'kore wa ikura desu ka?': 'これはいくらですか',
    },
  },
  KR: {
    lang: 'ko-KR',
    say: {
      annyeonghaseyo: '안녕하세요',
      kamsahamnida: '감사합니다',
      'eolmayeyo?': '얼마예요?',
      'igeo juseyo': '이거 주세요',
    },
  },
  SG: {
    lang: 'en-SG',
    say: { 'da bao': 'da bao', kopi: 'kopi', 'kopi-o': 'kopi O', teh: 'teh' },
  },
  MY: {
    lang: 'ms-MY',
    say: { 'selamat pagi': 'selamat pagi', hai: 'hai', 'terima kasih': 'terima kasih', 'berapa?': 'berapa?', 'tak pedas': 'tak pedas' },
  },
  ID: {
    lang: 'id-ID',
    say: { 'terima kasih': 'terima kasih', 'berapa?': 'berapa?', 'tidak, terima kasih': 'tidak, terima kasih', enak: 'enak' },
  },
  CN: {
    lang: 'zh-CN',
    say: { 'nǐ hǎo': '你好', xièxie: '谢谢', 'duōshǎo qián?': '多少钱？', 'bù yào là': '不要辣' },
  },
  TW: {
    lang: 'zh-TW',
    say: { 'nǐ hǎo': '你好', xièxie: '謝謝', 'duōshǎo qián?': '多少錢？', 'bàn táng / shǎo bīng': '半糖，少冰' },
  },
  PH: {
    lang: 'fil-PH',
    say: { 'salamat (po)': 'salamat po', 'magkano?': 'magkano?', 'magandang umaga': 'magandang umaga', po: 'po' },
  },
  KH: {
    lang: 'km-KH',
    say: { suosdey: 'សួស្តី', 'aw kun': 'អរគុណ', 'tóch món?': 'ប៉ុន្មាន?' },
  },
  LA: {
    lang: 'lo-LA',
    say: { sabaidee: 'ສະບາຍດີ', 'khop jai': 'ຂອບໃຈ', 'tao dai?': 'ເທົ່າໃດ?', 'bo phet': 'ບໍ່ເຜັດ' },
  },
  VN: {
    lang: 'vi-VN',
    say: { 'xin chào': 'xin chào', 'cảm ơn': 'cảm ơn', 'bao nhiêu?': 'bao nhiêu?', 'không cay': 'không cay', ngon: 'ngon' },
  },
};
