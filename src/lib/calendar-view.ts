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

/**
 * Month/year toggles keep the month on screen.
 * A selected day in another month must not pull the grid back.
 */
export function gridMonthAfterViewToggle(viewedMonth: Date, selectedDate: Date | null): Date {
  void selectedDate
  return startOfViewedMonth(viewedMonth)
}

export function yearToLoad(loadedYear: number, viewedMonth: Date): number | null {
  const year = headerYear(viewedMonth)
  return year === loadedYear ? null : year
}
