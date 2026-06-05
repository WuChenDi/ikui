import { Rss } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { GitHubIcon } from './icons/github'
import { TelegramIcon } from './icons/telegram'
import { XIcon } from './icons/x'
import { IkLogo } from './ik-logo'

const footerLinks = {
  Product: [
    { label: 'Docs', href: '/docs/introduction' },
    { label: 'Components', href: '/docs/components' },
    { label: 'MCP', href: '/docs/mcp' },
  ],
  Social: [
    { label: 'GitHub', href: siteConfig.links.github },
    { label: 'X (Twitter)', href: siteConfig.links.x },
    { label: 'Telegram', href: siteConfig.links.telegram },
    { label: 'Blog', href: siteConfig.links.blog },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4 md:py-16">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5">
              <IkLogo size={24} />
              <span className="font-medium">ikui</span>
            </Link>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground/75">
              Refined UI components for Design Engineers.
            </p>
            <div className="mt-auto flex items-center gap-4 pt-4">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/55 transition-colors duration-300 ease-out hover:text-primary"
                aria-label="GitHub"
              >
                <GitHubIcon className="size-5" />
              </Link>
              <Link
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/55 transition-colors duration-300 ease-out hover:text-primary"
                aria-label="X"
              >
                <XIcon className="size-4.5" />
              </Link>
              <Link
                href={siteConfig.links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/55 transition-colors duration-300 ease-out hover:text-primary"
                aria-label="Telegram"
              >
                <TelegramIcon className="size-5" />
              </Link>
              <Link
                href={siteConfig.links.blog}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/55 transition-colors duration-300 ease-out hover:text-primary"
                aria-label="Blog"
              >
                <Rss className="size-5" />
              </Link>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="flex flex-col gap-3">
              <span className="text-sm font-medium">{title}</span>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground/75 transition-colors hover:text-foreground"
                      {...(link.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 text-xs text-muted-foreground/60">
          <span>&copy; {new Date().getFullYear()} ikui</span>
        </div>
      </div>
    </footer>
  )
}
