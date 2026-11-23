// Turns Playwright failures into GitHub issues (label: bug + e2e), one issue per failing test.
// - A test that fails again adds a comment to its open issue instead of opening a duplicate.
// - A test that passes again closes its open issue with a comment.
// Runs on CI after the UI tests (not on pull requests). Needs GITHUB_TOKEN with issues: write.
import { readFileSync, existsSync } from 'node:fs';

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SERVER_URL = 'https://github.com', GITHUB_SHA = '' } = process.env;
const REPORT = 'e2e-results/results.json';
const DRY = !!process.env.DRY_RUN; // print what would happen, call nothing
if (!DRY && (!GITHUB_TOKEN || !GITHUB_REPOSITORY)) {
  console.log('No GitHub token or repository: skipping bug reporting.');
  process.exit(0);
}
if (!existsSync(REPORT)) {
  console.log(`No report at ${REPORT}: the tests did not run, nothing to report.`);
  process.exit(0);
}

const api = async (path, init = {}) => {
  if (DRY) {
    if (init.method) console.log(`[dry-run] ${init.method} ${path} ${init.body?.slice(0, 300) || ''}`);
    return [];
  }
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const stripAnsi = (s = '') => s.replace(/\u001b\[[0-9;]*m/g, '');
const runUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
const issueTitle = (t) => `[E2E] ${t}`;

// Flatten the Playwright JSON report into { title, file, line, project, ok, error }
const report = JSON.parse(readFileSync(REPORT, 'utf8'));
const results = new Map();
(function walk(suite) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const failed = t.status === 'unexpected';
      const last = t.results?.[t.results.length - 1];
      const prev = results.get(spec.title);
      // A test counts as failing if it failed in any project (desktop / phone)
      if (prev && !prev.ok) continue;
      results.set(spec.title, {
        title: spec.title,
        file: spec.file,
        line: spec.line,
        project: t.projectName,
        ok: !failed,
        error: failed ? stripAnsi(last?.error?.message || last?.errors?.[0]?.message || 'Unknown error').slice(0, 3000) : '',
      });
    }
  }
  for (const s of suite.suites || []) walk(s);
})({ suites: report.suites });

const open = [];
for (let page = 1; page < 10; page++) {
  const batch = await api(`/issues?state=open&labels=e2e&per_page=100&page=${page}`);
  open.push(...batch);
  if (batch.length < 100) break;
}
const openByTitle = new Map(open.map((i) => [i.title, i]));

let created = 0, commented = 0, closed = 0;
for (const r of results.values()) {
  const existing = openByTitle.get(issueTitle(r.title));
  const reqs = [...new Set(r.title.match(/REQ-\d+/g) || [])];
  if (!r.ok) {
    const fence = '```';
    const body = `**Failing UI test:** \`${r.title}\`
${reqs.length ? `\n**Requirement(s):** ${reqs.join(', ')} (see \`compass/requirements.md\`)\n` : ''}
**Where:** \`e2e/${r.file}:${r.line}\` · project \`${r.project}\`

**Run:** ${runUrl}${GITHUB_SHA ? ` · commit ${GITHUB_SHA.slice(0, 7)}` : ''}

**Error**
${fence}
${r.error}
${fence}

**Reproduce locally**
${fence}bash
npx playwright test e2e/${r.file} -g "${r.title.replace(/"/g, '\\"').slice(0, 60)}"
${fence}

The run's Playwright report (screenshots, trace) is attached to the workflow run as the \`playwright-report\` artifact.
`;
    if (existing) {
      await api(`/issues/${existing.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `Still failing in ${runUrl}\n\n\`\`\`\n${r.error.slice(0, 1500)}\n\`\`\`` }) });
      commented++;
    } else {
      await api('/issues', { method: 'POST', body: JSON.stringify({ title: issueTitle(r.title), body, labels: ['bug', 'e2e'] }) });
      created++;
    }
  } else if (existing) {
    await api(`/issues/${existing.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `✅ Passing again in ${runUrl}. Closing.` }) });
    await api(`/issues/${existing.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) });
    closed++;
  }
}
console.log(`Bug issues: ${created} created, ${commented} updated, ${closed} closed.`);
