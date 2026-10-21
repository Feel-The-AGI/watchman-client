import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isFreeMonthLocked, isYearMonthVisible } from './free-calendar-access.ts'

describe('free calendar access', () => {
  const today = new Date(2026, 9, 21)

  it('keeps every month of 2026 open when today is 21 October', () => {
    for (let month = 0; month < 12; month += 1) {
      assert.equal(isYearMonthVisible(month, 2026, today, 'free'), true, `month ${month}`)
      assert.equal(isFreeMonthLocked(new Date(2026, month, 1), today, 'free'), false)
    }
  })

  it('locks August when today is in February', () => {
    const february = new Date(2026, 1, 21)
    assert.equal(isFreeMonthLocked(new Date(2026, 7, 1), february, 'free'), true)
    assert.equal(isYearMonthVisible(7, 2026, february, 'free'), false)
  })

  it('does not blur the months that hold a 14/14 rotation anchored in October', () => {
    for (const month of [6, 7, 8, 9, 10, 11]) {
      assert.equal(isYearMonthVisible(month, 2026, today, 'free'), true)
    }
  })

  it('still limits a free account far into the next year', () => {
    assert.equal(isFreeMonthLocked(new Date(2027, 5, 1), today, 'free'), true)
    assert.equal(isFreeMonthLocked(new Date(2027, 5, 1), today, 'pro'), false)
  })
})
