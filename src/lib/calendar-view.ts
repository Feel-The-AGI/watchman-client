import { isFreeMonthLocked } from './free-calendar-access'

/** First of the month the grid is actually showing. */
export function startOfViewedMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function headerYear(viewedMonth: Date): number {
  return startOfViewedMonth(viewedMonth).getFullYear()
}

export function shiftViewedMonth(viewedMonth: Date, deltaMonths: number): Date {
  const current = startOfViewedMonth(viewedMonth)
  return new Date(current.getFullYear(), current.getMonth() + deltaMonths, 1)
}

/** Grid month after a Month/Year toggle. The selected day is not an input. */
export function gridMonthAfterViewToggle(viewedMonth: Date): Date {
  return startOfViewedMonth(viewedMonth)
}

/** Month to open, or null when a free account is past the six-month horizon. */
export function monthToShow(
  month: Date,
  today: Date,
  tier: 'free' | 'pro' | 'admin' = 'free',
): Date | null {
  const next = startOfViewedMonth(month)
  if (isFreeMonthLocked(next, today, tier)) return null
  return next
}

export function monthArrowLabel(direction: 'previous' | 'next'): string {
  return direction === 'previous' ? 'Previous month' : 'Next month'
}

export function yearToLoad(loadedYear: number, viewedMonth: Date): number | null {
  const year = headerYear(viewedMonth)
  return year === loadedYear ? null : year
}
