import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadDashboardSnapshot } from './dashboard-refresh.ts'

describe('loadDashboardSnapshot', () => {
  it('refetches the cycle, calendar, and stats for the open year', async () => {
    const calls: string[] = []
    const snapshot = await loadDashboardSnapshot({
      cycles: {
        list: async () => {
          calls.push('cycles')
          return [{ id: 'cycle-1', is_active: true }]
        },
      },
      calendar: {
        getYear: async (year) => {
          calls.push(`calendar:${year}`)
          return [{ date: '2026-10-21' }]
        },
      },
      stats: {
        getSummary: async (year) => {
          calls.push(`stats:${year}`)
          return { total_days: 365 }
        },
      },
    }, 2026)

    assert.deepEqual(calls, ['cycles', 'calendar:2026', 'stats:2026'])
    assert.deepEqual(snapshot.cycles, [{ id: 'cycle-1', is_active: true }])
    assert.deepEqual(snapshot.calendar, [{ date: '2026-10-21' }])
    assert.deepEqual(snapshot.stats, { total_days: 365 })
  })
})