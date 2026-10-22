/** Dev Playwright only. A production build eliminates this branch. */
export function localhostE2EAuth(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_E2E_AUTH === '1'
}
