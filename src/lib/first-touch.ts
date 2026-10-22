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
  const path = input.pathname || '/'
  return {
    ...tracked,
    landing_path: capTouchString(path),
    referrer_host: referrerHost(input.referrer),
    captured_at: input.capturedAt,
  }
}

function storedRecord(raw: string): FirstTouch | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as FirstTouch
  } catch {
    return null
  }
}

/** Read a saved first touch. Storage failures return null and never throw. */
export function readFirstTouch(storage: FirstTouchStorage | null): FirstTouch | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(FIRST_TOUCH_STORAGE_KEY)
    if (!raw) return null
    return storedRecord(raw)
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
    if (existingRaw && storedRecord(existingRaw)) return storedRecord(existingRaw)
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
