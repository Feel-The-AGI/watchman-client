/**
 * One source for plan prices, feature rows, and the public billing sentences.
 * Pricing cards, the feature comparison, and Settings all read this.
 * Prices stay here until the final numbers are confirmed.
 */
export const PLAN_PRICES = {
  free: 0,
  monthly: 6,
  yearly: 48,
  founding: 36,
  /** "about $4 a month" on the yearly plan, and the lock-panel line. */
  yearlyPerMonth: 4,
  yearlySavingsBadge: 'Save 33%',
} as const

/** Months a free account can open, including the current month. The lock panel uses the same number. */
export const FREE_VISIBLE_MONTHS = 3

/** Body text on near-black (#0A0A0B / #0a0a0f). Kept at WCAG AA for normal text. */
export const READABLE_TEXT = '#D4D4D8'

/** Free-column included mark on the plan card (#18181B). */
export const PLAN_FREE_TICK = '#F4F4F5'

/** Pro-column included mark. Blue-300 clears the card surface. */
export const PLAN_PRO_TICK = '#93C5FD'

export const PRICING_HEADLINE = 'Simple pricing. Cancel anytime.'

export const PRICING_SUB =
  'Built by a miner, for rotation workers everywhere: miners, offshore, FIFO, nurses and anyone on shifts.'

export const FREE_PLAN_BLURB = 'for trying Watchman with your own rotation'

export const FREE_FEATURES = [
  '1 rotation',
  `See your shifts ${FREE_VISIBLE_MONTHS} months ahead`,
  '2 commitments',
  '100 AI chat messages a month',
  'Log incidents',
] as const

export const PRO_EXTRA_FEATURES = [
  'Unlimited saved rotations and commitments',
  `Plan beyond ${FREE_VISIBLE_MONTHS} months`,
  'Leave planning',
  'Unlimited AI chat, with your full chat history',
  'Calendar sharing',
  'CSV and PDF exports of incidents, logs and stats',
] as const

export const PRO_INTRO = 'Everything in Free, plus:'

export const YEARLY_INTRO = 'Everything in Pro, for a year.'

export function foundingFeatures(prices: typeof PLAN_PRICES = PLAN_PRICES): readonly string[] {
  return [
    'Everything in Pro',
    `Keep the $${prices.founding} founding price on every renewal, even after prices go up`,
    'Only for our first 100 paying members',
  ]
}

export interface PlanComparisonRow {
  feature: string
  free: boolean
  pro: boolean
}

/** Same strings as the pricing cards. Free includes only FREE_FEATURES. Leave planning is Pro. */
export function planComparisonRows(): PlanComparisonRow[] {
  return [
    ...FREE_FEATURES.map((feature) => ({ feature, free: true, pro: true })),
    ...PRO_EXTRA_FEATURES.map((feature) => ({ feature, free: false, pro: true })),
  ]
}

export const START_FREE_LABEL = 'Start free'

export const COMING_SOON_LABEL = 'Coming soon'

export const FOUNDING_BUTTON_LABEL = 'Claim a founding spot'

export const FOUNDING_FULL_MESSAGE = 'Founding 100 is full. Thank you.'

export const FOUNDING_BADGE_PREFIX = 'First 100 only'

export function monthlyButtonLabel(prices: typeof PLAN_PRICES = PLAN_PRICES): string {
  return `Get Pro: $${prices.monthly}/month`
}

export function yearlyButtonLabel(prices: typeof PLAN_PRICES = PLAN_PRICES): string {
  return `Get Pro yearly: $${prices.yearly}/year`
}

export function yearlyAboutLine(prices: typeof PLAN_PRICES = PLAN_PRICES): string {
  return `That's about $${prices.yearlyPerMonth} a month.`
}

export function foundingBadge(seatsLeft: number): string {
  return `${FOUNDING_BADGE_PREFIX} · ${seatsLeft} left`
}

export function upgradeAheadLabel(prices: typeof PLAN_PRICES = PLAN_PRICES): string {
  return `See further ahead with Pro, from $${prices.yearlyPerMonth} a month.`
}

export const SMALL_PRINT =
  'Billed in USD by card via Stripe. Renews automatically; cancel anytime. No refunds: if you cancel, Pro keeps working until the end of the period you paid for. If Pro ends, nothing is deleted and shared links pause.'

export const RENEWAL_ANSWER =
  'Yes. Monthly and yearly plans renew automatically, and you can cancel anytime.'

export function foundingFaqAnswer(prices: typeof PLAN_PRICES = PLAN_PRICES): string {
  return `Our first 100 paying members get the yearly plan for $${prices.founding} instead of $${prices.yearly}, and keep that price on every renewal.`
}

export function pricingFaqs(prices: typeof PLAN_PRICES = PLAN_PRICES) {
  return [
    {
      question: 'Is there a free trial?',
      answer:
        'No. The Free plan is free for as long as you like, so you can try Watchman with your real rotation before paying anything.',
    },
    {
      question: 'Does it renew automatically?',
      answer: RENEWAL_ANSWER,
    },
    {
      question: 'Can I get a refund?',
      answer:
        "No, but if you cancel, Pro keeps working until the end of the period you've paid for.",
    },
    {
      question: 'How do I pay?',
      answer: 'By card, in USD, through Stripe.',
    },
    {
      question: 'What is Founding 100?',
      answer: foundingFaqAnswer(prices),
    },
  ]
}

export const PRO_WELCOME = "You're on Pro"

export const CHECKOUT_CANCELLED = 'Checkout cancelled. Nothing was charged.'

export const PAYMENTS_UNCONFIGURED = 'Payments are not configured yet. Nothing was charged.'

export function termsProParagraph(prices: typeof PLAN_PRICES = PLAN_PRICES): string {
  return `Pro is $${prices.monthly} a month, billed monthly, or $${prices.yearly} a year, billed yearly. That's about $${prices.yearlyPerMonth} a month on the yearly plan. Founding 100 is $${prices.founding} a year for our first 100 paying members, and they keep that price on every renewal. Pro includes everything in Free, plus unlimited saved rotations and commitments, planning beyond ${FREE_VISIBLE_MONTHS} months, leave planning, unlimited AI chat with your full chat history, calendar sharing, and CSV and PDF exports of incidents, logs and stats.`
}

export const TERMS_PAYMENT =
  'Payments are by card, in USD, through Stripe. We do not store your card details. Monthly and yearly plans renew automatically until you cancel. You can cancel anytime.'

export const TERMS_CANCELLATION =
  'If you cancel, Pro keeps working until the end of the period you paid for. If Pro ends, nothing is deleted and shared links pause.'

export const TERMS_REFUND =
  "No refunds. If you cancel, Pro keeps working until the end of the period you've paid for."

export function privacyPaymentParagraph(provider: 'stripe' | 'paystack'): string {
  const stripe =
    'Pro payments are processed by Stripe. We do not store your card details. We store a Stripe customer identifier so we can record the subscription on your account.'
  if (provider === 'paystack') {
    return `${stripe} Until card checkout through Stripe is turned on, a payment may still be processed by Paystack. We do not store those payment details either. We store a Paystack customer identifier and payment references when Paystack is used.`
  }
  return stripe
}

export function privacyServiceProviders(provider: 'stripe' | 'paystack'): string {
  const payments = provider === 'paystack' ? 'Stripe and Paystack for payments' : 'Stripe for payments'
  return `With trusted third-party services that help us operate our platform (Supabase for database and authentication, ${payments}, Resend for emails)`
}
