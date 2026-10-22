import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PRIVATE_ROBOT_PATHS, PUBLIC_PAGES, PUBLIC_SITE_ORIGIN, publicPageUrl } from './public-site.ts'

describe('public site metadata', () => {
  it('lists the public pages on the production origin', () => {
    assert.equal(PUBLIC_SITE_ORIGIN, 'https://www.trywatchman.app')
    assert.deepEqual(
      PUBLIC_PAGES.map((path) => publicPageUrl(path)),
      [
        'https://www.trywatchman.app',
        'https://www.trywatchman.app/pricing',
        'https://www.trywatchman.app/login',
        'https://www.trywatchman.app/legal/privacy',
        'https://www.trywatchman.app/legal/terms',
      ],
    )
  })

  it('keeps private app routes out of the crawl', () => {
    assert.equal(PRIVATE_ROBOT_PATHS.includes('/dashboard'), true)
    assert.equal(PRIVATE_ROBOT_PATHS.includes('/settings'), true)
    assert.equal(PRIVATE_ROBOT_PATHS.includes('/api'), true)
    for (const path of PUBLIC_PAGES) {
      assert.equal(PRIVATE_ROBOT_PATHS.includes(path as typeof PRIVATE_ROBOT_PATHS[number]), false)
    }
  })
})
