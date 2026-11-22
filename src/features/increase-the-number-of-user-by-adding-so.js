// REQ-001 · Increase the number of user by adding some suggestion from 'Guides' into trip's checklist
// As an user, I want to increase the number of user by adding some suggestion from 'Guides' into trip's checklist, so that I can get it done without back-and-forth messages.

/**
 * Validates input and returns a result object.
 * @param {Record<string, string>} input
 */
export function increaseTheNumberOfUserByAddingSo(input) {
  const errors = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || String(value).trim() === '') errors[key] = 'This field is required';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, saved: { ...input, savedAt: new Date().toISOString() } };
}
