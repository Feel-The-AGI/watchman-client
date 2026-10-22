import { displayDateOnly, formatDateOnly, parseDateOnly } from './date-only'

export const FREE_HORIZON_MESSAGE = 'The free plan shows 3 months ahead. Upgrade to Pro to plan further.'

export const SEE_FURTHER_AHEAD = 'See further ahead with Pro'

export const PRO_UPGRADE_FALLBACK = 'This is part of the Pro plan. Upgrade to Pro to use it.'

const GENERIC_API_MESSAGE = 'Something went wrong while talking to Watchman.'

function compareDateOnly(left: string, right: string): number | null {
  const a = parseDateOnly(left)
  const b = parseDateOnly(right)
  if (!a || !b) return null
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

/** A calendar day after the inclusive horizon. No horizon, or an unreadable date, stays unlocked. */
export function isDayPastFreeHorizon(date: unknown, horizonEnd: unknown): boolean {
  const day = formatDateOnly(date)
  const end = formatDateOnly(horizonEnd)
  if (!day || !end) return false
  const order = compareDateOnly(day, end)
  return order !== null && order > 0
}

/** True when every day of the month is after the horizon, so the month has nothing left to show. */
export function isMonthEntirelyPastHorizon(year: number, monthIndex: number, horizonEnd: unknown): boolean {
  if (!formatDateOnly(horizonEnd)) return false
  const first = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
  return isDayPastFreeHorizon(first, horizonEnd)
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/** Year/month payload from the current server (a day list) or the free-horizon server. */
export function readCalendarYearPayload(payload: unknown): { days: unknown; horizonEnd: string | null } {
  if (Array.isArray(payload)) return { days: payload, horizonEnd: null }
  const record = recordOf(payload)
  if (!record) return { days: payload, horizonEnd: null }
  const horizonEnd = formatDateOnly(record.free_horizon_end)
  if (Array.isArray(record.days)) return { days: record.days, horizonEnd }
  if (Array.isArray(record.data)) return { days: record.data, horizonEnd }
  return { days: payload, horizonEnd }
}

/** 403 detail or a chat result that refused planning past the free horizon. */
export function freeHorizonNotice(value: unknown): { horizonEnd: string | null } | null {
  const record = recordOf(value)
  if (!record) return null
  const detail = recordOf(record.detail)
  const code = typeof record.code === 'string'
    ? record.code
    : typeof detail?.code === 'string'
      ? detail.code
      : null
  if (code !== 'free_horizon') return null
  return { horizonEnd: formatDateOnly(record.horizon_end ?? detail?.horizon_end) }
}

export function horizonThroughLabel(horizonEnd: unknown): string | null {
  const label = displayDateOnly(horizonEnd)
  return label ? `through ${label}` : null
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function compareParts(left: { year: number; month: number; day: number }, right: { year: number; month: number; day: number }): number {
  if (left.year !== right.year) return left.year - right.year
  if (left.month !== right.month) return left.month - right.month
  return left.day - right.day
}

export type StatsPeriod = { kind: 'year' | 'window' | 'past'; label: string }

/** Caption for the stat cards. A partial year names the visible window. */
export function statsPeriodLabel(year: number, horizonEnd: unknown): StatsPeriod {
  const end = parseDateOnly(horizonEnd)
  if (!end) return { kind: 'year', label: `${year} totals` }
  const start = { year, month: 1, day: 1 }
  const yearEnd = { year, month: 12, day: 31 }
  if (compareParts(start, end) > 0) return { kind: 'past', label: `${year} is past the free plan` }
  if (compareParts(yearEnd, end) <= 0) return { kind: 'year', label: `${year} totals` }
  const startLabel = displayDateOnly(`${year}-01-01`)
  const endLabel = displayDateOnly(horizonEnd)
  return { kind: 'window', label: `Showing ${startLabel} – ${endLabel}` }
}

/** "February–December 2027" for the months gathered under one lock banner. */
export function lockedMonthSpanLabel(year: number, monthIndexes: number[]): string | null {
  const indexes = [...new Set(monthIndexes.filter((index) => index >= 0 && index <= 11))].sort((a, b) => a - b)
  if (indexes.length === 0) return null
  const first = MONTH_NAMES[indexes[0]]
  const last = MONTH_NAMES[indexes[indexes.length - 1]]
  if (indexes.length === 1) return `${first} ${year}`
  return `${first}–${last} ${year}`
}

function readableText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || text === GENERIC_API_MESSAGE) return null
  return text
}

/**
 * Copy for a proposal approval that came back 403: free horizon, leave, or the
 * free commitment cap. Null when this is not that refusal.
 */
export function approvalUpgradeMessage(error: unknown): string | null {
  const record = recordOf(error)
  if (!record || record.status !== 403) return null
  const detail = record.detail
  const detailRecord = recordOf(detail)
  const fromDetail = typeof detail === 'string'
    ? readableText(detail)
    : readableText(detailRecord?.message) ?? readableText(detailRecord?.detail)
  return fromDetail ?? readableText(record.message) ?? PRO_UPGRADE_FALLBACK
}

/** Year-view counts. Days after the horizon are hidden and are not off days. */
export function yearMonthShiftCounts<T extends { date: string; work_type?: string | null; is_leave?: boolean }>(
  days: T[],
  horizonEnd: unknown,
): { dayShifts: number; nightShifts: number; offDays: number; leaveDays: number } {
  const visible = formatDateOnly(horizonEnd)
    ? days.filter((day) => !isDayPastFreeHorizon(day.date, horizonEnd))
    : days
  return {
    dayShifts: visible.filter((day) => day.work_type === 'work_day').length,
    nightShifts: visible.filter((day) => day.work_type === 'work_night').length,
    offDays: visible.filter((day) => day.work_type === 'off' && !day.is_leave).length,
    leaveDays: visible.filter((day) => Boolean(day.is_leave)).length,
  }
}

export function shiftCountsThroughHorizon<T extends { date: string; work_type?: string | null; is_leave?: boolean }>(
  days: T[],
  horizonEnd: unknown,
): { work_days: number; work_nights: number; off_days: number; leave_days: number } {
  const visible = formatDateOnly(horizonEnd)
    ? days.filter((day) => !isDayPastFreeHorizon(day.date, horizonEnd))
    : days
  return {
    work_days: visible.filter((day) => day.work_type === 'work_day' && !day.is_leave).length,
    work_nights: visible.filter((day) => day.work_type === 'work_night' && !day.is_leave).length,
    off_days: visible.filter((day) => day.work_type === 'off' && !day.is_leave).length,
    leave_days: visible.filter((day) => day.is_leave).length,
  }
}
