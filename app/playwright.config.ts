import { defineConfig, devices } from '@playwright/test';

/**
 * Real-browser smoke suite (Gate A finding A-04).
 *
 * Requires browser binaries: `npx playwright install chromium`.
 * They could not be downloaded in the delivery container — see
 * docs/QA_EVIDENCE.md for what did and did not run.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.artifacts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3000/map',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
