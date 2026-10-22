import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow, shot, trackPageHealth } from './helpers'

const pages = [
  { path: '/', name: 'landing', heading: /Your Life Isn/i },
  { path: '/pricing', name: 'pricing', heading: /Simple pricing/i },
  { path: '/privacy', name: 'privacy', heading: /Privacy Policy/i },
  { path: '/terms', name: 'terms', heading: /Terms/i },
  { path: '/login', name: 'login', heading: /Welcome back/i },
]

test.describe('public pages @viewport', () => {
  for (const entry of pages) {
    test(`${entry.name} renders`, async ({ page, baseURL }, testInfo) => {
      const health = trackPageHealth(page, baseURL!)
      const response = await page.goto(entry.path, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `${entry.path} document`).toBeLessThan(400)
      await expect(page.getByRole('heading', { name: entry.heading }).first()).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await shot(page, testInfo, entry.name)
      health.assertHealthy()
    })
  }

  test('pricing explains card billing in USD', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: /Simple pricing/i })).toBeVisible()
    await expect(page.getByText('$6').first()).toBeVisible()
    await expect(page.getByTestId('billing-small-print')).toContainText(/Billed in USD by card via Stripe/i)
    await expect(page.getByText(/Paystack|GHS/i)).toHaveCount(0)
  })
})
