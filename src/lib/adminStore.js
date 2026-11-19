/**
 * Dữ liệu quản trị: hồ sơ & phân quyền người dùng, cài đặt trang, chỉnh sửa / thêm địa điểm nổi tiếng,
 * báo cáo nội dung và kiểm duyệt. Firebase khi có cấu hình, ngược lại lưu localStorage (chế độ demo).
 *
 *  users/{uid}            { uid,name,email,googlePhoto,photo?,displayName?,role:'user'|'editor'|'admin',banned,createdAt,lastLoginAt,
 *                           stats:{visited,wishlist,countries[],memories,publicMemories,photos,trips,tripsOwned,firstCheckinAt,lastActionAt,updatedAt} }
 *  settings/site          { announcement:{active,vi,en,tone}, homeCountry, features:{explore,trips,wikidata} }
 *  placeOverrides/{id}    { hidden, image, nameVi, nameEn, descVi, descEn, updatedAt, updatedBy }
 *  customPlaces/{id}      { name,city,country,lat,lng,emoji,desc,image,i18n:{en:{name,city,desc}},createdAt }
 *  reports/{id}           { memoryId, memoryOwner, snapshot:{place,caption,photo,authorName}, reason, byUid, byName, status, createdAt }
 */
import {
  collection, collectionGroup, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, where, getDocs, writeBatch, limit,
  getCountFromServer, orderBy,
} from 'firebase/firestore';
import { firebaseEnabled, db } from './firebase';

/** Quản trị viên gốc (luôn có quyền admin, kể cả khi chưa có hồ sơ) — khớp với firestore.rules.
 *  Dùng mã người dùng (uid) thay vì email để email chủ trang không nằm trong mã nguồn công khai. */
export const SUPER_ADMIN_UIDS = (import.meta.env.VITE_SUPER_ADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean);
export const isSuperUid = (uid) => !!uid && SUPER_ADMIN_UIDS.includes(uid);

/** Che bớt email: huynh…04@gmail.com → hu•••04@gmail.com */
export function maskEmail(email = '') {
  const [name, domain] = String(email).split('@');
  if (!domain) return email ? '•••' : '';
  const keep = name.length <= 4 ? 1 : 2;
  return `${name.slice(0, keep)}•••${name.length > 6 ? name.slice(-2) : ''}@${domain}`;
}
export const ROLES = ['user', 'editor', 'admin'];

export const DEFAULT_SETTINGS = {
  announcement: { active: false, vi: '', en: '', tone: 'info' },
  homeCountry: 'VN',
  features: { explore: true, trips: true, wikidata: true },
  // Sắp xếp bài kinh nghiệm: xen kẽ bài hữu ích / bài mới, ngưỡng "thông tin sai lệch", bài cũ
  community: { helpfulSlots: 2, newSlots: 1, newDays: 30, flagMin: 3, flagPct: 40, staleMonths: 12 },
};

const now = () => Date.now();
const mergeSettings = (s = {}) => ({
  ...DEFAULT_SETTINGS,
  ...s,
  announcement: { ...DEFAULT_SETTINGS.announcement, ...(s.announcement || {}) },
  features: { ...DEFAULT_SETTINGS.features, ...(s.features || {}) },
  community: { ...DEFAULT_SETTINGS.community, ...(s.community || {}) },
  flags: s.flags || {},
  // Thông báo đầu trang có lịch: [{ id, vi, en, tone, startAt, endAt, createdAt }]
  announcements: Array.isArray(s.announcements) ? s.announcements : [],
  // Quảng cáo: chế độ hiển thị + các vị trí đang tắt (trước đây lưu ở features.ads)
  ads: { mode: s.ads?.mode || s.features?.ads || 'staff', off: s.ads?.off || [] },
  rolePerms: s.rolePerms || {},
  roleDefs: Array.isArray(s.roleDefs) ? s.roleDefs : [],
});

/* ------------------------------ Nhật ký quản trị ------------------------------
 * adminLogs/{id} { at, by, byName, action, target, detail } — chỉ thêm, không sửa / xoá được (luật Firestore).
 * Mọi thao tác quản trị đi qua adminApi đều tự ghi nhật ký. */
