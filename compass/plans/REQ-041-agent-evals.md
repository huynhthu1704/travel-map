# Plan: REQ-041 Evals for the agent setup (free version)

Requirements: REQ-041 · Test cases: TC-116 · Issue: #65
Intent: compass/intent/2026-11-25-ai-native-sdlc.md · Design: none: process change, no UI

Scope chosen by the Product Owner on 2026-11-26 ("Free version first"): no Anthropic API key, no cost, no workflow
change. The suite replays past mistakes and review findings against the real guardrail code, not against Claude itself.
A paid version that re-runs past tasks with Claude can follow later (ADR-019).

## Files
- compass/evals/cases.json — 20–50 eval cases, each a past mistake or review finding with the expected outcome (blocked / allowed)
- compass/eval-agent-setup.mjs — runs the cases against the real checks (edit hook, CI guardrails, PR plan, plan file, test-first, merge-pr, intent and design checks), prints the pass rate, writes it to the CI run summary, exits 1 below 100 %
- tests/agentEvals.test.mjs — TC-116: every case passes, at least 20 active cases, unique ids, and no case on main was removed or had its expectation changed unless it is retired with the Product Owner's approval
- compass/REVIEW.md — retiring or weakening an eval case is a Product Owner decision
- compass/spec.json, compass/requirements.md, compass/tests.md, compass/handover.md, compass/decisions.md — REQ-041, TC-116, ADR-019 and the regenerated views
- compass/intent/2026-11-25-ai-native-sdlc.md — REQ-041 taken off hold
- compass/agent-knowledge.md — open items and the eval command

## Steps
1. Commit this plan.
2. Write the cases from CLAUDE.md lessons, earlier review findings and the guardrail rules; secrets are written as placeholders that the runner expands, so the cases file never holds secret-looking text.
3. Write the runner with one adapter per check and default "good" inputs, so a case only states what differs.
4. Add TC-116; run `npm test`, `node compass/check-spec.mjs`, `node compass/check-guardrails.mjs origin/main`, `node compass/plan-file.mjs origin/main`.

## Risks
- A case that passes for the wrong reason: each blocked case also names the reason it must be blocked for (`why`), and allowed control cases guard against rules that block everything.
- Weakening the suite to get green: the test compares with main's cases and fails when a case disappears or its expectation changes without `retired` (Product Owner approval), and REVIEW.md routes that to her.
- origin/main not available (shallow clone): the comparison is skipped with a message; CI checks out with full history.

## Proof
- `npm test` (TC-116) shows "Agent setup evals: n/n passed (100%)"; the CI run summary shows the same table.
- Changing a guardrail rule locally (e.g. removing CNAME from protectedPaths) makes the suite fail — shown in the PR description.
