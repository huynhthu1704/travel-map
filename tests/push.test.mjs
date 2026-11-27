// TC-123 (REQ-063): the push sender (worker/) — same text as the app, standard Web Push encryption and VAPID,
// signed-in callers only, each notification pushed once to its recipients in their language.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NOTIF_TEXT, notifLine, pushMessage } from '../src/lib/notifText.js';
import EN from '../src/i18n-en.js';
import { b64url, encrypt, deriveKeys, vapidAuth } from '../worker/webpush.js';
import { handle, resetJwksCache } from '../worker/push-worker.js';

const viSource = readFileSync(fileURLToPath(new URL('../src/i18n.jsx', import.meta.url)), 'utf8');
const viEntry = (key) => {
  const m = viSource.match(new RegExp(`'${key.replace('.', '\\.')}':\\s*("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')`));
  assert.ok(m, `${key} in src/i18n.jsx`);
  return Function(`return ${m[1]}`)();
};

test('notification text is the same as the in-app list, in VI and EN', () => {
  for (const key of Object.keys(NOTIF_TEXT.vi)) {
    assert.equal(NOTIF_TEXT.vi[key], viEntry(key), key);
    assert.equal(NOTIF_TEXT.en[key], EN[key], key);
  }
  assert.deepEqual(Object.keys(NOTIF_TEXT.en).sort(), Object.keys(NOTIF_TEXT.vi).sort());
});

test('push message = the in-app line; team messages keep their title and text', () => {
  const invite = { type: 'invite', fromName: 'Lan', title: 'Kyoto' };
  assert.deepEqual(pushMessage(invite, 'en'), { title: 'Lan invited you to the trip "Kyoto"', body: '' });
  assert.equal(notifLine(invite, 'vi'), 'Lan mời bạn tham gia chuyến đi "Kyoto"');
  assert.deepEqual(pushMessage({ type: 'system', title: '📣 Maintenance', body: '30 minutes' }, 'vi'), { title: '📣 Maintenance', body: '30 minutes' });
  assert.equal(notifLine({ type: 'follow' }, 'en'), '? started following you');
  assert.equal(notifLine({ type: 'like', fromName: 'Minh', title: 'Hội An' }, 'xx'), 'Minh đã thích check-in Hội An của bạn');
});

// --- a browser-side receiver for the tests ---
async function makeReceiver() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const authSecret = crypto.getRandomValues(new Uint8Array(16));
  const keys = { p256dh: b64url.encode(uaPublic), auth: b64url.encode(authSecret) };
  const decrypt = async (body) => {
    const buf = new Uint8Array(body);
    const salt = buf.slice(0, 16);
    const idlen = buf[20];
    const asPublic = buf.slice(21, 21 + idlen);
    const asKey = await crypto.subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, kp.privateKey, 256));
    const { cek, nonce } = await deriveKeys({ shared, authSecret, uaPublic, asPublic, salt });
    const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, buf.slice(21 + idlen)));
    assert.equal(plain[plain.length - 1], 2, 'last-record delimiter');
    return JSON.parse(new TextDecoder().decode(plain.slice(0, -1)));
  };
  return { keys, decrypt };
}

async function makeVapid() {
  const k = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', k.privateKey);
  return { publicKey: b64url.encode(await crypto.subtle.exportKey('raw', k.publicKey)), privateKey: jwk.d, subject: 'https://beetheremap.com', verifyKey: k.publicKey };
}

test('payload is encrypted for the receiving browser only (aes128gcm) and decrypts to the message', async () => {
  const r = await makeReceiver();
  const body = await encrypt(JSON.stringify({ title: 'Xin chào 🐝' }), r.keys);
  assert.deepEqual(await r.decrypt(body), { title: 'Xin chào 🐝' });
  const other = await makeReceiver();
  await assert.rejects(other.decrypt(body));
});

test('VAPID header: ES256 JWT for the push service origin, signed by our key', async () => {
  const v = await makeVapid();
  const h = await vapidAuth('https://fcm.googleapis.com/fcm/send/abc', v, 1_000_000);
  const [, jwt, k] = h.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(k, v.publicKey);
  const [hd, cl, sig] = jwt.split('.');
  const claims = JSON.parse(new TextDecoder().decode(b64url.decode(cl)));
  assert.deepEqual(claims, { aud: 'https://fcm.googleapis.com', exp: 1_000_000 + 12 * 3600, sub: 'https://beetheremap.com' });
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, v.verifyKey, b64url.decode(sig), new TextEncoder().encode(`${hd}.${cl}`));
  assert.ok(ok);
});

