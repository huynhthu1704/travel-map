// REQ-044: weekly security scan → GitHub issues. Run by .github/workflows/compass-security.yml.
// - Libraries: `npm audit --json` (every package with its own advisory, dev tools included).
// - Code: open CodeQL alerts of this repository (only when CODEQL_OK=true, i.e. the CodeQL job succeeded).
// Each finding has one issue (labels bug, security, severity:<level>), found again by the hidden marker
// <!-- security-finding: KEY --> in its body. A finding that is gone closes its issue. A closed issue whose finding
// is still there is reopened, unless it was dismissed: closed as "not planned" with a comment starting "Dismissed:".
// A source that could not be read never closes its issues. DRY_RUN=1 prints the actions and changes nothing.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const LEVELS = ['critical', 'high', 'moderate', 'low'];
const SEVERITY = { critical: 'critical', high: 'high', moderate: 'moderate', medium: 'moderate', low: 'low', info: 'low', error: 'high', warning: 'moderate', note: 'low' };
export const severityOf = (s) => SEVERITY[String(s || '').toLowerCase()] || 'moderate';
export const marker = (key) => `<!-- security-finding: ${key} -->`;
export const keyOf = (body = '') => body.match(/<!-- security-finding: (\S+) -->/)?.[1] || null;
export const DISMISS = /^\s*dismissed:\s*\S/i;

/** npm audit v2 JSON → findings (one per package that has its own advisory). */
export function npmFindings(audit) {
  if (!audit || audit.error || !audit.vulnerabilities) throw new Error(`npm audit gave no report: ${audit?.error?.summary || 'unknown error'}`);
  return Object.values(audit.vulnerabilities).flatMap((v) => {
    const advisories = (v.via || []).filter((a) => a && typeof a === 'object');
    if (!advisories.length) return [];
    const fix = v.fixAvailable === true ? 'yes (`npm audit fix`)' : v.fixAvailable ? `yes — upgrade ${v.fixAvailable.name} to ${v.fixAvailable.version}${v.fixAvailable.isSemVerMajor ? ' (major upgrade)' : ''}` : 'no fix published yet';
    return [{
      key: `npm:${v.name}`,
      source: 'npm',
      severity: severityOf(v.severity),
      title: `[Security] Library ${v.name} (${severityOf(v.severity)})`,
      details: [
        `**Library:** \`${v.name}\` ${v.range ? `(affected versions ${v.range})` : ''}${v.isDirect ? ' — used directly' : ' — pulled in by another library'}`,
        `**Fix available:** ${fix}`,
        '**Advisories**',
        ...advisories.map((a) => `- ${severityOf(a.severity)}: ${a.title || a.name} ${a.url || ''}`.trim()),
      ].join('\n'),
    }];
  });
}

/** Open CodeQL code-scanning alerts → findings (one per alert). */
export function codeqlFindings(alerts) {
  return (alerts || [])
    .filter((a) => a.state === 'open' && (a.tool?.name || 'CodeQL') === 'CodeQL')
    .map((a) => {
      const loc = a.most_recent_instance?.location || {};
      const where = loc.path ? `${loc.path}${loc.start_line ? `:${loc.start_line}` : ''}` : 'unknown location';
      const severity = severityOf(a.rule?.security_severity_level || a.rule?.severity);
      return {
        key: `codeql:${a.number}`,
        source: 'codeql',
        severity,
        title: `[Security] Code: ${a.rule?.description || a.rule?.id} in ${where} (${severity})`,
        details: [`**Rule:** \`${a.rule?.id}\` — ${a.rule?.description || ''}`, `**Where:** \`${where}\``, `**Alert:** ${a.html_url || ''}`].join('\n'),
      };
    });
}

export const isDismissed = (issue) => issue.state === 'closed' && issue.state_reason === 'not_planned' && (issue.comments_list || []).some((c) => DISMISS.test(c.body || ''));

/**
 * findings: current findings; issues: existing security issues (closed ones with comments_list);
 * sources: the sources that were read successfully this run. Returns the actions to take.
 */
