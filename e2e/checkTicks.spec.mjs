// TC-105 / bug #108 — "everyone ticks" items count only ticks of current trip members (REQ-131)
import { test, expect, openApp, demoData } from './fixtures.mjs';

test('REQ-131 (#108): a tick of someone who left the trip is not counted', async ({ page }) => {
  const data = demoData();
  const item = data.checklists.t1[0].items.find((x) => x.text === 'Hộ chiếu');
  item.doneMap = { 'demo-user': 'Lan', 'left-user': 'Minh' }; // Minh has left trip t1 (members: demo-user, demo-2)
  await openApp(page, '#/trips/t1?tab=checklist', { data });
  const badge = page.locator('.check-items li').filter({ hasText: 'Hộ chiếu' }).locator('.item-scope');
  await expect(badge).toHaveText('🙋 1/2');
  await expect(badge).toHaveAttribute('title', /✓ Lan(?!, Minh)/);
  await expect(badge).not.toHaveAttribute('title', /Minh/);
});
