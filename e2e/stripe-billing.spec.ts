import { expect, test, type BrowserContext, type Page, type TestInfo } from '@playwright/test'
import { assertNoHorizontalOverflow, shot } from './helpers'

const user = {
  id: 'user-1',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'miner@example.com',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  app_metadata: { provider: 'email' },
  user_metadata: { name: 'Mina Miner' },
  created_at: '2026-01-01T00:00:00.000Z',
}

function sessionCookieValue() {
  const session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    token_type: 'bearer',
    user,
  }
  return `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`
}

async function signIn(context: BrowserContext, page: Page, baseURL: string) {
  await context.addCookies([{
    name: 'sb-example-auth-token',
    value: sessionCookieValue(),
    url: baseURL,
  }])
  await page.addInitScript(() => {
    localStorage.setItem('watchman_pro_celebration_user-1', 'true')
  })
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
}

function billingStatus(overrides: Record<string, unknown> = {}) {
  return {
    plan: 'free',
    status: 'active',
    current_period_end: null,
    cancel_at_period_end: false,
    founding_seats_left: 17,
    ...overrides,
  }
}

async function mockBilling(page: Page, options: {
  status?: Record<string, unknown>
  seats?: number
  checkout?: (plan: string) => { status: number; body: unknown }
  portal?: { status: number; body: unknown }
} = {}) {
  const seats = options.seats ?? 17
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const json = (status: number, body: unknown) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
    if (path.endsWith('/api/billing/founding')) return json(200, { seats_left: seats })
    if (path.endsWith('/api/billing/status')) return json(200, options.status ?? billingStatus())
    if (path.endsWith('/api/billing/checkout')) {
      const plan = (route.request().postDataJSON() as { plan?: string } | null)?.plan || 'monthly'
      const result = options.checkout?.(plan) ?? { status: 200, body: { url: `https://checkout.stripe.test/${plan}` } }
      return json(result.status, result.body)
    }
    if (path.endsWith('/api/billing/portal')) {
      const result = options.portal ?? { status: 200, body: { url: 'https://billing.stripe.test/portal' } }
      return json(result.status, result.body)
    }
    if (path.endsWith('/api/auth/me')) {
      return json(200, {
        id: user.id,
        email: user.email,
        name: 'Mina Miner',
        timezone: 'UTC',
        tier: (options.status?.plan === 'free' || !options.status?.plan) ? 'free' : 'pro',
        role: 'user',
        onboarding_completed: true,
        settings: {},
      })
    }
    if (path.endsWith('/api/settings')) {
      return json(200, { settings: { timezone: 'UTC', notifications_email: true, theme: 'dark' } })
    }
    return json(200, {})
  })
  await page.route('https://checkout.stripe.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<html><body><h1>Stripe Checkout</h1></body></html>',
  }))
  await page.route('https://billing.stripe.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<html><body><h1>Stripe Portal</h1></body></html>',
  }))
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await assertNoHorizontalOverflow(page)
  await shot(page, testInfo, name)
}

