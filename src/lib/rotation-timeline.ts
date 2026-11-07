/**
 * The saved cycle is the latest rotation. Earlier rotations live in
 * cycle.history, oldest first, each with `until` (the last date it governs).
 * The latest rotation starts the day after the last `until`.
 *
 * The rotation card shows the one in force today, the next one if it starts
 * later, and the earlier ones, so a change scheduled for next month does not
 * look like today's roster.
 */
export interface RotationBlock {
  label: string
  duration: number
}

export interface Rotation {
  pattern: RotationBlock[]
  anchor_date: string | null
  anchor_cycle_day: number
}

export interface DatedRotation extends Rotation {
  from: string | null
  until: string | null
}

export interface RotationTimeline {
  current: DatedRotation
  upcoming: DatedRotation[]
  earlier: DatedRotation[]
}

function isoDay(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const day = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null
}

function nextDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return next.toISOString().slice(0, 10)
}

function rotationOf(raw: unknown): Rotation | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const pattern = Array.isArray(record.pattern)
    ? (record.pattern as unknown[]).flatMap((block) => {
      if (!block || typeof block !== 'object') return []
      const item = block as Record<string, unknown>
      const label = typeof item.label === 'string' ? item.label : null
      const duration = Number(item.duration)
      return label && duration > 0 ? [{ label, duration }] : []
    })
    : []
  if (pattern.length === 0) return null
  return {
    pattern,
    anchor_date: isoDay(record.anchor_date),
    anchor_cycle_day: Number(record.anchor_cycle_day) || 1,
  }
}

export function rotationTimeline(cycle: unknown, today: string): RotationTimeline | null {
  const latest = rotationOf(cycle)
  if (!latest) return null
  const rawHistory = cycle && typeof cycle === 'object' && Array.isArray((cycle as Record<string, unknown>).history)
    ? (cycle as Record<string, unknown>).history as unknown[]
    : []
  const entries = rawHistory
    .flatMap((entry) => {
      const rotation = rotationOf(entry)
      const until = isoDay((entry as Record<string, unknown> | null)?.until)
      return rotation && until ? [{ ...rotation, until }] : []
    })
    .sort((left, right) => left.until.localeCompare(right.until))

  const spans: DatedRotation[] = []
  let previous: string | null = null
  for (const entry of entries) {
    spans.push({ ...entry, from: previous ? nextDay(previous) : null })
    previous = entry.until
  }
  spans.push({ ...latest, from: previous ? nextDay(previous) : null, until: null })

  const index = spans.findIndex((span) => (span.from === null || span.from <= today) && (span.until === null || today <= span.until))
  const currentIndex = index === -1 ? 0 : index
  return {
    current: spans[currentIndex],
    upcoming: spans.slice(currentIndex + 1),
    earlier: spans.slice(0, currentIndex),
  }
}

const LABELS: Record<string, [string, string]> = {
  work_day: ['day', 'days'],
  work_night: ['night', 'nights'],
  off: ['off', 'off'],
}

export function patternPhrase(pattern: RotationBlock[]): string {
  return pattern
    .map((block) => {
      const [one, many] = LABELS[block.label] || [block.label, block.label]
      return `${block.duration} ${block.duration === 1 ? one : many}`
    })
    .join(', ')
}

export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
