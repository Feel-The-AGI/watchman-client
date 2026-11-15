import {
  calendarDayDiff,
  parseLocalDate,
  totalCycleDays,
  workTypeForCycleDay,
  type CycleBlock,
  type ShiftLabel,
} from './rotation'

/** The calculator works on whole days. Rotations longer than a year are refused, as in the app. */
export const MAX_CALCULATOR_CYCLE = 366

const CODE: Record<ShiftLabel, string> = { work_day: 'd', work_night: 'n', off: 'o' }
const LABEL: Record<string, ShiftLabel> = { d: 'work_day', n: 'work_night', o: 'off' }

/** "d4.o4" for 4 days then 4 off. Short enough for a shared link. */
export function encodePattern(pattern: CycleBlock[]): string {
  return pattern.map((block) => `${CODE[block.label]}${block.duration}`).join('.')
}

/** The pattern a link carries, or null when it is not a usable rotation. */
export function decodePattern(value: string | null | undefined): CycleBlock[] | null {
  if (!value) return null
  const parts = value.trim().toLowerCase().split('.').filter(Boolean)
  if (parts.length === 0 || parts.length > 40) return null
  const pattern: CycleBlock[] = []
  for (const part of parts) {
    const match = /^([dno])(\d{1,3})$/.exec(part)
    if (!match) return null
    const duration = Number(match[2])
    if (duration < 1) return null
    pattern.push({ label: LABEL[match[1]], duration })
  }
  const total = totalCycleDays(pattern)
  if (total < 1 || total > MAX_CALCULATOR_CYCLE) return null
  return pattern
}

/** YYYY-MM-DD for a local date. */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export interface RotationAnchor {
  pattern: CycleBlock[]
  /** A date the user knows, YYYY-MM-DD. */
  anchorDate: string
  /** Which day of the cycle that date is, starting at 1. */
  anchorCycleDay: number
}

/** The cycle day (1..length) a date falls on. */
export function cycleDayOn(rotation: RotationAnchor, date: Date): number | null {
  const anchor = parseLocalDate(rotation.anchorDate)
  const total = totalCycleDays(rotation.pattern)
  if (!anchor || total < 1) return null
  const raw = rotation.anchorCycleDay - 1 + calendarDayDiff(date, anchor)
  return ((raw % total) + total) % total + 1
}

/** Day shift, night shift or off on a date. */
export function shiftOn(rotation: RotationAnchor, date: Date): ShiftLabel | null {
  const day = cycleDayOn(rotation, date)
  if (day === null) return null
  return workTypeForCycleDay(rotation.pattern, day)
}

export interface CalendarCell {
  key: string
  day: number | null
  iso: string | null
  shift: ShiftLabel | null
  isToday: boolean
}

export interface MonthTotals {
  days: number
  nights: number
  off: number
}

export interface CalculatorMonth {
  year: number
  month: number
  label: string
  cells: CalendarCell[]
  totals: MonthTotals
}

/** One month laid out Monday first, with the shift on every day. */
export function buildMonth(rotation: RotationAnchor, year: number, month: number, today: Date): CalculatorMonth {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  const cells: CalendarCell[] = []
  const totals: MonthTotals = { days: 0, nights: 0, off: 0 }
  const todayIso = isoDate(today)
  for (let index = 0; index < leading; index += 1) {
    cells.push({ key: `blank-${year}-${month}-${index}`, day: null, iso: null, shift: null, isToday: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    const iso = isoDate(date)
    const shift = shiftOn(rotation, date)
    if (shift === 'work_day') totals.days += 1
    else if (shift === 'work_night') totals.nights += 1
    else if (shift === 'off') totals.off += 1
    cells.push({ key: iso, day, iso, shift, isToday: iso === todayIso })
  }
  const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { year, month, label, cells, totals }
}

/** The month containing `start` and the ones after it. */
export function buildMonths(rotation: RotationAnchor, start: Date, count: number, today: Date): CalculatorMonth[] {
  const months: CalculatorMonth[] = []
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + offset, 1)
    months.push(buildMonth(rotation, date.getFullYear(), date.getMonth(), today))
  }
  return months
}