export function planActions(findings, issues, sources) {
  const byKey = new Map();
  for (const i of [...issues].sort((a, b) => a.number - b.number)) {
    const key = keyOf(i.body);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || i.state === 'open' || prev.state !== 'open') byKey.set(key, i); // prefer open, then the newest
  }
  const actions = [];
  const seen = new Set();
  for (const f of findings) {
    seen.add(f.key);
    const issue = byKey.get(f.key);
    if (!issue) actions.push({ type: 'create', finding: f });
    else if (issue.state === 'open') {
      const labels = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
      if (!labels.includes(`severity:${f.severity}`)) actions.push({ type: 'relabel', issue, finding: f });
    } else if (isDismissed(issue)) actions.push({ type: 'keep-dismissed', issue, finding: f });
    else actions.push({
      type: 'reopen', issue, finding: f,
      why: issue.state_reason === 'not_planned'
        ? 'it was closed as "not planned" without a reason. To dismiss it, close it as "not planned" and add a comment that starts with `Dismissed:` and says why'
        : 'the scan still finds it',
    });
  }
  for (const [key, issue] of byKey) {
    if (issue.state !== 'open' || seen.has(key) || !sources.includes(key.split(':')[0])) continue;
    actions.push({ type: 'close', issue });
  }
  return actions;
}

export const issueBody = (f, runUrl) => `${marker(f.key)}
**Security finding** from the weekly scan (REQ-044) · **Severity:** ${f.severity}

${f.details}

**Run:** ${runUrl}

**What to do:** fix it in a PR with \`Closes #<this issue>\` — or, if it is not a real risk for Bee There, close this
issue as **not planned** with a comment that starts with \`Dismissed:\` and gives the reason. The weekly scan reopens
a closed issue whose finding is still there unless it has such a reason.
`;

const severityLabels = (labels, severity) => [...labels.filter((l) => !l.startsWith('severity:')), `severity:${severity}`];

async function main() {
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SERVER_URL = 'https://github.com', CODEQL_OK } = process.env;
  const DRY = !!process.env.DRY_RUN;
  if (!DRY && (!GITHUB_TOKEN || !GITHUB_REPOSITORY)) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are needed (or set DRY_RUN=1).');
  const runUrl = GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : '(local run)';
  const api = async (path, init = {}) => {
    if (DRY && init.method) return console.log(`[dry-run] ${init.method} ${path} ${(init.body || '').slice(0, 200)}`);
    if (DRY && !GITHUB_TOKEN) return [];
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  };
  const all = async (path) => {
    const out = [];
    for (let page = 1; page < 20; page++) {
      const batch = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      out.push(...batch);
      if (batch.length < 100) break;
    }
    return out;
  };

  const findings = [];
  const sources = [];
  const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  findings.push(...npmFindings(JSON.parse(audit.stdout || '{}'))); // a broken audit fails the run
  sources.push('npm');
  if (CODEQL_OK === 'true') {
    try {
      findings.push(...codeqlFindings(await all('/code-scanning/alerts?state=open&tool_name=CodeQL')));
      sources.push('codeql');
    } catch (e) {
      console.log(`::warning::Could not read CodeQL alerts, CodeQL issues are left as they are: ${e.message}`);
    }
  } else console.log('::warning::The CodeQL job did not succeed; only the library scan is reported this week.');

  const issues = (await all('/issues?state=all&labels=security')).filter((i) => !i.pull_request && keyOf(i.body));
  for (const i of issues) if (i.state === 'closed' && findings.some((f) => f.key === keyOf(i.body))) i.comments_list = await all(`/issues/${i.number}/comments`);

  const count = {};
  for (const a of planActions(findings, issues, sources)) {
    count[a.type] = (count[a.type] || 0) + 1;
    const n = a.issue?.number;
    const labels = (a.issue?.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
    if (a.type === 'create') await api('/issues', { method: 'POST', body: JSON.stringify({ title: a.finding.title, body: issueBody(a.finding, runUrl), labels: ['bug', 'security', `severity:${a.finding.severity}`] }) });
    if (a.type === 'relabel') {
      await api(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ labels: severityLabels(labels, a.finding.severity) }) });
      await api(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: `Severity is now **${a.finding.severity}** (${runUrl}).` }) });
    }
    if (a.type === 'reopen') {
      await api(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ state: 'open', labels: severityLabels(labels, a.finding.severity) }) });
      await api(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: `Reopened by the weekly security scan: ${a.why}. ${runUrl}` }) });
    }
    if (a.type === 'close') {
      await api(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: `✅ The weekly security scan no longer finds this. Closing. ${runUrl}` }) });
      await api(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) });
    }
  }
  console.log(`Security scan (${sources.join(' + ')}): ${findings.length} finding(s) — ${Object.entries(count).map(([k, v]) => `${v} ${k}`).join(', ') || 'no changes'}.`);
}

const real = (p) => { try { return realpathSync(p); } catch { return p; } };
if (process.argv[1] && real(process.argv[1]) === real(fileURLToPath(import.meta.url))) {
  main().catch((e) => {
    console.error(`Security scan failed: ${e.message}`);
    process.exit(1);
  });
}
