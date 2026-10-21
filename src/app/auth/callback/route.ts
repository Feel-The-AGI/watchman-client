import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null
  }
  return value
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = safeNextPath(requestUrl.searchParams.get('redirect_to'))
  const providerError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error')

  if (!code) {
    const message = providerError || 'Sign-in did not complete. Request a new link and try again.'
    return NextResponse.redirect(`${origin}/login?error=auth_failed&message=${encodeURIComponent(message)}`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`)
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
