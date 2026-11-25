// TC-065, TC-066 — project policies as skills, each backed by a check (REQ-040)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { FLAGS } from '../src/data/flags.js';
import EN_DICT from '../src/i18n-en.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const SKILLS = ['feature-flag', 'bilingual-strings', 'deliver-change', 'trip-excel-export'];

function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  return Object.fromEntries(m[1].split('\n').map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
}

test('TC-065: each policy is a skill with valid frontmatter and a "use when" description', () => {
  const dirs = readdirSync(new URL('.claude/skills/', root));
  for (const name of SKILLS) {
    assert.ok(dirs.includes(name), `missing skill ${name}`);
    const fm = frontmatter(read(`.claude/skills/${name}/SKILL.md`));
    assert.ok(fm, `${name}: frontmatter`);
    assert.equal(fm.name, name);
    assert.match(fm.description, /^Use (when|whenever|for) /, `${name}: description says when to use it`);
    assert.ok(fm.description.length <= 1024);
  }
});

test('TC-065: every skill names the check that enforces it, and those files exist', () => {
  for (const name of SKILLS) {
    const md = read(`.claude/skills/${name}/SKILL.md`);
    const section = md.split('## Enforced by')[1];
    assert.ok(section, `${name}: "## Enforced by" section`);
    const paths = [...section.matchAll(/`((?:tests|e2e|compass|\.claude)\/[\w./-]+\.(?:mjs|json))`/g)].map((m) => m[1]);
    assert.ok(paths.length > 0, `${name}: names at least one check`);
    for (const p of paths) assert.ok(existsSync(new URL(p, root)), `${name}: ${p} exists`);
  }
});

// The checks behind the must-hold policies
// Keys may be written in single or double quotes (review finding on PR #83)
const dict = (src) => Object.fromEntries([...src.matchAll(/^\s*(['"])([\w.-]+)\1:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)/gm)].map((m) => [m[2], m[3]]));
const vi = dict(read('src/i18n.jsx').split('export function loadLangDict')[0]);
const en = dict(read('src/i18n-en.js'));
const vars = (s) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(',');

test('TC-066: the Vietnamese and English dictionaries have the same keys and placeholders', () => {
  // The parser must see every key, so no quoting style can slip past the check
  assert.equal(Object.keys(en).length, Object.keys(EN_DICT).length, 'parser read every key of src/i18n-en.js');
  assert.deepEqual(Object.keys(vi).filter((k) => !(k in en)), [], 'keys missing in src/i18n-en.js');
  assert.deepEqual(Object.keys(en).filter((k) => !(k in vi)), [], 'keys missing in src/i18n.jsx');
  const mismatched = Object.keys(vi).filter((k) => vars(vi[k]) !== vars(en[k]));
  assert.deepEqual(mismatched, [], 'same {placeholders} in both languages');
});

const LEGACY_FLAGS = ['gear', 'guideLinks', 'guideFoodCities', 'guideCosts', 'guideToTrip', 'explore', 'trips', 'tripInvites', 'tripCosts', 'tripChecklist', 'tripPdf', 'tripDuplicate', 'recap', 'share', 'likes', 'follow', 'wikidata', 'popularPlaces', 'quickTour', 'feedback', 'sponsor', 'whatsNew', 'pullToRefresh', 'guide', 'tips'];

test('TC-066: feature flags have VI/EN texts; new flags are default-off with a value text', () => {
  for (const f of FLAGS) {
    for (const part of ['name', 'desc']) assert.ok(f[part]?.vi && f[part]?.en, `${f.key}: ${part} in vi and en`);
    // Flags without a date are only the legacy ones listed here; every new flag must carry since
    if (!f.since) assert.ok(LEGACY_FLAGS.includes(f.key), `${f.key}: new flags need a since date`);
    // Every flag outside the legacy list, whatever its since date, so a backdated date cannot skip the rule (#81)
    if (!LEGACY_FLAGS.includes(f.key)) {
      assert.equal(f.defaultOn, false, `${f.key}: new flags start off`);
      assert.ok(f.value?.vi && f.value?.en, `${f.key}: value text in vi and en`);
    }
  }
  assert.equal(new Set(FLAGS.map((f) => f.key)).size, FLAGS.length, 'unique keys');
});
