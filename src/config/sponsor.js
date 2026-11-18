/**
 * Thông tin nhận ủng hộ qua VietQR (miễn phí, quét bằng mọi app ngân hàng / ví hỗ trợ VietQR).
 * bankId: mã ngân hàng theo VietQR, ví dụ 'vcb' (Vietcombank), 'tcb' (Techcombank), 'mb' (MB Bank),
 *         'acb', 'vpb' (VPBank), 'tpb' (TPBank), 'bidv', 'icb' (VietinBank)… — xem https://api.vietqr.io/v2/banks
 * Để trống accountNo thì mục Ủng hộ hiện thông báo "đang chuẩn bị".
 */
export const SPONSOR = {
  bankId: '',
  bankName: '',
  accountNo: '',
  accountName: '',
  amounts: [5000, 10000, 20000, 50000],
  defaultAmount: 5000,
  note: 'Ung ho Travel Map',
};

export const sponsorReady = () => !!(SPONSOR.bankId && SPONSOR.accountNo);

export function vietQrUrl(amount, note) {
  const p = new URLSearchParams({ amount: String(amount || ''), addInfo: note || SPONSOR.note, accountName: SPONSOR.accountName });
  return `https://img.vietqr.io/image/${encodeURIComponent(SPONSOR.bankId)}-${encodeURIComponent(SPONSOR.accountNo)}-compact2.png?${p}`;
}
