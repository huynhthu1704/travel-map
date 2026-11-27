# Intent: "Done when" first — targets only for real bets

Status: Approved (by Christine, 2026-11-27)
Requested: 2026-11-27 by Christine, in chat (while reviewing the Compass Ideation agent's brief for F-001 "Increase the number of users")

## What we want
Every business intent says, in plain words, what will be true when the change is done ("Done when"), and a numeric
target is asked for only when the Product Owner treats the change as a bet. Today the intent template (REQ-054) and the
Compass Ideation agent ask every intent for a "baseline → target, by when", so 100% of AI-drafted briefs carry a
target, even when there is no data behind it (e.g. "0% → 20% within 90 days"). Target: from the next intent on, no
intent or AI-drafted brief contains a made-up baseline or target; each has a "Done when", and at most one optional
"signal to watch" without a target.

## Done when
The intent template and agent instructions in both repos ask for a "Done when" on every intent, and for a baseline
and target only when the Product Owner names the change a bet; the Compass Ideation agent no longer writes invented
numbers into a brief.

## Business need
"Does every business intent need to come with an outcome metric? It's difficult to define an outcome metric from the
beginning, and the outcome metrics currently suggested by AI don't make much sense to me." — then, on the proposal of a
"Done when" + optional signal rule for both repos: "yes please"; intent approved in chat with "approve".

## Why
The baseline and target numbers the agent suggests are invented (there is no usage data in Bee There for new flows,
and no tracking exists), so they cannot be checked and make the brief harder to approve. A clear "Done when" can be
checked by the Product Owner; a real target is only useful after a few weeks of real data.

## Constraints
- Three kinds of change:
  1. small feature or convenience: "Done when" + optional signal to watch, no target
  2. process or internal change: "Done when" only
  3. a bet the Product Owner names as such: a metric with a baseline; the target is set after a few weeks of real data
- Applies to both repos: travel-map (intent template, AGENTS.md, deliver-change skill) and Compass (Ideation agent
  instructions, the framework text it installs, Idea page help text).
- Existing approved intents stay as they are.
- No new tracking, no new service, no protected paths.

## Success measure
The next intent written in either repo, and the next brief the Compass Ideation agent drafts, has a "Done when" and no
invented baseline or target; the Product Owner can approve it without having to make up numbers.

## Out of scope
- Rewriting existing intents or feature briefs (e.g. F-001's brief is corrected by re-running the agent in the portal).
- Building usage tracking or analytics.

## Requirements
<filled after approval>
