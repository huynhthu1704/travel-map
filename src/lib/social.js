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
  collection, doc, setDoc, getDoc, getDocs, runTransaction, deleteDoc, addDoc, updateDoc, onSnapshot, query, where, limit, getCountFromServer, arrayUnion, arrayRemove, writeBatch, deleteField,
} from 'firebase/firestore';
import { firebaseEnabled, db } from './firebase';
import { normalize } from './geo';

/** Các trường giúp tìm người dùng theo tên (không phân biệt dấu, tìm theo đầu từ) */
export function nameSearchFields(name = '') {
  const n = normalize(name).replace(/\s+/g, ' ').trim();
  const keys = new Set();
  n.split(' ').filter(Boolean).forEach((w) => {
    for (let i = 1; i <= Math.min(w.length, 20); i++) keys.add(w.slice(0, i));
  });
  return { nameLower: n, searchKeys: [...keys].slice(0, 120) };
}
/** Tên người dùng (nickname): 3–20 kí tự a-z, 0-9, dấu chấm, gạch dưới — duy nhất */
export const USERNAME_RE = /^[a-z0-9._]{3,20}$/;
const RESERVED = new Set(['admin', 'administrator', 'travelmap', 'travel.map', 'support', 'help', 'root', 'system', 'moderator', 'claude', 'anthropic', 'null', 'undefined']);
export function usernameProblem(n) {
  if (!n) return '';
  if (n.length < 3) return 'short';
  if (n.length > 20) return 'long';
  if (!USERNAME_RE.test(n)) return 'chars';
  if (/^[._]|[._]$/.test(n) || /\.\./.test(n)) return 'dots';
  if (RESERVED.has(n)) return 'reserved';
  return '';
}
export const cleanUsername = (s = '') => s.trim().replace(/^@/, '').toLowerCase();

const matchName = (p, words) => {
  const u = (p.username || '').toLowerCase();
  if (words.length === 1 && u && u.startsWith(words[0].replace(/^@/, ''))) return true;
  const n = normalize(p.name || p.nameLower || '');
  return words.every((w) => n.split(/\s+/).some((x) => x.startsWith(w)) || n.includes(w));
};
const queryWords = (q) => normalize(q).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

const now = () => Date.now();
let profileCache = null;
const fid = (from, to) => `${from}_${to}`;

