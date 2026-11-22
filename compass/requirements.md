# Requirements

_Generated from `spec.json`. REQ-101 and up are the baseline: features built before Compass was installed (reconstructed 2026-11-23)._

| ID | Title | Priority | Status | Tests |
|---|---|---|---|---|
| REQ-001 | View-only trip members and copying a trip | Should | In build | TC-001, TC-002, TC-003, TC-004 |
| REQ-002 | Estimated vs actual cost comparison | Should | In build | TC-005, TC-006, TC-009 |
| REQ-003 | Reorder costs by drag and drop | Could | Done | TC-007, TC-008, TC-009, TC-011 |
| REQ-004 | Combined cost table: estimate, actual and difference in one table | Should | In build | TC-010, TC-011, TC-012, TC-033 |
| REQ-005 | Highlight the selected place on the map | Should | In build | TC-013, TC-014 |
| REQ-006 | Estimated costs for picked people | Should | In build | TC-015, TC-016 |
| REQ-007 | View-only trip link for non-members | Should | In build | TC-022, TC-023, TC-024 |
| REQ-008 | Reliable cost ordering and an easier way to sort | Must | In build | TC-017, TC-018, TC-021 |
| REQ-009 | Costs PDF matches the web table and current order | Must | In build | TC-019, TC-021, TC-025 |
| REQ-010 | Correct cost summary | Must | In build | TC-020, TC-021 |
| REQ-011 | Faster page loading | Must | In build | TC-026, TC-027 |
| REQ-012 | Journey hides places removed from the trip plan | Must | In build | TC-028, TC-029 |
| REQ-013 | About page: group related features, important first | Could | In build | TC-030 |
| REQ-014 | Trip header shows length and the right place count | Should | In build | TC-031 |
| REQ-015 | Faster first paint: non-blocking CSS and CSS per page | Should | Done | TC-032 |
| REQ-017 | Journey shows the itinerary date for visited places | Must | Done | TC-034 |
| REQ-018 | Admin can fix the location of famous places with a Google Maps link | Should | Done | TC-035 |
| REQ-019 | Edit the text of a checklist item | Should | Done | TC-036 |
| REQ-020 | Journey shows the check-in date the user entered | Must | Done | TC-037 |
| REQ-021 | Admin-corrected coordinates apply everywhere | Must | Done | TC-038 |
| REQ-022 | Directions open the Google Maps link the admin attached | Should | Done | TC-039 |
| REQ-101 | Sign in with Google | Must | Done | TC-101 |
| REQ-102 | Consent, privacy policy and terms | Must | Done | TC-101 |
| REQ-103 | Download my data and delete my account | Must | Done | TC-101 |
| REQ-104 | Profile, display name, @username and avatar | Must | Done | TC-101 |
| REQ-105 | Vietnamese and English interface | Must | Done | TC-101 |
| REQ-106 | Responsive layout for desktop, tablet and phone | Must | Done | TC-101 |
| REQ-107 | Installable app with fast reopening | Must | Done | TC-101 |
| REQ-108 | Links keep the current page | Must | Done | TC-101 |
| REQ-109 | Search engine and link-preview friendly | Should | Done | TC-101 |
| REQ-110 | Custom domain over HTTPS | Must | Done | TC-101 |
| REQ-111 | World map of visited countries | Must | Done | TC-102 |
| REQ-112 | Country view with famous places | Must | Done | TC-102 |
| REQ-113 | Add places by search, map tap or Google Maps link | Must | Done | TC-102 |
| REQ-114 | Visited and wishlist lists | Must | Done | TC-102 |
| REQ-115 | Directions to a place | Must | Done | TC-102 |
| REQ-116 | Home panel: overview, popular places, quick links | Should | Done | TC-102 |
| REQ-117 | Show a trip on the map | Must | Done | TC-102 |
| REQ-118 | Photo check-ins | Must | Done | TC-103 |
| REQ-119 | Edit and delete check-ins | Must | Done | TC-103 |
| REQ-120 | Memories page | Must | Done | TC-103 |
| REQ-121 | Share studio | Must | Done | TC-103 |
| REQ-122 | Year and trip recap | Should | Done | TC-103 |
| REQ-123 | Explore public check-ins | Must | Done | TC-104 |
| REQ-124 | Follow, friends feed and likes | Should | Done | TC-104 |
| REQ-125 | In-app notifications | Must | Done | TC-104 |
| REQ-126 | Create and manage shared trips | Must | Done | TC-105 |
| REQ-127 | Invite members | Must | Done | TC-105 |
| REQ-128 | Day-by-day plan | Must | Done | TC-105 |
| REQ-129 | Journey | Must | Done | TC-105 |
| REQ-130 | Costs and settle-up | Must | Done | TC-105 |
| REQ-131 | Checklists | Must | Done | TC-105 |
| REQ-132 | Plan PDF export | Should | Done | TC-105 |
| REQ-133 | Duplicate a trip | Should | Done | TC-105 |
| REQ-134 | Country guides | Must | Done | TC-106 |
| REQ-135 | Phrases with listen button | Should | Done | TC-106 |
| REQ-136 | Add guide places to a trip | Should | Done | TC-106 |
| REQ-137 | Local food by city | Could | Done | TC-106 |
| REQ-138 | Sample trip cost calculator | Could | Done | TC-106 |
| REQ-139 | Useful Google Maps links in guides | Could | Done | TC-106 |
| REQ-140 | Country travel tips | Should | Done | TC-106 |
| REQ-141 | Travel gear page | Could | Done | TC-106 |
| REQ-142 | About page with auto-updating features | Should | Done | TC-107 |
| REQ-143 | Quick tour | Must | Done | TC-107 |
| REQ-144 | Feedback and bug reports | Should | Done | TC-107 |
| REQ-145 | FAQ, What's new and Support the creator | Could | Done | TC-107 |
| REQ-146 | Site announcements | Must | Done | TC-107 |
| REQ-147 | Roles and permissions | Must | Done | TC-108 |
| REQ-148 | Feature flags | Must | Done | TC-108 |
| REQ-149 | Insights and audit log | Should | Done | TC-108 |
| REQ-150 | Content moderation and reports | Must | Done | TC-108 |
| REQ-151 | Places management | Must | Done | TC-108 |
| REQ-152 | Guides, tips, trips, gear and ads management | Should | Done | TC-108 |
| REQ-153 | Send notifications | Should | Done | TC-108 |

