import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  testIgnore: 'authentication.spec.js',
  timeout: 60000,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'artifacts/browser-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60000,
  },
  outputDir: 'artifacts/test-results',
});
