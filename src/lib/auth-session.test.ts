import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SIGN_OUT_ENDPOINT,
  SIGNED_OUT_PATH,
  allowAuthCookieWrite,
  authCookieNamesFromHeader,
  formatAuthCookie,
  authCookieNamesToExpire,
  authStateAfterSignOut,
  browserAuthCookieExpiryLines,
  clearSupabaseBrowserSession,
  expiredAuthCookieHeaders,
  isSupabaseAuthStorageKey,
  dashboardAuthDecision,
  navChoiceAfterUserCheck,
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
    const names = authCookieNamesToExpire(header)
    assert.equal(expired.length, names.length * 2)
    assert.ok(expired.every((line) => line.includes('Max-Age=0') && line.includes('Path=/')))
    assert.equal(expired.filter((line) => line.startsWith('sb-amber-auth-token=')).length, 2)
    assert.equal(expired.some((line) => line.includes('sidebar-collapsed')), false)
    assert.equal(expired.some((line) => line.endsWith('; Secure')), true)
    assert.equal(expired.some((line) => !line.includes('Secure')), true)
    assert.ok(names.includes('sb-current-auth-token'))
    assert.ok(names.includes('sb-current-auth-token.0'))
    assert.ok(names.includes('sb-current-auth-token.1'))
    assert.ok(names.includes('sb-current-auth-token.4'))
    assert.ok(names.includes('sb-current-auth-token-code-verifier'))
    assert.ok(names.includes('sb-amber-auth-token.0'))

    assert.deepEqual(browserAuthCookieExpiryLines(header), expired)
    assert.equal(requestHasAuthSessionCookie(header), true)
    assert.equal(requestHasAuthSessionCookie('theme=dark'), false)
  })

  it('leaves no sb auth cookie or storage key after sign-out cleanup', () => {
    const header = [
      'sb-vooq-auth-token.0=aaa',
      'sb-vooq-auth-token.1=bbb',
      'sb-vooq-auth-token-code-verifier=ccc',
      'sidebar-collapsed=true',
    ].join('; ')
    const storageKeys = [
      'sb-vooq-auth-token.0',
      'sb-vooq-auth-token.1',
      'supabase.auth.token',
      'watchman_checkout_reference',
      'sidebar-collapsed',
    ]
    const left = authStateAfterSignOut({ cookieHeader: header, storageKeys, projectRef: 'vooq' })
    assert.deepEqual(left.cookieNames, [])
    assert.deepEqual(left.storageKeys, ['sidebar-collapsed'])

    const lateChunk = ['sb-vooq-auth-token.0', 'sb-vooq-auth-token.1', 'sb-vooq-auth-token.4']
    const expire = new Set(authCookieNamesToExpire(header, 'vooq'))
    assert.deepEqual(lateChunk.filter((name) => !expire.has(name)), [])
    assert.equal(expire.has('sidebar-collapsed'), false)

    assert.equal(allowAuthCookieWrite('sb-vooq-auth-token.0', 'restored', true), false)
    assert.equal(allowAuthCookieWrite('sb-vooq-auth-token.0', '', true), true)
    assert.equal(allowAuthCookieWrite('sidebar-collapsed', 'true', true), true)
    assert.equal(allowAuthCookieWrite('sb-vooq-auth-token.1', 'restored', false), true)
    assert.equal(
      formatAuthCookie('sb-a-auth-token', 'base64-abc', { path: '/', sameSite: 'lax', maxAge: 10 }),
      'sb-a-auth-token=base64-abc; Max-Age=10; Path=/; SameSite=Lax',
    )
  })

  it('clears chunked cookies and storage from the browser', () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vooq.supabase.co'
    const jar = new Map<string, string>([
      ['sb-vooq-auth-token.0', 'aaa'],
      ['sb-vooq-auth-token.1', 'bbb'],
      ['sidebar-collapsed', 'true'],
    ])
    const local: Record<string, string> = {
      'sb-vooq-auth-token.0': 'aaa',
      'sb-vooq-auth-token.1': 'bbb',
      'supabase.auth.token': 'legacy',
      watchman_checkout_reference: 'ref',
      'sidebar-collapsed': 'true',
    }
    const sessionStore: Record<string, string> = {
      'sb-vooq-auth-token-code-verifier': 'ccc',
      'sidebar-collapsed': 'true',
    }
    const rememberRemove = (store: Record<string, string>) => {
      const target = store as Record<string, string> & { removeItem: (key: string) => void }
      target.removeItem = (key: string) => {
        delete target[key]
      }
    }
    rememberRemove(local)
    rememberRemove(sessionStore)
    const target = globalThis as typeof globalThis & {
      document?: { cookie: string }
      window?: { localStorage: Record<string, string>; sessionStorage: Record<string, string> }
    }
    const previousDocument = target.document
    const previousWindow = target.window
    target.document = {
      get cookie() {
        return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
      },
      set cookie(line: string) {
        const name = line.split('=')[0]
        if (line.includes('Max-Age=0')) jar.delete(name)
      },
    }
    target.window = { localStorage: local, sessionStorage: sessionStore }
    try {
      clearSupabaseBrowserSession()
      assert.deepEqual([...jar.keys()], ['sidebar-collapsed'])
      assert.equal(local['sidebar-collapsed'], 'true')
      assert.equal(Object.keys(local).some((key) => key.startsWith('sb-') || key.startsWith('watchman_') || key === 'supabase.auth.token'), false)
      assert.equal(Object.keys(sessionStore).some((key) => key.includes('auth-token')), false)
      assert.equal(sessionStore['sidebar-collapsed'], 'true')
    } finally {
      if (previousDocument === undefined) delete target.document
      else target.document = previousDocument
      if (previousWindow === undefined) delete target.window
      else target.window = previousWindow
      if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    }
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

  it('passes through a 429 from AuthApiError', () => {
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: { name: 'AuthApiError', status: 429, message: 'too many requests' },
    }), 'pass-through')
  })

  it('passes through when the Supabase environment is missing', () => {
    assert.equal(dashboardAuthDecision({
      hasAuthCookie: true,
      user: null,
      error: null,
      envMissing: true,
    }), 'pass-through')
  })
})

