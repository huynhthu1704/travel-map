# Requirements

_Generated from `spec.json`. REQ-101 and up are the baseline (features built before Compass, reconstructed 2026-11-23). Features (F-xxx) are listed in [features.md](features.md)._

| ID | Title | Feature | Priority | Status | Tests |
|---|---|---|---|---|---|
| REQ-001 | View-only trip members and copying a trip | — | Should | In build | TC-001, TC-002, TC-003, TC-004 |
| REQ-002 | Estimated vs actual cost comparison | — | Should | In build | TC-005, TC-006, TC-009 |
| REQ-003 | Reorder costs by drag and drop | — | Could | Done | TC-007, TC-008, TC-009, TC-011 |
| REQ-004 | Combined cost table: estimate, actual and difference in one table | — | Should | In build | TC-010, TC-011, TC-012, TC-033 |
| REQ-005 | Highlight the selected place on the map | — | Should | In build | TC-013, TC-014 |
| REQ-006 | Estimated costs for picked people | — | Should | In build | TC-015, TC-016 |
| REQ-007 | View-only trip link for non-members | — | Should | In build | TC-022, TC-023, TC-024 |
| REQ-008 | Reliable cost ordering and an easier way to sort | — | Must | In build | TC-017, TC-018, TC-021 |
| REQ-009 | Costs PDF matches the web table and current order | — | Must | In build | TC-019, TC-021, TC-025 |
| REQ-010 | Correct cost summary | — | Must | In build | TC-020, TC-021 |
| REQ-011 | Faster page loading | — | Must | In build | TC-026, TC-027 |
| REQ-012 | Journey hides places removed from the trip plan | — | Must | In build | TC-028, TC-029 |
| REQ-013 | About page: group related features, important first | — | Could | In build | TC-030 |
| REQ-014 | Trip header shows length and the right place count | — | Should | In build | TC-031 |
| REQ-015 | Faster first paint: non-blocking CSS and CSS per page | — | Should | Done | TC-032 |
| REQ-017 | Journey shows the itinerary date for visited places | — | Must | Done | TC-034 |
| REQ-018 | Admin can fix the location of famous places with a Google Maps link | — | Should | Done | TC-035 |
| REQ-019 | Edit the text of a checklist item | — | Should | Done | TC-036 |
| REQ-020 | Journey shows the check-in date the user entered | — | Must | Done | TC-037 |
| REQ-021 | Admin-corrected coordinates apply everywhere | — | Must | Done | TC-038 |
| REQ-022 | Directions open the Google Maps link the admin attached | — | Should | Done | TC-039 |
| REQ-023 | Quick tour points at visible buttons on phones | — | Must | Done | TC-040 |
| REQ-024 | Increase the number of user by adding some suggestion from 'Guides' into trip's checklist | F-001 | Must | In build | TC-041, TC-042 |
| REQ-025 | Accessibility and performance baseline | F-001 | Should | Approved | TC-043, TC-044 |
| REQ-026 | Export the trip itinerary and costs to Excel | — | Should | Done | TC-045, TC-046 |
| REQ-027 | Failing UI tests are logged as GitHub bug issues | — | Should | Done | TC-047 |
| REQ-028 | Archive trips older than the retention period (Excel-only access) | — | Could | Draft | — |
| REQ-029 | Excel export: itinerary and costs in one sheet, amounts visible on open, no Places sheet | — | Must | Done | TC-046, TC-048 |
| REQ-030 | Excel export: costs grouped by day, pre-trip costs first, estimate and actual side by side | — | Must | Done | TC-046, TC-049 |
| REQ-031 | Choose a cost type when entering a cost | — | Should | Done | TC-051, TC-052 |
| REQ-032 | Excel export: Google Maps column shows the URL | — | Should | Done | TC-050 |
| REQ-033 | Set a due day for checklist items, picked from the trip days | — | Should | Done | TC-053, TC-054 |
| REQ-034 | Safer release pipeline: deploy only after green CI, smoke test with rollback, library security audit | — | Should | Done | TC-055 |
| REQ-035 | Keep the agent working knowledge in the repository | — | Should | Done | TC-057 |
| REQ-036 | Enforce guardrails.json automatically (hooks + CI check) | — | Must | Done | TC-059 |
| REQ-037 | Independent AI review of every pull request (REVIEW.md) | — | Must | Done | TC-058 |
| REQ-038 | Capture intent in intent.md before writing requirements | — | Should | Done | TC-063 |
| REQ-039 | Write a plan before coding each requirement | — | Should | Done | TC-064 |
| REQ-040 | Turn project policies into repo skills | — | Should | Done | TC-065, TC-066 |
| REQ-043 | Failing test committed before the fix for every bug | — | Could | Done | TC-069 |
| REQ-045 | CLAUDE.md as the project lessons-learned memory | — | Should | Done | TC-062 |
| REQ-046 | Record decisions as ADRs in compass/decisions.md | — | Should | Done | TC-061 |
| REQ-047 | Keep compass/handover.md up to date automatically | — | Should | Done | TC-060 |
| REQ-050 | Protect the guardrail enforcement files themselves | — | Should | Done | TC-068 |
| REQ-051 | Harden merge-pr and the plan check | — | Could | Done | TC-066, TC-067 |
| REQ-052 | Keep intents and the review policy inside compass/ | — | Should | Done | TC-109 |
| REQ-053 | A plan file for every change that touches code | — | Should | Done | TC-110 |
| REQ-054 | Revise the business need into a business intent | — | Should | Done | TC-111 |
| REQ-055 | An approved design before any code | — | Should | Done | TC-112 |
| REQ-056 | Export the trip checklist to the same Excel file as a separate sheet | — | Should | Done | TC-114 |
| REQ-057 | A Figma frame in every UI design, approved before code | — | Should | Done | TC-113 |
| REQ-058 | Automatic deploys publish only the newest commit of main | — | Must | Done | TC-115 |
| REQ-059 | Turn push notifications on or off | — | Should | Approved | TC-116 |
| REQ-060 | Every in-app notification is also sent as a push message | — | Should | Approved | TC-117 |
| REQ-101 | Sign in with Google | — | Must | Done | TC-101 |
| REQ-102 | Consent, privacy policy and terms | — | Must | Done | TC-101 |
| REQ-103 | Download my data and delete my account | — | Must | Done | TC-101 |
| REQ-104 | Profile, display name, @username and avatar | — | Must | Done | TC-101 |
| REQ-105 | Vietnamese and English interface | — | Must | Done | TC-101 |
| REQ-106 | Responsive layout for desktop, tablet and phone | — | Must | Done | TC-101 |
| REQ-107 | Installable app with fast reopening | — | Must | Done | TC-101 |
| REQ-108 | Links keep the current page | — | Must | Done | TC-101 |
| REQ-109 | Search engine and link-preview friendly | — | Should | Done | TC-101 |
| REQ-110 | Custom domain over HTTPS | — | Must | Done | TC-101 |
| REQ-111 | World map of visited countries | — | Must | Done | TC-102 |
| REQ-112 | Country view with famous places | — | Must | Done | TC-102 |
| REQ-113 | Add places by search, map tap or Google Maps link | — | Must | Done | TC-102 |
| REQ-114 | Visited and wishlist lists | — | Must | Done | TC-102 |
| REQ-115 | Directions to a place | — | Must | Done | TC-102 |
| REQ-116 | Home panel: overview, popular places, quick links | — | Should | Done | TC-102 |
| REQ-117 | Show a trip on the map | — | Must | Done | TC-102 |
| REQ-118 | Photo check-ins | — | Must | Done | TC-103 |
| REQ-119 | Edit and delete check-ins | — | Must | Done | TC-103 |
| REQ-120 | Memories page | — | Must | Done | TC-103 |
| REQ-121 | Share studio | — | Must | Done | TC-103 |
| REQ-122 | Year and trip recap | — | Should | Done | TC-103 |
| REQ-123 | Explore public check-ins | — | Must | Done | TC-104 |
| REQ-124 | Follow, friends feed and likes | — | Should | Done | TC-104 |
| REQ-125 | In-app notifications | — | Must | Done | TC-104 |
| REQ-126 | Create and manage shared trips | — | Must | Done | TC-105 |
| REQ-127 | Invite members | — | Must | Done | TC-105 |
| REQ-128 | Day-by-day plan | — | Must | Done | TC-105 |
| REQ-129 | Journey | — | Must | Done | TC-105 |
| REQ-130 | Costs and settle-up | — | Must | Done | TC-105 |
| REQ-131 | Checklists | — | Must | Done | TC-105, TC-116 |
| REQ-132 | Plan PDF export | — | Should | Done | TC-105 |
| REQ-133 | Duplicate a trip | — | Should | Done | TC-105 |
| REQ-134 | Country guides | — | Must | Done | TC-106 |
| REQ-135 | Phrases with listen button | — | Should | Done | TC-106 |
| REQ-136 | Add guide places to a trip | — | Should | Done | TC-106 |
| REQ-137 | Local food by city | — | Could | Done | TC-106 |
| REQ-138 | Sample trip cost calculator | — | Could | Done | TC-106 |
| REQ-139 | Useful Google Maps links in guides | — | Could | Done | TC-106 |
| REQ-140 | Country travel tips | — | Should | Done | TC-106 |
| REQ-141 | Travel gear page | — | Could | Done | TC-106 |
| REQ-142 | About page with auto-updating features | — | Should | Done | TC-107 |
| REQ-143 | Quick tour | — | Must | Done | TC-107, TC-056 |
| REQ-144 | Feedback and bug reports | — | Should | Done | TC-107 |
| REQ-145 | FAQ, What's new and Support the creator | — | Could | Done | TC-107 |
| REQ-146 | Site announcements | — | Must | Done | TC-107 |
| REQ-147 | Roles and permissions | — | Must | Done | TC-108 |
| REQ-148 | Feature flags | — | Must | Done | TC-108 |
| REQ-149 | Insights and audit log | — | Should | Done | TC-108 |
| REQ-150 | Content moderation and reports | — | Must | Done | TC-108 |
| REQ-151 | Places management | — | Must | Done | TC-108 |
| REQ-152 | Guides, tips, trips, gear and ads management | — | Should | Done | TC-108 |
| REQ-153 | Send notifications | — | Should | Done | TC-108 |

