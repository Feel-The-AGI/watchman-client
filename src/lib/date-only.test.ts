import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { displayDateOnly, formatDateOnly } from './date-only.ts'

const storedAnchor = '2026-10-22'

describe('date-only anchor', () => {
  it('shows 22 October from the date parts in every timezone', () => {
    assert.equal(displayDateOnly(storedAnchor), 'Oct 22, 2026')
    assert.equal(displayDateOnly(storedAnchor, 'month-day'), 'Oct 22')
    const zone = process.env.TZ
    if (zone === 'America/New_York') {
      assert.equal(new Date(storedAnchor).getDate(), 21)
    } else if (zone === 'Asia/Tokyo' || zone === 'UTC') {
      assert.equal(new Date(storedAnchor).getDate(), 22)
    }
  })

  it('sends the loaded anchor unchanged when the editor is saved without edits', () => {
    const editorValue = formatDateOnly(storedAnchor) ?? ''
    const body = { anchor_date: formatDateOnly(editorValue) }
    assert.equal(editorValue, '2026-10-22')
    assert.equal(body.anchor_date, '2026-10-22')
  })
})
