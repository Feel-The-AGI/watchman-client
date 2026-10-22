import { formatDateOnly, parseDateOnly } from '@/lib/date-only'
import { loadDashboardYears, type DashboardSnapshotClient } from '@/lib/dashboard-refresh'

const DATE_KEYS = ['date', 'start_date', 'end_date', 'anchor_date']
const LIST_KEYS = ['dates', 'affected_dates', 'updated_dates', 'changed_dates', 'days']

export interface CachedCalendarYear {
  calendar: unknown
  stats: unknown
}

export interface CalendarRefreshRequest {
  years: number[]
  dates: string[]
}

let client: DashboardSnapshotClient | null = null
let cycles: unknown = null
let viewedYear = new Date().getFullYear()
let refreshLock: Promise<void> = Promise.resolve()
const yearCache = new Map<number, CachedCalendarYear>()
const listeners = new Set<() => void>()

export function configureCalendarRefresh(next: DashboardSnapshotClient | null) {
  client = next
}

export function setViewedCalendarYear(year: number) {
  viewedYear = year
}

export function getViewedCalendarYear(): number {
  return viewedYear
}

export function cachedCycles(): unknown {
  return cycles
}

export function cachedCalendarYear(year: number): CachedCalendarYear | undefined {
  return yearCache.get(year)
}

export function subscribeCalendarCache(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  for (const listener of [...listeners]) listener()
}

function addDate(value: unknown, found: string[], seen: Set<string>) {
  if (typeof value !== 'string') return
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  const formatted = formatDateOnly(match?.[1] ?? value)
  if (!formatted || seen.has(formatted)) return
  seen.add(formatted)
  found.push(formatted)
}

function walkDates(value: unknown, found: string[], seen: Set<string>, visited: WeakSet<object>, depth: number) {
  if (!value || depth > 6) return
  if (typeof value === 'string') {
    addDate(value, found, seen)
    return
  }
  if (typeof value !== 'object') return
  if (visited.has(value)) return
  visited.add(value)
  if (Array.isArray(value)) {
    for (const item of value) walkDates(item, found, seen, visited, depth + 1)
    return
  }
  const record = value as Record<string, unknown>
  for (const key of DATE_KEYS) {
    if (key in record) addDate(record[key], found, seen)
  }
  for (const key of LIST_KEYS) {
    if (key in record) walkDates(record[key], found, seen, visited, depth + 1)
  }
  for (const key of ['payload', 'command', 'proposal', 'result', 'data']) {
    if (record[key] && typeof record[key] === 'object') {
      walkDates(record[key], found, seen, visited, depth + 1)
    }
  }
}

/** Every YYYY-MM-DD attached to a proposal, undo result, or edit. */
export function datesFromChange(source: unknown): string[] {
  const found: string[] = []
  walkDates(source, found, new Set(), new WeakSet(), 0)
  return found
}

export function yearsFromDates(dates: string[]): number[] {
  const years = new Set<number>()
  for (const date of dates) {
    const parsed = parseDateOnly(date)
    if (parsed) years.add(parsed.year)
  }
  return [...years].sort((left, right) => left - right)
}

export function refreshRequestFrom(source?: unknown): CalendarRefreshRequest {
  const dates = datesFromChange(source)
  const years = new Set(yearsFromDates(dates))
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    const listed = (source as { years?: unknown }).years
    if (Array.isArray(listed)) {
      for (const year of listed) {
        if (typeof year === 'number' && Number.isInteger(year)) years.add(year)
      }
    }
  }
  return { dates, years: [...years].sort((left, right) => left - right) }
}

export function yearsToRefetch(source: unknown | undefined, screenYear: number): number[] {
  const requested = refreshRequestFrom(source).years
  const targets = requested.length > 0 ? requested : [screenYear]
  return [...new Set([...targets, screenYear])].sort((left, right) => left - right)
}

export async function refetchCalendarYears(targetYears: number[]): Promise<void> {
  const unique = [...new Set(targetYears.filter((year) => Number.isInteger(year)))]
  if (!client || unique.length === 0) {
    notify()
    return
  }
  const loaded = await loadDashboardYears(client, unique)
  if (loaded.cycles != null) cycles = loaded.cycles
  for (const entry of loaded.calendars) {
    const stats = loaded.statsByYear.find((item) => item.year === entry.year)?.stats ?? yearCache.get(entry.year)?.stats ?? null
    if (entry.calendar == null && !yearCache.has(entry.year)) continue
    yearCache.set(entry.year, {
      calendar: entry.calendar ?? yearCache.get(entry.year)?.calendar ?? null,
      stats,
    })
  }
  notify()
}

/** Refetch the on-screen year and every other year the change touched. */
export function invalidateCalendar(source?: unknown): Promise<void> {
  const run = refreshLock.then(() => refetchCalendarYears(yearsToRefetch(source, viewedYear)))
  refreshLock = run.catch(() => undefined)
  return run
}

/** Tab focus. A hidden tab does not refetch until it is visible again. */
export function watchCalendarFocus(onFocus: () => void): () => void {
  if (typeof document === 'undefined') return () => undefined
  const onVisibility = () => {
    if (document.visibilityState === 'visible') onFocus()
  }
  document.addEventListener('visibilitychange', onVisibility)
  return () => document.removeEventListener('visibilitychange', onVisibility)
}
