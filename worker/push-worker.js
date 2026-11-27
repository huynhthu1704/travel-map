// REQ-062/REQ-063: Bee There push sender — a Cloudflare Worker on the free plan (ADR-023).
//   POST /subscribe   { subscription, lang }  → remember this device for the signed-in user
//   POST /unsubscribe { endpoint }            → forget this device
//   POST /notify      { id }                  → send notifications/{id} as a push to its recipients
// Every call carries the user's Firebase ID token (Authorization: Bearer …). The token is verified here, and
// Firestore is read *as that user* (REST API + the same token), so firestore.rules decide what the caller may see.
import { sendPush } from './webpush.js';
import { pushMessage } from '../src/lib/notifText.js';

const MAX_DEVICES = 10;
const MAX_AGE_MS = 10 * 60 * 1000; // a notification can be pushed only in its first 10 minutes
const CLOCK_SKEW_MS = 5 * 60 * 1000; // createdAt comes from the sender's clock
// Free plan: 50 outgoing requests and 10 ms CPU per call, so one /notify call sends to at most BATCH devices and
// returns a cursor for the next batch (the app calls again until there is no cursor).
const DEFAULT_BATCH = 10;
const TEAM_TYPES = ['feature', 'system']; // only these may go to everyone or to a role (firestore.rules: notify permission)
const MAX_TITLE = 200;
const MAX_BODY = 600; // keeps the encrypted payload well under the 4 KB Web Push limit
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwksCache = null; // { keys, until }

const json = (data, status, cors) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } });
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));
const b64urlBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

/** Verify a Firebase ID token (RS256, Google's public keys) → uid, or null. */
export async function verifyIdToken(token, projectId, deps) {
  try {
    const [h, p, s] = String(token || '').split('.');
    const header = b64urlJson(h);
    const claims = b64urlJson(p);
    const now = Math.floor(deps.now() / 1000);
    if (header.alg !== 'RS256' || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!claims.sub || claims.exp < now || claims.iat > now + 300 || (claims.auth_time ?? 0) > now + 300) return null;
    // Google rotates its keys: refetch when a key id is unknown (at most once per call); never cache an empty list
    let jwk = jwksCache && jwksCache.until > deps.now() ? jwksCache.keys.find((k) => k.kid === header.kid) : null;
    if (!jwk) {
      const keys = (await (await deps.fetch(JWKS_URL)).json()).keys || [];
      if (keys.length) jwksCache = { keys, until: deps.now() + 3600 * 1000 };
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
    return ok ? claims.sub : null;
  } catch {
    return null;
  }
}
export const resetJwksCache = () => (jwksCache = null);

/** Firestore REST value → plain JS */
function plain(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, plain(x)]));
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(plain);
  return null;
}

/** Read one Firestore document as the caller → object, or null when missing / not allowed. */
async function readDoc(env, deps, token, path) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await deps.fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status !== 200) return null;
  const doc = await res.json();
  return Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, plain(v)]));
}

const roleOf = async (env, deps, token, uid) => (await readDoc(env, deps, token, `users/${uid}`))?.role || 'user';
const getRec = async (env, uid) => JSON.parse((await env.SUBS.get(`sub:${uid}`)) || 'null');
const putRec = (env, uid, rec) => (rec.subs.length ? env.SUBS.put(`sub:${uid}`, JSON.stringify(rec)) : env.SUBS.delete(`sub:${uid}`));

