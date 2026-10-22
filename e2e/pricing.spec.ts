import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow } from './helpers'

test.describe('pricing plans @desktop-only', () => {
  test('shows the Stripe plans and drops Paystack and cedis copy', async ({ page }) => {
    await page.route('**/api/billing/founding', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ seats_left: 17 }),
    }))
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: 'Simple pricing. Cancel anytime.' })).toBeVisible()
    await expect(page.getByText('Built by a miner, for rotation workers everywhere')).toBeVisible()
    await expect(page.getByText('$6').first()).toBeVisible()
    await expect(page.getByText('$48').first()).toBeVisible()
    await expect(page.getByText('$36').first()).toBeVisible()
    await expect(page.getByText('Save 33%')).toBeVisible()
    await expect(page.getByTestId('founding-badge')).toHaveText('First 100 only · 17 left')
    await expect(page.getByText("That's about $4 a month.")).toBeVisible()
    await expect(page.getByTestId('billing-small-print')).toContainText('Billed in USD by card via Stripe')
    await expect(page.getByRole('cell', { name: 'Leave planning' })).toBeVisible()
    await expect(page.locator('[data-feature="Leave planning"] [data-column="free"]')).toHaveAttribute('data-included', 'false')
    await expect(page.locator('[data-feature="Leave planning"] [data-column="pro"]')).toHaveAttribute('data-included', 'true')
    await expect(page.getByText(/Paystack|GHS|\$12|for 30 days/i)).toHaveCount(0)
  })

  test('does not clip the comparison table at 360px or 390px', async ({ page }) => {
    await page.route('**/api/billing/founding', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ seats_left: 8 }),
    }))
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/pricing')
      await expect(page.getByTestId('plan-comparison')).toBeVisible()
      await assertNoHorizontalOverflow(page)
      const clipped = await page.locator('[data-testid="plan-comparison"] th, [data-testid="plan-comparison"] td').evaluateAll((cells) =>
        cells
          .filter((cell) => cell.scrollWidth > cell.clientWidth + 1)
          .map((cell) => (cell.textContent || '').trim()),
      )
      expect(clipped, `${width}px clipped cells`).toEqual([])
    }
  })

  test('keeps checkout closed until the Stripe provider is on', async ({ page }) => {
    test.skip(process.env.E2E_PAYMENTS_PROVIDER === 'stripe', 'Stripe build opens checkout instead')
    await page.route('**/api/billing/founding', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ seats_left: 3 }),
    }))
    await page.goto('/pricing')
    await expect(page.getByRole('button', { name: 'Coming soon' })).toHaveCount(3)
    await expect(page.getByRole('button', { name: 'Start free' })).toBeEnabled()
  })
})
