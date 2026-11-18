/**
 * Lớp dữ liệu: dùng Firebase (Auth + Firestore + Storage) khi có cấu hình,
 * ngược lại dùng "chế độ demo" lưu trong localStorage để chạy thử ngay.
 *
 * Mô hình dữ liệu (Firestore):
 *  users/{uid}/places/{placeId}  { id,name,city,country,lat,lng,emoji,status:'visited'|'wishlist',tripId?,updatedAt }
 *  memories/{id}                 { uid,authorName,authorPhoto,place{},caption,date,visibility:'public'|'private',tripId?,photos[] (ảnh thu nhỏ dạng data URL),photoCount,createdAt }
 *  memories/{id}/full/{i}        { data (ảnh đầy đủ dạng data URL ~≤700KB), uid }
 *  (Ảnh lưu thẳng trong Firestore để dùng được gói Spark miễn phí — không cần Firebase Storage.)
 *  trips/{id}                    { name,emoji,ownerId,memberIds[],members{uid:{name,photo}},inviteCode,createdAt }
 *  trips/{id}/stops/{stopId}     { place{},kind:'place'|'memory'|'wishlist',photos[],caption,byUid,byName,createdAt }
 *  trips/{id}/plan/{itemId}      { place{},date?,time?,note,order,done,doneBy,doneAt,addedBy,addedByName,createdAt }
 *  trips/{id}/checklists/{id}    { title,phase:'before'|'return',scope:'shared'|'personal',ownerUid?,items[{id,text,done,doneBy}],createdBy,createdAt }
 */
import {
  collection, doc, setDoc, deleteDoc, addDoc, updateDoc, onSnapshot, query, where, getDocs, limit,
  serverTimestamp, arrayUnion, arrayRemove, deleteField, writeBatch,
} from 'firebase/firestore';
import { signInWithPopup, signInWithRedirect, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseEnabled, auth, db, googleProvider } from './firebase';
import { compressImage, compressToDataURL, blobToDataURL } from './image';
import { translate } from '../i18n';
import { FAMOUS_BY_ID } from '../data/places';

const now = () => Date.now();
const toMillis = (v) => (v?.toMillis ? v.toMillis() : v || 0);
const byNewest = (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt);
// Kế hoạch: theo ngày dự định (mục chưa có ngày để cuối), rồi theo thứ tự người dùng sắp
const byPlanOrder = (a, b) => (a.date || '9999') .localeCompare(b.date || '9999') || (a.order ?? 0) - (b.order ?? 0);
const safeId = (s) => String(s).replace(/[^\w-]/g, '_').slice(0, 120);
export const makeInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const pickPlace = (p) => ({
  id: p.id, name: p.name, city: p.city || '', country: p.country || '', lat: p.lat, lng: p.lng,
  emoji: p.emoji || FAMOUS_BY_ID[p.id]?.emoji || '📍',
  ...(p.i18n ? { i18n: p.i18n } : {}),
});