/** Recipients of `to`, in uid order after `after`, up to about `batch` devices → { list, next } (next = cursor). */
async function recipients(env, to, after, batch) {
  if (to !== 'all' && !to.startsWith('role:')) {
    const rec = after ? null : await getRec(env, to);
    return { list: rec ? [[to, rec]] : [], next: null };
  }
  const uids = [];
  let cursor;
  do {
    const page = await env.SUBS.list({ prefix: 'sub:', cursor });
    for (const k of page.keys) uids.push(k.name.slice(4));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  uids.sort();
  const list = [];
  let devices = 0;
  for (const uid of uids) {
    if (after && uid <= after) continue;
    if (devices >= batch) return { list, next: list[list.length - 1][0] };
    const rec = await getRec(env, uid);
    if (rec && (to === 'all' || rec.role === to.slice(5))) (list.push([uid, rec]), (devices += rec.subs.length));
  }
  return { list, next: null };
}

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const validSub = (s) => s && typeof s.endpoint === 'string' && s.endpoint.startsWith('https://') && s.keys && typeof s.keys.p256dh === 'string' && typeof s.keys.auth === 'string';

export async function handle(request, env, deps = { fetch, now: Date.now }) {
  const origins = String(env.SITE_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get('Origin') || '';
  const cors = origins.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
  if (request.method !== 'POST') return json({ error: 'method' }, 405, cors);
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin' }, 403, cors);

  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const uid = await verifyIdToken(token, env.PROJECT_ID, deps);
  if (!uid) return json({ error: 'auth' }, 401, cors);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'body' }, 400, cors);
  }
  const path = new URL(request.url).pathname;

  if (path === '/subscribe') {
    if (!validSub(body.subscription)) return json({ error: 'subscription' }, 400, cors);
    const sub = { endpoint: body.subscription.endpoint, keys: { p256dh: body.subscription.keys.p256dh, auth: body.subscription.keys.auth } };
    const rec = (await getRec(env, uid)) || { subs: [] };
    rec.subs = [...rec.subs.filter((x) => x.endpoint !== sub.endpoint), sub].slice(-MAX_DEVICES);
    rec.lang = body.lang === 'en' ? 'en' : 'vi';
    rec.role = await roleOf(env, deps, token, uid);
    await putRec(env, uid, rec);
    return json({ ok: true }, 200, cors);
  }

  if (path === '/unsubscribe') {
    const rec = await getRec(env, uid);
    if (rec) {
      rec.subs = rec.subs.filter((x) => x.endpoint !== body.endpoint);
      await putRec(env, uid, rec);
    }
    return json({ ok: true }, 200, cors);
  }

  if (path === '/notify') {
    const id = String(body.id || '');
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return json({ error: 'id' }, 400, cors);
    const after = body.cursor == null ? '' : String(body.cursor);
    // Each batch is sent once; a batch after the first only with a cursor this Worker issued (KV cur:<id>:<cursor>)
    const mark = `sent:${id}:${after}`;
    const done = await env.SUBS.get(mark);
    if (done) return json({ ok: true, sent: 0, duplicate: true, cursor: JSON.parse(done).next ?? null }, 200, cors);
    if (after && !(await env.SUBS.get(`cur:${id}:${after}`))) return json({ error: 'cursor' }, 403, cors);
    const n = await readDoc(env, deps, token, `notifications/${id}`);
    if (!n || typeof n.to !== 'string') return json({ error: 'not found' }, 404, cors);
    // Only its sender (or the team) may push a notification, and only while it is new
    if (n.from !== uid && (await roleOf(env, deps, token, uid)) === 'user') return json({ error: 'forbidden' }, 403, cors);
    if (!(n.createdAt > deps.now() - MAX_AGE_MS && n.createdAt <= deps.now() + CLOCK_SKEW_MS)) return json({ error: 'too old' }, 409, cors);
    const broadcast = n.to === 'all' || n.to.startsWith('role:');
    if (broadcast && !TEAM_TYPES.includes(n.type)) return json({ error: 'forbidden' }, 403, cors);
    const { list, next } = await recipients(env, n.to, after, Number(env.BATCH) || DEFAULT_BATCH);
    await env.SUBS.put(mark, JSON.stringify({ next }), { expirationTtl: 86400 });
    if (next) await env.SUBS.put(`cur:${id}:${next}`, '1', { expirationTtl: 86400 });
    const vapid = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT };
    let sent = 0;
    for (const [rid, rec] of list) {
      const m = pushMessage(n, rec.lang);
      const message = { title: clip(m.title, MAX_TITLE), body: clip(m.body, MAX_BODY), tag: id, url: '/#notifications' };
      const keep = [];
      for (const sub of rec.subs) {
        let status = 0;
        try {
          status = await sendPush(sub, message, vapid, deps.fetch);
        } catch {
          status = 0;
        }
        if (status === 404 || status === 410) continue; // the browser dropped this subscription
        keep.push(sub);
        if (status >= 200 && status < 300) sent++;
      }
      if (keep.length !== rec.subs.length) await putRec(env, rid, { ...rec, subs: keep });
    }
    return json({ ok: true, sent, cursor: next }, 200, cors);
  }

  return json({ error: 'not found' }, 404, cors);
}

export default { fetch: (request, env) => handle(request, env) };
