// Giữ trang luôn chạy bản mới nhất sau mỗi lần cập nhật web:
// - Phần nạp sau (như công cụ tạo PDF) có tên file đổi theo từng bản; trang mở từ bản cũ sẽ không tải được
//   → tự tải lại trang (đường dẫn #/... giữ nguyên chỗ đang xem).
// - Định kỳ kiểm tra có bản mới → hiện thanh nhắc "Tải lại".
import { translate as t } from '../i18n';

const KEY = 'travel-map-reloaded-at';
export function reloadOnce() {
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 30_000) return false; // tránh tải lại liên tục
  sessionStorage.setItem(KEY, String(Date.now()));
  location.reload();
  return true;
}

export const isStaleChunkError = (e) => /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i.test(String(e?.message || e));

const currentEntry = () => [...document.scripts].map((s) => s.src).find((s) => /\/assets\/index-[\w-]+\.js/.test(s))?.match(/index-[\w-]+\.js/)?.[0];

function showUpdateBar() {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.className = 'update-bar';
  bar.innerHTML = `<span>✨ ${t('update.available')}</span>`;
  const btn = document.createElement('button');
  btn.textContent = t('update.reload');
  btn.onclick = () => location.reload();
  bar.appendChild(btn);
  document.body.appendChild(bar);
}

async function checkForUpdate() {
  const mine = currentEntry();
  if (!mine) return; // chạy dev
  try {
    const html = await fetch(`${import.meta.env.BASE_URL}index.html?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.text());
    const latest = html.match(/index-[\w-]+\.js/)?.[0];
    if (latest && latest !== mine) showUpdateBar();
  } catch {
    /* mạng lỗi: thử lại sau */
  }
}

export function setupFreshness() {
  // Vite báo lỗi nạp phần tải sau → tải lại trang 1 lần
  window.addEventListener('vite:preloadError', (e) => {
    if (reloadOnce()) e.preventDefault();
  });
  setInterval(checkForUpdate, 5 * 60_000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkForUpdate());
}
