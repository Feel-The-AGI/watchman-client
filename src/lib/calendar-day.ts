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

export function normalizeCalendarDay(raw: unknown): NormalizedCalendarDay | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const date = typeof record.date === 'string' ? record.date.slice(0, 10) : ''
  if (!date) return null
  const state = record.state_json && typeof record.state_json === 'object'
    ? record.state_json as Record<string, unknown>
    : {}
  const commitments = Array.isArray(record.commitments)
    ? record.commitments
    : Array.isArray(state.commitments)
      ? state.commitments
      : []
  const workType = record.work_type
  return {
    date,
    cycle_day: typeof record.cycle_day === 'number' ? record.cycle_day : 0,
    work_type: workType === 'work_day' || workType === 'work_night' || workType === 'off' || workType === 'blank'
      ? workType
      : null,
    is_leave: Boolean(record.is_leave ?? state.is_leave),
    commitments: commitments as NormalizedCalendarDay['commitments'],
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