let actor = null;
export const setAdminActor = (u) => (actor = u ? { uid: u.uid, name: u.name || '' } : null);
const LOGGED = {
  saveSettings: 'settings.save', saveRoles: 'roles.save', saveOverride: 'place.edit', clearOverride: 'place.reset', saveCustomPlace: 'place.add', deleteCustomPlace: 'place.delete',
  updateReport: 'report.update', deleteReport: 'report.delete', updateUser: 'user.update', hideMemory: 'memory.hide', unhideMemory: 'memory.unhide',
  deleteMemoryAdmin: 'memory.delete', deleteTrip: 'trip.delete',
};
const short = (v) => {
  if (v == null) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 300 ? `${s.slice(0, 297)}…` : s;
};
function describe(name, args) {
  const [a, b, c] = args;
  switch (name) {
    case 'saveSettings': return { target: 'site', detail: short(Object.keys(a || {}).join(', ')) };
    case 'saveRoles': return { target: 'roles', detail: short(a) };
    case 'saveOverride': return { target: a, detail: short(b) };
    case 'saveCustomPlace': return { target: a?.id || a?.name || '', detail: short(a?.name) };
    case 'updateReport': return { target: a, detail: short({ status: b?.status, action: b?.action }) };
    case 'updateUser': return { target: a, detail: short(b) };
    case 'hideMemory': return { target: a, detail: short(c) };
    case 'deleteMemoryAdmin': return { target: a?.id, detail: short(a?.place?.name) };
    default: return { target: typeof a === 'string' ? a : a?.id || '', detail: '' };
  }
}
function withLog(api) {
  const out = { ...api };
  Object.entries(LOGGED).forEach(([name, action]) => {
    const f = api[name];
    if (typeof f !== 'function') return;
    out[name] = async (...args) => {
      const r = await f.apply(api, args);
      api.writeLog?.(action, describe(name, args)).catch(() => {});
      return r;
    };
  });
  /** Ghi nhật ký cho thao tác không đi qua adminApi (gửi thông báo, góp ý, xem email…) */
  out.log = (action, target = '', detail = '') => api.writeLog?.(action, { target, detail: short(detail) }).catch(() => {});
  return out;
}

