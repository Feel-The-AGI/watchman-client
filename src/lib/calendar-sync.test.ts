import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calendarLoadFailed,
  configureCalendarRefresh,
  datesFromChange,
  invalidateCalendar,
  isCalendarRefreshPending,
  refreshCalendarYears,
  setViewedCalendarYear,
  yearsFromDates,
  yearsToRefetch,
} from './calendar-sync.ts'

describe('calendar sync', () => {
  it('reports a failed cycle list and a failed year without treating them as an empty setup', async () => {
    configureCalendarRefresh({
      cycles: { list: async () => { throw new Error('down') } },
      calendar: { getYear: async () => { throw new Error('down') } },
      stats: { getSummary: async () => ({}) },
    })
    setViewedCalendarYear(2026)
    const failed = await refreshCalendarYears([2026])
    assert.deepEqual(failed, { cyclesFailed: true, failedYears: [2026] })
    assert.equal(calendarLoadFailed(failed, 2026), true)
    configureCalendarRefresh(null)
  })

  it('reads changed dates and every year they touch', () => {
    const dates = datesFromChange({
      proposal: {
        command: {
          payload: { start_date: '2026-12-31', end_date: '2027-01-02' },
        },
      },
    })
    assert.deepEqual(dates, ['2026-12-31', '2027-01-02'])
    assert.deepEqual(yearsFromDates(dates), [2026, 2027])
    setViewedCalendarYear(2026)
    assert.deepEqual(yearsToRefetch({ dates }, 2026), [2026, 2027])
    assert.deepEqual(yearsToRefetch(undefined, 2026), [2026])
  })

  it('refetches the on-screen year and every other year a change touches', async () => {
    const calls: string[] = []
    configureCalendarRefresh({
      cycles: { list: async () => [{ id: 'cycle-1', is_active: true }] },
      calendar: {
        getYear: async (year) => {
          calls.push(`calendar:${year}`)
          return [{ date: `${year}-01-01`, work_type: 'off' }]
        },
      },
      stats: {
        getSummary: async (year) => {
          calls.push(`stats:${year}`)
          return { off_days: year }
        },
      },
    })
    setViewedCalendarYear(2026)
    await invalidateCalendar({
      proposal: { command: { payload: { date: '2026-10-15' } } },
      result: { dates: ['2027-01-01'] },
    })
    assert.deepEqual(calls.filter((call) => call.startsWith('calendar:')).sort(), ['calendar:2026', 'calendar:2027'])
    assert.ok(calls.includes('stats:2026'))
    assert.ok(calls.includes('stats:2027'))
    configureCalendarRefresh(null)
  })

  it('waits for the refetch before undo can continue', async () => {
    let release: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    configureCalendarRefresh({
      cycles: { list: async () => [] },
      calendar: {
        getYear: async () => {
          await gate
          return []
        },
      },
      stats: { getSummary: async () => ({}) },
    })
    setViewedCalendarYear(2026)
    let settled = false
    const pending = invalidateCalendar({ dates: ['2026-10-15'] }).then(() => {
      settled = true
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(settled, false)
    release?.()
    await pending
    assert.equal(settled, true)
    configureCalendarRefresh(null)
  })

  it('keeps an older response behind the queue', async () => {
    let releaseFirst: (() => void) | undefined
    const gate = new Promise<void>((resolve) => { releaseFirst = resolve })
    const order: string[] = []
    let calls = 0
    configureCalendarRefresh({
      cycles: { list: async () => [{ id: 'cycle-1', is_active: true }] },
      calendar: {
        getYear: async () => {
          calls += 1
          const id = calls
          if (id === 1) await gate
          order.push(`done:${id}`)
          return [{ date: '2026-10-15', work_type: id === 1 ? 'work_night' : 'off' }]
        },
      },
      stats: { getSummary: async () => ({ off_days: 1 }) },
    })
    const first = refreshCalendarYears([2026])
    assert.equal(isCalendarRefreshPending(), true)
    const second = refreshCalendarYears([2026])
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.deepEqual(order, [])
    releaseFirst?.()
    const [firstResult, secondResult] = await Promise.all([first, second])
    assert.equal(firstResult.cyclesFailed, false)
    assert.deepEqual(firstResult.failedYears, [])
    assert.equal(secondResult.cyclesFailed, false)
    assert.deepEqual(order, ['done:1', 'done:2'])
    assert.equal(isCalendarRefreshPending(), false)
    configureCalendarRefresh(null)
  })
})
