// Tiền tệ theo quốc gia + tỉ giá thị trường (open.er-api.com, miễn phí, không cần key).
// Tỉ giá lưu dạng: rates[CODE] = số tiền tệ gốc (base, VD VND) cho 1 đơn vị CODE.

export const COUNTRY_CURRENCY = {
  VN: 'VND', US: 'USD', GB: 'GBP', JP: 'JPY', KR: 'KRW', CN: 'CNY', TW: 'TWD', HK: 'HKD', MO: 'MOP', SG: 'SGD', MY: 'MYR',
  TH: 'THB', ID: 'IDR', PH: 'PHP', KH: 'KHR', LA: 'LAK', MM: 'MMK', IN: 'INR', NP: 'NPR', LK: 'LKR', MV: 'MVR', BD: 'BDT',
  AU: 'AUD', NZ: 'NZD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', PE: 'PEN', CO: 'COP',
  CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', IS: 'ISK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', TR: 'TRY', RU: 'RUB', UA: 'UAH',
  AE: 'AED', SA: 'SAR', QA: 'QAR', IL: 'ILS', JO: 'JOD', EG: 'EGP', MA: 'MAD', ZA: 'ZAR', KE: 'KES', TZ: 'TZS',
  MN: 'MNT', KZ: 'KZT', UZ: 'UZS', PK: 'PKR', BT: 'BTN',
  // Khu vực đồng Euro
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
  LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR', MC: 'EUR', VA: 'EUR',
};
export const currencyOfCountry = (cc) => COUNTRY_CURRENCY[cc] || null;

let cache = null; // { t, rates (theo USD) }
/** Tỉ giá thị trường: { CODE: số base cho 1 CODE } */
export async function fetchMarketRates(base, codes) {
  if (!cache || Date.now() - cache.t > 6 * 3600e3) {
    const r = await fetch('https://open.er-api.com/v6/latest/USD').then((x) => x.json());
    if (r.result !== 'success') throw new Error('rates');
    cache = { t: Date.now(), rates: r.rates, updated: r.time_last_update_utc };
  }
  const usd = cache.rates;
  const out = {};
  for (const c of codes) if (usd[c] && usd[base]) out[c] = usd[base] / usd[c];
  return out;
}
