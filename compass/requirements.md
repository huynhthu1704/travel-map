# Requirements

| ID | Title | Priority | Status | Tests |
|---|---|---|---|---|
| REQ-001 | Increase the number of user by adding some suggestion from 'Guides' into trip's checklist | Must | In build | TC-001, TC-002 |
| REQ-002 | Accessibility and performance baseline | Should | Approved | TC-003, TC-004 |

## REQ-001 · Increase the number of user by adding some suggestion from 'Guides' into trip's checklist
As an user, I want to increase the number of user by adding some suggestion from 'Guides' into trip's checklist, so that I can get it done without back-and-forth messages.

**Priority:** Must · **Status:** In build

**Acceptance criteria**

_AC1_
```gherkin
Given I am an user
When I increase the number of user by adding some suggestion from 'Guides' into trip's checklist with valid details and confirm
Then the result is saved and I see a confirmation
```

_AC2_
```gherkin
Given a required field is empty or invalid
When I confirm
Then I see an error next to that field and nothing is saved
```

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
