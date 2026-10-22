import { NextResponse } from 'next/server'
import { expiredAuthCookieHeaders, SIGNED_OUT_PATH } from '@/lib/auth-session'

/**
 * The browser has already asked Supabase to revoke the session. This response
 * expires whatever auth cookies are still on the request, then opens /login.
 * Middleware treats a later /dashboard request with none of those cookies as
 * signed out and redirects it to /login as well.
 */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL(SIGNED_OUT_PATH, request.url), 303)
  for (const header of expiredAuthCookieHeaders(request.headers.get('cookie'))) {
    response.headers.append('Set-Cookie', header)
  }
  return response
}
