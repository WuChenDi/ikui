import Link from 'next/link'
import type { BlockCategory } from '@/lib/blocks'
import { blockCategories } from '@/lib/blocks'
import { cn } from '@/lib/utils'

/** Tab strip for the Blocks gallery: `All | Video | Image | Audio`. */
export function BlocksNav({ active }: { active: 'all' | BlockCategory }) {
  const tabs = [
    { slug: 'all', label: 'All', href: '/blocks' },
    ...blockCategories.map((c) => ({
      slug: c.slug,
      label: c.label,
      href: `/blocks/${c.slug}`,
    })),
  ]

  return (
    <nav className="flex flex-wrap items-center justify-start gap-2">
      {tabs.map((tab) => {
        const isActive = tab.slug === active
        return (
          <Link
            key={tab.slug}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-foreground text-background border-transparent'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
