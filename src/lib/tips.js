/**
 * Kinh nghiệm du lịch theo quốc gia (cộng đồng).
 *  countryPosts/{id}            { cc, city, topic, title, body, uid, authorName, authorPhoto, helpful, wrong, comments,
 *                                 status:'ok'|'hidden', createdAt, updatedAt, lastCommentId? }
 *  countryPosts/{id}/votes/{uid}    { v:'helpful'|'wrong', at }   — mỗi người 1 phiếu, đổi được
 *  countryPosts/{id}/comments/{cid} { uid, authorName, authorPhoto, body, createdAt, best? }
 * Bộ đếm (helpful / wrong / comments) được cập nhật cùng 1 lần ghi với phiếu / bình luận; luật Firestore kiểm tra
 * con số tăng / giảm đúng bằng thay đổi thật (không ai tự cộng điểm được).
 */
import {
  collection, doc, getDoc, getDocs, query, where, limit, writeBatch, increment, deleteDoc, updateDoc, onSnapshot,
} from 'firebase/firestore';
import { firebaseEnabled, db } from './firebase';

export const TOPICS = ['visa', 'cost', 'transport', 'food', 'stay', 'scam', 'other'];
export const TOPIC_ICON = { visa: '🛂', cost: '💸', transport: '🚆', food: '🍜', stay: '🏨', scam: '⚠️', other: '💬' };
export const DEFAULT_COMMUNITY = { helpfulSlots: 2, newSlots: 1, newDays: 30, flagMin: 3, flagPct: 40, staleMonths: 12 };

const now = () => Date.now();
const DAY = 864e5;

/* ------------------------------ Xếp hạng ------------------------------ */
/** Cận dưới Wilson (độ tin cậy 95%) của tỉ lệ "hữu ích": 1/1 lượt không thắng được 80/90 lượt */
export function wilson(up, total) {
  if (!total) return 0;
  const z = 1.96;
  const p = up / total;
  return (p + (z * z) / (2 * total) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total)) / (1 + (z * z) / total);
}
export const isFlagged = (p, cfg) => {
  const total = (p.helpful || 0) + (p.wrong || 0);
  return (p.wrong || 0) >= cfg.flagMin && total > 0 && ((p.wrong || 0) * 100) / total > cfg.flagPct;
};
export const isStale = (p, cfg) => now() - (p.createdAt || 0) > cfg.staleMonths * 30 * DAY;
/** Điểm hữu ích có giảm dần theo tuổi bài (thông tin du lịch cũ đi nhanh): nửa giá trị sau ~6 tháng */
export const helpfulScore = (p) => {
  const ageDays = (now() - (p.createdAt || 0)) / DAY;
  return wilson(p.helpful || 0, (p.helpful || 0) + (p.wrong || 0)) * Math.pow(0.5, ageDays / 180);
};

/**
 * Sắp xếp "Đề xuất": xen kẽ theo tỉ lệ admin cấu hình — mỗi vòng lấy `helpfulSlots` bài hữu ích nhất rồi
 * `newSlots` bài mới (đăng trong `newDays` ngày). Bài bị báo sai nhiều không vào danh sách này.
 */
