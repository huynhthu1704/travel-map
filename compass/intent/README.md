# Intents (REQ-038)

An **intent** is a short note of *what* the Product Owner wants, *why*, and under which *constraints*, written before
any requirement. It keeps the reason behind a requirement next to the code instead of in a chat.

**Business need → business intent (REQ-054).** The Product Owner states a *business need* in her own words. The agent
keeps it verbatim under `## Business need` and revises it into a *business intent* under `## What we want`: the
outcome in plain words — who, what changes — not the solution. She approves the intent, not the wording of the need.

**Done when, and targets only for bets (REQ-059, ADR-021).** Every intent says under `## Done when` what will be true
when the change is done. Never invent a baseline or a target; how much to measure depends on the kind of change:

| Kind of change | What the intent carries |
|---|---|
| Small feature or convenience | `## Done when` + at most one optional *signal to watch* under `## Signal to watch`, with no target |
| Process or internal change | `## Done when` only |
| A bet the Product Owner names as such | `## Done when` + one metric with its current value; the target is set after a few weeks of real data |

## Flow
1. A new request arrives in chat → the agent writes `compass/intent/YYYY-MM-DD-short-topic.md` from the template below
   (`Status: Draft`) and shows it to the Product Owner.
2. The Product Owner approves (or corrects) it in chat → the agent sets `Status: Approved (by Christine, <date>)`.
3. Only then are requirements (REQ-xxx) and their GitHub issues created; once they are approved, the design follows
   (`compass/design/README.md`, REQ-055) and must be approved before any code. Each requirement gets
   `"intent": "compass/intent/<file>.md"` in `compass/spec.json`, and the intent lists its requirements.

`node compass/check-spec.mjs` fails when a requirement points to a missing intent or to one that is not Approved,
and when a requirement from **REQ-051** onward (below the REQ-101 baseline) has no intent; from **REQ-059** on, its
intent must have a `## Done when` section.

## Template
```markdown
# Intent: <short title>

Status: Draft
Requested: <YYYY-MM-DD> by <who>, in <where>

## What we want
<the business intent: who, what changes — not the solution>

## Done when
<what will be true when the change is done, in plain words>

## Business need
<the Product Owner's request, in her own words>

## Why
<the problem or opportunity, with any evidence>

## Constraints
<budget, deadline, free Firebase Spark plan, privacy, things that must not change>

## Signal to watch
<optional, no target: one thing to look at afterwards. For a bet: the metric and its current value; target set
after a few weeks of real data. Delete this section for a process change>

## Out of scope
<what we are deliberately not doing>

## Requirements
<filled after approval: REQ-xxx — title (#issue)>
```
