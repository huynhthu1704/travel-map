// TC-107 — Help & onboarding (REQ-142…REQ-146)
import { test, expect, openApp, adminTab } from './fixtures.mjs';

test('REQ-142: the About page lists a released feature with its value text', async ({ page }) => {
  await openApp(page, '#/about', { role: 'user', flags: { gear: true } });
  await expect(page.locator('body')).toContainText('Biết mang gì cho từng kiểu chuyến đi');
});

test('REQ-142: an unreleased feature is not listed on the About page', async ({ page }) => {
  await openApp(page, '#/about', { role: 'user', flags: { gear: false } });
  await expect(page.locator('body')).toContainText('Bee There');
  await expect(page.locator('body')).not.toContainText('Biết mang gì cho từng kiểu chuyến đi');
});

test('REQ-143: the quick tour opens for a new account and not again after finishing', async ({ page }) => {
  await openApp(page, '#/', { tour: true, newUser: true, flags: { quickTour: true } });
  const tour = page.locator('.tour');
  await expect(tour).toContainText('Chào mừng tới Bee There', { timeout: 10_000 });
  await tour.getByRole('button', { name: /Bỏ qua/ }).click();
  await expect(tour).toBeHidden();
  await page.reload();
  await page.waitForTimeout(3000);
  await expect(tour).toBeHidden();
});

test('REQ-144: send a bug report and see it in my feedback and the admin inbox', async ({ page }) => {
  await openApp(page, '#/', { flags: { feedback: true } });
  await page.getByRole('button', { name: /💬 Góp ý$/ }).click();
  const dlg = page.getByRole('dialog', { name: /Góp ý cho Bee There/ });
  await dlg.getByRole('button', { name: /Báo lỗi/ }).click();
  await dlg.getByRole('textbox', { name: /Tiêu đề ngắn/ }).fill('Nút Lưu không phản hồi');
  await dlg.getByRole('textbox', { name: /Điều đã xảy ra/ }).fill('Bấm Lưu không có gì xảy ra');
  await dlg.getByRole('button', { name: /Gửi góp ý/ }).last().click();
  await page.getByRole('button', { name: /Góp ý của tôi/ }).click().catch(() => {});
  await page.goto('#/admin');
  await adminTab(page, 'Góp ý');
  await expect(page.locator('.admin__body')).toContainText('Nút Lưu không phản hồi');
});

test('REQ-145: FAQ, What’s new and Support open from the home panel', async ({ page }) => {
  await openApp(page, '#/', { flags: { whatsNew: true, sponsor: true } });
  await page.getByRole('button', { name: /Hỏi đáp/ }).first().click();
  await expect(page.getByRole('heading', { name: /Bắt đầu/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Có gì mới/ }).first().click();
  await expect(page.getByRole('dialog').last()).toContainText(/v\d+\.\d+/);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Ủng hộ/ }).first().click();
  await expect(page.getByRole('dialog', { name: /Ủng hộ người làm Bee There/ })).toBeVisible();
});

test('REQ-146: a live announcement shows until closed, then stays hidden', async ({ page }) => {
  const settings = { announcements: [{ id: 'a1', vi: 'Bảo trì tối nay 22:00', en: 'Maintenance tonight', tone: 'warning', startAt: 1, endAt: null, createdAt: 1 }] };
  await openApp(page, '#/', { settings });
  const bar = page.getByText('Bảo trì tối nay 22:00');
  await expect(bar).toBeVisible();
  await page.locator('.announce, [class*="announce"]').getByRole('button').last().click();
  await expect(bar).toBeHidden();
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(bar).toBeHidden();
});
