import { expect, test } from '@playwright/test'

test.describe('authentication', () => {
  test('signup and register open the login form in sign-up mode', async ({ page }) => {
    for (const path of ['/signup', '/register']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login\?mode=signup/)
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
      await expect(page.getByLabel('Full Name')).toBeVisible()
      await expect(page.getByPlaceholder('Your name')).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    }
  })

  test('sign-up toggle shows fields and browser validation', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeEnabled()
    await page.getByRole('button', { name: 'Sign up' }).click()
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByPlaceholder('Your name')).toBeVisible()

    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password', { exact: true }).fill('longenough')
    await page.getByRole('button', { name: 'Create Account' }).click()
    const emailMessage = await page.getByLabel('Email').evaluate((element: HTMLInputElement) => element.validationMessage)
    expect(emailMessage).toMatch(/@|email/i)
    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel('Email').fill('person@example.com')
    await page.getByLabel('Password', { exact: true }).fill('short')
    await page.getByRole('button', { name: 'Create Account' }).click()
    const passwordMessage = await page.getByLabel('Password', { exact: true }).evaluate((element: HTMLInputElement) => element.validationMessage)
    expect(passwordMessage.length).toBeGreaterThan(0)
    await expect(page).toHaveURL(/\/login/)
  })

  test('magic link and Google are offered without sending anything', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await page.getByRole('button', { name: 'Magic Link' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in with magic link' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Check Your Email' })).toHaveCount(0)
  })

  test('creating an account shows progress and disables the fields', async ({ page }) => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/auth/v1/signup**', async (route) => {
      await gate
      await route.abort()
    })

    await page.goto('/login?mode=signup')
    await expect(page.getByLabel('Full Name')).toBeEnabled()
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('e2e-blocked@example.com')
    await page.getByLabel('Password', { exact: true }).fill('long-enough-password')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByRole('button', { name: /Creating your account/ })).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeDisabled()
    await expect(page.getByLabel('Email')).toBeDisabled()
    await expect(page.getByLabel('Password', { exact: true })).toBeDisabled()
    release()
  })

  test('get-started landing actions open sign-up, and Sign In stays sign-in', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/login\/?$/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await page.goto('/')
    await page.getByRole('link', { name: /Take Back Control/ }).click()
    await expect(page).toHaveURL(/\/login\?mode=signup/)
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

    await page.goto('/')
    await page.getByRole('link', { name: /Guard Your Hours/ }).click()
    await expect(page).toHaveURL(/\/login\?mode=signup/)
  })

  test('protected routes send anonymous visitors to login', async ({ page }) => {
    for (const path of ['/dashboard', '/dashboard/rules', '/dashboard/stats', '/dashboard/settings', '/dashboard/admin', '/onboarding']) {
      await page.goto(path)
      await page.waitForURL(/\/login/, { timeout: 20_000 })
      await expect(page.getByRole('heading', { name: /Welcome back|Create your account/ })).toBeVisible()
    }
  })
})
