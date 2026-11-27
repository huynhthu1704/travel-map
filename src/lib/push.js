// REQ-062: push notifications on this device — browser support, turning push on/off, and calls to the Bee There
// push Worker (worker/push-worker.js, ADR-023). The Worker URL and the public VAPID key are public settings
// (VITE_PUSH_URL, VITE_PUSH_PUBLIC_KEY in .env.production); until they are set, push is not offered.
import { auth } from './firebase';

const CFG = { url: import.meta.env.VITE_PUSH_URL || '', key: import.meta.env.VITE_PUSH_PUBLIC_KEY || '' };
// UI tests set window.__BEE_PUSH__ = { url, key } (the real values only exist once the Worker is deployed)
const config = () => (typeof window !== 'undefined' && window.__BEE_PUSH__) || CFG;

export const pushConfigured = () => Boolean(config().url && config().key);

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

/** 'ok' | 'ios' (iPhone not opened from the Home Screen) | 'blocked' | 'unsupported' | 'off' (not set up) */
export function pushSupport() {
  if (!pushConfigured()) return 'off';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return isIOS() && !standalone() ? 'ios' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return 'ok';
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) || navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
}

const keyBytes = (b64) => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4)), (c) => c.charCodeAt(0));

/** POST to the Worker with the signed-in user's Firebase ID token (demo mode sends a placeholder). */
export async function callPushWorker(path, body) {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : 'demo';
  const res = await fetch(config().url.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`push ${path} ${res.status}`);
  return res.json();
}

/** The push subscription of this device, or null */
export async function currentPushSub() {
  if (pushSupport() !== 'ok') return null;
  return (await (await registration()).pushManager.getSubscription()) || null;
}

/** Turn push on for this device → 'on' | 'blocked' (the user refused in the browser prompt) */
export async function enablePush(lang) {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'blocked';
  const reg = await registration();
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(config().key) }));
  await callPushWorker('/subscribe', { subscription: sub.toJSON(), lang });
  return 'on';
}

/** Turn push off for this device */
export async function disablePush() {
  const sub = await currentPushSub();
  if (!sub) return;
  await callPushWorker('/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
}

/** Keep language and role current on the Worker while push is on (called when the app starts). */
export async function refreshPush(lang) {
  const sub = await currentPushSub().catch(() => null);
  if (sub) await callPushWorker('/subscribe', { subscription: sub.toJSON(), lang }).catch(() => {});
}
