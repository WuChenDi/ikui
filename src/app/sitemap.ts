import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'
import { allDocItems } from '@/lib/doc'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.url

  const docs = await allDocItems()
  const lastModified = new Date()

  return [
    {
      url,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${url}/docs`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...docs.map((doc) => ({
      url: `${url}/docs/${doc.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
