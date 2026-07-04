export const siteConfig = {
  name: 'ikui',
  url: 'https://ik-ui.pages.dev',
  ogImage: 'https://ik-ui.pages.dev/og',
  description:
    'Beautiful, sophisticated UI components designed for modern React and Tailwind CSS applications.',
  author: {
    name: 'wudi',
    url: 'https://github.com/WuChenDi',
  },
  links: {
    author: 'https://x.com/wuchendi96',
    x: 'https://x.com/wuchendi96',
    telegram: 'https://t.me/wuchendi',
    blog: 'https://wcd.pages.dev/',
    github: 'https://github.com/WuChenDi/ikui',
  },
  keywords: [
    'React',
    'Tailwind CSS',
    'Motion',
    'Landing Page',
    'Components',
    'Next.js',
  ],
}

export type SiteConfig = typeof siteConfig

/**
 * The single canonical site base URL. Prefers the per-deployment
 * `NEXT_PUBLIC_APP_URL` override (branch/preview builds) and falls back to the
 * production `siteConfig.url`. Every base-URL derivation in the app routes
 * through here so the value never drifts between callers.
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.url
}
