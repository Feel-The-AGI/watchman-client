export type ShiftWorkType = 'work_day' | 'work_night' | 'off' | 'blank' | string | null | undefined

export interface BadgeBlock {
  label?: string
  duration?: number
}

/**
 * 1-based index inside the pattern block that contains this cycle day.
 * A 5-5-5 night on cycle day 6 is block day 1, not 6.
 */
export function blockDayFor(cycleDay: number, pattern: BadgeBlock[] | null | undefined): number | null {
  const blocks = (pattern ?? []).filter((block) => {
    const duration = Number(block?.duration)
    return Number.isFinite(duration) && duration > 0
  })
  const total = blocks.reduce((sum, block) => sum + Math.trunc(Number(block.duration)), 0)
  if (total <= 0 || !Number.isFinite(cycleDay)) return null
  const normalized = ((Math.trunc(cycleDay) - 1) % total + total) % total + 1
  let cursor = 0
  for (const block of blocks) {
    const duration = Math.trunc(Number(block.duration))
    if (normalized <= cursor + duration) return normalized - cursor
    cursor += duration
  }
  return normalized
}

export function patternBlocks(value: unknown): { label: string; duration: number }[] {
  if (!Array.isArray(value)) return []
  const blocks: { label: string; duration: number }[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const record = item as { label?: unknown; duration?: unknown }
    const label = record.label
    const duration = Number(record.duration)
    if (label !== 'work_day' && label !== 'work_night' && label !== 'off') continue
    if (!Number.isFinite(duration) || duration <= 0) continue
    blocks.push({ label, duration: Math.trunc(duration) })
  }
  return blocks
}

/** Pattern on the active cycle, or the only cycle when none is marked active. */
export function activeCyclePattern(cycles: unknown): { label: string; duration: number }[] {
  if (!Array.isArray(cycles)) return []
  const records = cycles.filter((cycle) => cycle && typeof cycle === 'object') as {
    is_active?: unknown
    pattern?: unknown
  }[]
  const active = records.find((cycle) => cycle.is_active === true) ?? records[0]
  return patternBlocks(active?.pattern)
}

/**
 * Cell badge. The number restarts at 1 inside each block: D1–D5, N1–N5, O1–O5.
 * The raw cycle day stays on labels that say "cycle day", not on this badge.
 */
export function cycleDayBadge(
  workType: ShiftWorkType,
  cycleDay: number | null | undefined,
  source?: {
    pattern?: BadgeBlock[] | null
    blockDay?: number | null
  },
): string | null {
  if (!workType || workType === 'blank') return null
  const fromBlock = source?.blockDay
  const number = typeof fromBlock === 'number' && fromBlock >= 1
    ? Math.trunc(fromBlock)
    : blockDayFor(cycleDay ?? Number.NaN, source?.pattern)
  if (!number || number < 1) return null
  if (workType === 'off') return `O${number}`
  if (workType === 'work_night') return `N${number}`
  if (workType === 'work_day') return `D${number}`
  return null
}
