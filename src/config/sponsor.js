/**
 * Ủng hộ người làm Travel Map qua mã VietQR (quét bằng mọi app ngân hàng / ví hỗ trợ VietQR).
 * qrImage: ảnh mã QR trong thư mục public/. Không ghi số tiền cố định — người ủng hộ tự chọn.
 */
export const SPONSOR = {
  qrImage: 'sponsor-qr.jpg',
  bankName: 'Ngân hàng Shinhan Việt Nam',
  accountNo: '700038684370',
  accountNoDisplay: '700-038-684370',
  accountName: 'HUYNH THI NGOC THU',
  note: 'Ung ho Travel Map',
};

export const sponsorReady = () => !!(SPONSOR.qrImage && SPONSOR.accountNo);
