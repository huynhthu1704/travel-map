// REQ-036: Claude Code PreToolUse hook for Edit / Write / MultiEdit / NotebookEdit.
// Blocks (exit code 2) edits to forbidden paths, to protected paths that the Product Owner has not approved,
// and content that matches a secret pattern. The message on stderr tells the agent how to get approval.
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { loadGuardrails, matchesAny, findSecrets } from '../guardrails-lib.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const APPROVALS = resolve(root, '.claude/approved-paths.local.json');

export function decide(input, g, approvedPaths = []) {
  const ti = input.tool_input || {};
  const file = ti.file_path || ti.notebook_path;
  if (!file) return { block: false };
  const path = relative(root, resolve(root, file)).split('\\').join('/');
  if (path.startsWith('..')) return { block: false }; // outside the repo
  if (matchesAny(path, g.forbiddenPaths)) return { block: true, reason: `${path} is a forbidden path (compass/guardrails.json) and must never be written.` };
  if (matchesAny(path, g.protectedPaths) && !approvedPaths.includes(path))
    return {
      block: true,
      reason: `${path} is a protected path (compass/guardrails.json). Ask the Product Owner in chat for explicit approval first. After she approves, record it by adding "${path}" to the JSON array in .claude/approved-paths.local.json (git-ignored), then retry. The PR also needs the "human-approved" label for CI.`,
    };
  const text = [ti.content, ti.new_string, ti.new_source, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
  const secrets = findSecrets(text, g);
  if (secrets.length) return { block: true, reason: `The new content for ${path} matches a secret pattern (${secrets.join(', ')}). Never commit secrets; use environment variables or GitHub secrets.` };
  return { block: false };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    let approved = [];
    try {
      approved = existsSync(APPROVALS) ? JSON.parse(readFileSync(APPROVALS, 'utf8')) : [];
    } catch {
      approved = [];
    }
    const result = decide(JSON.parse(raw || '{}'), loadGuardrails(), approved);
    if (result.block) {
      process.stderr.write(`Blocked by Compass guardrails: ${result.reason}\n`);
      process.exit(2);
    }
    process.exit(0);
  });
}
