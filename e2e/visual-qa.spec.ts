import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'

const EMAIL = 'jasonquist.ia+e2e3@gmail.com'

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1280', width: 1280, height: 900 },
] as const

function sessionCookie() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    sub: 'user-1',
    email: EMAIL,
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  })).toString('base64url')
  const session = {
    access_token: `${header}.${payload}.sig`,
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'user-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: EMAIL,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
    },
  }
  return {
    name: 'sb-127-auth-token',
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
    url: 'http://127.0.0.1:3000',
  }
}

async function shot(page: Page, testInfo: TestInfo, name: string) {
  const file = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  await testInfo.attach(name, { path: file, contentType: 'image/png' })
}

async function openNav(page: Page, width: number) {
  if (width >= 1024) return
  const menu = page.getByRole('button', { name: 'Open menu' })
  if (await menu.isVisible()) await menu.click()
}

async function openApp(browser: Browser, timezoneId: string, viewport: { width: number; height: number }) {
  const logs: string[] = []
  const context = await browser.newContext({
    timezoneId,
    viewport,
    hasTouch: viewport.width < 800,
    baseURL: 'http://127.0.0.1:3000',
  })
  await context.addCookies([sessionCookie()])
  const page = await context.newPage()
  page.on('console', (message) => {
    logs.push(`${message.type()}: ${message.text()}`)
  })
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'October 2026' })).toBeVisible({ timeout: 20_000 })
  return { context, page, logs }
}

