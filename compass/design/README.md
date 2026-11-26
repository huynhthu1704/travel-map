# compass/design/ — an approved design before any code (REQ-055)

The design shows **how** the approved requirements will look and behave, before anyone writes code. It is drawn in
the project's one design tool (e.g. Figma; the link is in `compass/spec.json → designTool`) and described here so
that agents and reviewers can read it without opening the tool.

## Two kinds of design file
- `compass/design/F-xxx.md` — **written by the Compass portal** from `compass/spec.json → features[].design`.
  Edit the design in the portal (or in spec.json), not the file.
- `compass/design/YYYY-MM-DD-short-topic.md` — **written by an agent or a designer** for requirements that are not
  designed in the portal, from the template below. The requirement points to it with
  `"design": "compass/design/<file>.md"` in `compass/spec.json`. A change without any UI says so explicitly:
  `"design": "none: <reason>"`.

## Flow
1. Every requirement of the change is **Approved** → draft the design (`Status: Draft`): one section per screen,
   each listing the REQ ids it delivers, its elements and its states (empty, loading, error, success).
2. Draw it in the design tool and paste each frame link. Show it to the Product Owner.
   **From REQ-056 on (REQ-057), a design with UI must link at least one Figma frame** of the Bee There Figma file
   (`https://www.figma.com/design/<file>?node-id=…`, page "📐 Feature designs"); `check-spec` fails without it once
   the requirement is past Draft. A session without the Figma connector asks the Product Owner to connect it
   (claude.ai → Connectors) and keeps the requirement in Draft.
3. The Product Owner approves → `Status: Approved (by <name>, <date>)`. **Only then may code start**:
   `node compass/check-spec.mjs` fails when a requirement is In build or Done while its design is not Approved,
   and when a requirement from **REQ-052** on (below the REQ-101 baseline) has no `design` at all.
   Bee There specifics: design phone (360 px) first, reuse `src/styles/tokens.css`, give every text a VI and EN string,
   and put a new user-facing screen behind a default-off feature flag.
4. If the design must change during the build, set it back to Draft, update it and get it approved again.

## Template
```markdown
# Design: <short title>

Status: Draft
Requirements: REQ-xxx, REQ-yyy
Design tool: <link to the file or page in Figma…>

## Approach
<layout, navigation, components and styles reused>

## Screens
### SCR-1 · <name> — REQ-xxx
- Purpose: <what the user does here>
- Elements: <key components and content>
- States: <empty · loading · error · success>
- Frame: <link>

## Notes
<accessibility, phone layout, open questions>
```
