# Intents (REQ-038)

An **intent** is a short note of *what* the Product Owner wants, *why*, and under which *constraints*, written before
any requirement. It keeps the reason behind a requirement next to the code instead of in a chat.

**Business need → business intent (REQ-054).** The Product Owner states a *business need* in her own words. The agent
keeps it verbatim under `## Business need` and revises it into a *business intent* under `## What we want`: one
measurable outcome — who, what changes, baseline → target, by when — not the solution. She approves the intent, not
the wording of the need.

## Flow
1. A new request arrives in chat → the agent writes `intent/YYYY-MM-DD-short-topic.md` from the template below
   (`Status: Draft`) and shows it to the Product Owner.
2. The Product Owner approves (or corrects) it in chat → the agent sets `Status: Approved (by Christine, <date>)`.
3. Only then are requirements (REQ-xxx) and their GitHub issues created. Each requirement gets
   `"intent": "intent/<file>.md"` in `compass/spec.json`, and the intent lists its requirements.

`node compass/check-spec.mjs` fails when a requirement points to a missing intent or to one that is not Approved,
and when a requirement from **REQ-051** onward (below the REQ-101 baseline) has no intent.

## Template
```markdown
# Intent: <short title>

Status: Draft
Requested: <YYYY-MM-DD> by <who>, in <where>

## What we want
<the business intent: who, what changes, baseline → target, by when — not the solution>

## Business need
<the Product Owner's request, in her own words>

## Why
<the problem or opportunity, with any evidence>

## Constraints
<budget, deadline, free Firebase Spark plan, privacy, things that must not change>

## Success measure
<how we will know it worked>

## Out of scope
<what we are deliberately not doing>

## Requirements
<filled after approval: REQ-xxx — title (#issue)>
```