## REQ-001 — View-only trip members and copying a trip

Trip owners can make an invited member view-only. View-only members see the plan, costs and shared checklists but cannot change them, and can copy the trip to their own account to plan it themselves.

- Given I own a trip with an accepted member · When I open Members & invites and set that member to View only · Then the member is stored in trips.viewerIds and shows as 'View only' in the member list
- Given I am a view-only member of a trip · When I open the trip · Then I see a view-only banner, and controls to add, edit, reorder, tick or delete plan items, costs and shared checklist items are hidden or disabled
- Given I am a view-only member · When I try to write plan items, costs, shared checklists or trip details (UI or API) · Then Firestore security rules reject the write
- Given I am a view-only member · When I tap 'Copy this trip' and confirm · Then a new trip owned by me is created with the plan, checklists and estimated costs I chose, and I can edit it
- Given I am the trip owner · When anyone tries to make me view-only · Then I keep full edit rights

## REQ-002 — Estimated vs actual cost comparison

Show estimated and actual costs side by side in one view so members can see the difference per item and spot costs that were not in the original estimate.

- Given a trip has estimated costs and actual costs recorded from them · When I open the Costs tab · Then a 'Estimated vs actual' card lists each estimate with its estimated amount, actual amount, and the difference marked over / under / on budget, with bars to compare
- Given an estimate has no actual cost linked yet · When I view the comparison · Then it shows 'Not spent yet' and is counted in the 'not spent yet' note, not as a saving
- Given some actual costs are not linked to any estimate (or their estimate was deleted) · When I view the comparison · Then they are listed under 'Not in the estimate' with their total, sorted by date
- Given the comparison is shown · When I look at the footer · Then I see total estimated, total actual including extras, and the overall difference

## REQ-003 — Reorder costs by drag and drop

Members who can edit a trip can change the order of estimated and actual costs by dragging, and the order is saved for the whole group.

- Given I can edit the trip · When I hold the ⠿ handle of a cost and drag it up or down (mouse or touch), or press ↑ / ↓ on the handle · Then the cost moves to the new position and the new order is saved for everyone
- Given costs have never been reordered · When I open the Costs tab · Then estimates keep the order they were added and actual costs are sorted by date
- Given I am a view-only member · When I open the Costs tab · Then no drag handles are shown

## REQ-004 — Combined cost table: estimate, actual and difference in one table

Replace the separate Estimated and Actual tables with one table where each cost item shows its estimate, actual spend and difference on the same row. Users can add a cost with the estimate, the actual, or both at once, and record the actual later. Unplanned actual costs appear in the same table, marked. Field sets for estimate and actual stay the same.

- Given I can edit a trip · When I tap 'Add a cost' and fill the estimate and/or the 'Already paid' part · Then one estimate and/or one actual cost is saved; if both, the actual is linked to the estimate
- Given a cost item has an estimate only · When I tap 🧾 on its row and save the actual amount · Then the actual is linked to that item and the row shows estimate, actual and difference
- Given an item has one or more actual payments · When I view the table · Then the row shows the total actual, the difference (over in red, under in green) and each payment underneath with date, who paid and who shares it
- Given an actual cost is not linked to any estimate · When I view the table · Then it appears as its own row tagged 'Unplanned' with no estimate and a + difference
- Given the table has rows · When I look at the last row · Then I see total estimate, total actual and total difference, plus notes for unplanned and not-yet-spent amounts
- Given I am a view-only member · When I view the table · Then I see all values but no add, edit, delete or drag controls

## REQ-005 — Highlight the selected place on the map

When a place is selected (place panel open), its pin stands out so users can tell which of dozens of pins they are looking at.

- Given the map shows many pins · When I open a place (from the map, search, a list or a trip plan) · Then its pin is larger, has a honey ring and a gently pulsing glow, and shows the place name in a label
- Given the selected place is a famous place inside a cluster · When I open it · Then its highlighted pin is shown on its own and not hidden in the cluster
- Given a place is selected · When I close the place panel or open another place · Then the highlight moves to the new place or disappears
- Given my device asks for reduced motion · When a place is selected · Then the glow does not animate

## REQ-006 — Estimated costs for picked people

Besides 'Group' and 'Per person', an estimated cost can apply to picked people only (e.g. a side tour two of four members join). The amount is either a total split between them or per picked person.

- Given I add or edit an estimated cost · When I choose 'Pick people', select members and choose 'Total' or 'Per person' · Then the estimate is saved with those members (splitAmong) and the hint shows the per-person share or the total for them
- Given 'Pick people' is chosen · When no member is selected · Then I cannot save and see 'Pick at least one person'
- Given an estimate applies to picked people · When I view the cost tables and the PDF · Then its group total counts only the picked people, the label lists their names, and 'Estimated / person' shows the group average
- Given an estimate applies to picked people · When I record its actual cost (🧾 or 'Already paid') · Then the actual form is pre-filled to split between the same people

## REQ-007 — View-only trip link for non-members

The trip owner can turn on a view-only link so anyone with it (signed in or not) can view the plan and shared checklists, and costs if the owner allows, without joining the trip.