## REQ-001 — View-only trip members and copying a trip

Trip owners can make an invited member view-only. View-only members see the plan, costs and shared checklists but cannot change them, and can copy the trip to their own account to plan it themselves.

- **Given** I own a trip with an accepted member, **when** I open Members & invites and set that member to View only, **then** the member is stored in trips.viewerIds and shows as 'View only' in the member list.
- **Given** I am a view-only member of a trip, **when** I open the trip, **then** I see a view-only banner, and controls to add, edit, reorder, tick or delete plan items, costs and shared checklist items are hidden or disabled.
- **Given** I am a view-only member, **when** I try to write plan items, costs, shared checklists or trip details (UI or API), **then** Firestore security rules reject the write.
- **Given** I am a view-only member, **when** I tap 'Copy this trip' and confirm, **then** a new trip owned by me is created with the plan, checklists and estimated costs I chose, and I can edit it.
- **Given** I am the trip owner, **when** anyone tries to make me view-only, **then** I keep full edit rights.

## REQ-002 — Estimated vs actual cost comparison

Show estimated and actual costs side by side in one view so members can see the difference per item and spot costs that were not in the original estimate.

- **Given** a trip has estimated costs and actual costs recorded from them, **when** I open the Costs tab, **then** a 'Estimated vs actual' card lists each estimate with its estimated amount, actual amount, and the difference marked over / under / on budget, with bars to compare.
- **Given** an estimate has no actual cost linked yet, **when** I view the comparison, **then** it shows 'Not spent yet' and is counted in the 'not spent yet' note, not as a saving.
- **Given** some actual costs are not linked to any estimate (or their estimate was deleted), **when** I view the comparison, **then** they are listed under 'Not in the estimate' with their total, sorted by date.
- **Given** the comparison is shown, **when** I look at the footer, **then** I see total estimated, total actual including extras, and the overall difference.

## REQ-003 — Reorder costs by drag and drop

Members who can edit a trip can change the order of estimated and actual costs by dragging, and the order is saved for the whole group.

- **Given** I can edit the trip, **when** I hold the ⠿ handle of a cost and drag it up or down (mouse or touch), or press ↑ / ↓ on the handle, **then** the cost moves to the new position and the new order is saved for everyone.
- **Given** costs have never been reordered, **when** I open the Costs tab, **then** estimates keep the order they were added and actual costs are sorted by date.
- **Given** I am a view-only member, **when** I open the Costs tab, **then** no drag handles are shown.

## REQ-004 — Combined cost table: estimate, actual and difference in one table

Replace the separate Estimated and Actual tables with one table where each cost item shows its estimate, actual spend and difference on the same row. Users can add a cost with the estimate, the actual, or both at once, and record the actual later. Unplanned actual costs appear in the same table, marked. Field sets for estimate and actual stay the same.

- **Given** I can edit a trip, **when** I tap 'Add a cost' and fill the estimate and/or the 'Already paid' part, **then** one estimate and/or one actual cost is saved; if both, the actual is linked to the estimate.
- **Given** a cost item has an estimate only, **when** I tap 🧾 on its row and save the actual amount, **then** the actual is linked to that item and the row shows estimate, actual and difference.
- **Given** an item has one or more actual payments, **when** I view the table, **then** the row shows the total actual, the difference (over in red, under in green) and each payment underneath with date, who paid and who shares it.
- **Given** an actual cost is not linked to any estimate, **when** I view the table, **then** it appears as its own row tagged 'Unplanned' with no estimate and a + difference.
- **Given** the table has rows, **when** I look at the last row, **then** I see total estimate, total actual and total difference, plus notes for unplanned and not-yet-spent amounts.
- **Given** I am a view-only member, **when** I view the table, **then** I see all values but no add, edit, delete or drag controls.

