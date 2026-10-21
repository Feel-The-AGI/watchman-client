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
  const [cycles, calendar, stats] = await Promise.allSettled([
    client.cycles.list(),
    client.calendar.getYear(year),
    client.stats.getSummary(year),
  ])
  return {
    cycles: cycles.status === 'fulfilled' ? cycles.value : null,
    calendar: calendar.status === 'fulfilled' ? calendar.value : null,
    stats: stats.status === 'fulfilled' ? stats.value : null,
  }
}
