# Test cases

## Traceability matrix
| Requirement | Test cases |
|---|---|
| REQ-002 Accessibility and performance baseline | TC-003 (Not run), TC-004 (Not run) |

## TC-001 · Increase the number of user by adding some suggestion from 'Guides' into trip's checklist — happy path
Covers: REQ-001 · Type: Automated · Status: Not run
```gherkin
Given I am an user
When I increase the number of user by adding some suggestion from 'Guides' into trip's checklist with valid details and confirm
Then the result is saved and I see a confirmation
```

## TC-002 · Increase the number of user by adding some suggestion from 'Guides' into trip's checklist — invalid input
Covers: REQ-001 · Type: Automated · Status: Not run
```gherkin
Given a required field is empty or invalid
When I confirm
Then I see an error next to that field and nothing is saved
```

## TC-003 · Accessibility and performance baseline — happy path
Covers: REQ-002 · Type: Automated · Status: Not run
```gherkin
Given any page
When I navigate with the keyboard only
Then every action is reachable and has a visible focus state
```

## TC-004 · Accessibility and performance baseline — invalid input
Covers: REQ-002 · Type: Manual · Status: Not run
```gherkin
Given invalid input for Accessibility and performance baseline
When I submit
Then I see an error and nothing is saved
```
