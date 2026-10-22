export type PaymentsProvider = 'stripe' | 'paystack'

/**
 * Paystack stays the default until Stripe keys are live.
 * NEXT_PUBLIC_ values are baked in at build time, so changing this needs a rebuild.
 * Public plan copy does not follow this flag. Only the live checkout call does.
 */
export function paymentsProvider(): PaymentsProvider {
  const raw = process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER
  if (typeof raw === 'string' && raw.trim().toLowerCase() === 'stripe') return 'stripe'
  return 'paystack'
}
