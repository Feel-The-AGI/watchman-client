import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { displayDateOnly, formatDateOnly, parseDateOnly } from './date-only.ts'

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

  it('accepts real leap days and rejects dates that are not YYYY-MM-DD', () => {
    assert.deepEqual(parseDateOnly('2024-02-29'), { year: 2024, month: 2, day: 29 })
    assert.equal(formatDateOnly('2024-02-29'), '2024-02-29')
    assert.equal(displayDateOnly('2024-02-29'), 'Feb 29, 2024')
    assert.deepEqual(parseDateOnly('2000-02-29'), { year: 2000, month: 2, day: 29 })
    assert.equal(formatDateOnly('2000-02-29'), '2000-02-29')
    assert.equal(displayDateOnly('2000-02-29'), 'Feb 29, 2000')

    for (const value of ['2025-02-29', '1900-02-29', '2026-13-01', '2026-04-31', '2026-1-5', '2026-10-22T00:00:00']) {
      assert.equal(parseDateOnly(value), null)
      assert.equal(formatDateOnly(value), null)
      assert.equal(displayDateOnly(value), null)
    }
  })

  it('returns null for missing values instead of throwing', () => {
    for (const value of [undefined, null, 20261022]) {
      assert.equal(parseDateOnly(value), null)
      assert.equal(formatDateOnly(value), null)
      assert.equal(displayDateOnly(value), null)
      assert.equal(displayDateOnly(value, 'month-day'), null)
    }
  })
})