/* ------------------------------ Firebase ------------------------------ */
const fb = {
  // Hồ sơ công khai
  watchProfile: (uid, cb) => onSnapshot(doc(db, 'profiles', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null)),
  saveProfile: (uid, data) => setDoc(doc(db, 'profiles', uid), { ...data, uid, updatedAt: now() }, { merge: true }),
  saveFeed: (uid, items) => setDoc(doc(db, 'feeds', uid), { items, updatedAt: now() }),
  // Hồ sơ riêng tư: thống kê chi tiết (quốc gia, thành phố…) chuyển sang profileStats/{uid},
  // chỉ chính chủ và người theo dõi chéo đọc được (luật Firestore). Hồ sơ công khai chỉ còn tên / ảnh / giới thiệu.
  async saveStats(uid, stats, isPrivate) {
    if (isPrivate) {
      await setDoc(doc(db, 'profileStats', uid), { ...stats, uid, updatedAt: now() });
      await setDoc(doc(db, 'profiles', uid), { countries: deleteField(), cities: deleteField(), visited: deleteField(), publicCheckins: deleteField(), updatedAt: now() }, { merge: true });
    } else {
      await setDoc(doc(db, 'profiles', uid), { ...stats, uid, updatedAt: now() }, { merge: true });
      await deleteDoc(doc(db, 'profileStats', uid)).catch(() => {});
    }
  },
  watchStats: (uid, cb) => onSnapshot(doc(db, 'profileStats', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null)),
  /** Ẩn / hiện ngày ở check-in công khai: đánh dấu trên từng check-in để người xem khác không thấy ngày */
  async setHideDates(uid, on) {
    await setDoc(doc(db, 'profiles', uid), { hideDates: !!on, updatedAt: now() }, { merge: true });
    const s = await getDocs(query(collection(db, 'memories'), where('uid', '==', uid)));
    for (let i = 0; i < s.docs.length; i += 400) {
      const b = writeBatch(db);
      s.docs.slice(i, i + 400).forEach((d) => b.update(d.ref, { hideDate: !!on }));
      await b.commit();
    }
  },
  // Tên người dùng
  async usernameOwner(name) {
    const s = await getDoc(doc(db, 'usernames', name));
    return s.exists() ? s.data().uid : null;
  },
  async setUsername(uid, name, old) {
    await runTransaction(db, async (tx) => {
      if (name) {
        const ref = doc(db, 'usernames', name);
        const cur = await tx.get(ref);
        if (cur.exists() && cur.data().uid !== uid) throw new Error('taken');
        if (!cur.exists()) tx.set(ref, { uid, at: now() });
      }
      if (old && old !== name) tx.delete(doc(db, 'usernames', old));
      tx.set(doc(db, 'profiles', uid), { uid, username: name || '', updatedAt: now() }, { merge: true });
    });
  },
  // Tìm người dùng theo tên
  async searchUsers(q) {
    const words = queryWords(q);
    if (!words.length) return [];
    const handle = cleanUsername(q);
    const first = [...words].sort((a, b) => b.length - a.length)[0].replace(/^@/, '').slice(0, 20);
    // Hồ sơ cũ chưa có searchKeys (chủ hồ sơ chưa mở bản mới): tải danh sách hồ sơ 1 lần rồi lọc theo tên
    if (!profileCache || Date.now() - profileCache.at > 120000) {
      profileCache = { at: Date.now(), list: getDocs(query(collection(db, 'profiles'), limit(500))).then((s) => s.docs.map((d) => ({ uid: d.id, ...d.data() }))).catch(() => []) };
    }
    const byHandle =
      handle.length >= 2 && /^[a-z0-9._]+$/.test(handle)
        ? getDocs(query(collection(db, 'profiles'), where('username', '>=', handle), where('username', '<=', `${handle}\uf8ff`), limit(10)))
            .then((s) => s.docs.map((d) => ({ uid: d.id, ...d.data() })))
            .catch(() => [])
        : Promise.resolve([]);
    const [hit, all, hh] = await Promise.all([
      getDocs(query(collection(db, 'profiles'), where('searchKeys', 'array-contains', first), limit(25)))
        .then((s) => s.docs.map((d) => ({ uid: d.id, ...d.data() })))
        .catch(() => []),
      profileCache.list,
      byHandle,
    ]);
    const out = new Map();
    hh.forEach((p) => out.set(p.uid, p));
    [...hit, ...all].filter((p) => p.name && matchName(p, words)).forEach((p) => out.set(p.uid, p));
    return [...out.values()].slice(0, 8);
  },
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
  // Thông báo theo vai trò (to == 'role:<vai trò>') cũng là thông báo chung: lưu đã đọc ở annRead
  watchNotifications(uid, cb, role = 'user') {
    let mine = [];
    let all = [];
    let byRole = [];
    const emit = () => cb([...mine, ...all, ...byRole].sort((a, b) => b.createdAt - a.createdAt));
    const u3 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', 'role:' + (role || 'user')), limit(50)), (s) => ((byRole = s.docs.map((d) => ({ id: d.id, ...d.data(), broadcast: true }))), emit()), () => {});
    const u1 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', uid), limit(100)), (s) => ((mine = s.docs.map((d) => ({ id: d.id, ...d.data() }))), emit()), () => {});
    const u2 = onSnapshot(query(collection(db, 'notifications'), where('to', '==', 'all'), limit(50)), (s) => ((all = s.docs.map((d) => ({ id: d.id, ...d.data(), broadcast: true }))), emit()), () => {});
    return () => {
      u1();
      u2();
      u3();
    };
  },
  // Đã đọc: ghi kèm thời điểm đọc (readAt / annReadAt) để báo cáo cho đội vận hành
  async setRead(uid, n, read) {
    if (n.broadcast)
      return updateDoc(doc(db, 'users', uid), { annRead: read ? arrayUnion(n.id) : arrayRemove(n.id), [`annReadAt.${n.id}`]: read ? now() : deleteField() });
    return updateDoc(doc(db, 'notifications', n.id), { read, readAt: read ? now() : null });
  },
  async markAllRead(uid, list) {
    const b = writeBatch(db);
    const t = now();
    const personal = list.filter((n) => !n.broadcast && !n.read);
    personal.slice(0, 450).forEach((n) => b.update(doc(db, 'notifications', n.id), { read: true, readAt: t }));
    const ann = list.filter((n) => n.broadcast && !n.read).map((n) => n.id);
    if (ann.length) b.update(doc(db, 'users', uid), { annRead: arrayUnion(...ann), ...Object.fromEntries(ann.map((id) => [`annReadAt.${id}`, t])) });
    await b.commit();
  },
  removeNotification: (id) => deleteDoc(doc(db, 'notifications', id)),
  // Thông báo đội vận hành đã gửi (tin tính năng / tin chung) — để xem lại và thu hồi
  // Lịch sử thông báo đã gửi: broadcasts/{batch} — giữ lại cả khi đã thu hồi (để xem báo cáo)
  recordBroadcast: (b) => setDoc(doc(db, 'broadcasts', b.id), b),
  updateBroadcast: (id, patch) => updateDoc(doc(db, 'broadcasts', id), patch),
  watchBroadcasts: (cb) =>
    onSnapshot(query(collection(db, 'broadcasts'), limit(300)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([])),
  watchSentBroadcasts: (cb) =>
    onSnapshot(
      query(collection(db, 'notifications'), where('type', 'in', ['feature', 'system']), limit(500)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => cb([]),
    ),
  async removeNotifications(ids) {
    for (let i = 0; i < ids.length; i += 400) {
      const b = writeBatch(db);
      ids.slice(i, i + 400).forEach((id) => b.delete(doc(db, 'notifications', id)));
      await b.commit();
    }
  },
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
  async saveStats(uid, stats, isPrivate) {
    st.profiles[uid] = { ...(st.profiles[uid] || {}), uid, updatedAt: now() };
    if (isPrivate) {
      ['countries', 'cities', 'visited', 'publicCheckins'].forEach((k) => delete st.profiles[uid][k]);
      (st.stats ||= {})[uid] = { ...stats, uid };
    } else {
      Object.assign(st.profiles[uid], stats);
      if (st.stats) delete st.stats[uid];
    }
    persist();
  },
  watchStats: (uid, cb) => on(() => cb(st.stats?.[uid] || null)),
  async setHideDates(uid, on) {
    st.profiles[uid] = { ...(st.profiles[uid] || {}), uid, hideDates: !!on };
    persist();
    const { api } = await import('./store');
    if (api.markHideDates) await api.markHideDates(uid, on);
  },
  async getFeed(uid) {
    return st.feeds[uid] || [];
  },
  async usernameOwner(name) {
    return (st.usernames || {})[name] || null;
  },
  async setUsername(uid, name, old) {
    st.usernames ||= {};
    if (name && st.usernames[name] && st.usernames[name] !== uid) throw new Error('taken');
    if (old && old !== name) delete st.usernames[old];
    if (name) st.usernames[name] = uid;
    st.profiles[uid] = { ...(st.profiles[uid] || {}), uid, username: name || '', updatedAt: now() };
    persist();
  },
  async searchUsers(q) {
    const words = queryWords(q);
    if (!words.length) return [];
    return Object.values(st.profiles).filter((p) => matchName(p, words)).slice(0, 8);
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
    const id = Math.random().toString(36).slice(2);
    st.notes = [{ id, read: false, createdAt: now(), ...n }, ...st.notes];
    persist();
    return { id };
  },
  // Lịch sử thông báo đã gửi (giữ lại cả khi đã thu hồi)
  async recordBroadcast(b) {
    st.broadcasts = [b, ...(st.broadcasts || []).filter((x) => x.id !== b.id)];
    persist();
  },
  async updateBroadcast(id, patch) {
    st.broadcasts = (st.broadcasts || []).map((x) => (x.id === id ? { ...x, ...patch } : x));
    persist();
  },
  watchBroadcasts: (cb) => on(() => cb([...(st.broadcasts || [])])),
  watchNotifications: (uid, cb, role = 'user') =>
    on(() =>
      cb(
        st.notes
          .filter((n) => n.to === uid || n.to === 'all' || n.to === 'role:' + (role || 'user'))
          .map((n) => (n.to === 'all' || String(n.to).startsWith('role:') ? { ...n, broadcast: true, read: st.annRead.includes(n.id) } : n)),
      ),
    ),
  async setRead(uid, n, read) {
    st.annReadAt ||= {};
    if (n.broadcast) {
      st.annRead = read ? [...new Set([...st.annRead, n.id])] : st.annRead.filter((x) => x !== n.id);
      if (read) st.annReadAt[n.id] = now();
      else delete st.annReadAt[n.id];
    } else st.notes = st.notes.map((x) => (x.id === n.id ? { ...x, read, readAt: read ? now() : null } : x));
    persist();
  },
  async markAllRead(uid, list) {
    const t = now();
    st.annReadAt ||= {};
    st.notes = st.notes.map((x) => (x.to === uid && !x.read ? { ...x, read: true, readAt: t } : x));
    list.filter((n) => n.broadcast && !n.read).forEach((n) => (st.annReadAt[n.id] = t));
    st.annRead = [...new Set([...st.annRead, ...list.filter((n) => n.broadcast).map((n) => n.id)])];
    persist();
  },
  watchSentBroadcasts: (cb) => on(() => cb(st.notes.filter((n) => n.type === 'feature' || n.type === 'system'))),
  async removeNotifications(ids) {
    st.notes = st.notes.filter((n) => !ids.includes(n.id));
    persist();
  },
  async removeNotification(id) {
    st.notes = st.notes.filter((n) => n.id !== id);
    persist();
  },
};

export const socialApi = firebaseEnabled ? fb : local;
