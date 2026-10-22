import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dashboardHandoffButton } from './onboarding-handoff.ts'

describe('onboarding dashboard handoff', () => {
  it('is clickable immediately, with no blocking animation', () => {
    const button = dashboardHandoffButton()
    assert.equal(button.label, 'Go to Dashboard')
    assert.equal(button.initial, false)
    assert.equal(button.animate, false)
    assert.equal(button.pointerEvents, 'auto')
  })
})