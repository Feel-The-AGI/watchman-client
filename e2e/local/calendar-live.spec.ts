import fs from 'fs'
import path from 'path'
import { expect, test, type Page, type Route } from '@playwright/test'

const ARTIFACTS = '/opt/cursor/artifacts/calendar-live'

interface DayRow {
  date: string
  work_type: 'work_day' | 'work_night' | 'off'
  cycle_day: number
  actual_hours_worked: number
  overtime_hours: number
}

function installCalendar(page: Page) {
  const days = new Map<string, DayRow>([
    ['2026-10-14', { date: '2026-10-14', work_type: 'work_day', cycle_day: 5, actual_hours_worked: 12, overtime_hours: 0 }],
    ['2026-10-15', { date: '2026-10-15', work_type: 'work_night', cycle_day: 6, actual_hours_worked: 0, overtime_hours: 0 }],
    ['2026-10-16', { date: '2026-10-16', work_type: 'off', cycle_day: 7, actual_hours_worked: 0, overtime_hours: 0 }],
  ])
  const stats = { work_days: 10, work_nights: 12, off_days: 8, leave_days: 1, study_hours: 4, commitment_count: 2, total_days: 365 }
  const yearsFetched: number[] = []
  let review: 'apply' | 'no_change' | 'expired' = 'apply'
  let proposalSeq = 1

  const freshProposal = () => ({
    id: `p-${proposalSeq}`,
    created_at: '2026-10-22T09:00:00.000Z',
    message_id: 'u1',
    command: {
      action: 'override_days',
      payload: { date: '2026-10-15', work_type: 'off' },
    },
  })
  let pending = [
    {
      id: 'ancient',
      created_at: '2025-12-01T00:00:00.000Z',
      message_id: 'ancient-user',
      command: {
        action: 'override_days',
        explanation: 'Ancient shift change from last December',
        payload: { date: '2025-12-01', work_type: 'off' },
      },
    },
    freshProposal(),
  ]

  const json = (route: Route, body: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

  const yearPayload = (year: number) => {
    yearsFetched.push(year)
    if (year !== 2026) return [{ date: `${year}-01-01`, work_type: 'off', cycle_day: 1 }]
    return [...days.values()]
  }

  return {
    yearsFetched,
    stats,
    days,
    setReview(next: 'apply' | 'no_change' | 'expired') {
      review = next
    },
    queueProposal() {
      proposalSeq += 1
      pending = [freshProposal()]
      return pending[0]
    },
    async route() {
      await page.route('**/api/**', async (route) => {
        const url = new URL(route.request().url())
        const pathname = url.pathname
        const method = route.request().method()

        if (pathname === '/api/cycles' && method === 'GET') {
          return json(route, [{ id: 'c1', is_active: true, anchor_date: '2026-01-01', pattern: [{ label: 'work_night', duration: 5 }] }])
        }
        if (pathname === '/api/cycles/active') {
          return json(route, { id: 'c1', is_active: true, anchor_date: '2026-10-01' })
        }
        if (pathname.startsWith('/api/cycles/') && method !== 'GET') {
          days.get('2026-10-15')!.work_type = 'off'
          stats.study_hours = 42
          return json(route, { id: 'c1', success: true })
        }
        if (pathname.startsWith('/api/calendar/year/')) {
          const year = Number(pathname.split('/').pop())
          return json(route, yearPayload(year))
        }
        if (pathname === '/api/stats/summary') {
          return json(route, stats)
        }
        if (pathname.startsWith('/api/stats/')) {
          return json(route, { ...stats, year: 2026, total_work_days: stats.work_days, total_work_nights: stats.work_nights, total_off_days: stats.off_days })
        }
        if (pathname === '/api/chat/history') {
          return json(route, {
            messages: [
              { id: 'u1', role: 'user', content: "Remove Oct 15th, I didn't go to work that day", created_at: '2026-10-22T09:00:00.000Z' },
              { id: 'a-tool', role: 'assistant', content: 'Executing override_days', created_at: '2026-10-22T08:00:00.000Z' },
            ],
            history_limit: 50,
          })
        }
        if (pathname === '/api/commands/proposals/pending') {
          return json(route, { proposals: pending })
        }
        if (pathname.includes('/review') && method === 'POST') {
          const body = route.request().postDataJSON() as { decision?: string }
          if (body.decision === 'reject') {
            pending = []
            return json(route, { success: true })
          }
          if (review === 'expired') {
            pending = []
            return json(route, { detail: 'expired' }, 410)
          }
          if (review === 'no_change') {
            pending = []
            return json(route, { success: true, status: 'no_change', updated_days: 0, message: 'That day was already off.', dates: ['2026-10-15'] })
          }
          const day = days.get('2026-10-15')!
          day.work_type = 'off'
          stats.work_nights = 11
          stats.off_days = 9
          pending = []
          return json(route, { success: true, updated_days: 1, dates: ['2026-10-15', '2027-01-01'] })
        }
        if (pathname === '/api/commands/undo' && method === 'POST') {
          const day = days.get('2026-10-15')!
          day.work_type = 'work_night'
          stats.work_nights = 12
          stats.off_days = 8
          return json(route, { success: true, dates: ['2026-10-15'] })
        }
        if (pathname === '/api/commands/redo' && method === 'POST') {
          const day = days.get('2026-10-15')!
          day.work_type = 'off'
          stats.work_nights = 11
          stats.off_days = 9
          return json(route, { success: true, dates: ['2026-10-15'] })
        }
        if (pathname === '/api/chat/message' && method === 'POST') {
          proposalSeq += 1
          const proposal = freshProposal()
          proposal.id = `p-${proposalSeq}`
          pending = [proposal]
          return json(route, {
            user_message: { id: `u-${proposalSeq}`, role: 'user', content: 'Set Oct 15 off again', created_at: '2026-10-22T10:00:00.000Z' },
            assistant_message: { id: `a-${proposalSeq}`, role: 'assistant', content: 'Executing override_days', created_at: '2026-10-22T10:00:01.000Z' },
            proposal,
            is_command: true,
          })
        }
        if (pathname.startsWith('/api/daily-logs/') && pathname.endsWith('/hours') && method === 'PUT') {
          const day = days.get('2026-10-15')!
          day.actual_hours_worked = 7
          return json(route, { actual_hours: 7, overtime_hours: 0 })
        }
        if (pathname.startsWith('/api/daily-logs/')) {
          const day = days.get('2026-10-15')
          return json(route, { logs: [], actual_hours: day?.actual_hours_worked ?? 0, overtime_hours: 0 })
        }
        if (pathname.startsWith('/api/incidents')) return json(route, [])
        if (pathname === '/api/master-settings' && method === 'GET') {
          return json(route, {
            version: 1,
            settings: {
              cycle: {
                pattern: [
                  { label: 'work_day', duration: 4 },
                  { label: 'work_night', duration: 4 },
                  { label: 'off', duration: 4 },
                ],
                anchor_date: '2026-10-01',
                anchor_cycle_day: 1,
              },
              work: {
                day_hours: { start: '07:00', end: '19:00' },
                night_hours: { start: '19:00', end: '07:00' },
                available_hours_on_off: 8,
                available_hours_on_work: 2,
              },
              constraints: [],
              commitments: [],
              leave_blocks: [],
            },
          })
        }
        if (pathname.startsWith('/api/master-settings') && method !== 'GET') {
          stats.study_hours = 42
          return json(route, { success: true, version: 2 })
        }
        if (pathname === '/api/settings' && method === 'GET') {
          return json(route, { settings: { timezone: 'UTC', notifications_email: false, notifications_push: false, theme: 'dark', weighted_mode_enabled: false } })
        }
        if (pathname === '/api/settings' && method !== 'GET') {
          stats.study_hours = 7
          return json(route, { success: true })
        }
        if (pathname === '/api/settings/subscription' || pathname === '/api/payments/subscription-status') {
          return json(route, { tier: 'pro', status: 'active' })
        }
        return json(route, { success: true, data: {} })
      })
    },
  }
}

async function goTo(page: Page, name: string) {
  const link = page.getByRole('link', { name: new RegExp(`^${name}\\b`) }).first()
  const menu = page.getByRole('button', { name: 'Open menu' })
  if (await menu.isVisible()) await menu.click()
  await link.click()
}

test('calendar updates as soon as a change is applied', async ({ page }, testInfo) => {
  const mock = installCalendar(page)
  await mock.route()
  await page.addInitScript(() => {
    localStorage.setItem('watchman_pro_celebration_e2e-user', 'true')
  })
  await page.goto('/dashboard?e2e=1')

  const cell = page.locator('[data-date="2026-10-15"]').first()
  await expect(cell).toHaveAttribute('data-work-type', 'work_night')
  await expect(page.getByText('Ancient shift change from last December')).toHaveCount(0)
  await expect(page.getByText('Review this proposed change for October 15, 2026.')).toBeVisible()
  await expect(page.getByText('Updating your calendar.')).toHaveCount(0)

  await cell.click()
  const shiftLabel = page.locator('p.text-lg')
  await expect(shiftLabel).toHaveText('Night Shift')
  await expect(page.getByText('Day 6 of rotation')).toBeVisible()
  await expect(page.getByText('October 15, 2026', { exact: true })).toBeVisible()
  await page.getByLabel('Edit hours').click()
  await page.locator('input[type="number"]').first().fill('8')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Actual: 7h')).toBeVisible()
  const before = await cell.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const parent = element.parentElement!.getBoundingClientRect()
    return { x: rect.x - parent.x, y: rect.y - parent.y, selected: element.getAttribute('data-selected') }
  })
  expect(before.selected).toBe('true')

  const otherYear = page.waitForRequest((request) => request.url().includes('/api/calendar/year/2027'))
  await page.getByRole('button', { name: 'Apply' }).click()
  await otherYear
  await expect(cell).toHaveAttribute('data-work-type', 'off')
  await expect(cell).toHaveAttribute('data-selected', 'true')
  await expect(shiftLabel).toHaveText('Off Day')
  await expect(page.getByText('October 15, 2026', { exact: true })).toBeVisible()
  await expect(page.getByText('Done! Changes applied successfully.')).toBeVisible()
  await expect(page.getByText('Updating your calendar.')).toHaveCount(0)
  const after = await cell.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const parent = element.parentElement!.getBoundingClientRect()
    return { x: rect.x - parent.x, y: rect.y - parent.y }
  })
  expect(Math.abs(after.x - before.x)).toBeLessThan(2)
  expect(Math.abs(after.y - before.y)).toBeLessThan(2)

  fs.mkdirSync(ARTIFACTS, { recursive: true })
  const approved = path.join(ARTIFACTS, `${testInfo.project.name}-approved.png`)
  await page.screenshot({ path: approved, fullPage: true })

  await page.getByTitle('Undo last change').click()
  await expect(cell).toHaveAttribute('data-work-type', 'work_night')
  await expect(shiftLabel).toHaveText('Night Shift')
  await expect(cell).toHaveAttribute('data-selected', 'true')
  await expect(page.getByText('Undone! The last change has been reverted.')).toBeVisible()

  await page.getByTitle('Redo last undone change').click()
  await expect(cell).toHaveAttribute('data-work-type', 'off')
  await expect(shiftLabel).toHaveText('Off Day')
  await expect(page.getByText('Redone! The change has been reapplied.')).toBeVisible()

  await page.getByRole('button', { name: 'Year' }).click()
  await expect(page.locator('[data-date="2026-10-15"][data-kind="off"]')).toBeVisible()
  await page.getByRole('button', { name: 'Month' }).click()
  await expect(cell).toHaveAttribute('data-work-type', 'off')

  mock.days.get('2026-10-15')!.work_type = 'work_day'
  mock.stats.work_days = 15
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(cell).toHaveAttribute('data-work-type', 'work_day')
  await expect(shiftLabel).toHaveText('Day Shift')

  mock.setReview('apply')
  await page.getByPlaceholder('Tell me about your schedule...').fill('Decline this one')
  await page.getByRole('button', { name: 'Send' }).click()
  await page.getByRole('button', { name: 'Decline' }).click()
  await expect(page.getByText('The proposed change was declined.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apply' })).toHaveCount(0)

  mock.setReview('no_change')
  await page.getByPlaceholder('Tell me about your schedule...').fill('Set Oct 15 off again')
  await page.getByRole('button', { name: 'Send' }).click()
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('That day was already off.')).toBeVisible()
  await expect(page.getByText('Done! Changes applied successfully.')).toHaveCount(1)

  mock.setReview('expired')
  await page.getByPlaceholder('Tell me about your schedule...').fill('Try the old suggestion')
  await page.getByRole('button', { name: 'Send' }).click()
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('This suggestion expired. Ask again.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apply' })).toHaveCount(0)

  await goTo(page, 'Master Settings')
  await expect(page.getByText('Work Rotation Cycle')).toBeVisible()
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Rotation saved')).toBeVisible()

  await goTo(page, 'Calendar')
  await expect(page.getByText('42h')).toBeVisible()

  await goTo(page, 'Settings')
  await page.getByRole('button', { name: 'Notifications' }).click()
  await page.getByRole('button', { name: 'Save Preferences' }).click()
  await expect(page.getByText('Settings saved successfully')).toBeVisible()
  await goTo(page, 'Calendar')
  await expect(page.getByText('7h')).toBeVisible()

  const finished = path.join(ARTIFACTS, `${testInfo.project.name}-after-settings.png`)
  await page.screenshot({ path: finished, fullPage: true })
})
