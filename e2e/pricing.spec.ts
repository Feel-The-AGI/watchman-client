import { expect, test } from '@playwright/test'

const pricingPayload = {
  usd_price: 12,
  ghs_amount: 139.86,
  exchange_rate: 11.6547,
  currency: 'GHS',
  display_price: '$12',
  display_ghs: 'GHS 139.86',
  period_days: 30,
  note: '$12 USD for 30 days at the current exchange rate',
}

test.describe('pricing currency @desktop-only', () => {
  test('shows the approximate cedi amount from the pricing endpoint', async ({ page }) => {
    await page.route('**/api/payments/pricing', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pricingPayload),
    }))
    await page.goto('/pricing')
    await expect(page.getByText('$12').first()).toBeVisible()
    await expect(page.getByTestId('ghs-charge-note')).toHaveText('≈ GHS 139.86, charged in cedis via Paystack')
  })

  test('keeps the cedis note when the pricing endpoint fails', async ({ page }) => {
    await page.route('**/api/payments/pricing', (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { error: 'upstream' } }),
    }))
    await page.goto('/pricing')
    await expect(page.getByTestId('ghs-charge-note')).toHaveText(/Charged in cedis via Paystack at the day.s rate/)
    await expect(page.getByText(/≈ GHS/)).toHaveCount(0)
  })
})