/* ------------------------------ Firebase ------------------------------ */
const fb = {
  writeLog: (action, { target = '', detail = '' } = {}) =>
    actor ? addDoc(collection(db, 'adminLogs'), { at: now(), by: actor.uid, byName: actor.name, action, target: String(target || '').slice(0, 200), detail }) : Promise.resolve(),
  watchLogs: (cb) =>
    onSnapshot(query(collection(db, 'adminLogs'), orderBy('at', 'desc'), limit(300)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([])),
  async upsertProfile(user) {
    const r = doc(db, 'users', user.uid);
    const snap = await getDoc(r);
    // Ảnh Google lưu ở googlePhoto; trường photo dành cho ảnh đại diện người dùng tự chọn
    if (!snap.exists()) {
      await setDoc(r, { uid: user.uid, name: user.name || '', email: user.email || '', googlePhoto: user.photo || '', role: 'user', banned: false, createdAt: now(), lastLoginAt: now() });
    } else {
      const d = snap.data();
      await updateDoc(r, { uid: user.uid, name: user.name || '', email: user.email || '', googlePhoto: user.photo || '', lastLoginAt: now(), ...(d.createdAt ? {} : { createdAt: now() }) });
    }
  },
  /** Thống kê hoạt động của chính người dùng (tính ở máy họ) → dùng cho trang Thống kê của quản trị viên */
  saveStats: (uid, stats) => updateDoc(doc(db, 'users', uid), { stats: { ...stats, updatedAt: now() } }),
  /** Đếm nhanh trên máy chủ (không tải dữ liệu) */
  async counts() {
    const c = async (q) => {
      try {
        return (await getCountFromServer(q)).data().count;
      } catch {
        return null;
      }
    };
    const [publicMemories, trips, planItems, costItems, checklists, openReports] = await Promise.all([
      c(query(collection(db, 'memories'), where('visibility', '==', 'public'))),
      c(collection(db, 'trips')),
      c(collectionGroup(db, 'plan')),
      c(collectionGroup(db, 'costs')),
      c(collectionGroup(db, 'checklists')),
      c(query(collection(db, 'reports'), where('status', '==', 'open'))),
    ]);
    return { publicMemories, trips, planItems, costItems, checklists, openReports };
  },
  watchProfile: (uid, cb) => onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null)),
  setConsent: (uid, version) => updateDoc(doc(db, 'users', uid), { consentVersion: version, consentAt: now() }),
  watchSettings: (cb) => onSnapshot(doc(db, 'settings', 'site'), (s) => cb(mergeSettings(s.exists() ? s.data() : {})), () => cb(mergeSettings())),
  saveSettings: (s) => setDoc(doc(db, 'settings', 'site'), s, { merge: true }),
  // Ghi đè toàn bộ vai trò & quyền (để vai trò đã xoá không còn sót lại)
  saveRoles: (rolePerms, roleDefs) =>
    updateDoc(doc(db, 'settings', 'site'), { rolePerms, roleDefs }).catch(() => setDoc(doc(db, 'settings', 'site'), { rolePerms, roleDefs }, { merge: true })),
  watchOverrides: (cb) =>
    onSnapshot(collection(db, 'placeOverrides'), (s) => cb(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))), () => cb({})),
  saveOverride: (id, patch, by) => setDoc(doc(db, 'placeOverrides', id), { ...patch, updatedAt: now(), updatedBy: by || '' }, { merge: true }),
  clearOverride: (id) => deleteDoc(doc(db, 'placeOverrides', id)),
  watchCustomPlaces: (cb) => onSnapshot(collection(db, 'customPlaces'), (s) => cb(s.docs.map((d) => ({ ...d.data(), id: d.id }))), () => cb([])),
  async saveCustomPlace(p) {
    const id = p.id || `cp-${Math.random().toString(36).slice(2, 10)}`;
    await setDoc(doc(db, 'customPlaces', id), { ...p, id, famous: true, custom: false, updatedAt: now(), createdAt: p.createdAt || now() });
    return id;
  },
  deleteCustomPlace: (id) => deleteDoc(doc(db, 'customPlaces', id)),
  reportMemory: (user, m, reason, note = '') =>
    addDoc(collection(db, 'reports'), {
      memoryId: m.id, memoryOwner: m.uid, reason, note: (note || '').slice(0, 500), byUid: user.uid, byName: user.name, status: 'open', createdAt: now(),
      snapshot: { place: m.place || null, caption: m.caption || '', photo: m.photos?.[0] || '', authorName: m.authorName || '', authorPhoto: m.authorPhoto || '', date: m.date || '', occasion: m.occasion || '', photoCount: Math.max(m.photoCount || 0, m.photos?.length || 0), createdAt: typeof m.createdAt === 'number' ? m.createdAt : m.createdAt?.toMillis?.() || 0 },
    }),
  watchReports: (cb) => onSnapshot(collection(db, 'reports'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)), () => cb([])),
  updateReport: (id, patch) => updateDoc(doc(db, 'reports', id), patch),
  deleteReport: (id) => deleteDoc(doc(db, 'reports', id)),
  // uid lấy theo id của document (hồ sơ cũ chỉ có displayName / photo, chưa có uid)
  watchUsers: (cb) =>
    onSnapshot(collection(db, 'users'), (s) => cb(s.docs.map((d) => ({ ...d.data(), uid: d.id })).sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0))), () => cb([])),
  updateUser: (uid, patch) => updateDoc(doc(db, 'users', uid), patch),
  /** Kỉ niệm công khai + kỉ niệm đã bị ẩn (kiểm duyệt) — quản trị viên không xem được kỉ niệm riêng tư */
  watchModerationMemories(cb) {
    let pub = [];
    let mod = [];
    const emit = () => cb([...pub, ...mod.filter((m) => !pub.some((x) => x.id === m.id))].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    const u1 = onSnapshot(query(collection(db, 'memories'), where('visibility', '==', 'public'), limit(500)), (s) => {
      pub = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    });
    const u2 = onSnapshot(query(collection(db, 'memories'), where('moderated', '==', true), limit(500)), (s) => {
      mod = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    }, () => {});
    return () => {
      u1();
      u2();
    };
  },
  /** Ẩn: chuyển về riêng tư và gắn cờ kiểm duyệt; Hiện lại: công khai như cũ */
  async hideMemory(id, by, note = '', owner = null, placeName = '') {
    await updateDoc(doc(db, 'memories', id), { visibility: 'private', moderated: true, moderatedBy: by, moderatedAt: now(), moderationNote: note });
    // Báo cho chủ check-in biết bài đã bị ẩn và vì sao
    if (owner) await addDoc(collection(db, 'notifications'), { to: owner, type: 'hidden', from: by, memoryId: id, title: placeName || '', body: note || '', read: false, createdAt: now() });
  },
  unhideMemory: (id) => updateDoc(doc(db, 'memories', id), { visibility: 'public', moderated: false, moderationNote: '' }),
  async deleteMemoryAdmin(m) {
    const [full, mid, thumbs] = await Promise.all(['full', 'mid', 'thumbs'].map((tier) => getDocs(collection(db, 'memories', m.id, tier))));
    const b = writeBatch(db);
    [...full.docs, ...mid.docs, ...thumbs.docs].forEach((d) => b.delete(d.ref));
    b.delete(doc(db, 'memories', m.id));
    await b.commit();
  },
  watchAllTrips: (cb) => onSnapshot(collection(db, 'trips'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))), () => cb([])),
  deleteTrip: (id) => deleteDoc(doc(db, 'trips', id)),
};