## REQ-005 — Highlight the selected place on the map

When a place is selected (place panel open), its pin stands out so users can tell which of dozens of pins they are looking at.

- **Given** the map shows many pins, **when** I open a place (from the map, search, a list or a trip plan), **then** its pin is larger, has a honey ring and a gently pulsing glow, and shows the place name in a label.
- **Given** the selected place is a famous place inside a cluster, **when** I open it, **then** its highlighted pin is shown on its own and not hidden in the cluster.
- **Given** a place is selected, **when** I close the place panel or open another place, **then** the highlight moves to the new place or disappears.
- **Given** my device asks for reduced motion, **when** a place is selected, **then** the glow does not animate.

## REQ-006 — Estimated costs for picked people

Besides 'Group' and 'Per person', an estimated cost can apply to picked people only (e.g. a side tour two of four members join). The amount is either a total split between them or per picked person.

- **Given** I add or edit an estimated cost, **when** I choose 'Pick people', select members and choose 'Total' or 'Per person', **then** the estimate is saved with those members (splitAmong) and the hint shows the per-person share or the total for them.
- **Given** 'Pick people' is chosen, **when** no member is selected, **then** I cannot save and see 'Pick at least one person'.
- **Given** an estimate applies to picked people, **when** I view the cost tables and the PDF, **then** its group total counts only the picked people, the label lists their names, and 'Estimated / person' shows the group average.
- **Given** an estimate applies to picked people, **when** I record its actual cost (🧾 or 'Already paid'), **then** the actual form is pre-filled to split between the same people.

## REQ-007 — View-only trip link for non-members

The trip owner can turn on a view-only link so anyone with it (signed in or not) can view the plan and shared checklists, and costs if the owner allows, without joining the trip.

- **Given** I own a trip, **when** I open Members & invites → Code / link and turn on 'Anyone with the link can view', **then** the trip gets publicView and I can copy the view-only link.
- **Given** the link is on, **when** someone who is not a member (or not signed in) opens it, **then** they see the trip header, Plan and shared Checklists (Costs only if 'Also show costs' is on) with a 'shared trip' banner, and no edit, member, invite, map, recap or Journey controls.
- **Given** I view a shared trip by link, **when** I tap 'Copy this trip', **then** I am asked to sign in if needed and then get my own editable copy.
- **Given** the owner turns the link off, **when** someone opens the link, **then** they can no longer see the trip.
- **Given** the link is on, **when** anyone tries to list trips, read the journey/photos, personal checklists, or write anything, **then** Firestore rules deny it.

## REQ-008 — Reliable cost ordering and an easier way to sort

Fix drag-and-drop ordering of costs (rows jumped back or stopped following the pointer) and add easier options: ↑/↓ buttons on each row and a Sort menu (group order, date paid, amount, most over budget, name) that can be saved as the group order.

- **Given** I can edit a trip and the table is in group order, **when** I drag a row by ⠿ (mouse or touch) or tap ↑ / ↓, **then** the row moves, stays in its new place without jumping back, and the order is saved for the group in one write.
- **Given** the cost table has several rows, **when** I choose Sort by date, amount, most over budget or name, **then** the table re-sorts on my device only, drag handles and ↑ ↓ are hidden, and a hint explains it.
- **Given** I sorted the table by something other than group order, **when** I tap 'Save as group order', **then** that order becomes the group order for everyone and the menu returns to 'Group order'.
- **Given** I am a view-only member, **when** I open the table, **then** I can change my view sort but cannot reorder or save the group order.

## REQ-009 — Costs PDF matches the web table and current order

The costs PDF uses one table like the web (item, estimate, actual, difference, payments under each item, unplanned rows marked) and follows the exact order currently shown on screen, using the latest data.

- **Given** I am on the Costs tab, **when** I tap Export PDF or Share PDF, **then** the PDF shows a single table with Item, Estimate, Actual and Difference, each item's payments listed under it, unplanned costs marked, and a totals row.
- **Given** I reordered or sorted the table, **when** I export the PDF, **then** rows appear in the same order as on screen.
- **Given** a cost was just added or edited, **when** I export the PDF, **then** the PDF includes the latest values.
- **Given** a cost title contains arrows such as 'SGN → SIN', **when** I export the costs PDF (or the plan PDF), **then** the arrows appear in the PDF instead of disappearing.

## REQ-010 — Correct cost summary

The summary cards no longer subtract unspent estimates from the difference. Cards: estimated for the group (with per-person average), actually spent (incl. unplanned), difference on spent items, and estimated but not spent yet.

