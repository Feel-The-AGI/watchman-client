import { NextResponse } from 'next/server'
import { expiredAuthCookieHeaders, SIGNED_OUT_PATH } from '@/lib/auth-session'

/**
 * The browser has already asked Supabase to revoke the session. This response
 * expires whatever auth cookies are still on the request, then opens the login
 * form. A revoke that returns an error does not delete those cookies itself,
 * and this app has no middleware that would clear them later.
 */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL(SIGNED_OUT_PATH, request.url), 303)
  for (const header of expiredAuthCookieHeaders(request.headers.get('cookie'))) {
    response.headers.append('Set-Cookie', header)
  }
  return response
}
