import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calendarCellKind, normalizeCalendarDays } from './calendar-day.ts'

describe('leave on the calendar', () => {
  it('reads is_leave from state_json and paints Dec 20–27 as leave', () => {
    const days = normalizeCalendarDays(Array.from({ length: 8 }, (_, index) => ({
      date: `2026-12-${20 + index}`,
      cycle_day: 5 + index,
      work_type: 'work_day',
      state_json: { is_leave: true, commitments: [] },
    })))
    assert.equal(days.length, 8)
    for (const day of days) {
      assert.equal(day.is_leave, true)
      assert.equal(calendarCellKind(day), 'leave')
      assert.notEqual(calendarCellKind(day), 'work_day')
    }
    assert.equal(days.filter((day) => calendarCellKind(day) === 'leave').length, 8)
  })

  it('keeps an ordinary day shift when leave is not set', () => {
    const [day] = normalizeCalendarDays([{
      date: '2026-12-19',
      cycle_day: 4,
      work_type: 'work_day',
      state_json: { is_leave: false },
    }])
    assert.equal(calendarCellKind(day), 'work_day')
  })
})
