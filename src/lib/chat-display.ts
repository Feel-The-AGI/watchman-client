const FRIENDLY_CHAT_ERROR = 'Something went wrong. Please try again.'

export function looksLikeRawPayload(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '[object Object]') return trimmed === '[object Object]'
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
    || (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return true
  }
  if ((trimmed.includes("{'") || trimmed.includes('{"')) && trimmed.includes('}')) return true
  return false
}

export function isInternalChatMessage(message: { role?: string; content?: unknown }): boolean {
  if (message.role === 'system') return true
  if (typeof message.content !== 'string') return false
  const text = message.content
  if (/exact json format/i.test(text)) return true
  if (/the user is describing their work shift rotation pattern/i.test(text)) return true
  if (/only respond with the json object/i.test(text)) return true
  if (/"understood"\s*:/.test(text) && /"pattern"\s*:/.test(text)) return true
  return false
}

function humanField(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  for (const key of ['message', 'detail', 'error', 'response']) {
    const field = record[key]
    if (typeof field === 'string') {
      const trimmed = field.trim()
      if (trimmed && !looksLikeRawPayload(trimmed) && trimmed.length <= 240) return trimmed
    }
  }
  return null
}

function tryParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/** Text safe to render in a chat bubble. Objects and JSON payloads never reach the screen. */
export function chatMessageText(content: unknown): string | null {
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (!trimmed || trimmed === '[object Object]') return trimmed ? FRIENDLY_CHAT_ERROR : null
    if (looksLikeRawPayload(trimmed)) {
      return humanField(tryParse(trimmed)) || FRIENDLY_CHAT_ERROR
    }
    return trimmed
  }
  if (content && typeof content === 'object') {
    return humanField(content) || FRIENDLY_CHAT_ERROR
  }
  if (typeof content === 'number' || typeof content === 'boolean') return String(content)
  return null
}

export function friendlyChatError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message && !error.message.includes('[object Object]') && !looksLikeRawPayload(error.message)) {
    return error.message
  }
  return fallback
}

/** Whole string is a tool invocation such as "Executing add_commitment" or "add_commitment". */
export function isRawToolText(value: string): boolean {
  const text = value.trim()
  if (/^(executing|running)\s+[a-z][a-z0-9_]*[.!]?$/i.test(text)) return true
  if (/^[a-z]+(?:_[a-z0-9]+)+$/.test(text)) return true
  return false
}

function explanationFromCommand(command: unknown): string | null {
  if (!command || typeof command !== 'object') return null
  const text = chatMessageText((command as { explanation?: unknown }).explanation)
  if (!text || isRawToolText(text)) return null
  return text
}

function commandOf(source: unknown): unknown {
  if (!source || typeof source !== 'object') return source
  if ('command' in source) return (source as { command?: unknown }).command
  return source
}

export const PROPOSAL_CARD_FALLBACK = 'Review this proposed change.'

export const REVIEW_FAILURE_MESSAGE = "That didn't go through. You can try again or send another message."

/** Card copy is the server summary in command.explanation, never a raw tool name. */
export function proposalCardText(
  proposal: { command?: { explanation?: unknown } } | null | undefined,
  messageContent?: unknown,
): string {
  const explanation = explanationFromCommand(proposal?.command)
  if (explanation) return explanation
  const content = chatMessageText(messageContent)
  if (content && !isRawToolText(content)) return content
  return PROPOSAL_CARD_FALLBACK
}

/** The model's own sentence, shown under the summary when the server sent one. */
export function proposalModelNote(
  proposal: { command?: { explanation?: unknown; model_text?: unknown } } | null | undefined,
): string | null {
  const note = proposal?.command?.model_text
  if (typeof note !== 'string' || !note.trim() || isRawToolText(note)) return null
  const main = explanationFromCommand(proposal?.command)
  if (main && note.trim() === main.trim()) return null
  return note.trim()
}

