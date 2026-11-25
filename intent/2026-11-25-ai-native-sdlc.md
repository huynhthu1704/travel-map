# Intent: Close the gaps between Compass and the AI-native SDLC

Status: Approved (by Christine, 2026-11-25)
Requested: 2026-11-25 by Christine (Product Owner), in chat — "what is missing from the current compass framework vs the AI-native SDLC from claude academy", then "log them as issues" and the selection of the first seven.

## What we want
The way Bee There is built (Compass) should follow the practices of the Claude Academy *AI-native SDLC playbook*:
rules enforced by machines, independent review, written intent and plans, a lessons-learned memory, recorded
decisions and an always-current handover.

## Why
Several Compass rules were text the agent had to remember; the same agent wrote and merged its own code; the reasons
behind requirements and decisions lived only in chat; `handover.md` was out of date.

## Constraints
- No new paid services: the review runs as a subagent in the working session (no API key in CI).
- Changes to `.github/workflows/` only within the scope approved in chat (approved for #60 and #71; in the end only #60 needed a workflow change).
- ≤ 12 files per PR; English in the repo.

## Success measure
Each of the seven requirements is merged with a test; every later PR has an independent review comment, a plan and
traceable reasons (intent + ADRs).

## Out of scope
On hold for now: skills (#64), agent evals (#65), production monitoring (#66), failing-test-first rule (#67),
weekly security scan (#68), release tags (#72), protecting the enforcement files (#75).

## Requirements
- REQ-036 — Enforce guardrails.json automatically (#60)
- REQ-037 — Independent AI review of every pull request (#61)
- REQ-038 — Capture intent before writing requirements (#62)
- REQ-039 — Write a plan before coding each requirement (#63)
- REQ-045 — CLAUDE.md as the lessons-learned memory (#69)
- REQ-046 — Record decisions as ADRs (#70)
- REQ-047 — Keep handover.md up to date automatically (#71)
