import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AGENT_FAQ,
  BINARY_CONSTRAINT_FAQ,
  BOUNDARY_STEP,
  CLOSING_LINE,
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
]

describe('marketing copy', () => {
  it('does not promise a whole year or an unbreakable system', () => {
    for (const line of lines) {
      assert.equal(/entire year materializes/i.test(line), false)
      assert.equal(/generate your year/i.test(line), false)
      assert.equal(/never break/i.test(line), false)
      assert.equal(/never bend/i.test(line), false)
      assert.equal(/\bstudy\b/i.test(line), false)
    }
  })

  it('uses shift-work examples for rules', () => {
    assert.match(RULES_FEATURE, /night shifts/)
    assert.match(RULES_FEATURE, /Leave/)
    assert.match(RULES_FEATURE, /overtime/)
    assert.match(BINARY_CONSTRAINT_FAQ, /night shifts/)
    assert.match(BINARY_CONSTRAINT_FAQ, /leave/)
    assert.match(ROTATION_FEATURE, /rotation shows up on the calendar/)
  })
})