- **Given** some estimates have no actual cost yet, **when** I view the summary, **then** 'Difference (spent items)' compares actual spend with the estimates of the items already paid plus unplanned costs, and the unspent estimates are shown separately as 'Estimated, not spent yet'.
- **Given** the PDF is exported, **when** I read its summary and totals row, **then** they use the same numbers as the web.

## REQ-011 — Faster page loading

Pages load too slowly on phones. Load the map only when the Map page is opened, load the English dictionary only for English users, stop loading the profile page at start-up, defer detailed country borders, render long photo grids progressively, and render map pins in the background.

- **Given** I open Trips, Guides, Explore, Memories or About, **when** the page loads, **then** the map code (Leaflet, MapLibre, country borders) is not downloaded.
- **Given** my language is Vietnamese, **when** the site loads, **then** the English dictionary is not downloaded; switching to English downloads it first and then switches.
- **Given** Explore or Memories has many photos, **when** I open it, **then** about 24 cards render first and more render as I scroll.
- **Given** the mobile Lighthouse test (4G) is run on Trips, Guides, Explore and About, **when** compared with the baseline, **then** Largest Contentful Paint and Total Blocking Time are lower than before (baseline: LCP 6.5–7.1 s, TBT 0.6–1.2 s).

## REQ-012 — Journey hides places removed from the trip plan

Places deleted from the trip plan kept appearing in the Journey tab, the stop count and the trip recap (and looked like they came back). The Journey now hides places whose plan items were all removed; adding the place again shows it again. No check-in data is deleted.

- **Given** a place was checked in for the trip and later deleted from the Plan, **when** I open the trip, **then** it no longer appears in Journey, the stop count or the trip recap.
- **Given** I add that place to the plan again, **when** I open Journey, **then** it appears again.
- **Given** I duplicate the trip, **when** the copy is created, **then** places deleted from the original plan are not copied.

## REQ-013 — About page: group related features, important first

In 'And there's more', features are grouped (Travel together, Costs & splitting, Guides & packing, Map & discovery, Handy extras) with the most important first in each group, instead of newest first.

- **Given** I open the About page, **when** I scroll to 'And there's more', **then** features appear under group headings, related features side by side, the most important first.
- **Given** a new feature is not yet assigned to a group, **when** it is released, **then** it still appears, in the last group.

## REQ-014 — Trip header shows length and the right place count

Link viewers saw '0 stops' because they cannot read the Journey. The header now shows the trip length (days/nights) for everyone, the number of planned places for link viewers, and the Journey stop count for members.

- **Given** a trip has start and end dates, **when** anyone opens it, **then** the header shows e.g. '🌙 5 days 4 nights'.
- **Given** I view a trip by its view-only link, **when** I look at the header, **then** I see '📍 N places' from the plan instead of '0 stops'.
- **Given** I am a member, **when** I look at the header, **then** I still see the Journey stop count.

## REQ-015 — Faster first paint: non-blocking CSS and CSS per page

Pages still felt slow. (C) The main stylesheet no longer blocks the first paint: the boot screen (inline CSS) shows at once while the CSS loads in parallel, and the app renders once it is ready. (D) Styles used by only one area (admin, about, guides, gear, tips, legal, profile, trips, share studio, feedback, map) move into their own CSS files that load with that area's code, so the shared stylesheet is much smaller.

- **Given** I open any page, **when** the HTML arrives, **then** the boot screen paints without waiting for the main CSS file.
- **Given** the main CSS has not finished loading, **when** the app is about to render, **then** it waits for the CSS (max 4s) so I never see an unstyled page.
- **Given** I open a page such as Guides or About, **when** it loads, **then** only the shared CSS plus that page's CSS are downloaded, and the page looks the same as before.

## REQ-017 — Journey shows the itinerary date for visited places

Places ticked as visited from the plan showed the day they were ticked (e.g. 22/11) instead of the day in the itinerary. The Journey now shows, for each stop: the memory's date for check-ins with photos; the plan date for places that are in the plan; otherwise the saved date. It is ordered by that date, newest first. Works for existing data without any migration.

- **Given** a place in the plan for 18/11 was ticked visited on 22/11, **when** I open the Journey, **then** it shows 18/11.
- **Given** a check-in memory dated 17/11, **when** I open the Journey, **then** it shows 17/11.
- **Given** stops with different dates, **when** I open the Journey, **then** they are ordered by the shown date, newest first.

## REQ-018 — Admin can fix the location of famous places with a Google Maps link

In Admin → Places, the Google Maps link box and latitude/longitude were only shown for places the team added. Famous places (curated list / Wikidata) could not be moved when their pin was wrong. The editor now shows the link box and coordinates for every place; moved coordinates are saved in the place override and the map uses them.

