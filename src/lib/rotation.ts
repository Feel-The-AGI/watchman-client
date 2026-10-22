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

/** 28-day DuPont: 4 nights, 3 off, 3 days, 1 off, 3 nights, 3 off, 4 days, 7 off. */
export const DUPONT_PATTERN: CycleBlock[] = [
  { label: 'work_night', duration: 4 },
  { label: 'off', duration: 3 },
  { label: 'work_day', duration: 3 },
  { label: 'off', duration: 1 },
  { label: 'work_night', duration: 3 },
  { label: 'off', duration: 3 },
  { label: 'work_day', duration: 4 },
  { label: 'off', duration: 7 },
]

/** 14-day Panama: 2 on, 2 off, 3 on, 2 off, 2 on, 3 off. */
export const PANAMA_PATTERN: CycleBlock[] = [
  { label: 'work_day', duration: 2 },
  { label: 'off', duration: 2 },
  { label: 'work_day', duration: 3 },
  { label: 'off', duration: 2 },
  { label: 'work_day', duration: 2 },
  { label: 'off', duration: 3 },
]

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]

function numberWordPairs(): Array<[string, number]> {
  const pairs: Array<[string, number]> = [['thirty', 30]]
  for (let value = 29; value >= 21; value -= 1) {
    const rest = ONES[value - 20]
    pairs.push([`twenty-${rest}`, value], [`twenty ${rest}`, value])
  }
  pairs.push(['twenty', 20])
  for (let value = 19; value >= 1; value -= 1) pairs.push([ONES[value], value])
  return pairs
}

const NUMBER_WORDS = numberWordPairs()

