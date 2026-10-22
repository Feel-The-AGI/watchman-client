import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calendarDayDiff, parseLocalDate } from './rotation.ts'
import { activeCyclePattern, blockDayFor, cycleDayBadge } from './cycle-day-badge.ts'

const fiveFiveFive = [
  { label: 'work_day', duration: 5 },
  { label: 'work_night', duration: 5 },
  { label: 'off', duration: 5 },
]

const fourOnFourOff = [
  { label: 'work_day', duration: 4 },
  { label: 'off', duration: 4 },
]

function cycleDayOn(date: string, anchor: string, anchorCycleDay: number, total: number): number {
  const diff = calendarDayDiff(parseLocalDate(date)!, parseLocalDate(anchor)!)
  return ((anchorCycleDay - 1 + diff) % total + total) % total + 1
}

describe('cycleDayBadge', () => {
  it('numbers a 5-5-5 from the start of each block, including the October nights', () => {
    for (let day = 1; day <= 5; day += 1) {
      assert.equal(cycleDayBadge('work_day', day, { pattern: fiveFiveFive }), `D${day}`)
    }
    for (let day = 6; day <= 10; day += 1) {
      assert.equal(cycleDayBadge('work_night', day, { pattern: fiveFiveFive }), `N${day - 5}`)
      assert.equal(blockDayFor(day, fiveFiveFive), day - 5)
    }
    for (let day = 11; day <= 15; day += 1) {
      assert.equal(cycleDayBadge('off', day, { pattern: fiveFiveFive }), `O${day - 10}`)
      assert.equal(blockDayFor(day, fiveFiveFive), day - 10)
    }

    const anchor = '2026-10-20'
    for (const [date, expected] of [
      ['2026-10-25', 'N1'],
      ['2026-10-29', 'N5'],
      ['2026-10-10', 'N1'],
      ['2026-10-14', 'N5'],
    ] as const) {
      const cycleDay = cycleDayOn(date, anchor, 1, 15)
      assert.equal(cycleDayBadge('work_night', cycleDay, { pattern: fiveFiveFive }), expected)
    }
  })

  it('numbers 4 on / 4 off inside each block and keeps a 14-day block intact', () => {
    for (let day = 1; day <= 4; day += 1) {
      assert.equal(cycleDayBadge('work_day', day, { pattern: fourOnFourOff }), `D${day}`)
    }
    for (let day = 5; day <= 8; day += 1) {
      assert.equal(cycleDayBadge('off', day, { pattern: fourOnFourOff }), `O${day - 4}`)
      assert.equal(blockDayFor(day, fourOnFourOff), day - 4)
    }
    assert.equal(cycleDayBadge('work_day', 9, { pattern: fourOnFourOff }), 'D1')

    const fourteen = [
      { label: 'work_day', duration: 14 },
      { label: 'off', duration: 14 },
    ]
    for (let day = 1; day <= 14; day += 1) {
      assert.equal(cycleDayBadge('work_day', day, { pattern: fourteen }), `D${day}`)
    }
    assert.equal(cycleDayBadge('work_day', 13, { pattern: fourteen }), 'D13')
    assert.equal(cycleDayBadge('off', 15, { pattern: fourteen }), 'O1')
    assert.notEqual(cycleDayBadge('off', 15, { pattern: fourteen }), 'O15')
  })

  it('uses the block index from the calendar day instead of the cycle day', () => {
    assert.equal(cycleDayBadge('work_night', 6, { blockDay: 1 }), 'N1')
    assert.equal(cycleDayBadge('off', 11, { blockDay: 1 }), 'O1')
    assert.notEqual(cycleDayBadge('work_night', 6, { pattern: fiveFiveFive }), 'N6')
  })
})

describe('active cycle pattern', () => {
  it('reads the active rotation', () => {
    assert.deepEqual(
      activeCyclePattern([
        { is_active: false, pattern: fourOnFourOff },
        { is_active: true, pattern: fiveFiveFive },
      ]),
      fiveFiveFive,
    )
  })
})
