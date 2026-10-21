import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  authNavChoice,
  passwordRules,
  resendCooldownRemaining,
  RESEND_COOLDOWN_SECONDS,
} from './signup-flow.ts'

describe('password rules', () => {
  it('shows the length rule before submit and updates as the password changes', () => {
    const empty = passwordRules('')
    assert.equal(empty.length, 1)
    assert.equal(empty[0].label, 'At least 8 characters')
    assert.equal(empty[0].met, false)
    assert.equal(passwordRules('short').every((rule) => rule.met), false)
    assert.equal(passwordRules('longenough').every((rule) => rule.met), true)
  })
})

describe('resend confirmation cooldown', () => {
  it('waits about 60 seconds after a send', () => {
    const started = 1_000_000
    assert.equal(resendCooldownRemaining(null, started), 0)
    assert.equal(resendCooldownRemaining(started, started + 1_000), RESEND_COOLDOWN_SECONDS - 1)
    assert.equal(resendCooldownRemaining(started, started + 60_000), 0)
    assert.equal(resendCooldownRemaining(started, started + 90_000), 0)
  })
})

describe('auth nav', () => {
  it('shows Dashboard as soon as the user is known', () => {
    assert.equal(authNavChoice(true, null), 'pending')
    assert.equal(authNavChoice(true, { id: 'user' }), 'in')
    assert.equal(authNavChoice(false, null), 'out')
    assert.equal(authNavChoice(false, { id: 'user' }), 'in')
  })
})
