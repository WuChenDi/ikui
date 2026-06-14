import { Blocks, BookText, Box } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { GitHubIcon } from './icons/github'
import { TelegramIcon } from './icons/telegram'
import { XIcon } from './icons/x'
import { IkLogo } from './ik-logo'

const linkColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Docs', href: '/docs/introduction', icon: BookText },
      { label: 'Components', href: '/docs/components', icon: Blocks },
      { label: 'Blocks', href: '/blocks', icon: Box },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: siteConfig.links.github, icon: GitHubIcon },
      { label: 'X (Twitter)', href: siteConfig.links.x, icon: XIcon },
      {
        label: 'Telegram',
        href: siteConfig.links.telegram,
        icon: TelegramIcon,
      },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex flex-col justify-between gap-12 py-12 md:flex-row md:py-16">
          <div className="flex max-w-sm flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <IkLogo size={28} />
              <span className="text-2xl font-semibold tracking-tight">
                ikui
              </span>
            </Link>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground/75">
              {siteConfig.description}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Base UI powered · copy &amp; paste components
            </p>
          </div>

          <div className="flex gap-12 sm:gap-16 md:gap-20">
            {linkColumns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted-foreground/60">
                  {column.title}
                </span>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => {
                    const Icon = link.icon
                    const external = link.href.startsWith('http')
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="flex items-center gap-2 text-sm text-muted-foreground/75 transition-colors hover:text-foreground"
                          {...(external
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                        >
                          <Icon className="size-4" />
                          {link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © Copyright 2026-PRESENT,{' '}
            <Link
              href="https://github.com/WuChenDi"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              wudi
            </Link>
            . All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