test.describe('local visual qa', () => {
  for (const timezoneId of ['America/New_York', 'Africa/Accra'] as const) {
    test(timezoneId, async ({ browser }, testInfo) => {
      const zone = timezoneId === 'America/New_York' ? 'ny' : 'accra'
      for (const viewport of VIEWPORTS) {
        const { context, page, logs } = await openApp(browser, timezoneId, viewport)
        const tag = `${zone}-${viewport.name}`
        try {
          await expect(page.locator('[data-date]')).toHaveCount(42)
          const leaked = logs.filter((line) => /Auth state changed|@gmail\.com|access_token|refresh_token/i.test(line))
          expect(leaked, leaked.join('\n')).toEqual([])

          const headerBg = await page.locator('header').first().evaluate((element) => getComputedStyle(element).backgroundColor)
          expect(headerBg).toBe('rgb(10, 10, 11)')

          const chatHeight = await page.getByText('Watchman Agent').evaluate((element) => {
            const panel = element.closest('div.flex.flex-col')
            return panel ? panel.getBoundingClientRect().height : 0
          })
          if (viewport.width >= 1024) expect(chatHeight).toBeGreaterThanOrEqual(320)

          await page.locator('[data-date="2026-10-22"]').click()
          const notLogged = page.locator('text=Not logged >> visible=true').first()
          await expect(notLogged).toBeVisible()
          const hours = page.locator('text=Hours Worked >> visible=true')
          const hoursBox = await hours.boundingBox()
          expect(hoursBox).not.toBeNull()
          expect(hoursBox!.y + hoursBox!.height).toBeGreaterThan(0)
          expect(hoursBox!.y).toBeLessThan(viewport.height)
          await shot(page, testInfo, viewport.width < 800 ? `${tag}-day-sheet` : `${tag}-day-panel-hours`)
          await page.getByRole('button', { name: 'Close', exact: true }).click()
          await expect(page.getByText('Hours Worked')).toHaveCount(0)

          if (viewport.width < 800) {
            await page.locator('[data-date="2026-10-25"]').hover()
            await expect(page.getByText('Day Shift', { exact: true })).toHaveCount(0)
            await shot(page, testInfo, `${tag}-no-edge-tooltip`)
          } else {
            await page.locator('[data-date="2026-10-25"]').hover()
            const tip = page.getByText('Day Shift', { exact: true })
            await expect(tip).toBeVisible()
            const tipBox = await tip.boundingBox()
            expect(tipBox).not.toBeNull()
            expect(tipBox!.x).toBeGreaterThanOrEqual(-1)
            expect(tipBox!.x + tipBox!.width).toBeLessThanOrEqual(viewport.width + 1)
            await shot(page, testInfo, `${tag}-tooltip-in-view`)
          }

          const before = await page.locator('[data-date]').first().evaluate((element) => element.parentElement?.getBoundingClientRect().height ?? 0)
          await page.getByRole('button', { name: 'Next month' }).click()
          await expect(page.getByRole('heading', { name: 'November 2026' })).toBeVisible()
          await expect(page.locator('[data-date]')).toHaveCount(42)
          const after = await page.locator('[data-date]').first().evaluate((element) => element.parentElement?.getBoundingClientRect().height ?? 0)
          expect(Math.abs(before - after)).toBeLessThanOrEqual(2)
          await page.getByRole('button', { name: 'Previous month' }).click()
          await expect(page.getByRole('heading', { name: 'October 2026' })).toBeVisible()

          await page.getByRole('button', { name: 'Year', exact: true }).click()
          await expect(page.getByTestId('locked-day-panel')).toHaveCount(0)
          await expect(page.getByText('Hours Worked')).toHaveCount(0)
          await expect(page.getByRole('button', { name: /^January/ })).toBeVisible()
          const heights = await page.locator('h3', { hasText: /^(January|February|March|April|May|June|July|August|September|October|November|December)$/ }).evaluateAll((nodes) => {
            return nodes.map((node) => node.parentElement?.getBoundingClientRect().height ?? 0)
          })
          expect(heights.length).toBe(12)
          expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2)
          await expect(page.locator('[data-today="true"]')).toHaveCount(1)
          await expect(page.getByText('M', { exact: true }).first()).toBeVisible()
          await shot(page, testInfo, `${tag}-year-2026`)

          await page.getByRole('button', { name: 'Month', exact: true }).click()
          for (const label of ['November 2026', 'December 2026', 'January 2027']) {
            await page.getByRole('button', { name: 'Next month' }).click()
            await expect(page.getByRole('heading', { name: label })).toBeVisible()
          }
          await expect(page.locator('[data-date]')).toHaveCount(42)
          const period = page.getByTestId('stats-period')
          await expect(period).toContainText('Showing Jan 1, 2027 – Jan 22, 2027')
          await period.scrollIntoViewIfNeeded()
          await shot(page, testInfo, `${tag}-window-label`)

          await page.locator('[data-date="2027-01-23"]').click()
          const lockedPanel = page.locator('[data-testid="locked-day-panel"]:visible')
          await expect(lockedPanel).toBeVisible()
          await expect(lockedPanel.getByText('See further ahead with Pro')).toBeVisible()
          const lockBox = await lockedPanel.boundingBox()
          expect(lockBox).not.toBeNull()
          expect(lockBox!.y).toBeLessThan(viewport.height)
          if (viewport.width >= 1024) await shot(page, testInfo, `${tag}-locked-day`)
          else await shot(page, testInfo, `${tag}-locked-day-sheet`)
          await page.getByRole('button', { name: 'Close', exact: true }).click()
          await expect(page.locator('[data-testid="locked-day-panel"]:visible')).toHaveCount(0)

          await page.getByRole('button', { name: 'Year', exact: true }).click()
          await expect(page.locator('[data-testid="locked-day-panel"]:visible')).toHaveCount(0)
          await expect(page.getByTestId('year-lock-banner')).toHaveCount(1)
          await expect(page.locator('[data-locked-month]')).toHaveCount(11)
          await expect(page.getByTestId('year-lock-banner')).toContainText('February–December 2027')
          const upgradeInBanner = page.getByTestId('year-lock-banner').getByRole('link', { name: 'Upgrade' })
          await expect(upgradeInBanner).toHaveCount(1)
          await shot(page, testInfo, `${tag}-year-2027-banner`)

          await openNav(page, viewport.width)
          await page.getByRole('link', { name: 'Statistics' }).click()
          await expect(page.getByTestId('stats-year')).toHaveText('2026')
          const yearBox = await page.getByTestId('stats-year').boundingBox()
          expect(yearBox).not.toBeNull()
          expect(yearBox!.x).toBeGreaterThanOrEqual(0)
          expect(yearBox!.x + yearBox!.width).toBeLessThanOrEqual(viewport.width)
          const chart = page.locator('.recharts-wrapper').first()
          await chart.scrollIntoViewIfNeeded()
          const tickLocator = page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value')
          await expect(tickLocator.first()).toBeVisible()
          const ticks = await tickLocator.allTextContents()
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          expect(ticks.length, ticks.join(',')).toBeGreaterThan(0)
          expect(ticks.every((tick) => months.includes(tick)), ticks.join(',')).toBe(true)
          expect(ticks[0], ticks.join(',')).not.toBe('Dec')
          expect(ticks, ticks.join(',')).toContain('Feb')
          expect(ticks, ticks.join(',')).toContain('Dec')
          if (viewport.width >= 1024) expect(ticks[0], ticks.join(',')).toBe('Jan')
          await shot(page, testInfo, `${tag}-stats-chart`)
          await page.getByTestId('stats-year').scrollIntoViewIfNeeded()
          await shot(page, testInfo, `${tag}-stats-header`)

          await page.getByRole('button', { name: 'CSV' }).click()
          await expect(page.getByTestId('export-upgrade')).toBeVisible()
          await expect(page.getByText('CSV, PDF, and Export All are Pro features.')).toBeVisible()
          await shot(page, testInfo, `${tag}-export-pro`)

          await openNav(page, viewport.width)
          await page.getByRole('link', { name: 'Master Settings' }).click()
          await expect(page.getByRole('heading', { name: 'Work Rotation Cycle' })).toBeVisible()
          const title = await page.getByRole('heading', { name: 'Work Rotation Cycle' }).boundingBox()
          const cycle = await page.getByText('of cycle').boundingBox()
          expect(title).not.toBeNull()
          expect(cycle).not.toBeNull()
          expect(title!.height).toBeLessThan(56)
          expect(cycle!.x + cycle!.width).toBeLessThanOrEqual(viewport.width + 1)
          await shot(page, testInfo, `${tag}-rules`)

          await openNav(page, viewport.width)
          await page.getByRole('link', { name: /^Settings/ }).click()
          const name = page.getByLabel('Full Name')
          await expect(name).toHaveValue('')
          await expect(name).toHaveAttribute('placeholder', 'Your name')
          await shot(page, testInfo, `${tag}-empty-name`)
          await page.getByRole('button', { name: 'Preferences' }).click()
          const expectedZone = timezoneId
          await expect(page.locator('#preference-timezone')).toHaveValue(expectedZone)
          await expect(page.getByText('No timezone is saved on this account yet')).toBeVisible()
          await shot(page, testInfo, `${tag}-timezone`)

          await page.goto('/dashboard')
          await expect(page.getByRole('heading', { name: 'October 2026' })).toBeVisible()
          await page.evaluate(() => window.scrollTo(0, 400))
          await shot(page, testInfo, `${tag}-opaque-header`)
        } finally {
          await context.close()
        }
      }
    })
  }
})
