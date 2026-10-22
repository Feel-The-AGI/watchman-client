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
 * Delete each auth cookie twice. A Secure cookie is only removed by a Secure
 * Set-Cookie, and a non-Secure cookie is only removed without that flag.
 * Both are sent so a shared browser cannot keep either copy.
 */
export function expiredAuthCookieHeaders(cookieHeader: string | null | undefined): string[] {
  return authCookieNamesFromHeader(cookieHeader).flatMap((name) => [
    `${name}=; Path=/; Max-Age=0; SameSite=Lax`,
    `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure`,
  ])
}

/** Browser assignments. document.cookie keeps both Secure and non-Secure deletions. */
export function browserAuthCookieExpiryLines(cookieHeader: string | null | undefined): string[] {
  return expiredAuthCookieHeaders(cookieHeader)
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
  if (typeof document === 'undefined') return
  for (const line of browserAuthCookieExpiryLines(document.cookie)) {
    document.cookie = line
  }
  if (typeof window === 'undefined') return
  clearWebStorage(window.localStorage)
  clearWebStorage(window.sessionStorage)
}
