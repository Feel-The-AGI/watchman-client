/** Local Playwright only. Never runs off localhost, even if a query is copied onto a public host. */
export function localhostE2EAuth(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  if (host !== 'localhost' && host !== '127.0.0.1') return false
  if (process.env.NEXT_PUBLIC_E2E_AUTH === '1') return true
  return new URLSearchParams(window.location.search).get('e2e') === '1'
}
