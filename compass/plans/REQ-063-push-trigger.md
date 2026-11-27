# Plan: REQ-063 (part 3 of 3) — the app asks for a push after each notification; tap opens the panel

Requirements: REQ-063 (and REQ-062 follow-ups) · Test cases: TC-122, TC-123 · Issues #113, #112 · Decision: ADR-023
Design: compass/design/2026-11-26-push-notifications.md (approved 2026-11-27) — SCR-3

## Files
- `src/lib/push.js` — `pushNotify(id)`: after a notification is saved, ask the Worker to push it (fire and forget,
  following the Worker's `cursor` for broadcasts); does nothing until the Worker is set up. Review nits of #153:
  if `/subscribe` fails the browser subscription is removed again; a prompt closed without answering is not "blocked".
- `src/lib/social.js` — `socialApi.notify` (likes, follows, comments, admin messages) calls `pushNotify`.
- `src/lib/store.js` — trip invite and invite answer notifications call `pushNotify`.
- `src/lib/adminStore.js` — the "check-in hidden" notification calls `pushNotify`.
- `src/components/Notifications.jsx` — opens the panel when the app is opened from a push (`#notifications`) or when
  the service worker reports a tap (`open-notifications`); refreshes this device's push registration (language,
  role) once the user is signed in (REQ-062 follow-up).
- `src/pages/Account.jsx` — prompt closed → stays Off with the normal hint; `aria-describedby` for the hint line.
- `worker/push-worker.js` — a notification whose recipient has no device is answered without any KV write (keeps the
  free plan's 1,000 writes/day for real pushes). `tests/push.test.mjs` — covers that.
- `e2e/push.spec.mjs` — TC-122/TC-123 app side.
- Spec statuses (REQ-062/063 Done, TC-122/123 Passing) move in the deploy PR, together with the Worker URL/key in
  `.env.production` and `worker/wrangler.toml`, to keep this PR within 12 files.

## Steps
1. pushNotify + callers. 2. Panel opening + refresh. 3. Nits. 4. Worker no-recipient shortcut + unit test.
5. UI tests, npm test, check-spec, check-guardrails.

## Risks
- A failing or missing Worker never blocks a notification: the push call happens after the notification is saved and
  errors are ignored (REQ-063 AC 5).
- More requests: one Worker call per notification created (free plan: 100,000/day). No change while the Worker URL is
  not set.

## Proof
- `npx playwright test e2e/push.spec.mjs`: a like / follow / admin message triggers `/notify` with the new id (admin
  broadcast follows the cursor); a Worker error does not stop the in-app notification; `#notifications` opens the
  panel; the prompt closed → switch stays usable; `npm test` (Worker skips KV writes without recipients).
