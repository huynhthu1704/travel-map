/**
 * Mạng xã hội: hồ sơ công khai, theo dõi, thích check-in, bảng tin bạn bè, thông báo.
 *
 *  profiles/{uid}              { uid, name, photo, bio, countries[], cities[{name,cc}], visited, publicCheckins, updatedAt }  — ai đăng nhập cũng xem được
 *  feeds/{uid}                 { items:[{type:'checkin'|'country'|'city', name, city, cc, at, memoryId?, public}], updatedAt } — chỉ bạn bè theo dõi chéo xem được
 *  follows/{from_to}           { from, to, fromName, fromPhoto, at }
 *  memories/{id}/likes/{uid}   { uid, name, photo, at }
 *  notifications/{id}          { to: uid | 'all', type:'like'|'follow'|'hidden'|'feature'|'system', from, fromName, fromPhoto,
 *                                title, body, memoryId?, link?, read:false, createdAt }
 * Thông báo chung (to == 'all') lưu trạng thái đã đọc ở users/{uid}.annRead.
 */
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, addDoc, updateDoc, onSnapshot, query, where, limit, getCountFromServer, arrayUnion, arrayRemove, writeBatch,
} from 'firebase/firestore';
import { firebaseEnabled, db } from './firebase';

const now = () => Date.now();
const fid = (from, to) => `${from}_${to}`;

/* ------------------------------ Firebase ------------------------------ */
const fb = {
  // Hồ sơ công khai
  watchProfile: (uid, cb) => onSnapshot(doc(db, 'profiles', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null)),
  saveProfile: (uid, data) => setDoc(doc(db, 'profiles', uid), { ...data, uid, updatedAt: now() }, { merge: true }),
  saveFeed: (uid, items) => setDoc(doc(db, 'feeds', uid), { items, updatedAt: now() }),
  async getFeed(uid) {
    try {
      const s = await getDoc(doc(db, 'feeds', uid));
      return s.exists() ? s.data().items || [] : [];
    } catch {
      return null; // không có quyền (chưa theo dõi chéo)
    }
  },
  watchPublicCheckins: (uid, cb) =>
    onSnapshot(query(collection(db, 'memories'), where('uid', '==', uid), where('visibility', '==', 'public'), limit(200)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))), () => cb([])),

  // Theo dõi
  follow: (me, to) => setDoc(doc(db, 'follows', fid(me.uid, to)), { from: me.uid, to, fromName: me.name || '', fromPhoto: me.photo || '', at: now() }),
  unfollow: (meUid, to) => deleteDoc(doc(db, 'follows', fid(meUid, to))),
  watchFollowing: (uid, cb) => onSnapshot(query(collection(db, 'follows'), where('from', '==', uid)), (s) => cb(s.docs.map((d) => d.data())), () => cb([])),
  watchFollowers: (uid, cb) => onSnapshot(query(collection(db, 'follows'), where('to', '==', uid)), (s) => cb(s.docs.map((d) => d.data())), () => cb([])),

  // Thích check-in công khai
  async likeInfo(memoryId, meUid) {
    try {
      const [c, mine] = await Promise.all([
        getCountFromServer(collection(db, 'memories', memoryId, 'likes')),
        meUid ? getDoc(doc(db, 'memories', memoryId, 'likes', meUid)) : null,
      ]);
      return { count: c.data().count, liked: !!mine?.exists() };
    } catch {
      return { count: 0, liked: false };
    }
  },
  like: (memoryId, me) => setDoc(doc(db, 'memories', memoryId, 'likes', me.uid), { uid: me.uid, name: me.name || '', photo: me.photo || '', at: now() }),
  unlike: (memoryId, meUid) => deleteDoc(doc(db, 'memories', memoryId, 'likes', meUid)),

  // Thông báo
  notify: (n) => addDoc(collection(db, 'notifications'), { read: false, createdAt: now(), ...n }),
  watchNotifications(uid, cb) {
    let mine = [];
    let all = [];
    const emit = () => cb([...mine, ...all].sort((a, b) => b.createdAt - a.createdAt));
    const u1 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', uid), limit(100)), (s) => ((mine = s.docs.map((d) => ({ id: d.id, ...d.data() }))), emit()), () => {});
    const u2 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', 'all'), limit(50)), (s) => ((all = s.docs.map((d) => ({ id: d.id, ...d.data(), broadcast: true }))), emit()), () => {});
    return () => {
      u1();
      u2();
    };
  },
  async setRead(uid, n, read) {
    if (n.broadcast) return updateDoc(doc(db, 'users', uid), { annRead: read ? arrayUnion(n.id) : arrayRemove(n.id) });
    return updateDoc(doc(db, 'notifications', n.id), { read });
  },
  async markAllRead(uid, list) {
    const b = writeBatch(db);
    const personal = list.filter((n) => !n.broadcast && !n.read);
    personal.slice(0, 450).forEach((n) => b.update(doc(db, 'notifications', n.id), { read: true }));
    const ann = list.filter((n) => n.broadcast).map((n) => n.id);
    if (ann.length) b.update(doc(db, 'users', uid), { annRead: arrayUnion(...ann) });
    await b.commit();
  },
  removeNotification: (id) => deleteDoc(doc(db, 'notifications', id)),
};

