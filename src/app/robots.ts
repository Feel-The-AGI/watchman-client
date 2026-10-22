import type { MetadataRoute } from 'next'
import { PRIVATE_ROBOT_PATHS, PUBLIC_SITE_ORIGIN } from '@/lib/public-site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...PRIVATE_ROBOT_PATHS],
    },
    sitemap: `${PUBLIC_SITE_ORIGIN}/sitemap.xml`,
    host: PUBLIC_SITE_ORIGIN,
  }
}