export function rankPosts(posts, mode, cfgIn) {
  const cfg = { ...DEFAULT_COMMUNITY, ...(cfgIn || {}) };
  const newest = [...posts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (mode === 'new') return newest;
  const ok = posts.filter((p) => !isFlagged(p, cfg));
  const helpful = [...ok].sort((a, b) => helpfulScore(b) - helpfulScore(a) || (b.createdAt || 0) - (a.createdAt || 0));
  if (mode === 'helpful') return [...helpful, ...posts.filter((p) => isFlagged(p, cfg))];
  const fresh = ok.filter((p) => now() - (p.createdAt || 0) <= cfg.newDays * DAY).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const out = [];
  const seen = new Set();
  let h = 0;
  let f = 0;
  const take = (list, i) => {
    while (i < list.length && seen.has(list[i].id)) i++;
    if (i < list.length) {
      seen.add(list[i].id);
      out.push(list[i]);
      i++;
    }
    return i;
  };
  const hs = Math.max(0, cfg.helpfulSlots | 0);
  const ns = Math.max(0, cfg.newSlots | 0);
  while (out.length < ok.length) {
    const before = out.length;
    for (let k = 0; k < hs; k++) h = take(helpful, h);
    for (let k = 0; k < ns; k++) f = take(fresh, f);
    if (out.length === before) {
      // hết bài mới / hữu ích theo tỉ lệ → phần còn lại theo điểm hữu ích
      helpful.forEach((p) => !seen.has(p.id) && (seen.add(p.id), out.push(p)));
      break;
    }
  }
  return out;
}

/* ------------------------------ Firebase ------------------------------ */
const postRef = (id) => doc(db, 'countryPosts', id);
const rows = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));

const fb = {
  watchCountry(cc, cb) {
    return onSnapshot(
      query(collection(db, 'countryPosts'), where('cc', '==', cc), where('status', '==', 'ok'), limit(300)),
      (s) => cb(rows(s)),
      () => cb([]),
    );
  },
  async countFor(cc) {
    const s = await getDocs(query(collection(db, 'countryPosts'), where('cc', '==', cc), where('status', '==', 'ok'), limit(300))).catch(() => null);
    return s ? rows(s) : [];
  },
  watchPost(id, cb) {
    return onSnapshot(postRef(id), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), () => cb(null));
  },
  async create(user, { cc, city, topic, title, body }) {
    const ref = doc(collection(db, 'countryPosts'));
    const b = writeBatch(db);
    b.set(ref, {
      cc, city: city || '', topic, title, body, uid: user.uid, authorName: user.name || '', authorPhoto: user.photo || '',
      helpful: 0, wrong: 0, comments: 0, status: 'ok', createdAt: now(), updatedAt: now(),
    });
    await b.commit();
    return ref.id;
  },
  update: (id, patch) => updateDoc(postRef(id), { ...patch, updatedAt: now() }),
  async remove(id) {
    const [v, c] = await Promise.all([getDocs(collection(db, 'countryPosts', id, 'votes')), getDocs(collection(db, 'countryPosts', id, 'comments'))]).catch(() => [null, null]);
    const refs = [...(v?.docs || []), ...(c?.docs || [])].map((d) => d.ref);
    for (let i = 0; i < refs.length; i += 400) {
      const b = writeBatch(db);
      refs.slice(i, i + 400).forEach((r) => b.delete(r));
      await b.commit();
    }
    await deleteDoc(postRef(id));
  },
  async myVote(id, uid) {
    const s = await getDoc(doc(db, 'countryPosts', id, 'votes', uid)).catch(() => null);
    return s?.exists() ? s.data().v : '';
  },
  /** Bấm Hữu ích / Sai lệch: bấm lại cùng nút = bỏ phiếu; bấm nút kia = đổi phiếu */
  async vote(user, post, prev, v) {
    const next = prev === v ? '' : v;
    const b = writeBatch(db);
    const vr = doc(db, 'countryPosts', post.id, 'votes', user.uid);
    if (next) b.set(vr, { v: next, uid: user.uid, at: now() });
    else b.delete(vr);
    const d = (k) => (next === k ? 1 : 0) - (prev === k ? 1 : 0);
    b.update(postRef(post.id), { helpful: increment(d('helpful')), wrong: increment(d('wrong')) });
    await b.commit();
    return next;
  },
  watchComments(id, cb) {
    return onSnapshot(collection(db, 'countryPosts', id, 'comments'), (s) => cb(rows(s).sort((a, b) => a.createdAt - b.createdAt)), () => cb([]));
  },
  async comment(user, post, body) {
    const cr = doc(collection(db, 'countryPosts', post.id, 'comments'));
    const b = writeBatch(db);
    b.set(cr, { uid: user.uid, authorName: user.name || '', authorPhoto: user.photo || '', body, createdAt: now() });
    b.update(postRef(post.id), { comments: increment(1), lastCommentId: cr.id });
    await b.commit();
    return cr.id;
  },
  async deleteComment(post, c) {
    const b = writeBatch(db);
    b.delete(doc(db, 'countryPosts', post.id, 'comments', c.id));
    b.update(postRef(post.id), { comments: increment(-1), lastCommentId: c.id });
    await b.commit();
  },
  markBest: (post, c, best) => updateDoc(doc(db, 'countryPosts', post.id, 'comments', c.id), { best: !!best }),
  // Quản trị
  watchAll(cb) {
    return onSnapshot(query(collection(db, 'countryPosts'), limit(500)), (s) => cb(rows(s).sort((a, b) => b.createdAt - a.createdAt)), () => cb([]));
  },
  setStatus: (id, status) => updateDoc(postRef(id), { status, updatedAt: now() }),
};

