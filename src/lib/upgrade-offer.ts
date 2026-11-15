export const LOCKED_MONTH_PAY_LINE = 'Pay by card, Apple Pay or Google Pay'

interface OfferPricing {
  monthly?: { amount?: number | null } | null
  annual?: { amount?: number | null } | null
}

function dollars(value: number): string {
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`
}

/** "$12/month · $96/year" from the public pricing payload, or null without it. */
export function lockedMonthPriceLine(pricing: OfferPricing | null | undefined): string | null {
  const monthly = pricing?.monthly?.amount
  if (typeof monthly !== 'number' || !Number.isFinite(monthly) || monthly <= 0) return null
  const annual = pricing?.annual?.amount
  const yearly = typeof annual === 'number' && Number.isFinite(annual) && annual > 0 ? ` · ${dollars(annual)}/year` : ''
  return `${dollars(monthly)}/month${yearly}`
}
