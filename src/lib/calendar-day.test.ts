import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calendarCellKind, calendarHoverLabel, commitmentCellCount, commitmentPanelLine, dayCommitments, dayPanelSummary, normalizeCalendarDays } from './calendar-day.ts'

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
  it('hides the shift card on a leave day', () => {
    assert.equal(dayPanelSummary({ work_type: 'work_day', is_leave: true }).showShiftCard, false)
  })

  it('keeps the shift card on a working day', () => {
    assert.equal(dayPanelSummary({ work_type: 'work_day', is_leave: false }).showShiftCard, true)
  })
})

describe('leave cell label and commitment times', () => {
  it('names a leave cell On Leave even when the stored shift is a day shift', () => {
    assert.equal(calendarHoverLabel({ work_type: 'work_day', is_leave: true }), 'On Leave')
    assert.equal(calendarHoverLabel({ work_type: 'work_day', is_leave: false }), 'Day Shift')
  })

  it('includes the clock time in the day panel line', () => {
    assert.equal(
      commitmentPanelLine({ name: 'Haircut', type: 'personal', time_start: '16:00:00', time_end: '17:00:00' }),
      'Haircut, Personal, 16:00–17:00',
    )
    const [day] = normalizeCalendarDays([{
      date: '2026-11-05',
      commitments: [{ name: 'Haircut', type: 'personal', time_start: '16:00', time_end: '17:00' }],
    }])
    assert.equal(commitmentPanelLine(dayCommitments(day)[0]), 'Haircut, Personal, 16:00–17:00')
  })
})

describe('block index on a calendar day', () => {
  it('keeps the position inside the block from state_json', () => {
    const [day] = normalizeCalendarDays([{
      date: '2026-10-25',
      cycle_day: 6,
      work_type: 'work_night',
      state_json: { block_day: 1, shift_badge: 'N1' },
    }])
    assert.equal(day.cycle_day, 6)
    assert.equal(day.block_day, 1)
  })
})
