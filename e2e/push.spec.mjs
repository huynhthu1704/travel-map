// TC-122 — Notification settings: push notifications on/off for this device (REQ-062)
import { test, expect, openApp } from './fixtures.mjs';

const KEY = 'B' + 'A'.repeat(86); // any 65-byte public key (base64url)

/** Fake browser push support (the real Worker URL and key only exist once it is deployed) */
async function fakePush(page, { permission = 'default', answer = 'granted', supported = true, iphone = false } = {}) {
  await page.addInitScript(
    ([permission, answer, supported, iphone, key]) => {
      window.__BEE_PUSH__ = { url: 'https://push.test', key };
      if (iphone) Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari' });
      if (!supported) {
        delete window.PushManager;
        return;
      }
      let sub = null;
      const endpoint = 'https://push.example/device-1';
      const pushManager = {
        getSubscription: async () => sub,
        subscribe: async () =>
          (sub = { endpoint, toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }), unsubscribe: async () => ((sub = null), true) }),
      };
      const reg = { pushManager };
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { getRegistration: async () => reg, register: async () => reg, ready: Promise.resolve(reg), addEventListener() {}, controller: null },
      });
      window.PushManager = function PushManager() {};
      let perm = permission;
      window.Notification = { get permission() { return perm; }, requestPermission: async () => (perm = answer) };
    },
    [permission, answer, supported, iphone, KEY],
  );
}

/** Record the calls to the push Worker */
async function workerCalls(page) {
  const calls = [];
  await page.route('https://push.test/**', async (route) => {
    const req = route.request();
    calls.push({ path: new URL(req.url()).pathname, body: req.postDataJSON(), auth: req.headers().authorization });
    await route.fulfill({ contentType: 'application/json', body: '{"ok":true}', headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  return calls;
}

test('REQ-062: turn push on and off from Profile ⋯ → Notification settings', async ({ page }) => {
  await fakePush(page);
  await openApp(page, '#/u/demo-user', { flags: { pushNotif: true } });
  const calls = await workerCalls(page);
  await page.getByRole('button', { name: 'Thêm tuỳ chọn' }).click();
  await page.getByRole('menuitem', { name: /Cài đặt thông báo/ }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Cài đặt thông báo' });
  const sw = dialog.getByRole('switch', { name: /Thông báo đẩy/ });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(dialog).toContainText('Nhận thông báo kể cả khi đã đóng ứng dụng.');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('body')).toContainText('Đã bật thông báo đẩy trên thiết bị này');
  expect(calls[0]).toMatchObject({ path: '/subscribe', body: { lang: 'vi', subscription: { endpoint: 'https://push.example/device-1' } }, auth: 'Bearer demo' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(calls[1]).toMatchObject({ path: '/unsubscribe', body: { endpoint: 'https://push.example/device-1' } });
});

test('REQ-062: the same setting is on the Account & data page, in English too', async ({ page }) => {
  await fakePush(page);
  await openApp(page, '#/account', { flags: { pushNotif: true }, lang: 'en' });
  const calls = await workerCalls(page);
  const sw = page.getByRole('switch', { name: /Push notifications/ });
  await expect(page.getByRole('heading', { name: /Notification settings/ })).toBeVisible();
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(calls[0].body.lang).toBe('en');
});

test('REQ-062: refusing the browser prompt, or blocked notifications, disable the switch with a how-to line', async ({ page }) => {
  await fakePush(page, { answer: 'denied' });
  await openApp(page, '#/account', { flags: { pushNotif: true } });
  const sw = page.getByRole('switch', { name: /Thông báo đẩy/ });
  await sw.click();
  await expect(sw).toBeDisabled();
  await expect(page.locator('.push-row')).toContainText('Cho phép Thông báo ở biểu tượng ổ khoá');
});

test('REQ-062: an iPhone not opened from the Home Screen gets the Add to Home Screen steps', async ({ page }) => {
  await fakePush(page, { supported: false, iphone: true });
  await openApp(page, '#/account', { flags: { pushNotif: true } });
  await expect(page.getByRole('switch', { name: /Thông báo đẩy/ })).toBeDisabled();
  await expect(page.locator('.push-row')).toContainText('Thêm vào MH chính');
});

test('REQ-062: with the pushNotif flag off there is no Notification settings', async ({ page }) => {
  await fakePush(page);
  await openApp(page, '#/u/demo-user', { role: 'user' });
  await page.getByRole('button', { name: 'Thêm tuỳ chọn' }).click();
  await expect(page.getByRole('menuitem', { name: /Quyền riêng tư/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Cài đặt thông báo/ })).toHaveCount(0);
  await page.goto('#/account');
  await expect(page.getByRole('heading', { name: /Quyền riêng tư/ })).toBeVisible();
  await expect(page.getByRole('switch')).toHaveCount(0);
});
