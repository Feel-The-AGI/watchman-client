import { expect, type Page, type TestInfo } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const IGNORED_CONSOLE = /favicon|Download the React DevTools|Failed to load resource|net::ERR_FAILED|net::ERR_ABORTED|CORS policy|Access to fetch at/i

export function trackPageHealth(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const missingAssets: string[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (IGNORED_CONSOLE.test(text)) return
    consoleErrors.push(text)
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })
  page.on('response', (response) => {
    if (response.status() !== 404) return
    let url: URL
    try {
      url = new URL(response.url())
    } catch {
      return
    }
    if (url.origin !== origin) return
    if (url.pathname === '/favicon.ico') return
    missingAssets.push(`${url.pathname}${url.search}`)
  })

  return {
    consoleErrors,
    pageErrors,
    missingAssets,
    assertHealthy() {
      expect(pageErrors, `uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([])
      expect(missingAssets, `404 assets:\n${missingAssets.join('\n')}`).toEqual([])
      expect(consoleErrors, `console errors:\n${consoleErrors.join('\n')}`).toEqual([])
    },
  }
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `page is ${overflow}px wider than the viewport`).toBeLessThanOrEqual(1)
}

export async function shot(page: Page, testInfo: TestInfo, name: string) {
  const dir = path.resolve('e2e/artifacts/screenshots')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${testInfo.project.name}-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  await testInfo.attach(name, { path: file, contentType: 'image/png' })
}

export async function navigationTiming(page: Page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const paint = performance.getEntriesByType('paint')
    return {
      ttfbMs: nav ? Math.round(nav.responseStart) : null,
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      fcpMs: Math.round(paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? 0) || null,
    }
  })
}
