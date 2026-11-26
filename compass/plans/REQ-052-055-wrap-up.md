# Plan: REQ-052–055 wrap-up — mark Done and close the review nits

Requirements: REQ-052, REQ-053, REQ-054, REQ-055 (issues #94–#97, closed) · Test cases: TC-110
Intent: compass/intent/2026-11-26-design-and-plan-before-code.md · Design: none: process change, no UI
Follow-up of PRs #89–#93 (all merged), as offered to the Product Owner after the merge.

## Files
- `compass/spec.json` — REQ-052–055 In build → Done; regenerated `compass/requirements.md` and `compass/handover.md`
- `compass/plan-file.mjs` — the "run as a script" check compares real paths, so a symlinked start still runs the check
- `compass/merge-pr.mjs` — `contentsPath()` URL-encodes the plan file path when fetching it at the PR head
- `tests/plan.test.mjs` — TC-110 tests for both fixes
- `compass/plans/REQ-052-move-review.md` — out-of-date Proof line; this plan

## Steps
1. Commit this plan first.
2. Fix plan-file.mjs (realpath on both sides, the same way merge-pr already does) and merge-pr.mjs (encoded contents path).
3. Add the TC-110 tests; set REQ-052–055 to Done; run build-views, npm test, check-spec, plan-file.

## Risks
- Marking Done removes REQ-052–055 from the handover's open list. Mitigation: all five PRs are merged and their issues closed.
- The symlink test needs symlink support. Mitigation: CI runs on Linux; a Windows checkout without symlink rights would fail only this test, which says why.

## Proof
- `npm test`: the new TC-110 tests (encoded path for names with space, `#` and `?`; check runs through a symlink) pass, and fail without the fixes.
- `node compass/check-spec.mjs` passes with REQ-052–055 Done; `node compass/plan-file.mjs origin/main` passes.
