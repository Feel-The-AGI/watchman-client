import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SIGN_OUT_ENDPOINT,
  SIGNED_OUT_PATH,
  authCookieNamesFromHeader,
  browserAuthCookieExpiryLines,
  expiredAuthCookieHeaders,
  isSupabaseAuthStorageKey,
  dashboardAuthDecision,
  requestHasAuthSessionCookie,
  signedOutRedirect,
  signedOutStorageKeys,
  supabaseAuthStorageKeys,
} from './auth-session.ts'

describe('sign-out destination', () => {
  it('leaves the signed-in app through the login form', () => {
    assert.equal(SIGNED_OUT_PATH, '/login')
    assert.equal(SIGN_OUT_ENDPOINT, '/auth/signout')
  })
})

describe('Supabase auth cookies', () => {
  it('expires every auth cookie, including a second account and chunked cookies', () => {
    const header = [
      'sb-current-auth-token.0=aaa',
      'sb-current-auth-token.1=bbb',
      'sb-current-auth-token-code-verifier=ccc',
      'sb-amber-auth-token=ddd',
      'sidebar-collapsed=true',
      'theme=dark',
    ].join('; ')

    assert.deepEqual(authCookieNamesFromHeader(header), [
      'sb-current-auth-token.0',
      'sb-current-auth-token.1',
      'sb-current-auth-token-code-verifier',
      'sb-amber-auth-token',
    ])

    const expired = expiredAuthCookieHeaders(header)
    assert.equal(expired.length, 8)
    assert.ok(expired.every((line) => line.includes('Max-Age=0') && line.includes('Path=/')))
    assert.equal(expired.filter((line) => line.startsWith('sb-amber-auth-token=')).length, 2)
    assert.equal(expired.some((line) => line.includes('sidebar-collapsed')), false)
    assert.equal(expired.some((line) => line.endsWith('; Secure')), true)
    assert.equal(expired.some((line) => !line.includes('Secure')), true)

    assert.deepEqual(browserAuthCookieExpiryLines(header), expired)
    assert.equal(requestHasAuthSessionCookie(header), true)
    assert.equal(requestHasAuthSessionCookie('theme=dark'), false)
  })

  it('ignores an empty jar and unrelated storage keys', () => {
    assert.deepEqual(authCookieNamesFromHeader(null), [])
    assert.deepEqual(authCookieNamesFromHeader(''), [])
    assert.equal(isSupabaseAuthStorageKey('sidebar-collapsed'), false)
    assert.deepEqual(
      supabaseAuthStorageKeys([
        'sb-proj-auth-token',
        'supabase.auth.token',
        'sidebar-collapsed',
        'watchman-theme',
      ]),
      ['sb-proj-auth-token', 'supabase.auth.token'],
    )
    assert.deepEqual(
      signedOutStorageKeys([
        'sb-proj-auth-token',
        'supabase.auth.token',
        'watchman_pro_celebration_user-1',
        'watchman_landing_2026-10-20',
        'watchman_checkout_reference',
        'sidebar-collapsed',
      ]),
      [
        'sb-proj-auth-token',
        'supabase.auth.token',
        'watchman_pro_celebration_user-1',
        'watchman_landing_2026-10-20',
        'watchman_checkout_reference',
      ],
    )
  })
})

describe('dashboard auth check', () => {
  it('allows a valid user', () => {
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: { id: 'user-1' },
      error: null,
    }), 'allow')
  })

  it('redirects and clears cookies when the session is rejected', () => {
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthApiError', status: 401, message: 'invalid jwt' },
    }), 'redirect-and-clear')
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthApiError', status: 403, code: 'session_not_found' },
    }), 'redirect-and-clear')
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthSessionMissingError', status: 400, message: 'Auth session missing!' },
    }), 'redirect-and-clear')
  })

  it('passes through a network error or 5xx and leaves cookies alone', () => {
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' },
    }), 'pass-through')
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'TypeError', message: 'network timeout' },
    }), 'pass-through')
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthApiError', status: 503, message: 'upstream timeout' },
    }), 'pass-through')
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthRetryableFetchError', status: 500, message: 'internal' },
    }), 'pass-through')
  })

  it('redirects when the request has no auth cookie', () => {
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: false,
      user: null,
      error: null,
    }), 'redirect')
  })
})

describe('dashboard without a session', () => {
  it('sends every dashboard path to the login form', () => {
    assert.equal(signedOutRedirect('/dashboard', false), '/login')
    assert.equal(signedOutRedirect('/dashboard/settings', false), '/login')
    assert.equal(signedOutRedirect('/dashboard/admin', false), '/login')
    assert.equal(signedOutRedirect('/login', false), null)
    assert.equal(signedOutRedirect('/', false), null)
    assert.equal(signedOutRedirect('/dashboard', true), null)
  })
})