describe('home nav after checking the session', () => {
  it('shows Dashboard when the server accepts the user', () => {
    assert.equal(navChoiceAfterUserCheck({
      checked: true,
      localUser: { id: 'user-1' },
      user: { id: 'user-1' },
      error: null,
    }), 'in')
  })

  it('shows Sign In when the server rejects the saved session', () => {
    assert.equal(navChoiceAfterUserCheck({
      checked: true,
      localUser: { id: 'user-1' },
      user: null,
      error: { name: 'AuthApiError', status: 400, code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' },
    }), 'out')
    assert.equal(navChoiceAfterUserCheck({
      checked: true,
      localUser: { id: 'user-1' },
      user: null,
      error: { name: 'AuthApiError', status: 401, message: 'invalid jwt' },
    }), 'out')
  })

  it('keeps the local session when the check cannot reach the server', () => {
    assert.equal(navChoiceAfterUserCheck({
      checked: true,
      localUser: { id: 'user-1' },
      user: null,
      error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' },
    }), 'in')
    assert.equal(navChoiceAfterUserCheck({
      checked: true,
      localUser: { id: 'user-1' },
      user: null,
      error: { name: 'TypeError', message: 'network timeout' },
    }), 'in')
    assert.equal(navChoiceAfterUserCheck({
      checked: true,
      localUser: null,
      user: null,
      error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' },
    }), 'out')
  })

  it('stays on the placeholder until the check finishes', () => {
    assert.equal(navChoiceAfterUserCheck({
      checked: false,
      localUser: { id: 'user-1' },
      user: null,
      error: null,
    }), 'pending')
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
