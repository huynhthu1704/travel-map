// Automated UI tests (Playwright). They run a demo-mode build: no Firebase, all data in the browser.
// Run: npm run test:e2e   ·   With a local Chrome: PW_CHROME=/usr/bin/google-chrome npm run test:e2e
import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;
const launchOptions = process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  // On CI the JSON report feeds e2e/report-bugs.mjs, which logs failing tests as GitHub issues
  reporter: process.env.CI
    ? [['list'], ['json', { outputFile: 'e2e-results/results.json' }], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    launchOptions,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, launchOptions } },
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions }, grep: /@phone/ },
  ],
  webServer: {
    // Blank Firebase config at build time → the app runs in demo mode
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    env: { VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_PROJECT_ID: '', VITE_RECAPTCHA_SITE_KEY: '' },
    url: `http://localhost:${PORT}/`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
