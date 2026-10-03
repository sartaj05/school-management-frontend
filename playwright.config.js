import { defineConfig, devices } from '@playwright/test'

const env = globalThis.process?.env ?? {}

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: env.WEB_E2E_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
})
