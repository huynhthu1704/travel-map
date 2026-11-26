# Plan: REQ-057 — a Figma frame in every UI design

Requirements: REQ-057 · Test cases: TC-113 · Intent: intent/2026-11-26-figma-for-ui-designs.md
Design: none: process change, no UI · Issue #100

## Files
- `compass/build-views.mjs` — `designProblems`: from REQ-056, a requirement In build or Done whose design is a file
  needs a frame link of the project Figma file (`designTool?node-id=…`) in it
- `tests/design.test.mjs` — TC-113
- `compass/design/README.md` — the rule and the Bee There Figma file
- `compass/agent-knowledge.md`, `.claude/skills/deliver-change/SKILL.md` — standing instruction for every session
- `compass/intent/2026-11-26-figma-for-ui-designs.md` — Approved, requirement listed
- `compass/spec.json` (`designTool`, REQ-057, TC-113, ADR-016) and the generated views (requirements, tests,
  decisions, handover)

## Steps
1. Add `FIGMA_REQUIRED_FROM = 56` and the frame-link check to `designProblems`.
2. Add TC-113 (missing link fails In build/Done; Approved, Draft, `none:`, older and baseline requirements pass; another file's frame fails; a frame of designTool passes).
3. Update the template, agent knowledge and the deliver-change skill; record ADR-016 and `designTool`.
4. Run build-views, npm test, check-spec, check-guardrails.

## Risks
- A design cannot be drawn when a session has no Figma connector. Mitigation: the requirement stays Approved, not In build and the
  agent tells the Product Owner to connect Figma (claude.ai → Connectors).
- A link that is not the right frame. Mitigation: the Product Owner approves the design from the link itself; the
  independent reviewer opens it.

## Proof
- `npm test`: TC-113 in `tests/design.test.mjs`.
- `node compass/check-spec.mjs` passes on main's requirements (REQ-052–055 are `none:` or older than REQ-056).
