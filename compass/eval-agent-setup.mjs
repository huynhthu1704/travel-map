// REQ-041: agent setup evals (free version). Replays past mistakes and review findings (compass/evals/cases.json)
// against the real Compass checks — the edit hook, the CI guardrails check, the PR plan, the plan file, test-first,
// merge-pr and the spec checks — and reports the pass rate. Runs in `npm test` (TC-120), so on every pull request
// (including changes to AGENTS.md, CLAUDE.md, skills or hooks) and in the nightly CI run.
// Usage: node compass/eval-agent-setup.mjs   (exits 1 when any active case fails)
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkChange, decideEdit, dependenciesChanged, loadGuardrails, planProblems, realPathOf } from './guardrails-lib.mjs';
import { planFileProblems, planTextsFromPatches } from './plan-file.mjs';
import { testFirstProblems } from './test-first.mjs';
import { mergeBlockers, REVIEW_HEADING } from './merge-pr.mjs';
import { designProblems, intentProblems, needProblems } from './build-views.mjs';

export const CASES_FILE = fileURLToPath(new URL('./evals/cases.json', import.meta.url));
const REPO = realPathOf(fileURLToPath(new URL('..', import.meta.url)));

// Secret-looking values are built at run time, so the cases file itself never trips the secret check
const SECRETS = {
  anthropic: () => 'sk-ant-' + 'a1'.repeat(20),
  github: () => 'ghp_' + 'b2'.repeat(15),
  aws: () => 'AKIA' + 'C'.repeat(16),
  google: () => 'AIza' + 'd'.repeat(35),
};
const GOOD_PR_BODY = 'Closes #1\n\n## Plan\n- Files: src/App.jsx — the change\n- Steps: change it, run the tests\n- Risks: none known beyond the touched screen\n- Proof: npm test\n';
const GOOD_PLAN_FILE = '# Plan: REQ-999 example\n\n## Files\n- src/App.jsx — the change\n\n## Steps\n1. Change it\n\n## Risks\n- The touched screen\n\n## Proof\n- npm test\n';

/** Replace {{…}} placeholders in every string of a case input. */
export function expand(value) {
  if (typeof value === 'string')
    return value.replace(/\{\{([^}]+)\}\}/g, (all, key) => {
      if (key === 'repo') return REPO;
      if (key === 'goodPrBody') return GOOD_PR_BODY;
      if (key === 'goodPlanFile') return GOOD_PLAN_FILE;
      const secret = /^secret:(\w+)$/.exec(key);
      if (secret && SECRETS[secret[1]]) return SECRETS[secret[1]]();
      throw new Error(`unknown placeholder ${all}`);
    });
  if (Array.isArray(value)) return value.map(expand);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expand(v)]));
  return value;
}

const HEAD = '1234567890abcdef1234567890abcdef12345678';
const reviewComment = ({ verdict = 'APPROVE', commit = HEAD, author = 'OWNER', at = '2026-11-26T10:00:00Z' } = {}) => ({
  body: `${REVIEW_HEADING}\nVerdict: ${verdict}   ·   Important: ${verdict === 'APPROVE' ? 0 : 1}   ·   Nits: 0\nReviewed commit: ${commit}\n`,
  author_association: author,
  created_at: at,
});