/** Post-apply line. Same explanation, never "Executing add_commitment". */
export function proposalAppliedText(...sources: unknown[]): string {
  for (const source of sources) {
    const text = explanationFromCommand(commandOf(source))
    if (text) return `Done! ${text}`
  }
  return 'Done! Changes applied successfully.'
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function commandRecord(source: unknown): Record<string, unknown> | null {
  if (!source || typeof source !== 'object') return null
  const record = source as Record<string, unknown>
  if (record.command && typeof record.command === 'object') return record.command as Record<string, unknown>
  return record
}

function payloadRecord(source: unknown): Record<string, unknown> | null {
  const command = commandRecord(source)
  const payload = command?.payload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  return payload as Record<string, unknown>
}

function clockLabel(value: unknown): string {
  if (typeof value !== 'string') return ''
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function localDay(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const local = new Date(year, month - 1, day)
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) return null
  return local
}

/**
 * Past-tense Apply line for add_commitment and add_leave.
 * Other actions keep the older Done line. The future-tense explanation is not used.
 */
export function appliedConfirmation(proposal: unknown): string | null {
  const actionValue = commandRecord(proposal)?.action
  const action = typeof actionValue === 'string' ? actionValue : ''
  if (action !== 'add_commitment' && action !== 'add_leave') return null
  const payload = payloadRecord(proposal)
  if (!payload) return null
  const startDay = localDay(typeof payload.start_date === 'string' ? payload.start_date : payload.date)
  if (!startDay) return null
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const label = action === 'add_leave'
    ? (name && !['leave', 'other'].includes(name.toLowerCase()) ? name : 'Leave')
    : name
  if (!label) return null
  if (action === 'add_leave') {
    const endDay = localDay(payload.end_date)
    if (endDay && endDay.getTime() !== startDay.getTime()) {
      const sameMonth = endDay.getFullYear() === startDay.getFullYear() && endDay.getMonth() === startDay.getMonth()
      const startText = sameMonth
        ? `${WEEKDAY_LABELS[startDay.getDay()]} ${startDay.getDate()}`
        : `${WEEKDAY_LABELS[startDay.getDay()]} ${startDay.getDate()} ${MONTH_LABELS[startDay.getMonth()]}`
      const endText = `${WEEKDAY_LABELS[endDay.getDay()]} ${endDay.getDate()} ${MONTH_LABELS[endDay.getMonth()]}`
      return `Added: ${label}, ${startText} – ${endText}`
    }
  }
  const when = `${WEEKDAY_LABELS[startDay.getDay()]} ${startDay.getDate()} ${MONTH_LABELS[startDay.getMonth()]}`
  const start = clockLabel(payload.time_start)
  const end = clockLabel(payload.time_end)
  const clock = start && end ? `${start}-${end}` : start
  return clock ? `Added: ${label} on ${when}, ${clock}.` : `Added: ${label} on ${when}.`
}

function translateToolName(name: string): string {
  if (name.toLowerCase() === 'add_leave') return 'Adding leave'
  if (name.toLowerCase() === 'add_commitment') return 'Adding a commitment'
  return 'Updating your calendar'
}

/** Display-only cleanup for assistant text. Stored messages stay as they are. */
export function sanitizeChatDisplay(content: unknown): string | null {
  const text = chatMessageText(content)
  if (!text) return null
  if (isRawToolText(text)) {
    const name = text.replace(/^(?:executing|running)\s+/i, '').replace(/[.!]$/, '')
    const sentence = translateToolName(name)
    return sentence.endsWith('.') ? sentence : `${sentence}.`
  }
  return text.replace(
    /\b(?:executing|running)\s+(add_commitment|add_leave)\b[.!?]?/gi,
    (_, name: string) => translateToolName(name),
  )
}

export type ChatTextPart =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'em'; text: string }
  | { kind: 'code'; text: string }

/** Assistant markdown as text parts. Angle brackets stay in the text; React escapes them. */
export function chatTextParts(content: unknown): ChatTextPart[] {
  const source = sanitizeChatDisplay(content)
  if (!source) return []
  const parts: ChatTextPart[] = []
  let buffer = ''
  const flush = () => {
    if (!buffer) return
    parts.push({ kind: 'text', text: buffer })
    buffer = ''
  }
  for (let index = 0; index < source.length; index += 1) {
    if (source.startsWith('**', index)) {
      const end = source.indexOf('**', index + 2)
      if (end > index + 2) {
        flush()
        parts.push({ kind: 'bold', text: source.slice(index + 2, end) })
        index = end + 1
        continue
      }
    }
    if (source[index] === '`') {
      const end = source.indexOf('`', index + 1)
      if (end > index + 1) {
        flush()
        parts.push({ kind: 'code', text: source.slice(index + 1, end) })
        index = end
        continue
      }
    }
    if (source[index] === '*' && source[index + 1] !== '*') {
      const end = source.indexOf('*', index + 1)
      if (end > index + 1) {
        flush()
        parts.push({ kind: 'em', text: source.slice(index + 1, end) })
        index = end
        continue
      }
    }
    buffer += source[index]
  }
  flush()
  return parts
}

/** User text is shown as typed. Markdown and tool-name cleanup apply to assistant text only. */
export function displayedChatParts(role: string, content: unknown): ChatTextPart[] {
  if (role === 'user') {
    return typeof content === 'string' && content.length > 0 ? [{ kind: 'text', text: content }] : []
  }
  return chatTextParts(content)
}

/** Distance from the top of the chat scroller to the newest message. */
export function chatScrollTop(scrollHeight: number, clientHeight: number): number {
  if (!Number.isFinite(scrollHeight) || !Number.isFinite(clientHeight)) return 0
  return Math.max(0, scrollHeight - clientHeight)
}

/** History should jump to the end. Later messages can animate. */
export function chatScrollBehavior(historySettled: boolean): ScrollBehavior {
  return historySettled ? 'smooth' : 'auto'
}

/** A review click can disable the buttons. A waiting card must not block typing. */
export function chatInputLocked(_pendingProposal: unknown, isReviewing: boolean): boolean {
  return isReviewing
}

type ProposalRecord = {
  id?: string
  message_id?: string
  created_at?: string
  command?: {
    action?: string
    payload?: { work_type?: unknown }
  }
}

