import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  COMING_SOON_LABEL,
  FOUNDING_BUTTON_LABEL,
  FOUNDING_FULL_MESSAGE,
  FREE_FEATURES,
  FREE_VISIBLE_MONTHS,
  PLAN_FREE_TICK,
  PLAN_PRICES,
  PLAN_PRO_TICK,
  PRICING_HEADLINE,
  PRICING_SUB,
  PRO_EXTRA_FEATURES,
  READABLE_TEXT,
  RENEWAL_ANSWER,
  SMALL_PRINT,
  START_FREE_LABEL,
  TERMS_CANCELLATION,
  TERMS_PAYMENT,
  TERMS_REFUND,
  foundingBadge,
  foundingFaqAnswer,
  foundingFeatures,
  monthlyButtonLabel,
  planComparisonRows,
  pricingFaqs,
  privacyPaymentParagraph,
  privacyServiceProviders,
  termsProParagraph,
  upgradeAheadLabel,
  yearlyAboutLine,
  yearlyButtonLabel,
} from './plan-catalog.ts'

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '')
  const r = channel(parseInt(raw.slice(0, 2), 16))
  const g = channel(parseInt(raw.slice(2, 4), 16))
  const b = channel(parseInt(raw.slice(4, 6), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

describe('plan catalog', () => {
  it('keeps Maya v3 prices and sentences in one config', () => {
    assert.equal(PRICING_HEADLINE, 'Simple pricing. Cancel anytime.')
    assert.equal(
      PRICING_SUB,
      'Built by a miner, for rotation workers everywhere: miners, offshore, FIFO, nurses and anyone on shifts.',
    )
    assert.equal(PLAN_PRICES.monthly, 6)
    assert.equal(PLAN_PRICES.yearly, 48)
    assert.equal(PLAN_PRICES.founding, 36)
    assert.equal(PLAN_PRICES.yearlyPerMonth, 4)
    assert.equal(monthlyButtonLabel(), 'Get Pro: $6/month')
    assert.equal(yearlyButtonLabel(), 'Get Pro yearly: $48/year')
    assert.equal(yearlyAboutLine(), "That's about $4 a month.")
    assert.equal(START_FREE_LABEL, 'Start free')
    assert.equal(FOUNDING_BUTTON_LABEL, 'Claim a founding spot')
    assert.equal(COMING_SOON_LABEL, 'Coming soon')
    assert.equal(FOUNDING_FULL_MESSAGE, 'Founding 100 is full. Thank you.')
    assert.equal(foundingBadge(17), 'First 100 only · 17 left')
    assert.equal(upgradeAheadLabel(), 'See further ahead with Pro, from $4 a month.')
    assert.equal(FREE_VISIBLE_MONTHS, 3)
    assert.deepEqual(FREE_FEATURES, [
      '1 rotation',
      'See your shifts 3 months ahead',
      '2 commitments',
      '100 AI chat messages a month',
      'Log incidents',
    ])
    assert.deepEqual(PRO_EXTRA_FEATURES, [
      'Unlimited saved rotations and commitments',
      'Plan beyond 3 months',
      'Leave planning',
      'Unlimited AI chat, with your full chat history',
      'Calendar sharing',
      'CSV and PDF exports of incidents, logs and stats',
    ])
    assert.deepEqual(foundingFeatures(), [
      'Everything in Pro',
      'Keep the $36 founding price on every renewal, even after prices go up',
      'Only for our first 100 paying members',
    ])
    assert.equal(SMALL_PRINT, 'Billed in USD by card via Stripe. Renews automatically; cancel anytime. No refunds: if you cancel, Pro keeps working until the end of the period you paid for. If Pro ends, nothing is deleted and shared links pause.')
    assert.equal(RENEWAL_ANSWER, 'Yes. Monthly and yearly plans renew automatically, and you can cancel anytime.')
    assert.equal(
      foundingFaqAnswer(),
      'Our first 100 paying members get the yearly plan for $36 instead of $48, and keep that price on every renewal.',
    )
    assert.equal(pricingFaqs().at(-1)?.answer, foundingFaqAnswer())
  })

  it('marks leave planning as Pro only and shares that row with settings', () => {
    const rows = planComparisonRows()
    const leave = rows.find((row) => row.feature === 'Leave planning')
    assert.ok(leave)
    assert.equal(leave.free, false)
    assert.equal(leave.pro, true)
    assert.equal(rows.filter((row) => row.free).map((row) => row.feature).join('|'), FREE_FEATURES.join('|'))
    assert.equal(rows.filter((row) => !row.free).map((row) => row.feature).join('|'), PRO_EXTRA_FEATURES.join('|'))
    for (const feature of FREE_FEATURES) {
      assert.equal(rows.find((row) => row.feature === feature)?.pro, true)
    }
  })

  it('keeps grey text and free ticks at WCAG AA on the dark surfaces', () => {
    assert.ok(contrast(READABLE_TEXT, '#0A0A0B') >= 4.5)
    assert.ok(contrast(READABLE_TEXT, '#0a0a0f') >= 4.5)
    assert.ok(contrast(PLAN_FREE_TICK, '#18181B') >= 4.5)
    assert.ok(contrast(PLAN_PRO_TICK, '#18181B') >= 3)
  })

  it('describes Stripe billing in the terms, and Paystack only while that provider is still on', () => {
    const pro = termsProParagraph()
    assert.match(pro, /\$6 a month/)
    assert.match(pro, /\$48 a year/)
    assert.match(pro, /\$36 a year/)
    assert.match(pro, /leave planning/)
    assert.equal(/paystack/i.test(pro), false)
    assert.equal(/\$12/.test(pro), false)
    assert.match(TERMS_PAYMENT, /card, in USD, through Stripe/)
    assert.match(TERMS_PAYMENT, /renew automatically/)
    assert.match(TERMS_CANCELLATION, /until the end of the period you paid for/)
    assert.match(TERMS_REFUND, /^No refunds/)
    assert.match(privacyPaymentParagraph('stripe'), /processed by Stripe/)
    assert.equal(/paystack/i.test(privacyPaymentParagraph('stripe')), false)
    assert.match(privacyPaymentParagraph('paystack'), /Paystack/)
    assert.match(privacyServiceProviders('stripe'), /Stripe for payments/)
    assert.equal(/Paystack/.test(privacyServiceProviders('stripe')), false)
    assert.match(privacyServiceProviders('paystack'), /Stripe and Paystack/)
  })
})
