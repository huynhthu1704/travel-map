# Decisions (ADR log)

_Generated from `spec.json` → `decisions`. Add an ADR in the same PR whenever a decision is made in chat (REQ-046)._

| ID | Date | Decision | Status | Requirements |
|---|---|---|---|---|
| ADR-001 | 2026-11-25 | Static site on GitHub Pages with Firebase on the free Spark plan | Accepted | — |
| ADR-002 | 2026-11-19 | New user-facing features ship behind default-off feature flags | Accepted | REQ-142 |
| ADR-003 | 2026-11-23 | GitHub issues are the tracker for requirements and bugs | Accepted | REQ-027 |
| ADR-004 | 2026-11-23 | Failing UI tests become bug issues; bugs are fixed when the Product Owner sends the id | Accepted | REQ-027 |
| ADR-005 | 2026-11-23 | Merge spec.json by requirement id when the Compass portal overwrites it | Accepted | — |
| ADR-006 | 2026-11-23 | Auto-merge pull requests when checks pass, report afterwards | Accepted | REQ-037 |
| ADR-007 | 2026-11-23 | Deploy only after green CI, smoke-test the live site and roll back automatically; no branch protection | Accepted | REQ-034 |
| ADR-008 | 2026-11-23 | Library audit blocks only critical findings for now | Proposed | REQ-034 |
| ADR-009 | 2026-11-23 | Excel export without new dependencies, itinerary and costs in one sheet | Accepted | REQ-026, REQ-029, REQ-030, REQ-032 |
| ADR-010 | 2026-11-25 | Independent review of every PR by a fresh Claude subagent; important findings block the merge | Accepted | REQ-037 |
| ADR-011 | 2026-11-25 | Guardrails are enforced by an edit hook and a CI check with a human-approved label | Accepted | REQ-036 |
| ADR-012 | 2026-11-25 | English for everything written in the repo and for replies to the Product Owner | Accepted | — |
| ADR-013 | 2026-11-24 | Trip archiving is on hold | Accepted | REQ-028 |

## ADR-001 — Static site on GitHub Pages with Firebase on the free Spark plan

**Status:** Accepted · **Date:** 2026-11-25

**Context.** Bee There must run at no monthly cost while the user base is small. Decided before Compass was adopted; recorded in the November 2026 back-fill.

**Decision.** Host the React/Vite build on GitHub Pages (beetheremap.com) and use Firebase Auth + Firestore on the Spark plan. No server code or Cloud Functions.

**Consequences.** Features needing a server (push notifications, scheduled jobs) need another free option (e.g. Cloudflare Workers, still open). Spark quotas limit growth.

## ADR-002 — New user-facing features ship behind default-off feature flags

**Status:** Accepted · **Date:** 2026-11-19 · **Requirements:** REQ-142

**Context.** New features should be tried by the owner before everyone sees them, and released features should be explained on the About page.

**Decision.** Every new user-facing feature gets a flag in src/data/flags.js with defaultOn: false and a one-line value text. The super admin always sees it; the Product Owner enables it in Admin → Tính năng.

**Consequences.** Merged code can be live but hidden; the Product Owner must switch flags on after review.

## ADR-003 — GitHub issues are the tracker for requirements and bugs

**Status:** Accepted · **Date:** 2026-11-23 · **Requirements:** REQ-027

**Context.** The Product Owner wants every request and bug traceable on GitHub; the repo is personal, so Issue Types are not available.

**Decision.** Log each new requirement as an English issue (label requirement, on-hold for deferred) before work starts; bugs use bug (+ e2e for automated). PRs say Closes #N and the issue gets a comment with branch, PR and merge commit.

**Consequences.** Every change is traceable from issue to commit; work starts slightly later because the issue comes first.

## ADR-004 — Failing UI tests become bug issues; bugs are fixed when the Product Owner sends the id

**Status:** Accepted · **Date:** 2026-11-23 · **Requirements:** REQ-027

**Context.** Playwright runs on every change and nightly; the Product Owner wants to choose which bugs to fix.

**Decision.** e2e/report-bugs.mjs opens or comments an [E2E] issue for each failing test on main/nightly and closes it when it passes again. Agents investigate but fix a bug only when the Product Owner sends its id.

**Consequences.** Bugs may stay open until prioritised; root causes are written on the issue meanwhile.

## ADR-005 — Merge spec.json by requirement id when the Compass portal overwrites it

**Status:** Accepted · **Date:** 2026-11-23

