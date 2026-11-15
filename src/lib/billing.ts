import { APIError, BACKEND_NOT_CONFIGURED_MESSAGE, BACKEND_UNAVAILABLE_MESSAGE, type StripePricing } from '@/lib/api'
import { looksLikeRawPayload } from '@/lib/chat-display'

export type Plan = 'monthly' | 'annual'

export const OPENING_CHECKOUT_LABEL = 'Opening secure checkout…'

/** Shown until the server reports its prices. Matches the server defaults. */
export const DEFAULT_PRICING: StripePricing = {
  currency: 'usd',
  configured: true,
  monthly: { amount: 12, display: '$12', interval: 'month' },
  annual: { amount: 96, display: '$96', interval: 'year', per_month: 8, saving_percent: 33 },
}

export const BILLING_NOTE = 'Secure checkout by Stripe. Cancel any time; Pro stays until the end of the period you paid for.'

/** Server prices when the payload has the expected shape, otherwise the defaults. */
export function usablePricing(pricing: unknown): StripePricing {
  const value = pricing as Partial<StripePricing> | null | undefined
  const ok = (plan: unknown) => {
    const amount = (plan as { amount?: unknown } | null | undefined)?.amount
    return typeof amount === 'number' && Number.isFinite(amount) && amount > 0
  }
  if (!value || !ok(value.monthly) || !ok(value.annual)) return DEFAULT_PRICING
  return value as StripePricing
}

export function planPrice(pricing: StripePricing | null | undefined, plan: Plan): { price: string; period: string; note: string } {
  const source = usablePricing(pricing)
  if (plan === 'annual') {
    const perMonth = source.annual.per_month ?? source.annual.amount / 12
    const saving = source.annual.saving_percent
    return {
      price: source.annual.display || `$${source.annual.amount}`,
      period: 'per year',
      note: `$${formatAmount(perMonth)} a month, billed yearly${saving ? ` (save ${saving}%)` : ''}.`,
    }
  }
  return {
    price: source.monthly.display || `$${source.monthly.amount}`,
    period: 'per month',
    note: 'Billed monthly. Cancel any time.',
  }
}

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function plainCheckoutError(error: unknown): string {
  const unreachable = "We couldn't reach Watchman to open checkout. Check your connection and try again. Nothing was charged."
  const generic = "Checkout didn't open. Nothing was charged. Try again in a moment."

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

export function parsePlan(value: string | null | undefined): Plan {
  return value === 'annual' ? 'annual' : 'monthly'
}
