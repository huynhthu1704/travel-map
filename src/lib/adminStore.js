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
  getCountFromServer,
} from 'firebase/firestore';
import { firebaseEnabled, db } from './firebase';

/** Quản trị viên gốc (luôn có quyền admin, kể cả khi chưa có hồ sơ) — khớp với firestore.rules */
export const SUPER_ADMINS = ['huynhthingocthu1704@gmail.com'];
export const ROLES = ['user', 'editor', 'admin'];

export const DEFAULT_SETTINGS = {
  announcement: { active: false, vi: '', en: '', tone: 'info' },
  homeCountry: 'VN',
  features: { explore: true, trips: true, wikidata: true },
};

const now = () => Date.now();
const mergeSettings = (s = {}) => ({
  ...DEFAULT_SETTINGS,
  ...s,
  announcement: { ...DEFAULT_SETTINGS.announcement, ...(s.announcement || {}) },
  features: { ...DEFAULT_SETTINGS.features, ...(s.features || {}) },
});

/* ------------------------------ Firebase ------------------------------ */
const fb = {
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
  watchSettings: (cb) => onSnapshot(doc(db, 'settings', 'site'), (s) => cb(mergeSettings(s.exists() ? s.data() : {})), () => cb(mergeSettings())),
  saveSettings: (s) => setDoc(doc(db, 'settings', 'site'), s, { merge: true }),
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
  reportMemory: (user, m, reason) =>
    addDoc(collection(db, 'reports'), {
      memoryId: m.id, memoryOwner: m.uid, reason, byUid: user.uid, byName: user.name, status: 'open', createdAt: now(),
      snapshot: { place: m.place || null, caption: m.caption || '', photo: m.photos?.[0] || '', authorName: m.authorName || '' },
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
  hideMemory: (id, by, note = '') => updateDoc(doc(db, 'memories', id), { visibility: 'private', moderated: true, moderatedBy: by, moderatedAt: now(), moderationNote: note }),
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
  async reportMemory(user, m, reason) {
    st.reports.unshift({
      id: Math.random().toString(36).slice(2), memoryId: m.id, memoryOwner: m.uid, reason, byUid: user.uid, byName: user.name, status: 'open', createdAt: now(),
      snapshot: { place: m.place || null, caption: m.caption || '', photo: m.photos?.[0] || '', authorName: m.authorName || '' },
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
  hideMemory: (id) => import('./store').then(({ api }) => api.updateMemory(id, { visibility: 'private', moderated: true })),
  unhideMemory: (id) => import('./store').then(({ api }) => api.updateMemory(id, { visibility: 'public', moderated: false })),
  deleteMemoryAdmin: (m) => import('./store').then(({ api }) => api.deleteMemory(m)),
  watchAllTrips(cb) {
    let unsub = () => {};
    import('./store').then(({ api }) => (unsub = api.watchTrips('demo-user', cb)));
    return () => unsub();
  },
  deleteTrip: (id) => import('./store').then(({ api }) => api.leaveTrip({ uid: '' }, { id })),
};

export const adminApi = firebaseEnabled ? fb : local;