- Given I own a trip · When I open Members & invites → Code / link and turn on 'Anyone with the link can view' · Then the trip gets publicView and I can copy the view-only link
- Given the link is on · When someone who is not a member (or not signed in) opens it · Then they see the trip header, Plan and shared Checklists (Costs only if 'Also show costs' is on) with a 'shared trip' banner, and no edit, member, invite, map, recap or Journey controls
- Given I view a shared trip by link · When I tap 'Copy this trip' · Then I am asked to sign in if needed and then get my own editable copy
- Given the owner turns the link off · When someone opens the link · Then they can no longer see the trip
- Given the link is on · When anyone tries to list trips, read the journey/photos, personal checklists, or write anything · Then Firestore rules deny it

## REQ-008 — Reliable cost ordering and an easier way to sort

Fix drag-and-drop ordering of costs (rows jumped back or stopped following the pointer) and add easier options: ↑/↓ buttons on each row and a Sort menu (group order, date paid, amount, most over budget, name) that can be saved as the group order.

- Given I can edit a trip and the table is in group order · When I drag a row by ⠿ (mouse or touch) or tap ↑ / ↓ · Then the row moves, stays in its new place without jumping back, and the order is saved for the group in one write
- Given the cost table has several rows · When I choose Sort by date, amount, most over budget or name · Then the table re-sorts on my device only, drag handles and ↑ ↓ are hidden, and a hint explains it
- Given I sorted the table by something other than group order · When I tap 'Save as group order' · Then that order becomes the group order for everyone and the menu returns to 'Group order'
- Given I am a view-only member · When I open the table · Then I can change my view sort but cannot reorder or save the group order

## REQ-009 — Costs PDF matches the web table and current order

The costs PDF uses one table like the web (item, estimate, actual, difference, payments under each item, unplanned rows marked) and follows the exact order currently shown on screen, using the latest data.

- Given I am on the Costs tab · When I tap Export PDF or Share PDF · Then the PDF shows a single table with Item, Estimate, Actual and Difference, each item's payments listed under it, unplanned costs marked, and a totals row
- Given I reordered or sorted the table · When I export the PDF · Then rows appear in the same order as on screen
- Given a cost was just added or edited · When I export the PDF · Then the PDF includes the latest values
- Given a cost title contains arrows such as 'SGN → SIN' · When I export the costs PDF (or the plan PDF) · Then the arrows appear in the PDF instead of disappearing

## REQ-010 — Correct cost summary

The summary cards no longer subtract unspent estimates from the difference. Cards: estimated for the group (with per-person average), actually spent (incl. unplanned), difference on spent items, and estimated but not spent yet.

- Given some estimates have no actual cost yet · When I view the summary · Then 'Difference (spent items)' compares actual spend with the estimates of the items already paid plus unplanned costs, and the unspent estimates are shown separately as 'Estimated, not spent yet'
- Given the PDF is exported · When I read its summary and totals row · Then they use the same numbers as the web

## REQ-011 — Faster page loading

Pages load too slowly on phones. Load the map only when the Map page is opened, load the English dictionary only for English users, stop loading the profile page at start-up, defer detailed country borders, render long photo grids progressively, and render map pins in the background.

- Given I open Trips, Guides, Explore, Memories or About · When the page loads · Then the map code (Leaflet, MapLibre, country borders) is not downloaded
- Given my language is Vietnamese · When the site loads · Then the English dictionary is not downloaded; switching to English downloads it first and then switches
- Given Explore or Memories has many photos · When I open it · Then about 24 cards render first and more render as I scroll
- Given the mobile Lighthouse test (4G) is run on Trips, Guides, Explore and About · When compared with the baseline · Then Largest Contentful Paint and Total Blocking Time are lower than before (baseline: LCP 6.5–7.1 s, TBT 0.6–1.2 s)

## REQ-012 — Journey hides places removed from the trip plan

Places deleted from the trip plan kept appearing in the Journey tab, the stop count and the trip recap (and looked like they came back). The Journey now hides places whose plan items were all removed; adding the place again shows it again. No check-in data is deleted.

- Given a place was checked in for the trip and later deleted from the Plan · When I open the trip · Then it no longer appears in Journey, the stop count or the trip recap
- Given I add that place to the plan again · When I open Journey · Then it appears again
- Given I duplicate the trip · When the copy is created · Then places deleted from the original plan are not copied

## REQ-013 — About page: group related features, important first

In 'And there's more', features are grouped (Travel together, Costs & splitting, Guides & packing, Map & discovery, Handy extras) with the most important first in each group, instead of newest first.

- Given I open the About page · When I scroll to 'And there's more' · Then features appear under group headings, related features side by side, the most important first
- Given a new feature is not yet assigned to a group · When it is released · Then it still appears, in the last group

## REQ-014 — Trip header shows length and the right place count

Link viewers saw '0 stops' because they cannot read the Journey. The header now shows the trip length (days/nights) for everyone, the number of planned places for link viewers, and the Journey stop count for members.

- Given a trip has start and end dates · When anyone opens it · Then the header shows e.g. '🌙 5 days 4 nights'
- Given I view a trip by its view-only link · When I look at the header · Then I see '📍 N places' from the plan instead of '0 stops'
- Given I am a member · When I look at the header · Then I still see the Journey stop count

## REQ-015 — Faster first paint: non-blocking CSS and CSS per page

Pages still felt slow. (C) The main stylesheet no longer blocks the first paint: the boot screen (inline CSS) shows at once while the CSS loads in parallel, and the app renders once it is ready. (D) Styles used by only one area (admin, about, guides, gear, tips, legal, profile, trips, share studio, feedback, map) move into their own CSS files that load with that area's code, so the shared stylesheet is much smaller.

- Given I open any page · When the HTML arrives · Then the boot screen paints without waiting for the main CSS file
- Given the main CSS has not finished loading · When the app is about to render · Then it waits for the CSS (max 4s) so I never see an unstyled page
- Given I open a page such as Guides or About · When it loads · Then only the shared CSS plus that page's CSS are downloaded, and the page looks the same as before

## REQ-017 — Journey shows the itinerary date for visited places

Places ticked as visited from the plan showed the day they were ticked (e.g. 22/11) instead of the day in the itinerary. The Journey now shows, for each stop: the memory's date for check-ins with photos; the plan date for places that are in the plan; otherwise the saved date. It is ordered by that date, newest first. Works for existing data without any migration.

- Given a place in the plan for 18/11 was ticked visited on 22/11 · When I open the Journey · Then it shows 18/11
- Given a check-in memory dated 17/11 · When I open the Journey · Then it shows 17/11
- Given stops with different dates · When I open the Journey · Then they are ordered by the shown date, newest first

## REQ-018 — Admin can fix the location of famous places with a Google Maps link

In Admin → Places, the Google Maps link box and latitude/longitude were only shown for places the team added. Famous places (curated list / Wikidata) could not be moved when their pin was wrong. The editor now shows the link box and coordinates for every place; moved coordinates are saved in the place override and the map uses them.

- Given I edit a famous place such as Ha Long Bay · When I paste a Google Maps link and press Find · Then the latitude and longitude fill in
- Given I save with new coordinates · When anyone opens the map · Then the pin shows at the new place
- Given I reset the place's edits · When the map reloads · Then the original location is used again

## REQ-019 — Edit the text of a checklist item

Members can change the wording of a checklist item when plans change instead of deleting and re-adding it. Tap ✏️ (or double-click the text), Enter or click away to save, Esc to cancel. Ticks, who-ticked and the item's scope are kept. View-only members cannot edit shared lists. Behind the flag checkEdit.

- Given a checklist item 'Mua eSIM' · When I tap ✏️, type 'Mua eSIM Singapore' and press Enter · Then the item shows the new text for everyone and stays ticked if it was ticked
- Given I am editing an item · When I press Esc or clear the text · Then nothing changes
- Given I am a view-only member · When I open a shared checklist · Then I do not see ✏️

## REQ-020 — Journey shows the check-in date the user entered

Check-ins with photos showed the upload day (e.g. 18/11) instead of the check-in date the user entered, because trip stops were saved without a date and were not updated when a check-in was edited. Now: stops save the check-in date; editing a check-in's date, caption or trip replaces my stop in the Journey; and the Journey uses the date of my own check-ins directly, so existing stops show the right date at once.

