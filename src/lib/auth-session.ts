import type { AuthNavChoice } from '@/lib/signup-flow'

/** Full navigation target after Sign Out. `/` keeps a signed-in visitor on the landing page. */
export const SIGNED_OUT_PATH = '/login'

/** Server route that expires auth cookies on the response, then redirects to the login form. */
export const SIGN_OUT_ENDPOINT = '/auth/signout'

let signOutNavigationPending = false

/** True while this tab is leaving the signed-in app, so a soft redirect cannot restore the session. */
export function markSignOutNavigationPending(): void {
  signOutNavigationPending = true
}

export function isSignOutNavigationPending(): boolean {
  return signOutNavigationPending
}

/**
 * Supabase stores the browser session under `sb-<project>-auth-token`, with
 * chunk suffixes when the value is large, plus the PKCE verifier. A second
 * project cookie is a second account left in the same browser.
 */
export function isSupabaseAuthStorageKey(name: string): boolean {
  if (name === 'supabase.auth.token') return true
  return name.startsWith('sb-') && name.includes('-auth-token')
}

export function authCookieNamesFromHeader(cookieHeader: string | null | undefined): string[] {
  if (!cookieHeader) return []
  const names: string[] = []
  for (const part of cookieHeader.split(';')) {
    const name = part.split('=')[0]?.trim() ?? ''
    if (name && isSupabaseAuthStorageKey(name) && !names.includes(name)) {
      names.push(name)
    }
  }
  return names
}

/**
 * Supabase numbers chunk cookies `name.0`, `name.1`, … The browser client probes
 * the first five. Expire a few more so a chunk written after the request was
 * built is still cleared by the response.
 */
const AUTH_COOKIE_CHUNK_SLOTS = 8

let authPersistenceBlocked = false

/** Sign Out sets this before the client can write the session back. */
export function blockAuthPersistence(): void {
  authPersistenceBlocked = true
}

export function isAuthPersistenceBlocked(): boolean {
  return authPersistenceBlocked
}

/** A deletion has an empty value and must still be written. A session write must not. */
export function allowAuthCookieWrite(name: string, value: string, persistenceBlocked: boolean): boolean {
  if (!persistenceBlocked || !value) return true
  return !isSupabaseAuthStorageKey(name)
}

export function supabaseProjectRef(supabaseUrl: string | null | undefined): string | null {
  if (!supabaseUrl) return null
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0]
    if (!ref) return null
    return ref
  } catch {
    return null
  }
}

/** `sb-<ref>-auth-token.0` and the code verifier share one base name. */
export function authCookieBaseName(name: string): string | null {
  if (name === 'supabase.auth.token') return name
  if (!isSupabaseAuthStorageKey(name)) return null
  return name.replace(/-code-verifier$/, '').replace(/\.\d+$/, '')
}

/**
 * Every auth cookie Sign Out expires. Seen names grow into the whole chunk
 * family, and the project ref covers a cookie that was not on the request.
 */
export function authCookieNamesToExpire(cookieHeader: string | null | undefined, projectRef?: string | null): string[] {
  const bases = new Set<string>()
  const legacy: string[] = []
  if (projectRef) bases.add(`sb-${projectRef}-auth-token`)
  for (const name of authCookieNamesFromHeader(cookieHeader)) {
    const base = authCookieBaseName(name)
    if (!base) continue
    if (base === 'supabase.auth.token') legacy.push(base)
    else bases.add(base)
  }
  const names: string[] = []
  for (const base of bases) {
    names.push(base, `${base}-code-verifier`)
    for (let i = 0; i < AUTH_COOKIE_CHUNK_SLOTS; i += 1) names.push(`${base}.${i}`)
  }
  for (const name of legacy) {
    if (!names.includes(name)) names.push(name)
  }
  return names
}

/**
 * Delete each auth cookie twice. A Secure cookie is only removed by a Secure
 * Set-Cookie, and a non-Secure cookie is only removed without that flag.
 * Both are sent so a shared browser cannot keep either copy.
 */
export function expiredAuthCookieHeaders(cookieHeader: string | null | undefined, projectRef?: string | null): string[] {
  return authCookieNamesToExpire(cookieHeader, projectRef).flatMap((name) => [
    `${name}=; Path=/; Max-Age=0; SameSite=Lax`,
    `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure`,
  ])
}

/** Browser assignments. document.cookie keeps both Secure and non-Secure deletions. */
export function browserAuthCookieExpiryLines(cookieHeader: string | null | undefined, projectRef?: string | null): string[] {
  return expiredAuthCookieHeaders(cookieHeader, projectRef)
}

export interface AuthCookieWriteOptions {
  path?: string
  domain?: string
  maxAge?: number
  expires?: Date
  secure?: boolean
  sameSite?: boolean | string
}

