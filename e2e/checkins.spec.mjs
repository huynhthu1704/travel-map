// TC-103 — Check-ins & memories (REQ-118…REQ-122)
import { test, expect, openApp } from './fixtures.mjs';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
const body = (page) => page.locator('body');

async function openMemory(page, name) {
  await page.goto('#/memories');
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
  return page.getByRole('dialog', { name });
}

test('REQ-118: check in with a photo, caption and date', async ({ page }) => {
  await openApp(page, '#/country/SG');
  await page.getByText('Gardens by the Bay').first().click();
  await page.getByRole('button', { name: /Check-in tại đây/ }).click();
  const dlg = page.getByRole('dialog', { name: /Check-in · Gardens by the Bay/ });
  await dlg.getByRole('textbox', { name: 'Ngày check-in 📅' }).fill('2026-11-11');
  await dlg.getByRole('textbox', { name: /Thông tin gợi nhớ/ }).fill('Siêu cây phát sáng');
  await dlg.locator('input[type=file]').first().setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG });
  await dlg.getByRole('button', { name: /Lưu check-in/ }).click();
  await expect(dlg).toBeHidden({ timeout: 15_000 });
  await page.goto('#/memories');
  await expect(page.getByRole('button', { name: /Kỉ niệm \(3\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Siêu cây phát sáng Gardens by the Bay 11\/11\/2026/ })).toBeVisible();
});

test('REQ-119: edit a check-in, then delete it and the trip journey updates', async ({ page }) => {
  await openApp(page, '#/memories');
  let dlg = await openMemory(page, 'Merlion Park');
  await dlg.getByRole('button', { name: /Sửa/ }).click();
  const edit = page.getByRole('dialog').filter({ hasText: /Check-in|Sửa/ }).last();
  await edit.getByRole('textbox', { name: /Thông tin gợi nhớ/ }).fill('Merlion về đêm');
  await edit.getByRole('button', { name: /Lưu/ }).click();
  await expect(page.getByRole('button', { name: /Merlion về đêm/ })).toBeVisible();
  dlg = await openMemory(page, 'Merlion Park');
  await dlg.getByRole('button', { name: 'Xoá' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Xoá|Đồng ý/ }).last().click({ timeout: 2000 }).catch(() => {});
  await expect(page.getByRole('button', { name: /Kỉ niệm \(1\)/ })).toBeVisible();
  await page.goto('#/trips/t1?tab=journey');
  await expect(page.locator('.timeline')).not.toContainText('Merlion');
});

test('REQ-120: memories are sorted by check-in date, newest first', async ({ page }) => {
  await openApp(page, '#/memories');
  const tiles = page.getByRole('button', { name: /\d{2}\/\d{2}\/\d{4}$/ });
  await expect(tiles.first()).toContainText('Merlion Park');
  await expect(tiles.nth(1)).toContainText('Hoi An');
});

test('REQ-121: share studio offers templates and formats and exports an image', async ({ page }) => {
  await openApp(page, '#/memories', { flags: { share: true } });
  const dlg = await openMemory(page, 'Merlion Park');
  await dlg.getByRole('button', { name: /Chia sẻ/ }).click();
  const studio = page.getByRole('dialog').last();
  for (const t of ['Polaroid', 'Bưu thiếp', 'Cuộn phim', 'Bento', 'Story 9:16', 'Post 4:5', 'Vuông 1:1']) await expect(studio.getByRole('button', { name: new RegExp(t) })).toBeVisible();
  await studio.getByRole('button', { name: /Postcard|Bưu thiếp/ }).click();
  await studio.getByRole('button', { name: 'Vuông 1:1' }).click();
  await studio.getByRole('button', { name: /Tạo ảnh/ }).click();
  await expect(studio).toContainText('Đây là ảnh sẽ được lưu');
  await page.evaluate(() => { navigator.canShare = () => false; });
  const [dl] = await Promise.all([page.waitForEvent('download'), studio.locator('.btn--primary').filter({ hasNotText: /Tạo/ }).first().click()]);
  expect(dl.suggestedFilename()).toMatch(/\.png$/);
});

test('REQ-122: year recap offers layouts and can be previewed', async ({ page }) => {
  await openApp(page, '#/memories', { flags: { recap: true } });
  await page.getByRole('button', { name: /Tổng kết năm/ }).click();
  const dlg = page.getByRole('dialog').last();
  for (const t of ['Bản đồ', 'Lưới ảnh', 'Trình chiếu']) await expect(dlg).toContainText(t);
  await expect(dlg).toContainText('2026');
});
