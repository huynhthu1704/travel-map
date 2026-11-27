# Plan: REQ-063 (part 1 of 3) — the Cloudflare Worker that sends push messages

Requirements: REQ-063 · Test cases: TC-123 · Issue #113 · Decision: ADR-023
Design: compass/design/2026-11-26-push-notifications.md (approved by the Product Owner, 2026-11-27) — SCR-3

Delivery in three PRs so each stays under 12 files:
1. **this PR** — the Worker (server side) and the shared notification text, fully unit-tested, not yet deployed;
2. REQ-062 — Notification settings + device registration in the app (flag `pushNotif`), service worker `push` handler;
3. REQ-063 part 2 — the app asks the Worker to send a push after each notification it creates; deploy steps with
   the Product Owner (free Cloudflare account).

## Files
- `src/lib/notifText.js` — VI/EN text of every notification kind (same words as the in-app list) and
  `pushMessage(n, lang)` → `{ title, body }` (admin messages: their title and text; others: the in-app line).
  Pure JS so the Worker bundles it; a unit test checks it against `src/i18n.jsx` / `src/i18n-en.js`.
- `worker/push-worker.js` — `POST /subscribe`, `/unsubscribe`, `/notify`; CORS for the site origin only.
  Identity: the Firebase ID token in `Authorization: Bearer`; the Worker calls the Firestore REST API with that
  token, so Firestore checks the token and the existing `firestore.rules` decide what the caller may read.
  `/notify {id}` reads `notifications/{id}` as the caller (exists, caller is its sender or staff, created < 10 min
  ago), finds recipients (`to` = a uid, `all`, or `role:x`), sends once per notification (KV `sent:<id>`, 1 day).
  Subscriptions live in Cloudflare KV `sub:<uid>` → `{ lang, role, subs[] }` (max 10 devices).
  Expired subscriptions (push service answers 404/410) are removed.
- `worker/webpush.js` — standard Web Push with WebCrypto only (no new dependency): VAPID JWT (ES256, RFC 8292)
  and aes128gcm payload encryption (RFC 8291).
- `worker/wrangler.toml` — Worker name, KV binding, public settings (project id, site origin, VAPID public key);
  the VAPID private key is a Cloudflare secret, never in the repo.
- `tests/push.test.mjs` — TC-123.
- `compass/spec.json` (REQ-063 In build, TC-123) and the generated views.

## Steps
1. notifText + test against the dictionaries. 2. webpush + round-trip test (decrypt with the receiver's key,
verify the VAPID signature). 3. Worker handler + tests with a fake KV, fake Firestore and fake push service.
4. spec/views, check-spec, check-guardrails, npm test.

## Risks
- Abuse (pushing to strangers): only a notification that already exists in Firestore and that the caller may read
  as sender or staff can be pushed; each one only once; text comes from the stored notification, not the caller.
- Pushing to everyone or to a role is allowed only for team messages (`feature`/`system`, which firestore.rules let
  only staff with the notify permission create); a normal user's notification addressed to `role:…` is refused
  (review of #151). `createdAt` must be within the last 10 minutes and not more than 5 minutes in the future.
- Free plan limits: 100,000 requests/day, KV 1,000 writes/day, and per call 50 outgoing requests and 10 ms CPU.
  So one `/notify` call sends to at most 10 devices (`BATCH`) and returns a `cursor`; the app calls again until
  there is no cursor (part 3). Each batch is marked sent once (KV `sent:<id>:<cursor>`, 1 day) — one KV write per
  batch. Title/text are shortened to stay under the 4 KB push limit. The recipient's role is saved at subscribe
  time; the app re-subscribes on each start (part 2) so it stays current.
- Nothing changes for users in this PR (not deployed, app does not call it yet). No `firestore.rules` change.

## Proof
- `npm test` (TC-123: text matches the app for every kind and both languages; encrypted payload decrypts to the
  message; VAPID JWT verifies; subscribe/unsubscribe; notify sends to the recipient in their language, to all, to a
  role; refuses unknown/old/foreign notifications; removes expired subscriptions; sends once).
- `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`.