/* ------------------------------ Demo (localStorage) ------------------------------ */
const KEY = 'travel-map-tips-demo-v1';
const st = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { posts: [], votes: {}, comments: {} };
  } catch {
    return { posts: [], votes: {}, comments: {} };
  }
})();
const subs = new Set();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    /* đầy */
  }
  subs.forEach((f) => f());
};
const on = (fn) => (fn(), subs.add(fn), () => subs.delete(fn));
const rid = () => Math.random().toString(36).slice(2, 12);
const local = {
  watchCountry: (cc, cb) => on(() => cb(st.posts.filter((p) => p.cc === cc && p.status === 'ok'))),
  countFor: async (cc) => st.posts.filter((p) => p.cc === cc && p.status === 'ok'),
  watchPost: (id, cb) => on(() => cb(st.posts.find((p) => p.id === id) || null)),
  async create(user, { cc, city, topic, title, body }) {
    const id = rid();
    st.posts.push({ id, cc, city: city || '', topic, title, body, uid: user.uid, authorName: user.name || '', authorPhoto: user.photo || '', helpful: 0, wrong: 0, comments: 0, status: 'ok', createdAt: now(), updatedAt: now() });
    persist();
    return id;
  },
  async update(id, patch) {
    Object.assign(st.posts.find((p) => p.id === id) || {}, patch, { updatedAt: now() });
    persist();
  },
  async remove(id) {
    st.posts = st.posts.filter((p) => p.id !== id);
    persist();
  },
  myVote: async (id, uid) => st.votes[`${id}_${uid}`] || '',
  async vote(user, post, prev, v) {
    const next = prev === v ? '' : v;
    const p = st.posts.find((x) => x.id === post.id);
    const d = (k) => (next === k ? 1 : 0) - (prev === k ? 1 : 0);
    p.helpful += d('helpful');
    p.wrong += d('wrong');
    st.votes[`${post.id}_${user.uid}`] = next;
    persist();
    return next;
  },
  watchComments: (id, cb) => on(() => cb(st.comments[id] || [])),
  async comment(user, post, body) {
    const id = rid();
    (st.comments[post.id] ||= []).push({ id, uid: user.uid, authorName: user.name || '', authorPhoto: user.photo || '', body, createdAt: now() });
    st.posts.find((x) => x.id === post.id).comments += 1;
    persist();
    return id;
  },
  async deleteComment(post, c) {
    st.comments[post.id] = (st.comments[post.id] || []).filter((x) => x.id !== c.id);
    st.posts.find((x) => x.id === post.id).comments -= 1;
    persist();
  },
  async markBest(post, c, best) {
    const x = (st.comments[post.id] || []).find((y) => y.id === c.id);
    if (x) x.best = !!best;
    persist();
  },
  watchAll: (cb) => on(() => cb([...st.posts].sort((a, b) => b.createdAt - a.createdAt))),
  async setStatus(id, status) {
    Object.assign(st.posts.find((p) => p.id === id) || {}, { status });
    persist();
  },
};

export const tipsApi = firebaseEnabled ? fb : local;
