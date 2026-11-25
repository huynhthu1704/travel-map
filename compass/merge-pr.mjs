// REQ-039 (+ REQ-037): merge a pull request only when the delivery rules hold, and keep the plan in git history.
// Usage: node compass/merge-pr.mjs <pr-number> [--dry-run]
// Checks: the Compass CI jobs passed on the head commit · the latest independent review by a trusted author says
// APPROVE for exactly that head commit · a code PR still has a filled-in Plan (REQ-051) · a fix for a bug issue carries the bug label (REQ-043) · firestore.rules changes carry the human-approved label. Then squash-merges
// (pinned to the reviewed commit) with the PR's "## Plan" as the commit message and comments on each "Closes #N"
// issue with the branch, PR and merge commit (traceability rule). Uses the REST API only (no GraphQL).
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPlan, planProblems, APPROVAL_LABEL } from './guardrails-lib.mjs';

export const REVIEW_HEADING = '## Independent review (Claude)';
export const REQUIRED_CHECKS = ['test', 'e2e'];
// Only people with write access count as reviewers: the repository is public, so anyone can comment
export const TRUSTED = ['OWNER', 'MEMBER', 'COLLABORATOR'];

/** Issue numbers closed by a PR body ("Closes #12", "fixes #3", "resolves #4"). */
export function parseCloses(body) {
  return [...new Set([...(body || '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)].map((m) => Number(m[1])))];
}

/** Newest independent review by a trusted author: { verdict, sha } or null. */
export function latestReview(comments) {
  const reviews = (comments || []).filter((c) => (c.body || '').trimStart().startsWith(REVIEW_HEADING) && TRUSTED.includes(c.author_association));
  if (!reviews.length) return null;
  const last = [...reviews].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).at(-1);
  return {
    verdict: (last.body.match(/Verdict:\s*(APPROVE|CHANGES NEEDED)/) || [])[1] || null,
    sha: (last.body.match(/Reviewed commit:\s*`?([0-9a-f]{7,40})`?/i) || [])[1] || null,
  };
}
export const latestReviewVerdict = (comments) => latestReview(comments)?.verdict ?? null;

/** Reasons the PR must not be merged yet (empty = OK). */
export function mergeBlockers({ checkRuns, comments, files, labels, headSha, body, bugIssues = [] }) {
  const blockers = [];
  const runs = checkRuns || [];
  for (const name of REQUIRED_CHECKS) {
    const r = runs.filter((x) => x.name === name).at(-1);
    if (!r) blockers.push(`CI check "${name}" has not run on the latest commit`);
    else if (r.status !== 'completed') blockers.push(`CI check "${name}" is still ${r.status}`);
    else if (r.conclusion !== 'success') blockers.push(`CI check "${name}" ended with ${r.conclusion}`);
  }
  for (const r of runs) if (!REQUIRED_CHECKS.includes(r.name) && r.status === 'completed' && ['failure', 'timed_out', 'cancelled'].includes(r.conclusion)) blockers.push(`check "${r.name}" ended with ${r.conclusion}`);
  const review = latestReview(comments);
  if (!review) blockers.push('no independent review comment from a trusted reviewer yet (see REVIEW.md)');
  else if (review.verdict !== 'APPROVE') blockers.push(`the latest independent review says ${review.verdict || 'no verdict'} — fix and ask for a fresh review`);
  else if (!review.sha || !headSha || !headSha.startsWith(review.sha)) blockers.push(`the APPROVE review is for commit ${review.sha || '(none given)'}, but the PR head is ${headSha} — ask for a fresh review of the latest commit`);
  // REQ-051: CI checked the plan when it ran; the body may have been edited since, so check it again now
  for (const p of planProblems(body, (files || []).map((f) => ({ path: f.filename })))) blockers.push(`plan: ${p}`);
  // REQ-043: a fix for a bug issue needs the bug label, so the CI test-first check (compass/test-first.mjs) ran on it
  for (const i of bugIssues) if (!(labels || []).includes('bug')) blockers.push(`#${i} is a bug — add the "bug" label to the PR so CI checks that a failing test was committed first (REQ-043), then wait for CI`);
  if ((files || []).some((f) => f.filename === 'firestore.rules') && !(labels || []).includes(APPROVAL_LABEL)) blockers.push(`firestore.rules changed — the Product Owner decides (REVIEW.md); add "${APPROVAL_LABEL}" after she approves`);
  return blockers;
}

/** Squash-commit message: the plan, so it is kept in git history with the code. */
export function commitMessage(prBody, trailer = '') {
  const plan = extractPlan(prBody);
  return [plan ? `Plan:\n${plan}` : 'Plan: (none — PR without code changes)', 'Independent review: APPROVE (see the PR).', trailer].filter(Boolean).join('\n\n');
}

const real = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
};

if (process.argv[1] && real(process.argv[1]) === real(fileURLToPath(import.meta.url))) {
  const n = Number(process.argv[2]);
  const dry = process.argv.includes('--dry-run');
  if (!n) {
    console.error('Usage: node compass/merge-pr.mjs <pr-number> [--dry-run]');
    process.exit(2);
  }
  const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const api = (path, ...args) => JSON.parse(gh(['api', ...args, path]) || 'null');
  // All pages, flattened (--slurp wraps each page in an array)
  const all = (path, key) => JSON.parse(gh(['api', '--paginate', '--slurp', path]) || '[]').flatMap((page) => (key ? page[key] : page));
  try {
    const repo = gh(['api', 'repos/{owner}/{repo}', '--jq', '.full_name']).trim();
    const pr = api(`repos/${repo}/pulls/${n}`);
    if (pr.merged) {
      console.log(`PR #${n} is already merged.`);
      process.exit(0);
    }
    const issues = parseCloses(pr.body);
    const bugIssues = issues.filter((i) => api(`repos/${repo}/issues/${i}`).labels.some((l) => l.name === 'bug'));
    const blockers = mergeBlockers({
      checkRuns: all(`repos/${repo}/commits/${pr.head.sha}/check-runs?per_page=100`, 'check_runs'),
      comments: all(`repos/${repo}/issues/${n}/comments?per_page=100`),
      files: all(`repos/${repo}/pulls/${n}/files?per_page=100`),
      labels: pr.labels.map((l) => l.name),
      headSha: pr.head.sha,
      body: pr.body,
      bugIssues,
    });
    if (blockers.length) {
      console.error(`Not merging PR #${n}:\n- ${blockers.join('\n- ')}`);
      process.exit(1);
    }
    const message = commitMessage(pr.body, process.env.MERGE_TRAILER || '');
    if (dry) {
      console.log(`PR #${n} can be merged (head ${pr.head.sha}). Commit message:\n\n${message}\n\nWould comment on: ${issues.map((i) => `#${i}`).join(', ') || '—'}`);
      process.exit(0);
    }
    // sha pins the merge to the reviewed head: GitHub refuses if a new commit arrived meanwhile
    const sha = api(`repos/${repo}/pulls/${n}/merge`, '-X', 'PUT', '-f', 'merge_method=squash', '-f', `sha=${pr.head.sha}`, '-f', `commit_title=${pr.title} (#${n})`, '-f', `commit_message=${message}`).sha;
    console.log(`Merged PR #${n} as ${sha}.`);
    const failed = [];
    for (const issue of issues) {
      try {
        api(`repos/${repo}/issues/${issue}/comments`, '-X', 'POST', '-f', `body=Resolved by branch [\`${pr.head.ref}\`](https://github.com/${repo}/tree/${pr.head.ref}) — PR #${n}, merge commit ${sha}.`);
      } catch {
        failed.push(issue);
      }
    }
    console.log(`Commented on ${issues.filter((i) => !failed.includes(i)).map((i) => `#${i}`).join(', ') || 'no issues'}.`);
    if (failed.length) {
      console.error(`Could not comment on ${failed.map((i) => `#${i}`).join(', ')} — add the traceability comment by hand (merge commit ${sha}).`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`merge-pr failed: ${(e.stderr || e.message || '').toString().trim()}`);
    process.exit(1);
  }
}
