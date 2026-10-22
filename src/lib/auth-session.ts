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
 * One deletion per cookie, without Secure. That matches how this app stores
 * the session. A second Secure header for the same name can be collapsed by
 * the response cookie map and then fail to delete the real cookie.
 */
export function expiredAuthCookieHeaders(cookieHeader: string | null | undefined): string[] {
  return authCookieNamesFromHeader(cookieHeader).map(
    (name) => `${name}=; Path=/; Max-Age=0; SameSite=Lax`,
  )
}

/** Browser assignments. Secure is attempted as well, because document.cookie keeps both. */
export function browserAuthCookieExpiryLines(cookieHeader: string | null | undefined): string[] {
  return expiredAuthCookieHeaders(cookieHeader).flatMap((line) => [line, `${line}; Secure`])
}

export function supabaseAuthStorageKeys(keys: Iterable<string>): string[] {
  return [...keys].filter((key) => isSupabaseAuthStorageKey(key))
}

function clearWebStorage(storage: Storage | undefined): void {
  if (!storage) return
  try {
    for (const key of supabaseAuthStorageKeys(Object.keys(storage))) {
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
