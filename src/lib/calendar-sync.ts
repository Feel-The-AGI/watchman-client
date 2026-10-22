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

export interface CalendarRefreshResult {
  cyclesFailed: boolean
  failedYears: number[]
}

const EMPTY_REFRESH: CalendarRefreshResult = { cyclesFailed: false, failedYears: [] }

let client: DashboardSnapshotClient | null = null
let cycles: unknown = null
let viewedYear = new Date().getFullYear()
let pendingRefreshes = 0
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

export async function refetchCalendarYears(targetYears: number[]): Promise<CalendarRefreshResult> {
  const unique = [...new Set(targetYears.filter((year) => Number.isInteger(year)))]
  if (!client || unique.length === 0) {
    notify()
    return EMPTY_REFRESH
  }
  const loaded = await loadDashboardYears(client, unique)
  const cyclesFailed = loaded.cycles == null
  if (!cyclesFailed) cycles = loaded.cycles
  const failedYears: number[] = []
  for (const entry of loaded.calendars) {
    if (entry.calendar == null) {
      failedYears.push(entry.year)
      continue
    }
    const stats = loaded.statsByYear.find((item) => item.year === entry.year)?.stats ?? yearCache.get(entry.year)?.stats ?? null
    yearCache.set(entry.year, { calendar: entry.calendar, stats })
  }
  notify()
  return { cyclesFailed, failedYears }
}

/** Same refetch, serialized so an older response cannot overwrite a newer one. */
export function refreshCalendarYears(targetYears: number[]): Promise<CalendarRefreshResult> {
  pendingRefreshes += 1
  const run = refreshLock.then(() => refetchCalendarYears(targetYears))
  refreshLock = run.then(() => undefined, () => undefined)
  void run.finally(() => {
    pendingRefreshes -= 1
  })
  return run
}

export function isCalendarRefreshPending(): boolean {
  return pendingRefreshes > 0
}

/** True when this refresh failed and there is no cached data to keep on screen. */
export function calendarLoadFailed(result: CalendarRefreshResult, year: number): boolean {
  if (result.cyclesFailed && !Array.isArray(cachedCycles())) return true
  if (result.failedYears.includes(year) && !cachedCalendarYear(year)?.calendar) return true
  return false
}

/** Refetch the on-screen year and every other year the change touched. */
export function invalidateCalendar(source?: unknown): Promise<CalendarRefreshResult> {
  return refreshCalendarYears(yearsToRefetch(source, viewedYear))
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
