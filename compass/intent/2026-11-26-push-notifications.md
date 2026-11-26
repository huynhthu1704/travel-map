# Intent: Push notifications on the phone, through a free Cloudflare Worker

Status: Approved (by Christine, 2026-11-26)
Requested: 2026-11-26 by Christine, in chat ("resume the push notification task", chose option B: Cloudflare Workers)

## What we want
Bee There users get their notifications even when the app is closed. Today every notification (trip invite and its
answer, follow, like, comment, hidden memory, message from the team) is only seen when the user next opens the app —
0% reach while it is closed. Target: from the first release, a user who turns push notifications on gets a message on
their phone or computer within 1 minute of every notification the app already creates — still at no monthly cost.

## Business need
"The push notification allows users to receive notification in the background without needing to open the app."
Which events: "use the same trigger as current notification".

## Why
In-app notifications (REQ-125, REQ-153) only work while the app is open, so invites and reminders are missed or seen
late. Sending a push message needs a small server, which the free Firebase Spark plan does not have (ADR-001).

## Constraints
- No monthly cost: the free Cloudflare Workers plan (100,000 requests a day, scheduled jobs included); Firebase stays
  on Spark. Christine creates the Cloudflare account; the secret keys live only in Cloudflare, never in the repo.
- Standard Web Push (works in Chrome, Edge, Firefox and Android; on iPhone only after "Add to Home Screen", iOS 16.4+).
- Opt-in only: nobody gets push messages without turning them on; one switch to turn them off again.
- Behind a default-off feature flag; Super admin tries it first.
- Bilingual messages (VI + EN, in the user's language).

## Success measure
- A test user with push on receives a push message within 1 minute for each kind of in-app notification (trip invite,
  invite answer, follow, like, comment, hidden memory, team message), on Android Chrome and a desktop browser.
- Cloudflare dashboard shows usage inside the free limits; cost stays 0.

## Out of scope
- Native mobile apps; SMS or e-mail notifications.
- New kinds of notification (e.g. checklist due-day reminders): push follows the existing triggers only.
- Moving Firebase to the paid Blaze plan or using Cloud Functions.

## Requirements
- REQ-059 — Turn push notifications on or off (#112)
- REQ-060 — Every in-app notification is also sent as a push message (#113)
