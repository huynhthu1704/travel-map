/**
 * Góp ý / báo lỗi của người dùng.
 *
 *  feedback/{id}          { uid, userName, userEmail, userPhoto, type:'bug'|'enhancement', title, actual, expected, description,
 *                           page, url, element:{selector,text,tag}, env:{browser,os,device,viewport,screen,lang,version,ua},
 *                           files:[{kind:'screenshot'|'image'|'video', name, mime, size}], status, adminNote, history[], createdAt, updatedAt }
 *  feedback/{id}/files/{i_part}  { index, part, parts, kind, mime, data (một phần data URL), uid }
 *
 * Ảnh / video lưu ngay trong Firestore (gói miễn phí không có Storage): mỗi tệp chia thành nhiều phần ≤ 800KB.
 */
import { collection, doc, setDoc, getDocs, onSnapshot, query, where, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { firebaseEnabled, db } from './firebase';
import { compressToDataURL, blobToDataURL } from './image';

export const FEEDBACK_STATUSES = ['open', 'todo', 'coming_soon', 'done', 'closed'];
export const MAX_VIDEO_MB = 10;
/** Bản nháp form góp ý: giữ lại khi người dùng tạm đóng form để chọn vùng trên màn hình */
export const feedbackDraft = { current: null };
const CHUNK = 800_000;
const now = () => Date.now();

/** Thông tin thiết bị / trình duyệt (để tái hiện lỗi) */
export function envInfo() {
  const ua = navigator.userAgent;
  const ver = (re) => (ua.match(re) || [])[1] || '';
  const browser =
    /Edg\//.test(ua) ? `Edge ${ver(/Edg\/([\d.]+)/)}`
    : /OPR\//.test(ua) ? `Opera ${ver(/OPR\/([\d.]+)/)}`
    : /SamsungBrowser/.test(ua) ? `Samsung Internet ${ver(/SamsungBrowser\/([\d.]+)/)}`
    : /CriOS/.test(ua) ? `Chrome iOS ${ver(/CriOS\/([\d.]+)/)}`
    : /FxiOS/.test(ua) ? `Firefox iOS ${ver(/FxiOS\/([\d.]+)/)}`
    : /Firefox\//.test(ua) ? `Firefox ${ver(/Firefox\/([\d.]+)/)}`
    : /Chrome\//.test(ua) ? `Chrome ${ver(/Chrome\/([\d.]+)/)}`
    : /Safari\//.test(ua) ? `Safari ${ver(/Version\/([\d.]+)/)}`
    : 'Không rõ';
  const ipadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const os =
    /iPhone|iPod/.test(ua) ? `iOS ${ver(/OS ([\d_]+)/).replace(/_/g, '.')}`
    : /iPad/.test(ua) || ipadOS ? `iPadOS ${ver(/OS ([\d_]+)/).replace(/_/g, '.')}`.trim()
    : /Android/.test(ua) ? `Android ${ver(/Android ([\d.]+)/)}`
    : /Windows NT 10/.test(ua) ? 'Windows 10/11'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? `macOS ${ver(/Mac OS X ([\d_]+)/).replace(/_/g, '.')}`
    : /Linux/.test(ua) ? 'Linux'
    : 'Không rõ';
  const device = /iPad/.test(ua) || ipadOS || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' : /Mobi|iPhone|Android/.test(ua) ? 'mobile' : 'desktop';
  const entry = [...document.scripts].map((s) => s.src).find((s) => /\/assets\/index-[\w-]+\.js/.test(s));
  return {
    browser,
    os,
    device,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    screen: `${screen.width}×${screen.height} @${window.devicePixelRatio || 1}x`,
    lang: navigator.language || '',
    online: navigator.onLine,
    connection: navigator.connection?.effectiveType || '',
    version: entry ? entry.match(/index-([\w-]+)\.js/)[1] : 'dev',
    ua,
  };
}

/** CSS selector ngắn gọn để biết người dùng đã chọn phần nào */
export function describeElement(el) {
  const parts = [];
  let e = el;
  for (let i = 0; e && e.nodeType === 1 && i < 4; i++) {
    let s = e.tagName.toLowerCase();
    if (e.id) {
      parts.unshift(`${s}#${e.id}`);
      break;
    }
    const cls = [...e.classList].filter((c) => !/^(on|is-|has-)/.test(c)).slice(0, 2);
    if (cls.length) s += `.${cls.join('.')}`;
    parts.unshift(s);
    e = e.parentElement;
  }
  return {
    selector: parts.join(' > '),
    text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.alt || '').replace(/\s+/g, ' ').trim().slice(0, 140),
    tag: el.tagName.toLowerCase(),
  };
}

/** Chụp màn hình và khoanh vùng phần tử đã chọn. rect: toạ độ trong khung nhìn. */
export async function captureScreen(rect) {
  const { default: html2canvas } = await import('html2canvas');
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  const shot = await html2canvas(document.body, {
    useCORS: true,
    logging: false,
    scale,
    x: window.scrollX,
    y: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    ignoreElements: (el) => el.classList?.contains('fb-ignore'),
  });
  const c = document.createElement('canvas');
  const maxW = 1600;
  const k = Math.min(1, maxW / shot.width);
  c.width = Math.round(shot.width * k);
  c.height = Math.round(shot.height * k);
  const ctx = c.getContext('2d');
  ctx.drawImage(shot, 0, 0, c.width, c.height);
  if (rect) {
    const s = (shot.width / window.innerWidth) * k;
    const pad = 6 * s;
    const x = rect.left * s - pad;
    const y = rect.top * s - pad;
    const w = rect.width * s + pad * 2;
    const h = rect.height * s + pad * 2;
    // làm tối phần còn lại để vùng được chọn nổi bật
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,12,0.35)';
    ctx.beginPath();
    ctx.rect(0, 0, c.width, c.height);
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 10 * s) : ctx.rect(x, y, w, h);
    ctx.fill('evenodd');
    ctx.restore();
    ctx.lineWidth = Math.max(3, 4 * s);
    ctx.strokeStyle = '#FF3B30';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 10 * s) : ctx.rect(x, y, w, h);
    ctx.stroke();
  }
  let q = 0.8;
  let url = c.toDataURL('image/jpeg', q);
  while (url.length > 900_000 && q > 0.4) url = c.toDataURL('image/jpeg', (q -= 0.1));
  return url;
}

