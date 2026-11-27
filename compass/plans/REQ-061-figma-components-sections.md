# Plan: REQ-061 — Figma components on the Components page, one section per feature

Requirements: REQ-061 · Test cases: TC-121 · Intent: intent/2026-11-27-figma-components-and-sections.md
Design: none: process rule, no app UI · Issue #145 · Decision: ADR-022

## Files
- `compass/design/README.md` — Flow step 2 states the Figma file layout; the template links the feature's section
- `.claude/skills/deliver-change/SKILL.md`, `compass/agent-knowledge.md` — the same rule in one line each
- `tests/design.test.mjs` — TC-121: the three texts name REQ-061, the Components page and one section per feature
- `compass/intent/2026-11-27-figma-components-and-sections.md`, `compass/spec.json` (REQ-061, TC-121, ADR-022) and the
  generated views (requirements.md, tests.md, decisions.md, handover.md)

## Steps
1. Plan (this file). The Figma file itself was already tidied in this session: components moved to "🧩 Components"
   (sections "Feature components", "Brand components"); feature screens grouped in sections 36:76 (REQ-056) and
   36:77 (REQ-059 / REQ-060 push notifications). Node ids are unchanged, so existing frame links still work.
2. Rule text in the template, skill and agent knowledge; TC-121.
3. Spec, ADR-022, `node compass/build-views.mjs`.

## Risks
- CI cannot read Figma, so the layout itself is not checked automatically; the rule relies on the texts every
  design session reads (TC-121 keeps them in place).

## Proof
- `npm test` (TC-121 and the existing design tests), `node compass/check-spec.mjs`,
  `node compass/check-guardrails.mjs origin/main`, `node compass/plan-file.mjs origin/main`.
