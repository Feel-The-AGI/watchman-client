import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AGENT_FAQ,
  BINARY_CONSTRAINT_FAQ,
  BOUNDARY_STEP,
  CLOSING_LINE,
  RENEWAL_FAQ,
  ROTATION_FEATURE,
  RULES_FEATURE,
  SHARE_DESCRIPTION,
} from './marketing-copy.ts'

const lines = [
  ROTATION_FEATURE,
  RULES_FEATURE,
  BOUNDARY_STEP,
  CLOSING_LINE,
  SHARE_DESCRIPTION,
  AGENT_FAQ,
  BINARY_CONSTRAINT_FAQ,
  RENEWAL_FAQ,
]

describe('marketing copy', () => {
  it('does not promise a whole year or an unbreakable system', () => {
    for (const line of lines) {
      assert.equal(/entire year materializes/i.test(line), false)
      assert.equal(/generate your year/i.test(line), false)
      assert.equal(/never break/i.test(line), false)
      assert.equal(/never bend/i.test(line), false)
    }
  })

  it('uses the night-study rule Watchman actually checks', () => {
    assert.match(RULES_FEATURE, /no study on night shifts/i)
    assert.match(BINARY_CONSTRAINT_FAQ, /no study on night shifts/i)
    for (const line of [RULES_FEATURE, BINARY_CONSTRAINT_FAQ]) {
      assert.equal(/day off after/i.test(line), false)
      assert.equal(/overtime on a leave day/i.test(line), false)
    }
    assert.match(ROTATION_FEATURE, /rotation shows up on the calendar/)
    assert.match(RENEWAL_FAQ, /renew automatically/i)
    assert.equal(/paystack/i.test(RENEWAL_FAQ), false)
    assert.equal(/\$12/.test(RENEWAL_FAQ), false)
    assert.equal(/automatic card subscription/i.test(RENEWAL_FAQ), false)
  })
})
