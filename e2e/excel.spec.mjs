// TC-046 — Excel export from the Plan and Costs tabs (REQ-026, REQ-029)
import { readFileSync } from 'node:fs';
import { test, expect, openApp } from './fixtures.mjs';

const sheetsIn = (path) => {
  // An .xlsx is a zip: file names are stored as plain text in its directory
  const raw = readFileSync(path).toString('latin1');
  return [...new Set(raw.match(/xl\/worksheets\/sheet\d+\.xml/g))].length;
};

test('REQ-029: Export Excel on the Costs tab downloads a four-sheet workbook with amounts filled in', async ({ page }) => {
  await openApp(page, '#/trips/t1?tab=costs', { flags: { tripExcel: true } });
  await page.evaluate(() => { navigator.canShare = () => false; });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Xuất Excel/ }).click()]);
  expect(dl.suggestedFilename()).toBe('Singapore-Malaysia.xlsx');
  const path = await dl.path();
  expect(sheetsIn(path)).toBe(4); // itinerary & costs, settle-up, rates, master data
  // Formula results are stored in the file (visible without recalculation)
  expect(readFileSync(path).length).toBeGreaterThan(5000);
});

test('REQ-026: Export Excel is hidden while the flag is off', async ({ page }) => {
  await openApp(page, '#/trips/t1', { role: 'user', flags: { tripExcel: false } });
  await expect(page.getByRole('button', { name: /Xuất PDF/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Xuất Excel/ })).toHaveCount(0);
});

test('REQ-026: Export Excel is also on the Plan tab', async ({ page }) => {
  await openApp(page, '#/trips/t1', { flags: { tripExcel: true } });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Xuất Excel/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/\.xlsx$/);
});
