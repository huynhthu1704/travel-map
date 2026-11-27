# Test cases

## Traceability matrix
| Requirement | Test cases |
|---|---|
| REQ-002 Accessibility and performance baseline | TC-003 (Not run), TC-004 (Not run) |
| REQ-003 Add a Guide suggestion to a trip checklist in one step | ⚠ not covered |
| REQ-004 Choose which trip receives the suggestion | ⚠ not covered |
| REQ-005 Block duplicate Guide suggestions on one checklist | ⚠ not covered |
| REQ-006 Confirmation and clear error when adding a suggestion | ⚠ not covered |
| REQ-007 Admin sees how many Guide suggestions are added to checklists | ⚠ not covered |
| REQ-008 Admin count by Guide without personal data | ⚠ not covered |
| REQ-009 Make 'Add to checklist' visible on every Guide suggestion | ⚠ not covered |

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
