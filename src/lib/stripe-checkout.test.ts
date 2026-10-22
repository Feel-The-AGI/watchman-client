import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { APIError } from './api.ts'
import {
  authCallbackUrl,
  billingPeriodLine,
  billingPlanName,
  checkoutReturnPath,
  normalizeBillingStatus,
  normalizeSeatsLeft,
  planFromCheckoutPath,
  pricingCheckoutPath,
  signupPathForPlan,
  stripeBillingError,
} from './stripe-checkout.ts'
import { FOUNDING_FULL_MESSAGE, PAYMENTS_UNCONFIGURED } from './plan-catalog.ts'

describe('stripe checkout return', () => {
  it('sends a signed-out visitor to sign up and back to the chosen plan', () => {
    assert.equal(
      signupPathForPlan('monthly'),
      '/login?mode=signup&redirect_to=' + encodeURIComponent('/pricing?checkout=monthly'),
    )
    assert.equal(planFromCheckoutPath('/pricing?checkout=yearly'), 'yearly')
    assert.equal(planFromCheckoutPath('/pricing?checkout=founding'), 'founding')
    assert.equal(planFromCheckoutPath('https://evil.example/pricing?checkout=monthly'), null)
    assert.equal(planFromCheckoutPath('//evil.example/pricing?checkout=monthly'), null)
    assert.equal(checkoutReturnPath('?redirect_to=' + encodeURIComponent('/pricing?checkout=monthly')), '/pricing?checkout=monthly')
    assert.equal(checkoutReturnPath(''), null)
  })

  it('builds an email callback that returns to checkout', () => {
    assert.equal(
      authCallbackUrl('https://www.trywatchman.app/', 'founding'),
      'https://www.trywatchman.app/auth/callback?redirect_to=' + encodeURIComponent(pricingCheckoutPath('founding')),
    )
    assert.equal(authCallbackUrl('https://www.trywatchman.app', null), 'https://www.trywatchman.app/auth/callback')
  })
})

describe('billing status', () => {
  it('says renews or ends on the period date', () => {
    const renewing = normalizeBillingStatus({
      plan: 'yearly',
      status: 'active',
      current_period_end: '2027-06-15T12:00:00.000Z',
      cancel_at_period_end: false,
      founding_seats_left: 12,
    })
    assert.equal(billingPlanName(renewing.plan), 'Pro')
    assert.match(billingPeriodLine(renewing) || '', /^Renews on /)
    const ending = { ...renewing, cancel_at_period_end: true }
    assert.match(billingPeriodLine(ending) || '', /^Ends on /)
    assert.equal(billingPeriodLine({ ...renewing, plan: 'free' }), null)
    assert.equal(billingPlanName('founding'), 'Founding 100')
    assert.equal(normalizeSeatsLeft({ seats_left: 4.8 }), 4)
    assert.equal(normalizeSeatsLeft({ seats_left: '4' }), null)
  })

  it('maps 503 to coming-soon copy and 409 to the sold-out line', () => {
    assert.deepEqual(stripeBillingError(new APIError(503, 'no keys')), {
      message: PAYMENTS_UNCONFIGURED,
      code: 'unconfigured',
    })
    assert.deepEqual(stripeBillingError(new APIError(409, '{"detail":"full"}')), {
      message: FOUNDING_FULL_MESSAGE,
      code: 'full',
    })
    assert.equal(stripeBillingError(new APIError(500, '{"raw":true}')).message, "Checkout didn't open. Nothing was charged.")
  })
})
