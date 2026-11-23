// Shared demo data for the UI tests. In demo mode the app reads all data from localStorage.
import { test as base, expect } from '@playwright/test';

const D = (s) => new Date(s).getTime();
// Tiny 1×1 image so tests never need the network
const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
export const me = { uid: 'demo-user', name: 'Lan', photo: '', email: 'lan@example.com' };
const pl = (id, name, city, country, lat, lng, emoji = '📍') => ({ id, name, city, country, lat, lng, emoji });
export const P = {
  merlion: pl('osm-sg1', 'Merlion Park', 'Singapore', 'SG', 1.2868, 103.8545, '🦁'),
  gbtb: pl('osm-sg3', 'Gardens by the Bay', 'Singapore', 'SG', 1.2816, 103.8636, '🌳'),
  chinatown: pl('osm-sg4', 'Chinatown', 'Singapore', 'SG', 1.2836, 103.8443, '🏮'),
  petronas: pl('osm-my1', 'Petronas Twin Towers', 'Kuala Lumpur', 'MY', 3.1579, 101.7116, '🏙️'),
  hoian: pl('osm-vn1', 'Hoi An Ancient Town', 'Hội An', 'VN', 15.8801, 108.338, '🏮'),
  kyoto: pl('osm-jp1', 'Fushimi Inari', 'Kyoto', 'JP', 34.9671, 135.7727, '⛩️'),
};
const members = { 'demo-user': { name: 'Lan', photo: '' }, 'demo-2': { name: 'Thư', photo: '' } };

export function demoData() {
  const places = {
    [P.merlion.id]: { ...P.merlion, status: 'visited', tripId: 't1', visitedAt: '2026-11-10', occasion: '', updatedAt: 3 },
    [P.chinatown.id]: { ...P.chinatown, status: 'visited', tripId: 't1', visitedAt: '2026-11-10', occasion: '', updatedAt: 2 },
    [P.hoian.id]: { ...P.hoian, status: 'visited', tripId: null, visitedAt: '2026-06-27', occasion: '🎂', updatedAt: 1 },
    [P.kyoto.id]: { ...P.kyoto, status: 'wishlist', tripId: null, visitedAt: null, occasion: '', updatedAt: 0 },
  };
  const mem = (id, p, caption, date, tripId, visibility = 'public') => ({ id, uid: me.uid, authorName: me.name, authorPhoto: '', place: p, caption, date, occasion: '', visibility, tripId, photos: [PX], createdAt: D(date) });
  const memories = [
    mem('m1', P.merlion, 'Đêm đầu tiên ở Singapore', '2026-11-10', 't1'),
    mem('m2', P.hoian, 'Đèn lồng phố Hội', '2026-06-27', null, 'private'),
  ];
  const trips = [
    { id: 't1', name: 'Singapore & Malaysia', emoji: '✈️', destinations: [{ cc: 'SG', city: 'Singapore' }, { cc: 'MY', city: 'Kuala Lumpur' }], kind: 'abroad', startDate: '2026-11-10', endDate: '2026-11-14', currency: 'VND', rates: { SGD: 19600, MYR: 5600 }, ownerId: 'demo-user', memberIds: ['demo-user', 'demo-2'], members, inviteCode: 'SGMY2026', createdAt: D('2026-10-01') },
    { id: 't3', name: 'Bali 2027', emoji: '🏝️', destinations: [{ cc: 'ID', city: 'Bali' }], kind: 'abroad', startDate: '2027-07-01', endDate: '2027-07-05', currency: 'VND', ownerId: 'demo-2', memberIds: ['demo-2'], members: { 'demo-2': members['demo-2'] }, inviteCode: 'BALI2027', createdAt: D('2026-11-16') },
    { id: 't2', name: 'Kyoto 2027', emoji: '⛩️', destinations: [{ cc: 'JP', city: 'Kyoto' }], kind: 'abroad', startDate: '2027-04-02', endDate: '2027-04-08', currency: 'VND', rates: { JPY: 170 }, ownerId: 'demo-2', memberIds: ['demo-user', 'demo-2'], members, inviteCode: 'KYOTO027', createdAt: D('2026-11-15') },
  ];
  const pi = (id, p, date, time, order, done) => ({ id, place: p, date, time, note: '', order, done, doneBy: done ? me.name : null, doneAt: done ? D(date) : null, addedBy: 'demo-user', addedByName: me.name, createdAt: D('2026-10-02') });
  const plan = { t1: [pi('p1', P.chinatown, '2026-11-10', '14:00', 1, true), pi('p2', P.merlion, '2026-11-10', '18:00', 2, true), pi('p3', P.gbtb, '2026-11-11', '20:00', 3, false), pi('p4', P.petronas, '2026-11-12', '17:30', 4, false)] };
  const stops = { t1: [{ id: 's1', place: P.merlion, kind: 'memory', memoryId: 'm1', photos: [PX], caption: 'Đêm đầu tiên ở Singapore', date: '2026-11-10', byUid: 'demo-user', byName: me.name, byPhoto: '', createdAt: D('2026-11-10') }, { id: 's2', place: P.chinatown, kind: 'place', photos: [], caption: '', date: '2026-11-10', byUid: 'demo-2', byName: 'Thư', byPhoto: '', createdAt: D('2026-11-10') + 1 }] };
  const c = (id, o) => ({ id, createdBy: 'demo-user', createdByName: me.name, createdAt: D('2026-11-01'), ...o });
  const costs = { t1: [
    c('c1', { type: 'estimate', title: 'Khách sạn', amount: 6000000, per: 'group' }),
    c('c2', { type: 'actual', title: 'Khách sạn 4 đêm', amount: 5800000, paidBy: 'demo-2', paidByName: 'Thư', splitAmong: [], date: '2026-11-10', estimateId: 'c1' }),
    c('c3', { type: 'actual', title: 'Hải sản', amount: 100, currency: 'SGD', paidBy: 'demo-user', paidByName: me.name, splitAmong: [], date: '2026-11-10' }),
  ] };
  const it = (id, text, scope, done) => ({ id, text, scope, done: !!done, doneBy: done ? me.name : null, doneMap: {} });
  const checklists = { t1: [{ id: 'k1', title: 'Trước khi đi', phase: 'before', scope: 'shared', ownerUid: null, createdBy: 'demo-user', createdByName: me.name, createdAt: D('2026-10-05'), items: [it('i1', 'Vé máy bay', 'shared', true), it('i2', 'Hộ chiếu', 'personal'), it('i3', 'eSIM', 'shared')] }] };
  return { user: me, places: { 'demo-user': places }, memories, trips, stops, plan, costs, checklists, profiles: {} };
}

