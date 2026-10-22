import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  dashboardAuthDecision,
  expiredAuthCookieHeaders,
  requestHasAuthSessionCookie,
  supabaseProjectRef,
  type DashboardAuthDecision,
  type DashboardAuthError,
} from '@/lib/auth-session'

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

/**
 * Next.js 16 runs this before the dashboard page. No auth cookie, or a
 * rejected session, redirects to /login. A network or 5xx failure from
 * getUser() leaves the request and its cookies alone.
 */
export async function proxy(request: NextRequest) {
  const host = request.nextUrl.hostname
  const localHost = host === 'localhost' || host === '127.0.0.1'
  if (localHost && (request.nextUrl.searchParams.get('e2e') === '1' || request.cookies.get('wm_e2e')?.value === '1')) {
    return NextResponse.next()
  }

  const cookieHeader = request.headers.get('cookie')
  const hasAuthCookie = requestHasAuthSessionCookie(cookieHeader)
  let response = NextResponse.next({ request })
  let decision: DashboardAuthDecision = dashboardAuthDecision({
    hasAuthCookie,
    user: null,
    error: null,
  })

  if (hasAuthCookie) {
    const env = supabaseEnv()
    if (!env) {
      console.error('Supabase environment variables are missing. The dashboard session was not checked.')
      decision = dashboardAuthDecision({
        hasAuthCookie: true,
        user: null,
        error: null,
        envMissing: true,
      })
    } else {
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
      try {
        const { data, error } = await supabase.auth.getUser()
        decision = dashboardAuthDecision({
          hasAuthCookie: true,
          user: data.user,
          error,
        })
      } catch (error) {
        decision = dashboardAuthDecision({
          hasAuthCookie: true,
          user: null,
          error: thrownAuthError(error),
        })
      }
    }
  }

  if (decision === 'allow' || decision === 'pass-through') return response

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  const redirect = NextResponse.redirect(url)
  if (decision === 'redirect-and-clear') {
    const projectRef = supabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
    for (const header of expiredAuthCookieHeaders(cookieHeader, projectRef)) {
      redirect.headers.append('Set-Cookie', header)
    }
  }
  return redirect
}

function thrownAuthError(error: unknown): DashboardAuthError {
  if (error instanceof Error) {
    const status = (error as { status?: unknown }).status
    return {
      name: error.name,
      message: error.message,
      status: typeof status === 'number' ? status : undefined,
    }
  }
  return { name: 'TypeError', message: 'Failed to fetch' }
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
