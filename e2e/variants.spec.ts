import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow, shot } from './helpers'

test.describe('layout variants @desktop-only', () => {
  test('slow 3G still renders landing and login @slow3g', async ({ page, context }) => {
    test.setTimeout(120_000)
    const client = await context.newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1000) / 8 * 0.8,
      uploadThroughput: (500 * 1000) / 8 * 0.8,
      latency: 400,
    })

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 90_000 })
    await assertNoHorizontalOverflow(page)

    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await expect(page.getByRole('heading', { name: /Welcome back|Create your account/ })).toBeVisible()
  })

  test('light and dark color schemes keep the public dark theme', async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
    const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await shot(page, testInfo, 'landing-color-scheme-light')

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await shot(page, testInfo, 'landing-color-scheme-dark')

    expect(lightBackground).toBe(darkBackground)
    await expect(page.getByRole('button', { name: /^light$|^dark$|theme/i })).toHaveCount(0)
    testInfo.annotations.push({
      type: 'theme',
      description: 'Public pages are dark only. Settings can store a theme preference, but it is not applied on the marketing site.',
    })
  })
})
