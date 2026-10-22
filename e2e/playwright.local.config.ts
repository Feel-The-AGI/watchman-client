import path from 'path'
import { defineConfig, devices } from '@playwright/test'

const port = 3100
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: path.join(__dirname, 'local'),
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: `pnpm exec next dev --turbopack -H 127.0.0.1 -p ${port}`,
    cwd: path.resolve(__dirname, '..'),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_E2E_AUTH: '1',
      NEXT_PUBLIC_API_URL: baseURL,
      NEXT_PUBLIC_SUPABASE_URL: baseURL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
      NEXT_PUBLIC_SITE_URL: baseURL,
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
})
