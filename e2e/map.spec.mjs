// TC-102 — Map & places (REQ-111…REQ-117)
import { test, expect, openApp } from './fixtures.mjs';

const body = (page) => page.locator('body');

test('REQ-111: visited places are pinned and counted on the world map', async ({ page }) => {
  await openApp(page, '#/');
  await expect(page.locator('.leaflet-container, .maplibregl-map').first()).toBeVisible();
  await expect(body(page)).toContainText(/2\s*\|?\s*quốc gia|🌏 2/);
  await expect(page.locator('.leaflet-marker-icon').filter({ hasText: '👣' }).first()).toBeVisible();
});

test('REQ-112: a country shows its famous places', async ({ page }) => {
  await openApp(page, '#/country/SG');
  await expect(body(page)).toContainText('Địa điểm nổi tiếng');
  await expect(body(page)).toContainText('Marina Bay Sands');
  await expect(body(page)).toContainText('Gardens by the Bay');
});

test('REQ-113: a pasted Google Maps link becomes a pinned place', async ({ page }) => {
  await openApp(page, '#/');
  const search = page.locator('.topbar .search input').first();
  await search.fill('https://www.google.com/maps/place/Ben+Thanh+Market/@10.7725,106.698,17z');
  await page.getByText('Thêm địa điểm từ link Google Maps này').click();
  const dialog = page.getByRole('dialog', { name: /Thêm địa điểm từ Google Maps/ });
  await expect(dialog.getByRole('textbox', { name: 'Tên địa điểm' })).toHaveValue('Ben Thanh Market');
  await dialog.getByRole('button', { name: /Sẽ ghé thăm/ }).click();
  await page.goto('#/memories');
  await expect(page.getByRole('button', { name: /Muốn đi \(2\)/ })).toBeVisible();
});

test('REQ-114: visited and wishlist lists, with removal', async ({ page }) => {
  await openApp(page, '#/memories');
  await expect(page.getByRole('button', { name: /Đã đến \(3\)/ })).toBeVisible();
  await page.getByRole('button', { name: /Muốn đi \(1\)/ }).click();
  await expect(body(page)).toContainText('Fushimi Inari');
  await page.goto('#/place/osm-jp1?lat=34.9671&lng=135.7727&name=Fushimi');
  await page.getByText('Xoá khỏi danh sách Muốn đi').click();
  await page.getByRole('button', { name: /Xoá|Đồng ý|OK/ }).last().click({ timeout: 2000 }).catch(() => {});
  await page.goto('#/memories');
  await expect(page.getByRole('button', { name: /Muốn đi \(0\)/ })).toBeVisible();
});

test('REQ-115: directions open Google Maps with exact coordinates on desktop', async ({ page }) => {
  await openApp(page, '#/place/osm-sg1?lat=1.2868&lng=103.8545&name=Merlion');
  await page.evaluate(() => { window.__opened = []; window.open = (u) => (window.__opened.push(u), null); });
  await page.getByRole('button', { name: 'Chỉ đường' }).first().click();
  expect(await page.evaluate(() => window.__opened[0])).toMatch(/google\.com\/maps\/dir\/.*destination=1\.2868/);
});

test('REQ-116: home panel shows tabs, stats and most checked-in places', async ({ page }) => {
  await openApp(page, '#/', { flags: { popularPlaces: true } });
  for (const t of ['Tổng quan', 'Đã đi', 'Muốn đi', 'Nổi tiếng']) await expect(page.locator('[data-tour="home-tabs"]')).toContainText(t);
  await expect(body(page)).toContainText('Được check-in nhiều nhất');
});

test('REQ-117: a trip can be shown on the map with its numbered route', async ({ page }) => {
  await openApp(page, '#/trips/t1');
  await page.getByRole('button', { name: /Xem trên bản đồ/ }).first().click();
  await expect(page).toHaveURL(/trip=t1/);
  await expect(page.locator('.leaflet-marker-icon').filter({ hasText: /^[1-4]$/ }).first()).toBeVisible();
});