/* ------------------------------ Demo (localStorage) ------------------------------ */
const KEY = 'travel-map-admin-demo-v1';
let st = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
})() || { users: {}, settings: mergeSettings(), overrides: {}, custom: [], reports: [] };
const subs = new Set();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
};
const on = (fn) => {
  fn();
  subs.add(fn);
  return () => subs.delete(fn);
};

const local = {
  async upsertProfile(user) {
    const prev = st.users[user.uid];
    // Ở chế độ demo, người dùng demo là admin để thử trang quản trị
    st.users[user.uid] = { role: 'admin', banned: false, createdAt: now(), ...prev, uid: user.uid, name: user.name, email: user.email, googlePhoto: user.photo || '', lastLoginAt: now() };
    if (!Object.values(st.users).some((u) => u.uid !== user.uid)) {
      st.users['demo-2'] = { uid: 'demo-2', name: 'Linh (demo)', email: 'linh@example.com', role: 'user', banned: false, createdAt: now() - 864e5 * 3, lastLoginAt: now() - 864e5 };
      st.users['demo-3'] = { uid: 'demo-3', name: 'Minh (demo)', email: 'minh@example.com', role: 'editor', banned: false, createdAt: now() - 864e5 * 9, lastLoginAt: now() - 864e5 * 2 };
    }
    persist();
  },
  // Demo: hồ sơ (tên / ảnh tự đặt) nằm ở lớp dữ liệu chính, quyền nằm ở đây → gộp lại
  async setConsent(uid, version) {
    if (st.users[uid]) st.users[uid] = { ...st.users[uid], consentVersion: version, consentAt: now() };
    persist();
  },
  watchProfile(uid, cb) {
    let main = null;
    let unsubMain = () => {};
    const emit = () => cb(st.users[uid] || main ? { ...(st.users[uid] || {}), ...(main || {}) } : null);
    import('./store').then(({ api }) => (unsubMain = api.watchProfile(uid, (p) => ((main = p), emit()))));
    const off = on(emit);
    return () => {
      off();
      unsubMain();
    };
  },
  async saveStats(uid, stats) {
    st.users[uid] = { ...(st.users[uid] || {}), stats: { ...stats, updatedAt: now() } };
    persist();
  },
  async counts() {
    const { api } = await import('./store');
    const trips = await new Promise((r) => {
      const u = api.watchTrips('demo-user', (l) => (r(l), setTimeout(() => u && u(), 0)));
    });
    return { publicMemories: null, trips: trips.length, planItems: null, costItems: null, checklists: null, openReports: st.reports.filter((x) => x.status === 'open').length };
  },
  watchSettings: (cb) => on(() => cb(mergeSettings(st.settings))),
  async saveSettings(s) {
    st.settings = mergeSettings({ ...st.settings, ...s, announcement: { ...st.settings.announcement, ...(s.announcement || {}) }, features: { ...st.settings.features, ...(s.features || {}) } });
    persist();
  },
  async saveRoles(rolePerms, roleDefs) {
    st.settings = mergeSettings({ ...st.settings, rolePerms, roleDefs });
    persist();
  },
  watchOverrides: (cb) => on(() => cb({ ...st.overrides })),
  async saveOverride(id, patch) {
    st.overrides[id] = { ...(st.overrides[id] || {}), ...patch, updatedAt: now() };
    persist();
  },
  async clearOverride(id) {
    delete st.overrides[id];
    persist();
  },
  watchCustomPlaces: (cb) => on(() => cb([...st.custom])),
  async saveCustomPlace(p) {
    const id = p.id || `cp-${Math.random().toString(36).slice(2, 10)}`;
    st.custom = [...st.custom.filter((x) => x.id !== id), { ...p, id, famous: true, updatedAt: now(), createdAt: p.createdAt || now() }];
    persist();
    return id;
  },
  async deleteCustomPlace(id) {
    st.custom = st.custom.filter((x) => x.id !== id);
    persist();
  },
  async reportMemory(user, m, reason, note = '') {
    st.reports.unshift({
      id: Math.random().toString(36).slice(2), memoryId: m.id, memoryOwner: m.uid, reason, note: (note || '').slice(0, 500), byUid: user.uid, byName: user.name, status: 'open', createdAt: now(),
      snapshot: { place: m.place || null, caption: m.caption || '', photo: m.photos?.[0] || '', authorName: m.authorName || '', authorPhoto: m.authorPhoto || '', date: m.date || '', occasion: m.occasion || '', photoCount: Math.max(m.photoCount || 0, m.photos?.length || 0), createdAt: typeof m.createdAt === 'number' ? m.createdAt : m.createdAt?.toMillis?.() || 0 },
    });
    persist();
  },
  watchReports: (cb) => on(() => cb([...st.reports])),
  async updateReport(id, patch) {
    st.reports = st.reports.map((r) => (r.id === id ? { ...r, ...patch } : r));
    persist();
  },
  async deleteReport(id) {
    st.reports = st.reports.filter((r) => r.id !== id);
    persist();
  },
  watchUsers: (cb) => on(() => cb(Object.values(st.users).sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0)))),
  async updateUser(uid, patch) {
    st.users[uid] = { ...st.users[uid], ...patch };
    persist();
  },
  // Chế độ demo: dùng lại dữ liệu kỉ niệm / chuyến đi của lớp dữ liệu chính
  watchModerationMemories(cb) {
    let unsub = () => {};
    import('./store').then(({ api }) => (unsub = api.watchPublicMemories((list) => cb(list.filter((m) => m.uid !== 'sample')))));
    return () => unsub();
  },
  hideMemory: (id, by, note = '', owner = null, placeName = '') =>
    import('./store').then(async ({ api }) => {
      await api.updateMemory(id, { visibility: 'private', moderated: true, moderationNote: note });
      if (owner) (await import('./social')).socialApi.notify({ to: owner, type: 'hidden', from: by, memoryId: id, title: placeName, body: note });
    }),
  unhideMemory: (id) => import('./store').then(({ api }) => api.updateMemory(id, { visibility: 'public', moderated: false })),
  deleteMemoryAdmin: (m) => import('./store').then(({ api }) => api.deleteMemory(m)),
  watchAllTrips(cb) {
    let unsub = () => {};
    import('./store').then(({ api }) => (unsub = api.watchTrips('demo-user', cb)));
    return () => unsub();
  },
  deleteTrip: (id) => import('./store').then(({ api }) => api.leaveTrip({ uid: '__admin' }, { id, ownerId: '__admin' })),
  async writeLog(action, { target = '', detail = '' } = {}) {
    if (!actor) return;
    (st.logs ||= []).unshift({ id: Math.random().toString(36).slice(2), at: now(), by: actor.uid, byName: actor.name, action, target: String(target || ''), detail });
    st.logs = st.logs.slice(0, 300);
    persist();
  },
  watchLogs: (cb) => on(() => cb(st.logs || [])),
};

export const adminApi = withLog(firebaseEnabled ? fb : local);