/** The first date on or after `from` with this shift, looking at most two cycles ahead. */
export function nextShift(rotation: RotationAnchor, from: Date, shift: ShiftLabel): Date | null {
  const total = totalCycleDays(rotation.pattern)
  if (total < 1) return null
  for (let offset = 0; offset <= total * 2; offset += 1) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset)
    if (shiftOn(rotation, date) === shift) return date
  }
  return null
}

/** Days worked in one cycle, day and night shifts together. */
export function workDaysPerCycle(pattern: CycleBlock[]): number {
  return pattern.filter((block) => block.label !== 'off').reduce((sum, block) => sum + block.duration, 0)
}

/** Average hours a week over the whole cycle, to one decimal. */
export function averageWeeklyHours(pattern: CycleBlock[], shiftHours: number): number | null {
  const total = totalCycleDays(pattern)
  if (total < 1 || !Number.isFinite(shiftHours) || shiftHours <= 0 || shiftHours > 24) return null
  return Math.round((workDaysPerCycle(pattern) * shiftHours * 7 * 10) / total) / 10
}

/** Plain-English blocks, e.g. "4 day shifts, 4 days off". */
export function describePattern(pattern: CycleBlock[]): string {
  return pattern
    .map((block) => {
      const n = block.duration
      if (block.label === 'work_day') return `${n} day shift${n === 1 ? '' : 's'}`
      if (block.label === 'work_night') return `${n} night shift${n === 1 ? '' : 's'}`
      return `${n} day${n === 1 ? '' : 's'} off`
    })
    .join(', ')
}

/** The query string a shared calculator link carries. */
export function calculatorQuery(rotation: RotationAnchor, shiftHours?: number): string {
  const params = new URLSearchParams()
  params.set('p', encodePattern(rotation.pattern))
  params.set('a', rotation.anchorDate)
  params.set('c', String(rotation.anchorCycleDay))
  if (shiftHours && shiftHours > 0) params.set('h', String(shiftHours))
  return params.toString()
}

/** Read a shared link. Anything missing or invalid falls back to the defaults. */
export function rotationFromQuery(
  query: URLSearchParams,
  fallback: RotationAnchor,
): { rotation: RotationAnchor; shiftHours: number | null } {
  const pattern = decodePattern(query.get('p')) ?? fallback.pattern
  const anchorText = query.get('a')
  const anchorDate = anchorText && parseLocalDate(anchorText) ? anchorText : fallback.anchorDate
  const total = totalCycleDays(pattern)
  const day = Number(query.get('c'))
  const anchorCycleDay = Number.isInteger(day) && day >= 1 && day <= total ? day : Math.min(fallback.anchorCycleDay, total)
  const hours = Number(query.get('h'))
  const shiftHours = Number.isFinite(hours) && hours > 0 && hours <= 24 ? hours : null
  return { rotation: { pattern, anchorDate, anchorCycleDay }, shiftHours }
}

/** Where a rotation waits while the visitor signs up. Onboarding reads it once. */
export const CALCULATOR_HANDOFF_KEY = 'watchman.calculator-rotation'

/** The stored hand-off, or null when it is missing, stale or not a rotation. */
export function readHandoff(raw: string | null, now: number = Date.now()): CycleBlock[] | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as { p?: unknown; at?: unknown }
    if (typeof value.p !== 'string' || typeof value.at !== 'number') return null
    // A rotation saved more than a week ago is from another visit.
    if (now - value.at > 7 * 86400000 || value.at > now + 60000) return null
    return decodePattern(value.p)
  } catch {
    return null
  }
}

export function writeHandoff(pattern: CycleBlock[], now: number = Date.now()): string {
  return JSON.stringify({ p: encodePattern(pattern), at: now })
}
