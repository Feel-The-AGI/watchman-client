import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { displayProfileName, resolvePreferenceTimezone } from './profile-display.ts'

describe('profile display', () => {
  it('leaves the name field empty when the stored name is the email prefix', () => {
    assert.equal(displayProfileName('jasonquist.ia+e2e3', 'jasonquist.ia+e2e3@gmail.com'), '')
    assert.equal(displayProfileName('Jasonquist.ia+e2e3', 'jasonquist.ia+e2e3@gmail.com'), '')
    assert.equal(displayProfileName('  ', 'jasonquist.ia+e2e3@gmail.com'), '')
    assert.equal(displayProfileName('Ada Lovelace', 'ada@example.com'), 'Ada Lovelace')
  })

  it('uses the browser timezone only when the account never chose one', () => {
    assert.deepEqual(
      resolvePreferenceTimezone({
        settingsTimezone: undefined,
        profileTimezone: 'UTC',
        browserTimezone: 'America/New_York',
      }),
      { timezone: 'America/New_York', source: 'browser' },
    )
    assert.deepEqual(
      resolvePreferenceTimezone({
        settingsTimezone: '',
        profileTimezone: null,
        browserTimezone: 'Africa/Accra',
      }),
      { timezone: 'Africa/Accra', source: 'browser' },
    )
    assert.deepEqual(
      resolvePreferenceTimezone({ settingsTimezone: 'UTC', browserTimezone: 'America/New_York' }),
      { timezone: 'UTC', source: 'settings' },
    )
    assert.deepEqual(
      resolvePreferenceTimezone({
        profileTimezone: 'Europe/London',
        browserTimezone: 'America/New_York',
      }),
      { timezone: 'Europe/London', source: 'profile' },
    )
  })
})
