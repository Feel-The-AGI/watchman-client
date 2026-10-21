import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cycleDayBadge } from './cycle-day-badge.ts'

describe('cycleDayBadge', () => {
  it('shows D1–D14 then OFF for a 14 on / 14 off cycle', () => {
    for (let day = 1; day <= 14; day += 1) {
      assert.equal(cycleDayBadge('work_day', day), `D${day}`)
    }
    for (let day = 15; day <= 28; day += 1) {
      assert.equal(cycleDayBadge('off', day), 'OFF')
    }
  })

  it('matches the detail panel when the cycle day is 13', () => {
    assert.equal(cycleDayBadge('work_day', 13), 'D13')
    assert.notEqual(cycleDayBadge('work_day', 13), 'D3')
  })

  it('uses the real cycle day for nights instead of a 5-day remainder', () => {
    assert.equal(cycleDayBadge('work_night', 6), 'N6')
    assert.equal(cycleDayBadge('work_night', 13), 'N13')
  })
})