/** One adapter per check: input → list of blocking messages (empty = allowed). */
const CHECKS = {
  'edit-hook': (input, g) => {
    // The path goes to the hook exactly as written (relative, ../, other case): resolving it is the hook's job
    const r = decideEdit({ tool_name: 'Write', tool_input: { file_path: input.path, content: input.content || '' } }, g, input.approved || [], REPO);
    return r.block ? [r.reason] : [];
  },
  guardrails: (input, g) => {
    const files = input.fileCount
      ? Array.from({ length: input.fileCount }, (_, i) => ({ path: `src/f${i}.js` }))
      : input.files || [];
    const full = files.map((f) => ({ status: 'M', addedText: '', lines: 10, ...f }));
    // packageBefore/packageAfter: package.json texts, judged by the real dependency detection
    const depsChanged = input.packageBefore != null ? dependenciesChanged(input.packageBefore, input.packageAfter) : !!input.depsChanged;
    return checkChange(full, g, { labels: input.labels || [], depsChanged }).errors;
  },
  'pr-plan': (input) => planProblems(input.body, (input.files || []).map((path) => ({ path }))),
  'plan-file': (input) => planFileProblems(input.files || [], input.planTexts || {}),
  'test-first': (input) => testFirstProblems(input.commits || [], { approved: !!input.approved }).errors,
  merge: (input) => {
    const files = [
      { filename: 'src/App.jsx', status: 'modified', patch: '+export default 1;' },
      { filename: 'compass/plans/REQ-999-example.md', status: 'added', patch: GOOD_PLAN_FILE.split('\n').map((l) => `+${l}`).join('\n') },
      ...(input.extraFiles || []),
    ];
    return mergeBlockers({
      checkRuns: input.checkRuns || [
        { name: 'test', status: 'completed', conclusion: 'success' },
        { name: 'e2e', status: 'completed', conclusion: 'success' },
      ],
      comments: (input.reviews || [{}]).map(reviewComment),
      files,
      labels: input.labels || [],
      headSha: input.headSha || HEAD,
      body: input.body ?? GOOD_PR_BODY,
      bugIssues: input.bugIssues || [],
      planTexts: planTextsFromPatches(files),
    });
  },
  spec: (input, g, spec) => {
    const s = { designTool: spec.designTool, requirements: [{ title: 'Eval', priority: 'Could', ac: ['Given x\nWhen y\nThen z'], ...input.requirement }] };
    const read = (p) => (input.files || {})[p] ?? null;
    return [...intentProblems(s, read), ...needProblems(s, read), ...designProblems(s, read)];
  },
};

/** Run one case: { id, ok, actual, detail }. */
export function runCase(c, g, spec) {
  const check = CHECKS[c.check];
  if (!check) return { id: c.id, ok: false, actual: 'error', detail: `unknown check "${c.check}"` };
  let messages;
  try {
    messages = check(expand(c.input || {}), g, spec);
  } catch (e) {
    return { id: c.id, ok: false, actual: 'error', detail: e.message };
  }
  const actual = messages.length ? 'blocked' : 'allowed';
  if (actual !== c.expect) return { id: c.id, ok: false, actual, detail: messages.join(' | ') || `expected ${c.expect}` };
  // A blocked case must be blocked for the reason it is about, not by accident
  if (c.expect === 'blocked' && c.why && !new RegExp(c.why, 'i').test(messages.join('\n')))
    return { id: c.id, ok: false, actual, detail: `blocked, but not for /${c.why}/: ${messages.join(' | ')}` };
  return { id: c.id, ok: true, actual, detail: '' };
}

export const loadCases = (file = CASES_FILE) => JSON.parse(readFileSync(file, 'utf8'));
export const activeCases = (suite) => suite.cases.filter((c) => !c.retired);

/** Run every active case: { results, passed, total, rate }. */
export function runEvals(suite = loadCases(), g = loadGuardrails(), spec = JSON.parse(readFileSync(new URL('./spec.json', import.meta.url), 'utf8'))) {
  const results = activeCases(suite).map((c) => ({ ...runCase(c, g, spec), title: c.title }));
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  return { results, passed, total, rate: total ? Math.round((passed / total) * 1000) / 10 : 0 };
}

export const summaryLine = ({ passed, total, rate }) => `Agent setup evals: ${passed}/${total} passed (${rate}%)`;

/** Markdown report; failures first. */
export function reportMarkdown(run) {
  const failed = run.results.filter((r) => !r.ok);
  const lines = [`## ${summaryLine(run)}`, ''];
  if (failed.length) {
    lines.push('Failing cases — a guardrail or rule got weaker. Fix it, or ask the Product Owner (compass/REVIEW.md).', '', '| Case | Title | Result |', '|---|---|---|');
    for (const r of failed) lines.push(`| ${r.id} | ${r.title} | ${r.actual}: ${r.detail.replace(/\|/g, '\\|').slice(0, 300)} |`);
  } else lines.push('All cases behave as expected.');
  return lines.join('\n') + '\n';
}

/** Add the report to the GitHub Actions run summary when it is available (no workflow change needed). */
export function writeRunSummary(run, file = process.env.GITHUB_STEP_SUMMARY) {
  if (file) appendFileSync(file, reportMarkdown(run));
}

const real = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
};

if (process.argv[1] && real(process.argv[1]) === real(fileURLToPath(import.meta.url))) {
  const run = runEvals();
  for (const r of run.results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.id} ${r.title}${r.ok ? '' : `\n     → ${r.actual}: ${r.detail}`}`);
  console.log(summaryLine(run));
  writeRunSummary(run);
  if (run.passed !== run.total) process.exit(1);
}