/* ------------------------------ Demo (localStorage) ------------------------------ */
const KEY = 'travel-map-social-demo-v1';
let st = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
})() || { profiles: {}, feeds: {}, follows: [], likes: {}, notes: [], annRead: [] };
const subs = new Set();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    /* bỏ qua */
  }
  subs.forEach((f) => f());
};
const on = (fn) => {
  fn();
  subs.add(fn);
  return () => subs.delete(fn);
};
const local = {
  watchProfile: (uid, cb) => on(() => cb(st.profiles[uid] || null)),
  async saveProfile(uid, data) {
    st.profiles[uid] = { ...(st.profiles[uid] || {}), ...data, uid, updatedAt: now() };
    persist();
  },
  async saveFeed(uid, items) {
    st.feeds[uid] = items;
    persist();
  },
  async getFeed(uid) {
    return st.feeds[uid] || [];
  },
  watchPublicCheckins(uid, cb) {
    let unsub = () => {};
    import('./store').then(({ api }) => (unsub = api.watchPublicMemories((l) => cb(l.filter((m) => m.uid === uid)))));
    return () => unsub();
  },
  async follow(me, to) {
    st.follows = [...st.follows.filter((f) => !(f.from === me.uid && f.to === to)), { from: me.uid, to, fromName: me.name, fromPhoto: me.photo || '', at: now() }];
    persist();
  },
  async unfollow(meUid, to) {
    st.follows = st.follows.filter((f) => !(f.from === meUid && f.to === to));
    persist();
  },
  watchFollowing: (uid, cb) => on(() => cb(st.follows.filter((f) => f.from === uid))),
  watchFollowers: (uid, cb) => on(() => cb(st.follows.filter((f) => f.to === uid))),
  async likeInfo(memoryId, meUid) {
    const l = st.likes[memoryId] || [];
    return { count: l.length, liked: l.includes(meUid) };
  },
  async like(memoryId, me) {
    st.likes[memoryId] = [...new Set([...(st.likes[memoryId] || []), me.uid])];
    persist();
  },
  async unlike(memoryId, meUid) {
    st.likes[memoryId] = (st.likes[memoryId] || []).filter((x) => x !== meUid);
    persist();
  },
  async notify(n) {
    st.notes = [{ id: Math.random().toString(36).slice(2), read: false, createdAt: now(), ...n }, ...st.notes];
    persist();
  },
  watchNotifications: (uid, cb) =>
    on(() => cb(st.notes.filter((n) => n.to === uid || n.to === 'all').map((n) => (n.to === 'all' ? { ...n, broadcast: true, read: st.annRead.includes(n.id) } : n)))),
  async setRead(uid, n, read) {
    if (n.broadcast) st.annRead = read ? [...new Set([...st.annRead, n.id])] : st.annRead.filter((x) => x !== n.id);
    else st.notes = st.notes.map((x) => (x.id === n.id ? { ...x, read } : x));
    persist();
  },
  async markAllRead(uid, list) {
    st.notes = st.notes.map((x) => (x.to === uid ? { ...x, read: true } : x));
    st.annRead = [...new Set([...st.annRead, ...list.filter((n) => n.broadcast).map((n) => n.id)])];
    persist();
  },
  async removeNotification(id) {
    st.notes = st.notes.filter((n) => n.id !== id);
    persist();
  },
};

export const socialApi = firebaseEnabled ? fb : local;
