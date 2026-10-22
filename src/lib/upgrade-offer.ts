import { ghsAmountLabel, type PricingAmounts } from './billing'

export const CARD_PAY_LABEL = 'Card'
export const MOBILE_MONEY_PAY_LABEL = 'Pay with Mobile Money'

export type LockedMonthPricing = PricingAmounts & {
  usd_price?: number | null
}

/** "$12 · GHS 186.40" from the public pricing payload. No rate is invented here. */
export function lockedMonthPriceLine(pricing: LockedMonthPricing | null | undefined): string | null {
  const usd = pricing?.usd_price
  if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) return null
  const ghs = ghsAmountLabel(pricing)
  if (!ghs) return null
  const dollars = Number.isInteger(usd) ? `$${usd}` : `$${usd.toFixed(2)}`
  return `${dollars} · ${ghs}`
}
