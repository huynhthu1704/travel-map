// TC-105 — Trips (REQ-126…REQ-133)
import { test, expect, openApp } from './fixtures.mjs';

const body = (page) => page.locator('body');

test('REQ-126: create a trip; only the owner can delete a trip', async ({ page }) => {
  await openApp(page, '#/trips', { flags: { trips: true } });
  await page.getByRole('button', { name: /Tạo chuyến đi mới/ }).click();
  const dlg = page.getByRole('dialog', { name: /Tạo chuyến đi mới/ });
  await dlg.getByRole('textbox').first().fill('Đà Lạt cuối tuần');
  await dlg.getByRole('button', { name: 'Tạo chuyến đi' }).click();
  await expect(body(page)).toContainText('Đà Lạt cuối tuần');
  await page.goto('#/trips');
  await expect(page.getByRole('button', { name: /Tất cả \(3\)/ })).toBeVisible();
  // Kyoto 2027 was created by Thư: I am only a member, so there is no delete button
  await page.goto('#/trips/t2');
  await page.getByRole('button', { name: 'Tuỳ chọn chuyến đi' }).click();
  await expect(page.getByRole('button', { name: /Xoá chuyến đi/ })).toHaveCount(0);
  await page.goto('#/trips/t1');
  await page.reload();
  await page.getByRole('button', { name: 'Tuỳ chọn chuyến đi' }).click();
  await expect(page.getByRole('button', { name: /Xoá chuyến đi/ })).toBeVisible();
});

test('REQ-127: trips are members-only; join with an invite code', async ({ page }) => {
  await openApp(page, '#/trips', { flags: { trips: true, tripInvites: true } });
  await expect(body(page)).not.toContainText('Bali 2027');
  await page.getByRole('button', { name: /Tham gia bằng mã mời/ }).click();
  const dlg = page.getByRole('dialog', { name: /Tham gia bằng mã mời/ });
  await dlg.getByRole('textbox').fill('BALI2027');
  await dlg.getByRole('button', { name: 'Tham gia' }).click();
  await page.goto('#/trips');
  await expect(body(page)).toContainText('Bali 2027');
  await page.goto('#/trips/t1');
  await page.getByRole('button', { name: /Thành viên & mời/ }).click();
  await page.getByRole('button', { name: /Mã \/ link mời/ }).click();
  await expect(page.getByRole('dialog').last()).toContainText('SGMY2026');
});

test('REQ-128: the plan is grouped by day and sorted by time; marking done marks the place visited', async ({ page }) => {
  await openApp(page, '#/trips/t1');
  const day1 = page.locator('h4', { hasText: 'Ngày 1' });
  await expect(day1).toBeVisible();
  const text = await body(page).innerText();
  expect(text.indexOf('Chinatown')).toBeLessThan(text.indexOf('Merlion Park')); // 14:00 before 18:00
  const gbtb = page.locator('li, .plan-item').filter({ hasText: 'Gardens by the Bay' }).last();
  await gbtb.getByRole('button', { name: /Đã đi/ }).click();
  await page.goto('#/memories');
  await expect(page.getByRole('button', { name: /Đã đến \(4\)/ })).toBeVisible();
});

test('REQ-129: the Journey lists the group’s stops and linked check-ins', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=journey');
  const tl = page.locator('.timeline');
  await expect(tl).toContainText('Chinatown');
  await expect(tl).toContainText('bởi Thư');
  await expect(tl).toContainText('Đêm đầu tiên ở Singapore');
  await expect(tl.locator('img').first()).toBeVisible();
});

test('REQ-130: multi-currency costs and settle-up show who pays whom', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=costs', { flags: { tripCosts: true } });
  await expect(body(page)).toContainText('100 SGD');
  await expect(body(page)).toContainText('1.960.000 ₫'); // 100 SGD × 19,600
  await expect(body(page)).toContainText('Lan → Thư');
  await expect(body(page)).toContainText('Cần nộp 1.920.000 ₫');
});

test('REQ-131: “each person” checklist items count every member’s tick separately', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=checklist', { flags: { tripChecklist: true } });
  const item = page.locator('.check-items li').filter({ hasText: 'Hộ chiếu' });
  await expect(item).toContainText('0/2');
  await item.getByRole('checkbox').check();
  await expect(item).toContainText('1/2');
});

test('REQ-132: the plan can be exported as a PDF', async ({ page }) => {
  await openApp(page, '#/trips/t1', { flags: { tripPdf: true } });
  await page.evaluate(() => { navigator.canShare = () => false; });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), page.getByRole('button', { name: /Xuất PDF/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/\.pdf$/);
});

test('REQ-133: duplicate a trip as a new trip', async ({ page }) => {
  await openApp(page, '#/trips/t1', { flags: { tripDuplicate: true } });
  await page.getByRole('button', { name: 'Tuỳ chọn chuyến đi' }).click();
  await page.getByRole('button', { name: /Nhân bản|Sao chép/ }).first().click();
  await expect(page.getByRole('heading', { name: /Nhân bản thành chuyến mới/ })).toBeVisible();
  await page.getByRole('button', { name: /Tạo chuyến mới/ }).click();
  await page.goto('#/trips');
  await expect(page.getByRole('button', { name: /Tất cả \(3\)/ })).toBeVisible();
});
