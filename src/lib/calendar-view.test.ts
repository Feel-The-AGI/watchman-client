import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  gridMonthAfterViewToggle,
  headerYear,
  monthToShow,
  shiftViewedMonth,
  yearToLoad,
} from './calendar-view.ts'

describe('calendar view across years', () => {
  it('follows the viewed year instead of a fixed 2026 header', () => {
    const december2026 = new Date(2026, 11, 1)
    assert.equal(headerYear(december2026), 2026)
    const january2027 = shiftViewedMonth(december2026, 1)
    assert.equal(january2027.getFullYear(), 2027)
    assert.equal(january2027.getMonth(), 0)
    assert.equal(headerYear(january2027), 2027)
    assert.equal(yearToLoad(2026, january2027), 2027)
    assert.equal(yearToLoad(2027, january2027), null)
  })

  it('keeps the viewed month when the grid toggles', () => {
    const viewed = new Date(2026, 11, 20)
    const grid = gridMonthAfterViewToggle(viewed)
    assert.equal(grid.getFullYear(), 2026)
    assert.equal(grid.getMonth(), 11)
  })

  it('does not open October 2027 from October 2026 on a free account', () => {
    const october2026 = new Date(2026, 9, 21)
    const today = new Date(2026, 9, 21)
    const nextYear = shiftViewedMonth(october2026, 12)
    assert.equal(nextYear.getFullYear(), 2027)
    assert.equal(nextYear.getMonth(), 9)
    assert.equal(monthToShow(nextYear, today, 'free'), null)
    const opened = monthToShow(nextYear, today, 'pro')
    assert.ok(opened)
    assert.equal(opened.getFullYear(), 2027)
    assert.equal(opened.getMonth(), 9)
  })

  it('steps back across the year boundary', () => {
    const january = new Date(2027, 0, 1)
    const december = shiftViewedMonth(january, -1)
    assert.equal(december.getFullYear(), 2026)
    assert.equal(december.getMonth(), 11)
    assert.equal(headerYear(december), 2026)
  })
})