- **Given** I edit a famous place such as Ha Long Bay, **when** I paste a Google Maps link and press Find, **then** the latitude and longitude fill in.
- **Given** I save with new coordinates, **when** anyone opens the map, **then** the pin shows at the new place.
- **Given** I reset the place's edits, **when** the map reloads, **then** the original location is used again.

## REQ-019 — Edit the text of a checklist item

Members can change the wording of a checklist item when plans change instead of deleting and re-adding it. Tap ✏️ (or double-click the text), Enter or click away to save, Esc to cancel. Ticks, who-ticked and the item's scope are kept. View-only members cannot edit shared lists. Behind the flag checkEdit.

- **Given** a checklist item 'Mua eSIM', **when** I tap ✏️, type 'Mua eSIM Singapore' and press Enter, **then** the item shows the new text for everyone and stays ticked if it was ticked.
- **Given** I am editing an item, **when** I press Esc or clear the text, **then** nothing changes.
- **Given** I am a view-only member, **when** I open a shared checklist, **then** I do not see ✏️.

## REQ-020 — Journey shows the check-in date the user entered

Check-ins with photos showed the upload day (e.g. 18/11) instead of the check-in date the user entered, because trip stops were saved without a date and were not updated when a check-in was edited. Now: stops save the check-in date; editing a check-in's date, caption or trip replaces my stop in the Journey; and the Journey uses the date of my own check-ins directly, so existing stops show the right date at once.

- **Given** I checked in at Chinatown with date 10/11 but uploaded on 18/11, **when** I open the trip's Journey, **then** it shows 10/11.
- **Given** I change a check-in's date to 11/11, **when** anyone in the trip opens the Journey, **then** it shows 11/11.
- **Given** I move a check-in to another trip, **when** I open both Journeys, **then** it appears only in the new trip.

## REQ-021 — Admin-corrected coordinates apply everywhere

After REQ-018 an admin could fix a place's coordinates, but only the famous-places list used them. Saved places (visited / wishlist), check-ins, the open place, trip stops and plan items, map fly-to and Directions still used the old coordinates. Now all of them use the corrected coordinates.

- **Given** an admin moved Ha Long Bay with a Google Maps link, **when** I open Ha Long Bay from the map, my visited places, a check-in or a trip plan, **then** the pin and the map zoom use the new location.
- **Given** the same place, **when** I tap Directions, **then** Google / Apple Maps open with the new coordinates.
- **Given** the admin resets the place, **when** the map refreshes, **then** the original location is used again.

## REQ-022 — Directions open the Google Maps link the admin attached

When Google Maps receives bare coordinates it labels the destination with the nearest named point (e.g. 'Ramayana Cave' for Batu Caves). When an admin fixes a place with a Google Maps link (Find place), the link is saved with the place; Directions → Google Maps then opens that exact place page (name, photos, Directions button). Clearing the link box removes it. Only https Google Maps links are accepted.

- **Given** an admin pasted the Google Maps link of Batu Caves, pressed Find place and saved, **when** a user taps Directions → Google Maps on Batu Caves (from the map, a saved place or a trip), **then** Google Maps opens the Batu Caves page.
- **Given** the admin clears the link box and saves, **when** a user taps Directions, **then** Google Maps opens with the coordinates as before.
- **Given** a link that is not an https Google Maps link, **when** it is saved, **then** it is ignored.

## REQ-101 — Sign in with Google

[Baseline · Account & platform] Users sign in with their Google account; without Firebase config the app runs in demo mode with data in the browser.

- **Given** I am signed out, **when** I tap Sign in with Google and accept, **then** I am signed in and my name and avatar show in the header.
- **Given** the app has no Firebase config, **when** I open it, **then** it runs in demo mode with a simulated login.

## REQ-102 — Consent, privacy policy and terms

[Baseline · Account & platform] New users must accept the Terms of Use and Privacy Policy before using an account; both pages are always reachable.

- **Given** I sign in for the first time, **when** the consent screen shows, **then** I cannot continue until I tick the agreement.
- **Given** I am on any page, **when** I open Privacy Policy or Terms, **then** the legal page opens with tabs to switch.

## REQ-103 — Download my data and delete my account

[Baseline · Account & platform] Users can download their data and permanently delete their account from the profile ⋯ menu.

- **Given** I am signed in, **when** I choose Download my data, **then** I get a file with my places, check-ins and trips.
- **Given** I choose Delete account and confirm, **when** the deletion finishes, **then** my account and content are removed and I am signed out.

## REQ-104 — Profile, display name, @username and avatar

[Baseline · Account & platform] Each user has a public profile with a display name, a unique @username and an avatar (uploaded photos are cropped round).

- **Given** I edit my profile, **when** I pick a username someone else has, **then** I am told it is taken.
- **Given** I upload an avatar, **when** I save, **then** it shows as a circle everywhere.

## REQ-105 — Vietnamese and English interface

[Baseline · Account & platform] Vietnamese is the default; the flag button switches to English and the choice is remembered.

