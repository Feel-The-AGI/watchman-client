import { createBrowserClient } from '@supabase/ssr'
import { allowAuthCookieWrite, formatAuthCookie, isAuthPersistenceBlocked, type AuthCookieWriteOptions } from '@/lib/auth-session'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

function readBrowserCookies(): { name: string; value: string }[] {
  const doc = globalThis.document
  if (!doc?.cookie) return []
  const cookies: { name: string; value: string }[] = []
  for (const part of doc.cookie.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const name = trimmed.slice(0, eq)
    const raw = trimmed.slice(eq + 1)
    try {
      cookies.push({ name, value: decodeURIComponent(raw) })
    } catch {
      cookies.push({ name, value: raw })
    }
  }
  return cookies
}

/**
 * The default browser storage writes every session refresh straight back to
 * document.cookie. After Sign Out those writes are ignored so a refresh that
 * finishes late cannot put the revoked session back.
 */
function browserCookieMethods() {
  return {
    getAll() {
      return readBrowserCookies()
    },
    setAll(cookiesToSet: { name: string; value: string; options: AuthCookieWriteOptions }[]) {
      const doc = globalThis.document
      if (!doc) return
      const blocked = isAuthPersistenceBlocked()
      for (const cookie of cookiesToSet) {
        if (!allowAuthCookieWrite(cookie.name, cookie.value, blocked)) continue
        doc.cookie = formatAuthCookie(cookie.name, cookie.value, cookie.options)
      }
    },
  }
}

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured')
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey,
    { cookies: browserCookieMethods() }
  )
}

// Lazy initialization for build time
let _supabase: ReturnType<typeof createBrowserClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createClient()
    }
    return (_supabase as any)[prop]
  }
})