export function adminData({ role = 'admin', flags = {}, consent = true, newUser = false, settings = {} } = {}) {
  return {
    users: { 'demo-user': { uid: 'demo-user', role, ...(consent ? { consentVersion: '2026-11-19' } : {}), ...(newUser ? { createdAt: Date.now() } : { tourSeenAt: 1, createdAt: D('2026-01-01') }), name: me.name }, 'demo-2': { uid: 'demo-2', name: 'Thư', role: 'user' } },
    settings: { ...settings, flags: Object.fromEntries(Object.entries(flags).map(([k, v]) => [k, { on: v }])) },
    overrides: {}, custom: [], reports: [],
    guideLinks: [{ id: 'l1', cc: 'SG', cat: 'transport', title: { vi: 'Sân bay Changi', en: 'Changi Airport' }, note: { vi: 'Nhà ga T4', en: 'Terminal 4' }, url: 'https://maps.app.goo.gl/changi', order: 1, createdAt: 1 }],
    gear: [
      { id: 'g1', icon: '🔌', name: { vi: 'Ổ chuyển đa năng', en: 'Universal travel adapter' }, desc: { vi: 'Ổ A/C/G/I', en: 'A/C/G/I sockets' }, tags: ['electronics'], trips: ['flight', 'city'], url: 'https://shopee.vn/adapter', image: '', price: '' },
      { id: 'g2', icon: '🩴', name: { vi: 'Dép đi biển', en: 'Beach sandals' }, desc: { vi: 'Nhẹ, nhanh khô', en: 'Light, quick-drying' }, tags: ['comfort'], trips: ['beach'], url: 'https://shopee.vn/sandals', image: '', price: '' },
    ],
  };
}

export function tipsData() {
  return {
    posts: [{ id: 'tp1', cc: 'SG', city: '', topic: 'transport', title: 'Đi MRT bằng thẻ Visa', body: 'Chạm thẻ Visa/Master ở cổng MRT, không cần mua vé.', uid: 'demo-2', authorName: 'Thư', authorPhoto: '', helpful: 2, wrong: 0, comments: 0, status: 'ok', createdAt: D('2026-11-01'), updatedAt: D('2026-11-01') }],
    votes: {}, comments: {},
  };
}

/** Fake Nominatim answer (place search) so tests stay offline */
export async function mockNominatim(page, hits) {
  await page.route(/nominatim\.openstreetmap\.org/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(hits) }));
}

export function socialData() {
  return {
    profiles: {
      'demo-user': { uid: 'demo-user', name: 'Lan', username: 'lan', createdAt: D('2026-01-01') },
      'demo-2': { uid: 'demo-2', name: 'Thư', username: 'thu', bio: 'Thích đi phượt', createdAt: D('2026-01-01') },
    },
    usernames: { lan: 'demo-user', thu: 'demo-2' },
    feeds: {}, follows: [], likes: {}, notes: [], annRead: [],
  };
}

/**
 * Open the app with demo data. opts: { signedIn, role, flags, lang, tour, data, consent }
 * Data is seeded only on the first load of each test, so changes made during a test survive reloads.
 */
export async function openApp(page, path = '#/', opts = {}) {
  const { signedIn = true, role = 'admin', flags = {}, lang = 'vi', tour = false, data, consent = true, newUser = false, settings = {} } = opts;
  const demo = data || demoData();
  if (!signedIn) demo.user = null;
  await page.addInitScript(
    ([demo, admin, lang, tour, social, tips]) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      sessionStorage.setItem('e2e-seeded', '1');
      localStorage.clear();
      localStorage.setItem('travel-map-lang', lang);
      if (!tour) localStorage.setItem('travel-map-tour-v1', '1');
      localStorage.setItem('travel-map-demo-v1', JSON.stringify(demo));
      localStorage.setItem('travel-map-admin-demo-v1', JSON.stringify(admin));
      localStorage.setItem('travel-map-social-demo-v1', JSON.stringify(social));
      localStorage.setItem('travel-map-tips-demo-v1', JSON.stringify(tips));
    },
    [demo, adminData({ role, flags, consent, newUser, settings }), lang, tour, socialData(), tipsData()],
  );
  // Always accept browser confirm/alert boxes
  page.on('dialog', (d) => d.accept().catch(() => {}));
  // Block every external request (map tiles, Wikidata, fonts…) so tests are offline and stable
  await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await page.goto(path);
  await page.locator('#root > *').first().waitFor();
  return page;
}

export const test = base;
export { expect };

/** Click an admin module in the left menu (the menu may be taller than the window) */
export async function adminTab(page, name) {
  await page.locator('.admin__tabs button', { hasText: name }).first().evaluate((b) => b.click());
}
