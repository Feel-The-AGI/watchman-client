export type CalendarWorkType = 'work_day' | 'work_night' | 'off' | 'blank' | null

export interface NormalizedCalendarDay {
  date: string
  cycle_day: number
  work_type: CalendarWorkType
  is_leave: boolean
  commitments: {
    id: string
    type: string
    name: string
    hours?: number
  }[]
  is_preview?: boolean
  logs?: unknown[]
  incidents?: unknown[]
  actual_hours_worked?: number
  overtime_hours?: number
  state_json?: Record<string, unknown>
}

export type CalendarCellKind = 'leave' | 'work_day' | 'work_night' | 'off' | 'blank' | 'empty'

/** Leave wins over the underlying shift. Stats already count state_json.is_leave. */
export function calendarCellKind(day: { work_type?: string | null; is_leave?: boolean } | null | undefined): CalendarCellKind {
  if (!day) return 'empty'
  if (day.is_leave) return 'leave'
  if (day.work_type === 'work_day' || day.work_type === 'work_night' || day.work_type === 'off' || day.work_type === 'blank') {
    return day.work_type
  }
  return 'empty'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseState(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return parseState(JSON.parse(value))
    } catch {
      return {}
    }
  }
  return asRecord(value) ?? {}
}

function commitmentRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map(asRecord).filter((item): item is Record<string, unknown> => item !== null)
}

function commitmentChip(raw: Record<string, unknown>): NormalizedCalendarDay['commitments'][number] | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const id = typeof raw.id === 'string'
    ? raw.id
    : typeof raw.commitment_id === 'string'
      ? raw.commitment_id
      : name
  const type = typeof raw.type === 'string' ? raw.type : ''
  const hours = typeof raw.hours === 'number' ? raw.hours : undefined
  return { id, type, name, hours }
}

/**
 * Commitments for a calendar cell and the day panel.
 * Approved rows keep the list on state_json.commitments. An empty top-level
 * array must not hide that list.
 */
export function dayCommitments(day: { commitments?: unknown; state_json?: unknown } | null | undefined): NormalizedCalendarDay['commitments'] {
  if (!day) return []
  const state = parseState(day.state_json)
  const top = commitmentRecords(day.commitments).map(commitmentChip).filter((item): item is NormalizedCalendarDay['commitments'][number] => item !== null)
  if (top.length > 0) return top
  return commitmentRecords(state.commitments).map(commitmentChip).filter((item): item is NormalizedCalendarDay['commitments'][number] => item !== null)
}

export function commitmentCellCount(day: { commitments?: unknown; state_json?: unknown } | null | undefined): number {
  return dayCommitments(day).length
}

export function dayPanelSummary(day: { work_type?: string | null; is_leave?: boolean; cycle_day?: number } | null | undefined): {
  showShiftCard: boolean
  showLeaveCard: boolean
  expectedHours: number
} {
  const leave = Boolean(day?.is_leave)
  const workType = day?.work_type
  const workingShift = workType === 'work_day' || workType === 'work_night'
  return {
    showShiftCard: !leave && Boolean(workType && workType !== 'blank'),
    showLeaveCard: leave,
    expectedHours: leave || !workingShift ? 0 : 12,
  }
}

export function normalizeCalendarDay(raw: unknown): NormalizedCalendarDay | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const date = typeof record.date === 'string' ? record.date.slice(0, 10) : ''
  if (!date) return null
  const state = parseState(record.state_json)
  const commitments = dayCommitments(record)
  const workType = record.work_type
  return {
    date,
    cycle_day: typeof record.cycle_day === 'number' ? record.cycle_day : 0,
    work_type: workType === 'work_day' || workType === 'work_night' || workType === 'off' || workType === 'blank'
      ? workType
      : null,
    is_leave: Boolean(record.is_leave ?? state.is_leave),
    commitments,
    is_preview: Boolean(record.is_preview ?? state.is_preview),
    logs: Array.isArray(record.logs) ? record.logs : Array.isArray(state.logs) ? state.logs : undefined,
    incidents: Array.isArray(record.incidents) ? record.incidents : Array.isArray(state.incidents) ? state.incidents : undefined,
    actual_hours_worked: typeof record.actual_hours_worked === 'number'
      ? record.actual_hours_worked
      : typeof state.actual_hours_worked === 'number'
        ? state.actual_hours_worked
        : undefined,
    overtime_hours: typeof record.overtime_hours === 'number'
      ? record.overtime_hours
      : typeof state.overtime_hours === 'number'
        ? state.overtime_hours
        : undefined,
    state_json: state,
  }
}

export function normalizeCalendarDays(raw: unknown): NormalizedCalendarDay[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeCalendarDay).filter((day): day is NormalizedCalendarDay => day !== null)
}
