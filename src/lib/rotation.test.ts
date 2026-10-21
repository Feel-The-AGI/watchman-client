import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMonthPreview,
  DUPONT_PATTERN,
  PANAMA_PATTERN,
  parseRotation,
  ROTATION_PARSE_MARKER,
  ROTATION_PRESETS,
  rotationFromAssistantText,
  rotationParsePrompt,
} from './rotation.ts'

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

  it('reads number words, weeks, fortnights, and then/followed-by sequences', () => {
    assert.deepEqual(parseRotation('two weeks on two weeks off')?.pattern, [
      { label: 'work_day', duration: 14 },
      { label: 'off', duration: 14 },
    ])
    assert.deepEqual(parseRotation('four on four off')?.pattern, [
      { label: 'work_day', duration: 4 },
      { label: 'off', duration: 4 },
    ])
    assert.deepEqual(parseRotation('3 weeks on 1 week off')?.pattern, [
      { label: 'work_day', duration: 21 },
      { label: 'off', duration: 7 },
    ])
    assert.deepEqual(parseRotation('fortnight on, fortnight off')?.pattern, [
      { label: 'work_day', duration: 14 },
      { label: 'off', duration: 14 },
    ])
    assert.deepEqual(parseRotation('I do 3 days then 3 nights then 6 off')?.pattern, [
      { label: 'work_day', duration: 3 },
      { label: 'work_night', duration: 3 },
      { label: 'off', duration: 6 },
    ])
    assert.deepEqual(parseRotation('I work 7 day shifts followed by 7 nights and then 14 days off')?.pattern, [
      { label: 'work_day', duration: 7 },
      { label: 'work_night', duration: 7 },
      { label: 'off', duration: 14 },
    ])
    assert.deepEqual(parseRotation('DuPont')?.pattern, DUPONT_PATTERN)
    assert.deepEqual(parseRotation('Panama schedule')?.pattern, PANAMA_PATTERN)
  })

  it('builds the server parse prompt and reads its JSON reply', () => {
    const prompt = rotationParsePrompt('two weeks on two weeks off')
    assert.match(prompt, new RegExp(ROTATION_PARSE_MARKER))
    const parsed = rotationFromAssistantText(`Sure.\n${JSON.stringify({
      understood: true,
      pattern: [
        { label: 'work_day', duration: 14 },
        { label: 'off', duration: 14 },
      ],
      description: '14 days on, 14 days off',
      message: 'Got it',
    })}`)
    assert.equal(parsed?.understood, true)
    if (parsed?.understood) {
      assert.equal(parsed.totalDays, 28)
      assert.equal(parsed.description, '14 days on, 14 days off')
    }
    const unclear = rotationFromAssistantText('{"understood": false, "message": "Which days are nights?"}')
    assert.deepEqual(unclear, { understood: false, message: 'Which days are nights?' })
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
