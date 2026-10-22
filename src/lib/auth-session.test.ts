import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SIGN_OUT_ENDPOINT,
  SIGNED_OUT_PATH,
  authCookieNamesFromHeader,
  browserAuthCookieExpiryLines,
  expiredAuthCookieHeaders,
  isSupabaseAuthStorageKey,
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
