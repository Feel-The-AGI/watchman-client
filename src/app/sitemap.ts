import type { MetadataRoute } from 'next'
import { PUBLIC_PAGES, guidePaths, publicPageUrl } from '@/lib/public-site'

export default function sitemap(): MetadataRoute.Sitemap {
  const core = PUBLIC_PAGES.map((path) => ({
    url: publicPageUrl(path),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.6,
  }))
  const guides = guidePaths().map((path) => ({
    url: publicPageUrl(path),
    changeFrequency: 'monthly' as const,
    priority: path === '/tools/shift-calculator' ? 0.9 : 0.7,
  }))
  return [...core, ...guides]
}
