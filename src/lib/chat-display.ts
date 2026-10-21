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

/** Card copy prefers the server's human explanation and never a raw tool name. */
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

/** Post-apply line. Same explanation, never "Executing add_commitment". */
export function proposalAppliedText(...sources: unknown[]): string {
  for (const source of sources) {
    const text = explanationFromCommand(commandOf(source))
    if (text) return `Done! ${text}`
  }
  return 'Done! Changes applied successfully.'
}

export function chatInputLocked(pendingProposal: unknown, isReviewing: boolean): boolean {
  return Boolean(pendingProposal) || isReviewing
}

export interface ChatListMessage {
  id: string
  role: string
  content: string
}

function sameUserText(left: ChatListMessage, right: ChatListMessage): boolean {
  return left.role === 'user' && right.role === 'user' && left.content.trim() === right.content.trim()
}

/** One saved user row wins over the optimistic copy with the same text. */
export function collapseUserEchoes<T extends ChatListMessage>(messages: T[]): T[] {
  const next: T[] = []
  for (const message of messages) {
    if (!message.id || next.some((existing) => existing.id === message.id)) continue
    if (message.role === 'user') {
      const echoIndex = next.findIndex((existing) =>
        sameUserText(existing, message)
        && (existing.id.startsWith('temp-') || message.id.startsWith('temp-'))
      )
      if (echoIndex >= 0) {
        if (next[echoIndex].id.startsWith('temp-') && !message.id.startsWith('temp-')) {
          next[echoIndex] = message
        }
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
  const withUser = user?.id ? [...base, user] : base
  const withAssistant = assistant?.id ? [...withUser, assistant] : withUser
  return collapseUserEchoes(withAssistant)
}

/** A late history payload must not sit beside the optimistic copy of a message it already stored. */
export function mergeChatHistory<T extends ChatListMessage>(local: T[], history: T[]): T[] {
  const savedIds = new Set(history.map((message) => message.id))
  const savedUserText = new Set(
    history.filter((message) => message.role === 'user').map((message) => message.content.trim()),
  )
  const pending = local.filter((message) => {
    if (savedIds.has(message.id)) return false
    if (message.role === 'user' && message.id.startsWith('temp-') && savedUserText.has(message.content.trim())) {
      return false
    }
    return true
  })
  return collapseUserEchoes([...history, ...pending])
}
