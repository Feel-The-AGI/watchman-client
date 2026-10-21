import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calendarCellKind, commitmentCellCount, dayCommitments, dayPanelSummary, normalizeCalendarDays } from './calendar-day.ts'

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

describe('commitments on the calendar', () => {
  const dentist = {
    date: '2026-10-27',
    cycle_day: 7,
    work_type: 'work_day',
    state_json: {
      used_hours: 1,
      commitments: [{
        name: 'Dentist appointment',
        type: 'personal',
        hours: 1,
        time_start: '10:00',
        time_end: '11:00',
        commitment_id: 'cmt-dentist',
      }],
    },
  }

  it('renders a state_json commitment in the cell and the panel', () => {
    const [day] = normalizeCalendarDays([dentist])
    assert.equal(commitmentCellCount(day), 1)
    assert.equal(commitmentCellCount(dentist), 1)
    const panel = dayCommitments(day)
    assert.equal(panel.length, 1)
    assert.equal(panel[0].name, 'Dentist appointment')
    assert.equal(panel[0].type, 'personal')
    assert.equal(panel[0].hours, 1)
    assert.equal(panel[0].id, 'cmt-dentist')
    assert.deepEqual(dayCommitments(dentist).map((item) => item.name), ['Dentist appointment'])
  })

  it('keeps state_json commitments when the top-level list is empty', () => {
    const day = { ...dentist, commitments: [] }
    assert.equal(commitmentCellCount(day), 1)
    assert.equal(dayCommitments(day)[0].name, 'Dentist appointment')
  })
})

describe('leave day panel', () => {
  it('shows only the leave card and zero expected hours', () => {
    const panel = dayPanelSummary({ work_type: 'work_day', cycle_day: 10, is_leave: true })
    assert.equal(panel.showShiftCard, false)
    assert.equal(panel.showLeaveCard, true)
    assert.equal(panel.expectedHours, 0)
  })

  it('keeps the shift card on a working day', () => {
    const panel = dayPanelSummary({ work_type: 'work_day', cycle_day: 10, is_leave: false })
    assert.equal(panel.showShiftCard, true)
    assert.equal(panel.showLeaveCard, false)
    assert.equal(panel.expectedHours, 12)
  })
})
