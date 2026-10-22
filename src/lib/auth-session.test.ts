import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SIGN_OUT_ENDPOINT,
  SIGNED_OUT_PATH,
  authCookieNamesFromHeader,
  browserAuthCookieExpiryLines,
  expiredAuthCookieHeaders,
  isSupabaseAuthStorageKey,
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
    assert.deepEqual(expired, [
      'sb-current-auth-token.0=; Path=/; Max-Age=0; SameSite=Lax',
      'sb-current-auth-token.1=; Path=/; Max-Age=0; SameSite=Lax',
      'sb-current-auth-token-code-verifier=; Path=/; Max-Age=0; SameSite=Lax',
      'sb-amber-auth-token=; Path=/; Max-Age=0; SameSite=Lax',
    ])
    assert.equal(expired.some((line) => line.includes('sidebar-collapsed')), false)

    const browserLines = browserAuthCookieExpiryLines(header)
    assert.equal(browserLines.length, 8)
    assert.equal(browserLines.filter((line) => line.startsWith('sb-amber-auth-token=')).length, 2)
    assert.equal(browserLines.some((line) => line.endsWith('; Secure')), true)
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
  })
})
