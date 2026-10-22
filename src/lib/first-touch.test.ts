import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FIRST_TOUCH_STORAGE_KEY,
  captureFirstTouch,
  emailSignupData,
  firstTouchFromLocation,
  magicLinkSignupData,
  type FirstTouchStorage,
} from './first-touch.ts'

const capturedAt = '2026-10-22T08:00:00.000Z'

function memoryStorage(initial?: string): FirstTouchStorage & { store: Map<string, string>; sets: number } {
  const store = new Map<string, string>()
  if (initial !== undefined) store.set(FIRST_TOUCH_STORAGE_KEY, initial)
  let sets = 0
  return {
    store,
    get sets() {
      return sets
    },
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      sets += 1
      store.set(key, value)
    },
  }
}

describe('first touch', () => {
  it('saves the source params, path, referrer host, and timestamp once', () => {
    const storage = memoryStorage()
    const saved = captureFirstTouch({
      search: '?utm_source=newsletter&utm_medium=email&utm_campaign=launch&utm_content=hero&ref=friend',
      pathname: '/pricing',
      referrer: 'https://news.example/story',
      capturedAt,
      storage,
    })
    assert.deepEqual(saved, {
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'launch',
      utm_content: 'hero',
      ref: 'friend',
      landing_path: '/pricing',
      referrer_host: 'news.example',
      captured_at: capturedAt,
    })
    assert.equal(storage.sets, 1)
    assert.equal(storage.store.get(FIRST_TOUCH_STORAGE_KEY), JSON.stringify(saved))
  })

  it('does nothing when the url has no source param', () => {
    const storage = memoryStorage()
    assert.equal(captureFirstTouch({
      search: '?mode=signup',
      pathname: '/login',
      referrer: '',
      capturedAt,
      storage,
    }), null)
    assert.equal(storage.sets, 0)
    assert.equal(firstTouchFromLocation({
      search: '',
      pathname: '/',
      referrer: 'not a url',
      capturedAt,
    }), null)
  })

  it('keeps the first record when a later visit has different params', () => {
    const storage = memoryStorage()
    captureFirstTouch({
      search: '?utm_source=first',
      pathname: '/',
      referrer: '',
      capturedAt,
      storage,
    })
    const second = captureFirstTouch({
      search: '?utm_source=second&ref=other',
      pathname: '/pricing',
      referrer: 'https://other.example/',
      capturedAt: '2026-11-01T00:00:00.000Z',
      storage,
    })
    assert.equal(second?.utm_source, 'first')
    assert.equal(second?.landing_path, '/')
    assert.equal(storage.sets, 1)
  })

  it('caps every stored string at 100 characters', () => {
    const long = 'x'.repeat(150)
    const saved = captureFirstTouch({
      search: `?ref=${long}`,
      pathname: `/${'p'.repeat(180)}`,
      referrer: `https://${'h'.repeat(120)}.example/path`,
      capturedAt,
      storage: memoryStorage(),
    })
    assert.equal(saved?.ref?.length, 100)
    assert.equal(saved?.landing_path.length, 100)
    assert.equal(saved?.referrer_host?.length, 100)
  })

  it('does not throw or block signup when storage is unavailable', () => {
    const broken: FirstTouchStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    assert.equal(captureFirstTouch({
      search: '?utm_source=ad',
      pathname: '/',
      referrer: '',
      capturedAt,
      storage: broken,
    }), null)
    assert.deepEqual(emailSignupData('Ada', broken), { name: 'Ada' })
    assert.equal(magicLinkSignupData(broken), undefined)
    assert.deepEqual(emailSignupData('Ada', null), { name: 'Ada' })
    assert.equal(magicLinkSignupData(null), undefined)
  })

  it('adds first_touch to email signup and magic-link signup data only', () => {
    const storage = memoryStorage()
    captureFirstTouch({
      search: '?utm_source=ad',
      pathname: '/login',
      referrer: '',
      capturedAt,
      storage,
    })
    const email = emailSignupData('Ada', storage)
    const magic = magicLinkSignupData(storage)
    assert.equal(email.name, 'Ada')
    assert.equal(email.first_touch?.utm_source, 'ad')
    assert.deepEqual(magic, { first_touch: email.first_touch })
    assert.deepEqual(emailSignupData('Ada', memoryStorage()), { name: 'Ada' })
    assert.equal(magicLinkSignupData(memoryStorage()), undefined)
  })
})
