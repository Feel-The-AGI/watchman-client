import { APIError, BACKEND_NOT_CONFIGURED_MESSAGE, BACKEND_UNAVAILABLE_MESSAGE } from '@/lib/api'
import { looksLikeRawPayload } from '@/lib/chat-display'

export const OPENING_CHECKOUT_LABEL = 'Opening secure checkout…'

export const CEDIS_NOTE = 'Charged in cedis via Paystack at the day’s rate.'

export interface PricingAmounts {
  ghs_amount?: number | null
  display_ghs?: string | null
}

export function ghsAmountLabel(pricing: PricingAmounts | null | undefined): string | null {
  if (!pricing) return null
  const display = pricing.display_ghs?.trim()
  if (display && /\d/.test(display)) {
    const normalized = display.replace(/^≈\s*/, '')
    if (/ghs/i.test(normalized)) return normalized.replace(/ghs/i, 'GHS')
    return `GHS ${normalized}`
  }
  if (typeof pricing.ghs_amount === 'number' && Number.isFinite(pricing.ghs_amount) && pricing.ghs_amount > 0) {
    return `GHS ${pricing.ghs_amount.toFixed(2)}`
  }
  return null
}

/** Headline stays $12. This is the line under it. */
export function cedisChargeLine(pricing: PricingAmounts | null | undefined): string {
  const amount = ghsAmountLabel(pricing)
  if (!amount) return CEDIS_NOTE
  return `≈ ${amount}, charged in cedis via Paystack`
}

export function plainCheckoutError(error: unknown): string {
  const unreachable = "We couldn't reach Watchman to open Paystack. Check your connection and try again. Nothing was charged."
  const generic = "Paystack didn't open. Nothing was charged. Try again in a moment."

  if (error instanceof APIError) {
    if (error.status === 0) return unreachable
    if (error.status === 401 || error.status === 403) {
      return 'Sign in again before opening checkout. Nothing was charged.'
    }
  }

  const raw = error instanceof Error ? error.message.trim() : ''
  if (!raw || raw === BACKEND_UNAVAILABLE_MESSAGE || raw === BACKEND_NOT_CONFIGURED_MESSAGE) return unreachable
  if (looksLikeRawPayload(raw) || raw.length > 180) return generic
  return raw
}