- Given I checked in at Chinatown with date 10/11 but uploaded on 18/11 · When I open the trip's Journey · Then it shows 10/11
- Given I change a check-in's date to 11/11 · When anyone in the trip opens the Journey · Then it shows 11/11
- Given I move a check-in to another trip · When I open both Journeys · Then it appears only in the new trip

## REQ-021 — Admin-corrected coordinates apply everywhere

After REQ-018 an admin could fix a place's coordinates, but only the famous-places list used them. Saved places (visited / wishlist), check-ins, the open place, trip stops and plan items, map fly-to and Directions still used the old coordinates. Now all of them use the corrected coordinates.

- Given an admin moved Ha Long Bay with a Google Maps link · When I open Ha Long Bay from the map, my visited places, a check-in or a trip plan · Then the pin and the map zoom use the new location
- Given the same place · When I tap Directions · Then Google / Apple Maps open with the new coordinates
- Given the admin resets the place · When the map refreshes · Then the original location is used again

## REQ-022 — Directions open the Google Maps link the admin attached

When Google Maps receives bare coordinates it labels the destination with the nearest named point (e.g. 'Ramayana Cave' for Batu Caves). When an admin fixes a place with a Google Maps link (Find place), the link is saved with the place; Directions → Google Maps then opens that exact place page (name, photos, Directions button). Clearing the link box removes it. Only https Google Maps links are accepted.

- Given an admin pasted the Google Maps link of Batu Caves, pressed Find place and saved · When a user taps Directions → Google Maps on Batu Caves (from the map, a saved place or a trip) · Then Google Maps opens the Batu Caves page
- Given the admin clears the link box and saves · When a user taps Directions · Then Google Maps opens with the coordinates as before
- Given a link that is not an https Google Maps link · When it is saved · Then it is ignored

## REQ-023 — Quick tour points at visible buttons on phones

On phones some tour steps highlighted the wrong area or hid the button behind the tour card (e.g. 'Save memories' pointed at the map because the Add memory button was scrolled out of the bottom sheet; the Feedback tab was covered by the card). The tour now scrolls the target into view inside its panel, only highlights the visible part, and places the card in the larger free space above or below the target, shrinking it (and hiding the illustration) so it never covers the target. Fixes REQ-143.

- Given I am on a phone at step 5 'Save memories' · When the step opens · Then the Add memory button is scrolled into view, highlighted and not covered by the card
- Given I am at step 8 'Send feedback' · When the step opens · Then the Feedback tab is highlighted and the card sits above or below it
- Given the step highlights the whole map · When it opens · Then the card stays at the bottom as before

## REQ-024 — Increase the number of user by adding some suggestion from 'Guides' into trip's checklist

As an user, I want to increase the number of user by adding some suggestion from 'Guides' into trip's checklist, so that I can get it done without back-and-forth messages.

- Given I am an user · When I increase the number of user by adding some suggestion from 'Guides' into trip's checklist with valid details and confirm · Then the result is saved and I see a confirmation
- Given a required field is empty or invalid · When I confirm · Then I see an error next to that field and nothing is saved

## REQ-025 — Accessibility and performance baseline

As an user, I want every page to work with keyboard and screen readers and load quickly, so that everyone can use the product.

- Given any page · When I navigate with the keyboard only · Then every action is reachable and has a visible focus state
- Given a 4G connection · When I open the home page · Then it becomes interactive within 2.5 seconds (Lighthouse)

## REQ-026 — Export the trip itinerary and costs to Excel

As a trip member, I want to export the itinerary and costs to Excel so that I can review, share and adjust the budget offline in the same layout as our planning spreadsheets.

- Given a trip with a plan and costs · When I tap Export Excel on the Plan or Costs tab · Then an .xlsx file downloads with Itinerary & costs, Settle up (groups), Rates and Master data sheets (layout changed by REQ-029)
- Given an actual cost linked to a plan item · When I open the Itinerary sheet · Then the item's Actual cell sums it with a formula that refers to the Costs sheet
- Given I change a rate in the Rates sheet · When Excel recalculates · Then converted amounts, itinerary totals and balances update
- Given a trip with one member · When I export · Then there is no Settle up sheet and no per-member columns

## REQ-027 — Failing UI tests are logged as GitHub bug issues

As the Product Owner, I want every UI test that fails on main or in the nightly run to become a GitHub bug issue so that I can pick a bug by its number and ask for a fix.

- Given a UI test fails on main or in the nightly run · When the CI job finishes · Then a GitHub issue labelled bug and e2e is opened with the requirement, error, run link and how to reproduce
- Given that issue is still open and the test fails again · When the next run finishes · Then a comment is added instead of a duplicate issue
- Given the test passes again · When the run finishes · Then the issue is closed with a comment
- Given a pull request run fails · When the CI job finishes · Then no issue is opened (the pull request shows the failure)

## REQ-028 — Archive trips older than the retention period (Excel-only access)

As the Product Owner, I want trips older than a retention period (default 2 years, editable by admins) to be archived and only viewable through an Excel export so that storage stays small.

- Given a trip ended more than the retention period ago · When a member opens it · Then it is archived and only its Excel export is available
- Given I am an admin · When I change the retention period in Admin · Then the new period is used for archiving

## REQ-029 — Excel export: itinerary and costs in one sheet, amounts visible on open, no Places sheet

As a trip member, I want the itinerary and its costs on the same sheet, with amounts visible as soon as the file opens, so that I can read each stop together with what it cost.

- Given I export a trip to Excel · When I open the file · Then the first sheet lists each day, each plan item and, right under it, the estimates and actuals linked to it, with item, day and trip totals
- Given costs not linked to a plan item or repayments · When I open the file · Then they appear in an Other costs section and a Repayments section; repayments are not counted as trip spending
- Given I export a trip · When I look at the sheet tabs · Then there is no Places sheet and no separate Costs sheet; Settle up (groups), Rates and Master data stay
- Given I open the file in a viewer that does not recalculate (Excel Protected View, previews) · When the sheet appears · Then all amounts and totals are already visible

## REQ-030 — Excel export: costs grouped by day, pre-trip costs first, estimate and actual side by side

As a trip member, I want the exported costs grouped by day, with costs not linked to any plan item at the top, and each estimate next to its actual cost, so that I can see what to pay before the trip and add up every column easily.

- Given costs not linked to any plan item · When I export the trip to Excel · Then they are listed in a section at the top of the sheet, before the days
- Given costs linked to plan items · When I export · Then they appear under their plan item inside that item's day, with item, day and trip totals
- Given an estimate and its actual cost · When I export · Then they share one row with columns: estimated cost, estimated currency, actual cost, actual currency, final amount in the trip currency, difference
- Given every cost of the trip is in the trip currency · When I export · Then the two currency columns are not shown

## REQ-031 — Choose a cost type when entering a cost

As a trip member, I want to pick a cost type when I add or edit a cost so that costs are categorised and can later be filtered and totalled by type.

- Given I add an estimated or actual cost · When I open the cost form · Then I can choose a cost type from a list (optional)
- Given I saved a cost with a type · When I look at the cost list · Then the cost shows its type icon and name
- Given I edit the cost · When I change or clear the type and save · Then the new type is shown
- Given a cost has a type · When I export the trip to Excel · Then the Cost type column shows that type

## REQ-032 — Excel export: Google Maps column shows the URL

As a trip member, I want the Google Maps column of the Excel export to contain the full Google Maps URL so that I can copy it, see where it points and open it from any app.

- Given a plan item with a location or an admin-attached Google Maps link · When I export the trip to Excel · Then its Google Maps cell shows the full URL as a clickable link
- Given I open the file in a viewer that does not recalculate · When I look at the Google Maps column · Then the URL text is visible

