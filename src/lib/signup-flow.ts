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

export type AuthNavChoice = 'pending' | 'in' | 'out'

/** Sign In stays hidden only until a user is known. A slow profile fetch must not blank a signed-in nav. */
export function authNavChoice(loading: boolean, user: unknown): AuthNavChoice {
  if (user) return 'in'
  if (loading) return 'pending'
  return 'out'
}
