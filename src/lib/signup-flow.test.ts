import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  authNavChoice,
  passwordRules,
  resendConfirmationFeedback,
  resendCooldownRemaining,
  RESEND_COOLDOWN_SECONDS,
  RESEND_RATE_LIMIT_MESSAGE,
  RESEND_SENT_MESSAGE,
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

describe('resend confirmation feedback', () => {
  it('says the email was sent again when Supabase accepts the resend', () => {
    assert.deepEqual(resendConfirmationFeedback(null), {
      tone: 'success',
      text: RESEND_SENT_MESSAGE,
    })
  })

  it('explains a rate limit instead of only restarting the countdown', () => {
    assert.equal(
      resendConfirmationFeedback({ status: 429, message: 'email rate limit exceeded', code: 'over_email_send_rate_limit' }).text,
      RESEND_RATE_LIMIT_MESSAGE,
    )
    assert.equal(resendConfirmationFeedback({ message: 'Email rate limit exceeded' }).tone, 'error')
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