test.describe('stripe billing client @desktop-only', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.E2E_PAYMENTS_PROVIDER !== 'stripe', 'Requires a build with NEXT_PUBLIC_PAYMENTS_PROVIDER=stripe')
    await page.emulateMedia({ colorScheme: 'dark' })
  })

  test('signed-out plan buttons go to sign up for that plan', async ({ page }) => {
    await mockBilling(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/pricing')
    await expect(page.getByRole('button', { name: 'Get Pro: $6/month' })).toBeVisible()
    await page.getByRole('button', { name: 'Start free' }).click()
    await expect(page).toHaveURL(/\/login\?mode=signup$/)
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

    await page.goto('/pricing')
    await page.getByRole('button', { name: 'Get Pro: $6/month' }).click()
    await expect(page).toHaveURL(/mode=signup/)
    await expect(page).toHaveURL(/checkout%3Dmonthly/)
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

    await page.goto('/pricing')
    await page.getByRole('button', { name: 'Get Pro yearly: $48/year' }).click()
    await expect(page).toHaveURL(/checkout%3Dyearly/)

    await page.goto('/pricing')
    await page.getByRole('button', { name: 'Claim a founding spot' }).click()
    await expect(page).toHaveURL(/checkout%3Dfounding/)
  })

  test('signed-in checkout, sold out, 503, success, and cancel', async ({ page, context, baseURL }, testInfo) => {
    await signIn(context, page, baseURL || 'http://127.0.0.1:3000')
    await mockBilling(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/pricing')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByTestId('founding-badge')).toHaveText('First 100 only · 17 left')
    await capture(page, testInfo, 'pricing-1280')

    await page.getByRole('button', { name: 'Get Pro: $6/month' }).click()
    await expect(page).toHaveURL(/checkout\.stripe\.test\/monthly/)
    await expect(page.getByRole('heading', { name: 'Stripe Checkout' })).toBeVisible()

    await page.goto('/pricing')
    await page.getByRole('button', { name: 'Get Pro yearly: $48/year' }).click()
    await expect(page).toHaveURL(/checkout\.stripe\.test\/yearly/)

    await page.goto('/pricing')
    await page.getByRole('button', { name: 'Claim a founding spot' }).click()
    await expect(page).toHaveURL(/checkout\.stripe\.test\/founding/)

    await mockBilling(page, { seats: 0 })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/pricing')
    await expect(page.getByTestId('founding-sold-out')).toHaveText('Founding 100 is full. Thank you.')
    await expect(page.getByRole('button', { name: 'Claim a founding spot' })).toHaveCount(0)
    await capture(page, testInfo, 'pricing-sold-out-390')

    await mockBilling(page, {
      checkout: () => ({ status: 503, body: { detail: 'payments are not configured' } }),
    })
    await page.goto('/pricing')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await page.getByRole('button', { name: 'Get Pro: $6/month' }).click()
    await expect(page.getByTestId('billing-error')).toHaveText('Payments are not configured yet. Nothing was charged.')
    await expect(page.getByRole('button', { name: 'Coming soon' }).first()).toBeVisible()
    await expect(page).toHaveURL(/\/pricing/)
    await capture(page, testInfo, 'pricing-503-390')

    await mockBilling(page, {
      checkout: (plan) => plan === 'founding'
        ? { status: 409, body: { detail: 'full' } }
        : { status: 200, body: { url: `https://checkout.stripe.test/${plan}` } },
    })
    await page.goto('/pricing')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await page.getByRole('button', { name: 'Claim a founding spot' }).click()
    await expect(page.getByTestId('founding-sold-out')).toHaveText('Founding 100 is full. Thank you.')
    await expect(page.getByTestId('billing-error')).toHaveText('Founding 100 is full. Thank you.')

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/pricing?billing=success')
    await expect(page.getByText("You're on Pro")).toBeVisible()
    await expect(page).not.toHaveURL(/billing=success/)
    await capture(page, testInfo, 'pricing-success-1280')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/pricing?billing=cancel')
    await expect(page.getByText('Checkout cancelled. Nothing was charged.')).toBeVisible()
    await expect(page.getByText("You're on Pro")).toHaveCount(0)
    await expect(page).not.toHaveURL(/billing=cancel/)
    await capture(page, testInfo, 'pricing-cancel-390')
  })

  test('settings billing shows the shared plan table, portal, and period', async ({ page, context, baseURL }, testInfo) => {
    await signIn(context, page, baseURL || 'http://127.0.0.1:3000')
    await mockBilling(page, { status: billingStatus({ plan: 'free', founding_seats_left: 9 }) })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard/settings')
    await page.getByRole('button', { name: 'Subscription' }).click()
    await expect(page.getByTestId('billing-plan-name')).toHaveText('Free')
    await expect(page.getByTestId('manage-subscription')).toHaveCount(0)
    await expect(page.getByTestId('upgrade-monthly')).toHaveText(/Get Pro: \$6\/month/)
    await expect(page.locator('[data-feature="Leave planning"] [data-column="free"]')).toHaveAttribute('data-included', 'false')
    await expect(page.locator('[data-feature="Leave planning"] [data-column="pro"]')).toHaveAttribute('data-included', 'true')
    const tick = page.getByTestId('plan-free-tick').first()
    await expect(tick).toBeVisible()
    const tickColor = await tick.evaluate((element) => getComputedStyle(element).color)
    expect(tickColor).toBe('rgb(244, 244, 245)')
    await expect(page.getByText(/Paystack|GHS|Cancel Pro/)).toHaveCount(0)
    await capture(page, testInfo, 'settings-billing-free-390')

    await page.getByTestId('upgrade-yearly').click()
    await expect(page).toHaveURL(/checkout\.stripe\.test\/yearly/)

    await page.unroute('**/api/**')
    await mockBilling(page, {
      status: billingStatus({
        plan: 'yearly',
        status: 'active',
        current_period_end: '2027-06-15T12:00:00.000Z',
        cancel_at_period_end: false,
      }),
    })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard/settings?billing=success')
    await expect(page.getByText("You're on Pro")).toBeVisible()
    await expect(page.getByTestId('billing-plan-name')).toHaveText('Pro')
    await expect(page.getByTestId('billing-period')).toContainText('Renews on')
    await expect(page.getByTestId('manage-subscription')).toBeVisible()
    await expect(page.getByText(/Paystack|GHS|Cancel Pro/)).toHaveCount(0)
    await capture(page, testInfo, 'settings-billing-pro-1280')

    await page.getByTestId('manage-subscription').click()
    await expect(page).toHaveURL(/billing\.stripe\.test\/portal/)

    await page.unroute('**/api/**')
    await mockBilling(page, {
      status: billingStatus({
        plan: 'founding',
        current_period_end: '2027-06-15T12:00:00.000Z',
        cancel_at_period_end: true,
      }),
      portal: { status: 503, body: { detail: 'not configured' } },
    })
    await page.goto('/dashboard/settings')
    await page.getByRole('button', { name: 'Subscription' }).click()
    await expect(page.getByTestId('billing-plan-name')).toHaveText('Founding 100')
    await expect(page.getByTestId('billing-period')).toContainText('Ends on')
    await page.getByTestId('manage-subscription').click()
    await expect(page.getByTestId('billing-error')).toHaveText('Payments are not configured yet. Nothing was charged.')
    await capture(page, testInfo, 'settings-billing-ends-1280')
  })

  test('pricing and login screenshots at both widths', async ({ page }, testInfo) => {
    await mockBilling(page, { seats: 42 })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await capture(page, testInfo, 'home-390')
    await page.goto('/pricing')
    await expect(page.getByTestId('founding-badge')).toContainText('42 left')
    await capture(page, testInfo, 'pricing-390')
    await page.goto('/login')
    await capture(page, testInfo, 'login-390')

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await capture(page, testInfo, 'home-1280')
    await page.goto('/login')
    await capture(page, testInfo, 'login-1280')
  })
})
