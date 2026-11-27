# Requirements

| ID | Feature | Title | Priority | Status | Tests |
|---|---|---|---|---|---|
| REQ-002 | F-001 | Accessibility and performance baseline | Should | Approved | TC-003, TC-004 |
| REQ-003 | F-001 | Add a Guide suggestion to a trip checklist in one step | Must | Draft | ⚠ none |
| REQ-004 | F-001 | Choose which trip receives the suggestion | Should | Draft | ⚠ none |
| REQ-005 | F-001 | Block duplicate Guide suggestions on one checklist | Must | Draft | ⚠ none |
| REQ-006 | F-001 | Confirmation and clear error when adding a suggestion | Should | Draft | ⚠ none |
| REQ-007 | F-001 | Admin sees how many Guide suggestions are added to checklists | Must | Draft | ⚠ none |
| REQ-008 | F-001 | Admin count by Guide without personal data | Should | Draft | ⚠ none |
| REQ-009 | F-001 | Make 'Add to checklist' visible on every Guide suggestion | Could | Draft | ⚠ none |

## REQ-002 · Accessibility and performance baseline
As an user, I want every page to work with keyboard and screen readers and load quickly, so that everyone can use the product.

**Priority:** Should · **Status:** Approved

**Acceptance criteria**

_AC1_
```gherkin
Given any page
When I navigate with the keyboard only
Then every action is reachable and has a visible focus state
```

_AC2_
```gherkin
Given a 4G connection
When I open the home page
Then it becomes interactive within 2.5 seconds (Lighthouse)
```

## REQ-003 · Add a Guide suggestion to a trip checklist in one step
As a traveller who owns a trip, I want to add a suggestion I read in a Guide to my trip's checklist with one action, so that I don't retype it by hand.

**Priority:** Must · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given I view a Guide suggestion and have a trip selected · When I activate 'Add to checklist' once · Then a new unticked checklist item with the suggestion's text appears on that trip's checklist without a page reload
```

_AC2_
```gherkin
Given the suggestion text is longer than the checklist item limit of 120 characters (CHECK_ITEM_MAX in src/lib/checklist.js) · When I add it · Then the item is saved truncated to 120 characters and the add succeeds
```

_AC3_
```gherkin
Given I add a suggestion · When trip members open the shared checklist · Then they see the new item with the same tick behaviour as any other item
```

## REQ-004 · Choose which trip receives the suggestion
As a traveller with several trips, I want to pick the trip a suggestion goes to, so that it lands on the right checklist.

**Priority:** Should · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given I own two or more trips · When I activate 'Add to checklist' on a suggestion · Then I am asked to choose a trip before anything is saved, and the item is added only to the chosen trip
```

_AC2_
```gherkin
Given I have no trip yet · When I activate 'Add to checklist' · Then I see a message that I need a trip first with an action to create one, and no item is saved
```

_AC3_
```gherkin
Given I am only a member (not owner) of a trip and the app does not let me edit that trip's checklist · When the trip list is shown · Then that trip is not offered as a target
```

## REQ-005 · Block duplicate Guide suggestions on one checklist
As a traveller, I want the app to stop me adding the same Guide suggestion twice to one trip, so that my checklist has no repeated items.

**Priority:** Must · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given a trip's checklist already contains an item added from suggestion X · When I add suggestion X to the same trip again · Then no second item is created and I see a message that it is already on the checklist
```

_AC2_
```gherkin
Given suggestion X is already on trip A's checklist · When I add suggestion X to trip B · Then the item is added to trip B
```

_AC3_
```gherkin
Given I renamed the item that came from suggestion X · When I add suggestion X to the same trip again · Then it is still treated as a duplicate
```

## REQ-006 · Confirmation and clear error when adding a suggestion
As a traveller, I want to be told whether my suggestion was added or why it failed, so that I know the state of my checklist.

**Priority:** Should · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given the add succeeds · When the item is saved · Then I see a confirmation naming the trip within the same screen and the suggestion's action changes to an 'Added' state
```

_AC2_
```gherkin
Given the add cannot be saved (for example the device is offline or the save is rejected) · When I activate 'Add to checklist' · Then I see an error message that states the item was not added and what I can do next, and no item appears on the checklist
```

_AC3_
```gherkin
Given an error occurred · When I activate 'Add to checklist' again after the cause is fixed · Then the item is added once
```

## REQ-007 · Admin sees how many Guide suggestions are added to checklists
As an Admin, I want to see how many Guide suggestions travellers add to checklists, so that the team can tell whether Guides help people plan and keep using the app.

**Priority:** Must · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given travellers have added Guide suggestions · When an Admin opens Insights · Then the total number of suggestions added is shown for a selectable period (last 7 days, last 30 days, all time)
```

_AC2_
```gherkin
Given a suggestion add is blocked as a duplicate or fails with an error · When the count is calculated · Then that attempt is not counted
```

_AC3_
```gherkin
Given a user without Insights permission · When they open the admin area · Then they cannot see the count
```

## REQ-008 · Admin count by Guide without personal data
As an Admin, I want the count broken down by Guide while hiding who added what, so that we learn which Guides work without exposing individual travellers.

**Priority:** Should · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given suggestions were added from several Guides · When an Admin views the count · Then each Guide is listed with its number of adds
```

_AC2_
```gherkin
Given the stored count data · When it is inspected or exported · Then it contains no user id, name, email or trip id, only Guide, date and count
```

_AC3_
```gherkin
Given a Guide has no adds in the period · When the Admin views the list · Then that Guide is shown with a count of 0
```

## REQ-009 · Make 'Add to checklist' visible on every Guide suggestion
As a traveller reading a Guide, I want to see the 'Add to checklist' action next to each suggestion, so that I find it without searching.

**Priority:** Could · **Status:** Draft

**Acceptance criteria**

_AC1_
```gherkin
Given I open a Guide that has suggestions · When the page loads · Then each suggestion shows an 'Add to checklist' action without opening any menu
```

_AC2_
```gherkin
Given I use only a keyboard or a screen reader · When I move through a suggestion · Then the action can be reached and activated by keyboard and has an accessible name that includes the suggestion text (REQ-025 baseline)
```
