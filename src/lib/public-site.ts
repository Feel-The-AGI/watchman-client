export const PUBLIC_SITE_ORIGIN = 'https://www.trywatchman.app'

/** Pages a crawler should list. Redirects such as /signup are left out. */
export const PUBLIC_PAGES = ['/', '/pricing', '/login', '/legal/privacy', '/legal/terms'] as const

/** Private app routes. Crawlers may read the rest of the public site. */
export const PRIVATE_ROBOT_PATHS = ['/dashboard', '/settings', '/api', '/onboarding', '/shared'] as const

export function publicPageUrl(path: string): string {
  if (path === '/') return PUBLIC_SITE_ORIGIN
  return `${PUBLIC_SITE_ORIGIN}${path}`
}
