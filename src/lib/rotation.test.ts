import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildMonthPreview, parseRotation, ROTATION_PRESETS } from './rotation.ts'

describe('parseRotation', () => {
  it('reads FIFO presets and typed phrases', () => {
    assert.deepEqual(parseRotation('14/14')?.pattern, [
      { label: 'work_day', duration: 14 },
      { label: 'off', duration: 14 },
    ])
    assert.equal(parseRotation('21 on, 7 off')?.totalDays, 28)
    assert.equal(parseRotation('28/28')?.description, '28 days on, 28 days off')
    assert.deepEqual(parseRotation('2-2-3')?.pattern, [
      { label: 'work_day', duration: 2 },
      { label: 'work_night', duration: 2 },
      { label: 'off', duration: 3 },
    ])
    assert.equal(parseRotation('4 on/4 off')?.totalDays, 8)
    assert.equal(parseRotation('5 days, 5 nights, 5 off')?.totalDays, 15)
    assert.equal(parseRotation('not a rotation'), null)
  })

  it('offers the launch presets', () => {
    const names = ROTATION_PRESETS.map((preset) => preset.name)
    for (const name of ['14/14', '21/7', '28/28', '2-2-3', '4 on / 4 off']) {
      assert.ok(names.includes(name), name)
    }
  })
})

describe('buildMonthPreview', () => {
  const pattern = [
    { label: 'work_day' as const, duration: 14 },
    { label: 'off' as const, duration: 14 },
  ]

  it('anchors 14 on/14 off to the calendar day, not a UTC-shifted date', () => {
    const preview = buildMonthPreview(pattern, '2026-10-21', 1)
    assert.ok(preview)
    const byDay = new Map(preview.cells.filter((cell) => cell.day).map((cell) => [cell.day, cell.workType]))
    assert.equal(preview.label, 'October 2026')
    assert.equal(byDay.get(1), 'work_day')
    assert.equal(byDay.get(6), 'work_day')
    assert.equal(byDay.get(7), 'off')
    assert.equal(byDay.get(20), 'off')
    assert.equal(byDay.get(21), 'work_day')
    assert.equal(byDay.get(31), 'work_day')
    assert.equal(preview.cells[0].day, null)
    assert.equal(preview.cells[3].day, 1)
  })

  it('moves the pattern when the anchor day changes', () => {
    const preview = buildMonthPreview(pattern, '2026-10-21', 2)
    const byDay = new Map(preview!.cells.filter((cell) => cell.day).map((cell) => [cell.day, cell.workType]))
    assert.equal(byDay.get(21), 'work_day')
    assert.equal(byDay.get(20), 'work_day')
    assert.equal(byDay.get(6), 'off')
  })
})
