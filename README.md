# 🐝 Bee There

**Been there? Bee there.** Bee There (`bee.there`) is a web app for **pinning every place you've set foot in**, saving **photo memories** at each place, planning **shared trips** with friends, and **sharing** them as cute images or videos.

- Live site: https://beetheremap.com/
- Interface: Vietnamese (default) and English, switchable with the flag button.
- Brand & design system (Figma): https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ
  - **🐝 Brand & Logo**: the "honey pin" logo (horizontal, stacked and mark versions in Light / Dark / Mono), App Icon, and brand guidelines.
  - **🍯 Foundations**: colors, typography, spacing and radius. Tokens in `src/styles/tokens.css` map one-to-one to the Figma variables.
  - **🧩 Components**: Button, Chip, Map Pin, Place Card.
- Colors: Honey 400 `#FFC629` (primary), Honey 700 `#A87400`, Ink 900 `#1F1A14`, Cream `#FFFCF5`. Fonts: **Lexend** (logo and headings) and **Be Vietnam Pro** (body), both with full Vietnamese support.
- Logo files: `src/components/Brand.jsx` (header mark), `public/favicon.svg` (App Icon), `public/apple-touch-icon.png`, `public/icon-512.png`.

## Features

### 🗺️ Map & discovery
- World map: visited countries are filled in honey yellow, with a 👣 pin at each place you've been.
- Click a country to zoom in, see its famous places and filter by city or region. Besides a hand-picked list, up to ~100 famous places per country load live from Wikidata (QLever), ranked by Wikipedia coverage and cached for 7 days.
- Add places from a Google Maps link, by tapping the map, or by searching any country, city or place (OpenStreetMap).
- Mark places as *visited* or add them to your *wishlist*; open directions in Apple Maps or Google Maps.
- "Most checked-in places" on the home panel.

### 📸 Memories & sharing
- Photo check-ins per place (private or public). Photos are compressed in the browser and stored in Firestore in 3 sizes, loaded according to network speed.
- **Share studio**: 1–4 photos, 4 templates (Polaroid, Postcard, Film strip, Bento), 3 formats (Story 9:16, 4:5, 1:1), exported as an image or video.
- **Recap**: year / trip recap images and videos.
- **Explore**: everyone's public check-ins by country or city, with likes.

### 👥 Social
- Profiles with @usernames, follow and a friends feed, likes.
- In-app notifications (trip invites, follows, announcements from the team).

### 🧳 Trips
- Shared trips with friends: invite by link, code or @username (invitees must accept).
- Day-by-day **plan**, **costs & splitting** (multi-currency with live rates), shared and personal **checklists**.
- Export or share the plan as **PDF**; duplicate an existing trip.

### 📖 Guides & tips
- Guides for 12 Asian countries: where to go (add a spot straight into a trip), local food by city, phrases with native script and a 🔊 listen button, money, power plugs, emergency numbers with tap-to-call, useful Google Maps links.
- **Sample trip cost calculator**: days, people and budget level → estimated costs in VND and the local currency, then apply them to a trip.
- Country travel tips from the community, with votes and Q&A.

### 🎒 Travel gear
- Gear ideas by trip type and purpose, with shop links (some are affiliate links, clearly disclosed).
- Reachable from the top navigation (desktop), the Guides page, a trip's Checklist tab and the home quick links.

