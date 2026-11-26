# Intent: Push notifications on the phone, through a free Cloudflare Worker

Status: Draft
Requested: 2026-11-26 by Christine, in chat ("resume the push notification task", chose option B: Cloudflare Workers)

## What we want
Bee There users hear about what matters to them even when the app is closed. Today a notification (trip invite,
announcement from the team, checklist item due) is only seen when the user next opens the app — 0% reach while it is
closed. Target: from the first release, a user who turns push notifications on gets a message on their phone or
computer within 1 minute of a trip invite or an announcement, and on the morning a checklist item is due — still at
no monthly cost.

## Business need
<to fill in with Christine's own words — what she wants push notifications for>

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
- A test user with push on receives the invite / announcement message within 1 minute, and the checklist reminder on
  the due day, on Android Chrome and a desktop browser.
- Cloudflare dashboard shows usage inside the free limits; cost stays 0.

## Out of scope
- Native mobile apps; SMS or e-mail notifications.
- Push for likes, follows and comments (can be added later).
- Moving Firebase to the paid Blaze plan or using Cloud Functions.

## Requirements
<filled after approval: REQ-xxx — title (#issue)>
