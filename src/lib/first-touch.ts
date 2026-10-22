export const FIRST_TOUCH_STORAGE_KEY = 'wm_first_touch'
export const FIRST_TOUCH_MAX_LENGTH = 100

const TRACKED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'] as const

type TrackedParam = (typeof TRACKED_PARAMS)[number]

export interface FirstTouch {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  ref?: string
  landing_path: string
  referrer_host: string | null
  captured_at: string
}

export interface FirstTouchStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function browserFirstTouchStorage(): FirstTouchStorage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function capTouchString(value: string): string {
  return value.length > FIRST_TOUCH_MAX_LENGTH ? value.slice(0, FIRST_TOUCH_MAX_LENGTH) : value
}

/** Paths whose next segment is a secret. `/shared/<code>` is the only one in this app. */
const TOKEN_PATH_PREFIXES = ['/shared']

export function publicLandingPath(pathname: string): string {
  const normalized = pathname && pathname.startsWith('/') ? pathname : `/${pathname || ''}`
  const path = (normalized.split(/[?#]/, 1)[0] ?? '').replace(/\/{2,}/g, '/')
  for (const prefix of TOKEN_PATH_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return prefix
  }
  return capTouchString(path || '/')
}

export function referrerHost(referrer: string): string | null {
  if (!referrer) return null
  try {
    const host = new URL(referrer).host
    return host ? capTouchString(host) : null
  } catch {
    return null
  }
}

export function firstTouchFromLocation(input: {
  search: string
  pathname: string
  referrer: string
  capturedAt: string
}): FirstTouch | null {
  const params = new URLSearchParams(input.search)
  const tracked: Partial<Record<TrackedParam, string>> = {}
  for (const key of TRACKED_PARAMS) {
    const raw = params.get(key)
    if (!raw) continue
    tracked[key] = capTouchString(raw)
  }
  if (Object.keys(tracked).length === 0) return null
  return {
    ...tracked,
    landing_path: publicLandingPath(input.pathname),
    referrer_host: referrerHost(input.referrer),
    captured_at: input.capturedAt,
  }
}

function parsedObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function cappedKnownString(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  return capTouchString(value)
}

/** Known fields only. Extra JSON keys are dropped, and every string is capped. */
export function rebuildFirstTouch(value: unknown): FirstTouch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const touch: FirstTouch = {
    landing_path: publicLandingPath(typeof record.landing_path === 'string' ? record.landing_path : '/'),
    referrer_host: cappedKnownString(record.referrer_host),
    captured_at: typeof record.captured_at === 'string' && Number.isFinite(Date.parse(record.captured_at)) ? capTouchString(record.captured_at) : '',
  }
  let hasTrackedParam = false
  for (const key of TRACKED_PARAMS) {
    const capped = cappedKnownString(record[key])
    if (!capped) continue
    touch[key] = capped
    hasTrackedParam = true
  }
  if (!hasTrackedParam) return null
  return touch
}

/** Read a saved first touch. Storage failures return null and never throw. */
export function readFirstTouch(storage: FirstTouchStorage | null): FirstTouch | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(FIRST_TOUCH_STORAGE_KEY)
    if (!raw) return null
    return rebuildFirstTouch(parsedObject(raw))
  } catch {
    return null
  }
}

/**
 * Save the first visit that carries a source param. An existing record wins.
 * Storage failures are ignored.
 */
export function captureFirstTouch(input: {
  search: string
  pathname: string
  referrer: string
  capturedAt?: string
  storage: FirstTouchStorage | null
}): FirstTouch | null {
  if (!input.storage) return null
  try {
    const existingRaw = input.storage.getItem(FIRST_TOUCH_STORAGE_KEY)
    const existing = existingRaw ? rebuildFirstTouch(parsedObject(existingRaw)) : null
    if (existing) return existing
  } catch {
    return null
  }

  const next = firstTouchFromLocation({
    search: input.search,
    pathname: input.pathname,
    referrer: input.referrer,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  })
  if (!next) return null
  try {
    input.storage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(next))
    return next
  } catch {
    return null
  }
}

/** Metadata for a new email/password account. Name is always sent. */
export function emailSignupData(name: string, storage: FirstTouchStorage | null): { name: string; first_touch?: FirstTouch } {
  const touch = readFirstTouch(storage)
  return touch ? { name, first_touch: touch } : { name }
}

/** Metadata for a magic-link call that may create a user. Omitted when there is no record. */
export function magicLinkSignupData(storage: FirstTouchStorage | null): { first_touch: FirstTouch } | undefined {
  const touch = readFirstTouch(storage)
  return touch ? { first_touch: touch } : undefined
}

export const OAUTH_BACKFILL_WINDOW_MS = 10 * 60 * 1000
export const OAUTH_BACKFILL_STORAGE_PREFIX = 'wm_first_touch_backfill:'

export interface OAuthBackfillUser {
  id: string
  created_at?: string | null
  app_metadata?: { provider?: string | null } | null
  identities?: { provider?: string | null }[] | null
  user_metadata?: Record<string, unknown> | null
}

export interface BackfillAttemptStore {
  has: (key: string) => boolean
  add: (key: string) => void
}

export function shouldBackfillOAuthFirstTouch(user: OAuthBackfillUser, now: number): boolean {
  if (user.user_metadata?.first_touch != null) return false
  const providers = [
    user.app_metadata?.provider,
    ...(user.identities ?? []).map((identity) => identity.provider),
  ]
  if (!providers.includes('google')) return false
  if (!user.created_at) return false
  const created = Date.parse(user.created_at)
  if (!Number.isFinite(created)) return false
  return created >= now - OAUTH_BACKFILL_WINDOW_MS
}

/** One update payload, or null when this session must not tag the account. */
export function oauthFirstTouchBackfill(input: {
  user: OAuthBackfillUser
  now: number
  touch: FirstTouch | null
  attempted: BackfillAttemptStore
}): { data: { first_touch: FirstTouch } } | null {
  if (!input.touch || !shouldBackfillOAuthFirstTouch(input.user, input.now)) return null
  const key = `${OAUTH_BACKFILL_STORAGE_PREFIX}${input.user.id}`
  if (input.attempted.has(key)) return null
  input.attempted.add(key)
  return { data: { first_touch: input.touch } }
}
