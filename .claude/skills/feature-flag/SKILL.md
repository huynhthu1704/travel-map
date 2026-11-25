---
name: feature-flag
description: Use when adding or changing a user-facing feature in Bee There (new button, page, panel, option or behaviour users can see). Puts it behind a default-off feature flag with VI/EN name, description and value text so the Product Owner can try it first and release it from Admin → Tính năng.
---

# Feature flag for every new user-facing feature

**Policy (ADR-002):** a new user-facing feature ships hidden. The super admin always sees it; Christine releases it
to others in **Admin → Tính năng**. Released features with a `value` text appear on the About page.

## Steps
1. Add one entry at the top of `FLAGS` in `src/data/flags.js`:
   ```js
   { key: 'myFeature', icon: '✨', name: { vi: '…', en: '…' }, desc: { vi: '…', en: '…' },
     value: { vi: 'One sentence of user value.', en: 'One sentence of user value.' }, since: 'YYYY-MM-DD', defaultOn: false },
   ```
   - `key`: camelCase, unique. `since`: today's date. `defaultOn: false` — always.
   - `value`: what the user gains, one short sentence per language (leave it out only for internal/technical flags).
2. Wrap every new piece of UI in `can('myFeature')` (from `useApp()`); the old behaviour must stay unchanged when the flag is off.
3. UI tests turn it on with `openApp(page, path, { flags: { myFeature: true } })`.
4. In the PR and the final report, tell Christine which flag to switch on.

## Enforced by
- `tests/skills.test.mjs` (TC-066): every flag has VI/EN name and description; flags added since 2026-11-20 are `defaultOn: false` and have a VI/EN `value`.
