// Ước lượng tốc độ mạng của người dùng để chọn chất lượng ảnh phù hợp:
//   'low'    → chỉ ảnh thu nhỏ (mạng 2G, bật Tiết kiệm dữ liệu, hoặc đo được rất chậm)
//   'medium' → ảnh vừa (~1000px) — mạng 3G / chậm
//   'high'   → ảnh gốc (~1600px) — Wi-Fi / 4G
// Kết hợp thông tin trình duyệt (navigator.connection, nếu có) với tốc độ đo thật khi tải ảnh.

const KEY = 'travel-map-net';
let measured = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null'); // { kbps }
  } catch {
    return null;
  }
})();

/** Ghi lại 1 lần tải: bytes và thời gian (ms) → cập nhật tốc độ trung bình (kbps) */
export function recordDownload(bytes, ms) {
  if (!bytes || !ms || ms < 30) return;
  const kbps = (bytes * 8) / ms; // kilobit / giây
  measured = { kbps: measured ? measured.kbps * 0.6 + kbps * 0.4 : kbps };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(measured));
  } catch {
    /* bỏ qua */
  }
}

/** Người dùng chọn chất lượng ảnh trong cài đặt: 'auto' | 'low' | 'medium' | 'high' */
export const getQualityPref = () => {
  try {
    return localStorage.getItem('travel-map-img-quality') || 'auto';
  } catch {
    return 'auto';
  }
};
export const setQualityPref = (v) => {
  try {
    localStorage.setItem('travel-map-img-quality', v);
  } catch {
    /* bỏ qua */
  }
};

export function getNetQuality() {
  const pref = getQualityPref();
  if (pref !== 'auto') return pref;
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c?.saveData) return 'low';
  const et = c?.effectiveType;
  if (et === 'slow-2g' || et === '2g') return 'low';
  if (measured) {
    if (measured.kbps < 400) return 'low';
    if (measured.kbps < 2500) return 'medium';
    return 'high';
  }
  if (et === '3g') return 'medium';
  if (typeof c?.downlink === 'number' && c.downlink < 1.5) return 'medium';
  return 'high';
}

/** Độ rộng ảnh phù hợp cho ảnh từ Wikipedia / Wikimedia */
export const placeImageWidth = () => ({ low: 320, medium: 480, high: 800 })[getNetQuality()];

/** Đổi kích thước ảnh Wikipedia / Wikimedia theo tốc độ mạng (…/640px-x.jpg, ?width=640) */
export function sizedWikiImage(url) {
  if (!url) return url;
  const w = placeImageWidth();
  if (/upload\.wikimedia\.org\/.+\/\d+px-/.test(url)) return url.replace(/\/(\d+)px-/, `/${w}px-`);
  if (/[?&]width=\d+/.test(url)) return url.replace(/([?&]width=)\d+/, `$1${w}`);
  return url;
}
