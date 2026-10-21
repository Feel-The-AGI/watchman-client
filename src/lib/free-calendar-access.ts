/**
 * Free accounts see every month of the current year.
 * Months further than six months beyond today, in another year, stay limited.
 */
export function isFreeMonthLocked(month: Date, today: Date, tier: 'free' | 'pro' | 'admin' = 'free'): boolean {
  if (tier !== 'free') return false
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
  if (monthStart.getFullYear() === today.getFullYear()) return false
  const horizon = new Date(today.getFullYear(), today.getMonth() + 6, 1)
  return monthStart >= horizon
}

export function isYearMonthVisible(monthIndex: number, year: number, today: Date, tier: 'free' | 'pro' | 'admin' = 'free'): boolean {
  return !isFreeMonthLocked(new Date(year, monthIndex, 1), today, tier)
}
