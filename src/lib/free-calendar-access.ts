/**
 * Free accounts can open a month when it starts inside the next six months.
 * Pro and admin are never locked. Year view and month view both use this.
 */
export function isFreeMonthLocked(month: Date, today: Date, tier: 'free' | 'pro' | 'admin' = 'free'): boolean {
  if (tier !== 'free') return false
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const horizon = new Date(today.getFullYear(), today.getMonth() + 6, 1)
  return monthStart >= horizon
}

export function isYearMonthVisible(monthIndex: number, year: number, today: Date, tier: 'free' | 'pro' | 'admin' = 'free'): boolean {
  return !isFreeMonthLocked(new Date(year, monthIndex, 1), today, tier)
}
