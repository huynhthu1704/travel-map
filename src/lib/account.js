// Tài khoản & dữ liệu: tải toàn bộ dữ liệu của tôi (JSON) và xoá tài khoản.
// Khi xoá tài khoản chỉ giữ lại 1 con số đếm ẩn danh: stats/deletions { count, byMonth: { 'YYYY-MM': n } }
// (không có uid, email hay tên — không thể biết ai đã xoá).
import {
  collection, collectionGroup, doc, getDoc, getDocs, query, where, writeBatch, deleteDoc, updateDoc, increment, arrayRemove, deleteField,
} from 'firebase/firestore';
import { reauthenticateWithPopup, deleteUser } from 'firebase/auth';
import { firebaseEnabled, auth, db, googleProvider } from './firebase';
import { clearLocalPersonalData } from './store';

const DEMO_KEYS = ['travel-map-demo-v1', 'travel-map-social-demo-v1', 'travel-map-admin-demo-v1', 'travel-map-feedback-demo-v1'];
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const safe = (p) => p.catch(() => null);
const month = () => new Date().toISOString().slice(0, 7);

async function deleteRefs(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const b = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => b.delete(r));
    await b.commit();
  }
}
const q = (col, ...w) => getDocs(query(collection(db, col), ...w));

/* ------------------------------ Tải dữ liệu ------------------------------ */
export async function exportMyData(user, { withPhotos = false, onStep = () => {} } = {}) {
  if (!firebaseEnabled) {
    const out = { exportedAt: new Date().toISOString(), mode: 'demo' };
    DEMO_KEYS.forEach((k) => (out[k] = JSON.parse(localStorage.getItem(k) || 'null')));
    return out;
  }
  const uid = user.uid;
  onStep('account');
  const [userDoc, profile, places] = await Promise.all([
    safe(getDoc(doc(db, 'users', uid))),
    safe(getDoc(doc(db, 'profiles', uid))),
    safe(getDocs(collection(db, 'users', uid, 'places'))),
  ]);
  onStep('memories');
  const memSnap = await q('memories', where('uid', '==', uid));
  const memories = [];
  for (const d of memSnap.docs) {
    const m = { id: d.id, ...d.data() };
    if (withPhotos) {
      const f = await safe(getDocs(collection(db, 'memories', d.id, 'full')));
      m.fullPhotos = f ? f.docs.map((x) => x.data()).sort((a, b) => a.i - b.i).map((x) => x.data) : [];
    }
    memories.push(m);
  }
  onStep('trips');
  const tripSnap = await q('trips', where('memberIds', 'array-contains', uid));
  const trips = [];
  for (const d of tripSnap.docs) {
    const t = { id: d.id, ...d.data() };
    const [plan, costs, checklists, stops] = await Promise.all(
      ['plan', 'costs', 'checklists', 'stops'].map((c) => safe(getDocs(collection(db, 'trips', d.id, c)))),
    );
    Object.assign(t, {
      plan: plan ? rows(plan) : [],
      costs: costs ? rows(costs) : [],
      checklists: checklists ? rows(checklists).filter((c) => c.scope === 'shared' || c.ownerUid === uid) : [],
      stops: stops ? rows(stops) : [],
    });
    trips.push(t);
  }
  onStep('social');
  const myPosts = await safe(q('countryPosts', where('uid', '==', uid)));
  const [following, followers, notes, feedback, invitesIn, invitesOut, feed] = await Promise.all([
    safe(q('follows', where('from', '==', uid))),
    safe(q('follows', where('to', '==', uid))),
    safe(q('notifications', where('to', '==', uid))),
    safe(q('feedback', where('uid', '==', uid))),
    safe(q('tripInvites', where('to', '==', uid))),
    safe(q('tripInvites', where('from', '==', uid))),
    safe(getDoc(doc(db, 'feeds', uid))),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account: userDoc?.exists() ? userDoc.data() : null,
    profile: profile?.exists() ? profile.data() : null,
    places: places ? rows(places) : [],
    memories,
    trips,
    following: following ? rows(following).map((f) => f.to) : [],
    followers: followers ? rows(followers).map((f) => f.from) : [],
    notifications: notes ? rows(notes) : [],
    tripInvites: [...(invitesIn ? rows(invitesIn) : []), ...(invitesOut ? rows(invitesOut) : [])],
    feedback: feedback ? rows(feedback) : [],
    countryPosts: myPosts ? rows(myPosts) : [],
    activityFeed: feed?.exists() ? feed.data() : null,
  };
}

export function downloadJson(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ------------------------------ Xem trước khi xoá ------------------------------ */
/** Những gì sẽ xảy ra với các chuyến đi khi xoá tài khoản */
export async function tripsImpact(user) {
  if (!firebaseEnabled) return { deleted: [], transferred: [], left: [] };
  const snap = await q('trips', where('memberIds', 'array-contains', user.uid));
  const out = { deleted: [], transferred: [], left: [] };
  snap.docs.forEach((d) => {
    const t = { id: d.id, ...d.data() };
    if (t.ownerId !== user.uid) out.left.push(t);
    else if ((t.memberIds || []).some((x) => x !== user.uid)) out.transferred.push(t);
    else out.deleted.push(t);
  });
  return out;
}

/* ------------------------------ Xoá tài khoản ------------------------------ */
export async function deleteMyAccount(user, { onStep = () => {} } = {}) {
  if (!firebaseEnabled) {
    DEMO_KEYS.forEach((k) => localStorage.removeItem(k));
    clearLocalPersonalData();
    return;
  }
  const uid = user.uid;
  // Đăng nhập lại trước để chắc chắn xoá được tài khoản Google ở bước cuối (tránh xoá dở dang)
  onStep('reauth');
  await reauthenticateWithPopup(auth.currentUser, googleProvider);

  onStep('trips');
  const trips = await q('trips', where('memberIds', 'array-contains', uid));
  for (const d of trips.docs) {
    const t = { id: d.id, ...d.data() };
    // điểm dừng mình thêm + checklist cá nhân
    const [stops, lists] = await Promise.all([
      safe(getDocs(query(collection(db, 'trips', t.id, 'stops'), where('byUid', '==', uid)))),
      safe(getDocs(collection(db, 'trips', t.id, 'checklists'))),
    ]);
    await deleteRefs([...(stops?.docs || []), ...(lists?.docs || []).filter((x) => x.data().scope !== 'shared' && x.data().ownerUid === uid)].map((x) => x.ref));
    const others = (t.memberIds || []).filter((x) => x !== uid);
    if (t.ownerId === uid && !others.length) {
      // chỉ có mình → xoá hẳn chuyến đi và mọi dữ liệu bên trong
      const subs = await Promise.all(['plan', 'costs', 'checklists', 'stops'].map((c) => safe(getDocs(collection(db, 'trips', t.id, c)))));
      await deleteRefs(subs.flatMap((s) => s?.docs || []).map((x) => x.ref));
      await deleteDoc(doc(db, 'trips', t.id));
    } else if (t.ownerId === uid) {
      // còn người khác → chuyển quyền chủ chuyến cho thành viên đầu tiên rồi rời đi
      await updateDoc(doc(db, 'trips', t.id), { ownerId: others[0] });
      await updateDoc(doc(db, 'trips', t.id), { memberIds: arrayRemove(uid), [`members.${uid}`]: deleteField() });
    } else {
      await updateDoc(doc(db, 'trips', t.id), { memberIds: arrayRemove(uid), [`members.${uid}`]: deleteField() });
    }
    if (t.ownerId === uid && t.inviteCode) await safe(deleteDoc(doc(db, 'inviteCodes', t.inviteCode)));
  }

  onStep('memories');
  const mems = await q('memories', where('uid', '==', uid));
  for (const m of mems.docs) {
    const subs = await Promise.all(['full', 'mid', 'thumbs', 'likes'].map((c) => safe(getDocs(collection(db, 'memories', m.id, c)))));
    await deleteRefs([...subs.flatMap((s) => s?.docs || []).map((x) => x.ref), m.ref]);
  }
  // Bài kinh nghiệm của mình (xoá kèm phiếu + bình luận bên trong), bình luận và phiếu của mình ở bài người khác
  onStep('social');
  const { tipsApi } = await import('./tips');
  const myPosts = await safe(q('countryPosts', where('uid', '==', uid)));
  for (const d of myPosts?.docs || []) await safe(tipsApi.remove(d.id));
  const myComments = await safe(getDocs(query(collectionGroup(db, 'comments'), where('uid', '==', uid))));
  for (const c of myComments?.docs || []) {
    const postId = c.ref.parent.parent?.id;
    if (postId && c.ref.parent.parent.parent.id === 'countryPosts') await safe(tipsApi.deleteComment({ id: postId }, { id: c.id }));
  }
  const myVotes = await safe(getDocs(query(collectionGroup(db, 'votes'), where('uid', '==', uid))));
  for (const v of myVotes?.docs || []) {
    const postId = v.ref.parent.parent?.id;
    if (postId) await safe(tipsApi.vote({ uid }, { id: postId }, v.data().v, v.data().v));
  }
  // lượt thích mình đã bấm cho check-in của người khác
  const myLikes = await safe(getDocs(query(collectionGroup(db, 'likes'), where('uid', '==', uid))));
  if (myLikes) await deleteRefs(myLikes.docs.map((x) => x.ref));

  onStep('social');
  const lists = await Promise.all([
    safe(q('follows', where('from', '==', uid))),
    safe(q('follows', where('to', '==', uid))),
    safe(q('notifications', where('to', '==', uid))),
    safe(q('notifications', where('from', '==', uid))),
    safe(q('tripInvites', where('to', '==', uid))),
    safe(q('tripInvites', where('from', '==', uid))),
    safe(q('reports', where('byUid', '==', uid))),
    safe(getDocs(collection(db, 'users', uid, 'places'))),
  ]);
  await deleteRefs(lists.flatMap((s) => s?.docs || []).map((x) => x.ref));
  const fbs = await safe(q('feedback', where('uid', '==', uid)));
  for (const f of fbs?.docs || []) {
    const files = await safe(getDocs(collection(db, 'feedback', f.id, 'files')));
    await deleteRefs([...(files?.docs || []).map((x) => x.ref), f.ref]);
  }

  onStep('profile');
  const prof = await safe(getDoc(doc(db, 'profiles', uid)));
  const uname = prof?.exists() ? prof.data().username : '';
  if (uname) await safe(deleteDoc(doc(db, 'usernames', uname)));
  await safe(deleteDoc(doc(db, 'profileStats', uid)));
  await safe(deleteDoc(doc(db, 'profiles', uid)));
  await safe(deleteDoc(doc(db, 'feeds', uid)));

  // Bước cuối: xoá hồ sơ tài khoản + cộng 1 vào bộ đếm ẩn danh (cùng 1 lần ghi)
  onStep('account');
  const b = writeBatch(db);
  b.delete(doc(db, 'users', uid));
  b.set(doc(db, 'stats', 'deletions'), { count: increment(1), byMonth: { [month()]: increment(1) } }, { merge: true });
  await b.commit().catch(async () => {
    await deleteDoc(doc(db, 'users', uid));
  });
  await deleteUser(auth.currentUser);
  clearLocalPersonalData();
}

/** Số tài khoản đã xoá (ẩn danh) — cho trang thống kê của quản trị viên */
export async function getDeletionStats() {
  if (!firebaseEnabled) return { count: 0, byMonth: {} };
  const s = await safe(getDoc(doc(db, 'stats', 'deletions')));
  return s?.exists() ? s.data() : { count: 0, byMonth: {} };
}


