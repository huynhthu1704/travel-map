# Plan: REQ-062 (part 2 of 3) — Notification settings: push on/off for this device

Requirements: REQ-062 · Test cases: TC-122 · Issue #112 · Decision: ADR-023
Design: compass/design/2026-11-26-push-notifications.md (approved by the Product Owner, 2026-11-27) — SCR-1, SCR-2a–c

## Files
- `src/data/flags.js` — new flag `pushNotif` (default off, VI/EN name, description and value).
- `src/lib/push.js` — browser support (`ok` / iPhone not on the Home Screen / blocked / unsupported / not set up),
  turn on (browser prompt → push subscription → Worker `/subscribe` with language), turn off (`/unsubscribe`),
  `refreshPush` (keeps language and role current; called at app start in part 3). The Worker URL and public key are
  public settings `VITE_PUSH_URL` / `VITE_PUSH_PUBLIC_KEY` (set at deploy, part 3); until then nothing is shown.
- `src/pages/Account.jsx` — `NotificationSection`: one row "📲 Push notifications" with a switch (`role="switch"`)
  and one line below (hint, or how to enable it); in the Account & data page and in the dialog.
- `src/pages/Profile.jsx` — new ⋯ menu item "🔔 Notification settings" (between Privacy and Download my data).
- `src/i18n.jsx`, `src/i18n-en.js` — VI/EN strings. `src/styles/app.css` — the honey row and the switch.
- `public/sw.js` — show push messages (title/text as sent, Bee There icon) and open the app on tap.
- `e2e/push.spec.mjs` — TC-122 (browser push faked; Worker calls recorded).

## Steps
1. Flag + strings. 2. push.js. 3. Settings section + menu item + CSS. 4. Service worker handlers. 5. UI tests,
`npm test`, check-spec, check-guardrails. Spec statuses (REQ-062 Done, TC-122 Passing) are set in part 3 together
with REQ-063, to keep this PR within 12 files.

## Risks
- Nothing visible without the flag and without the deployed Worker (no URL/key yet) → safe to merge before deploy.
- Service worker: only adds `push` / `notificationclick` listeners; caching is unchanged.
- iPhone: push works only for the site added to the Home Screen (iOS 16.4+); we explain it instead of a switch.

## Proof
- `PW_CHROME=… npx playwright test e2e/push.spec.mjs`: on/off from Profile ⋯ (calls `/subscribe` with language and
  token, then `/unsubscribe`), Account page in English, refused prompt / blocked → disabled + how-to, iPhone →
  Add to Home Screen steps, flag off → nothing shown.
- `npm test`, `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`.
