# Travel Map — Product metrics

This document defines the metrics shown on **Admin → Insights** (`src/pages/AdminInsights.jsx`) and the queries behind them.

## Data sources

| Source | What it holds | Who writes it |
|---|---|---|
| `users/{uid}` | `createdAt`, `lastLoginAt`, `role`, `banned` | The app, on every sign-in (`adminApi.upsertProfile`) |
| `users/{uid}.stats` | Per-user activity summary (see below) | The user's own browser, after their data loads (`AppContext`, debounced, only when it changes) |
| `trips/{id}` | `createdAt`, `memberIds`, `destinations[{cc, city}]` | Trip members |
| `trips/*/plan`, `trips/*/costs`, `trips/*/checklists` | Feature usage inside trips | Trip members |
| `memories` (public only), `reports` | Public content and moderation | Users / staff |

`users/{uid}.stats`:

```js
{
  visited, wishlist,          // number of saved places by status
  countries: ['VN', 'SG'],    // countries visited (places + check-ins)
  memories, publicMemories,   // check-ins (memories) total / public
  photos,                     // photos uploaded
  trips, tripsOwned, groupTrips, // trips joined / created / with ≥ 2 members
  firstCheckinAt,             // ms timestamp of the first check-in
  lastActionAt,               // ms timestamp of the last save / check-in
  updatedAt
}
```

**Why stats live on the profile:** private memories and places are only readable by their owner (Firestore rules). The client computes a small, non-sensitive summary so admins can aggregate behaviour **without reading anyone's private content**. Stats refresh the next time each user opens the site, so profiles of users who have not returned since this feature shipped have no `stats` yet (the dashboard shows how many profiles have stats).

## Metric definitions

### North Star
| Metric | Definition | Formula |
|---|---|---|
| **Weekly active travellers (WAT)** | Users who saved a place or checked in during the last 7 days | `count(users where now − stats.lastActionAt < 7d)` |

WAT measures the core value (recording travel), not just visits.

### Growth
| Metric | Definition |
|---|---|
| Total users | `count(users)` |
| New users 7d / 30d | `count(users where now − createdAt < 7d / 30d)` |
| DAU / WAU / MAU | `count(users where now − lastLoginAt < 1d / 7d / 30d)` |
| Stickiness | `DAU ÷ MAU` |
| Sign-ups per week | Users grouped by Monday-starting week of `createdAt`, last 12 weeks |

### Activation funnel (share of all sign-ups)
1. Signed up — every user doc
2. Saved ≥ 1 place — `stats.visited + stats.wishlist > 0`
3. Checked in ≥ 1 — `stats.memories > 0`
4. Has a trip — `stats.trips > 0`
5. Group trip — `stats.groupTrips > 0`

**Time to first check-in (median):** `median(stats.firstCheckinAt − createdAt)` in days.

### Retention (by sign-up week)
For each of the last 8 complete sign-up weeks: the share of that cohort whose `lastLoginAt − createdAt ≥ 1 / 7 / 30 days`.
This is an approximation that relies on `lastLoginAt` only (no event log): "came back at least N days after signing up". A cell shows "…" until the cohort is old enough.

### Engagement (per *active user* = has ≥ 1 visited place or check-in)
| Metric | Formula |
|---|---|
| Places visited | `Σ stats.visited`, average per active user |
| Check-ins | `Σ stats.memories`, average per active user |
| Photos uploaded | `Σ stats.photos` |
| Public check-ins | `Σ stats.publicMemories ÷ Σ stats.memories` |
| Countries per active user | `avg(len(stats.countries))` |

### Trips & collaboration
| Metric | Formula |
|---|---|
| Trips | `count(trips)` (server-side count) |
| Trips created in 30d | `count(trips where now − createdAt < 30d)` |
| Group trips | `count(trips where len(memberIds) ≥ 2) ÷ count(trips)` |
| Avg members / trip | `avg(len(memberIds))` |
| Plan items / cost entries / checklists | Collection-group counts; also shown per trip |
| Open reports | `count(reports where status == 'open')` |

### Destinations
- **Most visited countries:** number of users with the country in `stats.countries`.
- **Trip destinations:** count of `trips.destinations[].cc`.

## Queries (Firebase Web SDK v10+)

Server-side counts (no documents downloaded, billed as 1 read per 1,000 matched docs):

