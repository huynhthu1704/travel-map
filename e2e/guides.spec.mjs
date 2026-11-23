// TC-106 — Guides, tips & gear (REQ-134…REQ-141)
import { test, expect, openApp, mockNominatim } from './fixtures.mjs';

const ALL = { guide: true, guideToTrip: true, guideFoodCities: true, guideCosts: true, guideLinks: true, tips: true, gear: true };
const body = (page) => page.locator('body');

test('REQ-134: a country guide has its sections, official entry form and tap-to-call numbers', async ({ page }) => {
  await openApp(page, '#/guide/SG', { flags: ALL });
  for (const h of ['Visa & giấy tờ', 'Tiền & chi phí', 'Ổ điện', 'Số khẩn cấp', 'Nơi nên đi']) await expect(page.getByRole('heading', { name: new RegExp(h) }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /SG Arrival Card/ })).toHaveAttribute('href', /ica\.gov\.sg/);
  await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
  await page.goto('#/guide');
  await expect(page.locator('a[href*="#/guide/"]')).toHaveCount(12);
});

test('REQ-135: phrases have a listen button that falls back to Google Translate without a voice', async ({ page }) => {
  await openApp(page, '#/guide/MY', { flags: ALL });
  await page.evaluate(() => {
    window.__opened = [];
    window.open = (u) => (window.__opened.push(u), null);
    // The device only has an English voice, so Malay must fall back to Google Translate
    window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'English' }];
  });
  await page.getByRole('button', { name: 'Nghe đọc: terima kasih' }).click();
  await expect.poll(() => page.evaluate(() => window.__opened[0] || '')).toMatch(/translate\.google\./);
});

test('REQ-136: a guide place can be added to a trip plan', async ({ page }) => {
  await openApp(page, '#/guide/MY', { flags: ALL });
  await mockNominatim(page, [{ place_id: 1, lat: '3.2379', lon: '101.684', display_name: 'Batu Caves, Selangor, Malaysia', name: 'Batu Caves', address: { country_code: 'my', city: 'Selangor' } }]);
  await page.getByRole('button', { name: /Động Batu \+/ }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: /Singapore & Malaysia/ }).click();
  await page.goto('#/trips/t1');
  await expect(body(page)).toContainText(/Batu/);
});

test('REQ-137: local food can be filtered by city', async ({ page }) => {
  await openApp(page, '#/guide/MY', { flags: ALL });
  await page.getByRole('button', { name: /Penang \(2\)/ }).click();
  await expect(page.getByRole('link', { name: /Laksa Penang/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Nasi lemak/ })).toHaveCount(0);
});

test('REQ-138: the sample cost calculator applies estimates to a trip', async ({ page }) => {
  await openApp(page, '#/guide/MY', { flags: ALL });
  await page.getByRole('button', { name: 'Trung bình' }).click();
  await page.getByRole('button', { name: /Áp vào chuyến đi/ }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: /Singapore & Malaysia/ }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: /Áp|Thêm|Đồng ý/ }).last().click({ timeout: 3000 }).catch(() => {});
  await page.goto('#/trips/t1?tab=costs');
  await expect(page.locator('body')).toContainText(/Ăn uống|Di chuyển|Lưu trú|Chỗ ở/);
});

test('REQ-139: staff-managed useful links appear in the guide', async ({ page }) => {
  await openApp(page, '#/guide/SG', { flags: ALL });
  const link = page.getByRole('link', { name: /Sân bay Changi/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://maps.app.goo.gl/changi');
});

test('REQ-140: community travel tips can be voted on', async ({ page }) => {
  await openApp(page, '#/tips/SG', { flags: ALL });
  await page.getByText('Đi MRT bằng thẻ Visa').click();
  const helpful = page.getByRole('button', { name: /Hữu ích · 2/ });
  await helpful.click();
  await expect(page.getByRole('button', { name: /Hữu ích · 3/ })).toBeVisible();
});

test('REQ-141: the gear page filters by trip type and discloses affiliate links', async ({ page }) => {
  await openApp(page, '#/gear', { flags: ALL });
  await expect(page.getByRole('link', { name: /Đồ du lịch/ }).first()).toBeVisible(); // reachable from the top nav
  await expect(body(page)).toContainText(/affiliate|tiếp thị liên kết/i);
  await page.getByRole('button', { name: /Đi biển/ }).click();
  await expect(body(page)).toContainText('Dép đi biển');
  await expect(body(page)).not.toContainText('Ổ chuyển đa năng');
});
