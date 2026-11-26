// TC-116, TC-117 — weekly security scan of the code and libraries (REQ-044)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { npmFindings, codeqlFindings, planActions, marker, issueBody, isDismissed } from '../compass/security-scan.mjs';

const wf = readFileSync(new URL('../.github/workflows/compass-security.yml', import.meta.url), 'utf8');

const audit = {
  auditReportVersion: 2,
  vulnerabilities: {
    '@grpc/grpc-js': { name: '@grpc/grpc-js', severity: 'high', isDirect: false, range: '<1.8.22', fixAvailable: true,
      via: [{ title: 'Memory allocation above limit', url: 'https://github.com/advisories/GHSA-x', severity: 'high' }] },
    firebase: { name: 'firebase', severity: 'high', isDirect: true, via: ['@grpc/grpc-js'], fixAvailable: true },
    vite: { name: 'vite', severity: 'moderate', isDirect: true, via: [{ title: 'Dev server file read', severity: 'moderate' }],
      fixAvailable: { name: 'vite', version: '8.0.0', isSemVerMajor: true } },
  },
};
const alerts = [
  { number: 7, state: 'open', tool: { name: 'CodeQL' }, html_url: 'https://github.com/o/r/security/code-scanning/7',
    rule: { id: 'js/xss', description: 'Cross-site scripting', security_severity_level: 'medium' },
    most_recent_instance: { location: { path: 'src/App.jsx', start_line: 12 } } },
  { number: 8, state: 'dismissed', tool: { name: 'CodeQL' }, rule: { id: 'js/other' } },
];
const issue = (number, key, extra = {}) => ({ number, state: 'open', body: `${marker(key)}\nbody`, labels: [{ name: 'security' }, { name: 'severity:high' }], ...extra });

test('TC-116: npm audit → one finding per library with its own advisory, with severity and fix', () => {
  const f = npmFindings(audit);
  assert.deepEqual(f.map((x) => [x.key, x.severity]), [['npm:@grpc/grpc-js', 'high'], ['npm:vite', 'moderate']]);
  assert.match(f[1].details, /upgrade vite to 8\.0\.0 \(major upgrade\)/);
  assert.match(f[0].title, /^\[Security\] Library @grpc\/grpc-js \(high\)$/);
  assert.throws(() => npmFindings({ error: { summary: 'network' } }), /network/, 'a broken audit fails the run');
});

test('TC-116: open CodeQL alerts → findings with severity and location', () => {
  const f = codeqlFindings(alerts);
  assert.equal(f.length, 1);
  assert.equal(f[0].key, 'codeql:7');
  assert.equal(f[0].severity, 'moderate');
  assert.match(f[0].title, /Cross-site scripting in src\/App\.jsx:12 \(moderate\)/);
});

test('TC-116: new findings open a bug issue with severity; a gone finding closes its issue; no duplicates', () => {
  const findings = [...npmFindings(audit), ...codeqlFindings(alerts)];
  const issues = [issue(1, 'npm:@grpc/grpc-js'), issue(2, 'npm:old-lib'), issue(3, 'codeql:3')];
  const acts = planActions(findings, issues, ['npm', 'codeql']);
  assert.deepEqual(acts.filter((a) => a.type === 'create').map((a) => a.finding.key), ['npm:vite', 'codeql:7']);
  assert.deepEqual(acts.filter((a) => a.type === 'close').map((a) => a.issue.number), [2, 3]);
  assert.ok(!acts.some((a) => a.issue?.number === 1), 'an open issue with the same severity is left alone');
  assert.match(issueBody(findings[0], 'RUN'), /security-finding: npm:@grpc\/grpc-js[\s\S]*\*\*Severity:\*\* high/);
  const script = readFileSync(new URL('../compass/security-scan.mjs', import.meta.url), 'utf8');
  assert.match(script, /labels: \['bug', 'security', `severity:\$\{a\.finding\.severity\}`\]/);
});

test('TC-116: a changed severity relabels; a source that failed never closes its issues', () => {
  const vite = npmFindings(audit).filter((f) => f.key === 'npm:vite');
  assert.deepEqual(planActions(vite, [issue(4, 'npm:vite')], ['npm']).map((a) => a.type), ['relabel']);
  assert.deepEqual(planActions(vite, [issue(4, 'npm:vite'), issue(5, 'codeql:9')], ['npm']).map((a) => a.type), ['relabel'],
    'CodeQL was not read → codeql:9 stays open');
});

test('TC-117: a closed finding stays closed only when dismissed as "not planned" with a "Dismissed:" reason', () => {
  const f = codeqlFindings(alerts);
  const closed = (extra) => issue(6, 'codeql:7', { state: 'closed', ...extra });
  const reason = { state_reason: 'not_planned', comments_list: [{ body: 'Dismissed: only reachable in the admin page, input is escaped' }] };
  assert.ok(isDismissed(closed(reason)));
  assert.deepEqual(planActions(f, [closed(reason)], ['codeql']).map((a) => a.type), ['keep-dismissed']);
  const noReason = planActions(f, [closed({ state_reason: 'not_planned', comments_list: [{ body: 'not a problem' }] })], ['codeql']);
  assert.equal(noReason[0].type, 'reopen');
  assert.match(noReason[0].why, /without a reason[\s\S]*Dismissed:/);
  const fixedButBack = planActions(f, [closed({ state_reason: 'completed', comments_list: [] })], ['codeql']);
  assert.equal(fixedButBack[0].type, 'reopen');
  assert.ok(!isDismissed(closed({ state_reason: 'not_planned', comments_list: [{ body: 'Dismissed:' }] })), 'an empty reason does not count');
});

test('TC-117: the scan runs weekly and on demand with least-privilege permissions', () => {
  assert.match(wf, /schedule:\s*\n\s*- cron: '0 1 \* \* 1'/);
  assert.match(wf, /workflow_dispatch:/);
  assert.match(wf, /github\/codeql-action\/analyze@v4/);
  assert.match(wf, /^permissions:\s*\n\s*contents: read/m);
  const report = wf.slice(wf.indexOf('\n  report:'));
  assert.match(report, /if: always\(\)/, 'the library scan still reports when CodeQL fails');
  assert.match(report, /issues: write/);
  assert.match(report, /CODEQL_OK: \$\{\{ needs\.codeql\.result == 'success' \}\}/);
  assert.match(report, /node compass\/security-scan\.mjs/);
  assert.doesNotMatch(wf, /pull_request|contents: write/);
});
