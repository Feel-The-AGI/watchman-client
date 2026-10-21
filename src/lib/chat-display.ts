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
