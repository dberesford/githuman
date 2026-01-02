import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'os';
import { join } from 'path';

// Use a fixed uncommon port to avoid conflicts
const port = process.env.E2E_PORT ? parseInt(process.env.E2E_PORT, 10) : 4847;

// Use a temp database for E2E tests to avoid polluting the local database
const e2eDbPath = join(tmpdir(), `code-review-e2e-${port}.db`);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node src/cli/index.ts serve --port ${port} --no-open`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      CODE_REVIEW_DB_PATH: e2eDbPath,
    },
  },
});
