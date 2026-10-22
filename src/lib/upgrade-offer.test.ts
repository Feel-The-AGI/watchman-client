import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LOCKED_MONTH_PAY_LINE, lockedMonthPriceLine } from './upgrade-offer.ts'

describe('locked month price', () => {
  it('places the server cedi amount next to the dollar price', () => {
    assert.equal(
      lockedMonthPriceLine({ usd_price: 12, display_ghs: 'GHS 186.40', ghs_amount: 186.4 }),
      '$12 · GHS 186.40',
    )
    assert.equal(lockedMonthPriceLine({ usd_price: 12, ghs_amount: 186.4 }), '$12 · GHS 186.40')
  })

  it('does not invent a cedi amount when the pricing payload is missing', () => {
    assert.equal(lockedMonthPriceLine(null), null)
    assert.equal(lockedMonthPriceLine({ usd_price: 12 }), null)
    assert.equal(lockedMonthPriceLine({ ghs_amount: 186.4, display_ghs: 'GHS 186.40' }), null)
  })

  it('offers mobile money or bank transfer, not card', () => {
    assert.equal(LOCKED_MONTH_PAY_LINE, 'Pay with Mobile Money or bank transfer')
    assert.equal(/card/i.test(LOCKED_MONTH_PAY_LINE), false)
  })
})