/* ------------------------------------------------------------------ */
/* Firebase backend                                                    */
/* ------------------------------------------------------------------ */
const firebaseBackend = {
  mode: 'firebase',
  onAuth(cb) {
    return onAuthStateChanged(auth, (u) =>
      cb(u ? { uid: u.uid, name: u.displayName || u.email, photo: u.photoURL, email: u.email } : null),
    );
  },
  async signIn() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
      } else if (e?.code !== 'auth/popup-closed-by-user') throw e;
    }
  },
  signOut: () => fbSignOut(auth),

  watchPlaces(uid, cb) {
    return onSnapshot(collection(db, 'users', uid, 'places'), (s) => cb(s.docs.map((d) => d.data())));
  },
  /** visitedAt: ngày đã đến ('YYYY-MM-DD'); occasion: đến vì dịp gì — cả hai tuỳ chọn */
  async setPlace(user, place, status, tripId, visitedAt = null, occasion = '') {
    const r = doc(db, 'users', user.uid, 'places', safeId(place.id));
    if (!status) return deleteDoc(r);
    const visited = status === 'visited';
    await setDoc(r, {
      ...pickPlace(place), status, tripId: tripId || null,
      visitedAt: visited ? visitedAt || null : null, occasion: visited ? occasion || '' : '', updatedAt: now(),
    });
    if (tripId && status) await this.ensureStop(user, tripId, place, visited ? 'place' : 'wishlist');
  },

  watchMyMemories(uid, cb) {
    return onSnapshot(query(collection(db, 'memories'), where('uid', '==', uid)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
    );
  },
  watchPublicMemories(cb) {
    return onSnapshot(query(collection(db, 'memories'), where('visibility', '==', 'public'), limit(300)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
    );
  },
  async addMemory(user, { place, caption, date, visibility, tripId }, files) {
    const memRef = doc(collection(db, 'memories'));
    const thumbs = [];
    const full = [];
    for (const f of files) {
      thumbs.push(await compressToDataURL(f, 420, 0.7, 60_000));
      full.push(await compressToDataURL(f, 1440, 0.82, 700_000));
    }
    const data = {
      uid: user.uid, authorName: user.name, authorPhoto: user.photo || '', place: pickPlace(place), caption: caption || '',
      date: date || '', visibility, tripId: tripId || null, photos: thumbs, photoCount: full.length, createdAt: now(),
    };
    await setDoc(memRef, data);
    // Mỗi ảnh đầy đủ là 1 document riêng (giới hạn 1MB/document của Firestore)
    for (let i = 0; i < full.length; i++) {
      await setDoc(doc(db, 'memories', memRef.id, 'full', String(i)), { data: full[i], uid: user.uid, i });
    }
    // Đặt chân tới đây = đánh dấu "đã đến"
    await setDoc(
      doc(db, 'users', user.uid, 'places', safeId(place.id)),
      { ...pickPlace(place), status: 'visited', tripId: tripId || null, visitedAt: date || null, updatedAt: now() },
      { merge: true }, // giữ lại "dịp" đã ghi trước đó
    );
    if (tripId) await this.addStop(user, tripId, { place, kind: 'memory', photos: thumbs, caption, memoryId: memRef.id });
    return { id: memRef.id, ...data, fullPhotos: full };
  },
  /** Lấy ảnh độ phân giải đầy đủ (fallback: ảnh thu nhỏ) */
  async getFullPhotos(mem) {
    if (mem.fullPhotos) return mem.fullPhotos;
    const id = mem.memoryId || mem.id;
    if (!id || !mem.photoCount && !mem.memoryId) return mem.photos || [];
    try {
      const snap = await getDocs(collection(db, 'memories', id, 'full'));
      const list = snap.docs.map((d) => d.data()).sort((a, b) => a.i - b.i).map((d) => d.data);
      return list.length ? list : mem.photos || [];
    } catch {
      return mem.photos || [];
    }
  },
  updateMemory: (id, patch) => updateDoc(doc(db, 'memories', id), patch),
  async deleteMemory(mem) {
    const snap = await getDocs(collection(db, 'memories', mem.id, 'full'));
    const b = writeBatch(db);
    snap.docs.forEach((d) => b.delete(d.ref));
    b.delete(doc(db, 'memories', mem.id));
    await b.commit();
  },

  watchTrips(uid, cb) {
    return onSnapshot(query(collection(db, 'trips'), where('memberIds', 'array-contains', uid)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
    );
  },
  async createTrip(user, { name, emoji }) {
    const data = {
      name, emoji: emoji || '🧳', ownerId: user.uid, memberIds: [user.uid],
      members: { [user.uid]: { name: user.name, photo: user.photo || '' } }, inviteCode: makeInviteCode(), createdAt: now(),
    };
    const r = await addDoc(collection(db, 'trips'), data);
    return { id: r.id, ...data };
  },
  updateTrip(id, patch) {
    return updateDoc(doc(db, 'trips', id), { ...patch, updatedAt: now() });
  },
  async joinTrip(user, code) {
    const s = await getDocs(query(collection(db, 'trips'), where('inviteCode', '==', code.trim().toUpperCase()), limit(1)));
    if (s.empty) throw new Error(translate('err.tripNotFound'));
    const d = s.docs[0];
    await updateDoc(d.ref, { memberIds: arrayUnion(user.uid), [`members.${user.uid}`]: { name: user.name, photo: user.photo || '' } });
    return { id: d.id, ...d.data() };
  },
  async leaveTrip(user, trip) {
    if (trip.ownerId === user.uid) return deleteDoc(doc(db, 'trips', trip.id));
    await updateDoc(doc(db, 'trips', trip.id), { memberIds: arrayRemove(user.uid), [`members.${user.uid}`]: deleteField() });
  },
  watchStops(tripId, cb) {
    return onSnapshot(collection(db, 'trips', tripId, 'stops'), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, tripId, ...d.data() })).sort(byNewest)),
    );
  },
  // ---- Kế hoạch chuyến đi: trips/{id}/plan/{itemId} ----
  watchPlan(tripId, cb) {
    return onSnapshot(collection(db, 'trips', tripId, 'plan'), (s) => cb(s.docs.map((d) => ({ id: d.id, tripId, ...d.data() })).sort(byPlanOrder)));
  },
  addPlanItem(user, tripId, { place, date = '', time = '', note = '', order }) {
    return addDoc(collection(db, 'trips', tripId, 'plan'), {
      place: pickPlace(place), date, time, note, order: order ?? now(), done: false, doneBy: null, doneAt: null,
      addedBy: user.uid, addedByName: user.name, createdAt: now(),
    });
  },
  updatePlanItem(tripId, id, patch) {
    return updateDoc(doc(db, 'trips', tripId, 'plan', id), patch);
  },
  deletePlanItem(tripId, id) {
    return deleteDoc(doc(db, 'trips', tripId, 'plan', id));
  },
  /** Ghi lại thứ tự mới: [{id, order}] */
  async reorderPlan(tripId, list) {
    const b = writeBatch(db);
    list.forEach(({ id, order }) => b.update(doc(db, 'trips', tripId, 'plan', id), { order }));
    await b.commit();
  },
  // ---- Checklist: trips/{id}/checklists/{listId} ----
  /** Checklist chung của nhóm + checklist cá nhân của mình (2 truy vấn vì checklist cá nhân của người khác bị chặn đọc) */
  watchChecklists(tripId, cb, uid) {
    const col = collection(db, 'trips', tripId, 'checklists');
    let shared = [];
    let mine = [];
    const emit = () => cb([...shared, ...mine].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)));
    const map = (s) => s.docs.map((d) => ({ id: d.id, tripId, ...d.data() }));
    const u1 = onSnapshot(query(col, where('scope', '==', 'shared')), (s) => ((shared = map(s)), emit()));
    const u2 = onSnapshot(query(col, where('ownerUid', '==', uid || '-')), (s) => ((mine = map(s)), emit()));
    return () => (u1(), u2());
  },
  addChecklist(user, tripId, { title, phase, scope, items }) {
    return addDoc(collection(db, 'trips', tripId, 'checklists'), {
      title, phase, scope, ownerUid: scope === 'personal' ? user.uid : null, items, createdBy: user.uid, createdByName: user.name, createdAt: now(),
    });
  },
  updateChecklist(tripId, id, patch) {
    return updateDoc(doc(db, 'trips', tripId, 'checklists', id), patch);
  },
  deleteChecklist(tripId, id) {
    return deleteDoc(doc(db, 'trips', tripId, 'checklists', id));
  },
  /** Gắn / đổi / bỏ chuyến đi cho 1 địa điểm đã lưu: cập nhật địa điểm và điểm dừng trong chuyến */
  async setPlaceTrip(user, place, status, newTripId, oldTripId) {
    newTripId = newTripId || null;
    oldTripId = oldTripId || null;
    await setDoc(doc(db, 'users', user.uid, 'places', safeId(place.id)), { tripId: newTripId, updatedAt: now() }, { merge: true });
    if (oldTripId && oldTripId !== newTripId) {
      const s = await getDocs(query(collection(db, 'trips', oldTripId, 'stops'), where('byUid', '==', user.uid)));
      await Promise.all(s.docs.filter((d) => d.data().place?.id === place.id && !d.data().memoryId).map((d) => deleteDoc(d.ref)));
    }
    if (newTripId && newTripId !== oldTripId) await this.ensureStop(user, newTripId, place, status === 'wishlist' ? 'wishlist' : 'place');
  },
  /** Thêm điểm dừng vào chuyến nếu người này chưa thêm địa điểm đó */
  async ensureStop(user, tripId, place, kind) {
    const s = await getDocs(query(collection(db, 'trips', tripId, 'stops'), where('byUid', '==', user.uid)));
    if (!s.docs.some((d) => d.data().place?.id === place.id)) await this.addStop(user, tripId, { place, kind });
  },
  addStop(user, tripId, { place, kind, photos = [], caption = '', memoryId = null }) {
    return addDoc(collection(db, 'trips', tripId, 'stops'), {
      place: pickPlace(place), kind, photos, caption, memoryId, byUid: user.uid, byName: user.name, byPhoto: user.photo || '', createdAt: serverTimestamp(),
    });
  },
};

