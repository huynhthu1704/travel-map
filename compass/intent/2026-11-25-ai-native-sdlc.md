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
- Changes to `.github/workflows/` only within the scope approved in chat (approved for #60 and #71; in the end only #60 needed a workflow change; on 2026-11-26 a new `compass-security.yml` for #68).
- ≤ 12 files per PR; English in the repo.

## Success measure
Each of the seven requirements is merged with a test; every later PR has an independent review comment, a plan and
traceable reasons (intent + ADRs).

## Out of scope
On hold for now: agent evals (#65), production monitoring (#66), release tags (#72).

## Requirements
- REQ-036 — Enforce guardrails.json automatically (#60)
- REQ-037 — Independent AI review of every pull request (#61)
- REQ-038 — Capture intent before writing requirements (#62)
- REQ-039 — Write a plan before coding each requirement (#63)
- REQ-045 — CLAUDE.md as the lessons-learned memory (#69)
- REQ-040 — Turn project policies into repo skills (#64) — taken off hold by the Product Owner on 2026-11-25 ("fix #64")
- REQ-046 — Record decisions as ADRs (#70)
- REQ-047 — Keep handover.md up to date automatically (#71)
- REQ-050 — Protect the guardrail enforcement files themselves (#75) — taken off hold by the Product Owner on 2026-11-25 together with #81
- REQ-051 — Harden merge-pr and the plan check (#81) — follow-up of the PR #80 and #83 reviews, taken off hold by the Product Owner on 2026-11-25 ("fix #75 and #81")
- REQ-043 — Failing test committed before the fix for every bug (#67) — taken off hold by the Product Owner on 2026-11-25 ("fix #67")
- REQ-044 — Weekly security scan of the code and libraries (#68) — taken off hold by the Product Owner on 2026-11-26 ("fix #68"); she chose npm audit + CodeQL and dismissal by a `Dismissed:` reason comment
