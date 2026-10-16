import { defineConfig } from '@playwright/test';

/** I test e2e usano il backend vero su :8080 (profilo mocked): servono Docker e il backend avviati. */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4200' },
  webServer: { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', launchOptions: { executablePath: process.env['PLAYWRIGHT_CHROMIUM'] ?? undefined } },
    },
  ],
});
