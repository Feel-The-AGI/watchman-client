import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pricingRowMotion } from './pricing-display.ts'

describe('pricing row motion', () => {
  it('keeps rows visible without waiting for a scroll animation', () => {
    const motion = pricingRowMotion(false)
    assert.equal(motion.initial !== false && motion.initial.opacity, 1)
    assert.equal(motion.whileInView?.opacity, 1)
  })

  it('skips the entrance animation when reduced motion is requested', () => {
    const motion = pricingRowMotion(true)
    assert.equal(motion.initial, false)
    assert.equal(motion.whileInView, undefined)
  })
})