function proposalRecord(proposal: unknown): ProposalRecord | null {
  if (!proposal || typeof proposal !== 'object') return null
  return proposal as ProposalRecord
}

const CLEAR_DAYS_WORD = /\b(blank|clear|untrack)(?:s|ed|ing)?\b/i

/** Whole words in the user's message. "unclear" and "clearly" do not count. */
export function userAskedToClearDays(text: string): boolean {
  return CLEAR_DAYS_WORD.test(text)
}

type ChatTurn = { id?: string; role?: string; content?: string }

function isBlankDaysOverride(proposal: unknown): boolean {
  const record = proposalRecord(proposal)
  return Boolean(record?.id)
    && record?.command?.action === 'override_days'
    && record?.command?.payload?.work_type === 'blank'
}

/**
 * show: the user asked for it.
 * decline: history loaded and the source message is an onboarding prompt or a user
 * message that does not ask to clear days.
 * hide: keep it pending, but do not show the card.
 */
export function blankDaysProposalFate(
  proposal: unknown,
  rawHistory: ChatTurn[],
  historyLoaded: boolean,
): 'show' | 'hide' | 'decline' {
  if (!isBlankDaysOverride(proposal)) return 'show'
  if (!historyLoaded) return 'hide'
  const record = proposalRecord(proposal)
  const source = rawHistory.find((message) => message.id && message.id === record?.message_id)
  if (!source) return 'hide'
  if (isInternalChatMessage(source)) return 'decline'
  const text = typeof source.content === 'string' ? source.content : ''
  if (source.role === 'user' && !userAskedToClearDays(text)) return 'decline'
  if (source.role === 'user' && userAskedToClearDays(text)) return 'show'
  return 'hide'
}

export function blankDaysProposalIdsToDecline(
  proposals: unknown[] | null | undefined,
  rawHistory: ChatTurn[],
  historyLoaded: boolean,
): string[] {
  const ids: string[] = []
  for (const proposal of proposals || []) {
    const record = proposalRecord(proposal)
    if (record?.id && blankDaysProposalFate(proposal, rawHistory, historyLoaded) === 'decline') ids.push(record.id)
  }
  return ids
}

/** Newest by created_at. The pending list itself is oldest first. */
export function newestVisibleProposal<T>(
  proposals: T[] | null | undefined,
  rawHistory: ChatTurn[],
  historyLoaded = true,
): T | null {
  const visible = (proposals || []).filter((proposal) => {
    const record = proposalRecord(proposal)
    return Boolean(record?.id) && blankDaysProposalFate(proposal, rawHistory, historyLoaded) === 'show'
  })
  if (visible.length === 0) return null
  return [...visible].sort((left, right) => {
    const leftAt = proposalRecord(left)?.created_at || ''
    const rightAt = proposalRecord(right)?.created_at || ''
    return rightAt.localeCompare(leftAt)
  })[0]
}

export function stalePendingCards<T extends { isProposal?: boolean; proposal?: unknown }>(messages: T[]): T[] {
  return messages.map((message) => (message.proposal ? { ...message, isProposal: false } : message))
}

export interface ChatListMessage {
  id: string
  role: string
  content: string
}

/** A saved user row replaces only a temporary row that appears before it. */
export function collapseUserEchoes<T extends ChatListMessage>(messages: T[]): T[] {
  const next: T[] = []
  for (const message of messages) {
    if (!message.id || next.some((existing) => existing.id === message.id)) continue
    if (message.role === 'user' && !message.id.startsWith('temp-')) {
      const echoIndex = next.findIndex((existing) =>
        existing.role === 'user'
        && existing.id.startsWith('temp-')
        && existing.content.trim() === message.content.trim()
      )
      if (echoIndex >= 0) {
        next[echoIndex] = message
        continue
      }
    }
    next.push(message)
  }
  return next
}

/**
 * Reply after Send. The optimistic row and the saved user row are the same message.
 * The proposal card is the assistant turn, not a second copy of the user text.
 */
export function messagesAfterSend<T extends ChatListMessage>(
  current: T[],
  optimisticId: string,
  user: T | null | undefined,
  assistant: T | null | undefined,
): T[] {
  const base = user?.id ? current.filter((message) => message.id !== optimisticId) : current
  const withUser = user?.id && !base.some((message) => message.id === user.id) ? [...base, user] : base
  const withAssistant = assistant?.id && !withUser.some((message) => message.id === assistant.id)
    ? [...withUser, assistant]
    : withUser
  return collapseUserEchoes(withAssistant)
}

/** A late history payload must not sit beside the optimistic copy of a message it already stored. */
export function mergeChatHistory<T extends ChatListMessage>(local: T[], history: T[]): T[] {
  const savedIds = new Set(history.map((message) => message.id))
  const newestSavedUser = [...history].reverse().find((message) => message.role === 'user')
  const pending = local.filter((message) => {
    if (savedIds.has(message.id)) return false
    if (
      message.role === 'user'
      && message.id.startsWith('temp-')
      && newestSavedUser
      && message.content.trim() === newestSavedUser.content.trim()
    ) {
      return false
    }
    return true
  })
  return collapseUserEchoes([...history, ...pending])
}