- **Given** I open the app for the first time, **when** nothing is chosen, **then** the interface is in Vietnamese.
- **Given** I tap the flag and pick English, **when** I reload, **then** the interface stays in English.

## REQ-106 — Responsive layout for desktop, tablet and phone

[Baseline · Account & platform] Side panel on desktop; draggable bottom sheet and bottom navigation on tablet and phone; no iOS input zoom; pull to refresh on phones. Feature flag: pullToRefresh.

- **Given** I use a phone, **when** I open the map, **then** the panel is a bottom sheet I can drag.
- **Given** I pull down at the top of a page on a phone, **when** I release, **then** the page refreshes.

## REQ-107 — Installable app with fast reopening

[Baseline · Account & platform] A web app manifest makes the site installable; a service worker caches the app so it reopens almost instantly and shows an 'update available' bar for new versions.

- **Given** I have visited before, **when** I reopen the site, **then** it loads from cache almost at once.
- **Given** a new version is deployed, **when** I have the old one open, **then** I see an 'update available' bar.

## REQ-108 — Links keep the current page

[Baseline · Account & platform] Each view has its own URL (#/map, #/trips/…, #/guide/SG…) so reload, back and shared links open the same page.

- **Given** I am on a trip's Costs tab, **when** I reload, **then** the same trip and tab open.

## REQ-109 — Search engine and link-preview friendly

[Baseline · Account & platform] Descriptive title and meta description, Open Graph / Twitter cards, JSON-LD, robots.txt, sitemap.xml and crawlable static text.

- **Given** someone shares beetheremap.com in a chat app, **when** the preview loads, **then** it shows the Bee There title, description and image.

## REQ-110 — Custom domain over HTTPS

[Baseline · Account & platform] The site is served at https://beetheremap.com through GitHub Pages.

- **Given** I open beetheremap.com, **when** the page loads, **then** it is served over HTTPS without warnings.

## REQ-111 — World map of visited countries

[Baseline · Map & places] Visited countries are filled honey yellow with a 👣 pin per visited place and 💛 for wishlist places; nearby famous places cluster.

- **Given** I have visited places in 3 countries, **when** I open the map, **then** those 3 countries are filled and each place has a pin.

## REQ-112 — Country view with famous places

[Baseline · Map & places] Clicking a country zooms in and lists its famous places (hand-picked plus up to ~100 from Wikidata, ranked by Wikipedia coverage, cached 7 days), filterable by city or region. Feature flag: wikidata.

- **Given** I click Malaysia, **when** the country opens, **then** I see its famous places on the map and in the panel.
- **Given** I pick a city filter, **when** the list updates, **then** only places in that city show.

## REQ-113 — Add places by search, map tap or Google Maps link

[Baseline · Map & places] Find any country, city or place (OpenStreetMap), tap the map to pin a spot (must be inside a country, user can name it), or paste a Google Maps link (short links supported).

- **Given** I paste a Google Maps link, **when** I confirm, **then** a pin is created at that place.
- **Given** I tap the sea, **when** I try to pin it, **then** I am told to pick a place inside a country.

## REQ-114 — Visited and wishlist lists

[Baseline · Map & places] Mark places visited (with date and optional occasion) or wishlist; lists grouped by country then city; places can be removed.

- **Given** I mark a place visited with date 10/11, **when** I open Visited, **then** it shows under its country and city with that date.
- **Given** I remove a wishlist place, **when** the list refreshes, **then** it is gone.

## REQ-115 — Directions to a place

[Baseline · Map & places] Directions open Google Maps (desktop opens it directly) or Apple Maps (choice on phones) with the exact coordinates.

- **Given** I open a place, **when** I tap Directions on a phone, **then** I can choose Apple Maps or Google Maps.

## REQ-116 — Home panel: overview, popular places, quick links

[Baseline · Map & places] The map panel has Overview / Visited / Wishlist / Famous tabs, stats, most checked-in places and quick links. Feature flag: popularPlaces.

- **Given** I open the home map, **when** the panel loads, **then** I see my stats and the most checked-in places.

## REQ-117 — Show a trip on the map

[Baseline · Map & places] A trip can be shown on the map with its stops and numbered plan route; the map fits the trip.

- **Given** I tap 'View on map' on a trip, **when** the map opens, **then** only that trip's stops and numbered route show.

## REQ-118 — Photo check-ins

[Baseline · Check-ins & memories] Check in at any place with photos, caption, date, occasion and private/public visibility; several check-ins per place; photos compressed in the browser in 3 sizes and loaded according to network speed.

- **Given** I check in with 3 photos and set Public, **when** I save, **then** the check-in appears in Memories and on Explore.
- **Given** I am on a slow network, **when** I open a photo, **then** the medium-size version loads.

## REQ-119 — Edit and delete check-ins

[Baseline · Check-ins & memories] Edit caption, date, occasion, trip and photos; deleting a check-in updates the visited list and trip stops.

- **Given** I delete my only check-in at a place, **when** the deletion finishes, **then** the trip's Journey no longer shows it.

## REQ-120 — Memories page

[Baseline · Check-ins & memories] My check-ins sorted by check-in date, newest first, with 'On this day'.

- **Given** I open Memories, **when** the page loads, **then** my check-ins are sorted newest first.

## REQ-121 — Share studio

[Baseline · Check-ins & memories] Share 1–4 photos of a check-in as an image or video: Polaroid, Postcard, Film strip, Bento; Story 9:16, 4:5 or 1:1; preview before saving. Feature flag: share.

- **Given** I pick 2 photos, Polaroid and Story, **when** I export, **then** I get a 9:16 image I can save or share.

## REQ-122 — Year and trip recap

[Baseline · Check-ins & memories] Recap images and videos for a year or a trip with selectable layouts and photos. Feature flag: recap.

- **Given** I open the year recap, **when** I choose a layout, **then** I can preview and save the image or video.

## REQ-123 — Explore public check-ins

[Baseline · Social] Everyone's public check-ins by country or city, with likes. Feature flag: explore.

- **Given** I open Explore and filter Singapore, **when** the page loads, **then** I see public check-ins from Singapore.

## REQ-124 — Follow, friends feed and likes

[Baseline · Social] Follow people, see a friends feed and like public check-ins. Feature flag: follow.

- **Given** I follow Thư, **when** Thư posts a public check-in, **then** it shows in my friends feed.

## REQ-125 — In-app notifications

[Baseline · Social] Notifications for trip invites, follows and announcements from the team, with unread count.

- **Given** someone invites me to a trip, **when** I open notifications, **then** I see the invite with Join and Decline.

## REQ-126 — Create and manage shared trips

[Baseline · Trips] Create a trip with name, icon, dates and destinations; members edit details; only the owner deletes; trips sorted by start date and filterable by creator. Feature flag: trips.

- **Given** I create a trip with dates 10–14/11, **when** I open Trips, **then** it is listed by start date.
- **Given** I am a member but not the owner, **when** I open the trip menu, **then** I cannot delete it.

## REQ-127 — Invite members

[Baseline · Trips] Invite by link, code or @username; invitees must accept; trips are visible to members only. Feature flag: tripInvites.

- **Given** I invite @thu, **when** Thư accepts, **then** Thư becomes a member and sees the trip.
- **Given** someone is not a member, **when** they open the trip link, **then** they cannot see its content.

## REQ-128 — Day-by-day plan

[Baseline · Trips] Plan places by day and time, reorder, mark done or skipped, change date/time from the map route panel; destinations suggest places.

- **Given** I add 3 places on 11/11 at different times, **when** I open the Plan, **then** they are sorted by time within the day.
- **Given** I mark a place done, **when** the plan refreshes, **then** it shows as done and the place is marked visited.

## REQ-129 — Journey

[Baseline · Trips] The Journey lists the places the group has been and check-ins linked to the trip.

- **Given** I check in at a place and link the trip, **when** the trip's Journey refreshes, **then** the check-in is listed with its photos.

## REQ-130 — Costs and settle-up

[Baseline · Trips] Estimated and actual costs, multi-currency with live rates, paid-by and split among the group or picked people, and who owes whom. Feature flag: tripCosts.

- **Given** I paid 100 SGD for 2 people, **when** I open Costs, **then** each owes half converted with the trip rate and settle-up shows who pays whom.

## REQ-131 — Checklists

[Baseline · Trips] Shared and personal checklists; items can be for the group, for each person, or 'only me'; drag to reorder. Feature flag: tripChecklist.

- **Given** an item is 'each person', **when** I tick it, **then** only my tick is recorded and the count shows ticks per member.

## REQ-132 — Plan PDF export

[Baseline · Trips] Export or share the itinerary as a compact PDF with the Bee There header. Feature flag: tripPdf.

- **Given** I tap Export PDF on a plan, **when** the file is ready, **then** the PDF lists the days, times and places.

## REQ-133 — Duplicate a trip

[Baseline · Trips] Copy an existing trip as a new trip. Feature flag: tripDuplicate.

- **Given** I duplicate a trip, **when** I open the copy, **then** it has the same plan and checklists but only me as member.

## REQ-134 — Country guides

[Baseline · Guides, tips & gear] Guides for 12 Asian countries: where to go, money, power plugs, visas with official entry-form links, emergency numbers with tap-to-call. Feature flag: guide.

- **Given** I open the Singapore guide, **when** the page loads, **then** I see sections incl. the SG Arrival Card link and tap-to-call emergency numbers.

## REQ-135 — Phrases with listen button

[Baseline · Guides, tips & gear] Phrases with native script and a 🔊 button; falls back to Google Translate when the device has no voice.

- **Given** my device has no voice for Thai, **when** I tap 🔊, **then** Google Translate opens with the phrase.

## REQ-136 — Add guide places to a trip

[Baseline · Guides, tips & gear] Tap a place in 'Where to go' to add it to a trip plan. Feature flag: guideToTrip.

- **Given** I tap Add to trip on a guide place, **when** I pick my trip, **then** the place is added to the plan.

## REQ-137 — Local food by city

[Baseline · Guides, tips & gear] Must-try food filterable by city or region, with photos. Feature flag: guideFoodCities.

- **Given** I filter Penang, **when** the food list updates, **then** only Penang dishes show.

## REQ-138 — Sample trip cost calculator

[Baseline · Guides, tips & gear] Days, people and budget level give estimated costs in VND and local currency; can be applied to a trip. Feature flag: guideCosts.

- **Given** I choose 4 days, 2 people, mid budget, **when** I tap Apply to trip, **then** the estimates are added to the trip's costs.

## REQ-139 — Useful Google Maps links in guides

[Baseline · Guides, tips & gear] Staff-managed useful places (money exchange, embassies…) in each guide. Feature flag: guideLinks.

- **Given** staff add a link, **when** I open the guide, **then** the link shows and opens Google Maps.

## REQ-140 — Country travel tips

[Baseline · Guides, tips & gear] Community tips per country with Helpful / Misleading votes and Q&A; ranking configurable by admins. Feature flag: tips.

- **Given** I vote Helpful on a tip, **when** the list refreshes, **then** its score goes up.

## REQ-141 — Travel gear page

[Baseline · Guides, tips & gear] Gear ideas by trip type and purpose with clearly disclosed affiliate links; reachable from the top nav, Guides, a trip's Checklist tab and home quick links. Feature flag: gear.

- **Given** I open Gear and pick 'Beach', **when** the list updates, **then** I see beach gear with shop links marked as affiliate.

## REQ-142 — About page with auto-updating features

[Baseline · Help & onboarding] About page with real screenshots; released features with a value text are listed automatically.

- **Given** an admin releases a feature with a value text, **when** I open About, **then** the feature is listed.

## REQ-143 — Quick tour

[Baseline · Help & onboarding] Onboarding tour that opens automatically after a new account's first sign-in (only on the map) and can be reopened. Feature flag: quickTour.

- **Given** I sign in for the first time, **when** the map loads, **then** the quick tour opens.
- **Given** I finished the tour, **when** I sign in again, **then** it does not open by itself.

## REQ-144 — Feedback and bug reports

[Baseline · Help & onboarding] Feedback tab with an element picker and screenshot; admins triage in the Feedback inbox. Feature flag: feedback.

- **Given** I pick an element and send a bug report, **when** an admin opens Feedback, **then** the report shows with my screenshot.

## REQ-145 — FAQ, What's new and Support the creator

[Baseline · Help & onboarding] FAQ, release notes and a support page with the owner's VietQR code.

- **Given** I open What's new, **when** the page loads, **then** I see the latest release notes.

## REQ-146 — Site announcements

[Baseline · Help & onboarding] Scheduled banners; once a user closes a banner it does not show again.

- **Given** I close an announcement, **when** I reload, **then** it does not show again.

## REQ-147 — Roles and permissions

[Baseline · Admin] Admin, Editor, Moderator, Marketing presets plus custom roles; modules show by permission; Admin always has every permission; enforced by Firestore rules.

- **Given** a user has the Editor role, **when** they open Admin, **then** they only see modules their role allows.

## REQ-148 — Feature flags

[Baseline · Admin] New features ship off by default (owner sees them); admins release them to beta users or everyone in Admin → Features.

- **Given** a flag is off, **when** a normal user opens the app, **then** the feature is hidden.
- **Given** the admin releases it to everyone, **when** the user reloads, **then** the feature shows.

## REQ-149 — Insights and audit log

[Baseline · Admin] Usage stats and charts; every admin action is written to the audit log.

- **Given** an admin hides a memory, **when** I open Logs, **then** the action is listed with who and when.

## REQ-150 — Content moderation and reports

[Baseline · Admin] Users report check-ins; moderators review full-size photos and hide or delete content.

- **Given** a check-in is reported, **when** a moderator hides it, **then** it disappears from Explore.

## REQ-151 — Places management

[Baseline · Admin] Override names, descriptions, images and hide wrong famous places; add custom places.

- **Given** an admin hides a wrong place, **when** users open that country, **then** the place is not shown.

## REQ-152 — Guides, tips, trips, gear and ads management

[Baseline · Admin] Admins edit guide content and links, tips settings, trips, the gear catalog and sample ad slots.

- **Given** an editor changes a guide section, **when** users open the guide, **then** they see the new text.

## REQ-153 — Send notifications

[Baseline · Admin] Send to everyone, a role or chosen users; history incl. revoked; received/read report exportable to Excel.

- **Given** I send a notification to the Editor role, **when** I open the report, **then** I see who received and read it and can export it to Excel.
