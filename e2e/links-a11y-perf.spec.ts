import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { navigationTiming } from './helpers'

const CRAWL_PAGES = ['/', '/pricing', '/login', '/legal/privacy', '/legal/terms']

async function internalLinks(page: Page) {
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') || ''),
  )
  const origin = new URL(page.url()).origin
  const urls = new Set<string>()
  for (const href of hrefs) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue
    const url = new URL(href, page.url())
    if (url.origin !== origin) continue
    url.hash = ''
    urls.add(url.toString())
  }
  return [...urls]
}

test.describe('links, accessibility, and performance @desktop-only', () => {
  test('internal links resolve', async ({ page, request }) => {
    const discovered = new Set<string>()
    for (const path of CRAWL_PAGES) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), path).toBeLessThan(400)
      for (const url of await internalLinks(page)) discovered.add(url)
    }

    const failures: string[] = []
    for (const url of discovered) {
      const response = await request.get(url, { maxRedirects: 5 })
      if (response.status() >= 400) failures.push(`${response.status()} ${url}`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  for (const path of ['/', '/pricing', '/login', '/legal/privacy', '/legal/terms']) {
    test(`axe ${path}`, async ({ page }, testInfo) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading').first().waitFor()
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      await testInfo.attach('axe', {
        body: JSON.stringify(results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          help: violation.help,
        })), null, 2),
        contentType: 'application/json',
      })
      const critical = results.violations.filter((violation) => violation.impact === 'critical')
      expect(critical.map((violation) => violation.id)).toEqual([])
    })
  }

  test('landing and login meet a basic load budget', async ({ page }, testInfo) => {
    for (const path of ['/', '/login']) {
      await page.goto(path, { waitUntil: 'load' })
      await expect(page.getByRole('heading').first()).toBeVisible()
      const timing = await navigationTiming(page)
      testInfo.annotations.push({ type: `perf ${path}`, description: JSON.stringify(timing) })
      expect(timing.ttfbMs ?? 99999).toBeLessThan(8_000)
      expect(timing.loadMs ?? 99999).toBeLessThan(30_000)
    }
  })
})
