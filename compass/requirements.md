# Requirements

| ID | Feature | Title | Priority | Status | Tests |
|---|---|---|---|---|---|
| REQ-002 | F-001 | Accessibility and performance baseline | Should | Approved | TC-003, TC-004 |

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
