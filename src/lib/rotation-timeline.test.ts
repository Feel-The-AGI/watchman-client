import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { patternPhrase, rotationTimeline } from './rotation-timeline'

const cycle = {
  pattern: [{ label: 'work_night', duration: 7 }, { label: 'off', duration: 7 }],
  anchor_date: '2026-12-01',
  anchor_cycle_day: 1,
  history: [
    { pattern: [{ label: 'work_day', duration: 4 }, { label: 'off', duration: 4 }], anchor_date: '2026-11-07', anchor_cycle_day: 1, until: '2026-11-15' },
    { pattern: [{ label: 'work_day', duration: 2 }, { label: 'work_night', duration: 2 }, { label: 'off', duration: 3 }], anchor_date: '2026-11-16', anchor_cycle_day: 1, until: '2026-11-30' },
  ],
}

describe('rotation timeline', () => {
  it('shows the rotation in force today, not a later scheduled one', () => {
    const timeline = rotationTimeline(cycle, '2026-11-20')!
    assert.equal(patternPhrase(timeline.current.pattern), '2 days, 2 nights, 3 off')
    assert.equal(timeline.current.from, '2026-11-16')
    assert.equal(timeline.current.until, '2026-11-30')
    assert.equal(timeline.upcoming.length, 1)
    assert.equal(timeline.upcoming[0].from, '2026-12-01')
    assert.equal(patternPhrase(timeline.upcoming[0].pattern), '7 nights, 7 off')
    assert.equal(timeline.earlier.length, 1)
    assert.equal(timeline.earlier[0].until, '2026-11-15')
  })

  it('treats the boundary days as inclusive', () => {
    assert.equal(rotationTimeline(cycle, '2026-11-15')!.current.anchor_date, '2026-11-07')
    assert.equal(rotationTimeline(cycle, '2026-11-16')!.current.anchor_date, '2026-11-16')
    assert.equal(rotationTimeline(cycle, '2026-12-01')!.current.anchor_date, '2026-12-01')
    assert.equal(rotationTimeline(cycle, '2026-12-01')!.upcoming.length, 0)
  })

  it('uses the oldest rotation for dates before any history', () => {
    const timeline = rotationTimeline(cycle, '2025-01-01')!
    assert.equal(timeline.current.anchor_date, '2026-11-07')
    assert.equal(timeline.earlier.length, 0)
    assert.equal(timeline.upcoming.length, 2)
  })

  it('handles a cycle with no history and ignores malformed entries', () => {
    const plain = rotationTimeline({ ...cycle, history: [{ until: 'x' }, null, 'junk'] }, '2026-11-20')!
    assert.equal(plain.current.anchor_date, '2026-12-01')
    assert.deepEqual(plain.upcoming, [])
    assert.deepEqual(plain.earlier, [])
    assert.equal(rotationTimeline(null, '2026-11-20'), null)
    assert.equal(rotationTimeline({ pattern: [] }, '2026-11-20'), null)
  })

  it('names single days in the singular', () => {
    assert.equal(patternPhrase([{ label: 'work_day', duration: 1 }, { label: 'off', duration: 1 }]), '1 day, 1 off')
  })
})
