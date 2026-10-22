const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LENGTHS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export interface DateOnly {
  year: number
  month: number
  day: number
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Read a date-only `YYYY-MM-DD` by splitting on `-`. No `Date` and no timezone conversion. */
export function parseDateOnly(value: unknown): DateOnly | null {
  if (typeof value !== 'string') return null
  const parts = value.split('-')
  if (parts.length !== 3) return null
  const [yearText, monthText, dayText] = parts
  if (yearText.length !== 4 || monthText.length !== 2 || dayText.length !== 2) return null
  if (!/^\d{4}$/.test(yearText) || !/^\d{2}$/.test(monthText) || !/^\d{2}$/.test(dayText)) return null
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (month < 1 || month > 12) return null
  const maxDay = month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month]
  if (day < 1 || day > maxDay) return null
  return { year, month, day }
}

export function formatDateOnly(value: unknown): string | null {
  const parsed = parseDateOnly(value)
  if (!parsed) return null
  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
}

export function displayDateOnly(value: unknown, style: 'full' | 'month-day' = 'full'): string | null {
  const parsed = parseDateOnly(value)
  if (!parsed) return null
  const month = MONTHS[parsed.month - 1]
  if (style === 'month-day') return `${month} ${parsed.day}`
  return `${month} ${parsed.day}, ${parsed.year}`
}

/**
 * Calendar parts of a date-only value.
 * `YYYY-MM` and `YYYY-MM-DD` are calendar dates. A timestamp is not.
 */
export function parseCalendarDate(value: unknown): DateOnly | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  const monthKey = /^(\d{4})-(\d{2})$/.exec(trimmed)
  if (monthKey) return parseDateOnly(`${monthKey[1]}-${monthKey[2]}-01`)
  return parseDateOnly(trimmed)
}

/**
 * Local calendar date for a stored value.
 * `new Date('YYYY-MM')` and `new Date('YYYY-MM-DD')` are UTC and shift the day
 * behind UTC. Date-only strings are built from their parts. Timestamps stay instants.
 */
export function localDateFromStored(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const calendar = parseCalendarDate(trimmed)
  if (calendar) return new Date(calendar.year, calendar.month - 1, calendar.day)
  const instant = new Date(trimmed)
  return Number.isNaN(instant.getTime()) ? null : instant
}
