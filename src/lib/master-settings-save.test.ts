import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { api } from './api.ts'
import {
  canSaveMasterSettings,
  loadMasterSettings,
  MASTER_SETTINGS_CONFLICT_MESSAGE,
  MASTER_SETTINGS_LOAD_ERROR,
  saveMasterSettings,
} from './master-settings-save.ts'

const loadedSettings = {
  cycle: { pattern: [{ label: 'work_night', duration: 4 }], anchor_date: '2026-10-01', anchor_cycle_day: 2 },
  work: { day_hours: { start: '07:00', end: '19:00' } },
}

describe('master settings save', () => {
  it('disables saving when the fetch fails and never calls PUT', async () => {
    const calls: string[] = []
    const loaded = await loadMasterSettings({
      get: async () => {
        calls.push('get')
        throw Object.assign(new Error('server down'), { status: 503 })
      },
    })

    assert.equal(loaded.ok, false)
    if (loaded.ok) return
    assert.equal(loaded.message, MASTER_SETTINGS_LOAD_ERROR)
    assert.equal(canSaveMasterSettings(null), false)

    const saved = await saveMasterSettings(null, { work: { available_hours_on_work: 4 } }, {
      get: async () => {
        calls.push('reload')
        return { settings: loadedSettings, version: 1 }
      },
      update: async () => {
        calls.push('put')
        return { settings: loadedSettings, version: 2 }
      },
    })

    assert.deepEqual(calls, ['get'])
    assert.equal(saved.ok, false)
    if (saved.ok) return
    assert.equal(saved.saved, false)
    assert.equal(saved.conflict, false)
  })

  it('sends the loaded settings version as expected_version', async () => {
    const loaded = await loadMasterSettings({
      get: async () => ({ settings: loadedSettings, version: 4 }),
    })
    assert.equal(loaded.ok, true)
    if (!loaded.ok) return
    assert.equal(canSaveMasterSettings(loaded.document), true)
    assert.equal(loaded.document.version, 4)

    let sentVersion: number | undefined
    const nextSettings = {
      ...loadedSettings,
      work: { day_hours: { start: '08:00', end: '20:00' } },
    }
    const saved = await saveMasterSettings(loaded.document, nextSettings, {
      get: async () => {
        throw new Error('reload should not run')
      },
      update: async (_settings, expectedVersion) => {
        sentVersion = expectedVersion
        return { settings: nextSettings, version: 5 }
      },
    })

    assert.equal(sentVersion, 4)
    assert.equal(saved.ok, true)
    if (saved.ok) assert.equal(saved.document.version, 5)

    const previousUrl = process.env.NEXT_PUBLIC_API_URL
    const originalFetch = globalThis.fetch
    process.env.NEXT_PUBLIC_API_URL = 'http://watchman.test'
    let method = ''
    let body = ''
    globalThis.fetch = async (_url, init) => {
      method = init?.method ?? ''
      body = typeof init?.body === 'string' ? init.body : ''
      return new Response(JSON.stringify({ settings: nextSettings, version: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    try {
      await api.masterSettings.update(nextSettings, 4)
      assert.equal(method, 'PUT')
      assert.deepEqual(JSON.parse(body), { settings: nextSettings, expected_version: 4 })
    } finally {
      globalThis.fetch = originalFetch
      if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL
      else process.env.NEXT_PUBLIC_API_URL = previousUrl
    }
  })

  it('reloads settings and shows the conflict message on 409', async () => {
    const calls: string[] = []
    const reloadedSettings = {
      ...loadedSettings,
      work: { day_hours: { start: '05:00', end: '17:00' } },
    }
    const saved = await saveMasterSettings(
      { settings: loadedSettings, version: 2 },
      { ...loadedSettings, work: { day_hours: { start: '09:00', end: '21:00' } } },
      {
        get: async () => {
          calls.push('get')
          return { settings: reloadedSettings, version: 6 }
        },
        update: async () => {
          calls.push('put')
          throw Object.assign(new Error('Version mismatch: expected 2, got 6'), { status: 409 })
        },
      },
    )

    assert.deepEqual(calls, ['put', 'get'])
    assert.equal(saved.ok, false)
    if (saved.ok) return
    assert.equal(saved.conflict, true)
    assert.equal(saved.saved, false)
    assert.equal(saved.message, MASTER_SETTINGS_CONFLICT_MESSAGE)
    assert.equal(saved.document?.version, 6)
    assert.deepEqual(saved.document?.settings, reloadedSettings)
  })
})
