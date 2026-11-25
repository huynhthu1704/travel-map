# Intents (REQ-038)

An **intent** is a short note of *what* the Product Owner wants, *why*, and under which *constraints*, written before
any requirement. It keeps the reason behind a requirement next to the code instead of in a chat.

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
<the outcome in plain words — not the solution>

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
