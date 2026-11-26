# Intent: The live site never goes back to an older version by itself

Status: Approved (by Christine, 2026-11-26)
Requested: 2026-11-26 by Christine, in chat ("ok" to the proposed deploy safety check)

## What we want
After every merge, users of beetheremap.com get the newest version of `main` and never an older one. Today two
merges a few minutes apart can be published in the wrong order (2026-11-26: the Checklist sheet of REQ-056 went live
and was replaced 2 minutes later by the older commit `8654aa5`); target: 0 automatic deploys of a commit that is not
the newest commit of `main`, from the next merge on.

## Business need
"I don't see the update in the exported file, please check" — and, after the cause was found, "ok" to making the
deploy process check that it publishes the newest version and skip anything older.

## Why
Compass Deploy (REQ-034) runs once per green Compass CI run. CI runs of two pushes can finish in either order, so the
deploy of the older commit can run last and overwrite the newer site. Features then look "missing" although they are
merged.

## Constraints
- Protected path `.github/workflows/compass-deploy.yml`: changed with the Product Owner's approval (2026-11-26) and the
  `human-approved` label.
- Manual deploys and rollbacks (Actions → Compass Deploy → Run workflow) must still deploy any commit asked for.
- Free GitHub Actions / Pages only; no new service.

## Success measure
An automatic deploy whose commit is not the current head of `main` is skipped with a notice in the run, and the newer
commit's own deploy publishes it; TC-115 checks the workflow.

## Out of scope
- Changing the smoke test or the rollback.
- Deploying from pull requests.

## Requirements
- REQ-058 — Automatic deploys publish only the newest commit of main (#106)
