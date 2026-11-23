// TC-054 — due day for checklist items (REQ-033)
import { test, expect, openApp } from './fixtures.mjs';

test('REQ-033: mark an item for Day 3 of the trip; it is highlighted on that day', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T09:00:00+07:00'));
  await openApp(page, '#/trips/t1?tab=checklist', { flags: { checkDue: true } });
  const item = page.locator('.check-items li').filter({ hasText: 'eSIM' });
  await item.getByRole('button', { name: 'Ngày cần làm' }).click();
  const picker = item.getByRole('combobox', { name: 'Ngày cần làm' });
  await expect(picker.locator('option')).toHaveText(['— Không đặt ngày —', 'Trước chuyến đi', 'Ngày 1 · 10/11', 'Ngày 2 · 11/11', 'Ngày 3 · 12/11', 'Ngày 4 · 13/11', 'Ngày 5 · 14/11', 'Ngày khác…']);
  await picker.selectOption('2026-11-12');
  const chip = item.locator('.check-due');
  await expect(chip).toHaveText('📅 Ngày 3 · 12/11');
  await expect(chip).toHaveClass(/is-today/);
  await page.reload();
  await expect(page.locator('.check-items li').filter({ hasText: 'eSIM' }).locator('.check-due')).toHaveText('📅 Ngày 3 · 12/11');
});

test('REQ-033: the due day can be cleared', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=checklist', { flags: { checkDue: true } });
  const item = page.locator('.check-items li').filter({ hasText: 'eSIM' });
  await item.getByRole('button', { name: 'Ngày cần làm' }).click();
  await item.getByRole('combobox', { name: 'Ngày cần làm' }).selectOption('before');
  await expect(item.locator('.check-due')).toHaveText('📅 Trước chuyến đi');
  await item.locator('.check-due').click();
  await item.getByRole('combobox', { name: 'Ngày cần làm' }).selectOption('');
  await expect(item.locator('.check-due')).toHaveText('📅');
});
