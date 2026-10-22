import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { monthMiniCells, WEEKDAY_INITIALS } from './year-mini.ts'

describe('year mini grid', () => {
  it('pads every month to six weeks and puts the first on its weekday', () => {
    assert.equal(WEEKDAY_INITIALS.length, 7)
    const october = monthMiniCells(2026, 9)
    assert.equal(october.length, 42)
    assert.equal(october.filter((cell) => cell.date).length, 31)
    assert.equal(october.find((cell) => cell.date)?.date, '2026-10-01')
    const leading = october.findIndex((cell) => cell.date)
    assert.equal(leading, (new Date(2026, 9, 1).getDay() + 6) % 7)

    const february = monthMiniCells(2026, 1)
    assert.equal(february.length, 42)
    assert.equal(february.filter((cell) => cell.date).length, 28)
  })
})