function numbered(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function replaceNumberWords(text: string): string {
  return NUMBER_WORDS.reduce(
    (current, [word, value]) => current.replace(new RegExp(`\\b${word}\\b`, 'g'), String(value)),
    text,
  )
}

function expandUnits(text: string): string {
  return text
    .replace(/(\d+)\s*fortnights?\b/g, (_, count: string) => `${numbered(count) * 14} days`)
    .replace(/\bfortnights?\b/g, '14 days')
    .replace(/(\d+)\s*weeks?\b/g, (_, count: string) => `${numbered(count) * 7} days`)
}

function describeBlocks(pattern: CycleBlock[]): string {
  return pattern.map((block) => {
    if (block.label === 'off') return `${block.duration} days off`
    if (block.label === 'work_night') return `${block.duration} night shifts`
    return `${block.duration} day shifts`
  }).join(', ')
}

function parseBlockSequence(text: string): ParsedRotation | null {
  const normalized = text.replace(/\bfollowed by\b/g, ' then ').replace(/\band then\b/g, ' then ')
  const expression = /(\d+)\s*(day shifts?|night shifts?|days? off|nights? off|days?|nights?|off)\b/g
  const pattern: CycleBlock[] = []
  for (const match of normalized.matchAll(expression)) {
    const duration = numbered(match[1])
    const kind = match[2]
    const label: ShiftLabel = /off/.test(kind) ? 'off' : /night/.test(kind) ? 'work_night' : 'work_day'
    pattern.push({ label, duration })
  }
  if (pattern.length < 2) return null
  return rotationResult(pattern, describeBlocks(pattern))
}

export type ChatRotationParse =
  | { understood: true; pattern: CycleBlock[]; description: string; totalDays: number }
  | { understood: false; message: string }

/** Marker the server uses to parse a rotation without saving the prompt to chat history. */
export const ROTATION_PARSE_MARKER = 'The user is describing their work shift rotation pattern'

export function rotationParsePrompt(userMessage: string): string {
  return `${ROTATION_PARSE_MARKER}: "${userMessage}"

Please understand this and respond in this EXACT JSON format:
{"understood": true/false, "pattern": [{"label": "work_day"/"work_night"/"off", "duration": number}], "description": "human readable summary", "message": "your response to user"}

Common patterns:
- "5 days, 5 nights, 5 off" = 5 day shifts, 5 night shifts, 5 days off
- "10 on 5 off" = 10 working days, 5 days off
- "5/5/5" = 5 days, 5 nights, 5 off
- "4 on 4 off" = 4 day shifts, 4 days off

If unclear, set understood=false and ask clarifying questions in the message field.
ONLY respond with the JSON object, nothing else.`
}

function blocksFromUnknown(value: unknown): CycleBlock[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const pattern: CycleBlock[] = []
  for (const block of value) {
    if (!block || typeof block !== 'object') return null
    const label = (block as { label?: unknown }).label
    const duration = Number((block as { duration?: unknown }).duration)
    if (label !== 'work_day' && label !== 'work_night' && label !== 'off') return null
    if (!Number.isFinite(duration) || duration <= 0 || duration > 366) return null
    pattern.push({ label, duration })
  }
  return pattern
}

export function rotationFromAssistantText(responseText: string): ChatRotationParse | null {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as { understood?: unknown; pattern?: unknown; description?: unknown; message?: unknown }
  if (record.understood) {
    const pattern = blocksFromUnknown(record.pattern)
    if (!pattern) return null
    const description = typeof record.description === 'string' && record.description.trim()
      ? record.description.trim()
      : describeBlocks(pattern)
    const result = rotationResult(pattern, description)
    if (!result) return null
    return { understood: true, ...result }
  }
  const message = typeof record.message === 'string' && record.message.trim()
    ? record.message.trim()
    : "I couldn't quite understand that pattern. Could you describe it differently? For example: '5 days, 5 nights, 5 off' or '14 on, 14 off'"
  return { understood: false, message }
}

/** Body for POST /api/chat/message during onboarding. An empty pattern is omitted. */
export function onboardingChatRequest(
  content: string,
  pattern: CycleBlock[] | null | undefined,
): { content: string; auto_execute: false; pattern?: CycleBlock[] } {
  const blocks = (pattern ?? []).filter((block) =>
    (block.label === 'work_day' || block.label === 'work_night' || block.label === 'off')
    && Number.isInteger(block.duration)
    && block.duration > 0
  )
  if (blocks.length === 0) return { content, auto_execute: false }
  return { content, auto_execute: false, pattern: blocks.map((block) => ({ label: block.label, duration: block.duration })) }
}

export function cycleLength(pattern: CycleBlock[] | null | undefined): number {
  return (pattern ?? []).reduce((sum, block) => sum + (Number.isFinite(block.duration) ? block.duration : 0), 0)
}

/**
 * Anchor values for the date picker and day slider.
 * Missing, invalid, or out-of-range anchors are ignored. Nothing is saved here.
 */
export function anchorFromChatResponse(
  response: unknown,
  pattern: CycleBlock[] | null | undefined,
): { date: string; cycle_day: number } | null {
  if (!response || typeof response !== 'object') return null
  const anchor = (response as { anchor?: unknown }).anchor
  if (!anchor || typeof anchor !== 'object') return null
  const date = (anchor as { date?: unknown }).date
  const cycleDay = (anchor as { cycle_day?: unknown }).cycle_day
  if (typeof date !== 'string' || !parseLocalDate(date)) return null
  if (typeof cycleDay !== 'number' || !Number.isInteger(cycleDay)) return null
  const length = cycleLength(pattern)
  if (cycleDay < 1 || cycleDay > length) return null
  return { date, cycle_day: cycleDay }
}

export function rotationFromChatResponse(response: unknown): ChatRotationParse | null {
  if (typeof response === 'string') return rotationFromAssistantText(response)
  if (!response || typeof response !== 'object') return null
  const record = response as Record<string, unknown>
  if ('understood' in record || 'pattern' in record) return rotationFromAssistantText(JSON.stringify(record))
  for (const key of ['response', 'message', 'content', 'text']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return rotationFromAssistantText(value)
    if (value && typeof value === 'object') return rotationFromAssistantText(JSON.stringify(value))
  }
  return null
}

/** Understand common shift phrases without sending a hidden prompt to chat history. */
export function parseRotation(input: string): ParsedRotation | null {
  const original = input.trim().toLowerCase().replace(/[–—]/g, '-')
  if (!original) return null

  if (/\bdu\s*pont\b|\bdupont\b/.test(original)) {
    return rotationResult(
      DUPONT_PATTERN,
      'DuPont schedule: 4 nights, 3 off, 3 days, 1 off, 3 nights, 3 off, 4 days, 7 off',
    )
  }

  if (/\bpanama\b/.test(original)) {
    const nights = /\bnight/.test(original)
    const pattern = PANAMA_PATTERN.map((block) => (
      nights && block.label === 'work_day' ? { ...block, label: 'work_night' as const } : block
    ))
    return rotationResult(pattern, 'Panama schedule: 2 on, 2 off, 3 on, 2 off, 2 on, 3 off')
  }

  if (/2\s*-\s*2\s*-\s*3/.test(original)) {
    return rotationResult(
      [
        { label: 'work_day', duration: 2 },
        { label: 'work_night', duration: 2 },
        { label: 'off', duration: 3 },
      ],
      '2 day shifts, 2 night shifts, 3 days off',
    )
  }

  const text = expandUnits(replaceNumberWords(original))

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

  const onOff = text.match(/(\d+)\s*(?:day shifts?|night shifts?|days?|nights?)?\s*on\s*[,/]?\s*(\d+)\s*(?:day shifts?|days?)?\s*off/)
  if (onOff) {
    const on = numbered(onOff[1])
    const off = numbered(onOff[2])
    const nights = /\bnight/.test(text)
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

  return parseBlockSequence(text)
}
