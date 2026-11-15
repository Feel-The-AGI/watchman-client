import { expect, test } from '@playwright/test'

const pricingPayload = {
  currency: 'usd',
  configured: true,
  monthly: { amount: 12, display: '$12', interval: 'month' },
  annual: { amount: 96, display: '$96', interval: 'year', per_month: 8, saving_percent: 33 },
}

test.describe('pricing plans @desktop-only', () => {
  test('shows the server prices and switches between yearly and monthly', async ({ page }) => {
    await page.route('**/api/payments/pricing', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pricingPayload),
    }))
    await page.goto('/pricing')
    await expect(page.getByText('$96').first()).toBeVisible()
    await expect(page.getByTestId('plan-price-note')).toHaveText('$8 a month, billed yearly (save 33%).')
    await page.getByRole('radio', { name: 'Monthly' }).click()
    await expect(page.getByTestId('plan-price-note')).toHaveText('Billed monthly. Cancel any time.')
  })

  test('falls back to the default prices when the pricing endpoint fails', async ({ page }) => {
    await page.route('**/api/payments/pricing', (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { error: 'upstream' } }),
    }))
    await page.goto('/pricing')
    await expect(page.getByTestId('plan-price-note')).toContainText(/billed yearly/i)
    await expect(page.getByText(/paystack|cedi/i)).toHaveCount(0)
  })

  test('says checkout opens soon while payments are not configured', async ({ page }) => {
    await page.route('**/api/payments/pricing', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...pricingPayload, configured: false }),
    }))
    await page.goto('/pricing')
    await expect(page.getByRole('button', { name: /checkout opens soon/i })).toBeDisabled()
  })

  test('tells the user when checkout was closed', async ({ page }) => {
    await page.goto('/pricing?checkout=cancelled')
    await expect(page.getByRole('status')).toHaveText('Checkout was closed. Nothing was charged.')
  })
})
