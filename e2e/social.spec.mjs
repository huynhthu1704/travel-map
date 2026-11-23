// TC-104 — Social (REQ-123…REQ-125)
import { test, expect, openApp } from './fixtures.mjs';

test('REQ-123: Explore lists public check-ins, filters by country and allows likes', async ({ page }) => {
  await openApp(page, '#/explore', { flags: { explore: true, likes: true } });
  const merlion = page.getByRole('button', { name: /Merlion Park 10\/11\/2026/ });
  await expect(merlion).toBeVisible();
  await expect(page.getByRole('button', { name: /Đèn lồng phố Hội/ })).toHaveCount(0); // private → not listed
  await page.getByRole('combobox').first().selectOption({ label: /Singapore/ }).catch(async () => {
    await page.getByRole('combobox').first().click();
    await page.getByText(/Singapore/).first().click();
  });
  await expect(page.getByText('Fushimi Inari')).toHaveCount(0);
  await merlion.click();
  await page.getByRole('dialog', { name: 'Merlion Park' }).getByRole('button', { name: /lượt thích/ }).click();
  await expect(page.getByRole('button', { name: /1 lượt thích/ })).toBeVisible();
});

test('REQ-124: follow someone and see the follower count change', async ({ page }) => {
  await openApp(page, '#/u/demo-2', { flags: { follow: true } });
  await expect(page.locator('body')).toContainText('Thư');
  await page.getByRole('button', { name: /^(＋ )?Theo dõi/ }).first().click();
  await expect(page.getByRole('button', { name: /Đang theo dõi/ }).first()).toBeVisible();
  await expect(page.locator('body')).toContainText(/1 người theo dõi/);
});

test('REQ-125: a notification sent by the team appears in the bell', async ({ page }) => {
  await openApp(page, '#/admin');
  await page.locator('.admin__tabs button', { hasText: 'Gửi thông báo' }).click();
  await page.getByRole('textbox', { name: 'Tiêu đề' }).fill('Chào mừng tới Bee There');
  await page.getByRole('button', { name: /Gửi tới Tất cả người dùng/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Gửi|Đồng ý|Xác nhận/ }).last().click({ timeout: 2000 }).catch(() => {});
  await page.locator('.notif__bell').click();
  await expect(page.getByRole('dialog', { name: 'Thông báo' })).toContainText('Chào mừng tới Bee There');
});