```js
import { getCountFromServer, collection, collectionGroup, query, where } from 'firebase/firestore';

const count = async (q) => (await getCountFromServer(q)).data().count;

await count(collection(db, 'trips'));                                          // trips
await count(collectionGroup(db, 'plan'));                                      // plan items
await count(collectionGroup(db, 'costs'));                                     // cost entries
await count(collectionGroup(db, 'checklists'));                                // checklists
await count(query(collection(db, 'memories'), where('visibility', '==', 'public'))); // public memories
await count(query(collection(db, 'reports'), where('status', '==', 'open')));       // open reports
```

User-level metrics read the `users` collection once (small docs) and compute in the browser — see `computeInsights(users, trips)` in `AdminInsights.jsx`. Example for DAU:

```js
const users = (await getDocs(collection(db, 'users'))).docs.map((d) => d.data());
const dau = users.filter((u) => Date.now() - u.lastLoginAt < 864e5).length;
```

When the user base grows (≫ 10k), switch the heavy ones to server counts, for example:

```js
// MAU without downloading users
await count(query(collection(db, 'users'), where('lastLoginAt', '>=', Date.now() - 30 * 864e5)));
// Weekly active travellers
await count(query(collection(db, 'users'), where('stats.lastActionAt', '>=', Date.now() - 7 * 864e5)));
```

## Optional: BigQuery SQL

If the Firestore → BigQuery export extension is enabled later (requires the Blaze plan), the same metrics as SQL on the `users_raw_latest` view (`data` is the JSON document):

```sql
-- DAU / WAU / MAU
SELECT
  COUNTIF(TIMESTAMP_MILLIS(CAST(JSON_VALUE(data, '$.lastLoginAt') AS INT64)) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY))  AS dau,
  COUNTIF(TIMESTAMP_MILLIS(CAST(JSON_VALUE(data, '$.lastLoginAt') AS INT64)) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY))  AS wau,
  COUNTIF(TIMESTAMP_MILLIS(CAST(JSON_VALUE(data, '$.lastLoginAt') AS INT64)) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)) AS mau
FROM `travel-map-e9657.firestore_export.users_raw_latest`;

-- Activation funnel
SELECT
  COUNT(*) AS signed_up,
  COUNTIF(CAST(JSON_VALUE(data, '$.stats.visited') AS INT64) + CAST(JSON_VALUE(data, '$.stats.wishlist') AS INT64) > 0) AS saved_place,
  COUNTIF(CAST(JSON_VALUE(data, '$.stats.memories') AS INT64) > 0) AS checked_in,
  COUNTIF(CAST(JSON_VALUE(data, '$.stats.trips') AS INT64) > 0) AS has_trip,
  COUNTIF(CAST(JSON_VALUE(data, '$.stats.groupTrips') AS INT64) > 0) AS group_trip
FROM `travel-map-e9657.firestore_export.users_raw_latest`;

-- Weekly sign-up cohorts with "came back after ≥ 7 days"
SELECT
  DATE_TRUNC(DATE(TIMESTAMP_MILLIS(CAST(JSON_VALUE(data, '$.createdAt') AS INT64))), WEEK(MONDAY)) AS cohort_week,
  COUNT(*) AS users,
  SAFE_DIVIDE(COUNTIF(CAST(JSON_VALUE(data, '$.lastLoginAt') AS INT64) - CAST(JSON_VALUE(data, '$.createdAt') AS INT64) >= 7 * 86400000), COUNT(*)) AS returned_d7
FROM `travel-map-e9657.firestore_export.users_raw_latest`
GROUP BY cohort_week
ORDER BY cohort_week DESC
LIMIT 12;

-- Most visited countries (number of users)
SELECT cc, COUNT(*) AS users
FROM `travel-map-e9657.firestore_export.users_raw_latest`,
UNNEST(JSON_VALUE_ARRAY(data, '$.stats.countries')) AS cc
GROUP BY cc
ORDER BY users DESC
LIMIT 10;
```

## Known limits / next steps
- Retention is approximate (last sign-in only). For exact D1/D7/D30 retention and feature funnels, add an event log (for example Google Analytics 4, free) with events `sign_up`, `place_saved`, `check_in`, `trip_created`, `trip_joined`, `plan_item_added`, `cost_added`, `recap_exported`, `share_image_exported`.
- Stats appear for a user only after they open the site once with this version.
