import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { BlockCategory } from '@/lib/blocks'
import { blockCategories } from '@/lib/blocks'

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
          <Button variant={isActive ? 'default' : 'secondary'} key={tab.slug}>
            <Link href={tab.href} aria-current={isActive ? 'page' : undefined}>
              {tab.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
