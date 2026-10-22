import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  approvalUpgradeMessage,
  freeHorizonNotice,
  isDayPastFreeHorizon,
  isMonthEntirelyPastHorizon,
  PRO_UPGRADE_FALLBACK,
  readCalendarYearPayload,
  shiftCountsThroughHorizon,
  yearMonthShiftCounts,
} from './free-horizon.ts'

const horizon = '2026-10-22'

describe('free horizon lock', () => {
  it('keeps the horizon day open and locks the next day in every timezone', () => {
    assert.equal(isDayPastFreeHorizon(horizon, horizon), false)
    assert.equal(isDayPastFreeHorizon('2026-10-23', horizon), true)
    assert.equal(isDayPastFreeHorizon('2026-10-21', horizon), false)
    assert.equal(isDayPastFreeHorizon('2027-01-01', '2026-12-31'), true)
    assert.equal(isMonthEntirelyPastHorizon(2026, 9, horizon), false)
    assert.equal(isMonthEntirelyPastHorizon(2026, 10, horizon), true)

    const zone = process.env.TZ
    if (zone === 'America/New_York') {
      assert.equal(new Date('2026-10-23').getDate(), 22)
    } else if (zone === 'Asia/Tokyo' || zone === 'UTC') {
      assert.equal(new Date('2026-10-23').getDate(), 23)
    }
  })

  it('does not lock anything when the server omits the horizon', () => {
    assert.equal(isDayPastFreeHorizon('2027-06-01', null), false)
    assert.equal(isDayPastFreeHorizon('2027-06-01', undefined), false)
    assert.equal(isMonthEntirelyPastHorizon(2027, 5, null), false)
    assert.deepEqual(readCalendarYearPayload([{ date: '2026-10-22' }]), {
      days: [{ date: '2026-10-22' }],
      horizonEnd: null,
    })
  })

  it('does not count a day after the horizon as an off day', () => {
    const counts = shiftCountsThroughHorizon([
      { date: '2026-10-22', work_type: 'off' },
      { date: '2026-10-23', work_type: 'off' },
    ], horizon)
    assert.equal(counts.off_days, 1)
  })

  it('reads a free horizon from a calendar payload and from a 403 or chat result', () => {
    assert.deepEqual(
      readCalendarYearPayload({ days: [{ date: '2026-10-22' }], free_horizon_end: horizon }),
      { days: [{ date: '2026-10-22' }], horizonEnd: horizon },
    )
    assert.deepEqual(freeHorizonNotice({ code: 'free_horizon', horizon_end: horizon }), { horizonEnd: horizon })
    assert.deepEqual(
      freeHorizonNotice({ status: 403, detail: { code: 'free_horizon', horizon_end: horizon, message: 'no' } }),
      { horizonEnd: horizon },
    )
    assert.equal(freeHorizonNotice({ status: 403, detail: 'Pro feature' }), null)
  })

  it('shows the server message for a 403 approval instead of a generic save failure', () => {
    const leave = 'Leave planning is a Pro feature. Upgrade to Pro to block out vacation days, sick leave, and plan time off on your calendar!'
    const cap = "You've hit the 2 commitment limit on the free plan. Want to track more? Upgrade to Pro for unlimited commitments."
    const horizonMessage = 'The free plan covers 3 months of planning ahead. Upgrade to Pro to plan further.'
    assert.equal(
      approvalUpgradeMessage({ status: 403, detail: { code: 'free_horizon', horizon_end: horizon, message: horizonMessage } }),
      horizonMessage,
    )
    assert.equal(approvalUpgradeMessage({ status: 403, detail: leave }), leave)
    assert.equal(approvalUpgradeMessage({ status: 403, message: cap }), cap)
    assert.equal(
      approvalUpgradeMessage({ status: 403, detail: { code: 'free_horizon', horizon_end: horizon } }),
      PRO_UPGRADE_FALLBACK,
    )
    assert.equal(
      approvalUpgradeMessage({ status: 500, detail: 'The change could not be saved. It is still waiting for review.' }),
      null,
    )
  })

  it('leaves days after the horizon out of the year stats', () => {
    const days = [
      { date: '2026-10-22', work_type: 'work_day' as const },
      { date: '2026-10-22', work_type: 'off' as const },
      { date: '2026-10-23', work_type: 'off' as const },
      { date: '2026-10-23', work_type: 'work_night' as const, is_leave: true },
    ]
    const capped = yearMonthShiftCounts(days, horizon)
    assert.equal(capped.dayShifts, 1)
    assert.equal(capped.offDays, 1)
    assert.equal(capped.nightShifts, 0)
    assert.equal(capped.leaveDays, 0)
    const open = yearMonthShiftCounts(days, null)
    assert.equal(open.offDays, 2)
    assert.equal(open.nightShifts, 1)
    assert.equal(open.leaveDays, 1)
  })
})
