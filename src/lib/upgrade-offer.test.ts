import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LOCKED_MONTH_PAY_LINE, lockedMonthPriceLine } from './upgrade-offer.ts'

describe('locked month price', () => {
  it('shows the monthly and yearly prices from the server', () => {
    assert.equal(
      lockedMonthPriceLine({ monthly: { amount: 12 }, annual: { amount: 96 } }),
      '$12/month · $96/year',
    )
    assert.equal(lockedMonthPriceLine({ monthly: { amount: 12.5 } }), '$12.50/month')
  })

  it('does not invent a price when the pricing payload is missing', () => {
    assert.equal(lockedMonthPriceLine(null), null)
    assert.equal(lockedMonthPriceLine({ annual: { amount: 96 } }), null)
    assert.equal(lockedMonthPriceLine({ monthly: { amount: 0 } }), null)
  })

  it('names the card payment methods Stripe checkout offers', () => {
    assert.match(LOCKED_MONTH_PAY_LINE, /card/i)
    assert.equal(/mobile money/i.test(LOCKED_MONTH_PAY_LINE), false)
  })
})
