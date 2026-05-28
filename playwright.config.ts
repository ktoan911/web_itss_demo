import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The user starts both servers manually before running:
  //   cd server && npm run seed:reset && npm run dev   (terminal 1)
  //   cd client && npm run dev                          (terminal 2)
  //   npx playwright test                               (terminal 3)
});
