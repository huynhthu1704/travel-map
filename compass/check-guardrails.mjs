// REQ-036: CI check of a pull request against compass/guardrails.json. Exits 1 on any error.
// Usage (CI, pull_request event): node compass/check-guardrails.mjs
// Locally: node compass/check-guardrails.mjs [baseRef]   (default origin/main)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { loadGuardrails, checkChange, dependenciesChanged, APPROVAL_LABEL } from './guardrails-lib.mjs';

// quotePath=false keeps non-ASCII (e.g. Vietnamese) file names readable instead of quoted octal escapes
const git = (...args) => execFileSync('git', ['-c', 'core.quotePath=false', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const event = process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH) ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
const pr = event.pull_request;
// In CI the checkout is the PR merge commit: its first parent is main at merge time, so HEAD^1..HEAD is exactly
// the PR's change even if main moved after the PR was opened. Locally: <baseRef>...HEAD.
const range = pr ? ['HEAD^1', 'HEAD'] : [`${process.argv[2] || 'origin/main'}...HEAD`];
const baseRef = pr ? 'HEAD^1' : null;
const labels = (pr?.labels || []).map((l) => l.name);

const g = loadGuardrails();
const files = git('diff', '--name-status', '--no-renames', ...range)
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [status, path] = line.split('\t');
    const addedText = status === 'D' ? '' : git('diff', '-U0', ...range, '--', path).split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
    const lines = status === 'D' || !existsSync(path) ? 0 : readFileSync(path, 'utf8').split('\n').length;
    return { path, status: status[0], addedText, lines };
  });

const show = (ref) => {
  try {
    return git('show', `${ref}:package.json`);
  } catch {
    return '';
  }
};
const depsChanged = files.some((f) => f.path === 'package.json') && dependenciesChanged(show(baseRef || git('merge-base', process.argv[2] || 'origin/main', 'HEAD').trim()), show('HEAD'));

const { errors, warnings } = checkChange(files, g, { labels, depsChanged });
for (const w of warnings) console.log(`::warning::${w}`);
if (errors.length) {
  for (const e of errors) console.log(`::error::${e}`);
  console.error(`Guardrails check failed (${errors.length}). Approval label: "${APPROVAL_LABEL}" (${labels.includes(APPROVAL_LABEL) ? 'present' : 'absent'}).`);
  process.exit(1);
}
console.log(`Guardrails OK: ${files.length} files changed${labels.includes(APPROVAL_LABEL) ? ` (approved: ${APPROVAL_LABEL})` : ''}.`);
