import type { MetadataRoute } from 'next'
import { PUBLIC_PAGES, publicPageUrl } from '@/lib/public-site'

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({
    url: publicPageUrl(path),
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }))
}