// --- the Worker with fake Google keys, Firestore, KV and push services ---
const PROJECT = 'travel-map-e9657';
const NOW = 1_800_000_000_000;

async function world({ batch } = {}) {
  resetJwksCache();
  const rsa = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const pubJwk = { ...(await crypto.subtle.exportKey('jwk', rsa.publicKey)), kid: 'k1' };
  const enc = (o) => b64url.encode(new TextEncoder().encode(JSON.stringify(o)));
  const token = async (uid, over = {}) => {
    const h = enc({ alg: 'RS256', kid: 'k1' });
    const c = enc({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: uid, iat: NOW / 1000 - 10, exp: NOW / 1000 + 3600, ...over });
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', rsa.privateKey, new TextEncoder().encode(`${h}.${c}`));
    return `${h}.${c}.${b64url.encode(sig)}`;
  };
  const users = { admin: { role: 'admin' }, ed: { role: 'editor' } };
  let jwks = [pubJwk];
  const notes = {};
  const pushed = []; // { endpoint, body }
  const gone = new Set();
  const kv = new Map();
  const SUBS = {
    get: async (k) => (kv.has(k) ? kv.get(k) : null),
    put: async (k, v) => void kv.set(k, v),
    delete: async (k) => void kv.delete(k),
    list: async ({ prefix }) => ({ keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  };
  const fsVal = (v) => (typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) });
  const fetchFn = async (url, init = {}) => {
    if (url.startsWith('https://www.googleapis.com/')) return new Response(JSON.stringify({ keys: jwks }));
    if (url.startsWith('https://firestore.googleapis.com/')) {
      const auth = (init.headers?.Authorization || '').slice(7);
      const caller = JSON.parse(new TextDecoder().decode(b64url.decode(auth.split('.')[1]))).sub;
      const [, col, id] = url.match(/documents\/(\w+)\/(.+)$/);
      const staff = (users[caller]?.role || 'user') !== 'user';
      const doc = col === 'users' ? users[id] : notes[id];
      if (!doc) return new Response('{}', { status: 404 });
      // firestore.rules: a notification is readable by its recipient, its sender and the team
      if (col === 'notifications' && !(doc.to === caller || doc.from === caller || staff)) return new Response('{}', { status: 403 });
      return new Response(JSON.stringify({ fields: Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, fsVal(v)])) }));
    }
    pushed.push({ endpoint: url, body: init.body, auth: init.headers.Authorization });
    return new Response('', { status: gone.has(url) ? 410 : 201 });
  };
  const vapid = await makeVapid();
  const env = { SUBS, PROJECT_ID: PROJECT, SITE_ORIGINS: 'https://beetheremap.com', VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_SUBJECT: vapid.subject, BATCH: batch };
  const call = async (path, body, { uid = 'lan', tok, origin = 'https://beetheremap.com' } = {}) => {
    const req = new Request(`https://push.example${path}`, {
      method: 'POST',
      headers: { Origin: origin, Authorization: `Bearer ${tok ?? (await token(uid))}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res = await handle(req, env, { fetch: fetchFn, now: () => NOW });
    return { status: res.status, data: await res.json() };
  };
  const device = async (uid, lang, name) => {
    const r = await makeReceiver();
    const subscription = { endpoint: `https://push.example/${name}`, keys: r.keys };
    assert.equal((await call('/subscribe', { subscription, lang }, { uid })).status, 200);
    return { ...r, endpoint: subscription.endpoint };
  };
  return { call, device, token, notes, pushed, gone, kv, rotate: (keys) => (jwks = keys) };
}

test('only the site origin and a valid Firebase sign-in are accepted', async () => {
  const w = await world();
  assert.equal((await w.call('/subscribe', {}, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await w.call('/subscribe', {}, { tok: 'not.a.token' })).status, 401);
  assert.equal((await w.call('/subscribe', {}, { tok: await w.token('lan', { exp: NOW / 1000 - 1 }) })).status, 401);
  assert.equal((await w.call('/subscribe', {}, { tok: await w.token('lan', { aud: 'other-project' }) })).status, 401);
  assert.equal((await w.call('/subscribe', { subscription: { endpoint: 'http://x' } })).status, 400);
  // a token whose user id was changed after signing is refused
  const [h, , sig] = (await w.token('lan')).split('.');
  const forged = b64url.encode(new TextEncoder().encode(JSON.stringify({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: 'admin', iat: NOW / 1000 - 10, exp: NOW / 1000 + 3600 })));
  assert.equal((await w.call('/subscribe', {}, { tok: `${h}.${forged}.${sig}` })).status, 401);
});

test('subscribe remembers the device with language and role; unsubscribe forgets it', async () => {
  const w = await world();
  const d = await w.device('ed', 'en', 'ed1');
  await w.device('ed', 'en', 'ed1'); // same device twice → stored once
  let rec = JSON.parse(w.kv.get('sub:ed'));
  assert.deepEqual([rec.lang, rec.role, rec.subs.length], ['en', 'editor', 1]);
  assert.equal((await w.call('/unsubscribe', { endpoint: d.endpoint }, { uid: 'ed' })).status, 200);
  assert.equal(w.kv.has('sub:ed'), false);
});

test('a new notification reaches each device of its recipient, in their language, once', async () => {
  const w = await world();
  const phone = await w.device('minh', 'en', 'minh-phone');
  const laptop = await w.device('minh', 'en', 'minh-laptop');
  w.notes.n1 = { to: 'minh', from: 'lan', type: 'invite', fromName: 'Lan', title: 'Kyoto', createdAt: NOW - 1000 };
  const r = await w.call('/notify', { id: 'n1' });
  assert.deepEqual([r.status, r.data.sent], [200, 2]);
  const got = await phone.decrypt(w.pushed.find((p) => p.endpoint === phone.endpoint).body);
  assert.deepEqual(got, { title: 'Lan invited you to the trip "Kyoto"', body: '', tag: 'n1', url: '/#notifications' });
  assert.ok(await laptop.decrypt(w.pushed.find((p) => p.endpoint === laptop.endpoint).body));
  assert.match(w.pushed[0].auth, /^vapid t=/);
  assert.equal((await w.call('/notify', { id: 'n1' })).data.sent, 0, 'second call sends nothing');
  assert.equal(w.pushed.length, 2);
});

test('refuses notifications the caller did not send, old ones and unknown ones', async () => {
  const w = await world();
  await w.device('minh', 'vi', 'minh-phone');
  w.notes.n2 = { to: 'minh', from: 'lan', type: 'like', fromName: 'Lan', title: 'Hội An', createdAt: NOW - 1000 };
  assert.equal((await w.call('/notify', { id: 'n2' }, { uid: 'minh' })).status, 403, 'the recipient cannot re-push');
  assert.equal((await w.call('/notify', { id: 'n2' }, { uid: 'eve' })).status, 404, 'a stranger cannot read it');
  w.notes.n3 = { ...w.notes.n2, createdAt: NOW - 11 * 60 * 1000 };
  assert.equal((await w.call('/notify', { id: 'n3' })).status, 409);
  assert.equal((await w.call('/notify', { id: 'nope' })).status, 404);
  assert.equal((await w.call('/notify', { id: '../users/x' })).status, 400);
  assert.equal(w.pushed.length, 0);
});

test('team messages go to everyone or to one role; expired devices are removed', async () => {
  const w = await world();
  const a = await w.device('minh', 'vi', 'minh-phone');
  const b = await w.device('ed', 'en', 'ed-phone');
  const old = await w.device('lan', 'vi', 'lan-old');
  w.gone.add(old.endpoint);
  w.notes.all1 = { to: 'all', from: 'admin', type: 'system', title: '📣 Bảo trì', body: '30 phút', createdAt: NOW - 1000 };
  const r = await w.call('/notify', { id: 'all1' }, { uid: 'admin' });
  assert.deepEqual([r.status, r.data.sent], [200, 2]);
  assert.deepEqual(await a.decrypt(w.pushed.find((p) => p.endpoint === a.endpoint).body), { title: '📣 Bảo trì', body: '30 phút', tag: 'all1', url: '/#notifications' });
  assert.equal(w.kv.has('sub:lan'), false, 'expired subscription removed');
  w.pushed.length = 0;
  w.notes.r1 = { to: 'role:editor', from: 'admin', type: 'feature', title: 'New', body: '', createdAt: NOW - 1000 };
  assert.equal((await w.call('/notify', { id: 'r1' }, { uid: 'admin' })).data.sent, 1);
  assert.deepEqual(w.pushed.map((p) => p.endpoint), [b.endpoint]);
});

test('people cannot push to everyone or to a role; only team messages can', async () => {
  const w = await world();
  await w.device('minh', 'vi', 'minh-phone');
  // e.g. a follow notification addressed to role:user (firestore.rules let a normal user create it)
  w.notes.f1 = { to: 'role:user', from: 'lan', type: 'follow', fromName: 'Spam', createdAt: NOW - 1000 };
  assert.equal((await w.call('/notify', { id: 'f1' })).status, 403);
  w.notes.f2 = { ...w.notes.f1, to: 'all' };
  assert.equal((await w.call('/notify', { id: 'f2' })).status, 403);
  w.notes.f3 = { to: 'minh', from: 'lan', type: 'like', fromName: 'Lan', title: 'x', createdAt: NOW + 6 * 60 * 1000 };
  assert.equal((await w.call('/notify', { id: 'f3' })).status, 409, 'createdAt in the future');
  assert.equal(w.pushed.length, 0);
});

test('a broadcast is sent in small batches with a cursor (free-plan limits), each batch once', async () => {
  const w = await world({ batch: 2 });
  const devs = [];
  for (const u of ['u1', 'u2', 'u3', 'u4', 'u5']) devs.push(await w.device(u, 'vi', u));
  w.notes.b1 = { to: 'all', from: 'admin', type: 'feature', title: 'Long '.repeat(300), body: 'x'.repeat(5000), createdAt: NOW - 1000 };
  let cursor = null;
  let calls = 0;
  let total = 0;
  do {
    const r = await w.call('/notify', { id: 'b1', cursor }, { uid: 'admin' });
    assert.equal(r.status, 200);
    total += r.data.sent;
    cursor = r.data.cursor;
    calls++;
  } while (cursor);
  assert.deepEqual([total, calls], [5, 3]);
  assert.equal(new Set(w.pushed.map((p) => p.endpoint)).size, 5);
  const msg = await devs[0].decrypt(w.pushed.find((p) => p.endpoint === devs[0].endpoint).body);
  assert.ok(msg.title.length <= 200 && msg.body.length <= 600, 'long text is shortened');
  const again = await w.call('/notify', { id: 'b1', cursor: 'u2' }, { uid: 'admin' });
  assert.deepEqual([again.data.sent, again.data.cursor], [0, 'u4'], 'a batch is not sent twice; the reply still gives the next cursor');
  const first = await w.call('/notify', { id: 'b1' }, { uid: 'admin' });
  assert.deepEqual([first.data.sent, first.data.cursor], [0, 'u2'], 'a lost first reply can be retried');
  for (const cursor of ['0', 'a', 'u1', 'u3']) {
    assert.equal((await w.call('/notify', { id: 'b1', cursor }, { uid: 'admin' })).status, 403, `made-up cursor ${cursor}`);
  }
  assert.equal(w.pushed.length, 5, 'nothing was sent again');
});

test('after Google rotates its sign-in keys, new tokens are accepted at once', async () => {
  const w = await world();
  assert.equal((await w.call('/unsubscribe', { endpoint: 'x' })).status, 200); // caches key k1
  const rsa = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  w.rotate([{ ...(await crypto.subtle.exportKey('jwk', rsa.publicKey)), kid: 'k2' }]);
  const enc = (o) => b64url.encode(new TextEncoder().encode(JSON.stringify(o)));
  const h = enc({ alg: 'RS256', kid: 'k2' });
  const c = enc({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: 'lan', iat: NOW / 1000 - 10, exp: NOW / 1000 + 3600 });
  const sig = b64url.encode(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', rsa.privateKey, new TextEncoder().encode(`${h}.${c}`)));
  assert.equal((await w.call('/unsubscribe', { endpoint: 'x' }, { tok: `${h}.${c}.${sig}` })).status, 200);
});

test('a notification for someone without push costs no KV write', async () => {
  const w = await world();
  w.notes.n9 = { to: 'nobody', from: 'lan', type: 'follow', fromName: 'Lan', createdAt: NOW - 1000 };
  const before = w.kv.size;
  const r = await w.call('/notify', { id: 'n9' });
  assert.deepEqual([r.status, r.data.sent, r.data.cursor, w.kv.size], [200, 0, null, before]);
});
