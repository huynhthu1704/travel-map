# compass/plans/ — a written plan before any code (REQ-053)

Before changing code, write **one plan file per change**: `compass/plans/<REQ-ids>-<short-name>.md`
(for example `compass/plans/REQ-004-guest-checkout.md`). Commit it as the first commit of the branch, then code.
If the approach changes during the work, update the plan in the same PR — it is the record of *how* and *why*.

`node compass/merge-pr.mjs` refuses to merge a PR that changes code without a plan file that fills in
**Files, Steps, Risks and Proof** (REQ-053); check it locally with `node compass/plan-file.mjs`. Placeholders such as
`-`, `TBD` or `n/a` do not count. The PR body keeps its short `## Plan` (Files, Steps, Risks, Proof — the CI guardrails
check still reads it) and links the plan file.

The independent reviewer reads the plan first and checks the diff against it.

## Template
```markdown
# Plan: <REQ-ids> <short title>

Requirements: REQ-xxx · Test cases: TC-xxx · Issue: #N
Intent: <intent file> · Design: <design file, or none: <reason>>

## Files
- <path> — <what changes>

## Steps
1. <step>

## Risks
- <what could break, and how we guard against it>

## Proof
- <which tests / checks show it works, e.g. `npm test` TC-012, screenshot of the approved design screen>
```
