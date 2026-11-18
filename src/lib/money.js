// Tiền tệ, định dạng số tiền và tính chia tiền sau chuyến đi.
import { getLocale } from './lang';

export const CURRENCIES = ['VND', 'USD', 'EUR', 'GBP', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'KHR', 'LAK', 'JPY', 'KRW', 'CNY', 'TWD', 'HKD', 'AUD', 'NZD', 'CAD', 'CHF', 'INR', 'AED'];
const NO_DECIMALS = new Set(['VND', 'JPY', 'KRW', 'TWD', 'IDR', 'KHR', 'LAK', 'CLP', 'HUF', 'ISK', 'UZS', 'MNT']);
export const decimalsOf = (cur) => (NO_DECIMALS.has(cur) ? 0 : 2);
export const roundMoney = (n, cur) => {
  const f = 10 ** decimalsOf(cur);
  return Math.round((Number(n) || 0) * f) / f;
};

export function fmtMoney(n, cur = 'VND') {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: cur, maximumFractionDigits: decimalsOf(cur), minimumFractionDigits: 0 }).format(v);
  } catch {
    return `${v.toLocaleString(getLocale())} ${cur}`;
  }
}

/** Số dạng 1.500.000 hoặc 12,50 → number (null nếu trống / sai) */
export function parseMoney(s, cur = 'VND') {
  if (s == null) return null;
  let t = String(s).trim().replace(/\s/g, '');
  if (!t) return null;
  if (decimalsOf(cur) === 0) t = t.replace(/[.,]/g, '');
  else {
    // dấu cuối cùng (. hoặc ,) là phần thập phân nếu sau nó có 1–2 chữ số
    const m = t.match(/^(.*)[.,](\d{1,2})$/);
    t = m ? `${m[1].replace(/[.,]/g, '')}.${m[2]}` : t.replace(/[.,]/g, '');
  }
  const n = Number(t.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Hiển thị trong ô nhập: 1500000 → "1.500.000" (vi) */
export const inputMoney = (n, cur) => (n == null || n === '' ? '' : Number(n).toLocaleString(getLocale(), { maximumFractionDigits: decimalsOf(cur) }));

/**
 * Quy đổi về tiền tệ tính cuối cùng (base) theo tỉ giá của chuyến: rates[CODE] = số base / 1 CODE.
 * Thiếu tỉ giá → null (để báo người dùng nhập).
 */
export const makeToBase = (base, rates = {}) => (amount, cur) => {
  const a = Number(amount) || 0;
  if (!cur || cur === base) return a;
  const r = Number(rates[cur]);
  return r > 0 ? a * r : null;
};

/** Chi phí dự kiến cho mỗi người: theo nhóm thì chia đều cho số thành viên */
export const perPersonOf = (c, members, conv = (a) => a) => {
  const a = conv(Number(c.amount) || 0, c.currency) ?? 0;
  return c.per === 'person' ? a : a / Math.max(members, 1);
};
export const groupTotalOf = (c, members, conv = (a) => a) => {
  const a = conv(Number(c.amount) || 0, c.currency) ?? 0;
  return c.per === 'person' ? a * Math.max(members, 1) : a;
};

/**
 * Tính số dư mỗi người từ chi phí thực tế + các lần đã trả lại nhau.
 * actual: { amount, paidBy, splitAmong[] } — chia đều cho những người trong splitAmong (mặc định cả nhóm)
 * payment: { amount, paidBy (người trả), payTo (người nhận) }
 * Trả về { balances: {uid: {paid, share, net}}, transfers: [{from, to, amount}] }
 *   net > 0: được nhận lại; net < 0: cần trả thêm
 */
export function settle(costs, memberIds, cur, conv = (a) => a) {
  const b = Object.fromEntries(memberIds.map((id) => [id, { paid: 0, share: 0, net: 0 }]));
  const ensure = (id) => (b[id] ||= { paid: 0, share: 0, net: 0 });
  for (const c of costs) {
    const amt = conv(Number(c.amount) || 0, c.currency) ?? 0;
    if (!amt || !c.paidBy) continue;
    if (c.type === 'payment') {
      if (!c.payTo) continue;
      ensure(c.paidBy).net += amt;
      ensure(c.payTo).net -= amt;
      continue;
    }
    if (c.type !== 'actual') continue;
    const among = (c.splitAmong?.length ? c.splitAmong : memberIds).filter(Boolean);
    ensure(c.paidBy).paid += amt;
    const each = amt / among.length;
    among.forEach((id) => (ensure(id).share += each));
  }
  Object.values(b).forEach((x) => (x.net += x.paid - x.share));
  // Gợi ý chuyển tiền ít lần nhất: người nợ nhiều nhất trả người được nhận nhiều nhất
  const eps = decimalsOf(cur) ? 0.005 : 0.5;
  const debt = Object.entries(b).filter(([, x]) => x.net < -eps).map(([id, x]) => ({ id, v: -x.net })).sort((a, c) => c.v - a.v);
  const cred = Object.entries(b).filter(([, x]) => x.net > eps).map(([id, x]) => ({ id, v: x.net })).sort((a, c) => c.v - a.v);
  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debt.length && j < cred.length) {
    const v = Math.min(debt[i].v, cred[j].v);
    if (v > eps) transfers.push({ from: debt[i].id, to: cred[j].id, amount: roundMoney(v, cur) });
    debt[i].v -= v;
    cred[j].v -= v;
    if (debt[i].v <= eps) i++;
    if (cred[j].v <= eps) j++;
  }
  return { balances: b, transfers };
}
