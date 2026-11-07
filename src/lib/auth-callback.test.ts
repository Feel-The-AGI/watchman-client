import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { OTHER_BROWSER_NOTICE, callbackFailureRedirect, isMissingCodeVerifier } from './auth-callback'

const SUPABASE_PKCE_MESSAGE =
  'PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.'

describe('auth callback failures', () => {
  it('recognises a missing code verifier by code or by message', () => {
    assert.equal(isMissingCodeVerifier({ code: 'pkce_code_verifier_not_found', message: '' }), true)
    assert.equal(isMissingCodeVerifier({ message: SUPABASE_PKCE_MESSAGE }), true)
    assert.equal(isMissingCodeVerifier({ code: 'otp_expired', message: 'Email link is invalid or has expired' }), false)
    assert.equal(isMissingCodeVerifier(null), false)
  })

  it('sends a link opened in another browser to sign-in with a notice, not the raw error', () => {
    const url = callbackFailureRedirect('https://trywatchman.app', { message: SUPABASE_PKCE_MESSAGE })
    assert.equal(url, `https://trywatchman.app/login?notice=${OTHER_BROWSER_NOTICE}`)
    assert.ok(!url.includes('PKCE'))
  })

  it('keeps other errors as errors', () => {
    const url = callbackFailureRedirect('https://trywatchman.app', { message: 'Email link is invalid or has expired' })
    assert.equal(url, 'https://trywatchman.app/login?error=auth_failed&message=Email%20link%20is%20invalid%20or%20has%20expired')
  })
})
