import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { actualHoursText } from './logged-hours.ts'

describe('logged hours', () => {
  it('does not render a dash when nothing was logged', () => {
    assert.equal(actualHoursText(undefined), 'Not logged')
    assert.equal(actualHoursText(null), 'Not logged')
    assert.equal(actualHoursText(0), '0h')
    assert.equal(actualHoursText(12), '12h')
  })
})
