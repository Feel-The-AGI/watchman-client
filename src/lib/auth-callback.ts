/**
 * Email links (sign-up confirmation, magic link) use the PKCE flow. The code
 * verifier lives in the browser that asked for the link. When the link opens
 * somewhere else, such as the Gmail app's built-in browser or another device,
 * Supabase has already verified the email but cannot start a session here.
 * That is not a failure the user should read as one.
 */
export const OTHER_BROWSER_NOTICE = 'other_browser'

export const OTHER_BROWSER_MESSAGE =
  'Your email is verified. The link opened in a different browser from the one you signed up in, so sign in here to continue. For a magic link, request a new one from this browser.'

export function isMissingCodeVerifier(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  if (error.code === 'pkce_code_verifier_not_found') return true
  return /code verifier/i.test(error.message ?? '')
}

export function callbackFailureRedirect(origin: string, error: { code?: string; message?: string }) {
  if (isMissingCodeVerifier(error)) {
    return `${origin}/login?notice=${OTHER_BROWSER_NOTICE}`
  }
  return `${origin}/login?error=auth_failed&message=${encodeURIComponent(error.message || 'Sign-in did not complete. Request a new link and try again.')}`
}
