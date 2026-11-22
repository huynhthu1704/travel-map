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
 *  trips/{id}/costs/{id}         { type:'estimate'|'actual'|'payment',title,amount,per?:'group'|'person',paidBy?,splitAmong?[uid],planItemId?,date?,note?,createdBy,createdAt }
 *  trips/{id}/checklists/{id}    { title,phase:'before'|'return',scope:'shared'|'personal',ownerUid?,items[{id,text,done,doneBy}],createdBy,createdAt }
 */
import {
  collection, doc, getDoc, setDoc, deleteDoc, addDoc, updateDoc, onSnapshot, query, where, getDocs, limit,
  serverTimestamp, arrayUnion, arrayRemove, deleteField, writeBatch, terminate, clearIndexedDbPersistence,
} from 'firebase/firestore';
import { signInWithPopup, signInWithRedirect, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseEnabled, auth, db, googleProvider } from './firebase';
import { compressImage, compressToDataURL, blobToDataURL } from './image';
import { translate } from '../i18n';
import { recordDownload } from './network';
import { FAMOUS_BY_ID } from '../data/places';

const thumbCache = new Map(); // id kỉ niệm → ảnh thu nhỏ đã tải

const now = () => Date.now();
const toMillis = (v) => (v?.toMillis ? v.toMillis() : v || 0);
const byNewest = (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt);
// Chuyến đi: ngày bắt đầu gần nhất lên trước, cũ hơn ở sau (chưa có ngày thì dùng ngày tạo chuyến)
const tripKey = (t) => t.startDate || new Date(toMillis(t.createdAt) || 0).toISOString().slice(0, 10);
const byTripStart = (a, b) => tripKey(b).localeCompare(tripKey(a)) || toMillis(b.createdAt) - toMillis(a.createdAt);
// Kế hoạch: theo ngày dự định (mục chưa có ngày để cuối), trong ngày theo giờ sớm → muộn
// (mục chưa có giờ để sau), cuối cùng theo thứ tự người dùng tự sắp
const byPlanOrder = (a, b) =>
  (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99:99').localeCompare(b.time || '99:99') || (a.order ?? 0) - (b.order ?? 0);
const safeId = (s) => String(s).replace(/[^\w-]/g, '_').slice(0, 120);
/** Mã mời 8 kí tự, sinh ngẫu nhiên an toàn (bỏ các kí tự dễ nhầm 0/O, 1/I) */
export const makeInviteCode = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = new Uint32Array(8);
  crypto.getRandomValues(r);
  return [...r].map((x) => abc[x % abc.length]).join('');
};
/** Xoá dữ liệu cá nhân lưu trong trình duyệt (giữ lại cài đặt giao diện như ngôn ngữ, vị trí nút) */
export function clearLocalPersonalData() {
  ['travel-map-home', 'travel-map-home-tab'].forEach((k) => localStorage.removeItem(k));
  ['travel-map-ann'].forEach((k) => sessionStorage.removeItem(k));
}
const inviteId = (tripId, uid) => `${tripId}_${uid}`;
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
  watchProfile(uid, cb) {
    return onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null));
  },
  /** Đổi tên hiển thị (rỗng = dùng lại tên Google) và cập nhật tên ở kỉ niệm, chuyến đi đã có */
  async setDisplayName(user, name) {
    const clean = (name || '').trim().slice(0, 40);
    await setDoc(doc(db, 'users', user.uid), { displayName: clean || null, updatedAt: now() }, { merge: true });
    const shown = clean || user.googleName || user.name;
    const [mem, tr] = await Promise.all([
      getDocs(query(collection(db, 'memories'), where('uid', '==', user.uid))),
      getDocs(query(collection(db, 'trips'), where('memberIds', 'array-contains', user.uid))),
    ]);
    const ops = [
      ...mem.docs.map((d) => [d.ref, { authorName: shown }]),
      ...tr.docs.map((d) => [d.ref, { [`members.${user.uid}.name`]: shown }]),
    ];
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(([ref, patch]) => b.update(ref, patch));
      await b.commit();
    }
  },
  /** Đổi ảnh đại diện (null = dùng lại ảnh Google) và cập nhật ảnh ở kỉ niệm, chuyến đi đã có */
  async setProfilePhoto(user, photo) {
    await setDoc(doc(db, 'users', user.uid), { photo: photo || null, updatedAt: now() }, { merge: true });
    const shown = photo || user.googlePhoto || '';
    const [mem, tr] = await Promise.all([
      getDocs(query(collection(db, 'memories'), where('uid', '==', user.uid))),
      getDocs(query(collection(db, 'trips'), where('memberIds', 'array-contains', user.uid))),
    ]);
    const ops = [
      ...mem.docs.map((d) => [d.ref, { authorPhoto: shown }]),
      ...tr.docs.map((d) => [d.ref, { [`members.${user.uid}.photo`]: shown }]),
    ];
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(([ref, patch]) => b.update(ref, patch));
      await b.commit();
    }
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
  /** Đăng xuất + xoá dữ liệu đã lưu trên máy (bộ nhớ đệm Firestore, quốc gia nhà…) rồi tải lại trang.
   *  Tránh người dùng sau trên cùng máy (máy dùng chung) xem được dữ liệu cũ khi offline. */
  async signOut() {
    await fbSignOut(auth);
    clearLocalPersonalData();
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch {
      /* tab khác đang mở — bộ nhớ đệm vẫn bị Firestore xoá ở lần sau */
    }
    location.reload();
  },

  watchPlaces(uid, cb) {
    return onSnapshot(collection(db, 'users', uid, 'places'), (s) => cb(s.docs.map((d) => d.data())));
  },
  /** Chỉ đổi ngày đến của 1 địa điểm đã lưu */
  setVisitedAt: (user, placeId, visitedAt) => setDoc(doc(db, 'users', user.uid, 'places', safeId(placeId)), { visitedAt: visitedAt || null, updatedAt: now() }, { merge: true }),
  /** visitedAt: ngày đã đến ('YYYY-MM-DD'); occasion: đến vì dịp gì — cả hai tuỳ chọn */
  async setPlace(user, place, status, tripId, visitedAt = null, occasion = '') {
    const r = doc(db, 'users', user.uid, 'places', safeId(place.id));
    if (!status) return deleteDoc(r);
    const visited = status === 'visited';
    await setDoc(r, {
      ...pickPlace(place), status, tripId: tripId || null,
      visitedAt: visited ? visitedAt || null : null, occasion: visited ? occasion || '' : '', updatedAt: now(),
    });
    if (tripId && status) await this.ensureStop(user, tripId, place, visited ? 'place' : 'wishlist', visitedAt);
  },

  watchMyMemories(uid, cb) {
    return onSnapshot(query(collection(db, 'memories'), where('uid', '==', uid)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
    );
  },
  watchPublicMemories(cb) {
    return onSnapshot(query(collection(db, 'memories'), where('visibility', '==', 'public'), limit(120)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
    );
  },
  async addMemory(user, { place, caption, date, visibility, tripId, occasion = '', visitedAt, hideDate = false }, files = []) {
    const memRef = doc(collection(db, 'memories'));
    // Lưu 3 độ phân giải: thu nhỏ (lưới ảnh, ~40KB), vừa (~1000px, mạng chậm), gốc (~1600px, mạng nhanh / chia sẻ)
    const thumbs = [];
    const mid = [];
    const full = [];
    for (const f of files) {
      thumbs.push(await compressToDataURL(f, 400, 0.72, 45_000));
      mid.push(await compressToDataURL(f, 1000, 0.78, 220_000));
      full.push(await compressToDataURL(f, 1600, 0.84, 750_000));
    }
    const data = {
      uid: user.uid, authorName: user.name, authorPhoto: user.photo || '', place: pickPlace(place), caption: caption || '',
      // Chỉ giữ ảnh bìa trong document để danh sách tải nhẹ; các ảnh thu nhỏ khác nằm ở memories/{id}/thumbs
      date: date || '', occasion: occasion || '', visibility: thumbs.length ? visibility : 'private', tripId: tripId || null, photos: thumbs.slice(0, 1), photoCount: full.length, tiers: 3, thumbsMoved: true, ...(hideDate ? { hideDate: true } : {}), createdAt: now(),
    };
    await setDoc(memRef, data);
    // Mỗi ảnh là 1 document riêng (giới hạn 1MB/document của Firestore)
    for (let i = 0; i < thumbs.length; i++) await setDoc(doc(db, 'memories', memRef.id, 'thumbs', String(i)), { data: thumbs[i], uid: user.uid, i });
    for (let i = 0; i < full.length; i++) {
      await setDoc(doc(db, 'memories', memRef.id, 'full', String(i)), { data: full[i], uid: user.uid, i });
      await setDoc(doc(db, 'memories', memRef.id, 'mid', String(i)), { data: mid[i], uid: user.uid, i });
    }
    // Đặt chân tới đây = đánh dấu "đã đến"
    await setDoc(
      doc(db, 'users', user.uid, 'places', safeId(place.id)),
      // visitedAt = lần check-in gần nhất (người gọi truyền vào nếu biết); giữ chuyến đi đã gắn nếu lần này không chọn
      { ...pickPlace(place), status: 'visited', ...(tripId ? { tripId } : {}), visitedAt: visitedAt ?? (date || null), updatedAt: now() },
      { merge: true }, // giữ lại "dịp" đã ghi trước đó
    );
    if (tripId) await this.addStop(user, tripId, { place, kind: 'memory', photos: thumbs, caption, memoryId: memRef.id, date });
    return { id: memRef.id, ...data, allThumbs: thumbs, fullPhotos: full };
  },
  /** Lấy ảnh độ phân giải đầy đủ (fallback: ảnh thu nhỏ) — dùng cho chia sẻ / xuất video */
  getFullPhotos(mem) {
    return this.getPhotos(mem, 'high');
  },
  /**
   * Lấy ảnh theo chất lượng: 'low' = ảnh thu nhỏ (không tải thêm), 'medium' = ảnh vừa, 'high' = ảnh gốc.
   * Kỉ niệm cũ chưa có ảnh vừa thì dùng ảnh gốc. Đo thời gian tải để biết tốc độ mạng.
   */
  async getPhotos(mem, quality = 'high') {
    if (quality === 'high' && mem.fullPhotos) return mem.fullPhotos;
    const id = mem.memoryId || mem.id;
    if (quality === 'low') return this.getThumbs(mem);
    if (!id || (!mem.photoCount && !mem.memoryId)) return mem.photos || [];
    const tier = quality === 'medium' && (mem.tiers >= 3 || mem.memoryId) ? 'mid' : 'full';
    const t0 = performance.now();
    try {
      let snap = await getDocs(collection(db, 'memories', id, tier));
      if (snap.empty && tier === 'mid') snap = await getDocs(collection(db, 'memories', id, 'full'));
      const list = snap.docs.map((d) => d.data()).sort((a, b) => a.i - b.i).map((d) => d.data);
      recordDownload(list.reduce((n, s) => n + s.length * 0.75, 0), performance.now() - t0);
      return list.length ? list : mem.photos || [];
    } catch {
      return mem.photos || [];
    }
  },
  /** Tất cả ảnh thu nhỏ của 1 kỉ niệm: document chỉ giữ ảnh bìa, phần còn lại tải khi cần (có bộ nhớ đệm) */
  async getThumbs(mem) {
    const have = mem.allThumbs || mem.photos || [];
    const id = mem.memoryId || mem.id;
    if (!id || !(mem.photoCount > have.length)) return have;
    if (thumbCache.has(id)) return thumbCache.get(id);
    try {
      const snap = await getDocs(collection(db, 'memories', id, 'thumbs'));
      const list = snap.docs.map((d) => d.data()).sort((a, b) => a.i - b.i).map((d) => d.data);
      if (list.length) thumbCache.set(id, list);
      return list.length ? list : have;
    } catch {
      return have;
    }
  },
  /**
   * Chuyển kỉ niệm cũ (lưu mọi ảnh thu nhỏ ngay trong document) sang dạng nhẹ: chỉ giữ ảnh bìa,
   * ảnh còn lại vào memories/{id}/thumbs. Chạy nền cho kỉ niệm của chính người dùng, từng cái một.
   */
  async slimMemories(user, list) {
    for (const m of list) {
      if (m.uid !== user.uid || m.thumbsMoved || (m.photos?.length || 0) < 2) continue;
      try {
        for (let i = 0; i < m.photos.length; i++) await setDoc(doc(db, 'memories', m.id, 'thumbs', String(i)), { data: m.photos[i], uid: user.uid, i });
        thumbCache.set(m.id, m.photos);
        await updateDoc(doc(db, 'memories', m.id), { photos: m.photos.slice(0, 1), photoCount: Math.max(m.photoCount || 0, m.photos.length), thumbsMoved: true });
      } catch {
        return; // thử lại lần sau
      }
    }
  },
  updateMemory: (id, patch) => updateDoc(doc(db, 'memories', id), patch),
  /**
   * Sửa ảnh của 1 kỉ niệm: keep = vị trí các ảnh cũ giữ lại (theo thứ tự), files = ảnh mới thêm vào cuối.
   * Ghi lại cả 3 độ phân giải (thu nhỏ / vừa / gốc) và cập nhật ảnh trong hành trình chuyến đi.
   */
  async updateMemoryPhotos(user, mem, { keep = [], files = [] }) {
    const id = mem.id;
    const read = async (tier) => {
      const s = await getDocs(collection(db, 'memories', id, tier));
      return { refs: s.docs.map((d) => d.ref), list: s.docs.map((d) => d.data()).sort((a, b) => a.i - b.i).map((d) => d.data) };
    };
    const [T, M, F] = await Promise.all([read('thumbs'), read('mid'), read('full')]);
    const thumbsOld = T.list.length ? T.list : mem.photos || [];
    const fullOld = F.list.length ? F.list : thumbsOld;
    const midOld = M.list.length ? M.list : fullOld;
    const thumbs = keep.map((i) => thumbsOld[i]).filter(Boolean);
    const mid = keep.map((i) => midOld[i] || fullOld[i] || thumbsOld[i]);
    const full = keep.map((i) => fullOld[i] || thumbsOld[i]);
    for (const f of files) {
      thumbs.push(await compressToDataURL(f, 400, 0.72, 45_000));
      mid.push(await compressToDataURL(f, 1000, 0.78, 220_000));
      full.push(await compressToDataURL(f, 1600, 0.84, 750_000));
    }
    const n = thumbs.length;
    const write = async (tier, list, old) => {
      for (let i = 0; i < n; i++) await setDoc(doc(db, 'memories', id, tier, String(i)), { data: list[i], uid: user.uid, i });
      for (const ref of old.refs) if (Number(ref.id) >= n) await deleteDoc(ref);
    };
    await write('thumbs', thumbs, T);
    await write('mid', mid, M);
    await write('full', full, F);
    thumbCache.set(id, thumbs);
    const patch = { photos: thumbs.slice(0, 1), photoCount: n, tiers: 3, thumbsMoved: true, ...(n ? {} : { visibility: 'private' }) };
    await updateDoc(doc(db, 'memories', id), patch);
    // Hành trình chuyến đi lưu sẵn ảnh thu nhỏ → thay bằng bộ ảnh mới
    if (mem.tripId) {
      try {
        const s = await getDocs(query(collection(db, 'trips', mem.tripId, 'stops'), where('memoryId', '==', id)));
        for (const d of s.docs) if (d.data().byUid === user.uid) await deleteDoc(d.ref);
        await addDoc(collection(db, 'trips', mem.tripId, 'stops'), {
          place: pickPlace(mem.place), kind: 'memory', photos: thumbs, caption: mem.caption || '', memoryId: id, byUid: user.uid, byName: user.name, byPhoto: user.photo || '', createdAt: serverTimestamp(),
        });
      } catch {
        /* không phải thành viên nữa: bỏ qua */
      }
    }
    return { ...patch, allThumbs: thumbs };
  },
  async deleteMemory(mem) {
    const [snap, midSnap, thumbSnap] = await Promise.all([
      getDocs(collection(db, 'memories', mem.id, 'full')),
      getDocs(collection(db, 'memories', mem.id, 'mid')),
      getDocs(collection(db, 'memories', mem.id, 'thumbs')),
    ]);
    const b = writeBatch(db);
    snap.docs.forEach((d) => b.delete(d.ref));
    midSnap.docs.forEach((d) => b.delete(d.ref));
    thumbSnap.docs.forEach((d) => b.delete(d.ref));
    b.delete(doc(db, 'memories', mem.id));
    await b.commit();
  },
  /** Xoá điểm dừng trong chuyến đi được tạo từ lần check-in này */
  async deleteStopsOfMemory(user, mem) {
    if (!mem.tripId) return;
    try {
      const s = await getDocs(query(collection(db, 'trips', mem.tripId, 'stops'), where('memoryId', '==', mem.id), where('byUid', '==', user.uid)));
      await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
    } catch {
      /* không còn là thành viên chuyến: bỏ qua */
    }
  },

  /** REQ-007: xem 1 chuyến đi theo id (chuyến bật "ai có link đều xem được" hoặc mình là thành viên); không xem được → null */
  watchTrip(id, cb) {
    return onSnapshot(
      doc(db, 'trips', id),
      (d) => cb(d.exists() ? { id: d.id, ...d.data() } : null),
      () => cb(null),
    );
  },
  watchTrips(uid, cb) {
    return onSnapshot(query(collection(db, 'trips'), where('memberIds', 'array-contains', uid)), (s) =>
      cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTripStart)),
    );
  },
  async createTrip(user, { name, emoji, destinations = [], kind = 'domestic', startDate = null, endDate = null, currency = null, rates = null }) {
    const data = {
      name, emoji: emoji || '🧳', destinations, kind, startDate, endDate, ...(currency ? { currency } : {}), ...(rates && Object.keys(rates).length ? { rates } : {}), ownerId: user.uid, memberIds: [user.uid],
      members: { [user.uid]: { name: user.name, photo: user.photo || '' } }, inviteCode: makeInviteCode(), createdAt: now(),
    };
    const r = await addDoc(collection(db, 'trips'), data);
    await setDoc(doc(db, 'inviteCodes', data.inviteCode), { tripId: r.id, ownerId: user.uid, createdAt: now() }).catch(() => {});
    return { id: r.id, ...data };
  },
  /** Chủ chuyến: đảm bảo mã mời có trong bảng tra mã (chuyến tạo trước khi có bảng này) */
  async ensureInviteCode(user, trip) {
    if (!trip?.inviteCode || trip.ownerId !== user.uid) return;
    try {
      const s = await getDoc(doc(db, 'inviteCodes', trip.inviteCode));
      if (!s.exists()) await setDoc(doc(db, 'inviteCodes', trip.inviteCode), { tripId: trip.id, ownerId: user.uid, createdAt: now() });
    } catch {
      /* bỏ qua */
    }
  },
  /** Chủ chuyến: đổi mã mời mới (mã cũ hết hiệu lực) */
  async regenerateInviteCode(user, trip) {
    const code = makeInviteCode();
    await setDoc(doc(db, 'inviteCodes', code), { tripId: trip.id, ownerId: user.uid, createdAt: now() });
    await updateDoc(doc(db, 'trips', trip.id), { inviteCode: code, updatedAt: now() });
    if (trip.inviteCode) await deleteDoc(doc(db, 'inviteCodes', trip.inviteCode)).catch(() => {});
    return code;
  },

  // ---- Lời mời tham gia chuyến đi: tripInvites/{tripId}_{uid} ----
  async inviteToTrip(owner, trip, person) {
    const ref = doc(db, 'tripInvites', inviteId(trip.id, person.uid));
    const data = {
      tripId: trip.id, tripName: trip.name || '', tripEmoji: trip.emoji || '🧳', startDate: trip.startDate || null, endDate: trip.endDate || null,
      from: owner.uid, fromName: owner.name || '', fromPhoto: owner.photo || '',
      to: person.uid, toName: person.name || '', toPhoto: person.photo || '',
      status: 'pending', createdAt: now(), respondedAt: null,
    };
    await setDoc(ref, data);
    await addDoc(collection(db, 'notifications'), {
      to: person.uid, type: 'invite', from: owner.uid, fromName: owner.name || '', fromPhoto: owner.photo || '',
      title: trip.name || '', tripId: trip.id, read: false, createdAt: now(),
    }).catch(() => {});
    return data;
  },
  watchTripInvites(trip, ownerUid, cb) {
    return onSnapshot(
      query(collection(db, 'tripInvites'), where('from', '==', ownerUid), where('tripId', '==', trip.id)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)),
      () => cb([]),
    );
  },
  watchMyInvites(uid, cb) {
    return onSnapshot(
      query(collection(db, 'tripInvites'), where('to', '==', uid), where('status', '==', 'pending')),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)),
      () => cb([]),
    );
  },
  cancelInvite: (inv) => updateDoc(doc(db, 'tripInvites', inv.id), { status: 'cancelled', respondedAt: now() }),
  /** Người được mời trả lời: chấp nhận = vào chuyến (cùng 1 lần ghi), từ chối = chỉ đổi trạng thái */
  async respondInvite(user, inv, accept) {
    const b = writeBatch(db);
    b.update(doc(db, 'tripInvites', inv.id), { status: accept ? 'accepted' : 'declined', respondedAt: now() });
    if (accept) {
      b.update(doc(db, 'trips', inv.tripId), {
        memberIds: arrayUnion(user.uid), [`members.${user.uid}`]: { name: user.name || '', photo: user.photo || '' }, joinCode: '',
      });
    }
    try {
      await b.commit();
    } catch (e) {
      // Đã vào chuyến trước đó (vd. bằng mã mời) → chỉ cập nhật trạng thái lời mời
      const t = accept ? await getDoc(doc(db, 'trips', inv.tripId)).catch(() => null) : null;
      if (!t?.exists()) throw e;
      await updateDoc(doc(db, 'tripInvites', inv.id), { status: 'accepted', respondedAt: now() });
    }
    await addDoc(collection(db, 'notifications'), {
      to: inv.from, type: accept ? 'inviteAccepted' : 'inviteDeclined', from: user.uid, fromName: user.name || '', fromPhoto: user.photo || '',
      title: inv.tripName || '', tripId: inv.tripId, read: false, createdAt: now(),
    }).catch(() => {});
  },
  async removeMember(trip, uid) {
    await updateDoc(doc(db, 'trips', trip.id), { memberIds: arrayRemove(uid), [`members.${uid}`]: deleteField() });
  },
  updateTrip(id, patch) {
    return updateDoc(doc(db, 'trips', id), { ...patch, updatedAt: now() });
  },
  async joinTrip(user, code) {
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,8}$/.test(c)) throw new Error(translate('err.tripNotFound'));
    // Tra mã trong bảng mã mời (không đọc được danh sách chuyến đi của người khác)
    const cs = await getDoc(doc(db, 'inviteCodes', c));
    if (!cs.exists()) throw new Error(translate('err.tripNotFound'));
    const tripId = cs.data().tripId;
    try {
      await updateDoc(doc(db, 'trips', tripId), { memberIds: arrayUnion(user.uid), [`members.${user.uid}`]: { name: user.name || '', photo: user.photo || '' }, joinCode: c });
    } catch {
      /* đã là thành viên (hoặc mã vừa bị đổi) — kiểm tra bên dưới */
    }
    const t = await getDoc(doc(db, 'trips', tripId)).catch(() => null);
    if (!t?.exists()) throw new Error(translate('err.tripNotFound'));
    return { id: tripId, ...t.data() };
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
    return onSnapshot(collection(db, 'trips', tripId, 'plan'), (s) => cb(s.docs.map((d) => ({ id: d.id, tripId, ...d.data() })).filter((x) => !x.removed).sort(byPlanOrder)));
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
  /**
   * Xoá khỏi kế hoạch. Giữ lại một "dấu đã xoá" (removed) thay vì xoá hẳn, để bước đồng bộ từ Hành trình
   * (địa điểm đã check-in trong chuyến) không tự thêm lại mục người dùng vừa xoá.
   */
  deletePlanItem(tripId, id) {
    return updateDoc(doc(db, 'trips', tripId, 'plan', id), { removed: true, removedAt: now() });
  },
  /** Ghi lại thứ tự mới: [{id, order}] */
  async reorderPlan(tripId, list) {
    const b = writeBatch(db);
    list.forEach(({ id, order }) => b.update(doc(db, 'trips', tripId, 'plan', id), { order }));
    await b.commit();
  },
  // ---- Chi phí: trips/{id}/costs/{costId} ----
  /** REQ-008: ghi thứ tự mới của nhiều khoản chi trong 1 lần (không bị nhảy qua lại giữa chừng) */
  async reorderCosts(tripId, list) {
    if (!list.length) return;
    const b = writeBatch(db);
    list.forEach(({ id, order }) => b.update(doc(db, 'trips', tripId, 'costs', id), { order }));
    await b.commit();
  },
  watchCosts(tripId, cb) {
    return onSnapshot(collection(db, 'trips', tripId, 'costs'), (s) => cb(s.docs.map((d) => ({ id: d.id, tripId, ...d.data() })).sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt))));
  },
  addCost(user, tripId, data) {
    return addDoc(collection(db, 'trips', tripId, 'costs'), { ...data, createdBy: user.uid, createdByName: user.name, createdAt: now() });
  },
  updateCost(tripId, id, patch) {
    return updateDoc(doc(db, 'trips', tripId, 'costs', id), { ...patch, updatedAt: now() });
  },
  deleteCost(tripId, id) {
    return deleteDoc(doc(db, 'trips', tripId, 'costs', id));
  },
  // ---- Checklist: trips/{id}/checklists/{listId} ----
  /** Checklist chung của nhóm + checklist cá nhân của mình (2 truy vấn vì checklist cá nhân của người khác bị chặn đọc) */
  watchChecklists(tripId, cb, uid) {
    const col = collection(db, 'trips', tripId, 'checklists');
    let shared = [];
    let mine = [];
    const emit = () => cb([...shared, ...mine].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)));
    const map = (s) => s.docs.map((d) => ({ id: d.id, tripId, ...d.data() }));
    const u1 = onSnapshot(query(col, where('scope', '==', 'shared')), (s) => ((shared = map(s)), emit()), () => emit());
    // Người xem bằng link (không phải thành viên) không có checklist cá nhân
    const u2 = uid ? onSnapshot(query(col, where('ownerUid', '==', uid)), (s) => ((mine = map(s)), emit()), () => emit()) : () => {};
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
    if (newTripId && newTripId !== oldTripId) await this.ensureStop(user, newTripId, place, status === 'wishlist' ? 'wishlist' : 'place', place.visitedAt);
  },
  /** Thêm điểm dừng vào chuyến nếu người này chưa thêm địa điểm đó */
  async ensureStop(user, tripId, place, kind, date = '') {
    const s = await getDocs(query(collection(db, 'trips', tripId, 'stops'), where('byUid', '==', user.uid)));
    if (!s.docs.some((d) => d.data().place?.id === place.id)) await this.addStop(user, tripId, { place, kind, date });
    else await this.ensurePlanItem(user, tripId, place, { done: kind !== 'wishlist', date, revive: true });
  },
  async addStop(user, tripId, { place, kind, photos = [], caption = '', memoryId = null, date = '' }) {
    const r = await addDoc(collection(db, 'trips', tripId, 'stops'), {
      place: pickPlace(place), kind, photos, caption, memoryId, byUid: user.uid, byName: user.name, byPhoto: user.photo || '', createdAt: serverTimestamp(),
    });
    // Địa điểm trong hành trình cũng có trong kế hoạch (để lập kế hoạch / sắp xếp)
    await this.ensurePlanItem(user, tripId, place, { done: kind !== 'wishlist', date, revive: true }).catch(() => {});
    return r;
  },
  /** Thêm địa điểm vào kế hoạch nếu chưa có (id cố định theo địa điểm để không bị trùng khi nhiều người cùng thêm) */
  async ensurePlanItem(user, tripId, place, { done = false, date = '', revive = false } = {}) {
    const s = await getDocs(collection(db, 'trips', tripId, 'plan'));
    const same = s.docs.filter((d) => d.data().place?.id === place.id);
    if (same.some((d) => !d.data().removed)) return false;
    // Đã bị xoá khỏi kế hoạch: chỉ thêm lại khi người dùng vừa chủ động check-in / thêm vào chuyến
    if (same.length) {
      if (!revive) return false;
      await updateDoc(same[0].ref, { removed: false, removedAt: null, done, doneBy: done ? user.name : null, doneAt: done ? now() : null, ...(date ? { date } : {}) });
      return true;
    }
    await setDoc(doc(db, 'trips', tripId, 'plan', `j_${safeId(place.id)}`), {
      place: pickPlace(place), date: date || '', time: '', note: '', order: now(), done, doneBy: done ? user.name : null, doneAt: done ? now() : null,
      addedBy: user.uid, addedByName: user.name, createdAt: now(), fromJourney: true,
    });
    return true;
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
  watchProfile(uid, cb) {
    return sub(() => cb((state.profiles || {})[uid] || null));
  },
  async setDisplayName(user, name) {
    const clean = (name || '').trim().slice(0, 40);
    ((state.profiles ||= {})[user.uid] ||= {}).displayName = clean || null;
    const shown = clean || user.googleName || user.name;
    state.memories.forEach((m) => m.uid === user.uid && (m.authorName = shown));
    state.trips.forEach((t) => t.members?.[user.uid] && (t.members[user.uid].name = shown));
    save();
  },
  async setProfilePhoto(user, photo) {
    ((state.profiles ||= {})[user.uid] ||= {}).photo = photo || null;
    const shown = photo || user.googlePhoto || '';
    state.memories.forEach((m) => m.uid === user.uid && (m.authorPhoto = shown));
    state.trips.forEach((t) => t.members?.[user.uid] && (t.members[user.uid].photo = shown));
    save();
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
  async setVisitedAt(user, placeId, visitedAt) {
    const p = state.places[user.uid]?.[placeId];
    if (p) p.visitedAt = visitedAt || null;
    save();
  },
  async setPlace(user, place, status, tripId, visitedAt = null, occasion = '') {
    const m = (state.places[user.uid] ||= {});
    const visited = status === 'visited';
    if (!status) delete m[place.id];
    else m[place.id] = { ...pickPlace(place), status, tripId: tripId || null, visitedAt: visited ? visitedAt || null : null, occasion: visited ? occasion || '' : '', updatedAt: now() };
    if (status && tripId && !(state.stops[tripId] || []).some((x) => x.byUid === user.uid && x.place?.id === place.id))
      this.addStop(user, tripId, { place, kind: visited ? 'place' : 'wishlist', date: visitedAt });
    save();
  },
  watchMyMemories(u, cb) {
    return sub(() => cb(state.memories.filter((m) => m.uid === u).sort(byNewest)));
  },
  watchPublicMemories(cb) {
    return sub(() => cb([...SAMPLE_PUBLIC, ...state.memories.filter((m) => m.visibility === 'public')].sort(byNewest)));
  },
  async addMemory(user, { place, caption, date, visibility, tripId, occasion = '', visitedAt, hideDate = false }, files = []) {
    const photos = [];
    for (const f of files) photos.push(await blobToDataURL(await compressImage(f, 1000, 0.75)));
    const mem = {
      id: uid(), uid: user.uid, authorName: user.name, authorPhoto: user.photo || '', place: pickPlace(place), caption, date, occasion: occasion || '',
      visibility: photos.length ? visibility : 'private', tripId: tripId || null, photos, ...(hideDate ? { hideDate: true } : {}), createdAt: now(),
    };
    state.memories.push(mem);
    const prev = (state.places[user.uid] ||= {})[place.id] || {};
    state.places[user.uid][place.id] = { ...prev, ...pickPlace(place), status: 'visited', tripId: tripId || prev.tripId || null, visitedAt: visitedAt ?? (date || null), updatedAt: now() };
    if (tripId) this.addStop(user, tripId, { place, kind: 'memory', photos, caption, date });
    save();
    return mem;
  },
  async markHideDates(uid, on) {
    state.memories.forEach((m) => m.uid === uid && (m.hideDate = !!on));
    save();
  },
  async getFullPhotos(mem) {
    return mem.photos || [];
  },
  async getPhotos(mem) {
    return mem.photos || [];
  },
  async getThumbs(mem) {
    return mem.photos || [];
  },
  async updateMemoryPhotos(user, mem, { keep = [], files = [] }) {
    const old = mem.photos || [];
    const added = await Promise.all(files.map((f) => compressToDataURL(f, 800, 0.8, 200_000)));
    const photos = [...keep.map((i) => old[i]).filter(Boolean), ...added];
    state.memories = state.memories.map((m) => (m.id === mem.id ? { ...m, photos, photoCount: photos.length, ...(photos.length ? {} : { visibility: 'private' }) } : m));
    save();
    return { photos, photoCount: photos.length };
  },
  async slimMemories() {},
  async updateMemory(id, patch) {
    state.memories = state.memories.map((m) => (m.id === id ? { ...m, ...patch } : m));
    save();
  },
  async deleteMemory(mem) {
    state.memories = state.memories.filter((m) => m.id !== mem.id);
    save();
  },
  async deleteStopsOfMemory(user, mem) {
    if (!mem.tripId || !state.stops[mem.tripId]) return;
    state.stops[mem.tripId] = state.stops[mem.tripId].filter((x) => !(x.memoryId === mem.id && x.byUid === user.uid));
    save();
  },
  watchTrip(id, cb) {
    return sub(() => {
      const t = state.trips.find((x) => x.id === id);
      cb(t && t.publicView ? t : null);
    });
  },
  watchTrips(u, cb) {
    return sub(() => cb(state.trips.filter((t) => t.memberIds.includes(u)).sort(byTripStart)));
  },
  async createTrip(user, { name, emoji, destinations = [], kind = 'domestic', startDate = null, endDate = null, currency = null, rates = null }) {
    const t = {
      id: uid(), name, emoji: emoji || '🧳', destinations, kind, startDate, endDate, ...(currency ? { currency } : {}), ...(rates && Object.keys(rates).length ? { rates } : {}), ownerId: user.uid, memberIds: [user.uid],
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
  async ensureInviteCode() {},
  async regenerateInviteCode(user, trip) {
    const t = state.trips.find((x) => x.id === trip.id);
    const code = makeInviteCode();
    if (t) t.inviteCode = code;
    save();
    return code;
  },
  async inviteToTrip(owner, trip, person) {
    state.invites ||= {};
    const id = inviteId(trip.id, person.uid);
    state.invites[id] = {
      id, tripId: trip.id, tripName: trip.name || '', tripEmoji: trip.emoji || '🧳', startDate: trip.startDate || null, endDate: trip.endDate || null,
      from: owner.uid, fromName: owner.name || '', fromPhoto: owner.photo || '', to: person.uid, toName: person.name || '', toPhoto: person.photo || '',
      status: 'pending', createdAt: now(), respondedAt: null,
    };
    save();
    return state.invites[id];
  },
  watchTripInvites(trip, ownerUid, cb) {
    return sub(() => cb(Object.values(state.invites || {}).filter((i) => i.tripId === trip.id && i.from === ownerUid).sort((a, b) => b.createdAt - a.createdAt)));
  },
  watchMyInvites(uid, cb) {
    return sub(() => cb(Object.values(state.invites || {}).filter((i) => i.to === uid && i.status === 'pending')));
  },
  async cancelInvite(inv) {
    if (state.invites?.[inv.id]) Object.assign(state.invites[inv.id], { status: 'cancelled', respondedAt: now() });
    save();
  },
  async respondInvite(user, inv, accept) {
    if (state.invites?.[inv.id]) Object.assign(state.invites[inv.id], { status: accept ? 'accepted' : 'declined', respondedAt: now() });
    const t = state.trips.find((x) => x.id === inv.tripId);
    if (accept && t && !t.memberIds.includes(user.uid)) {
      t.memberIds.push(user.uid);
      t.members[user.uid] = { name: user.name, photo: user.photo };
    }
    save();
  },
  async removeMember(trip, uid) {
    const t = state.trips.find((x) => x.id === trip.id);
    if (t) {
      t.memberIds = t.memberIds.filter((x) => x !== uid);
      delete t.members[uid];
    }
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
    if (trip.ownerId === user.uid) state.trips = state.trips.filter((t) => t.id !== trip.id);
    else {
      const t = state.trips.find((x) => x.id === trip.id);
      if (t) {
        t.memberIds = t.memberIds.filter((id) => id !== user.uid);
        delete t.members[user.uid];
      }
    }
    save();
  },
  watchStops(tripId, cb) {
    return sub(() => cb((state.stops[tripId] || []).map((s) => ({ ...s, tripId })).sort(byNewest)));
  },
  watchPlan(tripId, cb) {
    return sub(() => cb(((state.plan ||= {})[tripId] || []).filter((x) => !x.removed).map((x) => ({ ...x, tripId })).sort(byPlanOrder)));
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
    const it = (state.plan?.[tripId] || []).find((x) => x.id === id);
    if (it) Object.assign(it, { removed: true, removedAt: now() });
    save();
  },
  async reorderCosts(tripId, list) {
    list.forEach(({ id, order }) => {
      const it = (state.costs?.[tripId] || []).find((x) => x.id === id);
      if (it) it.order = order;
    });
    save();
  },
  async reorderPlan(tripId, list) {
    list.forEach(({ id, order }) => {
      const it = (state.plan?.[tripId] || []).find((x) => x.id === id);
      if (it) it.order = order;
    });
    save();
  },
  watchCosts(tripId, cb) {
    return sub(() => cb(((state.costs ||= {})[tripId] || []).map((x) => ({ ...x, tripId }))));
  },
  async addCost(user, tripId, data) {
    const id = uid();
    ((state.costs ||= {})[tripId] ||= []).push({ id, ...data, createdBy: user.uid, createdByName: user.name, createdAt: now() });
    save();
    return { id };
  },
  async updateCost(tripId, id, patch) {
    const c = (state.costs?.[tripId] || []).find((x) => x.id === id);
    if (c) Object.assign(c, patch, { updatedAt: now() });
    save();
  },
  async deleteCost(tripId, id) {
    state.costs[tripId] = (state.costs?.[tripId] || []).filter((x) => x.id !== id);
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
      this.addStop(user, newTripId, { place, kind: status === 'wishlist' ? 'wishlist' : 'place', date: place.visitedAt });
    save();
  },
  async ensurePlanItem(user, tripId, place, { done = false, date = '', revive = false } = {}) {
    const list = ((state.plan ||= {})[tripId] ||= []);
    const same = list.filter((x) => x.place?.id === place.id);
    if (same.some((x) => !x.removed)) return false;
    if (same.length) {
      if (!revive) return false;
      Object.assign(same[0], { removed: false, removedAt: null, done, doneBy: done ? user.name : null, doneAt: done ? now() : null, ...(date ? { date } : {}) });
      save();
      return true;
    }
    list.push({
      id: `j_${place.id}`, place: pickPlace(place), date: date || '', time: '', note: '', order: now(), done, doneBy: done ? user.name : null, doneAt: done ? now() : null,
      addedBy: user.uid, addedByName: user.name, createdAt: now(), fromJourney: true,
    });
    save();
    return true;
  },
  addStop(user, tripId, { place, kind, photos = [], caption = '', date = '' }) {
    this.ensurePlanItem(user, tripId, place, { done: kind !== 'wishlist', date, revive: true });
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
