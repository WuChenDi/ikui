import createMDX from '@next/mdx'
import rehypeShiki from '@shikijs/rehype'
import type { NextConfig } from 'next'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import codeImport from 'remark-code-import'
import remarkGfm from 'remark-gfm'

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
    remarkPlugins: [[codeImport, { cache: false }], remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            className: ['subheading-anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
      [
        rehypeShiki,
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

export default withMDX(nextConfig)
