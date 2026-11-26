# Intent: An approved design and a written plan before any code

Status: Approved
Requested: 2026-11-26 by the Product Owner, in chat — while bringing the AI-native SDLC into the Compass portal.

## Business need
Bring the AI-native SDLC into Compass and keep its files (intent, review) in the compass/ folder. Each project connects
to one design tool such as Figma. After the Product Owner gives the business need, it is revised into a business
intent; requirements are generated and wait for approval; once approved, the design is generated and waits for
approval before coding. Every change also needs a plan file (plan.md).

## What we want
Every new change in Bee There goes need → approved business intent → approved requirements → approved design → plan
file → code, so that 100% of requirements from REQ-052 on are coded only after the Product Owner approved both what
(intent, requirements) and how it looks (design), with the plan kept in the repo next to the code.

## Why
Designs and plans lived only in chat or PR bodies; code could start before anyone agreed what a screen looks like, and
the reasons were hard to find later. The Compass process files (intent, review policy) were scattered at the repo root.

## Constraints
- Same rules as before: ≤ 12 files per PR, English in the repo, no new paid services.
- Protected paths (`compass/check-guardrails.mjs`, `compass/guardrails-lib.mjs`, `.github/workflows/`) are **not**
  changed here; moving the CI plan check to plan files needs the Product Owner's explicit approval and the
  `human-approved` label.
- One design tool per project (Figma); its link lives in `compass/spec.json → designTool` once it is shared.

## Success measure
`node compass/check-spec.mjs` fails for a requirement In build without an approved design, `compass/merge-pr.mjs`
refuses a code PR without a plan file, and every PR after this one links an intent, a design and a plan.

## Out of scope
Changing the CI guardrails check or the workflows (protected); redrawing existing screens in Figma.

## Requirements
- REQ-052 — Keep intents and the review policy inside compass/
- REQ-053 — A plan file for every change that touches code
- REQ-054 — Revise the business need into a business intent
- REQ-055 — An approved design before any code
