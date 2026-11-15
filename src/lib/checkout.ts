/** The Stripe Checkout session id on the return from checkout, if any. */
export function checkoutSessionFromReturn(search: string = window.location.search): string | null {
  const params = new URLSearchParams(search)
  const session = params.get('session_id')
  if (params.get('checkout') !== 'success' || !session) return null
  return /^cs_[A-Za-z0-9_]+$/.test(session) ? session : null
}

/** Remove the checkout markers from the address bar after handling them. */
export function clearCheckoutReturn() {
  const url = new URL(window.location.href)
  url.searchParams.delete('session_id')
  url.searchParams.delete('checkout')
  window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash)
}
