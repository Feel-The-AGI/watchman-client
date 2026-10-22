export const SIGNUP_DEFAULT_TIMEZONE = 'UTC'

export function emailLocalPart(email: unknown): string {
  if (typeof email !== 'string') return ''
  return email.split('@')[0]?.trim() ?? ''
}

/**
 * The signup trigger stores the email prefix when no name was given.
 * That default is not a name the person typed, so the field stays empty.
 */
export function displayProfileName(name: unknown, email: unknown): string {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed) return ''
  const local = emailLocalPart(email)
  if (local && trimmed.toLowerCase() === local.toLowerCase()) return ''
  return trimmed
}

export type TimezoneSource = 'settings' | 'profile' | 'browser'

/**
 * Preferences read `settings.timezone`. Signup leaves that unset and stores
 * UTC on the user row. A missing choice follows the browser. An explicit
 * settings value, including UTC, is left alone. A non-UTC profile timezone
 * is the stored zone when preferences were never saved.
 */
export function resolvePreferenceTimezone(input: {
  settingsTimezone?: unknown
  profileTimezone?: unknown
  browserTimezone?: unknown
}): { timezone: string; source: TimezoneSource } {
  const settings = typeof input.settingsTimezone === 'string' ? input.settingsTimezone.trim() : ''
  if (settings) return { timezone: settings, source: 'settings' }
  const profile = typeof input.profileTimezone === 'string' ? input.profileTimezone.trim() : ''
  if (profile && profile !== SIGNUP_DEFAULT_TIMEZONE) return { timezone: profile, source: 'profile' }
  const browser = typeof input.browserTimezone === 'string' ? input.browserTimezone.trim() : ''
  if (browser) return { timezone: browser, source: 'browser' }
  return { timezone: SIGNUP_DEFAULT_TIMEZONE, source: 'browser' }
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || SIGNUP_DEFAULT_TIMEZONE
  } catch {
    return SIGNUP_DEFAULT_TIMEZONE
  }
}