## REQ-033 — Set a due day for checklist items, picked from the trip days

As a trip member, I want to mark the day a checklist item must be done, choosing from the days of the trip, so that I know what to prepare on each day.

- Given a trip from 10/11 to 14/11 · When I set the due day of a checklist item · Then the options are Before the trip, Day 1 · 10/11 … Day 5 · 14/11 and Other date…
- Given I mark item A for Day 3 · When I look at the checklist · Then item A shows Day 3 · 12/11
- Given a checklist item is due today or overdue and not ticked · When I open the checklist · Then its due day is highlighted
- Given I clear the due day · When I save · Then the item has no due day
- Given a trip without dates · When I set a due day · Then I can pick any date

## REQ-034 — Safer release pipeline: deploy only after green CI, smoke test with rollback, library security audit

As the product owner, I want only tested code to reach beetheremap.com, and a broken release to be undone automatically, so that users never get a broken site.

- Given a commit is pushed to main · When Compass CI fails · Then the site is not deployed
- Given Compass CI is green for a commit on main · When the deploy runs · Then exactly that commit is built and deployed
- Given a deploy finished · When the live site does not serve the new build with the Bee There title within 10 minutes · Then the last good version is redeployed and a bug issue is opened
- Given CI runs · When a shipped library has a critical vulnerability · Then CI fails; the full audit report is shown in the run summary
- Given I need to roll back by hand · When I run Compass Deploy with a commit SHA · Then that commit is deployed

## REQ-035 — Keep the agent working knowledge in the repository

As the product owner, I want the working knowledge for AI agents stored in the repository, so that every new Claude session follows it without me uploading it each time.

- Given a new Claude session starts in this repository · When it reads CLAUDE.md · Then compass/agent-knowledge.md is loaded automatically
- Given compass/agent-knowledge.md · When the unit tests run · Then it contains the sections on working style, delivery contract, protected paths and open items, and no secrets or e-mail addresses
- Given the Compass portal regenerates compass/handover.md · When that happens · Then the agent knowledge is not overwritten

## REQ-036 — Enforce guardrails.json automatically (hooks + CI check)

As the product owner, I want the rules in compass/guardrails.json (protected paths, forbidden paths, secret patterns, max 12 files per change) to be checked by a machine instead of relying on the agent remembering them, so that a rule cannot be broken by mistake.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given an agent session in this repo · When it tries to edit a protected path (e.g. .github/workflows/, CNAME) · Then a Claude Code hook blocks the edit and says how to get approval
- Given a pull request · When it changes more than 12 files, touches a forbidden path or contains a secret pattern · Then CI fails with a clear message
- Given a protected path change, a deleted file or a dependency change approved by the Product Owner · When the PR carries the human-approved label · Then the CI check passes

## REQ-037 — Independent AI review of every pull request (REVIEW.md)

As the product owner, I want every PR to be reviewed by a separate Claude review pass that did not write the code, so that bugs and spec mismatches are caught before auto-merge.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given a REVIEW.md that defines the review passes (bugs, security, match with the requirement and plan) · When a PR is opened · Then a fresh review agent comments its findings on the PR
- Given the review has a finding marked important · When CI is otherwise green · Then the PR is not auto-merged until the finding is fixed and re-reviewed, or the Product Owner accepts it
- Given the author agent · When the PR is reviewed · Then the author cannot approve its own PR

## REQ-038 — Capture intent in intent.md before writing requirements

As the product owner, I want each new request saved as a short intent file (what, why, constraints, success measure) that I approve, so that the reason behind a requirement is kept with the code, not lost in chat.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given a new request in chat · When the agent starts · Then it writes compass/intent/<date>-<topic>.md and asks the Product Owner to approve it before adding requirements
- Given an approved intent · When requirements are created · Then each requirement links back to its intent file and the intent lists them
- Given a new requirement (REQ-051 or later) without an approved intent · When CI runs the spec check · Then it fails

## REQ-039 — Write a plan before coding each requirement

As the product owner, I want the agent to write a plan (files, order of work, risks, how it will prove it works) before changing code, so that I can see and redirect the approach early.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given an approved requirement · When work starts · Then the PR has a Plan section listing files, steps, risks and proof, and CI fails a PR that changes code without it
- Given the plan changes during the work · When the PR is merged · Then the updated plan is committed with the code as the squash-commit message

## REQ-040 — Turn project policies into repo skills

As the product owner, I want recurring rules (feature flags, VI/EN strings, GitHub issue/PR linking, Excel export rules) packaged as skills in .claude/skills/, so that every session applies them the same way.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given a skill for a policy · When a session does work that matches it · Then the skill is loaded and followed
- Given a policy that must always hold · When it is written as a skill · Then it also has a hook or CI check behind it

## REQ-043 — Failing test committed before the fix for every bug

As the product owner, I want bug fixes to start with a separate commit that adds a failing test, and the fix commit not to change that test, so that the fix provably addresses the reported bug.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given a bug issue · When the fix PR is opened (with the bug label) · Then CI checks that its first commit only adds a test, that the unit test fails at that commit, and that later commits do not edit it
- Given a later commit edits that test · When CI runs · Then it fails unless the Product Owner approves (human-approved label)
- Given a PR that closes a bug issue but has no bug label · When compass/merge-pr.mjs runs · Then it refuses to merge
- Given the test from the first commit hangs or cannot start · When the test-first check runs it · Then the check fails (a run stopped by the time limit does not count as a failing test)

## REQ-045 — CLAUDE.md as the project lessons-learned memory

As the product owner, I want CLAUDE.md to keep commands, conventions and recurring mistakes in under a page, so that new sessions do not repeat known mistakes.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given the agent makes the same mistake twice · When it is corrected · Then the correction is added to CLAUDE.md in the same PR
- Given CLAUDE.md · When it is reviewed · Then it stays under one page and still loads the agent working knowledge

## REQ-046 — Record decisions as ADRs in compass/decisions.md

As the product owner, I want important decisions recorded as ADRs, so that anyone can see why things are the way they are.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given a decision is made in chat · When the work is merged · Then an ADR-xxx entry is added to compass/spec.json with context, decision and consequences, and decisions.md is regenerated
- Given existing decisions from November 2026 · When this requirement is done · Then they are back-filled as ADRs
- Given an ADR without context, decision or consequences, with a duplicate id or an unknown requirement · When CI runs the spec check · Then it fails

## REQ-047 — Keep compass/handover.md up to date automatically

As the product owner, I want handover.md regenerated from spec.json and checked on every change, so that it never shows a stale status.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given spec.json changes · When node compass/build-views.mjs runs · Then requirements.md, tests.md and handover.md are regenerated from it
- Given handover.md lists different open requirements or counts than spec.json · When CI runs the spec check · Then CI fails and says how to regenerate it

## REQ-050 — Protect the guardrail enforcement files themselves

