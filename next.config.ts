import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_SERVER } from 'next/constants'
import { generateLlmMarkdownFiles } from './src/lib/llm'

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  allowedDevOrigins: ['ikui.a.wd.ds.cc'],
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  rewrites: async () => {
    return [
      {
        source: '/docs/:slug.md',
        destination: '/docs/:slug/md',
      },
    ]
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-code-import', { cache: false }], 'remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      [
        'rehype-autolink-headings',
        {
          behavior: 'wrap',
          properties: {
            className: ['subheading-anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
      [
        '@shikijs/rehype',
        {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          defaultColor: false,
        },
      ],
    ],
  },
})

// Emit public/docs/<id>.md before the build so the .md links resolve to plain
// static assets (clean, LLM-friendly Markdown). The existing rewrite + .md route
// are left untouched as a fallback: public static files take precedence over
// afterFiles rewrites, so the generated files win whenever they exist.
//
// Generate on build and dev, but skip `next start` — the production server only
// serves the files already emitted during the build.
export default async (phase: string) => {
  if (phase !== PHASE_PRODUCTION_SERVER) {
    await generateLlmMarkdownFiles()
  }
  return withMDX(nextConfig)
}
