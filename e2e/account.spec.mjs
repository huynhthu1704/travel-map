// TC-101 — Account & platform (REQ-101…REQ-110)
import { readFileSync } from 'node:fs';
import { test, expect, openApp } from './fixtures.mjs';

const body = (page) => page.locator('body');

test('REQ-101: without Firebase the app runs in demo mode and signs in', async ({ page }) => {
  await openApp(page, '#/', { signedIn: false });
  await expect(body(page)).toContainText('Chế độ demo');
  await page.getByRole('button', { name: /Đăng nhập/ }).first().click();
  await expect(body(page)).toContainText(/Điều khoản|đồng ý/i);
});

test('REQ-102: a new account must accept the terms; legal pages are reachable', async ({ page }) => {
  await openApp(page, '#/', { consent: false });
  const dialog = page.getByRole('dialog').filter({ hasText: /Điều khoản|Chính sách/ });
  await expect(dialog).toBeVisible();
  const go = dialog.getByRole('button', { name: /Đồng ý|Tiếp tục|Bắt đầu/ }).last();
  await expect(go).toBeDisabled();
  await dialog.getByRole('checkbox').first().check();
  await expect(go).toBeEnabled();
  await go.click();
  await expect(dialog).toBeHidden();
  await page.goto('#/privacy');
  await expect(body(page)).toContainText('Chính sách quyền riêng tư');
  await page.getByRole('link', { name: /Điều khoản sử dụng/ }).first().click();
  await expect(page).toHaveURL(/#\/terms/);
  await expect(page.locator('h1, h2').filter({ hasText: 'Điều khoản sử dụng' }).first()).toBeVisible();
});

test('REQ-103: download my data and delete my account', async ({ page }) => {
  await openApp(page, '#/account');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Tải dữ liệu/ }).click()]);
  const json = JSON.parse(readFileSync(await dl.path(), 'utf8'));
  expect(JSON.stringify(json)).toContain('Merlion Park');
  await page.getByRole('button', { name: /muốn xoá tài khoản/ }).click();
  await expect(body(page)).toContainText(/không thể khôi phục|vĩnh viễn/i);
});

test('REQ-104: profile with display name, @username and round avatar', async ({ page }) => {
  await openApp(page, '#/u/demo-user');
  await expect(body(page)).toContainText('Lan');
  await expect(body(page)).toContainText('@lan');
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).click();
  await page.getByRole('textbox', { name: /Tên người dùng \(nickname\)/ }).fill('thu'); // already used by Thư
  // The name is checked while typing: a taken name shows a message and blocks saving
  await expect(body(page)).toContainText('Tên này đã có người dùng');
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
  const avatar = page.locator('.avatar, [class*="avatar"]').first();
  const radius = await avatar.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toMatch(/50%|9999px|\d{3,}px/);
});

test('REQ-105: Vietnamese by default, English is remembered after reload', async ({ page }) => {
  await openApp(page, '#/');
  await expect(page.getByRole('link', { name: /Bản đồ/ }).first()).toBeVisible();
  await page.getByRole('button', { name: /Đổi ngôn ngữ/ }).click();
  await expect(page.getByRole('link', { name: /Explore/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /Explore/ }).first()).toBeVisible();
});

test('REQ-106: phone layout uses a bottom sheet and bottom navigation @phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await openApp(page, '#/');
  await expect(page.locator('.nav--bottom')).toBeVisible();
  await expect(page.locator('.panel')).toBeVisible();
  const box = await page.locator('.panel').boundingBox();
  expect(box.y).toBeGreaterThan(200); // the bottom sheet sits below the map
});

test('REQ-107: installable — manifest and service worker are served', async ({ page, request }) => {
  await openApp(page, '#/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(href.replace(/^\.?\//, ''))).json();
  expect(manifest.name).toContain('Bee There');
  expect((await request.get('sw.js')).ok()).toBeTruthy();
});

test('REQ-108: the URL keeps the current page and tab on reload', async ({ page }) => {
  await openApp(page, '#/trips/t1');
  await page.getByRole('button', { name: /Chi phí/ }).first().click();
  await expect(page).toHaveURL(/trips\/t1.*tab=costs/);
  await page.reload();
  await expect(page.getByRole('button', { name: /Chi phí/ }).first()).toHaveClass(/on|active|is-on/);
});

test('REQ-109: title, description, Open Graph image and JSON-LD are in the page', async ({ page }) => {
  await openApp(page, '#/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image/);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  expect(await page.title()).toContain('Bee There');
});

test('REQ-110: the custom domain is configured for GitHub Pages', async () => {
  expect(readFileSync(new URL('../public/CNAME', import.meta.url), 'utf8').trim()).toBe('beetheremap.com');
  expect(readFileSync(new URL('../index.html', import.meta.url), 'utf8')).toContain('https://beetheremap.com');
});
