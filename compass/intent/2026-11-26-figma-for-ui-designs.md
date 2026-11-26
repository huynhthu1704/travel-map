# Intent: A Figma design for every UI change, approved before code

Status: Draft
Requested: 2026-11-26 by Christine, in chat (while reviewing the design of REQ-056)

## What we want
The Product Owner approves every change that touches what users see from a real Figma design, not only from a text
description. Today design notes (REQ-055) can be text only — 0 of them link a Figma frame; target: from REQ-056 on,
100% of requirements that change the UI have a design file with at least one Figma frame link in the Bee There Figma
file before they can move to In build.

## Business need
"Please create a corresponding Figma design as well. This should be part of every requirement that makes a change in
the UI, for approval."

## Why
A text description of a screen is hard to judge; a picture in the brand's design system (honey-yellow, Figma) lets
the Product Owner see and correct the result before any code is written.

## Constraints
- One design tool: the Bee There Figma file (https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ), recorded as
  `designTool` in `compass/spec.json`.
- Claude sessions need the Figma connector (claude.ai → Connectors) to draw frames; without it the design waits.
- Changes without UI keep `"design": "none: <reason>"`.
- No change to protected paths (CI workflows, guardrails check).

## Success measure
`node compass/check-spec.mjs` fails when a UI requirement from REQ-056 on is past Draft and its design file has no
figma.com frame link; every design approved after this change shows its Figma frames.

## Out of scope
- Redrawing existing screens or older requirements in Figma.
- Figma for spreadsheets/PDF layouts beyond a picture of the sheet (they get one frame showing the layout).

## Requirements
<filled after approval>
