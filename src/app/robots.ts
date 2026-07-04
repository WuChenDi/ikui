import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const url = getBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${url}/sitemap.xml`,
  }
}