/** Chuẩn bị tệp đính kèm: ảnh được nén, video giữ nguyên (giới hạn dung lượng) */
export async function prepareFile(file) {
  if (file.type.startsWith('video/')) {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`video>${MAX_VIDEO_MB}`);
    return { kind: 'video', name: file.name, mime: file.type, size: file.size, data: await blobToDataURL(file) };
  }
  const data = await compressToDataURL(file, 1800, 0.82, 700_000);
  return { kind: 'image', name: file.name, mime: 'image/jpeg', size: Math.round(data.length * 0.75), data };
}

/* ------------------------------ Firebase ------------------------------ */
const fb = {
  async submit(user, payload, files) {
    const ref = doc(collection(db, 'feedback'));
    const meta = files.map((f) => ({ kind: f.kind, name: f.name || '', mime: f.mime, size: f.size || 0 }));
    await setDoc(ref, {
      ...payload,
      uid: user.uid,
      userName: user.name || '',
      userEmail: user.email || '',
      userPhoto: user.photo || '',
      files: meta,
      status: 'open',
      adminNote: '',
      history: [{ status: 'open', at: now(), by: user.name || '' }],
      createdAt: now(),
      updatedAt: now(),
    });
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const parts = Math.ceil(f.data.length / CHUNK);
      for (let p = 0; p < parts; p++) {
        await setDoc(doc(db, 'feedback', ref.id, 'files', `${i}_${p}`), {
          index: i, part: p, parts, kind: f.kind, mime: f.mime, data: f.data.slice(p * CHUNK, (p + 1) * CHUNK), uid: user.uid,
        });
      }
    }
    return ref.id;
  },
  watchMine: (uid, cb) =>
    onSnapshot(query(collection(db, 'feedback'), where('uid', '==', uid)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)), () => cb([])),
  watchAll: (cb) => onSnapshot(collection(db, 'feedback'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)), () => cb([])),
  async files(id) {
    const s = await getDocs(collection(db, 'feedback', id, 'files'));
    const by = {};
    s.docs.forEach((d) => {
      const x = d.data();
      (by[x.index] ||= { kind: x.kind, mime: x.mime, parts: [] }).parts[x.part] = x.data;
    });
    return Object.keys(by)
      .sort((a, b) => a - b)
      .map((k) => ({ kind: by[k].kind, mime: by[k].mime, url: by[k].parts.join('') }));
  },
  setStatus: (id, status, by, note) =>
    updateDoc(doc(db, 'feedback', id), {
      status, updatedAt: now(), handledBy: by,
      ...(note != null ? { adminNote: note } : {}),
      history: arrayUnion({ status, at: now(), by }),
    }),
  setNote: (id, note, by) => updateDoc(doc(db, 'feedback', id), { adminNote: note, updatedAt: now(), handledBy: by }),
  async remove(id) {
    const s = await getDocs(collection(db, 'feedback', id, 'files'));
    for (const d of s.docs) await deleteDoc(d.ref);
    await deleteDoc(doc(db, 'feedback', id));
  },
};

/* ------------------------------ Demo (localStorage) ------------------------------ */
const KEY = 'travel-map-feedback-demo-v1';
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};
let list = load();
const subs = new Set();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* đầy bộ nhớ: bỏ qua tệp đính kèm */
  }
  subs.forEach((f) => f());
};
const on = (fn) => {
  fn();
  subs.add(fn);
  return () => subs.delete(fn);
};
const local = {
  async submit(user, payload, files) {
    const id = Math.random().toString(36).slice(2);
    list = [
      {
        id, ...payload, uid: user.uid, userName: user.name, userEmail: user.email || '', userPhoto: user.photo || '',
        files: files.map((f) => ({ kind: f.kind, name: f.name || '', mime: f.mime, size: f.size || 0 })), _files: files.map((f) => ({ kind: f.kind, mime: f.mime, url: f.data })),
        status: 'open', adminNote: '', history: [{ status: 'open', at: now(), by: user.name }], createdAt: now(), updatedAt: now(),
      },
      ...list,
    ];
    persist();
    return id;
  },
  watchMine: (uid, cb) => on(() => cb(list.filter((x) => x.uid === uid))),
  watchAll: (cb) => on(() => cb([...list])),
  files: async (id) => list.find((x) => x.id === id)?._files || [],
  async setStatus(id, status, by, note) {
    list = list.map((x) => (x.id === id ? { ...x, status, updatedAt: now(), handledBy: by, ...(note != null ? { adminNote: note } : {}), history: [...(x.history || []), { status, at: now(), by }] } : x));
    persist();
  },
  async setNote(id, note, by) {
    list = list.map((x) => (x.id === id ? { ...x, adminNote: note, updatedAt: now(), handledBy: by } : x));
    persist();
  },
  async remove(id) {
    list = list.filter((x) => x.id !== id);
    persist();
  },
};

export const feedbackApi = firebaseEnabled ? fb : local;
