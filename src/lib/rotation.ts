export type ShiftLabel = 'work_day' | 'work_night' | 'off'

export interface CycleBlock {
  label: ShiftLabel
  duration: number
}

export interface RotationPreset {
  name: string
  description: string
  pattern: CycleBlock[]
}

export interface ParsedRotation {
  pattern: CycleBlock[]
  description: string
  totalDays: number
}

export interface PreviewCell {
  key: string
  day: number | null
  iso: string | null
  workType: ShiftLabel | null
}

export const ROTATION_PRESETS: RotationPreset[] = [
  {
    name: '14/14',
    description: '14 days on, 14 days off',
    pattern: [
      { label: 'work_day', duration: 14 },
      { label: 'off', duration: 14 },
    ],
  },
  {
    name: '21/7',
    description: '21 days on, 7 days off',
    pattern: [
      { label: 'work_day', duration: 21 },
      { label: 'off', duration: 7 },
    ],
  },
  {
    name: '28/28',
    description: '28 days on, 28 days off',
    pattern: [
      { label: 'work_day', duration: 28 },
      { label: 'off', duration: 28 },
    ],
  },
  {
    name: '2-2-3',
    description: '2 day shifts, 2 night shifts, 3 days off',
    pattern: [
      { label: 'work_day', duration: 2 },
      { label: 'work_night', duration: 2 },
      { label: 'off', duration: 3 },
    ],
  },
  {
    name: '4 on / 4 off',
    description: '4 day shifts, 4 days off',
    pattern: [
      { label: 'work_day', duration: 4 },
      { label: 'off', duration: 4 },
    ],
  },
  {
    name: '5-5-5',
    description: '5 day shifts, 5 night shifts, 5 days off',
    pattern: [
      { label: 'work_day', duration: 5 },
      { label: 'work_night', duration: 5 },
      { label: 'off', duration: 5 },
    ],
  },
]

export function totalCycleDays(pattern: CycleBlock[]): number {
  return pattern.reduce((sum, block) => sum + Math.max(0, block.duration), 0)
}

/** Parse YYYY-MM-DD as a local calendar date. `new Date('YYYY-MM-DD')` is UTC and shifts the day. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function calendarDayDiff(date: Date, anchor: Date): number {
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const utcAnchor = Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  return Math.round((utcDate - utcAnchor) / 86400000)
}

export function workTypeForCycleDay(pattern: CycleBlock[], cycleDay: number): ShiftLabel {
  const total = totalCycleDays(pattern)
  if (total <= 0) return 'off'
  const normalized = ((Math.trunc(cycleDay) - 1) % total + total) % total + 1
  let cursor = 0
  for (const block of pattern) {
    cursor += block.duration
    if (normalized <= cursor) return block.label
  }
  return 'off'
}

export function buildMonthPreview(
  pattern: CycleBlock[],
  anchorDate: string,
  anchorCycleDay: number,
): { label: string; cells: PreviewCell[] } | null {
  const anchor = parseLocalDate(anchorDate)
  if (!anchor || pattern.length === 0 || !Number.isFinite(anchorCycleDay) || anchorCycleDay < 1) return null

  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  const cells: PreviewCell[] = []

  for (let index = 0; index < leading; index += 1) {
    cells.push({ key: `blank-${index}`, day: null, iso: null, workType: null })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    const cycleDay = anchorCycleDay + calendarDayDiff(date, anchor)
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      key: iso,
      day,
      iso,
      workType: workTypeForCycleDay(pattern, cycleDay),
    })
  }

  const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { label, cells }
}

function rotationResult(pattern: CycleBlock[], description: string): ParsedRotation | null {
  const usable = pattern.filter((block) => block.duration > 0)
  const totalDays = totalCycleDays(usable)
  if (usable.length === 0 || totalDays <= 0 || totalDays > 366) return null
  return { pattern: usable, description, totalDays }
}

function numbered(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Understand common shift phrases without sending a hidden prompt to chat history. */
export function parseRotation(input: string): ParsedRotation | null {
  const text = input.trim().toLowerCase().replace(/[–—]/g, '-')
  if (!text) return null

  if (/2\s*-\s*2\s*-\s*3/.test(text)) {
    return rotationResult(
      [
        { label: 'work_day', duration: 2 },
        { label: 'work_night', duration: 2 },
        { label: 'off', duration: 3 },
      ],
      '2 day shifts, 2 night shifts, 3 days off',
    )
  }

  const threeSlash = text.match(/^(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)$/)
  if (threeSlash) {
    const days = numbered(threeSlash[1])
    const nights = numbered(threeSlash[2])
    const off = numbered(threeSlash[3])
    return rotationResult(
      [
        { label: 'work_day', duration: days },
        { label: 'work_night', duration: nights },
        { label: 'off', duration: off },
      ],
      `${days} day shifts, ${nights} night shifts, ${off} days off`,
    )
  }

  const threeWords = text.match(/(\d+)\s*days?\s*(?:,|and)?\s*(\d+)\s*nights?\s*(?:,|and)?\s*(\d+)\s*(?:days?\s*)?off/)
  if (threeWords) {
    const days = numbered(threeWords[1])
    const nights = numbered(threeWords[2])
    const off = numbered(threeWords[3])
    return rotationResult(
      [
        { label: 'work_day', duration: days },
        { label: 'work_night', duration: nights },
        { label: 'off', duration: off },
      ],
      `${days} day shifts, ${nights} night shifts, ${off} days off`,
    )
  }

  const onOff = text.match(/(\d+)\s*(?:days?|nights?)?\s*on\s*[,/]?\s*(\d+)\s*(?:days?)?\s*off/)
  if (onOff) {
    const on = numbered(onOff[1])
    const off = numbered(onOff[2])
    const nights = /\bnights?\b/.test(text)
    return rotationResult(
      [
        { label: nights ? 'work_night' : 'work_day', duration: on },
        { label: 'off', duration: off },
      ],
      nights ? `${on} night shifts, ${off} days off` : `${on} days on, ${off} days off`,
    )
  }

  const twoSlash = text.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (twoSlash) {
    const on = numbered(twoSlash[1])
    const off = numbered(twoSlash[2])
    return rotationResult(
      [
        { label: 'work_day', duration: on },
        { label: 'off', duration: off },
      ],
      `${on} days on, ${off} days off`,
    )
  }

  return null
}
