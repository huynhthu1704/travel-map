---
name: bilingual-strings
description: Use whenever text shown to Bee There users is added or changed (labels, buttons, messages, errors, tooltips, aria-labels). All UI text goes through t('key') with matching Vietnamese and English entries.
---

# Every UI string in Vietnamese and English

**Policy:** the UI is bilingual, Vietnamese by default (ADR-012). No hard-coded user-facing text in components.

## Steps
1. Pick a dotted key in the feature's namespace, e.g. `check.dueSet`, `excel.export`.
2. Add it to the `vi` dictionary in `src/i18n.jsx` **and** to `src/i18n-en.js`, next to related keys.
   - Use `{name}` placeholders for variables; both languages must use the same placeholders.
   - Vietnamese is natural, with full diacritics; English is plain and short.
3. In components use `const { t } = useI18n();` then `t('check.dueDay', { n, d })`. Aria-labels and titles too.
4. UI tests are written against the Vietnamese text (default language) unless they set `lang: 'en'`.

## Enforced by
- `tests/skills.test.mjs` (TC-066): the VI and EN dictionaries have exactly the same keys, and each key uses the same `{placeholders}` in both languages.
