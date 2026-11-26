---
name: deliver-change
description: Use for any change to the Bee There repo (feature, bug fix, process change) — from a request in chat to a merged, traceable PR. Covers intent, GitHub issue, REQ/TC in compass/spec.json, branch, plan, independent review, merge and linking.
---

# Deliver a change the Compass way

Source of truth: `AGENTS.md`, `REVIEW.md`, `compass/agent-knowledge.md`. This is the short checklist.

0. Only implement requirements whose status is **Approved** or **In build** (AGENTS.md).
1. **Business need → intent** (new requests, REQ-054): write `intent/YYYY-MM-DD-topic.md` from `intent/README.md` — her words under `## Business need`, the measurable business intent under `## What we want`; Christine approves in chat → `Status: Approved (by Christine, <date>)`. Bugs skip this: she sends the bug id.
2. **Issue first:** English issue, label `requirement` (or `bug`), story + Given/When/Then. Deferred → also `on-hold`.
3. **Spec:** add REQ (with `"intent"` from REQ-051) and ≥ 1 TC to `compass/spec.json`; if a decision was made in chat, add an ADR; run `node compass/build-views.mjs`.
4. **Branch** from fresh `main`: `compass/REQ-xxx-short-name`; ≤ 12 files; never force push.
4b. **Design** (REQ-055): once the REQs are approved, write `compass/design/YYYY-MM-DD-topic.md` from `compass/design/README.md` (screens ↔ REQ ids, Figma links), set `"design"` on each REQ (`"none: <reason>"` without UI) and get Christine's approval before any code.
5. **Plan** (REQ-053): commit `compass/plans/<REQ-ids>-<name>.md` (Files, Steps, Risks, Proof) first; the PR body's `## Plan` links it. Check: `node compass/plan-file.mjs origin/main`.
5b. **Bug fix — failing test first (REQ-043):** the PR gets the label `bug`. Commit 1 only adds the failing test (`tests/` or `e2e/`) and nothing else; the fix comes in later commits, which must not edit that test (only with Christine's OK + `human-approved`). Check locally: `node compass/test-first.mjs origin/main --bug`.
6. **Build + test:** `npm test`, `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`, UI tests for UI changes. Commit only after the checks pass (no `| grep` without `set -o pipefail`). Commits start with the REQ id, English, with the attribution trailer.
7. **PR:** `Closes #N`. Protected paths, deleted files, new or upgraded dependencies and `firestore.rules` need Christine's decision first, then the label `human-approved` (REVIEW.md, CI guardrails check).
8. **Independent review:** a fresh subagent reviews per `REVIEW.md` and posts `## Independent review (Claude)` with `Reviewed commit: <sha>`. CHANGES NEEDED → fix, new review. Any push after an APPROVE needs a new review.
9. **Merge:** `MERGE_TRAILER="…" node compass/merge-pr.mjs <n>` (checks CI + review, keeps the plan, comments on the issue).
10. **Report** to Christine in plain English: what changed, which flag to switch on, anything she must decide.

## Enforced by
- `compass/check-spec.mjs` (REQ/TC/ADR/intent/handover), `compass/check-guardrails.mjs` in CI (files, paths, secrets, plan), `compass/merge-pr.mjs` (CI + APPROVE for the head commit, bug label on bug fixes), `compass/test-first.mjs` via `npm test` (failing test first on `bug` PRs), `.claude/settings.json` edit hook.
