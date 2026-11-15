import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_PRICING, parsePlan, planPrice, usablePricing } from './billing.ts'

describe('plan prices', () => {
  it('uses server prices when they have the expected shape', () => {
    const pricing = {
      currency: 'usd',
      configured: true,
      monthly: { amount: 15, display: '$15', interval: 'month' as const },
      annual: { amount: 120, display: '$120', interval: 'year' as const, per_month: 10, saving_percent: 33 },
    }
    assert.deepEqual(planPrice(pricing, 'monthly'), { price: '$15', period: 'per month', note: 'Billed monthly. Cancel any time.' })
    assert.equal(planPrice(pricing, 'annual').note, '$10 a month, billed yearly (save 33%).')
  })

  it('falls back to the defaults for a missing or old-format payload', () => {
    assert.equal(usablePricing(null), DEFAULT_PRICING)
    assert.equal(usablePricing({ usd_price: 12, ghs_amount: 180 }), DEFAULT_PRICING)
    assert.equal(planPrice(undefined, 'annual').price, '$96')
  })

  it('reads the plan from a query value', () => {
    assert.equal(parsePlan('annual'), 'annual')
    assert.equal(parsePlan('weekly'), 'monthly')
    assert.equal(parsePlan(null), 'monthly')
  })
})
