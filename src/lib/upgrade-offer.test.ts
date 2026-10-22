import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CARD_PAY_LABEL, lockedMonthPriceLine, MOBILE_MONEY_PAY_LABEL } from './upgrade-offer.ts'

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

  it('names card and mobile money as the pay options', () => {
    assert.equal(CARD_PAY_LABEL, 'Card')
    assert.equal(MOBILE_MONEY_PAY_LABEL, 'Pay with Mobile Money')
  })
})