# Intent: Tidy Figma file — components on one page, one section per feature

Status: Approved (by Christine, 2026-11-27 — direct request in chat to apply it and record the rule)
Requested: 2026-11-27 by Christine, in chat

## What we want
The Product Owner can review a feature's design at a glance and find every reusable piece in one place: all Figma
components live on the "🧩 Components" page, and the screens of each feature are grouped in their own Figma section
on "📐 Feature designs" — now and for every future feature.

## Done when
- Every component of the Bee There Figma file is on the "🧩 Components" page (none on other pages).
- Each feature's screens on "📐 Feature designs" sit inside one section named after its REQ ids and topic.
- The design template, the deliver-change skill and the agent working knowledge state both rules, so future
  sessions follow them.

## Business need
"move all figma components into the figma page called 'Components', and it should work for all future feature.
for new feature, create a figma section and group all related screen into one section for clearer review and
visualization, update this rule to the repo if needed to remember this request"

## Why
Components were scattered over the feature and brand pages, and feature screens floated loose on one canvas, which
made reviews harder to follow.

## Constraints
- Figma node ids must not change, so existing frame links in design files keep working (moving a node keeps its id).
- No change to protected paths; no code change in the app.

## Out of scope
- Redesigning existing components or screens.
- An automatic check of the Figma file's layout (CI cannot read Figma).

## Requirements
- REQ-061 — Figma components on the Components page, one section per feature (#145)
