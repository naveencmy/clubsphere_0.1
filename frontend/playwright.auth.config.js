import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'authentication.spec.js',
  timeout: 60000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true },
  webServer: [
    {
      command: 'node src/server.js',
      cwd: '../backend',
      env: { PORT: '4001', NODE_ENV: 'test', BETTER_AUTH_URL: 'http://localhost:4001' },
      url: 'http://localhost:4001/api/health/ready',
      timeout: 30000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      env: { VITE_API_PROXY_TARGET: 'http://localhost:4001' },
      url: 'http://127.0.0.1:4173',
      timeout: 30000,
      reuseExistingServer: false,
    },
  ],
  outputDir: 'artifacts/test-results',
});
