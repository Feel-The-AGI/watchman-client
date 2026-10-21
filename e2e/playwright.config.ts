import path from 'path'
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'https://www.trywatchman.app'
const artifacts = path.resolve(process.cwd(), 'e2e/artifacts')

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(artifacts, 'results.json') }],
    ['./reporters/matrix-reporter.ts'],
    ['html', { outputFolder: path.join(artifacts, 'html-report'), open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'iphone-13',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
      grepInvert: /@desktop-only/,
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
      grep: /@viewport/,
    },
  ],
})
