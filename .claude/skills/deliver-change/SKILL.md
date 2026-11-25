---
name: deliver-change
description: Use for any change to the Bee There repo (feature, bug fix, process change) — from a request in chat to a merged, traceable PR. Covers intent, GitHub issue, REQ/TC in compass/spec.json, branch, plan, independent review, merge and linking.
---

# Deliver a change the Compass way

Source of truth: `AGENTS.md`, `REVIEW.md`, `compass/agent-knowledge.md`. This is the short checklist.

1. **Intent** (new requests): write `intent/YYYY-MM-DD-topic.md` from `intent/README.md`; Christine approves in chat → `Status: Approved (by Christine, <date>)`. Bugs skip this: she sends the bug id.
2. **Issue first:** English issue, label `requirement` (or `bug`), story + Given/When/Then. Deferred → also `on-hold`.
3. **Spec:** add REQ (with `"intent"` from REQ-051) and ≥ 1 TC to `compass/spec.json`; if a decision was made in chat, add an ADR; run `node compass/build-views.mjs`.
4. **Branch** from fresh `main`: `compass/REQ-xxx-short-name`; ≤ 12 files; never force push.
5. **Plan** in the PR body before coding: `## Plan` with Files, Steps, Risks, Proof.
6. **Build + test:** `npm test`, `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`, UI tests for UI changes. Commit only after the checks pass (no `| grep` without `set -o pipefail`). Commits start with the REQ id, English, with the attribution trailer.
7. **PR:** `Closes #N`; protected paths only with Christine's approval + label `human-approved`.
8. **Independent review:** a fresh subagent reviews per `REVIEW.md` and posts `## Independent review (Claude)` with `Reviewed commit: <sha>`. CHANGES NEEDED → fix, new review. Any push after an APPROVE needs a new review.
9. **Merge:** `MERGE_TRAILER="…" node compass/merge-pr.mjs <n>` (checks CI + review, keeps the plan, comments on the issue).
10. **Report** to Christine in plain English: what changed, which flag to switch on, anything she must decide.

## Enforced by
- `compass/check-spec.mjs` (REQ/TC/ADR/intent/handover), `compass/check-guardrails.mjs` in CI (files, paths, secrets, plan), `compass/merge-pr.mjs` (CI + APPROVE for the head commit), `.claude/settings.json` edit hook.
