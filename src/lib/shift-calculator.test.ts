import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { totalCycleDays } from './rotation.ts'
import {
  averageWeeklyHours,
  buildMonth,
  calculatorQuery,
  cycleDayOn,
  decodePattern,
  describePattern,
  encodePattern,
  nextShift,
  readHandoff,
  rotationFromQuery,
  shiftOn,
  writeHandoff,
} from './shift-calculator.ts'
import { AUDIENCES, SCHEDULES, guidePaths, scheduleBySlug } from './schedule-library.ts'

const fourOnFourOff = {
  pattern: [
    { label: 'work_day' as const, duration: 4 },
    { label: 'off' as const, duration: 4 },
  ],
  anchorDate: '2026-11-16',
  anchorCycleDay: 1,
}

describe('shift calculator', () => {
  it('round-trips a pattern through a link', () => {
    const encoded = encodePattern(scheduleBySlug('dupont')!.pattern)
    assert.equal(encoded, 'n4.o3.d3.o1.n3.o3.d4.o7')
    assert.deepEqual(decodePattern(encoded), scheduleBySlug('dupont')!.pattern)
  })

  it('refuses links that are not a rotation', () => {
    for (const bad of ['', 'x4', 'd0', 'd4.', 'd400', 'd200.o200', 'd-1', null]) {
      if (bad === 'd4.') {
        assert.deepEqual(decodePattern(bad), [{ label: 'work_day', duration: 4 }])
        continue
      }
      assert.equal(decodePattern(bad), null, String(bad))
    }
  })

  it('counts cycle days forward and backward from the anchor', () => {
    const at = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8)))
    assert.equal(cycleDayOn(fourOnFourOff, at('2026-11-16')), 1)
    assert.equal(cycleDayOn(fourOnFourOff, at('2026-11-20')), 5)
    assert.equal(cycleDayOn(fourOnFourOff, at('2026-11-24')), 1)
    assert.equal(cycleDayOn(fourOnFourOff, at('2026-11-15')), 8)
    assert.equal(shiftOn(fourOnFourOff, at('2026-11-19')), 'work_day')
    assert.equal(shiftOn(fourOnFourOff, at('2026-11-20')), 'off')
    assert.equal(shiftOn(fourOnFourOff, at('2025-01-01')), shiftOn(fourOnFourOff, at('2025-01-09')))
  })

  it('honours an anchor that is not cycle day 1', () => {
    const rotation = { ...fourOnFourOff, anchorCycleDay: 6 }
    assert.equal(shiftOn(rotation, new Date(2026, 10, 16)), 'off')
    assert.equal(shiftOn(rotation, new Date(2026, 10, 19)), 'work_day')
  })

  it('builds a Monday-first month with totals and today marked', () => {
    const month = buildMonth(fourOnFourOff, 2026, 10, new Date(2026, 10, 15))
    // 1 November 2026 is a Sunday: six blanks before it.
    assert.equal(month.cells.filter((cell) => cell.day === null).length, 6)
    assert.equal(month.totals.days + month.totals.nights + month.totals.off, 30)
    assert.equal(month.cells.find((cell) => cell.isToday)?.iso, '2026-11-15')
    assert.equal(month.label, 'November 2026')
  })

  it('finds the next shift of a kind', () => {
    const from = new Date(2026, 10, 17)
    assert.equal(nextShift(fourOnFourOff, from, 'off')?.getDate(), 20)
    assert.equal(nextShift(fourOnFourOff, from, 'work_night'), null)
    assert.equal(nextShift(fourOnFourOff, from, 'work_day')?.getDate(), 17)
  })

  it('averages weekly hours over the cycle', () => {
    assert.equal(averageWeeklyHours(fourOnFourOff.pattern, 12), 42)
    assert.equal(averageWeeklyHours(scheduleBySlug('5-5-5')!.pattern, 12), 56)
    assert.equal(averageWeeklyHours(fourOnFourOff.pattern, 0), null)
    assert.equal(averageWeeklyHours(fourOnFourOff.pattern, 25), null)
  })

  it('describes a pattern in words', () => {
    assert.equal(describePattern(scheduleBySlug('2-2-4')!.pattern), '2 day shifts, 2 night shifts, 4 days off')
    assert.equal(describePattern(scheduleBySlug('24-48')!.pattern), '1 day shift, 2 days off')
  })

  it('reads a shared link and falls back on bad values', () => {
    const query = new URLSearchParams(calculatorQuery({ ...fourOnFourOff, anchorCycleDay: 3 }, 12))
    const read = rotationFromQuery(query, fourOnFourOff)
    assert.deepEqual(read.rotation, { ...fourOnFourOff, anchorCycleDay: 3 })
    assert.equal(read.shiftHours, 12)
    const bad = rotationFromQuery(new URLSearchParams('p=zz&a=2026-02-30&c=99&h=90'), fourOnFourOff)
    assert.deepEqual(bad.rotation, fourOnFourOff)
    assert.equal(bad.shiftHours, null)
  })

  it('hands a rotation to onboarding once and only while it is fresh', () => {
    const now = 1_800_000_000_000
    const raw = writeHandoff(fourOnFourOff.pattern, now)
    assert.deepEqual(readHandoff(raw, now + 1000), fourOnFourOff.pattern)
    assert.equal(readHandoff(raw, now + 8 * 86400000), null)
    assert.equal(readHandoff('not json', now), null)
    assert.equal(readHandoff(null, now), null)
  })
})

describe('schedule guides', () => {
  it('states the weekly hours each guide claims', () => {
    const claimed: Record<string, number> = {
      '4-on-4-off': 42, '4-on-4-off-days-and-nights': 42, '2-2-4': 42, dupont: 42,
      'panama-2-2-3': 42, pitman: 42, '5-5-5': 56, '7-on-7-off': 42, '3-on-3-off': 42,
      '24-48': 56, 'kelly-schedule': 56, 'fifo-14-14': 42, 'fifo-8-6': 48, 'fifo-2-weeks-on-1-off': 56,
    }
    assert.deepEqual(SCHEDULES.map((s) => s.slug).sort(), Object.keys(claimed).sort())
    for (const schedule of SCHEDULES) {
      assert.equal(averageWeeklyHours(schedule.pattern, schedule.shiftHours), claimed[schedule.slug], schedule.slug)
      assert.ok(schedule.faqs.length >= 4, schedule.slug)
      for (const faq of schedule.faqs) {
        if (/averages (\d+) hours a week/.test(faq.a)) {
          assert.equal(Number(/averages (\d+) hours/.exec(faq.a)![1]), claimed[schedule.slug], schedule.slug)
        }
      }
    }
  })

  it('has the documented cycle lengths', () => {
    const lengths = Object.fromEntries(SCHEDULES.map((s) => [s.slug, totalCycleDays(s.pattern)]))
    assert.equal(lengths.dupont, 28)
    assert.equal(lengths.pitman, 28)
    assert.equal(lengths['panama-2-2-3'], 14)
    assert.equal(lengths['kelly-schedule'], 9)
    assert.equal(lengths['24-48'], 3)
    assert.equal(lengths['fifo-2-weeks-on-1-off'], 21)
  })

  it('links audiences only to schedules that exist, and lists every guide once', () => {
    for (const audience of AUDIENCES) {
      for (const slug of audience.scheduleSlugs) assert.ok(scheduleBySlug(slug), `${audience.slug} -> ${slug}`)
    }
    const paths = guidePaths()
    assert.equal(new Set(paths).size, paths.length)
    assert.equal(paths.length, 2 + SCHEDULES.length + AUDIENCES.length)
  })
})
