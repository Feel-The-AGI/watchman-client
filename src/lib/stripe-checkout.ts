import { APIError } from '@/lib/api'
import { FOUNDING_FULL_MESSAGE, PAYMENTS_UNCONFIGURED } from '@/lib/plan-catalog'

export const CHECKOUT_PLANS = ['monthly', 'yearly', 'founding'] as const

export type CheckoutPlan = (typeof CHECKOUT_PLANS)[number]

const PENDING_CHECKOUT_KEY = 'watchman_pending_checkout'

export function isCheckoutPlan(value: string | null | undefined): value is CheckoutPlan {
  return value === 'monthly' || value === 'yearly' || value === 'founding'
}

export function pricingCheckoutPath(plan: CheckoutPlan): string {
  return `/pricing?checkout=${plan}`
}

export function signupPathForPlan(plan: CheckoutPlan): string {
  return `/login?mode=signup&redirect_to=${encodeURIComponent(pricingCheckoutPath(plan))}`
}

export function planFromCheckoutPath(path: string | null | undefined): CheckoutPlan | null {
  if (!path) return null
  if (!path.startsWith('/pricing') || path.startsWith('//') || path.includes('\\') || path.includes('://')) {
    return null
  }
  const queryIndex = path.indexOf('?')
  if (queryIndex === -1) return null
  const plan = new URLSearchParams(path.slice(queryIndex + 1)).get('checkout')
  return isCheckoutPlan(plan) ? plan : null
}

export function checkoutReturnPath(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const plan = planFromCheckoutPath(params.get('redirect_to'))
  return plan ? pricingCheckoutPath(plan) : null
}

export function rememberPendingCheckout(plan: CheckoutPlan) {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, plan)
  } catch {
    // Private mode can reject storage. The redirect_to query still carries the plan.
  }
}

export function readPendingCheckout(): CheckoutPlan | null {
  try {
    const value = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
    return isCheckoutPlan(value) ? value : null
  } catch {
    return null
  }
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
  } catch {
    // Ignore storage failures.
  }
}

/** Login and email-confirmation links. A stored plan wins when the page has no redirect_to. */
export function pendingCheckoutReturn(search: string): string | null {
  return checkoutReturnPath(search) ?? (() => {
    const pending = readPendingCheckout()
    return pending ? pricingCheckoutPath(pending) : null
  })()
}

export function authCallbackUrl(origin: string, plan: CheckoutPlan | null): string {
  const base = `${origin.replace(/\/$/, '')}/auth/callback`
  if (!plan) return base
  return `${base}?redirect_to=${encodeURIComponent(pricingCheckoutPath(plan))}`
}

export interface BillingStatus {
  plan: string | null
  status: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  founding_seats_left: number | null
}

export function normalizeBillingStatus(value: unknown): BillingStatus {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const plan = typeof record.plan === 'string' && record.plan.trim() ? record.plan.trim().toLowerCase() : null
  const status = typeof record.status === 'string' && record.status.trim() ? record.status.trim().toLowerCase() : null
  const end = typeof record.current_period_end === 'string' && record.current_period_end.trim()
    ? record.current_period_end
    : null
  const seatsRaw = record.founding_seats_left
  const seats = typeof seatsRaw === 'number' && Number.isFinite(seatsRaw)
    ? Math.max(0, Math.trunc(seatsRaw))
    : null
  return {
    plan,
    status,
    current_period_end: end,
    cancel_at_period_end: record.cancel_at_period_end === true,
    founding_seats_left: seats,
  }
}

export function normalizeSeatsLeft(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null
  const seats = (value as { seats_left?: unknown }).seats_left
  if (typeof seats !== 'number' || !Number.isFinite(seats)) return null
  return Math.max(0, Math.trunc(seats))
}

export function isPaidBillingPlan(plan: string | null): boolean {
  return plan === 'monthly' || plan === 'yearly' || plan === 'founding' || plan === 'pro'
}

export function tierFromBillingPlan(plan: string | null): 'free' | 'pro' | 'admin' {
  if (plan === 'admin') return 'admin'
  if (isPaidBillingPlan(plan)) return 'pro'
  return 'free'
}

export function billingPlanName(plan: string | null): string {
  switch (plan) {
    case 'monthly':
    case 'yearly':
    case 'pro':
      return 'Pro'
    case 'founding':
      return 'Founding 100'
    case 'admin':
      return 'Admin'
    default:
      return 'Free'
  }
}

export function billingPlanDetail(plan: string | null): string {
  switch (plan) {
    case 'monthly':
      return 'Billed monthly'
    case 'yearly':
      return 'Billed yearly'
    case 'founding':
      return 'Founding price, billed yearly'
    case 'admin':
      return 'Full access'
    case 'pro':
      return 'Billed through Stripe'
    default:
      return 'For trying Watchman with your own rotation'
  }
}

export function formatBillingDate(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function billingPeriodLine(status: Pick<BillingStatus, 'plan' | 'status' | 'current_period_end' | 'cancel_at_period_end'>): string | null {
  if (!isPaidBillingPlan(status.plan) || !status.current_period_end) return null
  const date = formatBillingDate(status.current_period_end)
  if (!date) return null
  const ending = status.cancel_at_period_end || status.status === 'canceled' || status.status === 'cancelled'
  return ending ? `Ends on ${date}` : `Renews on ${date}`
}

export type BillingErrorCode = 'unconfigured' | 'full' | 'auth' | 'error'

export function stripeBillingError(error: unknown, action: 'checkout' | 'portal' = 'checkout'): {
  message: string
  code: BillingErrorCode
} {
  if (error instanceof APIError) {
    if (error.status === 503) return { message: PAYMENTS_UNCONFIGURED, code: 'unconfigured' }
    if (error.status === 409 && action === 'checkout') return { message: FOUNDING_FULL_MESSAGE, code: 'full' }
    if (error.status === 401 || error.status === 403) {
      return { message: 'Sign in again before continuing. Nothing was charged.', code: 'auth' }
    }
    if (error.status === 0) {
      return { message: "We couldn't reach Watchman. Nothing was charged.", code: 'error' }
    }
  }
  if (action === 'portal') {
    return { message: "The subscription page didn't open. Try again in a moment.", code: 'error' }
  }
  return { message: "Checkout didn't open. Nothing was charged.", code: 'error' }
}
