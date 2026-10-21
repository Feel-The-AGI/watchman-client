export const RESEND_COOLDOWN_SECONDS = 60

export const MIN_PASSWORD_LENGTH = 8

export interface PasswordRule {
  id: string
  label: string
  met: boolean
}

/** Rules shown beside the password field. Signup already requires 8 characters. */
export function passwordRules(password: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
  ]
}

export function resendCooldownRemaining(startedAt: number | null, now: number): number {
  if (startedAt == null) return 0
  const elapsed = Math.floor((now - startedAt) / 1000)
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed)
}

export const RESEND_SENT_MESSAGE = 'Confirmation email sent again.'

export const RESEND_RATE_LIMIT_MESSAGE = 'Too many emails sent. Try again in a few minutes.'

const RESEND_FAILED_MESSAGE = 'The confirmation email could not be sent. Try again in a moment.'

/** What the check-email screen says after Resend. A rate limit gets its own sentence. */
export function resendConfirmationFeedback(error: { message?: string; status?: number; code?: string } | null | undefined): {
  tone: 'success' | 'error'
  text: string
} {
  if (!error) return { tone: 'success', text: RESEND_SENT_MESSAGE }
  const code = (error.code || '').toLowerCase()
  const message = (error.message || '').toLowerCase()
  const rateLimited = error.status === 429
    || code.includes('rate_limit')
    || message.includes('rate limit')
  if (rateLimited) return { tone: 'error', text: RESEND_RATE_LIMIT_MESSAGE }
  return { tone: 'error', text: error.message?.trim() || RESEND_FAILED_MESSAGE }
}

export type AuthNavChoice = 'pending' | 'in' | 'out'

/** Sign In stays hidden only until a user is known. A slow profile fetch must not blank a signed-in nav. */
export function authNavChoice(loading: boolean, user: unknown): AuthNavChoice {
  if (user) return 'in'
  if (loading) return 'pending'
  return 'out'
}
