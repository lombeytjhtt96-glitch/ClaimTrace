/**
 * ClaimTrace JKN - Playwright Configuration
 * Used when running tests via: npx playwright test tests/Browser/
 */

const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'scenarios'),
  testMatch: /.*\.spec\.js$/,
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(__dirname, 'reports/playwright_test_results.json') }],
    ['html', { outputFolder: path.join(__dirname, 'reports/html-report'), open: 'never' }]
  ],
  use: {
    baseURL: process.env.PORTAL_BASE_URL || 'http://127.0.0.1:8001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas'
          ]
        }
      }
    }
  ]
});
