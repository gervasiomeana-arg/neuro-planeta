import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || undefined, baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173/', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  outputDir: process.env.PLAYWRIGHT_BASE_URL ? 'test-results/published' : 'test-results/candidate',
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  reporter: [['list']],
});
