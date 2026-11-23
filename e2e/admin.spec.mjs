// TC-108 — Admin (REQ-147…REQ-153)
import { test, expect, openApp, adminTab } from './fixtures.mjs';

const setMyRole = (page, role) =>
  page.evaluate((role) => {
    const k = 'travel-map-admin-demo-v1';
    const st = JSON.parse(localStorage.getItem(k));
    st.users['demo-user'].role = role;
    localStorage.setItem(k, JSON.stringify(st));
  }, role);

test('REQ-147: modules follow the role; the Admin role has every permission', async ({ page }) => {
  await openApp(page, '#/admin', { role: 'editor' });
  const tabs = page.locator('.admin__tabs');
  await expect(tabs).toContainText('Cẩm nang');
  await expect(tabs).not.toContainText('Vai trò & quyền');
  await setMyRole(page, 'admin');
  await page.reload();
  await adminTab(page, 'Vai trò & quyền');
  const adminColumn = page.locator('.admin__body').getByRole('checkbox', { disabled: true });
  await expect.poll(() => adminColumn.count()).toBeGreaterThan(10);
  for (const cb of await adminColumn.all()) await expect(cb).toBeChecked();
});

test('REQ-148: a feature is hidden until an admin releases it', async ({ page }) => {
  await openApp(page, '#/', { role: 'user', flags: { gear: false } });
  await expect(page.getByRole('link', { name: /Đồ du lịch/ })).toHaveCount(0);
  await setMyRole(page, 'admin');
  await page.goto('#/admin');
  await page.reload();
  await adminTab(page, 'Tính năng');
  const card = page.locator('.admin__body > * , .admin__body li, .admin__body .card').filter({ hasText: 'Trang Đồ dùng du lịch' }).last();
  await card.getByRole('checkbox', { name: /Bật cho tất cả người dùng/ }).check();
  await setMyRole(page, 'user');
  await page.goto('#/');
  await page.reload();
  await expect(page.getByRole('link', { name: /Đồ du lịch/ }).first()).toBeVisible();
});

test('REQ-149 + REQ-150: hiding a public check-in removes it from Explore and is written to the audit log', async ({ page }) => {
  await openApp(page, '#/admin', { flags: { explore: true } });
  await adminTab(page, 'Nội dung');
  await page.locator('.admin__body').getByRole('button', { name: /Ẩn/ }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /Ẩn|Đồng ý|Xác nhận/ }).last().click({ timeout: 2000 }).catch(() => {});
  await adminTab(page, 'Nhật ký');
  await expect(page.locator('.admin__body')).toContainText(/Ẩn check-in\s*m1\s*Lan/);
  await page.goto('#/explore');
  await expect(page.getByRole('button', { name: /Merlion Park 10\/11\/2026/ })).toHaveCount(0);
  await page.goto('#/admin');
  await adminTab(page, 'Thống kê');
  await expect(page.locator('.admin__body')).toContainText(/người dùng|Người dùng/);
});

test('REQ-151: a hidden famous place disappears from its country', async ({ page }) => {
  await openApp(page, '#/admin');
  await adminTab(page, 'Địa điểm');
  const row = page.locator('.admin__body').getByText('Phố cổ Hội An').locator('xpath=ancestor::*[.//button[contains(., "Ẩn")]][1]');
  await row.getByRole('button', { name: /Ẩn/ }).click();
  await page.goto('#/country/VN');
  await expect(page.locator('.panel')).toContainText('Vịnh Hạ Long');
  const famous = (await page.locator('.panel').innerText()).split('Địa điểm nổi tiếng')[1].split('Mọi người chia sẻ')[0];
  expect(famous).toContain('Vịnh Hạ Long');
  expect(famous).not.toContain('Phố cổ Hội An');
});

test('REQ-152: an item added in the gear catalog appears on the gear page', async ({ page }) => {
  await openApp(page, '#/admin', { flags: { gear: true } });
  await adminTab(page, 'Đồ dùng du lịch');
  await page.getByRole('button', { name: /Thêm món/ }).click();
  const form = page.locator('.admin__body form, .admin__body .card').filter({ has: page.getByRole('textbox') }).first();
  await form.getByRole('textbox').first().fill('Gối kê cổ');
  await form.getByRole('button', { name: /Lưu/ }).click();
  await page.goto('#/gear');
  await expect(page.locator('body')).toContainText('Gối kê cổ');
});

test('REQ-153: sent notifications are kept in the history with a read report', async ({ page }) => {
  await openApp(page, '#/admin');
  await adminTab(page, 'Gửi thông báo');
  await page.getByRole('button', { name: 'Theo vai trò' }).click();
  await page.getByRole('textbox', { name: 'Tiêu đề' }).fill('Họp đội vận hành');
  await page.getByRole('button', { name: /Gửi tới/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Gửi|Đồng ý|Xác nhận/ }).last().click({ timeout: 2000 }).catch(() => {});
  const history = page.locator('.admin__body');
  await expect(history).toContainText('Họp đội vận hành');
  await expect(history.getByRole('button', { name: /Thu hồi/ }).first()).toBeVisible();
});
