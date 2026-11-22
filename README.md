# 🍯 Bee There

A web app for **marking the places you've set foot in**, saving **photo memories** at each place, planning **shared trips** with friends, and **sharing** them as cute images or videos on social media.

Live site: https://beetheremap.com/

The app's interface is in Vietnamese.

- Design system (Figma): https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ. The **🍯 Foundations** page covers colors, typography, spacing and radius. The **🧩 Components** page has Button, Chip, Map Pin and Place Card. Tokens in `src/styles/tokens.css` map one-to-one to the Figma variables.
- Primary color: honey yellow `#FFC629`. Fonts: **Lexend** for headings and **Be Vietnam Pro** for body text. Both are modern and fully support Vietnamese.

## Features

| | Feature | Login required? |
|---|---|---|
| 🗺️ | World map: visited countries are filled in yellow, with a 👣 pin at each place you've been | Viewing: no |
| 🔍 | Click a country to zoom in, see famous places, and filter by city or region. Besides a hand-picked list, up to ~100 famous places per country are loaded live from Wikidata (via the QLever endpoint), ranked by Wikipedia coverage and cached for 7 days | No |
| 🔗 | Add any place from a Google Maps link, or open the map and tap to add as many places as you like (visited or wishlist) | Save: yes |
| 🖼️ | Photos for famous places from Wikimedia Commons / Wikipedia | No |
| 🌐 | Vietnamese / English UI (flag button, Vietnamese by default); places outside Vietnam use English names | No |
| 🔎 | Search for any country, city or place (OpenStreetMap) | No |
| 💛 | Add places to your *wishlist* or mark them as *visited* | Yes |
| 🧭 | Directions: choose to open **Apple Maps** or **Google Maps** | No |
| 📸 | Upload photo memories per place, kept private or made public. Photos are compressed automatically and stored in Firestore | Yes |
| ✨ | Share studio: pick 1–4 photos and one of 4 templates (Polaroid, Postcard, Film strip, Bento) and 3 formats (Story 9:16, 4:5, 1:1). Export an animated **PNG image** or **video**. On mobile, it opens the native share sheet | Yes |
| 🌍 | *Explore* page: browse other people's public photos, filtered by country or city | No |
| 🧳 | Shared trips: create a group and invite friends by link or code. Every stop and photo is visible to the whole group and shown on the map | Yes |
| 📱 | Responsive: side panel on desktop, bottom sheet and bottom navigation bar on tablet and mobile | — |

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

### Data model

```
users/{uid}/places/{placeId}   visited / wishlist places
memories/{id}                  memories (thumbnails, caption, public/private, tripId)
memories/{id}/full/{i}         full-resolution photos
trips/{id}                     trips (memberIds, inviteCode)
trips/{id}/stops/{id}          stops and photos shared with the whole group
```

## Deployment

- **GitHub Pages**: the `.github/workflows/deploy.yml` workflow builds the app on every push to `main`. To set it up:
  1. Go to *Settings → Pages* and set *Source* to *GitHub Actions*.
  2. The Firebase web config is read from `.env.production` (committed on purpose: Firebase web config is public by design and data access is protected by `firestore.rules`).
  3. Add the site's domain (`beetheremap.com`, `www.beetheremap.com`) to Firebase *Authorized domains*.
  4. Custom domain: `public/CNAME` holds `beetheremap.com`; set the same domain in *Settings → Pages → Custom domain*. DNS: `A` records for `beetheremap.com` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and `AAAA` → `2606:50c0:8000::153` … `8003::153`), plus `CNAME www` → `huynhthu1704.github.io`.
- **Firebase Hosting**: run `npm run build && npx firebase-tools deploy --only hosting`.

## Project structure

```
src/
  AppContext.jsx          shared state, auth, login gating
  lib/store.js            data layer (Firebase / demo)
  lib/countries.js        country GeoJSON, Vietnamese names, flags
  lib/image.js            image compression
  data/places.js          hand-picked famous places by country
  lib/famousLive.js       famous places for every country from Wikidata
  i18n.jsx, lib/lang.js   Vietnamese / English translations
  components/MapView      Leaflet map and pins
  components/SidePanel    world / country / place panels
  components/ShareStudio  share images and videos (canvas + MediaRecorder)
  pages/Pages.jsx         Explore, Memories, Trips
  styles/tokens.css       design tokens (synced with Figma)
```

Stack: React 18 · Vite · Leaflet / react-leaflet · MapLibre GL (OpenFreeMap vector tiles, Latin-script labels) · Firebase (Auth, Firestore) · Nominatim · Wikidata (QLever) · Wikipedia.