/** Same attribute order as the cookie package, which is what @supabase/ssr writes. */
export function formatAuthCookie(name: string, value: string, options?: AuthCookieWriteOptions): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  if (typeof options?.maxAge === 'number' && Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`)
  }
  if (options?.domain) parts.push(`Domain=${options.domain}`)
  if (options?.path) parts.push(`Path=${options.path}`)
  if (options?.expires instanceof Date && !Number.isNaN(options.expires.valueOf())) {
    parts.push(`Expires=${options.expires.toUTCString()}`)
  }
  if (options?.secure) parts.push('Secure')
  const sameSite = sameSiteAttribute(options?.sameSite)
  if (sameSite) parts.push(sameSite)
  return parts.join('; ')
}

function sameSiteAttribute(value: boolean | string | undefined): string | null {
  if (value === true) return 'SameSite=Strict'
  if (typeof value !== 'string') return null
  const lower = value.toLowerCase()
  if (lower === 'lax') return 'SameSite=Lax'
  if (lower === 'strict') return 'SameSite=Strict'
  if (lower === 'none') return 'SameSite=None'
  return null
}

/** What remains after Sign Out expires auth cookies and drops auth storage keys. */
export function authStateAfterSignOut(state: {
  cookieHeader: string
  storageKeys: string[]
  projectRef?: string | null
}): { cookieNames: string[]; storageKeys: string[] } {
  const expire = new Set(authCookieNamesToExpire(state.cookieHeader, state.projectRef))
  const removedStorage = new Set(signedOutStorageKeys(state.storageKeys))
  return {
    cookieNames: authCookieNamesFromHeader(state.cookieHeader).filter((name) => !expire.has(name)),
    storageKeys: state.storageKeys.filter((key) => !removedStorage.has(key)),
  }
}

export function supabaseAuthStorageKeys(keys: Iterable<string>): string[] {
  return [...keys].filter((key) => isSupabaseAuthStorageKey(key))
}

/** Profile and app leftovers, separate from the Supabase auth token itself. */
export function isAppCacheKey(key: string): boolean {
  return key.startsWith('watchman_')
}

/** localStorage and sessionStorage keys Sign Out removes. */
export function signedOutStorageKeys(keys: Iterable<string>): string[] {
  return [...keys].filter((key) => isSupabaseAuthStorageKey(key) || isAppCacheKey(key))
}

export function requestHasAuthSessionCookie(cookieHeader: string | null | undefined): boolean {
  return authCookieNamesFromHeader(cookieHeader).length > 0
}

/** Where middleware sends a request that has no Supabase session. */
export function signedOutRedirect(pathname: string, hasSession: boolean): string | null {
  if (hasSession) return null
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return SIGNED_OUT_PATH
  return null
}

export interface DashboardAuthError {
  name?: string
  status?: number
  message?: string
  code?: string
}

/** What the dashboard proxy does with one getUser() result. */
export type DashboardAuthDecision = 'allow' | 'redirect-and-clear' | 'pass-through' | 'redirect'

/**
 * A valid user stays on the dashboard. Status 400, 401, or 403, or an explicit
 * dead-session code, redirects to /login and deletes the auth cookies. A 429,
 * 5xx, network failure, or missing Supabase env leaves the request alone.
 * No auth cookie still redirects.
 */
export function dashboardAuthDecision(check: {
  hasAuthCookie: boolean
  user: unknown
  error?: DashboardAuthError | null
  envMissing?: boolean
}): DashboardAuthDecision {
  if (check.envMissing) return 'pass-through'
  if (!check.hasAuthCookie) return 'redirect'
  if (check.user) return 'allow'
  if (isRejectedSession(check.error)) return 'redirect-and-clear'
  return 'pass-through'
}

const REJECTED_SESSION_CODES = new Set([
  'session_not_found',
  'session_expired',
  'bad_jwt',
  'invalid_jwt',
  'refresh_token_not_found',
  'refresh_token_already_used',
])

export type VerifiedSessionDecision = 'valid' | 'invalid' | 'unreachable'

/**
 * A server-confirmed user is signed in. A rejected session is signed out.
 * A network failure keeps whatever session was already on the device.
 */
export function verifiedSessionDecision(check: {
  localUser: unknown
  user: unknown
  error?: DashboardAuthError | null
}): VerifiedSessionDecision {
  if (check.user) return 'valid'
  if (isRejectedSession(check.error)) return 'invalid'
  if (check.error) return 'unreachable'
  return 'invalid'
}

/** Home nav while getUser() is still running stays on the placeholder. */
export function navChoiceAfterUserCheck(input: {
  checked: boolean
  localUser: unknown
  user: unknown
  error?: DashboardAuthError | null
}): AuthNavChoice {
  if (!input.checked) return 'pending'
  const decision = verifiedSessionDecision(input)
  if (decision === 'valid') return 'in'
  if (decision === 'unreachable' && input.localUser) return 'in'
  return 'out'
}

function isRejectedSession(error: DashboardAuthError | null | undefined): boolean {
  if (!error) return false
  const status = typeof error.status === 'number' ? error.status : undefined
  if (status === 429 || (status !== undefined && status >= 500)) return false
  if (status === 400 || status === 401 || status === 403) return true
  if (error.name === 'AuthSessionMissingError') return true
  const code = (error.code || '').toLowerCase()
  if (REJECTED_SESSION_CODES.has(code)) return true
  const message = (error.message || '').toLowerCase()
  return message.includes('invalid jwt')
    || message.includes('jwt expired')
    || message.includes('invalid refresh token')
}

function clearWebStorage(storage: Storage | undefined): void {
  if (!storage) return
  try {
    for (const key of signedOutStorageKeys(Object.keys(storage))) {
      storage.removeItem(key)
    }
  } catch {
    // Storage can throw in private mode. The cookie clear still runs.
  }
}

/** Drop Supabase auth cookies and any leftover auth keys in web storage. */
export function clearSupabaseBrowserSession(): void {
  const doc = globalThis.document
  if (!doc) return
  const projectRef = supabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
  for (const line of browserAuthCookieExpiryLines(doc.cookie, projectRef)) {
    doc.cookie = line
  }
  const win = globalThis.window
  if (!win) return
  clearWebStorage(win.localStorage)
  clearWebStorage(win.sessionStorage)
}
