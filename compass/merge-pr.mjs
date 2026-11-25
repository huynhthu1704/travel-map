// REQ-039 (+ REQ-037): merge a pull request only when the delivery rules hold, and keep the plan in git history.
// Usage: node compass/merge-pr.mjs <pr-number> [--dry-run]
// Checks: all CI checks passed · latest "## Independent review (Claude)" says APPROVE · firestore.rules changes carry
// the human-approved label. Then squash-merges with the PR's "## Plan" as the commit message and comments on each
// "Closes #N" issue with the branch, PR and merge commit (traceability rule).
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPlan, APPROVAL_LABEL } from './guardrails-lib.mjs';

export const REVIEW_HEADING = '## Independent review (Claude)';

/** Issue numbers closed by a PR body ("Closes #12", "fixes #3", "resolves #4"). */
export function parseCloses(body) {
  return [...new Set([...(body || '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)].map((m) => Number(m[1])))];
}

/** Verdict of the newest independent review comment: 'APPROVE' | 'CHANGES NEEDED' | null. */
export function latestReviewVerdict(comments) {
  const reviews = (comments || []).filter((c) => (c.body || '').trimStart().startsWith(REVIEW_HEADING));
  if (!reviews.length) return null;
  const last = reviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).at(-1);
  const m = last.body.match(/Verdict:\s*(APPROVE|CHANGES NEEDED)/);
  return m ? m[1] : null;
}

/** Reasons the PR must not be merged yet (empty = OK). */
export function mergeBlockers({ checkRuns, comments, files, labels }) {
  const blockers = [];
  const runs = checkRuns || [];
  if (!runs.length) blockers.push('no CI checks have run on the latest commit');
  for (const r of runs) {
    if (r.status !== 'completed') blockers.push(`CI check "${r.name}" is still ${r.status}`);
    else if (!['success', 'neutral', 'skipped'].includes(r.conclusion)) blockers.push(`CI check "${r.name}" ended with ${r.conclusion}`);
  }
  const verdict = latestReviewVerdict(comments);
  if (verdict !== 'APPROVE') blockers.push(verdict ? `the latest independent review says ${verdict} — fix and ask for a fresh review` : 'no independent review comment yet (see REVIEW.md)');
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
  const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { encoding: 'utf8' }).trim();
  const api = (path, ...args) => JSON.parse(execFileSync('gh', ['api', ...args, path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }) || 'null');
  const pr = api(`repos/${repo}/pulls/${n}`);
  if (pr.merged) {
    console.log(`PR #${n} is already merged.`);
    process.exit(0);
  }
  const blockers = mergeBlockers({
    checkRuns: api(`repos/${repo}/commits/${pr.head.sha}/check-runs`).check_runs,
    comments: api(`repos/${repo}/issues/${n}/comments?per_page=100`),
    files: api(`repos/${repo}/pulls/${n}/files?per_page=100`),
    labels: pr.labels.map((l) => l.name),
  });
  if (blockers.length) {
    console.error(`Not merging PR #${n}:\n- ${blockers.join('\n- ')}`);
    process.exit(1);
  }
  const trailer = process.env.MERGE_TRAILER || '';
  const message = commitMessage(pr.body, trailer);
  if (dry) {
    console.log(`PR #${n} can be merged. Commit message:\n\n${message}\n\nWould comment on: ${parseCloses(pr.body).map((i) => `#${i}`).join(', ') || '—'}`);
    process.exit(0);
  }
  const sha = api(`repos/${repo}/pulls/${n}/merge`, '-X', 'PUT', '-f', 'merge_method=squash', '-f', `commit_title=${pr.title} (#${n})`, '-f', `commit_message=${message}`).sha;
  for (const issue of parseCloses(pr.body)) {
    const branch = pr.head.ref;
    api(`repos/${repo}/issues/${issue}/comments`, '-X', 'POST', '-f', `body=Resolved by branch [\`${branch}\`](https://github.com/${repo}/tree/${branch}) — PR #${n}, merge commit ${sha}.`);
  }
  console.log(`Merged PR #${n} as ${sha}; commented on ${parseCloses(pr.body).map((i) => `#${i}`).join(', ') || 'no issues'}.`);
}
