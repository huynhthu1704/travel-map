/* Bee There service worker — lưu sẵn tài nguyên để mở lại gần như tức thì.
 * - Mã & ảnh của web (/assets/… có mã băm trong tên file): lấy từ bộ nhớ trước (không đổi theo phiên bản).
 * - Font Google, ô bản đồ, dữ liệu bản đồ nền: dùng bản đã lưu ngay, cập nhật ngầm.
 * - Trang index.html: luôn lấy bản mới từ mạng, mất mạng thì dùng bản đã lưu.
 * Không đụng tới Firebase / Firestore (đã có bộ nhớ đệm riêng). */
const VERSION = 'v1';
const ASSETS = `tm-assets-${VERSION}`;
const RUNTIME = `tm-runtime-${VERSION}`;
const PAGES = `tm-pages-${VERSION}`;
const RUNTIME_MAX = 600;
let puts = 0;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keep = [ASSETS, RUNTIME, PAGES];
      for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

const cacheable = (res) => res && res.ok && res.type !== 'opaque';

async function cacheFirst(req) {
  const c = await caches.open(ASSETS);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (cacheable(res)) c.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, event) {
  const c = await caches.open(RUNTIME);
  const hit = await c.match(req);
  const update = fetch(req)
    .then((res) => {
      if (cacheable(res)) {
        c.put(req, res.clone());
        if (++puts % 25 === 0) trim(RUNTIME, RUNTIME_MAX);
      }
      return res;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(update);
    return hit;
  }
  return update;
}

async function networkFirst(req) {
  const c = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (cacheable(res)) c.put(req, res.clone());
    return res;
  } catch {
    return (await c.match(req)) || (await c.match('./')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/assets/') || url.pathname.includes('/fonts/')) return event.respondWith(cacheFirst(req));
    if (req.mode === 'navigate') return event.respondWith(networkFirst(req));
    return; // index.html?t=… (kiểm tra bản mới), favicon… → mạng như bình thường
  }
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|tiles\.openfreemap\.org|tile\.openstreetmap\.org)$/.test(url.hostname)) {
    return event.respondWith(staleWhileRevalidate(req, event));
  }
});
