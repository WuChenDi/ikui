import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
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

// Emit public/docs/<id>.md before the build so the "View as Markdown" links
// resolve to plain static assets on Cloudflare Pages. A route handler can't do
// this: next-on-pages forces route handlers onto the Edge runtime, which has no
// filesystem to read the docs from.
export default async () => {
  await generateLlmMarkdownFiles()
  return withMDX(nextConfig)
}
