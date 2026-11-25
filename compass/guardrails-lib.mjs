// REQ-036: shared rules for compass/guardrails.json, used by the CI check and the Claude Code edit hook.
import { readFileSync } from 'node:fs';

export const APPROVAL_LABEL = 'human-approved';

export function loadGuardrails(root = new URL('..', import.meta.url)) {
  return JSON.parse(readFileSync(new URL('compass/guardrails.json', root), 'utf8'));
}

/** A rule ending with "/" matches everything under that folder; otherwise the exact path. */
export const matchesRule = (path, rule) => (rule.endsWith('/') ? path.startsWith(rule) : path === rule);
export const matchesAny = (path, rules = []) => rules.some((r) => matchesRule(path, r));

/** Secret patterns found in a piece of text (returns the matching patterns, never the secret itself). */
export function findSecrets(text, g) {
  return (g.secretPatterns || []).filter((p) => new RegExp(p).test(text || ''));
}

// Generated or data files that may be long by nature
const LONG_OK = /^(package-lock\.json|compass\/(spec\.json|requirements\.md|tests\.md))$/;

/**
 * Check one change set.
 * files: [{ path, status: 'A'|'M'|'D'|'R', addedText?, lines? }]
 * opts: { labels: string[], depsChanged: boolean }
 * Returns { errors: string[], warnings: string[] }.
 */
export function checkChange(files, g, { labels = [], depsChanged = false } = {}) {
  const errors = [];
  const warnings = [];
  const approved = labels.includes(APPROVAL_LABEL);
  const needApproval = new Set(g.requireHumanApprovalFor || []);
  const route = `Ask the Product Owner in chat; once she approves, add the "${APPROVAL_LABEL}" label to the PR.`;

  if (files.length > g.maxFilesPerChange) errors.push(`${files.length} files changed — the limit is ${g.maxFilesPerChange}. Split the change into smaller PRs.`);
  for (const f of files) {
    if (matchesAny(f.path, g.forbiddenPaths)) errors.push(`${f.path} is a forbidden path and must never be committed.`);
    else if (matchesAny(f.path, g.protectedPaths) && needApproval.has('protected-path') && !approved) errors.push(`${f.path} is a protected path. ${route}`);
    if (f.status === 'D' && needApproval.has('delete') && !approved) errors.push(`${f.path} is deleted — deleting files needs approval. ${route}`);
    const secrets = findSecrets(f.addedText, g);
    if (secrets.length) errors.push(`${f.path} adds text that looks like a secret (pattern ${secrets.join(', ')}). Remove it and rotate the key.`);
    if (g.maxLinesPerFile && f.lines > g.maxLinesPerFile && !LONG_OK.test(f.path)) warnings.push(`${f.path} has ${f.lines} lines (guideline: ${g.maxLinesPerFile}). Consider splitting it.`);
  }
  if (depsChanged && needApproval.has('dependency-change') && !approved) errors.push(`package.json dependencies changed. ${route}`);
  return { errors, warnings };
}

/** True when the dependency lists differ between two package.json texts. */
export function dependenciesChanged(beforeText, afterText) {
  const deps = (t) => {
    try {
      const p = JSON.parse(t || '{}');
      return JSON.stringify([p.dependencies || {}, p.devDependencies || {}, p.peerDependencies || {}, p.optionalDependencies || {}]);
    } catch {
      return '';
    }
  };
  return deps(beforeText) !== deps(afterText);
}
