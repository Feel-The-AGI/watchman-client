import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow, shot } from './helpers'

test.describe('home and legal copy @desktop-only', () => {
  test('mobile header links to pricing and the hero tile stays off the headline', async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('nav').getByRole('link', { name: 'Pricing' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByTestId('floating-day')).toHaveCount(0)
    await assertNoHorizontalOverflow(page)
    await shot(page, testInfo, 'home-390')

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page.getByTestId('floating-day').first()).toBeVisible()
    const overlap = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.getBoundingClientRect()
      if (!heading) return true
      return [...document.querySelectorAll('[data-testid="floating-day"]')].some((tile) => {
        const box = tile.getBoundingClientRect()
        return !(box.right <= heading.left || box.left >= heading.right || box.bottom <= heading.top || box.top >= heading.bottom)
      })
    })
    expect(overlap).toBe(false)
    const heroColor = await page.locator('h1 span').nth(1).evaluate((element) => getComputedStyle(element).color)
    expect(heroColor).toBe('rgb(212, 212, 216)')
    await assertNoHorizontalOverflow(page)
    await shot(page, testInfo, 'home-1280')
  })

  test('login has no horizontal overflow at 390 and 1280', async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    for (const [width, height, name] of [[390, 844, 'login-390'], [1280, 800, 'login-1280']] as const) {
      await page.setViewportSize({ width, height })
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await shot(page, testInfo, name)
    }
  })

  test('terms and privacy describe Stripe card billing', async ({ page }) => {
    await page.goto('/legal/terms')
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
    await expect(page.getByText(/through Stripe/)).toBeVisible()
    await expect(page.getByText(/^No refunds/)).toBeVisible()
    await expect(page.getByText(/\$12|for 30 days|Paystack|does not renew automatically/i)).toHaveCount(0)

    await page.goto('/legal/privacy')
    await expect(page.getByText(/processed by Stripe/)).toBeVisible()
    if (process.env.E2E_PAYMENTS_PROVIDER === 'stripe') {
      await expect(page.getByText(/Paystack/)).toHaveCount(0)
    }
  })
})
