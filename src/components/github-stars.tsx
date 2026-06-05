'use client'

import Link from 'next/link'
import * as React from 'react'
import { siteConfig } from '@/lib/config'
import { GitHubIcon } from './icons/github'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export function GithubStars() {
  const [stars, setStars] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch('/api/github/stars')
      .then((res) => res.json())
      .then((data: { stars: number }) => setStars(data.stars))
      .catch(() => setStars(0))
  }, [])

  const displayValue =
    stars === null
      ? null
      : stars >= 1000
        ? `${(stars / 1000).toFixed(1)}k`
        : stars

  return (
    <Button
      asChild
      variant="outline"
      className="h-8 px-3 cursor-pointer dark:bg-background dark:hover:bg-input/20 shadow-none"
    >
      <Link
        href={siteConfig.links.github}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon className="size-4" />
        {displayValue === null ? (
          <Skeleton className="h-4 w-6 rounded-sm" />
        ) : (
          <span className="tabular-nums">{displayValue}</span>
        )}
        <span className="sr-only">Open Github</span>
      </Link>
    </Button>
  )
}
