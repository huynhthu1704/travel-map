// TC-052 — choose a cost type when entering a cost (REQ-031)
import { test, expect, openApp } from './fixtures.mjs';

test('REQ-031: an actual cost saved with a type shows that type in the cost list', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=costs', { flags: { costType: true } });
  await page.getByRole('button', { name: /Thêm khoản chi/ }).first().click();
  const form = page.locator('form.cost-form').first();
  await form.getByRole('textbox').first().fill('Grab ra sân bay');
  await form.locator('input[inputmode="decimal"], input[inputmode="numeric"]').first().fill('250000');
  await form.getByRole('combobox', { name: /Loại chi phí/ }).selectOption('transport');
  await form.getByRole('button', { name: /Lưu|Thêm/ }).last().click();
  await expect(page.locator('.cost-row').filter({ hasText: 'Grab ra sân bay' }).first()).toContainText('🚆 Di chuyển');
});

test('REQ-031: the cost type picker is hidden while the flag is off', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=costs', { role: 'user', flags: { costType: false } });
  await page.getByRole('button', { name: /Thêm khoản chi/ }).first().click();
  await expect(page.locator('form.cost-form').first()).toBeVisible();
  await expect(page.getByRole('combobox', { name: /Loại chi phí/ })).toHaveCount(0);
});
