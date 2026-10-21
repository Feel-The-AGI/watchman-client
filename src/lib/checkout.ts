const CHECKOUT_REFERENCE_KEY = 'watchman_checkout_reference'

export function rememberCheckoutReference(reference: string) {
  sessionStorage.setItem(CHECKOUT_REFERENCE_KEY, reference)
}

/** Reference Paystack sends back, or the one stored before leaving for checkout. */
export function checkoutReferenceFromReturn(): string | null {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('reference') || params.get('trxref')
  const stored = sessionStorage.getItem(CHECKOUT_REFERENCE_KEY)
  if (fromUrl) return fromUrl
  if (params.get('success') === 'true' && stored) return stored
  return null
}

export function clearCheckoutReference() {
  sessionStorage.removeItem(CHECKOUT_REFERENCE_KEY)
}
