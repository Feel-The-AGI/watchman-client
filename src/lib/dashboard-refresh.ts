export interface DashboardSnapshotClient {
  cycles: { list: () => Promise<unknown> }
  calendar: { getYear: (year: number) => Promise<unknown> }
  stats: { getSummary: (year: number) => Promise<unknown> }
}

export interface DashboardSnapshot {
  cycles: unknown
  calendar: unknown
  stats: unknown
}

/** Refetch cycle, calendar, and stats together after a proposal is applied. */
export async function loadDashboardSnapshot(client: DashboardSnapshotClient, year: number): Promise<DashboardSnapshot> {
  const loaded = await loadDashboardYears(client, [year])
  return {
    cycles: loaded.cycles,
    calendar: loaded.calendars[0]?.calendar ?? null,
    stats: loaded.statsByYear[0]?.stats ?? null,
  }
}

export interface DashboardYearLoad {
  cycles: unknown
  calendars: { year: number; calendar: unknown }[]
  statsByYear: { year: number; stats: unknown }[]
}

/** One cycle list, plus calendar and stats for every year a change touched. */
export async function loadDashboardYears(client: DashboardSnapshotClient, years: number[]): Promise<DashboardYearLoad> {
  const unique = [...new Set(years)]
  const [cycles, calendars, statsByYear] = await Promise.all([
    client.cycles.list().catch(() => null),
    Promise.all(unique.map(async (year) => {
      try {
        return { year, calendar: await client.calendar.getYear(year) }
      } catch {
        return { year, calendar: null }
      }
    })),
    Promise.all(unique.map(async (year) => {
      try {
        return { year, stats: await client.stats.getSummary(year) }
      } catch {
        return { year, stats: null }
      }
    })),
  ])
  return { cycles, calendars, statsByYear }
}