### ℹ️ Help & onboarding
- About page with real screenshots, a quick tour (opens automatically after a new account's first sign-in), FAQ, What's new, feedback / bug report tab, support-the-creator page.
- Privacy Policy, Terms of Use, consent screen, "Download my data" and account deletion.

### 🛠️ Admin
Admin area (`#/admin`) with modules shown by permission:
- **Insights** (usage stats), **Content** moderation and reports, **Feedback** inbox, **Places** (overrides and custom places), **Guides** editor and guide links, **Tips**, **Trips**.
- **Announcements**: scheduled banners with templates and duplicate; users who close a banner don't see it again.
- **Notifications**: send to everyone, a role or chosen users; history, revoke, and a received/read report exportable to Excel.
- **Ads** (sample ad slots by placement), **Gear** catalog, **Features** (feature flags), **Settings**, **Logs** (admin audit log).
- **Roles & permissions**: Admin, Editor, Moderator, Marketing presets plus custom roles; Admin always has every permission.

### 🚩 Feature flags
New features ship **off by default** (only the owner sees them) and are released in *Admin → Features*. The registry is `src/data/flags.js` (`FLAGS`); check a flag in components with `can('key')`. Flags with a `value` field appear automatically on the About page.

### 📱 Platform
- Responsive: side panel on desktop; bottom sheet and bottom navigation on tablet and mobile; pull to refresh on phones.
- Service worker for near-instant reopening; installable as an app (web app manifest).
- SEO: descriptive title and meta description, Open Graph / Twitter cards (`public/og-image.png`), JSON-LD, `robots.txt`, `sitemap.xml`, and static crawlable text in `index.html`.
- Runs entirely on the free **Firebase Spark** plan.

## Getting started

```bash
npm install
npm run dev
```

Without any configuration, the app runs in **demo mode**: login is simulated and data is stored in `localStorage`.

## Connecting Firebase (Google login and real storage)

1. Create a project at https://console.firebase.google.com and add a **Web app**.
2. Go to **Authentication** → Sign-in method and enable **Google**. Add your deployment domain under *Authorized domains*.
3. Create a **Firestore Database**. The current project uses `asia-southeast1` (Singapore).
4. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values. The `travel-map-e9657` project already has a Web app named `travel-map-web`.
5. Deploy the security rules: paste `firestore.rules` into Firestore → Rules → Publish, or run `npx firebase-tools deploy --only firestore:rules`.

> Photos are compressed and stored directly in Firestore, so the app runs on the **free Spark plan**. Firebase Storage and the Blaze plan are not needed. Thumbnails live in the memory document and full-size photos in `memories/{id}/full/{i}`. Free quota: 1 GiB of data (roughly 3,000–5,000 photos) and 50,000 reads per day.

### Data model (Firestore)

```
users/{uid}/places/{placeId}       visited / wishlist places
profiles/{uid}, usernames/{name}   public profiles and @usernames
memories/{id}                      check-ins (thumbnails, caption, public/private, tripId)
memories/{id}/mid|full/{i}         medium and full-size photos
memories/{id}/likes|comments       likes and comments
follows/{id}, feeds/{uid}          follow graph and friends feed
trips/{id}                         trips (memberIds, inviteCode)
trips/{id}/stops|plan|costs|checklists|files   trip content shared with the group
tripInvites/{id}, inviteCodes/{code}           invitations
notifications/{id}, broadcasts/{id}            in-app notifications and send history
countryPosts/{id}                  country travel tips (votes, comments)
guideOverrides/{cc}, guideLinks/{id}, gearItems/{id}   staff-managed guide and gear content
placeOverrides/{id}, customPlaces/{id}         staff-managed place data
settings/{id}                      site settings, feature flags, roles, announcements, ads
feedback/{id}, reports/{id}, adminLogs/{id}, stats/{id}
```

## Deployment

- **GitHub Pages**: the `.github/workflows/compass-deploy.yml` workflow builds the app on every push to `main` (CI checks run in `compass-ci.yml`). To set it up:
  1. Go to *Settings → Pages* and set *Source* to *GitHub Actions*.
  2. The Firebase web config is read from `.env.production` (committed on purpose: Firebase web config is public by design and data access is protected by `firestore.rules`).
  3. Add the site's domain (`beetheremap.com`, `www.beetheremap.com`) to Firebase *Authorized domains*.
  4. Custom domain: `public/CNAME` holds `beetheremap.com`; set the same domain in *Settings → Pages → Custom domain*. DNS: `A` records for `beetheremap.com` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and `AAAA` → `2606:50c0:8000::153` … `8003::153`), plus `CNAME www` → `huynhthu1704.github.io`.
- **Firebase Hosting**: run `npm run build && npx firebase-tools deploy --only hosting`.

## Project structure

```
src/
  App.jsx                 app shell, header, navigation, announcement banner
  AppContext.jsx          shared state, auth, roles, feature flags
  components/Brand.jsx    bee.there logo
  lib/store.js            data layer (Firebase / demo)
  lib/social.js           profiles, follows, likes, notifications
  lib/adminStore.js       admin data (settings, guides, gear…)
  lib/roles.js            roles and permissions
  lib/exportPlan.js       trip plan PDF
  data/flags.js           feature flags
  data/guides*.js         guide content (spots, food, phrases, costs…)
  data/places.js          hand-picked famous places by country
  lib/famousLive.js       famous places from Wikidata
  i18n.jsx                Vietnamese / English translations
  components/MapView      Leaflet / MapLibre map and pins
  components/SidePanel    world / country / place panels
  components/ShareStudio  share images and videos (canvas + MediaRecorder)
  pages/                  Explore, Memories, Trips, Guide, Tips, Gear, Profile, About, Admin, Legal
  styles/tokens.css       design tokens (synced with Figma)
firestore.rules           security rules
```

Stack: React 18 · Vite · Leaflet / react-leaflet · MapLibre GL (OpenFreeMap vector tiles) · Firebase (Auth, Firestore) · Nominatim · Wikidata (QLever) · Wikipedia · jsPDF · write-excel-file.