**Context.** A Compass portal commit replaced spec.json and dropped requirements written in the repo.

**Decision.** Merge both versions by requirement/test id (keep both, renumber clashes) instead of taking one side.

**Consequences.** Portal requirements were renumbered (REQ-001/002 → REQ-024/025).

## ADR-006 — Auto-merge pull requests when checks pass, report afterwards

**Status:** Accepted · **Date:** 2026-11-23 · **Requirements:** REQ-037

**Context.** The Product Owner prefers results over approval requests for routine work.

**Decision.** Squash-merge a PR as soon as CI is green and report afterwards. Since 2026-11-25 the independent review must also say APPROVE (ADR-010), and items in REVIEW.md 'What a person still reviews' wait for her.

**Consequences.** Fast delivery; quality relies on CI, tests and the independent review.

## ADR-007 — Deploy only after green CI, smoke-test the live site and roll back automatically; no branch protection

**Status:** Accepted · **Date:** 2026-11-23 · **Requirements:** REQ-034

**Context.** Deploys ran in parallel with CI; the Compass portal pushes directly to main.

**Decision.** Compass Deploy runs after Compass CI succeeds on main, smoke-tests beetheremap.com and redeploys the last good version on failure. Branch protection is not enabled because it would block the portal.

**Consequences.** Broken code can still reach main (not production); CI on main is the gate for deploys.

## ADR-008 — Library audit blocks only critical findings for now

**Status:** Proposed · **Date:** 2026-11-23 · **Requirements:** REQ-034

**Context.** npm audit reports high findings in firebase (@grpc/grpc-js, Node-only) and dev-only Vite 5 issues; blocking on high would stop every deploy.

**Decision.** CI blocks critical findings in shipped libraries and reports the rest in the run summary until the Product Owner decides on #56 (REQ-049).

**Consequences.** High findings remain until #56 is decided.

## ADR-009 — Excel export without new dependencies, itinerary and costs in one sheet

**Status:** Accepted · **Date:** 2026-11-23 · **Requirements:** REQ-026, REQ-029, REQ-030, REQ-032

**Context.** The Product Owner wants a spreadsheet of the itinerary and costs that opens with visible amounts.

**Decision.** Use the existing write-excel-file library; one 'Lịch trình & chi phí' sheet grouped by day with unlinked costs first, plus Chia tiền, Tỉ giá and Master data sheets; formulas carry cached values.

**Consequences.** No new dependency; the XML helpers in src/lib/xlsxValidation.js must be maintained.

## ADR-010 — Independent review of every PR by a fresh Claude subagent; important findings block the merge

**Status:** Accepted · **Date:** 2026-11-25 · **Requirements:** REQ-037

**Context.** The same agent wrote and merged its own code (AI-native SDLC gap).

**Decision.** A fresh review agent reviews each PR per REVIEW.md inside the working session (the option the Product Owner chose on 2026-11-25: no API key or extra cost, unlike a GitHub Action). CHANGES NEEDED blocks the merge; after a second fix with findings left, ask the Product Owner.

**Consequences.** Merges take longer; review is enforced by process, not by CI.

## ADR-011 — Guardrails are enforced by an edit hook and a CI check with a human-approved label

**Status:** Accepted · **Date:** 2026-11-25 · **Requirements:** REQ-036

**Context.** compass/guardrails.json was only text the agent had to remember.

**Decision.** A Claude Code PreToolUse hook blocks protected/forbidden paths and secrets; the CI Guardrails check fails PRs that break the rules unless the human-approved label is added after the Product Owner approves in chat.

**Consequences.** Protected-path PRs need a label; protecting the enforcement files themselves is open (#75).

## ADR-012 — English for everything written in the repo and for replies to the Product Owner

**Status:** Accepted · **Date:** 2026-11-25

**Context.** The Product Owner asked for English code comments and issues (2026-11-23) and English replies (2026-11-25).

**Decision.** Code comments, commits, PRs, issues, spec and replies are in English; the UI stays bilingual VI/EN.

**Consequences.** —

## ADR-013 — Trip archiving is on hold

**Status:** Accepted · **Date:** 2026-11-24 · **Requirements:** REQ-028

**Context.** Archiving trips older than a retention period (REQ-028) was requested, then put on hold by the Product Owner to think further.

**Decision.** Do not build REQ-028 until the Product Owner resumes it (#39).

**Consequences.** Old trips stay in Firestore and count towards Spark quotas.