As the product owner, I want the files that enforce the guardrails to be protected paths too, so that a PR cannot quietly weaken the checks.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given compass/guardrails.json lists compass/check-guardrails.mjs, compass/guardrails-lib.mjs, compass/hooks/, .claude/settings.json and .claude/settings.local.json under protectedPaths · When a PR changes one of them without the human-approved label · Then the Guardrails check fails
- Given a PR that weakens compass/guardrails-lib.mjs or check-guardrails.mjs, or removes its own entries from protectedPaths · When CI runs the Guardrails check · Then the check and the rules from main (not the PR's copy) judge the change, so it still fails without the human-approved label

## REQ-051 — Harden merge-pr and the plan check

As the product owner, I want the merge script and the plan check to close the gaps found in the independent reviews of PR #80 and PR #83, so that the delivery rules cannot be bypassed by accident.

Intent: [compass/intent/2026-11-25-ai-native-sdlc.md](../compass/intent/2026-11-25-ai-native-sdlc.md)

- Given a code PR whose Plan was removed or emptied after CI passed · When compass/merge-pr.mjs runs · Then it refuses to merge
- Given the Product Owner accepted an important finding in chat · When the author wants to merge · Then REVIEW.md and agent-knowledge describe the documented route (a PR comment quoting her decision, then a fresh review listing the finding as accepted)
- Given a Plan line whose value is only a placeholder (-, TBD, TODO, n/a) · When the guardrails check runs · Then it is treated as missing
- Given a feature flag that is not in the legacy list · When the unit tests run · Then it must be default-off with a VI/EN value text, whatever its since date

## REQ-052 — Keep intents and the review policy inside compass/

As the product owner, I want the intent files and the review policy to live in the compass/ folder with the rest of the delivery files, so that the process is in one place and matches the Compass portal.

Intent: [compass/intent/2026-11-26-design-and-plan-before-code.md](../compass/intent/2026-11-26-design-and-plan-before-code.md)

Design: none: process change, no UI

- Given the repository · When I open compass/ · Then I find intent/ (template and intents) and REVIEW.md there, and no intent/ folder or REVIEW.md at the root
- Given a requirement with an intent · When CI runs the spec check · Then the intent path must look like compass/intent/<file>.md

## REQ-053 — A plan file for every change that touches code

As the product owner, I want each change that touches code to carry a written plan file (files, steps, risks, proof) committed before the code, so that the plan stays in the repo next to the code it explains.

Intent: [compass/intent/2026-11-26-design-and-plan-before-code.md](../compass/intent/2026-11-26-design-and-plan-before-code.md)

Design: none: process change, no UI

- Given a PR that changes code without a compass/plans/*.md file · When compass/merge-pr.mjs runs · Then it refuses to merge
- Given a plan file whose Files, Steps, Risks or Proof section is empty or only a placeholder · When the plan check runs · Then it names the missing sections
- Given a PR that changes no code · When the plan check runs · Then no plan file is needed

## REQ-054 — Revise the business need into a business intent

As the product owner, I want my request kept in my own words as the business need and revised into a measurable business intent before requirements are written, so that requirements answer the outcome, not the first solution I mentioned.

Intent: [compass/intent/2026-11-26-design-and-plan-before-code.md](../compass/intent/2026-11-26-design-and-plan-before-code.md)

Design: none: process change, no UI

- Given an intent for REQ-052 or later · When CI runs the spec check · Then it fails if the intent has no "## Business need" section
- Given the intent template · When an agent writes a new intent · Then "## What we want" asks for who, what changes, baseline → target and by when

## REQ-055 — An approved design before any code

As the product owner, I want the design of approved requirements drafted and approved by me before coding starts, so that code is built to a screen we agreed on.

Intent: [compass/intent/2026-11-26-design-and-plan-before-code.md](../compass/intent/2026-11-26-design-and-plan-before-code.md)

Design: none: process change, no UI

- Given a requirement from REQ-052 on past Draft without "design" · When CI runs the spec check · Then it fails and asks for a design file or "none: <reason>"
- Given a requirement In build or Done whose design file is not Approved · When CI runs the spec check · Then it fails
- Given a design file that does not mention the requirement · When CI runs the spec check · Then it fails

## REQ-056 — Export the trip checklist to the same Excel file as a separate sheet

As a trip member, I want the trip checklist in the Excel export as its own sheet so that I can see, print and share the to-dos together with the itinerary and costs.

Intent: [compass/intent/2026-11-26-checklist-in-excel.md](../compass/intent/2026-11-26-checklist-in-excel.md)

Design: [compass/design/2026-11-26-checklist-in-excel.md](../compass/design/2026-11-26-checklist-in-excel.md)

- Given a trip with checklist items · When I tap Export Excel on the Plan or Costs tab · Then the downloaded file has a Checklist sheet with one row per item: list, when (before the trip / before returning), item, for whom, done, ticked by and due day
- Given another member has a personal checklist · When I export the trip · Then the Checklist sheet shows the shared checklists and my own personal checklists only
- Given an "everyone ticks" item ticked by 2 of 4 members · When I export · Then its Done cell shows 2/4 and Ticked by lists those 2 names
- Given a trip without checklist items · When I export · Then the file has no Checklist sheet and the other sheets are unchanged
- Given I export in English · When I open the Checklist sheet · Then its headers and values are in English
- Given a trip with "before the trip" and "before returning" checklists · When I export · Then the Checklist sheet comes right after the itinerary sheet, "before the trip" lists first, items in the app's order, and its last row shows done items / all items
- Given an item that is not done and is overdue or due today on the export day · When I export · Then its row is red (overdue) or yellow (due today), as in the app (an "everyone ticks" item until every current member ticked it)

## REQ-057 — A Figma frame in every UI design, approved before code

As the product owner, I want every requirement that changes the UI to come with a Figma design that I approve before coding, so that I judge the real look in our design system instead of a text description.

Intent: [compass/intent/2026-11-26-figma-for-ui-designs.md](../compass/intent/2026-11-26-figma-for-ui-designs.md)

Design: none: process change, no UI

- Given a requirement from REQ-056 on, In build or Done, whose design is a file · When the design file links no frame of the project Figma file (designTool?node-id=…) · Then node compass/check-spec.mjs fails and asks for the Figma frame
- Given a requirement with "design": "none: <reason>" (no UI) · When CI runs the spec check · Then no Figma link is required
- Given requirements before REQ-056 and the REQ-101…153 baseline · When CI runs the spec check · Then they are exempt
- Given an agent starts a design · When it reads the design template and its working knowledge · Then it draws the frames in the Bee There Figma file (designTool in spec.json) and links them before asking for approval

## REQ-058 — Automatic deploys publish only the newest commit of main

As the product owner, I want the live site to always show the newest merged version, so that a feature that was merged and deployed is never replaced by an older version.

Intent: [compass/intent/2026-11-26-deploy-newest-only.md](../compass/intent/2026-11-26-deploy-newest-only.md)

Design: none: CI workflow, no UI

- Given two commits pushed to main whose Compass CI runs finish in reverse order · When the deploy for the older commit starts after the newer one · Then it is skipped with a notice and nothing older is published
- Given an automatic deploy whose commit is the current head of main · When it runs · Then it builds, deploys and smoke-tests that commit as before
- Given a manual deploy or rollback with a commit SHA · When it runs · Then that commit is deployed even if it is not the head of main

## REQ-059 — Turn push notifications on or off

As a signed-in user, I want to turn push notifications on or off for this device, so that I get my Bee There notifications even when the app is closed, and only if I want them.

Intent: [compass/intent/2026-11-26-push-notifications.md](../compass/intent/2026-11-26-push-notifications.md)

Design: [compass/design/2026-11-26-push-notifications.md](../compass/design/2026-11-26-push-notifications.md)

- Given the pushNotif flag is on for me and my browser supports push · When I open Notifications, tap "Turn on push notifications" and allow it in the browser prompt · Then this device is registered and the switch shows On
- Given push is on for this device · When I turn the switch off · Then the device is unregistered and no more push messages arrive on it
- Given my browser does not support push (e.g. iPhone Safari not added to the Home Screen) or I blocked notifications · When I open Notifications · Then I see a short VI/EN explanation of how to enable it instead of the switch
- Given the pushNotif flag is off for me · When I open Notifications · Then I see no push option

## REQ-060 — Every in-app notification is also sent as a push message

As a user who turned push notifications on, I want every notification the app already creates to reach my device as a push message, so that I see invites, answers, follows, likes, comments and team messages without opening the app.

Intent: [compass/intent/2026-11-26-push-notifications.md](../compass/intent/2026-11-26-push-notifications.md)

Design: [compass/design/2026-11-26-push-notifications.md](../compass/design/2026-11-26-push-notifications.md)

- Given I have push on · When someone creates a notification for me (trip invite, invite accepted/declined, follow, like, comment, hidden memory) · Then I get a push message within 1 minute with its title and text in my language
- Given an admin sends a notification to everyone, a role or chosen users · When it is sent · Then each recipient with push on gets the push message
- Given I tap the push message · When the app opens · Then it shows the Notifications panel
- Given a device that unregistered or whose push subscription expired · When a push is sent · Then it is skipped and its registration is removed
- Given the Cloudflare Worker is down · When a notification is created · Then the in-app notification is still saved and shown as today

## REQ-101 — Sign in with Google

[Baseline · Account & platform] Users sign in with their Google account; without Firebase config the app runs in demo mode with data in the browser.

- Given I am signed out · When I tap Sign in with Google and accept · Then I am signed in and my name and avatar show in the header
- Given the app has no Firebase config · When I open it · Then it runs in demo mode with a simulated login

## REQ-102 — Consent, privacy policy and terms

[Baseline · Account & platform] New users must accept the Terms of Use and Privacy Policy before using an account; both pages are always reachable.

- Given I sign in for the first time · When the consent screen shows · Then I cannot continue until I tick the agreement
- Given I am on any page · When I open Privacy Policy or Terms · Then the legal page opens with tabs to switch

## REQ-103 — Download my data and delete my account

[Baseline · Account & platform] Users can download their data and permanently delete their account from the profile ⋯ menu.

- Given I am signed in · When I choose Download my data · Then I get a file with my places, check-ins and trips
- Given I choose Delete account and confirm · When the deletion finishes · Then my account and content are removed and I am signed out

## REQ-104 — Profile, display name, @username and avatar

[Baseline · Account & platform] Each user has a public profile with a display name, a unique @username and an avatar (uploaded photos are cropped round).

- Given I edit my profile · When I pick a username someone else has · Then I am told it is taken
- Given I upload an avatar · When I save · Then it shows as a circle everywhere

## REQ-105 — Vietnamese and English interface

[Baseline · Account & platform] Vietnamese is the default; the flag button switches to English and the choice is remembered.

- Given I open the app for the first time · When nothing is chosen · Then the interface is in Vietnamese
- Given I tap the flag and pick English · When I reload · Then the interface stays in English

## REQ-106 — Responsive layout for desktop, tablet and phone

[Baseline · Account & platform] Side panel on desktop; draggable bottom sheet and bottom navigation on tablet and phone; no iOS input zoom; pull to refresh on phones. Feature flag: pullToRefresh.

- Given I use a phone · When I open the map · Then the panel is a bottom sheet I can drag
- Given I pull down at the top of a page on a phone · When I release · Then the page refreshes

## REQ-107 — Installable app with fast reopening

[Baseline · Account & platform] A web app manifest makes the site installable; a service worker caches the app so it reopens almost instantly and shows an 'update available' bar for new versions.

- Given I have visited before · When I reopen the site · Then it loads from cache almost at once
- Given a new version is deployed · When I have the old one open · Then I see an 'update available' bar

## REQ-108 — Links keep the current page

[Baseline · Account & platform] Each view has its own URL (#/map, #/trips/…, #/guide/SG…) so reload, back and shared links open the same page.

- Given I am on a trip's Costs tab · When I reload · Then the same trip and tab open

## REQ-109 — Search engine and link-preview friendly

[Baseline · Account & platform] Descriptive title and meta description, Open Graph / Twitter cards, JSON-LD, robots.txt, sitemap.xml and crawlable static text.

- Given someone shares beetheremap.com in a chat app · When the preview loads · Then it shows the Bee There title, description and image

## REQ-110 — Custom domain over HTTPS

[Baseline · Account & platform] The site is served at https://beetheremap.com through GitHub Pages.

- Given I open beetheremap.com · When the page loads · Then it is served over HTTPS without warnings

## REQ-111 — World map of visited countries

[Baseline · Map & places] Visited countries are filled honey yellow with a 👣 pin per visited place and 💛 for wishlist places; nearby famous places cluster.

- Given I have visited places in 3 countries · When I open the map · Then those 3 countries are filled and each place has a pin

## REQ-112 — Country view with famous places

[Baseline · Map & places] Clicking a country zooms in and lists its famous places (hand-picked plus up to ~100 from Wikidata, ranked by Wikipedia coverage, cached 7 days), filterable by city or region. Feature flag: wikidata.

- Given I click Malaysia · When the country opens · Then I see its famous places on the map and in the panel
- Given I pick a city filter · When the list updates · Then only places in that city show

## REQ-113 — Add places by search, map tap or Google Maps link

[Baseline · Map & places] Find any country, city or place (OpenStreetMap), tap the map to pin a spot (must be inside a country, user can name it), or paste a Google Maps link (short links supported).

- Given I paste a Google Maps link · When I confirm · Then a pin is created at that place
- Given I tap the sea · When I try to pin it · Then I am told to pick a place inside a country

## REQ-114 — Visited and wishlist lists

[Baseline · Map & places] Mark places visited (with date and optional occasion) or wishlist; lists grouped by country then city; places can be removed.

- Given I mark a place visited with date 10/11 · When I open Visited · Then it shows under its country and city with that date
- Given I remove a wishlist place · When the list refreshes · Then it is gone

## REQ-115 — Directions to a place

[Baseline · Map & places] Directions open Google Maps (desktop opens it directly) or Apple Maps (choice on phones) with the exact coordinates.

- Given I open a place · When I tap Directions on a phone · Then I can choose Apple Maps or Google Maps

## REQ-116 — Home panel: overview, popular places, quick links

[Baseline · Map & places] The map panel has Overview / Visited / Wishlist / Famous tabs, stats, most checked-in places and quick links. Feature flag: popularPlaces.

- Given I open the home map · When the panel loads · Then I see my stats and the most checked-in places

## REQ-117 — Show a trip on the map

[Baseline · Map & places] A trip can be shown on the map with its stops and numbered plan route; the map fits the trip.

- Given I tap 'View on map' on a trip · When the map opens · Then only that trip's stops and numbered route show

## REQ-118 — Photo check-ins

[Baseline · Check-ins & memories] Check in at any place with photos, caption, date, occasion and private/public visibility; several check-ins per place; photos compressed in the browser in 3 sizes and loaded according to network speed.

- Given I check in with 3 photos and set Public · When I save · Then the check-in appears in Memories and on Explore
- Given I am on a slow network · When I open a photo · Then the medium-size version loads

## REQ-119 — Edit and delete check-ins

[Baseline · Check-ins & memories] Edit caption, date, occasion, trip and photos; deleting a check-in updates the visited list and trip stops.

- Given I delete my only check-in at a place · When the deletion finishes · Then the trip's Journey no longer shows it

## REQ-120 — Memories page

[Baseline · Check-ins & memories] My check-ins sorted by check-in date, newest first, with 'On this day'.

- Given I open Memories · When the page loads · Then my check-ins are sorted newest first

## REQ-121 — Share studio

[Baseline · Check-ins & memories] Share 1–4 photos of a check-in as an image or video: Polaroid, Postcard, Film strip, Bento; Story 9:16, 4:5 or 1:1; preview before saving. Feature flag: share.

- Given I pick 2 photos, Polaroid and Story · When I export · Then I get a 9:16 image I can save or share

## REQ-122 — Year and trip recap

[Baseline · Check-ins & memories] Recap images and videos for a year or a trip with selectable layouts and photos. Feature flag: recap.

- Given I open the year recap · When I choose a layout · Then I can preview and save the image or video

## REQ-123 — Explore public check-ins

[Baseline · Social] Everyone's public check-ins by country or city, with likes. Feature flag: explore.

- Given I open Explore and filter Singapore · When the page loads · Then I see public check-ins from Singapore

## REQ-124 — Follow, friends feed and likes

[Baseline · Social] Follow people, see a friends feed and like public check-ins. Feature flag: follow.

- Given I follow Thư · When Thư posts a public check-in · Then it shows in my friends feed

## REQ-125 — In-app notifications

[Baseline · Social] Notifications for trip invites, follows and announcements from the team, with unread count.

- Given someone invites me to a trip · When I open notifications · Then I see the invite with Join and Decline

## REQ-126 — Create and manage shared trips

[Baseline · Trips] Create a trip with name, icon, dates and destinations; members edit details; only the owner deletes; trips sorted by start date and filterable by creator. Feature flag: trips.

- Given I create a trip with dates 10–14/11 · When I open Trips · Then it is listed by start date
- Given I am a member but not the owner · When I open the trip menu · Then I cannot delete it

## REQ-127 — Invite members

[Baseline · Trips] Invite by link, code or @username; invitees must accept; trips are visible to members only. Feature flag: tripInvites.

- Given I invite @thu · When Thư accepts · Then Thư becomes a member and sees the trip
- Given someone is not a member · When they open the trip link · Then they cannot see its content

## REQ-128 — Day-by-day plan

[Baseline · Trips] Plan places by day and time, reorder, mark done or skipped, change date/time from the map route panel; destinations suggest places.

- Given I add 3 places on 11/11 at different times · When I open the Plan · Then they are sorted by time within the day
- Given I mark a place done · When the plan refreshes · Then it shows as done and the place is marked visited

## REQ-129 — Journey

[Baseline · Trips] The Journey lists the places the group has been and check-ins linked to the trip.

- Given I check in at a place and link the trip · When the trip's Journey refreshes · Then the check-in is listed with its photos

## REQ-130 — Costs and settle-up

[Baseline · Trips] Estimated and actual costs, multi-currency with live rates, paid-by and split among the group or picked people, and who owes whom. Feature flag: tripCosts.

- Given I paid 100 SGD for 2 people · When I open Costs · Then each owes half converted with the trip rate and settle-up shows who pays whom

## REQ-131 — Checklists

[Baseline · Trips] Shared and personal checklists; items can be for the group, for each person, or 'only me'; drag to reorder. Feature flag: tripChecklist.

- Given an item is 'each person' · When I tick it · Then only my tick is recorded and the count shows ticks per member
- Given an "each person" item ticked by someone who has since left the trip · When I open the checklist · Then that tick is not counted or named (bug #108)

## REQ-132 — Plan PDF export

[Baseline · Trips] Export or share the itinerary as a compact PDF with the Bee There header. Feature flag: tripPdf.

- Given I tap Export PDF on a plan · When the file is ready · Then the PDF lists the days, times and places

## REQ-133 — Duplicate a trip

[Baseline · Trips] Copy an existing trip as a new trip. Feature flag: tripDuplicate.

- Given I duplicate a trip · When I open the copy · Then it has the same plan and checklists but only me as member

## REQ-134 — Country guides

[Baseline · Guides, tips & gear] Guides for 12 Asian countries: where to go, money, power plugs, visas with official entry-form links, emergency numbers with tap-to-call. Feature flag: guide.

- Given I open the Singapore guide · When the page loads · Then I see sections incl. the SG Arrival Card link and tap-to-call emergency numbers

## REQ-135 — Phrases with listen button

[Baseline · Guides, tips & gear] Phrases with native script and a 🔊 button; falls back to Google Translate when the device has no voice.

- Given my device has no voice for Thai · When I tap 🔊 · Then Google Translate opens with the phrase

## REQ-136 — Add guide places to a trip

[Baseline · Guides, tips & gear] Tap a place in 'Where to go' to add it to a trip plan. Feature flag: guideToTrip.

- Given I tap Add to trip on a guide place · When I pick my trip · Then the place is added to the plan

## REQ-137 — Local food by city

[Baseline · Guides, tips & gear] Must-try food filterable by city or region, with photos. Feature flag: guideFoodCities.

- Given I filter Penang · When the food list updates · Then only Penang dishes show

## REQ-138 — Sample trip cost calculator

[Baseline · Guides, tips & gear] Days, people and budget level give estimated costs in VND and local currency; can be applied to a trip. Feature flag: guideCosts.

- Given I choose 4 days, 2 people, mid budget · When I tap Apply to trip · Then the estimates are added to the trip's costs

## REQ-139 — Useful Google Maps links in guides

[Baseline · Guides, tips & gear] Staff-managed useful places (money exchange, embassies…) in each guide. Feature flag: guideLinks.

- Given staff add a link · When I open the guide · Then the link shows and opens Google Maps

## REQ-140 — Country travel tips

[Baseline · Guides, tips & gear] Community tips per country with Helpful / Misleading votes and Q&A; ranking configurable by admins. Feature flag: tips.

- Given I vote Helpful on a tip · When the list refreshes · Then its score goes up

## REQ-141 — Travel gear page

[Baseline · Guides, tips & gear] Gear ideas by trip type and purpose with clearly disclosed affiliate links; reachable from the top nav, Guides, a trip's Checklist tab and home quick links. Feature flag: gear.

- Given I open Gear and pick 'Beach' · When the list updates · Then I see beach gear with shop links marked as affiliate

## REQ-142 — About page with auto-updating features

[Baseline · Help & onboarding] About page with real screenshots; released features with a value text are listed automatically.

- Given an admin releases a feature with a value text · When I open About · Then the feature is listed

## REQ-143 — Quick tour

[Baseline · Help & onboarding] Onboarding tour that opens automatically after a new account's first sign-in (only on the map) and can be reopened. Feature flag: quickTour.

- Given I sign in for the first time · When the map loads · Then the quick tour opens
- Given I finished the tour · When I sign in again · Then it does not open by itself

## REQ-144 — Feedback and bug reports

[Baseline · Help & onboarding] Feedback tab with an element picker and screenshot; admins triage in the Feedback inbox. Feature flag: feedback.

- Given I pick an element and send a bug report · When an admin opens Feedback · Then the report shows with my screenshot

## REQ-145 — FAQ, What's new and Support the creator

[Baseline · Help & onboarding] FAQ, release notes and a support page with the owner's VietQR code.

- Given I open What's new · When the page loads · Then I see the latest release notes

## REQ-146 — Site announcements

[Baseline · Help & onboarding] Scheduled banners; once a user closes a banner it does not show again.

- Given I close an announcement · When I reload · Then it does not show again

## REQ-147 — Roles and permissions

[Baseline · Admin] Admin, Editor, Moderator, Marketing presets plus custom roles; modules show by permission; Admin always has every permission; enforced by Firestore rules.

- Given a user has the Editor role · When they open Admin · Then they only see modules their role allows

## REQ-148 — Feature flags

[Baseline · Admin] New features ship off by default (owner sees them); admins release them to beta users or everyone in Admin → Features.

- Given a flag is off · When a normal user opens the app · Then the feature is hidden
- Given the admin releases it to everyone · When the user reloads · Then the feature shows

## REQ-149 — Insights and audit log

[Baseline · Admin] Usage stats and charts; every admin action is written to the audit log.

- Given an admin hides a memory · When I open Logs · Then the action is listed with who and when

## REQ-150 — Content moderation and reports

[Baseline · Admin] Users report check-ins; moderators review full-size photos and hide or delete content.

- Given a check-in is reported · When a moderator hides it · Then it disappears from Explore

## REQ-151 — Places management

[Baseline · Admin] Override names, descriptions, images and hide wrong famous places; add custom places.

- Given an admin hides a wrong place · When users open that country · Then the place is not shown

## REQ-152 — Guides, tips, trips, gear and ads management

[Baseline · Admin] Admins edit guide content and links, tips settings, trips, the gear catalog and sample ad slots.

- Given an editor changes a guide section · When users open the guide · Then they see the new text

## REQ-153 — Send notifications

[Baseline · Admin] Send to everyone, a role or chosen users; history incl. revoked; received/read report exportable to Excel.

- Given I send a notification to the Editor role · When I open the report · Then I see who received and read it and can export it to Excel
