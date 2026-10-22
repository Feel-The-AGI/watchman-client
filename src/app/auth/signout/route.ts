import { NextResponse } from 'next/server'
import { expiredAuthCookieHeaders, SIGNED_OUT_PATH, supabaseProjectRef } from '@/lib/auth-session'

/**
 * The browser has already asked Supabase to revoke the session. This response
 * expires the project's auth cookies, including chunked names that were not on
 * the request, then opens /login.
 */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL(SIGNED_OUT_PATH, request.url), 303)
  const projectRef = supabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
  for (const header of expiredAuthCookieHeaders(request.headers.get('cookie'), projectRef)) {
    response.headers.append('Set-Cookie', header)
  }
  return response
}