/* ------------------------------------------------------------------ */
/* Local demo backend (localStorage)                                  */
/* ------------------------------------------------------------------ */
const KEY = 'travel-map-demo-v1';
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
};
let state = load() || { user: null, places: {}, memories: [], trips: [], stops: {} };
const listeners = new Set();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('localStorage đầy — ảnh demo có thể không được lưu lâu dài', e);
  }
  listeners.forEach((l) => l());
};
const sub = (fn) => {
  fn();
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const uid = () => Math.random().toString(36).slice(2, 11);

const localBackend = {
  mode: 'demo',
  onAuth(cb) {
    return sub(() => cb(state.user));
  },
  async signIn() {
    state.user = { uid: 'demo-user', name: 'Bạn (demo)', photo: '', email: 'demo@local' };
    save();
  },
  async signOut() {
    state.user = null;
    save();
  },
  watchPlaces(u, cb) {
    return sub(() => cb(Object.values(state.places[u] || {})));
  },
  async setPlace(user, place, status, tripId, visitedAt = null, occasion = '') {
    const m = (state.places[user.uid] ||= {});
    const visited = status === 'visited';
    if (!status) delete m[place.id];
    else m[place.id] = { ...pickPlace(place), status, tripId: tripId || null, visitedAt: visited ? visitedAt || null : null, occasion: visited ? occasion || '' : '', updatedAt: now() };
    if (status && tripId && !(state.stops[tripId] || []).some((x) => x.byUid === user.uid && x.place?.id === place.id))
      this.addStop(user, tripId, { place, kind: visited ? 'place' : 'wishlist' });
    save();
  },
  watchMyMemories(u, cb) {
    return sub(() => cb(state.memories.filter((m) => m.uid === u).sort(byNewest)));
  },
  watchPublicMemories(cb) {
    return sub(() => cb([...SAMPLE_PUBLIC, ...state.memories.filter((m) => m.visibility === 'public')].sort(byNewest)));
  },
  async addMemory(user, { place, caption, date, visibility, tripId }, files) {
    const photos = [];
    for (const f of files) photos.push(await blobToDataURL(await compressImage(f, 1000, 0.75)));
    const mem = {
      id: uid(), uid: user.uid, authorName: user.name, authorPhoto: user.photo || '', place: pickPlace(place), caption, date,
      visibility, tripId: tripId || null, photos, createdAt: now(),
    };
    state.memories.push(mem);
    const prev = (state.places[user.uid] ||= {})[place.id] || {};
    state.places[user.uid][place.id] = { ...prev, ...pickPlace(place), status: 'visited', tripId: tripId || null, visitedAt: date || null, updatedAt: now() };
    if (tripId) this.addStop(user, tripId, { place, kind: 'memory', photos, caption });
    save();
    return mem;
  },
  async getFullPhotos(mem) {
    return mem.photos || [];
  },
  async updateMemory(id, patch) {
    state.memories = state.memories.map((m) => (m.id === id ? { ...m, ...patch } : m));
    save();
  },
  async deleteMemory(mem) {
    state.memories = state.memories.filter((m) => m.id !== mem.id);
    save();
  },
  watchTrips(u, cb) {
    return sub(() => cb(state.trips.filter((t) => t.memberIds.includes(u)).sort(byNewest)));
  },
  async createTrip(user, { name, emoji }) {
    const t = {
      id: uid(), name, emoji: emoji || '🧳', ownerId: user.uid, memberIds: [user.uid],
      members: { [user.uid]: { name: user.name, photo: user.photo } }, inviteCode: makeInviteCode(), createdAt: now(),
    };
    state.trips.push(t);
    save();
    return t;
  },
  async updateTrip(id, patch) {
    const t = state.trips.find((x) => x.id === id);
    if (t) Object.assign(t, patch, { updatedAt: now() });
    save();
  },
  async joinTrip(user, code) {
    const t = state.trips.find((x) => x.inviteCode === code.trim().toUpperCase());
    if (!t) throw new Error(translate('err.demoJoin'));
    if (!t.memberIds.includes(user.uid)) t.memberIds.push(user.uid);
    t.members[user.uid] = { name: user.name, photo: user.photo };
    save();
    return t;
  },
  async leaveTrip(user, trip) {
    state.trips = state.trips.filter((t) => t.id !== trip.id);
    save();
  },
  watchStops(tripId, cb) {
    return sub(() => cb((state.stops[tripId] || []).map((s) => ({ ...s, tripId })).sort(byNewest)));
  },
  watchPlan(tripId, cb) {
    return sub(() => cb(((state.plan ||= {})[tripId] || []).map((x) => ({ ...x, tripId })).sort(byPlanOrder)));
  },
  async addPlanItem(user, tripId, { place, date = '', time = '', note = '', order }) {
    ((state.plan ||= {})[tripId] ||= []).push({
      id: uid(), place: pickPlace(place), date, time, note, order: order ?? now(), done: false, doneBy: null, doneAt: null, addedBy: user.uid, addedByName: user.name, createdAt: now(),
    });
    save();
  },
  async updatePlanItem(tripId, id, patch) {
    const it = ((state.plan ||= {})[tripId] || []).find((x) => x.id === id);
    if (it) Object.assign(it, patch);
    save();
  },
  async deletePlanItem(tripId, id) {
    state.plan[tripId] = (state.plan?.[tripId] || []).filter((x) => x.id !== id);
    save();
  },
  async reorderPlan(tripId, list) {
    list.forEach(({ id, order }) => {
      const it = (state.plan?.[tripId] || []).find((x) => x.id === id);
      if (it) it.order = order;
    });
    save();
  },
  watchChecklists(tripId, cb) {
    return sub(() => cb(((state.checklists ||= {})[tripId] || []).map((x) => ({ ...x, tripId }))));
  },
  async addChecklist(user, tripId, { title, phase, scope, items }) {
    ((state.checklists ||= {})[tripId] ||= []).push({
      id: uid(), title, phase, scope, ownerUid: scope === 'personal' ? user.uid : null, items, createdBy: user.uid, createdByName: user.name, createdAt: now(),
    });
    save();
  },
  async updateChecklist(tripId, id, patch) {
    const c = (state.checklists?.[tripId] || []).find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    save();
  },
  async deleteChecklist(tripId, id) {
    state.checklists[tripId] = (state.checklists?.[tripId] || []).filter((x) => x.id !== id);
    save();
  },
  async setPlaceTrip(user, place, status, newTripId, oldTripId) {
    const m = (state.places[user.uid] ||= {});
    if (m[place.id]) m[place.id] = { ...m[place.id], tripId: newTripId || null, updatedAt: now() };
    if (oldTripId && oldTripId !== newTripId)
      state.stops[oldTripId] = (state.stops[oldTripId] || []).filter((s) => !(s.byUid === user.uid && s.place?.id === place.id && !s.memoryId));
    if (newTripId && newTripId !== oldTripId && !(state.stops[newTripId] || []).some((s) => s.byUid === user.uid && s.place?.id === place.id))
      this.addStop(user, newTripId, { place, kind: status === 'wishlist' ? 'wishlist' : 'place' });
    save();
  },
  addStop(user, tripId, { place, kind, photos = [], caption = '' }) {
    (state.stops[tripId] ||= []).push({
      id: uid(), place: pickPlace(place), kind, photos, caption, byUid: user.uid, byName: user.name, byPhoto: user.photo || '', createdAt: now(),
    });
    save();
  },
};

// Vài kỉ niệm mẫu để trang "Khám phá" không trống ở chế độ demo
const img = (seed) => `https://picsum.photos/seed/${seed}/800/1000`;
const SAMPLE_PUBLIC = [
  { id: 's1', uid: 'sample', authorName: 'Linh 🌸', place: { id: 'vn-hoian', name: 'Phố cổ Hội An', city: 'Quảng Nam', country: 'VN', lat: 15.8801, lng: 108.338 }, caption: 'Đèn lồng đẹp xỉu, nhớ đi tối 14 âm lịch nha!', photos: [img('hoian1'), img('hoian2')], visibility: 'public', createdAt: now() - 864e5 },
  { id: 's2', uid: 'sample', authorName: 'Minh 🏍️', place: { id: 'vn-hagiang', name: 'Mã Pí Lèng', city: 'Hà Giang', country: 'VN', lat: 23.2441, lng: 105.4129 }, caption: 'Đi tháng 10 mùa tam giác mạch, lạnh nhưng đáng.', photos: [img('hagiang')], visibility: 'public', createdAt: now() - 2 * 864e5 },
  { id: 's3', uid: 'sample', authorName: 'Trang ✈️', place: { id: 'jp-fushimi', name: 'Fushimi Inari', city: 'Kyoto', country: 'JP', lat: 34.9671, lng: 135.7727 }, caption: 'Tới lúc 7h sáng là vắng nhất, chụp hình thoải mái.', photos: [img('kyoto1'), img('kyoto2'), img('kyoto3')], visibility: 'public', createdAt: now() - 3 * 864e5 },
  { id: 's4', uid: 'sample', authorName: 'Huy 📷', place: { id: 'kr-gamcheon', name: 'Làng văn hóa Gamcheon', city: 'Busan', country: 'KR', lat: 35.0975, lng: 129.0106 }, caption: 'Nhớ mua bản đồ tem để sưu tầm dấu mộc!', photos: [img('busan')], visibility: 'public', createdAt: now() - 5 * 864e5 },
  { id: 's5', uid: 'sample', authorName: 'An 🍋', place: { id: 'it-amalfi', name: 'Positano', city: 'Amalfi', country: 'IT', lat: 40.628, lng: 14.485 }, caption: 'Đi phà từ Amalfi sang để có góc chụp đẹp nhất.', photos: [img('positano1'), img('positano2')], visibility: 'public', createdAt: now() - 7 * 864e5 },
];

export const api = firebaseEnabled ? firebaseBackend : localBackend;
