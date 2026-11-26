# compass/REVIEW.md — independent review of every pull request (REQ-037)

Every pull request is reviewed **before it is merged** by a Claude review pass that **did not write the code**.
The author agent never reviews or approves its own work.

## Who reviews and how
- The author agent starts a **fresh review agent** (a subagent with no memory of how the code was written).
- The reviewer gets only: the PR number, its diff (`gh pr diff <n>` or the REST `pulls/<n>/files` API), the linked
  requirement(s) in `compass/spec.json` and the PR's **Plan** section. It may read any file in the repo.
- The reviewer posts one PR comment that starts with `## Independent review (Claude)` in the format below.
- The review is advisory input to the merge decision; it does not edit code.

## Review passes (in this order)
1. **Correctness** — bugs, broken edge cases (empty data, demo mode, signed-out user, phone layout), regressions
   in code paths the diff touches.
2. **Requirement match** — every Given/When/Then of the linked REQ is implemented and covered by a test (TC);
   nothing outside the requirement's scope was changed without being stated in the PR.
3. **Security and privacy** — secrets or keys in the diff, unsafe HTML, user data exposed to other users,
   Firestore rule changes, new network calls to third parties.
4. **Compass contract** — `compass/guardrails.json` (protected paths, ≤ 12 files, no forbidden paths),
   new user-facing features behind a default-off feature flag with a `value` text, VI and EN strings both present,
   code comments in English, `Closes #N` in the PR body.
5. **Maintainability** — only issues that will cause real trouble later (duplicated logic, dead code,
   files growing past `maxLinesPerFile`).

**Bug fixes (REQ-043):** a PR that closes a `bug` issue carries the `bug` label; its first commit only adds the failing
test and later commits do not edit it (`compass/test-first.mjs` in `npm test` checks this and runs a unit test at the
first commit). When the failing test is UI-only (`e2e/`), CI cannot run it there: the reviewer checks out the first
commit, runs that test (`npx playwright test <file>`) and confirms it fails; a test that does not fail is an important finding.

## Severity
- **important** — must be fixed before merge: a bug users would hit, an acceptance criterion not met or not
  tested, a security/privacy risk, a guardrail broken.
- **nit** — optional improvement. Report **at most 5** nits; skip style preferences.

## Comment format
```
## Independent review (Claude)
Verdict: <APPROVE | CHANGES NEEDED>   ·   Important: <n>   ·   Nits: <n>
Reviewed commit: <full SHA of the PR head you reviewed — `git rev-parse HEAD`>

### Important
1. <file:line> — <what is wrong> → <what to do>

### Nits
- <file:line> — <suggestion>

### Accepted by the Product Owner   (only when she accepted a finding in chat)
- <finding> — accepted on <date>: "<her words>" (see the PR comment)
```
`CHANGES NEEDED` exactly when there is at least one important finding. An APPROVE only covers the reviewed commit:
any later push needs a fresh review before merging (`compass/merge-pr.mjs` enforces this, REQ-039).

## Merge rule (set by the Product Owner on 2026-11-25)
- `APPROVE` + CI green → the PR is squash-merged automatically and the result is reported afterwards.
- `CHANGES NEEDED` → **no merge**. The author fixes the findings, pushes, and asks for a **new** review
  (again a fresh reviewer). If important findings remain after the second fix, stop and ask the Product Owner.
- **Accepted finding (REQ-051):** the Product Owner may accept an important finding explicitly in chat. Route:
  1. the author posts a PR comment quoting her decision (date and her words);
  2. the author asks a **fresh** review agent for a new review of the head commit and gives it that comment;
  3. the reviewer lists the finding under `### Accepted by the Product Owner` (not under Important, not in the count)
     and says `APPROVE` if no other important finding remains.
  `compass/merge-pr.mjs` only merges on that new APPROVE; nobody edits an old review or merges over `CHANGES NEEDED`.

## What a person still reviews
The Product Owner decides — the review agent cannot approve — when a PR:
- changes a protected path (`.github/workflows/`, `compass/guardrails.json`, the enforcement files (`compass/check-guardrails.mjs`, `compass/guardrails-lib.mjs`, `compass/hooks/`, `.claude/settings.json`, `.claude/settings.local.json`, REQ-050), `.env`, `CNAME`),
- changes `firestore.rules`, deletes files or adds/upgrades a dependency,
- deletes or migrates user data, or changes costs, payments or sign-in.

## Repeated findings
Reviewers start fresh, so the **author agent** checks earlier `## Independent review (Claude)` comments and
`CLAUDE.md → Lessons learned` before fixing. If the same kind of important finding appears in two PRs,
add a one-line lesson to `CLAUDE.md → Lessons learned` in the fixing PR so later sessions avoid it.
