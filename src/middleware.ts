import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  expiredAuthCookieHeaders,
  requestHasAuthSessionCookie,
  signedOutRedirect,
} from '@/lib/auth-session'

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

/**
 * Dashboard routes are signed-in pages. With no Supabase session, the
 * response is a redirect to /login and any auth cookies on the request are
 * expired so the next request still has nothing to restore.
 */
export async function middleware(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie')
  let response = NextResponse.next({ request })
  let hasSession = false

  if (requestHasAuthSessionCookie(cookieHeader)) {
    const env = supabaseEnv()
    if (env) {
      const supabase = createServerClient(env.url, env.key, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      })
      const { data } = await supabase.auth.getUser()
      hasSession = Boolean(data.user)
    }
  }

  const destination = signedOutRedirect(request.nextUrl.pathname, hasSession)
  if (!destination) return response

  const url = request.nextUrl.clone()
  url.pathname = destination
  url.search = ''
  const redirect = NextResponse.redirect(url)
  for (const header of expiredAuthCookieHeaders(cookieHeader)) {
    redirect.headers.append('Set-Cookie', header)
  }
  return redirect
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
