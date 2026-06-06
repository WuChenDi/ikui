import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

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

export default withMDX(nextConfig)
