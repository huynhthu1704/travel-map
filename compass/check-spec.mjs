// Compass traceability check — run in CI. Exits 1 if the spec is inconsistent.
import { readFileSync } from 'node:fs';
const spec = JSON.parse(readFileSync(new URL('./spec.json', import.meta.url), 'utf8'));
const errors = [];
const reqIds = new Set(spec.requirements.map((r) => r.id));
for (const r of spec.requirements) {
  if (!r.ac || r.ac.length === 0) errors.push(`${r.id} has no acceptance criteria`);
  if (r.status !== 'Draft' && !spec.tests.some((t) => t.reqIds.includes(r.id))) errors.push(`${r.id} (${r.status}) has no test case`);
}
for (const t of spec.tests) {
  if (!t.reqIds.length) errors.push(`${t.id} does not reference a requirement`);
  for (const id of t.reqIds) if (!reqIds.has(id)) errors.push(`${t.id} references unknown ${id}`);
}
if (errors.length) { console.error('Compass spec check failed:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`Compass spec OK: ${spec.requirements.length} requirements, ${spec.tests.length} tests`);
